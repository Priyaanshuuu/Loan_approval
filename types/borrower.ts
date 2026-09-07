export type IncomeType =
  | "salaried"
  | "self-employed"
  | "informal"
  | "business";

export type LoanPurpose =
  | "personal"
  | "business"
  | "home"
  | "vehicle"
  | "gold"
  | "lap"
  | "other";

export type ProductType =
  | "personal-loan"
  | "secured-business"
  | "loan-against-property"
  | "vehicle-loan"
  | "gold-loan"
  | "home-loan";

export type Verdict = "BORROW" | "BORROW_LESS" | "DON'T_BORROW";

export type Confidence = "LOW" | "MEDIUM" | "HIGH";

export interface NumericRange {
  min: number;
  max: number;
}

export interface BorrowerProfile {
  age: number;
  purpose: LoanPurpose;
  amountWanted: number;

  monthlyIncome: number;
  incomeType: IncomeType;
  incomeMin?: number;
  incomeMax?: number;
  incomeVolatility?: "low" | "medium" | "high";

  householdExpenses: number;
  existingEmi: number;
  existingDebtRate?: number;

  creditScore: number | null;
  employmentYears?: number;
  businessYears?: number;
  documentedAnnualIncome?: number;

  emergencySavingsMonths?: number;
  missedPaymentRecently?: boolean;
  upcomingLargeExpense?: boolean;

  collateralValue?: number;
  collateralEncumbered?: boolean;
  productiveBorrowing?: boolean;
  expectedAdditionalMonthlyIncome?: number;

  requestedProduct?: ProductType;
  lenderRateQuote?: number;
  processingFee?: number;
  otherUpfrontFees?: number;
}

export interface BorrowerResult {
  verdict: Verdict;
  lenderRange: NumericRange;
  safeRange: NumericRange;
  fairRate: NumericRange;
  estimatedApr: NumericRange;
  emiCeiling: number;
  confidence: Confidence;
  reasons: string[];
  stressTest: StressTestResult;
  recommendedProduct?: ProductType;
  validationWarnings?: string[];
}

export interface StressTestResult {
  scenario: string;
  result: string;
  passes: boolean;
}

export interface ProductAssumption {
  label: string;
  baseRate: NumericRange;
  maximumTenureMonths: number;
  secured: boolean;
}

export interface ValidationIssue {
  field: keyof BorrowerProfile | "profile";
  message: string;
}