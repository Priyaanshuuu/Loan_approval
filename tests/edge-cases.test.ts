import { describe, expect, it } from "vitest";
import { evaluateBorrower } from "@/lib/engine/evaluate";

const baseProfile = {
  age: 40,
  purpose: "personal" as const,
  amountWanted: 100_000,
  monthlyIncome: 50_000,
  incomeType: "salaried" as const,
  householdExpenses: 15_000,
  existingEmi: 5_000,
  creditScore: null,
};

describe("evaluator edge cases", () => {
  it("keeps unknown credit separate and widens the rate range", () => {
    const result = evaluateBorrower(baseProfile);

    expect(result.fairRate.min).toBeLessThan(0.11);
    expect(result.fairRate.max).toBeGreaterThan(0.18);
    expect(result.confidence).toBe("LOW");
  });

  it("returns no safe EMI when income is zero", () => {
    const result = evaluateBorrower({
      ...baseProfile,
      monthlyIncome: 0,
      householdExpenses: 0,
    });

    expect(result.verdict).toBe("DON'T_BORROW");
    expect(result.emiCeiling).toBe(0);
    expect(result.validationWarnings).toContain(
      "No stable income was available for affordability modeling.",
    );
  });

  it("rejects invalid borrower inputs", () => {
    expect(() =>
      evaluateBorrower({
        ...baseProfile,
        age: 17,
        amountWanted: -1,
      }),
    ).toThrow("Age must be between 18 and 80.");
  });

  it("flags recent repayment stress even when borrowing is productive", () => {
    const result = evaluateBorrower({
      ...baseProfile,
      purpose: "vehicle",
      incomeType: "informal",
      incomeVolatility: "high",
      existingEmi: 15_000,
      emergencySavingsMonths: 0,
      missedPaymentRecently: true,
      productiveBorrowing: true,
    });

    expect(result.verdict).toBe("DON'T_BORROW");
    expect(result.reasons).toContain(
      "recent repayment distress reduces the safe EMI ceiling",
    );
  });
});