# RULES.md

This file is the single source of truth for the prototype's lending assumptions.

**Important:** These are borrower-side decision rules, not a lender's underwriting policy. Unless a source is explicitly cited, the rule is marked **my judgement**.

The engine should reference these values from `data/assumptions.ts` rather than scattering magic numbers across UI code.

---

## 1. Design principles

| What | Value | Why | Source |
|---|---:|---|---|
| Never convert unknown credit score to a bad score | `null` | Unknown must widen uncertainty, not create fake data | My judgement / challenge requirement |
| Use ranges instead of point estimates | Yes | Borrower does not have enough information for false precision | My judgement |
| Separate lender range from safe borrower range | Yes | Lender willingness and borrower affordability are different | My judgement / core challenge requirement |
| Every material output needs a reason | Yes | Makes the recommendation defensible and usable in negotiation | My judgement / challenge requirement |
| No persistent personal-data storage in v1 | Yes | Matches challenge scope and keeps prototype simple | Challenge requirement |

---

## 2. Core affordability rules

### 2.1 Base total-debt ceiling

| What | Value | Why | Source |
|---|---:|---|---|
| Base safe total debt-service ratio | **35% of stable monthly income** | Conservative borrower-side ceiling that leaves room for household shocks | My judgement |
| Upper caution threshold | **45%** | Above this, debt burden becomes materially tighter | My judgement |
| Critical debt burden | **50%+** | New borrowing should generally not be recommended from affordability alone | My judgement |

Formula:

```text
baseTotalDebtCapacity = stableMonthlyIncome × 0.35

baseNewEmiCapacity =
  baseTotalDebtCapacity - existingMonthlyEmi
```

Never allow the result to become negative:

```text
max(0, baseNewEmiCapacity)
```

---

## 3. Household-expense floor

Affordability should not depend only on FOIR-style debt service.

The borrower must retain money after:

```text
household expenses
+ existing EMI
+ new EMI
```

Rule:

| What | Value | Why | Source |
|---|---:|---|---|
| Minimum post-expense monthly buffer | 10% of stable income | Adds a simple cash-flow safety layer | My judgement |
| Minimum absolute buffer | ₹5,000 | Prevents very small-income borrowers from being modeled as having practically zero residual cash | My judgement |

Proposed check:

```text
income
- householdExpenses
- existingEmi
- proposedEmi
>= max(10% of income, ₹5,000)
```

This is a prototype safety check, not a regulatory affordability rule.

---

## 4. Stable income normalization

### Salaried

If salaried income is stable:

```text
stableIncome = net monthly take-home
```

No additional haircut by default.

If employment is very short (< 1 year), widen the lender/rate range and lower confidence.

### Self-employed

Use both:

```text
cash-flow income
+
documented income
```

Do not silently assume the top end of a range.

For a user reporting:

```text
₹40,000 – ₹80,000
```

use a conservative modeled income:

```text
incomeFloor = ₹40,000
```

and separately retain the range for explanation.

If ITR/documented income is materially lower than reported cash flow, eligibility should be constrained by the documented-income signal unless a lender/product explicitly supports alternative income assessment.

**This is a prototype judgment.**

### Informal / gig

Use a conservative income estimate.

Recommended base:

```text
stableIncome = reported low-end monthly income
```

If income volatility is high, widen the result and apply a conservative haircut.

Suggested volatility haircut:

```text
stableIncome = lowEndIncome × 0.90
```

Source: **my judgement**.

---

## 5. Existing debt

Existing EMI is deducted from the new EMI capacity.

```text
newEmiCapacity =
  max(
    0,
    stableIncome × 35%
    - existingEmi
  )
```

If existing EMI already exceeds the 35% base ceiling:

```text
newEmiCapacity = ₹0
```

and the app should strongly consider:

```text
DON'T BORROW
```

unless a specific debt-consolidation/refinancing scenario is being modeled.

---

## 6. Emergency savings

| What | Value | Why | Source |
|---|---:|---|---|
| Preferred emergency buffer | 3+ months | More resilient to income shocks | My judgement |
| Thin buffer | 1–3 months | Moderate risk | My judgement |
| Very thin buffer | <1 month | New debt should be treated conservatively | My judgement |
| No savings | 0 months | Increases vulnerability to payment shocks | My judgement |

Suggested adjustment:

```text
<1 month savings → safe EMI ceiling × 0.90
1–3 months      → × 0.95
3+ months       → × 1.00
unknown         → no adjustment, but lower confidence
```

These multipliers are **my judgement**.

---

## 7. Recent missed / bounced payment

| What | Value | Why | Source |
|---|---|---|---|
| Recent bounce in last 6 months | Strong negative signal | Indicates repayment stress | My judgement |
| Multiple recent bounces | Severe negative signal | Makes additional borrowing materially riskier | My judgement |

Prototype effect:

```text
recentBounce = true
→ lower confidence
→ widen rate band
→ reduce lender-range estimate
→ reduce safe EMI ceiling by 10%
```

This is not a lender credit score rule.

---

## 8. Credit score

### Known score

Prototype bands:

| Score | Internal tier | Effect | Source |
|---:|---|---|---|
| 780+ | Excellent | Best rate band, strongest confidence | My judgement |
| 750–779 | Strong | Near-best rate band | My judgement |
| 700–749 | Moderate | Mid rate band | My judgement |
| 650–699 | Weak | Higher rate band / tighter amount | My judgement |
| <650 | High risk | Higher rate / possible don't-borrow depending on affordability | My judgement |

### Unknown score

```text
creditScore = null
```

Effect:

```text
Do not assign a score.
Do not use the score to narrow the range.
Widen fair-rate range.
Lower confidence.
Show "Credit score unknown" explicitly.
```

---

## 9. Product routing

### Personal loan

Characteristics:

- unsecured
- usually higher pricing than secured borrowing
- consumer / non-productive purpose often has less direct cash-flow benefit

Prototype rate band:

```text
11% – 18%
```

Source: **prototype market assumption; verify against current lender offers before production use.**

### Loan Against Property / secured business use

Characteristics:

- collateral-backed
- generally lower risk to lender than comparable unsecured debt
- borrower has property at risk

Prototype rate band:

```text
9% – 14%
```

Source: **prototype market assumption; verify current lender pricing before production.**

### Vehicle / two-wheeler

Prototype rate band:

```text
9% – 18%
```

Source: **prototype market assumption.**

### Gold loan

Prototype rate band:

```text
9% – 20%
```

Source: **prototype market assumption.**

### Home loan

Prototype rate band:

```text
7.5% – 10%
```

Source: **prototype market assumption.**

> These bands are intentionally treated as assumptions. They are not a claim that every lender currently offers these rates.

---

## 10. Rate adjustments

Start from the product band and adjust based on risk signals.

Example adjustment model:

```text
Excellent credit       → toward lower end
Strong credit          → slightly toward lower end
Moderate credit        → middle
Weak credit            → toward upper end
Unknown credit         → widen band

Stable salaried income → slightly lower
Long business history  → slightly lower
High income volatility → higher
Recent bounce          → higher
Thin emergency buffer  → higher
Secured collateral     → lower than similar unsecured product
```

Keep adjustments bounded so the engine does not produce absurd values.

---

## 11. Fair-rate range

The app should never output a single "correct" rate.

Example:

```text
fairRate.min = 11.0
fairRate.max = 12.5
```

The explanation should identify the top 2–4 drivers:

```text
Why:
• strong credit score
• stable income
• 5-year employment
• unsecured personal loan
```

---

## 12. Lender likely amount

This is a **rough eligibility estimate**, not a promise of sanction.

### Basic affordability cap

Assume a maximum tenure by product.

Then convert allowable EMI to a rough principal amount.

Formula:

```text
P = EMI × [1 - (1+r)^(-n)] / r
```

Where:

```text
r = monthly interest rate
n = number of monthly payments
```

Use the **upper half of the fair-rate band** for conservative lender-range modeling.

Then apply product/risk caps.

### Important

For self-employed borrowers, documented income may constrain the lender range.

For secured products, collateral value may constrain the lender range through an assumed LTV.

---

## 13. Collateral / LTV

For Ravi's secured route:

Prototype assumption:

```text
Maximum LTV used for screening = 60%
```

So:

```text
collateralLimit = propertyValue × 60%
```

For ₹45L property:

```text
₹45L × 60% = ₹27L
```

This does **not** mean Ravi is eligible for ₹27L.

The final modeled lender amount is:

```text
min(
  affordability-derived amount,
  documented-income-derived amount,
  collateral LTV amount
)
```

Source: **my judgement for prototype screening.**

Actual lender LTV depends on product, property, documentation, borrower profile and lender policy.

---

## 14. Productive borrowing

A business/vehicle loan can potentially increase future income.

But the app must not treat a user's projected income increase as guaranteed.

Example:

```text
Expected additional income = ₹10k/month
```

Use it only as a **secondary signal**.

Recommended prototype rule:

```text
Count at most 50% of self-reported incremental income
toward a stressed affordability scenario.
```

Source: **my judgement.**

---

## 15. Borrow verdict

### BORROW

Conditions:

```text
requestedAmount <= safeRange.max
AND
new EMI <= safe EMI ceiling
AND
no critical repayment-risk flag
```

### BORROW LESS

Conditions:

```text
requestedAmount > safeRange.max
AND
safeRange.max > 0
AND
there is no critical "don't borrow" condition
```

### DON'T BORROW

Trigger when one or more strong conditions occur:

```text
newEmiCapacity = 0
OR
critical debt burden
OR
recent repayment distress + very thin cash buffer
OR
requested borrowing is materially above safe amount
  and risk signals are severe
```

A "don't borrow" result should name the reason.

---

## 16. EMI ceiling

Base:

```text
emiCeiling =
  min(
    newEmiCapacity,
    income - householdExpenses - existingEmi - requiredBuffer
  )
```

Then apply risk adjustments.

Example:

```text
recentBounce → × 0.90
<1 month savings → × 0.90
high income volatility → × 0.90
```

Round the final ceiling to a borrower-friendly number.

Example:

```text
₹22,742 → ₹22,000
```

Source: **my judgement.**

---

## 17. Tenure trade-off

For every recommended loan amount, show at least 3 tenure examples where available.

Example:

```text
3 years → ₹19,900 EMI → lower total interest
4 years → ₹15,800 EMI
5 years → ₹13,300 EMI → higher total interest
```

The calculator should use the actual monthly rate from the chosen scenario.

---

## 18. Stress tests

At least one stress scenario is required.

### Income stress

```text
stressedIncome = stableIncome × 0.80
```

Then recompute affordability.

Source: **my judgement.**

### Rate stress

For floating-rate scenarios:

```text
stressedAnnualRate = quotedRate + 2%
```

Then recompute EMI for the remaining term.

Source: **my judgement.**

---

## 19. APR / all-in cost

For prototype comparison:

Inputs:

```text
loan amount
interest rate
tenure
processing fee
other upfront fees
```

Net proceeds:

```text
netProceeds = loanAmount - upfrontFees
```

Then solve for the annualised rate whose cash-flow schedule matches:

```text
netProceeds
↔
future EMI cash flows
```

This should be labeled:

> Estimated all-in APR

It should **not** be called the lender's official APR unless all required loan-cost inputs and timing are present.

RBI sources emphasize borrower-facing cost disclosure and KFS requirements for applicable loans. The prototype therefore surfaces fees instead of comparing headline interest rates alone. Source: RBI materials. citeturn913234search4turn913234search7

---

## 20. Confidence

### LOW

Use when:

- many must questions are missing
- credit score unknown
- variable/informal income with little history
- important debt details are missing
- collateral status is unknown

Display:

```text
Confidence: LOW

Your rate and amount ranges are wide because
some important information is missing.
```

### MEDIUM

Enough inputs for a reasonable screening result, but one or more meaningful uncertainties remain.

### HIGH

Most important inputs are known and internally consistent.

---

## 21. Contradiction / validation rules

Reject or flag:

```text
age <= 17
age > 80
income < 0
expenses < 0
EMI < 0
loan amount <= 0
credit score < 300
credit score > 900
```

Flag inconsistencies such as:

```text
monthlyIncome × 12
very different from documentedAnnualIncome
```

Do not silently pick whichever number produces the better result.

---

## 22. High-impact edge cases

The engine must cover:

| Edge case | Required behavior |
|---|---|
| Credit score unknown | Widen rate range; do not impute |
| Income is zero | Safe EMI = ₹0; likely DON'T BORROW |
| Existing EMI > safe debt capacity | New EMI capacity = ₹0 |
| Requested amount > safe amount | BORROW LESS |
| Requested amount > lender estimate | Explain likely lender constraint |
| Recent bounce | Increase risk, reduce confidence |
| High-cost existing debt | Consider "don't add debt" / consolidation path |
| Self-employed with lower ITR | Separate cash-flow affordability from documented-income lender range |
| Unencumbered property | Consider secured route |
| Encumbered property | Do not count the full collateral limit |
| Zero emergency savings | Conservative affordability |
| Long tenure | Show higher total-interest trade-off |
| Income stress breaks affordability | Explicit warning |
| Rate stress breaks affordability | Explicit warning |
| Negative inputs | Validation error |
| Contradictory inputs | Ask for correction / show uncertainty |

---

## 23. What is NOT modeled

Version 1 intentionally does not model:

- lender-specific underwriting policies
- bureau tradeline history
- exact bank-statement cash-flow analysis
- GST/tax-return quality
- property title/legal risk
- detailed FOIR policies of each bank/NBFC
- insurance bundled into a specific product
- foreclosure/prepayment policy for every lender
- exact contractual APR/KFS generation
- collection/recovery behavior
- macroeconomic rate forecasts

These are future product areas.

---

## 24. Sources and reference material

Use official sources first where possible.

RBI materials relevant to this prototype include:

- Key Facts Statement / lending transparency framework
- digital lending disclosure framework
- fair lending / interest charging guidance
- penalty-charge disclosure guidance

Official references used for design context:

1. RBI fair-practices / charging-of-interest circular:
   https://www.rbi.org.in/scripts/NotificationUser.aspx?Id=12678

2. RBI digital-lending disclosure framework:
   https://systemhealth.rbi.org.in/Scripts/NotificationUser.aspx_Id%3D12382%26Mode%3D0.html

3. RBI material showing KFS/cost disclosure context:
   https://website.rbi.org.in/documents/d/rbi/handbookg27022025d0f3f53f5d3c4310a6bb2f8ac2175d3a

4. RBI penal charges disclosure guidance:
   https://systemhealth.rbi.org.in/Scripts/NotificationUser.aspx_Id%3D12527%26Mode%3D0%281%29.html

For rate bands and product pricing, use current official lender product pages in production. The bands in this prototype are explicitly marked as **prototype market assumptions** unless backed by a current lender source.
