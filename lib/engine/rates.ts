import {
  CREDIT_SCORE_ASSUMPTIONS,
  EMERGENCY_BUFFER_ASSUMPTIONS,
  PRODUCT_ASSUMPTIONS,
  REPAYMENT_RISK_ASSUMPTIONS,
} from "@/data/assumptions";
import type {
  BorrowerProfile,
  NumericRange,
  ProductType,
} from "@/types/borrower";

export interface RateAssessment {
  product: ProductType;
  rate: NumericRange;
  reasons: string[];
}

export function calculateFairRate(
  profile: BorrowerProfile,
  product: ProductType,
): RateAssessment {
  const productAssumption = PRODUCT_ASSUMPTIONS[product];
  let minRate = productAssumption.baseRate.min;
  let maxRate = productAssumption.baseRate.max;
  const reasons = [productAssumption.label];

  if (profile.creditScore === null) {
    minRate -= CREDIT_SCORE_ASSUMPTIONS.unknownRateWidening;
    maxRate += CREDIT_SCORE_ASSUMPTIONS.unknownRateWidening;
    reasons.push("credit score unknown");
  } else if (profile.creditScore >= CREDIT_SCORE_ASSUMPTIONS.excellentMinimum) {
    minRate -= 0.01;
    maxRate -= 0.01;
    reasons.push("excellent credit score");
  } else if (profile.creditScore >= CREDIT_SCORE_ASSUMPTIONS.strongMinimum) {
    minRate -= 0.005;
    maxRate -= 0.005;
    reasons.push("strong credit score");
  } else if (profile.creditScore >= CREDIT_SCORE_ASSUMPTIONS.moderateMinimum) {
    reasons.push("moderate credit score");
  } else if (profile.creditScore >= CREDIT_SCORE_ASSUMPTIONS.weakMinimum) {
    minRate += 0.01;
    maxRate += 0.01;
    reasons.push("weak credit score");
  } else {
    minRate += 0.02;
    maxRate += 0.02;
    reasons.push("high-risk credit score");
  }

  if (
    profile.incomeType === "salaried" &&
    (profile.employmentYears ?? 0) >= 3
  ) {
    minRate -= 0.005;
    maxRate -= 0.005;
    reasons.push("stable salaried income");
  }

  if (
    (profile.incomeType === "self-employed" ||
      profile.incomeType === "business") &&
    (profile.businessYears ?? 0) >= 10
  ) {
    minRate -= 0.005;
    maxRate -= 0.005;
    reasons.push("long business history");
  }

  if (profile.incomeVolatility === "high") {
    minRate += 0.01;
    maxRate += 0.01;
    reasons.push("high income volatility");
  }

  if (profile.missedPaymentRecently) {
    minRate += REPAYMENT_RISK_ASSUMPTIONS.recentBounceRateAdjustment;
    maxRate += REPAYMENT_RISK_ASSUMPTIONS.recentBounceRateAdjustment;
    reasons.push("recent repayment problem");
  }

  if (
    profile.emergencySavingsMonths !== undefined &&
    profile.emergencySavingsMonths < EMERGENCY_BUFFER_ASSUMPTIONS.thinMonths
  ) {
    minRate += 0.005;
    maxRate += 0.005;
    reasons.push("thin emergency savings");
  }

  return {
    product,
    rate: {
      min: Math.max(0.01, minRate),
      max: Math.max(0.01, maxRate),
    },
    reasons,
  };
}