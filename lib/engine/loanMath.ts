export function calculateEmi(
  principal: number,
  annualRate: number,
  tenureMonths: number,
): number {
  validateLoanInputs(principal, annualRate, tenureMonths);

  if (annualRate === 0) {
    return principal / tenureMonths;
  }

  const monthlyRate = annualRate / 12;
  const discountFactor = Math.pow(1 + monthlyRate, -tenureMonths);

  return (principal * monthlyRate) / (1 - discountFactor);
}

export function calculatePrincipalFromEmi(
  emi: number,
  annualRate: number,
  tenureMonths: number,
): number {
  validateLoanInputs(emi, annualRate, tenureMonths);

  if (annualRate === 0) {
    return emi * tenureMonths;
  }

  const monthlyRate = annualRate / 12;
  const discountFactor = Math.pow(1 + monthlyRate, -tenureMonths);

  return (emi * (1 - discountFactor)) / monthlyRate;
}

function validateLoanInputs(
  amount: number,
  annualRate: number,
  tenureMonths: number,
): void {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Loan amount must be a finite, non-negative number.");
  }

  if (!Number.isFinite(annualRate) || annualRate < 0) {
    throw new Error("Annual interest rate must be a finite, non-negative number.");
  }

  if (!Number.isInteger(tenureMonths) || tenureMonths <= 0) {
    throw new Error("Tenure must be a positive whole number of months.");
  }
}