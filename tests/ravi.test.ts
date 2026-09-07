import { describe, expect, it } from "vitest";
import { evaluateBorrower } from "@/lib/engine/evaluate";

describe("Ravi walkthrough", () => {
  it("routes variable self-employed business borrowing through secured business lending", () => {
    const result = evaluateBorrower({
      age: 42,
      purpose: "business",
      amountWanted: 1_500_000,
      monthlyIncome: 80_000,
      incomeType: "self-employed",
      incomeMin: 40_000,
      incomeMax: 80_000,
      incomeVolatility: "medium",
      householdExpenses: 18_000,
      existingEmi: 0,
      creditScore: null,
      businessYears: 14,
      documentedAnnualIncome: 420_000,
      collateralValue: 4_500_000,
      collateralEncumbered: false,
      productiveBorrowing: true,
    });

    expect(result.verdict).toBe("BORROW_LESS");
    expect(result.recommendedProduct).toBe("secured-business");
    expect(result.lenderRange.max).toBeLessThanOrEqual(2_700_000);
    expect(result.confidence).toBe("LOW");
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "credit score unknown",
        "documented income was considered separately from reported cash flow",
      ]),
    );
  });
});