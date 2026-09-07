import { STRESS_ASSUMPTIONS } from "@/data/assumptions";
import { calculateEmi } from "@/lib/engine/loanMath";

export interface IncomeStressResult {
  stressedIncome: number;
  stressedEmiCapacity: number;
  passes: boolean;
}

export function calculateIncomeStress(
  stableIncome: number,
  householdExpenses: number,
  existingEmi: number,
  proposedEmi: number,
): IncomeStressResult {
  const stressedIncome =
    stableIncome * (1 - STRESS_ASSUMPTIONS.incomeReduction);
  const stressedEmiCapacity = Math.max(
    0,
    stressedIncome - householdExpenses - existingEmi,
  );

  return {
    stressedIncome,
    stressedEmiCapacity,
    passes: proposedEmi <= stressedEmiCapacity,
  };
}

export function calculateRateStressEmi(
  principal: number,
  annualRate: number,
  tenureMonths: number,
): number {
  return calculateEmi(
    principal,
    annualRate + STRESS_ASSUMPTIONS.floatingRateIncrease,
    tenureMonths,
  );
}