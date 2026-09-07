import type { ProductAssumption, ProductType } from "@/types/borrower";

export const AFFORDABILITY_ASSUMPTIONS = {
  baseDebtServiceRatio: 0.35,
  upperCautionDebtServiceRatio: 0.45,
  criticalDebtServiceRatio: 0.5,
  minimumBufferRatio: 0.1,
  minimumAbsoluteBuffer: 5_000,
} as const;

export const INCOME_ASSUMPTIONS = {
  informalVolatilityHaircut: 0.9,
  productiveIncomeRecognition: 0.5,
  incomeStressFactor: 0.8,
} as const;

export const EMERGENCY_BUFFER_ASSUMPTIONS = {
  veryThinMonths: 1,
  thinMonths: 3,
  veryThinEmiMultiplier: 0.9,
  thinEmiMultiplier: 0.95,
  healthyEmiMultiplier: 1,
} as const;

export const REPAYMENT_RISK_ASSUMPTIONS = {
  recentBounceEmiMultiplier: 0.9,
  recentBounceRateAdjustment: 0.02,
  highCostDebtRate: 0.3,
} as const;

export const CREDIT_SCORE_ASSUMPTIONS = {
  minimum: 300,
  maximum: 900,
  excellentMinimum: 780,
  strongMinimum: 750,
  moderateMinimum: 700,
  weakMinimum: 650,
  unknownRateWidening: 0.02,
} as const;

export const COLLATERAL_ASSUMPTIONS = {
  maximumLoanToValue: 0.6,
} as const;

export const ELIGIBILITY_ASSUMPTIONS = {
  lenderRangeFloorRatio: 0.75,
} as const;

export const STRESS_ASSUMPTIONS = {
  incomeReduction: 0.2,
  floatingRateIncrease: 0.02,
} as const;

export const VALIDATION_ASSUMPTIONS = {
  minimumBorrowerAge: 18,
  maximumBorrowerAge: 80,
} as const;

export const PRODUCT_ASSUMPTIONS: Record<ProductType, ProductAssumption> = {
  "personal-loan": {
    label: "Personal loan",
    baseRate: { min: 0.11, max: 0.18 },
    maximumTenureMonths: 60,
    secured: false,
  },
  "secured-business": {
    label: "Secured business loan",
    baseRate: { min: 0.09, max: 0.14 },
    maximumTenureMonths: 120,
    secured: true,
  },
  "loan-against-property": {
    label: "Loan against property",
    baseRate: { min: 0.09, max: 0.14 },
    maximumTenureMonths: 180,
    secured: true,
  },
  "vehicle-loan": {
    label: "Vehicle loan",
    baseRate: { min: 0.09, max: 0.18 },
    maximumTenureMonths: 84,
    secured: true,
  },
  "gold-loan": {
    label: "Gold loan",
    baseRate: { min: 0.09, max: 0.2 },
    maximumTenureMonths: 36,
    secured: true,
  },
  "home-loan": {
    label: "Home loan",
    baseRate: { min: 0.075, max: 0.1 },
    maximumTenureMonths: 240,
    secured: true,
  },
};

export const DEFAULT_ASSUMPTIONS = {
  processingFeeRate: 0.02,
  rateRoundingIncrement: 0.005,
  emiRoundingIncrement: 1_000,
} as const;