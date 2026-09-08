# Tradeoffs

Borrower Copilot intentionally makes several tradeoffs to keep the v1 prototype understandable, testable, and focused.

## 1. Explainability over underwriting realism

The engine uses visible prototype assumptions such as:

- 35% base total debt-service ceiling
- household-expense buffer
- emergency-savings multipliers
- 60% collateral LTV screening
- illustrative product rate bands
- 20% income stress
- 2 percentage-point rate stress utility

These rules are easier to explain and test than a black-box model. The tradeoff is that they cannot reproduce the proprietary underwriting decisions of a bank or NBFC.

The result is a screening and negotiation reference, not a sanction prediction.

## 2. Ranges over precision

The application returns ranges rather than one exact amount or rate. This is more honest when credit history, lender policy, documentation, fees, and collateral quality are incomplete.

The tradeoff is that ranges can feel less decisive. The product addresses this by also providing a practical EMI ceiling, reasons, confidence level, and lender questions.

## 3. Unknown values lower confidence

Unknown credit score, savings, or existing-loan rate is preserved as unknown. The system does not guess.

The tradeoff is that a borrower may receive a wider rate range or lower confidence than they would receive after supplying more information. That is intentional: false certainty is more harmful than an explicit information gap.

## 4. Client-side session state over a backend

The v1 flow stores the completed profile in browser `sessionStorage` so the assessment can hand off to results and the Negotiation Card.

Benefits:

- no authentication setup
- no database
- no personal-data retention by the prototype
- simple local development

Tradeoffs:

- data is lost when the session is cleared
- results are not available across devices
- there is no account history or saved comparison set
- browser storage should not be treated as a production security boundary

A production version would need explicit consent, privacy controls, secure storage, retention rules, and probably an account or share workflow.

## 5. No lender-rate dataset

The product uses illustrative rate bands from the documented assumptions rather than live lender offers.

This keeps the prototype independent and avoids presenting stale or unsupported market data as current. The tradeoff is that the fair-rate output is directional only.

Production use would require:

- current lender/product sources
- effective dates
- eligibility conditions
- fee schedules
- update ownership
- monitoring for stale rates

## 6. No bureau or bank-statement integration

The assessment accepts self-reported information and an optional credit score.

This reduces privacy, consent, and integration complexity. It also means the engine cannot verify:

- tradeline history
- actual repayment behavior beyond the user's answer
- bank-statement cash flow
- income consistency
- existing undisclosed debt

The result should therefore be treated as a first-pass conversation tool.

## 7. Simple stress tests over full financial planning

The prototype applies simple scenarios such as a 20% income reduction. The calculation is easy to understand and gives the borrower a useful warning.

The tradeoff is that it does not model:

- household-specific shock probabilities
- job-loss duration
- inflation
- medical events
- changing expenses
- detailed floating-rate amortization over time
- multiple simultaneous shocks

A stronger planning tool would need richer cash-flow inputs and scenario configuration.

## 8. Safe borrower range is not a guarantee

The safe range is calculated from modeled affordability, expenses, existing EMI, savings, and risk adjustments. It is deliberately not an approval number.

The tradeoff is that a borrower may see a safe range below what a lender is willing to offer. That tension is the central purpose of the product: lender willingness and borrower safety are different questions.

## 9. Product routing is suggestive, not advisory approval

Ravi can be routed toward a secured business or property-backed route when collateral is available and unencumbered.

The tradeoff is that this routing does not verify title, valuation, legal acceptability, lender policy, or the consequences of collateral enforcement. The borrower must treat collateral as a real risk, not just as additional borrowing capacity.

## 10. No machine-learning credit model

An ML model could potentially learn patterns from large historical datasets. This prototype does not have a suitable dataset, and an opaque score would work against the explainability goal.

The tradeoff is less predictive sophistication in exchange for:

- inspectable rules
- reproducible outputs
- easier edge-case testing
- easier review by a product or lending expert

## 11. A small UI surface over a broad product idea

The v1 includes the assessment, results, and Negotiation Card. It deliberately does not include applications, lender offer ingestion, document upload, chat, payments, or WhatsApp sharing.

This narrows the product surface so the core borrower reasoning can be reviewed before adding operational complexity.

## 12. Current walkthrough behavior versus illustrative targets

The walkthrough documents contain illustrative expected directions. The executable rules are authoritative for the current build.

For example:

- Priya's brief suggests `BORROW LESS`, but the current entered values return `BORROW` because the requested amount is inside the modeled safe maximum.
- Ravi currently returns `BORROW_LESS` with `LOW` confidence and a secured-business route.
- Anita returns `DON'T_BORROW` with a ₹0 new EMI ceiling.

This is a useful product tradeoff to keep visible: changing a verdict should mean changing a documented rule or assumption, not quietly changing a UI label.

## 13. What should change before production

Before production use, the prototype would need at least:

- verified, current lender/product data
- a reviewed affordability methodology
- official APR/KFS comparison inputs and timing
- consented bureau and income data integrations
- secure privacy-preserving storage
- audit logging for assumptions and outputs
- accessibility and security review
- legal and compliance review
- monitoring for rule and data drift
- clearer handling of debt consolidation and refinancing

Until then, the application should remain clearly labeled as borrower-side decision support.
