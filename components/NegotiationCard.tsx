"use client";

import { useEffect, useState } from "react";
import { PRODUCT_ASSUMPTIONS } from "@/data/assumptions";
import { evaluateBorrower } from "@/lib/engine/evaluate";
import type { BorrowerProfile, BorrowerResult } from "@/types/borrower";

const SESSION_KEY = "borrower-copilot-profile";

export default function NegotiationCard() {
  const [profile, setProfile] = useState<BorrowerProfile | null>(null);
  const [result, setResult] = useState<BorrowerResult | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedProfile = window.sessionStorage.getItem(SESSION_KEY);

      if (!storedProfile) {
        setMissing(true);
        return;
      }

      try {
        const parsedProfile = JSON.parse(storedProfile) as BorrowerProfile;
        setProfile(parsedProfile);
        setResult(evaluateBorrower(parsedProfile));
      } catch {
        setMissing(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  if (missing) {
    return (
      <section className="card-empty">
        <p className="eyebrow">No assessment found</p>
        <h1>Build this card from your answers.</h1>
        <p>Complete an assessment first. Your information stays in this browser session.</p>
        <a className="button button-primary" href="/assessment">Start assessment <span aria-hidden="true">→</span></a>
      </section>
    );
  }

  if (!profile || !result) return null;

  const product = result.recommendedProduct
    ? PRODUCT_ASSUMPTIONS[result.recommendedProduct]
    : undefined;
  const isDoNotBorrow = result.verdict === "DON'T_BORROW";

  return (
    <div className="negotiation-layout">
      <div className="card-intro">
        <p className="eyebrow">Take this to the lender</p>
        <h1>Keep the useful number in view.</h1>
        <p>
          This card turns your assessment into a short conversation guide. It
          is a negotiation boundary, not an approval promise.
        </p>
        <div className="card-actions no-print">
          <button className="button button-primary" type="button" onClick={() => window.print()}>
            Print or save PDF <span aria-hidden="true">↗</span>
          </button>
          <a className="button button-quiet" href="/results">Back to results</a>
        </div>
      </div>

      <article className="negotiation-card" aria-labelledby="card-title">
        <div className="card-header">
          <div>
            <span className="card-overline">Borrower Copilot</span>
            <h2 id="card-title">My borrowing card</h2>
          </div>
          <span className={`card-verdict ${isDoNotBorrow ? "card-verdict-stop" : ""}`}>
            {cardVerdict(result.verdict)}
          </span>
        </div>

        <div className="card-request">
          <span>Requested amount</span>
          <strong>{formatCurrency(profile.amountWanted)}</strong>
        </div>

        {isDoNotBorrow ? (
          <div className="card-stop-message">
            <strong>Do not add new debt right now.</strong>
            <span>Your safe new EMI is {formatCurrency(result.emiCeiling)}.</span>
          </div>
        ) : (
          <div className="card-metrics">
            <div><span>My safe range</span><strong>{formatSafeRange(result.safeRange)}</strong></div>
            <div><span>EMI ceiling</span><strong>{formatCurrency(result.emiCeiling)} / month</strong></div>
            <div><span>Fair rate</span><strong>{formatRateRange(result.fairRate)}</strong></div>
            <div><span>Estimated all-in APR</span><strong>{formatRateRange(result.estimatedApr)}</strong></div>
          </div>
        )}

        <div className="card-route">
          <span>Route to discuss</span>
          <strong>{product?.label ?? "Compare written offers"}</strong>
        </div>

        <div className="card-reasons">
          <span className="card-section-label">Why this boundary</span>
          <ul>
            {result.reasons.slice(0, 4).map((reason) => <li key={reason}>{reason}</li>)}
          </ul>
        </div>

        <div className="card-questions">
          <span className="card-section-label">Ask the lender</span>
          <ul>
            {getLenderQuestions(result, isDoNotBorrow).map((question) => <li key={question}>{question}</li>)}
          </ul>
        </div>

        <div className="card-footer">
          <span>Estimated figures. Ask for the official KFS.</span>
          <span>Session-only prototype</span>
        </div>
      </article>
    </div>
  );
}

function getLenderQuestions(result: BorrowerResult, isDoNotBorrow: boolean) {
  if (isDoNotBorrow) {
    return [
      "Can we first review the repayment schedule and total cost of my existing loans?",
      "What would the total repayment be, including every fee and penalty?",
      "Would refinancing reduce cost without increasing my monthly burden?",
    ];
  }

  const questions = [
    "Please show the all-in cost and official KFS, including processing fees.",
    `Please explain any rate above ${formatRate(result.fairRate.max)}.`,
    "What is the total repayment across each available tenure?",
    "Is the rate fixed or floating, and what happens if it rises?",
  ];

  if (result.recommendedProduct === "secured-business" || result.recommendedProduct === "loan-against-property") {
    questions.push("Which collateral, valuation, and release conditions apply?");
  }

  return questions;
}

function cardVerdict(verdict: BorrowerResult["verdict"]) {
  if (verdict === "DON'T_BORROW") return "Pause new borrowing";
  if (verdict === "BORROW_LESS") return "Borrow less";
  return "Stay within this boundary";
}

function formatCurrency(value: number) { return `₹${Math.round(value).toLocaleString("en-IN")}`; }
function formatRange(range: { min: number; max: number }) { return `${formatCurrency(range.min)} – ${formatCurrency(range.max)}`; }
function formatSafeRange(range: { min: number; max: number }) { return range.min === 0 ? `Up to ${formatCurrency(range.max)}` : formatRange(range); }
function formatRate(value: number) { return `${(value * 100).toFixed(1)}%`; }
function formatRateRange(range: { min: number; max: number }) { return `${formatRate(range.min)} – ${formatRate(range.max)}`; }