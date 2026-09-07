import { describe, expect, it } from "vitest";
import { evaluateBorrower } from "@/lib/engine/evaluate";

describe("Priya walkthrough", () => {
  it("models a strong salaried borrower with a bounded recommendation", () => {
    const result = evaluateBorrower({
      age: 29,
      purpose: "personal",
      amountWanted: 800_000,
      monthlyIncome: 110_000,
      incomeType: "salaried",
      householdExpenses: 28_000,
      existingEmi: 14_000,
      creditScore: 780,
      employmentYears: 5,
      emergencySavingsMonths: 4,
    });

    expect(result.verdict).toBe("BORROW");
    expect(result.confidence).toBe("MEDIUM");
    expect(result.recommendedProduct).toBe("personal-loan");
    expect(result.fairRate.min).toBeLessThan(result.fairRate.max);
    expect(result.emiCeiling).toBeGreaterThan(0);
    expect(result.reasons).toEqual(
      expect.arrayContaining(["excellent credit score", "stable salaried income"]),
    );
  });
});