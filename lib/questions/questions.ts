import type {
  BorrowerProfile,
  IncomeType,
  LoanPurpose,
} from "@/types/borrower";

export type QuestionId =
  | "age"
  | "purpose"
  | "amountWanted"
  | "monthlyIncome"
  | "incomeType"
  | "existingEmi"
  | "householdExpenses"
  | "creditScore"
  | "employmentYears"
  | "businessYears"
  | "incomeMin"
  | "incomeMax"
  | "documentedAnnualIncome"
  | "incomeVolatility"
  | "emergencySavingsMonths"
  | "missedPaymentRecently"
  | "existingDebtRate"
  | "collateralValue"
  | "collateralEncumbered"
  | "productiveBorrowing"
  | "expectedAdditionalMonthlyIncome"
  | "upcomingLargeExpense"
  | "lenderRateQuote"
  | "processingFee";

export type QuestionKind =
  | "number"
  | "currency"
  | "percentage"
  | "select"
  | "boolean";

export interface QuestionOption<T = string> {
  label: string;
  value: T;
}

export interface QuestionDefinition {
  id: QuestionId;
  key: keyof BorrowerProfile;
  label: string;
  helpText?: string;
  kind: QuestionKind;
  required: boolean;
  allowUnknown?: boolean;
  options?: QuestionOption[];
}

export type QuestionAnswers = Partial<BorrowerProfile>;

const MUST_QUESTIONS: QuestionDefinition[] = [
  {
    id: "amountWanted",
    key: "amountWanted",
    label: "How much do you want to borrow?",
    kind: "currency",
    required: true,
  },
  {
    id: "purpose",
    key: "purpose",
    label: "What is the loan for?",
    kind: "select",
    required: true,
    options: [
      { label: "Personal expense", value: "personal" },
      { label: "Business or working capital", value: "business" },
      { label: "Home purchase or improvement", value: "home" },
      { label: "Vehicle", value: "vehicle" },
      { label: "Gold-backed borrowing", value: "gold" },
      { label: "Loan against property", value: "lap" },
      { label: "Other", value: "other" },
    ],
  },
  {
    id: "monthlyIncome",
    key: "monthlyIncome",
    label: "What is your monthly take-home income?",
    kind: "currency",
    required: true,
  },
  {
    id: "incomeType",
    key: "incomeType",
    label: "How do you earn?",
    kind: "select",
    required: true,
    options: [
      { label: "Salaried", value: "salaried" },
      { label: "Self-employed", value: "self-employed" },
      { label: "Informal or gig work", value: "informal" },
      { label: "Business income", value: "business" },
    ],
  },
  {
    id: "existingEmi",
    key: "existingEmi",
    label: "How much do you currently pay in EMIs each month?",
    kind: "currency",
    required: true,
  },
  {
    id: "householdExpenses",
    key: "householdExpenses",
    label: "What are your monthly household expenses?",
    kind: "currency",
    required: true,
  },
  {
    id: "age",
    key: "age",
    label: "How old are you?",
    kind: "number",
    required: true,
  },
  {
    id: "creditScore",
    key: "creditScore",
    label: "Do you know your credit score?",
    helpText: "Choose unknown rather than guessing a score.",
    kind: "number",
    required: true,
    allowUnknown: true,
  },
];

const SALARIED_QUESTIONS = ([
  {
    id: "employmentYears",
    key: "employmentYears",
    label: "How long have you been with your current employer?",
    kind: "number",
    required: false,
  },
  emergencySavingsQuestion(),
  upcomingExpenseQuestion(),
  lenderQuoteQuestions(),
].flat() as QuestionDefinition[]);

const SELF_EMPLOYED_QUESTIONS = ([
  {
    id: "businessYears",
    key: "businessYears",
    label: "How long has your business operated?",
    kind: "number",
    required: false,
  },
  incomeRangeQuestion("incomeMin", "What is your low-end monthly income?"),
  incomeRangeQuestion("incomeMax", "What is your high-end monthly income?"),
  {
    id: "documentedAnnualIncome",
    key: "documentedAnnualIncome",
    label: "What annual income is shown in your ITR or other documents?",
    kind: "currency",
    required: false,
  },
  incomeVolatilityQuestion(),
  collateralQuestions(),
  productiveBorrowingQuestion(),
  expectedAdditionalIncomeQuestion(),
  emergencySavingsQuestion(),
  existingDebtQuestions(),
].flat() as QuestionDefinition[]);

const INFORMAL_QUESTIONS = ([
  incomeRangeQuestion("incomeMin", "What is your low-end monthly income?"),
  incomeRangeQuestion("incomeMax", "What is your high-end monthly income?"),
  incomeVolatilityQuestion(),
  existingDebtQuestions(),
  emergencySavingsQuestion(),
  productiveBorrowingQuestion(),
  expectedAdditionalIncomeQuestion(),
  upcomingExpenseQuestion(),
].flat() as QuestionDefinition[]);

export function getVisibleQuestions(
  answers: QuestionAnswers = {},
): QuestionDefinition[] {
  const questions = [...MUST_QUESTIONS];
  const incomeType = answers.incomeType as IncomeType | undefined;
  const purpose = answers.purpose as LoanPurpose | undefined;

  if (incomeType === "salaried") questions.push(...SALARIED_QUESTIONS);
  if (incomeType === "self-employed" || incomeType === "business") {
    questions.push(...SELF_EMPLOYED_QUESTIONS);
  }
  if (incomeType === "informal") questions.push(...INFORMAL_QUESTIONS);

  if (
    (purpose === "business" || purpose === "lap") &&
    !questions.some((question) => question.id === "collateralValue")
  ) {
    questions.push(...collateralQuestions());
  }

  if (
    purpose === "business" ||
    purpose === "vehicle"
  ) {
    if (!questions.some((question) => question.id === "productiveBorrowing")) {
      questions.push(productiveBorrowingQuestion());
      questions.push(expectedAdditionalIncomeQuestion());
    }
  }

  return deduplicateQuestions(questions);
}

function emergencySavingsQuestion(): QuestionDefinition {
  return {
    id: "emergencySavingsMonths",
    key: "emergencySavingsMonths",
    label: "How many months of essential expenses could your savings cover?",
    kind: "number",
    required: false,
    allowUnknown: true,
  };
}

function upcomingExpenseQuestion(): QuestionDefinition {
  return {
    id: "upcomingLargeExpense",
    key: "upcomingLargeExpense",
    label: "Do you expect a major expense in the next 12 months?",
    kind: "boolean",
    required: false,
  };
}

function lenderQuoteQuestions(): QuestionDefinition[] {
  return [
    {
      id: "lenderRateQuote",
      key: "lenderRateQuote",
      label: "Have you received a lender rate quote already?",
      kind: "percentage",
      required: false,
      allowUnknown: true,
    },
    {
      id: "processingFee",
      key: "processingFee",
      label: "What processing fee did the lender quote?",
      kind: "currency",
      required: false,
      allowUnknown: true,
    },
  ];
}

function incomeRangeQuestion(
  id: "incomeMin" | "incomeMax",
  label: string,
): QuestionDefinition {
  return {
    id,
    key: id,
    label,
    kind: "currency",
    required: false,
  };
}

function incomeVolatilityQuestion(): QuestionDefinition {
  return {
    id: "incomeVolatility",
    key: "incomeVolatility",
    label: "How predictable is your monthly income?",
    kind: "select",
    required: false,
    options: [
      { label: "Usually predictable", value: "low" },
      { label: "Changes somewhat", value: "medium" },
      { label: "Changes a lot", value: "high" },
    ],
  };
}

function existingDebtQuestions(): QuestionDefinition[] {
  return [
    {
      id: "existingDebtRate",
      key: "existingDebtRate",
      label: "What interest rate do your existing loans carry?",
      kind: "percentage",
      required: false,
      allowUnknown: true,
    },
    {
      id: "missedPaymentRecently",
      key: "missedPaymentRecently",
      label: "Have you missed or bounced an EMI in the last 6 months?",
      kind: "boolean",
      required: false,
    },
  ];
}

function collateralQuestions(): QuestionDefinition[] {
  return [
    {
      id: "collateralValue",
      key: "collateralValue",
      label: "What is the approximate value of the property or collateral?",
      kind: "currency",
      required: false,
    },
    {
      id: "collateralEncumbered",
      key: "collateralEncumbered",
      label: "Is the collateral already pledged or encumbered?",
      kind: "boolean",
      required: false,
    },
  ];
}

function productiveBorrowingQuestion(): QuestionDefinition {
  return {
    id: "productiveBorrowing",
    key: "productiveBorrowing",
    label: "Could this borrowing directly increase your income?",
    kind: "boolean",
    required: false,
  };
}

function expectedAdditionalIncomeQuestion(): QuestionDefinition {
  return {
    id: "expectedAdditionalMonthlyIncome",
    key: "expectedAdditionalMonthlyIncome",
    label: "How much additional monthly income do you expect?",
    kind: "currency",
    required: false,
  };
}

function deduplicateQuestions(
  questions: QuestionDefinition[],
): QuestionDefinition[] {
  return questions.filter(
    (question, index) =>
      questions.findIndex((candidate) => candidate.id === question.id) === index,
  );
}