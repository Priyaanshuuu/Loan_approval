import { describe, expect, it } from "vitest";
import { evaluateBorrower } from "@/lib/engine/evaluate";

describe("Anita walkthrough", () => {
  it("does not add new debt when existing repayment stress is severe", () => {
    const result = evaluateBorrower({
      age: 35,
      purpose: "vehicle",
      amountWanted: 150_000,
      monthlyIncome: 30_000,
      incomeType: "informal",
      incomeMin: 26_000,
      incomeMax: 30_000,
      incomeVolatility: "high",
      householdExpenses: 18_000,
      existingEmi: 9_000,
      existingDebtRate: 0.3,
      creditScore: null,
      emergencySavingsMonths: 0,
      missedPaymentRecently: true,
      productiveBorrowing: true,
    });

    expect(result.verdict).toBe("DON'T_BORROW");
    expect(result.emiCeiling).toBe(0);
    expect(result.confidence).toBe("LOW");
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "recent repayment problem",
        "existing high-cost debt is a reason to avoid adding expensive borrowing",
      ]),
    );
  });
});