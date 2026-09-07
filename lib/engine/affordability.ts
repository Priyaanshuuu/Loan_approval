import {
  AFFORDABILITY_ASSUMPTIONS,
  EMERGENCY_BUFFER_ASSUMPTIONS,
  INCOME_ASSUMPTIONS,
  REPAYMENT_RISK_ASSUMPTIONS,
} from "@/data/assumptions";
import type { BorrowerProfile } from "@/types/borrower";

export interface StableIncomeResult {
  stableIncome: number;
  incomeFloor: number;
  incomeCeiling?: number;
  documentedIncome?: number;
}

export interface AffordabilityResult {
  totalDebtCapacity: number;
  newEmiCapacity: number;
  cashFlowEmiCapacity: number;
  requiredBuffer: number;
  emiCeiling: number;
}

export function normalizeStableIncome(
  profile: Pick<
    BorrowerProfile,
    | "monthlyIncome"
    | "incomeType"
    | "incomeMin"
    | "incomeMax"
    | "incomeVolatility"
    | "documentedAnnualIncome"
  >,
): StableIncomeResult {
  const incomeFloor = Math.max(0, profile.incomeMin ?? profile.monthlyIncome);
  const incomeCeiling = profile.incomeMax;
  const documentedIncome = profile.documentedAnnualIncome
    ? Math.max(0, profile.documentedAnnualIncome / 12)
    : undefined;

  let stableIncome = incomeFloor;

  if (profile.incomeType === "salaried") {
    stableIncome = Math.max(0, profile.monthlyIncome);
  }

  if (
    (profile.incomeType === "self-employed" ||
      profile.incomeType === "business") &&
    documentedIncome !== undefined
  ) {
    stableIncome = Math.min(stableIncome, documentedIncome);
  }

  if (
    profile.incomeType === "informal" &&
    profile.incomeVolatility === "high"
  ) {
    stableIncome *= INCOME_ASSUMPTIONS.informalVolatilityHaircut;
  }

  return {
    stableIncome,
    incomeFloor,
    incomeCeiling,
    documentedIncome,
  };
}

export function calculateRequiredBuffer(stableIncome: number): number {
  return Math.max(
    stableIncome * AFFORDABILITY_ASSUMPTIONS.minimumBufferRatio,
    AFFORDABILITY_ASSUMPTIONS.minimumAbsoluteBuffer,
  );
}

export function calculateAffordability(
  profile: Pick<
    BorrowerProfile,
    | "householdExpenses"
    | "existingEmi"
    | "emergencySavingsMonths"
    | "missedPaymentRecently"
    | "incomeVolatility"
  >,
  stableIncome: number,
): AffordabilityResult {
  const totalDebtCapacity = Math.max(
    0,
    stableIncome * AFFORDABILITY_ASSUMPTIONS.baseDebtServiceRatio,
  );
  const newEmiCapacity = Math.max(0, totalDebtCapacity - profile.existingEmi);
  const requiredBuffer = calculateRequiredBuffer(stableIncome);
  const cashFlowEmiCapacity = Math.max(
    0,
    stableIncome -
      profile.householdExpenses -
      profile.existingEmi -
      requiredBuffer,
  );

  let riskMultiplier = 1;

  if (
    profile.emergencySavingsMonths !== undefined &&
    profile.emergencySavingsMonths <
      EMERGENCY_BUFFER_ASSUMPTIONS.veryThinMonths
  ) {
    riskMultiplier *= EMERGENCY_BUFFER_ASSUMPTIONS.veryThinEmiMultiplier;
  } else if (
    profile.emergencySavingsMonths !== undefined &&
    profile.emergencySavingsMonths < EMERGENCY_BUFFER_ASSUMPTIONS.thinMonths
  ) {
    riskMultiplier *= EMERGENCY_BUFFER_ASSUMPTIONS.thinEmiMultiplier;
  }

  if (profile.missedPaymentRecently) {
    riskMultiplier *= REPAYMENT_RISK_ASSUMPTIONS.recentBounceEmiMultiplier;
  }

  if (profile.incomeVolatility === "high") {
    riskMultiplier *= EMERGENCY_BUFFER_ASSUMPTIONS.veryThinEmiMultiplier;
  }

  const emiCeiling = Math.max(
    0,
    Math.min(newEmiCapacity, cashFlowEmiCapacity) * riskMultiplier,
  );

  return {
    totalDebtCapacity,
    newEmiCapacity,
    cashFlowEmiCapacity,
    requiredBuffer,
    emiCeiling,
  };
}

export function roundEmi(emi: number, increment = 1_000): number {
  if (increment <= 0) {
    throw new Error("EMI rounding increment must be greater than zero.");
  }

  return Math.floor(Math.max(0, emi) / increment) * increment;
}