import { describe, expect, it } from "vitest";
import { getVisibleQuestions } from "@/lib/questions/questions";

function questionIds(
  answers: Parameters<typeof getVisibleQuestions>[0] = {},
) {
  return getVisibleQuestions(answers).map((question) => question.id);
}

describe("adaptive questionnaire", () => {
  it("always includes the required borrower questions", () => {
    const ids = questionIds();

    expect(ids).toEqual(
      expect.arrayContaining([
        "age",
        "purpose",
        "amountWanted",
        "monthlyIncome",
        "incomeType",
        "existingEmi",
        "householdExpenses",
        "creditScore",
      ]),
    );
  });

  it("routes salaried borrowers to employment, buffer, and quote questions", () => {
    const ids = questionIds({ incomeType: "salaried" });

    expect(ids).toEqual(
      expect.arrayContaining([
        "employmentYears",
        "emergencySavingsMonths",
        "upcomingLargeExpense",
        "lenderRateQuote",
        "processingFee",
      ]),
    );
  });

  it("routes Ravi-like borrowers to documented income and collateral questions", () => {
    const ids = questionIds({
      incomeType: "self-employed",
      purpose: "business",
    });

    expect(ids).toEqual(
      expect.arrayContaining([
        "businessYears",
        "incomeMin",
        "incomeMax",
        "documentedAnnualIncome",
        "collateralValue",
        "collateralEncumbered",
        "productiveBorrowing",
        "expectedAdditionalMonthlyIncome",
      ]),
    );
  });

  it("routes Anita-like borrowers to debt-stress and productive-use questions", () => {
    const ids = questionIds({ incomeType: "informal", purpose: "vehicle" });

    expect(ids).toEqual(
      expect.arrayContaining([
        "incomeVolatility",
        "existingDebtRate",
        "missedPaymentRecently",
        "emergencySavingsMonths",
        "productiveBorrowing",
        "expectedAdditionalMonthlyIncome",
      ]),
    );
  });

  it("keeps question IDs unique when multiple routes request the same follow-up", () => {
    const ids = questionIds({ incomeType: "self-employed", purpose: "business" });

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("marks credit score as unknown-capable instead of requiring a guessed score", () => {
    const creditQuestion = getVisibleQuestions().find(
      (question) => question.id === "creditScore",
    );

    expect(creditQuestion?.allowUnknown).toBe(true);
  });
});