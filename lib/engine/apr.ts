import { calculateEmi } from "@/lib/engine/loanMath";

export interface AprInputs {
  loanAmount: number;
  annualRate: number;
  tenureMonths: number;
  upfrontFees: number;
}

export function calculateEstimatedApr(inputs: AprInputs): number {
  const { loanAmount, annualRate, tenureMonths, upfrontFees } = inputs;

  if (loanAmount <= 0 || !Number.isFinite(loanAmount)) {
    throw new Error("Loan amount must be a positive finite number.");
  }

  if (upfrontFees < 0 || !Number.isFinite(upfrontFees)) {
    throw new Error("Upfront fees must be a finite, non-negative number.");
  }

  const netProceeds = loanAmount - upfrontFees;

  if (netProceeds <= 0) {
    throw new Error("Upfront fees must be lower than the loan amount.");
  }

  const emi = calculateEmi(loanAmount, annualRate, tenureMonths);
  let lowerRate = 0;
  let upperRate = 1;

  for (let iteration = 0; iteration < 80; iteration += 1) {
    const candidateRate = (lowerRate + upperRate) / 2;
    const candidatePresentValue = presentValueOfPayments(
      emi,
      candidateRate,
      tenureMonths,
    );

    if (candidatePresentValue > netProceeds) {
      lowerRate = candidateRate;
    } else {
      upperRate = candidateRate;
    }
  }

  const estimatedApr = ((lowerRate + upperRate) / 2) * 100;
  return Number.isFinite(estimatedApr) ? estimatedApr : annualRate * 100;

  function presentValueOfPayments(
    payment: number,
    monthlyRate: number,
    months: number,
  ): number {
    if (monthlyRate === 0) {
      return payment * months;
    }

    const periodicRate = monthlyRate / 12;
    return (
      (payment * (1 - Math.pow(1 + periodicRate, -months))) / periodicRate
    );
  }
}

export function calculateEstimatedAprRange(
  inputs: Omit<AprInputs, "annualRate"> & { annualRate: { min: number; max: number } },
): { min: number; max: number } {
  return {
    min: calculateEstimatedApr({ ...inputs, annualRate: inputs.annualRate.min }),
    max: calculateEstimatedApr({ ...inputs, annualRate: inputs.annualRate.max }),
  };
}