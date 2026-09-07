import {
  DEFAULT_ASSUMPTIONS,
  PRODUCT_ASSUMPTIONS,
  REPAYMENT_RISK_ASSUMPTIONS,
  VALIDATION_ASSUMPTIONS,
} from "@/data/assumptions";
import {
  calculateAffordability,
  normalizeStableIncome,
  roundEmi,
} from "@/lib/engine/affordability";
import { calculateEstimatedAprRange } from "@/lib/engine/apr";
import { estimateLenderRange } from "@/lib/engine/eligibility";
import { calculatePrincipalFromEmi } from "@/lib/engine/loanMath";
import { routeProduct } from "@/lib/engine/products";
import { calculateFairRate } from "@/lib/engine/rates";
import { calculateIncomeStress } from "@/lib/engine/stressTest";
import type {
  BorrowerProfile,
  BorrowerResult,
  Confidence,
  NumericRange,
  ValidationIssue,
} from "@/types/borrower";

export function evaluateBorrower(profile: BorrowerProfile): BorrowerResult {
  const issues = validateProfile(profile);

  if (issues.length > 0) {
    throw new Error(issues.map((issue) => issue.message).join(" "));
  }

  const routing = routeProduct(profile);
  const rates = calculateFairRate(profile, routing.product);
  const income = normalizeStableIncome(profile);
  const affordability = calculateAffordability(profile, income.stableIncome);
  const lender = estimateLenderRange(
    profile,
    affordability,
    rates,
    routing.product,
  );
  const product = PRODUCT_ASSUMPTIONS[routing.product];
  const safeMaximum = calculatePrincipalFromEmi(
    affordability.emiCeiling,
    rates.rate.max,
    product.maximumTenureMonths,
  );
  const safeRange: NumericRange = {
    min: 0,
    max: Math.max(0, safeMaximum),
  };
  const amountForApr = profile.amountWanted;
  const upfrontFees =
    (profile.processingFee ??
      amountForApr * DEFAULT_ASSUMPTIONS.processingFeeRate) +
    (profile.otherUpfrontFees ?? 0);
  const aprPercentRange = calculateEstimatedAprRange({
    loanAmount: amountForApr,
    annualRate: rates.rate,
    tenureMonths: product.maximumTenureMonths,
    upfrontFees,
  });
  const estimatedApr: NumericRange = {
    min: aprPercentRange.min / 100,
    max: aprPercentRange.max / 100,
  };
  const recommendedAmount = Math.min(profile.amountWanted, safeRange.max);
  const recommendedEmi =
    recommendedAmount > 0
      ? roundEmi(
          calculatePrincipalForEmiAmount(
            recommendedAmount,
            rates.rate.max,
            product.maximumTenureMonths,
          ),
        )
      : 0;
  const stress = calculateIncomeStress(
    income.stableIncome,
    profile.householdExpenses,
    profile.existingEmi,
    recommendedEmi,
  );
  const confidence = calculateConfidence(profile, income.stableIncome);
  const reasons = [
    ...routing.reasons,
    ...rates.reasons,
    ...lender.constraints,
  ];

  if (income.documentedIncome !== undefined) {
    reasons.push("documented income was considered separately from reported cash flow");
  }

  if (profile.missedPaymentRecently) {
    reasons.push("recent repayment distress reduces the safe EMI ceiling");
  }

  if (profile.existingDebtRate !== undefined && profile.existingDebtRate >= REPAYMENT_RISK_ASSUMPTIONS.highCostDebtRate) {
    reasons.push("existing high-cost debt is a reason to avoid adding expensive borrowing");
  }

  if (profile.creditScore === null) {
    reasons.push("credit score unknown; rate and lender ranges remain wider");
  }

  return {
    verdict: determineVerdict(profile, safeRange.max, affordability.emiCeiling),
    lenderRange: lender.lenderRange,
    safeRange,
    fairRate: rates.rate,
    estimatedApr,
    emiCeiling: roundEmi(
      affordability.emiCeiling,
      DEFAULT_ASSUMPTIONS.emiRoundingIncrement,
    ),
    confidence,
    reasons: uniqueReasons(reasons),
    stressTest: {
      scenario: "Monthly income falls by 20%",
      result: stress.passes
        ? `The recommended EMI of ₹${recommendedEmi.toLocaleString("en-IN")} remains within stressed capacity.`
        : "The recommended EMI would not remain affordable after a 20% income fall.",
      passes: stress.passes,
    },
    recommendedProduct: routing.product,
    validationWarnings: collectWarnings(profile, income.stableIncome),
  };
}

function calculatePrincipalForEmiAmount(
  principal: number,
  annualRate: number,
  tenureMonths: number,
): number {
  const monthlyRate = annualRate / 12;

  if (monthlyRate === 0) {
    return principal / tenureMonths;
  }

  return (
    (principal * monthlyRate) /
    (1 - Math.pow(1 + monthlyRate, -tenureMonths))
  );
}

function determineVerdict(
  profile: BorrowerProfile,
  safeMaximum: number,
  emiCeiling: number,
): BorrowerResult["verdict"] {
  const debtRatio =
    profile.monthlyIncome > 0
      ? profile.existingEmi / profile.monthlyIncome
      : 1;
  const severeRisk =
    profile.missedPaymentRecently &&
    (profile.emergencySavingsMonths ?? 0) < 1;
  const highCostDebt =
    profile.existingDebtRate !== undefined &&
    profile.existingDebtRate >= REPAYMENT_RISK_ASSUMPTIONS.highCostDebtRate;

  if (emiCeiling <= 0 || debtRatio >= 0.5 || severeRisk || highCostDebt) {
    return "DON'T_BORROW";
  }

  if (profile.amountWanted > safeMaximum) {
    return "BORROW_LESS";
  }

  return "BORROW";
}

function calculateConfidence(
  profile: BorrowerProfile,
  stableIncome: number,
): Confidence {
  let score = 3;

  if (profile.creditScore === null) score -= 1;
  if (profile.incomeType === "informal" || profile.incomeVolatility === "high") {
    score -= 1;
  }
  if (profile.existingDebtRate === undefined) score -= 1;
  if (profile.emergencySavingsMonths === undefined) score -= 1;
  if (stableIncome <= 0) score = 0;

  if (score <= 1) return "LOW";
  if (score === 2) return "MEDIUM";
  return "HIGH";
}

function validateProfile(profile: BorrowerProfile): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const addIssue = (field: ValidationIssue["field"], message: string) => {
    issues.push({ field, message });
  };

  if (
    profile.age < VALIDATION_ASSUMPTIONS.minimumBorrowerAge ||
    profile.age > VALIDATION_ASSUMPTIONS.maximumBorrowerAge
  ) {
    addIssue("age", "Age must be between 18 and 80.");
  }
  if (profile.amountWanted <= 0) addIssue("amountWanted", "Loan amount must be greater than zero.");
  if (profile.monthlyIncome < 0) addIssue("monthlyIncome", "Monthly income cannot be negative.");
  if (profile.householdExpenses < 0) addIssue("householdExpenses", "Household expenses cannot be negative.");
  if (profile.existingEmi < 0) addIssue("existingEmi", "Existing EMI cannot be negative.");
  if (
    profile.creditScore !== null &&
    (profile.creditScore < 300 || profile.creditScore > 900)
  ) {
    addIssue("creditScore", "Credit score must be between 300 and 900.");
  }

  return issues;
}

function collectWarnings(
  profile: BorrowerProfile,
  stableIncome: number,
): string[] {
  const warnings: string[] = [];

  if (
    profile.documentedAnnualIncome !== undefined &&
    Math.abs(profile.monthlyIncome * 12 - profile.documentedAnnualIncome) >
      profile.monthlyIncome * 12 * 0.5
  ) {
    warnings.push("Reported monthly income and documented annual income differ materially.");
  }
  if (stableIncome === 0) {
    warnings.push("No stable income was available for affordability modeling.");
  }

  return warnings;
}

function uniqueReasons(reasons: string[]): string[] {
  return [...new Set(reasons)];
}