# Borrower Copilot

A borrower-first loan self-assessment tool for Indian borrowers.

The product answers four questions before a borrower walks into a lender:

1. **Should I borrow?**
2. **How much might a lender sanction vs how much can I safely carry?**
3. **What interest-rate range is fair for my profile?**
4. **What monthly EMI should I agree to?**

It then turns the result into a **Negotiation Card** that the borrower can use when comparing lender offers.

> **Important:** This is a decision-support prototype, not a lender, credit bureau, financial adviser, or loan approval system. It does not guarantee approval, pricing, or eligibility.

## Current implementation

The current v1 prototype includes:

- A borrower-first landing page at `/`.
- An adaptive, one-question-at-a-time assessment at `/assessment`.
- Deterministic evaluation through `evaluateBorrower(profile)`.
- Results at `/results` with verdict, lender range, safe range, fair-rate band, estimated all-in APR, EMI ceiling, stress result, reasons, and tenure trade-offs.
- A print-friendly Negotiation Card at `/negotiation-card`.
- Browser-session-only profile handoff using `sessionStorage`; no backend or persistent personal-data storage.
- Vitest coverage for the three borrower walkthroughs, questionnaire routing, and engine edge cases.

The application currently uses the documented prototype assumptions in [RULES.md](RULES.md). Rate bands and LTV values are illustrative assumptions and must be replaced or verified with current lender/product data before production use.

The runnable implementation is in the repository root. The recommended structure below is a design guide; the actual route and module names are authoritative.

## Project decisions

- [Why this approach and tech stack](approach-and-tech-stack/README.md)
- [Tradeoffs](tradeoffs/README.md)

---

## Product philosophy

Most loan journeys are lender-centric: the lender tells the borrower how much they can borrow.

Borrower Copilot reverses that:

```text
Borrower inputs
      ↓
Adaptive questions
      ↓
Deterministic rules engine
      ↓
Affordability + likely lender range + risk + rate band
      ↓
4 outputs
      ↓
Negotiation Card
```

The central distinction is:

```text
What a lender may offer
        ≠
What the borrower should safely accept
```

The app should prefer **ranges and honest uncertainty** over false precision.

---

## What the app does

### O1 — Borrow / Borrow Less / Don't Borrow

The result is one of:

- **BORROW** — the requested borrowing is within the modeled safe range.
- **BORROW LESS** — the request may be financeable, but the requested amount is above the modeled safe amount.
- **DON'T BORROW** — current cash flow, debt burden, recent repayment problems, or lack of buffer make new borrowing inappropriate under the prototype rules.

Every verdict must have a plain-language reason.

### O2 — Two maximums

The result shows:

- **Likely lender range** — a rough modeled range of what a lender might consider based on income, product, documented income, credit and collateral.
- **Safe borrower range** — the amount the borrower can carry under the app's affordability rules.

The app should recommend that the borrower negotiate around the **safe borrower range**, not the lender maximum.

### O3 — Fair rate band + all-in cost

The app gives a **range**, not a single rate.

Example:

```text
Fair rate: 11.0% – 12.5%

Estimated all-in APR: 12.0% – 13.5%
```

The all-in figure is intended to expose the effect of upfront fees such as processing charges.

The app should label this as an **estimate** and should not claim to reproduce a lender's legally binding APR/KFS calculation unless it actually has all required inputs.

### O4 — EMI ceiling + trade-off + stress case

The app gives a monthly ceiling:

```text
Do not agree to an EMI above ₹22,000
without reducing the loan amount or reviewing the plan.
```

It also shows the tenure trade-off:

```text
Shorter tenure → higher EMI → lower total interest
Longer tenure  → lower EMI → higher total interest
```

A simple stress case is shown, for example:

- income falls by 20%, or
- interest rate rises by 2 percentage points.

---

## Adaptive questionnaire

There are two layers of questions.

### Must questions

These are enough to generate a result, although confidence may be low.

Recommended minimum:

1. Age
2. Loan purpose
3. Loan/product type
4. Amount wanted
5. Net monthly income
6. Income type
7. Existing monthly EMI
8. Household monthly expenses
9. Credit score (or "I don't know")

### Additional questions

Only ask questions that can change an output.

Examples:

- employment/business history
- income stability
- variable-income share
- ITR / documented income
- existing-loan details
- recent missed/bounced payments
- credit-card utilisation
- emergency savings
- collateral value and whether it is encumbered
- co-applicant
- expected income from a productive asset
- upcoming large expenses
- lender quote already received

### Unknown is not zero

For example:

```ts
creditScore: null
```

means "unknown".

It must never silently become 0, 300, or another guessed score.

Unknown inputs should widen the relevant range and lower confidence.

---

## Borrower-specific routing

The same questionnaire should not be shown to everybody.

### Priya — salaried + personal loan

Relevant follow-ups:

- employer tenure
- employment stability
- emergency savings
- upcoming large expenses
- lender quote / processing fee

### Ravi — self-employed + business purpose + property

Relevant follow-ups:

- business vintage
- average and low-end monthly income
- ITR income
- property value
- whether property is encumbered
- whether the funding is productive
- whether a secured route is preferable

The app should **route Ravi toward evaluating a secured/business route**, rather than treating him like an unsecured salaried borrower.

### Anita — informal/gig income + existing high-cost debt

Relevant follow-ups:

- exact current debt payments
- recent bounce/default history
- income volatility
- emergency savings
- productive effect of the scooter
- current loan rates

The app must allow a clear **DON'T BORROW** outcome.

---

## Recommended project structure

```text
borrower-copilot/
│
├── app/
│   ├── page.tsx
│   ├── assessment/
│   │   └── page.tsx
│   ├── results/
│   │   └── page.tsx
│   ├── negotiation-card/
│   │   └── page.tsx
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   ├── QuestionCard.tsx
│   ├── ProgressBar.tsx
│   ├── ResultCard.tsx
│   ├── RecommendationCard.tsx
│   ├── NegotiationCard.tsx
│   └── NumberExplanation.tsx
│
├── lib/
│   ├── engine/
│   │   ├── evaluate.ts
│   │   ├── affordability.ts
│   │   ├── eligibility.ts
│   │   ├── rates.ts
│   │   ├── apr.ts
│   │   └── stressTest.ts
│   ├── questions/
│   │   └── questions.ts
│   └── products/
│       └── products.ts
│
├── types/
│   └── borrower.ts
│
├── data/
│   └── assumptions.ts
│
├── tests/
│   ├── priya.test.ts
│   ├── ravi.test.ts
│   └── anita.test.ts
│
├── docs/
│   ├── README.md
│   ├── RULES.md
│   └── RUNTHROUGHS.md
└── package.json
```

Keep calculation logic separate from UI.

---

## Core data model

A minimal TypeScript shape can look like:

```ts
export type IncomeType =
  | "salaried"
  | "self-employed"
  | "informal"
  | "business";

export type LoanPurpose =
  | "personal"
  | "business"
  | "home"
  | "vehicle"
  | "gold"
  | "lap"
  | "other";

export interface BorrowerProfile {
  age: number;
  purpose: LoanPurpose;
  amountWanted: number;

  monthlyIncome: number;
  incomeType: IncomeType;

  householdExpenses: number;
  existingEmi: number;

  creditScore: number | null;

  employmentYears?: number;
  incomeMin?: number;
  incomeMax?: number;
  documentedAnnualIncome?: number;

  emergencySavingsMonths?: number;
  missedPaymentRecently?: boolean;

  collateralValue?: number;
  collateralEncumbered?: boolean;

  lenderRateQuote?: number;
  processingFee?: number;
}
```

---

## Engine contract

The UI should call one top-level evaluator:

```ts
const result = evaluateBorrower(profile);
```

It should return something close to:

```ts
interface BorrowerResult {
  verdict: "BORROW" | "BORROW_LESS" | "DON'T_BORROW";

  lenderRange: {
    min: number;
    max: number;
  };

  safeRange: {
    min: number;
    max: number;
  };

  fairRate: {
    min: number;
    max: number;
  };

  estimatedApr: {
    min: number;
    max: number;
  };

  emiCeiling: number;

  confidence: "LOW" | "MEDIUM" | "HIGH";

  reasons: string[];

  stressTest: {
    scenario: string;
    result: string;
  };

  recommendedProduct?: string;
}
```

Keep the calculation functions deterministic and testable.

---

## Running locally

### Requirements

- Node.js 20+
- npm

### Install

```bash
npm install
```

### Start development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

### Production build

```bash
npm run build
npm start
```

### Tests and checks

```bash
npm test
npm run lint
npx tsc --noEmit
```

`npm test` runs the Vitest suites in `tests/`. The browser walkthroughs use the local development server and cover the assessment, results, and Negotiation Card routes.

---

## No backend by design

Version 1.0 does not need:

- authentication
- database
- payments
- credit-bureau integration
- lender APIs
- WhatsApp integration
- user accounts
- persistent personal-data storage

Inputs remain in client-side React state during the assessment and are passed between routes through `sessionStorage` for the current browser session. They are not sent to a backend or written to a database.

This keeps the prototype aligned with the challenge:

> No login, no bureau pull, no personal data stored.

---

## Testing approach

The three supplied borrowers are acceptance tests.

At minimum:

```text
Priya → stable salaried / strong credit / personal consumption loan
Ravi  → self-employed / variable income / property / business purpose
Anita → informal income / recent bounce / high-cost existing debt
```

Tests should verify important behavior, not just exact displayed values.

Examples:

```text
Unknown credit score → wider rate range
Recent bounce + high debt burden → strong negative risk signal
Ravi + usable collateral → secured route considered
Requested amount > safe amount → BORROW LESS
Very weak affordability → DON'T BORROW
```

---

## Limitations

This prototype cannot know:

- a lender's proprietary underwriting model
- the borrower's actual bureau file
- exact lender-specific eligibility
- exact future income
- exact future interest-rate resets
- exact lender fee schedules
- whether collateral is legally acceptable
- the final legally applicable APR for an offer without a complete lender KFS/offer

The output is therefore an **estimate / negotiation reference**, not a loan approval.

The borrower should compare the lender's written offer and KFS before agreeing.

---

## Product assumptions

The prototype intentionally uses transparent assumptions instead of pretending to have a real underwriting model.

Examples:

```text
Safe total debt burden threshold
Income-stability adjustments
Income stress factor
Credit-score risk bands
Rate bands
Processing-fee assumptions
Collateral / LTV assumptions
Confidence rules
```

Every such value must be recorded in `RULES.md`.

The implementation also treats `null` as an explicit unknown for optional borrower inputs. Unknown values are not converted to zero or to a guessed risk value; they widen uncertainty or lower confidence where the rule applies.

---

## Why rules instead of an LLM?

The challenge is primarily about turning lending judgement into rules a borrower can see and a machine can run.

Therefore:

- **LLM is optional** for conversational wording or adaptive question presentation.
- **Core financial decisions should remain deterministic.**
- The same inputs should produce the same output.
- Every major number should have a visible explanation.

---

## RBI-related disclosure context

RBI's lending framework includes borrower-facing transparency requirements around loan costs and Key Facts Statements for applicable loans. RBI materials also state that APR is an all-inclusive cost concept for digital loans and require disclosure mechanisms in applicable contexts. This prototype uses that principle as a product-design reference, while its estimated APR is not presented as a substitute for the lender's official KFS or contractual calculation.

See:

- RBI Key Facts Statement / lending transparency materials
- RBI Fair Practices and charging-of-interest guidance
- RBI digital-lending disclosure framework

Sources:
- https://www.rbi.org.in/scripts/NotificationUser.aspx?Id=12678
- https://www.rbi.org.in/scripts/NotificationUser.aspx?Id=12382

## Verified v1 behavior

The end-to-end walkthroughs were run against the local application at desktop and mobile widths:

| Borrower | Adaptive route | Current result | Product direction |
|---|---|---|---|
| Priya | Salaried questions, employer tenure, savings, expense, lender quote | `BORROW` | Personal loan |
| Ravi | Business, income range, ITR, collateral, productive-use questions | `BORROW_LESS` with `LOW` confidence | Secured business loan |
| Anita | Informal income, volatility, existing debt, bounce, savings, productive-use questions | `DON'T_BORROW` with ₹0 new EMI | Vehicle route shown, but pause new borrowing |

The illustrative numbers in the walkthrough documents may differ from the current output because the engine uses the actual entered household expenses, documented income, risk adjustments, rate bands, and tenure assumptions. Priya's design brief says `BORROW LESS`, but the current rules return `BORROW` for the documented inputs; this is an intentional, visible test expectation until a stricter wedding/consumption policy is defined.
