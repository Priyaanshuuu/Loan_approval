import Link from "next/link";
import AssessmentFlow from "@/components/AssessmentFlow";

export default function AssessmentPage() {
  return (
    <main className="assessment-page">
      <header className="site-header">
        <Link className="brand" href="/">
          <span className="brand-mark">BC</span>
          <span>Borrower Copilot</span>
        </Link>
        <span className="header-note">Private in this browser session</span>
      </header>
      <div className="assessment-shell">
        <div className="assessment-intro">
          <p className="eyebrow">A calmer way to borrow</p>
          <h2>Start with your side of the deal.</h2>
          <p>
            Answer the questions that matter. We will keep lender appetite
            separate from what your monthly life can safely carry.
          </p>
        </div>
        <AssessmentFlow />
      </div>
    </main>
  );
}