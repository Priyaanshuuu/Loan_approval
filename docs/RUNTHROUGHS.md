# RUNTHROUGHS.md

These are the three required walkthroughs for Borrower Copilot.

The exact numbers can move when the rule engine is implemented. The important requirement is that the outputs are produced by transparent rules and every material number has a reason.

---

# 1. Priya

## Profile

```text
Age: 29
Location: Bengaluru
Income type: Salaried
Employment: Large MNC
Employment history: 5 years
Net monthly income: ₹1,10,000
Existing car-loan EMI: ₹14,000
Car loan remaining: 2 years
Rent: ₹28,000
Credit score: 780
Loan purpose: Wedding
Requested amount: ₹8,00,000
```

## Questions asked

### Must questions

1. How much do you want to borrow?
   - ₹8,00,000

2. What is the loan for?
   - Wedding / personal

3. What is your monthly take-home income?
   - ₹1,10,000

4. How do you earn?
   - Salaried

5. How much do you currently pay in EMIs?
   - ₹14,000

6. What are your monthly household expenses?
   - ₹28,000 rent is known; collect total monthly household expenses in the app

7. What is your age?
   - 29

8. Do you know your credit score?
   - Yes → 780

### Adaptive questions

9. How long have you been with your employer?
   - 5 years

10. How much emergency savings do you have?
    - Example walkthrough value: 3–6 months

11. Do you expect a major expense in the next 12 months?
    - Example walkthrough value: Yes — wedding itself is the requested expense

12. Have you received a lender quote already?
    - Not yet

## Reasoning

Positive signals:

```text
+ strong credit score
+ stable salaried income
+ long employment history
+ existing EMI is manageable
```

Negative / caution signals:

```text
- requested loan is for a consumption event
- existing car EMI already consumes part of debt capacity
- wedding borrowing does not generate repayment income
```

## Expected direction

```text
Verdict: BORROW LESS
```

The point is not that ₹8L is impossible.

The point is:

> A lender may be willing to sanction near the requested amount, but the borrower should negotiate around a lower safe amount.

## Illustrative output

```text
O1 — Recommendation

BORROW LESS

₹8L may be financeable, but it is above the
borrower-first amount we would be comfortable carrying.
```

```text
O2 — Amount

Likely lender range:
₹7.0L – ₹8.5L

Safe borrower range:
₹5.5L – ₹6.5L

Use this number:
₹5.5L – ₹6.5L
```

```text
O3 — Fair rate

Fair rate:
11.0% – 12.5%

Estimated all-in APR:
approximately 12% – 13.8%
depending on fees
```

```text
O4 — EMI

Recommended ceiling:
around ₹22,000 – ₹24,000/month

Stress:
At a 20% income fall, the same EMI consumes
a materially larger share of monthly income.
```

## Why the safe ceiling is lower

Example explanation:

> "Your income and 780 credit score are strong, but you already have a ₹14,000 car EMI. Our borrower-side ceiling keeps total debt service around 35% of stable income, rather than using the maximum a lender might offer."

## Negotiation Card

```text
┌──────────────────────────────────────────┐
│           MY BORROWING CARD              │
│                                          │
│ Requested: ₹8,00,000                     │
│ My safe range: ₹5.5L – ₹6.5L             │
│                                          │
│ Fair rate: 11% – 12.5%                   │
│ Estimated all-in APR: ~12% – 13.8%       │
│                                          │
│ EMI ceiling: ₹22k – ₹24k/month           │
│                                          │
│ Why:                                     │
│ • 780 credit score                       │
│ • ₹1.1L stable salary                    │
│ • 5 years at current employer            │
│ • Existing EMI: ₹14k                     │
│                                          │
│ ASK THE LENDER                            │
│ "Please show the all-in cost/APR         │
│ including processing fees, and explain   │
│ any rate above 12.5%."                   │
└──────────────────────────────────────────┘
```

---

# 2. Ravi

## Profile

```text
Age: 42
Location: Mysuru
Income type: Self-employed
Business: Kirana store
Business history: 14 years
Cash income: ₹40,000 – ₹80,000/month
ITR income: ₹4,20,000/year
Shop/property value: ~₹45,00,000
Property: Unencumbered
Formal loan history: None
Credit score: Unknown
Wife income: ₹18,000/month
Loan purpose: Second stock line + delivery vehicle
Requested amount: ₹15,00,000
```

## Questions asked

### Must questions

1. Amount wanted?
   - ₹15,00,000

2. Purpose?
   - Business

3. Monthly income?
   - ₹40,000–₹80,000

4. Income type?
   - Self-employed

5. Existing EMIs?
   - ₹0 formal EMI

6. Household expenses?
   - Collect in app

7. Age?
   - 42

8. Credit score?
   - I don't know

### Adaptive questions

9. How long has the business operated?
   - 14 years

10. What does your ITR show?
    - ₹4.2L/year

11. What is the property value?
    - ₹45L

12. Is it already pledged?
    - No

13. Is the loan for productive business use?
    - Yes

14. How much additional monthly income do you expect from the new stock line / vehicle?
    - Collect estimate but treat as uncertain

## Reasoning

Positive signals:

```text
+ 14-year business
+ no existing formal EMI
+ unencumbered property
+ requested funding is productive/business-related
```

Negative / uncertainty signals:

```text
- reported cash income is variable
- documented income is much lower
- credit history is unknown
- ₹15L is large relative to documented income
```

## Critical routing

The app should NOT simply say:

> "Ravi has no credit score, reject."

Instead:

```text
Unsecured ₹15L
      ↓
documented income constraint
      ↓
likely difficult

But:

₹45L unencumbered collateral
      ↓
secured route
      ↓
potentially much more sensible
```

## Expected direction

```text
Verdict: BORROW / BORROW LESS
Product suggestion: evaluate secured business / LAP route
```

## Illustrative output

```text
O1 — Recommendation

BORROW, BUT USE THE RIGHT PRODUCT

A secured business/LAP route may fit your
profile better than a high-cost unsecured loan.
```

```text
O2 — Amount

Unsecured lender-style range:
approximately ₹5L – ₹10L

Secured screening range:
potentially higher, subject to documented income,
product rules and collateral valuation.

Collateral screening cap:
₹45L × 60% = ₹27L

This is NOT an approval.
```

The final amount is the minimum of the relevant lender constraints.

```text
Safe borrower range:
based on actual cash flow and household expenses
rather than collateral alone
```

## Rate

Illustrative:

```text
Unsecured business/personal route:
12% – 18%

Secured route:
9% – 14%
```

Exact product pricing must be verified against the lender's written offer.

## EMI

Because the cash-flow range is ₹40k–₹80k, do not use ₹80k as guaranteed monthly income.

Model affordability from the conservative income floor.

Example:

```text
Modeled stable income:
₹40,000 × conservative adjustment

Existing EMI:
₹0

Safe new EMI:
roughly ₹10k–₹14k depending on expenses
```

## Stress

```text
Stress case:
income drops from modeled baseline by 20%

Question:
Does the EMI remain serviceable without relying on
the highest-end business-income month?
```

## Why the recommendation is different from Priya

> "Your property creates a secured borrowing route, but your documented income is much lower than your highest cash-flow months. We therefore separate collateral capacity from repayment capacity."

## Negotiation Card

```text
┌──────────────────────────────────────────┐
│           MY BORROWING CARD              │
│                                          │
│ Requested: ₹15L                          │
│                                          │
│ Preferred route: secured business/LAP   │
│                                          │
│ Fair secured-rate range: 9% – 14%       │
│                                          │
│ Do not negotiate only on sanction amount.│
│ Ask for:                                 │
│ • rate                                   │
│ • processing fee                         │
│ • total repayment                       │
│ • collateral requirements                │
│                                          │
│ Why:                                     │
│ • 14-year business                       │
│ • ₹45L unencumbered property             │
│ • no current formal EMI                  │
│ • cash income is variable                │
│ • ITR income is only ₹4.2L/year          │
└──────────────────────────────────────────┘
```

---

# 3. Anita

## Profile

```text
Age: 35
Location: Hubballi
Income type: Informal / gig
Work: Delivery-platform rider + home tailoring
Monthly income: ₹26,000–₹30,000
Children: 2
Husband: unemployed for 8 months
Existing app loans: 3
Outstanding: ₹35,000
Existing rates: 30%+
Recent EMI bounce: Yes, last month
Requested amount: ₹1,50,000
Purpose: Electric scooter
```

## Questions asked

### Must questions

1. Amount wanted?
   - ₹1,50,000

2. Purpose?
   - Electric scooter

3. Monthly income?
   - ₹26,000–₹30,000

4. Income type?
   - Informal/gig + tailoring

5. Existing EMI?
   - Collect exact amount

6. Household expenses?
   - Collect exact amount

7. Age?
   - 35

8. Credit score?
   - Unknown / not checked

### Adaptive questions

9. How much do your existing app loans cost per month?
   - Collect exact EMI

10. Any missed or bounced payment recently?
    - Yes — last month

11. Emergency savings?
    - Collect

12. Will the scooter increase delivery income?
    - Yes / estimate expected incremental income

13. Do you have any other large expenses coming up?
    - Collect

## Reasoning

Negative signals:

```text
- low and variable income
- spouse currently unemployed
- existing high-cost debt
- recent EMI bounce
- likely thin emergency buffer
- credit score unknown
```

Positive signal:

```text
+ scooter may be productive and could increase earnings
```

But the productive benefit is uncertain and must not be treated as guaranteed.

## Expected direction

```text
Verdict: DON'T BORROW
```

More specifically:

> Don't take a new ₹1.5L loan now, especially not another expensive loan.

## Illustrative output

```text
O1 — Recommendation

DON'T BORROW RIGHT NOW

Your current repayment stress is the bigger issue.
Taking another loan before stabilising the existing
30%+ debt would reduce your safety buffer further.
```

```text
O2 — Amount

Lender likely amount:
may be low / highly variable

Safe borrower amount:
₹0 – very limited

Recommended:
do not add new debt today
```

```text
O3 — Rate

Because credit score is unknown, income is informal,
and there was a recent bounce:

Fair-rate range:
wide / low confidence

Any new offer above a very high-risk price should
be treated with caution.
```

Do not invent a narrow rate band for this case.

```text
Confidence: LOW
```

## EMI

If current debt already consumes most of available cash flow:

```text
New safe EMI ceiling:
₹0
```

That is a valid output.

## Stress

```text
Income stress:
₹28k → ₹22.4k

Question:
Can the household still cover existing debt + basic
expenses?

If not, a new EMI should not be added.
```

## Productive borrowing nuance

The app should say:

> "The scooter may increase delivery income, but the increase is not guaranteed. We should not borrow based on the optimistic income case while an existing repayment problem is already present."

## Negotiation Card

```text
┌──────────────────────────────────────────┐
│           BORROWING CHECK                │
│                                          │
│ Requested: ₹1,50,000                     │
│ Recommendation: DON'T BORROW NOW        │
│                                          │
│ Safe new EMI: ₹0 / very limited          │
│                                          │
│ Main reasons:                            │
│ • 3 existing app loans                   │
│ • 30%+ existing rates                    │
│ • recent EMI bounce                      │
│ • variable ₹26k–₹30k income              │
│ • household has limited income buffer    │
│                                          │
│ NEXT STEP                                │
│ Stabilise current debt first.            │
│ Avoid replacing one expensive loan with  │
│ another expensive loan.                  │
└──────────────────────────────────────────┘
```

---

# Cross-case comparison

| Borrower | Main signal | Product direction | Verdict direction |
|---|---|---|---|
| Priya | Strong salaried + strong credit, but requested consumption loan | Unsecured personal | Borrow Less |
| Ravi | Variable/self-employed + collateral + productive use | Secured business/LAP route | Borrow / product-route first |
| Anita | Existing high-cost debt + recent bounce + low/variable income | Don't add expensive debt | Don't Borrow |

---

# Acceptance criteria

The final app should make these distinctions obvious.

### Priya

```text
Strong borrower ≠ automatically "take ₹8L"
```

### Ravi

```text
No credit score ≠ bad credit
Collateral ≠ unlimited affordability
Self-employed ≠ reject
```

### Anita

```text
Productive purpose ≠ automatically safe
```

---

# Demo script

## 0:00–0:45

Explain:

> "Borrower Copilot is a borrower-side decision-support tool. It separates what a lender might offer from what the borrower should safely accept."

## 0:45–2:00

Run Priya:

- show adaptive salaried questions
- show lender vs safe amount
- show fair rate
- show EMI ceiling
- show Negotiation Card

## 2:00–3:15

Run Ravi:

- show self-employed routing
- show collateral question
- show secured product suggestion
- explain why ITR and cash income are treated differently

## 3:15–4:15

Run Anita:

- show debt and bounce questions
- show "DON'T BORROW"
- show why scooter's productive potential does not erase current repayment stress

## 4:15–5:00

Explain:

### Build next

- real current lender-rate dataset
- exact lender/product comparison
- consented bureau integration
- better cash-flow analysis
- better APR/KFS comparison
- offer comparison

### Deliberately cut from v1

- auth
- backend
- database
- ML credit model
- lender application workflow
- WhatsApp integrations
- broad product catalog

The v1 goal is borrower-side reasoning, explainability and negotiation utility.
