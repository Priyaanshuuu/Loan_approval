"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { PRODUCT_ASSUMPTIONS } from "@/data/assumptions";
import { evaluateBorrower } from "@/lib/engine/evaluate";
import { calculateEmi } from "@/lib/engine/loanMath";
import type { BorrowerProfile, BorrowerResult } from "@/types/borrower";

const SESSION_KEY = "borrower-copilot-profile";

export default function ResultsPage() {
  const [result, setResult] = useState<BorrowerResult | null>(null);
  const [profile, setProfile] = useState<BorrowerProfile | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedProfile = window.sessionStorage.getItem(SESSION_KEY);

      if (!storedProfile) {
        setError(true);
        return;
      }

      try {
        const parsedProfile = JSON.parse(storedProfile) as BorrowerProfile;
        setProfile(parsedProfile);
        setResult(evaluateBorrower(parsedProfile));
      } catch {
        setError(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  if (error) {
    return (
      <main className="results-page">
        <ResultsHeader />
        <section className="results-empty">
          <p className="eyebrow">No assessment found</p>
          <h1>Start with a few answers.</h1>
          <p>Your assessment stays in this browser session and is not stored on a server.</p>
          <Link className="button button-primary" href="/assessment">Start assessment <span aria-hidden="true">→</span></Link>
        </section>
      </main>
    );
  }

  if (!result || !profile) return null;

  const product = result.recommendedProduct
    ? PRODUCT_ASSUMPTIONS[result.recommendedProduct]
    : undefined;
  const recommendedAmount = Math.min(profile.amountWanted, result.safeRange.max);
  const tenureOptions = getTenureOptions(
    recommendedAmount,
    result.fairRate.max,
    product?.maximumTenureMonths ?? 60,
  );

  return (
    <main className="results-page">
      <ResultsHeader />
      <div className="results-shell">
        <div className="results-heading">
          <div>
            <p className="eyebrow">Your borrower brief</p>
            <h1>What this borrowing could mean for your month.</h1>
          </div>
          <span className={`confidence-badge confidence-${result.confidence.toLowerCase()}`}>
            {result.confidence} confidence
          </span>
        </div>

        <section className={`verdict-banner ${verdictClass(result.verdict)}`}>
          <div>
            <p className="result-label">Recommendation</p>
            <h2>{verdictLabel(result.verdict)}</h2>
          </div>
          <p>{verdictDescription(result.verdict, profile.amountWanted, result.safeRange.max)}</p>
        </section>

        <section className="result-grid result-grid-amounts">
          <ResultPanel eyebrow="01 / Amount" title="Two maximums">
            <div className="amount-pair">
              <div><span>Likely lender range</span><strong>{formatRange(result.lenderRange)}</strong></div>
              <div className="amount-safe"><span>Safe borrower range</span><strong>{formatRange(result.safeRange)}</strong></div>
            </div>
            <p className="panel-note">Negotiate around the safe borrower range, not only the amount a lender may offer.</p>
          </ResultPanel>
          <ResultPanel eyebrow="02 / Monthly cost" title="Your EMI ceiling">
            <div className="big-number">{formatCurrency(result.emiCeiling)}<small>/ month</small></div>
            <p className="panel-note">This ceiling keeps existing debt, household expenses, and a basic buffer in view.</p>
          </ResultPanel>
        </section>

        <section className="result-grid result-grid-details">
          <ResultPanel eyebrow="03 / Price" title="Fair rate and all-in cost">
            <div className="detail-line"><span>Fair rate</span><strong>{formatRateRange(result.fairRate)}</strong></div>
            <div className="detail-line"><span>Estimated all-in APR</span><strong>{formatRateRange(result.estimatedApr)}</strong></div>
            <p className="estimate-note">Estimated only. Ask the lender for the official KFS and complete cost schedule.</p>
          </ResultPanel>
          <ResultPanel eyebrow="04 / Resilience" title="Stress case">
            <div className={`stress-state ${result.stressTest.passes ? "stress-pass" : "stress-fail"}`}>
              <span>{result.stressTest.passes ? "Pass" : "Review"}</span>
              <strong>Income falls by 20%</strong>
            </div>
            <p className="panel-note">{result.stressTest.result}</p>
          </ResultPanel>
        </section>

        <section className="result-grid result-grid-lower">
          <ResultPanel eyebrow="What shaped this" title="Reasons behind the range">
            <ul className="reason-list">
              {result.reasons.slice(0, 6).map((reason) => <li key={reason}>{reason}</li>)}
            </ul>
            {result.validationWarnings?.map((warning) => <p className="warning-line" key={warning}>{warning}</p>)}
          </ResultPanel>
          <ResultPanel eyebrow="Tenure trade-off" title="Same amount, different month">
            {tenureOptions.length > 0 ? (
              <div className="tenure-list">
                {tenureOptions.map((option) => (
                  <div className="tenure-line" key={option.months}>
                    <span>{option.months / 12} years</span>
                    <strong>{formatCurrency(option.emi)}</strong>
                    <small>{formatCurrency(option.totalInterest)} interest</small>
                  </div>
                ))}
              </div>
            ) : <p className="panel-note">No safe amount is available for a tenure comparison.</p>}
          </ResultPanel>
        </section>

        <div className="results-actions">
          <Link className="button button-primary" href="/assessment">Start another assessment <span aria-hidden="true">→</span></Link>
          <Link className="button button-quiet" href="/assessment">Review answers</Link>
        </div>
        <p className="results-disclaimer">Borrower-side decision support. This is not a lender approval, credit score, or financial advice.</p>
      </div>
    </main>
  );
}

function ResultsHeader() {
  return (
    <header className="site-header">
      <Link className="brand" href="/"><span className="brand-mark">BC</span><span>Borrower Copilot</span></Link>
      <span className="header-note">Your numbers stay in this session</span>
    </header>
  );
}

function ResultPanel({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return <section className="result-panel"><p className="eyebrow">{eyebrow}</p><h2>{title}</h2>{children}</section>;
}

function getTenureOptions(amount: number, annualRate: number, maximumMonths: number) {
  if (amount <= 0) return [];
  const candidates = [...new Set([Math.min(36, maximumMonths), Math.min(60, maximumMonths), maximumMonths])].sort((a, b) => a - b);
  return candidates.map((months) => {
    const emi = calculateEmi(amount, annualRate, months);
    return { months, emi, totalInterest: emi * months - amount };
  });
}

function verdictLabel(verdict: BorrowerResult["verdict"]) {
  if (verdict === "BORROW_LESS") return "BORROW LESS";
  if (verdict === "DON'T_BORROW") return "DON'T BORROW NOW";
  return "BORROW, WITH A PLAN";
}

function verdictClass(verdict: BorrowerResult["verdict"]) {
  if (verdict === "BORROW_LESS") return "verdict-borrow-less";
  if (verdict === "DON'T_BORROW") return "verdict-dont-borrow";
  return "verdict-borrow";
}

function verdictDescription(verdict: BorrowerResult["verdict"], requested: number, safe: number) {
  if (verdict === "BORROW_LESS") return `${formatCurrency(requested)} may be financeable, but the safer modeled amount is closer to ${formatCurrency(safe)}.`;
  if (verdict === "DON'T_BORROW") return "Your current cash flow or repayment signals make adding new debt too fragile right now.";
  return "The requested amount sits within the modeled safe range. Keep the EMI ceiling as your boundary.";
}

function formatCurrency(value: number) { return `₹${Math.round(value).toLocaleString("en-IN")}`; }
function formatRange(range: { min: number; max: number }) { return `${formatCurrency(range.min)} – ${formatCurrency(range.max)}`; }
function formatRateRange(range: { min: number; max: number }) { return `${(range.min * 100).toFixed(1)}% – ${(range.max * 100).toFixed(1)}%`; }