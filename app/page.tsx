import Link from "next/link";

export default function Home() {
  return (
    <main className="landing-page">
      <header className="site-header">
        <Link className="brand" href="/">
          <span className="brand-mark">BC</span>
          <span>Borrower Copilot</span>
        </Link>
        <span className="header-note">Decision support, not approval</span>
      </header>
      <section className="hero-shell">
        <div className="hero-copy">
          <p className="eyebrow">For the borrower, before the lender</p>
          <h1>Know what you can carry before you ask what you can get.</h1>
          <p className="hero-description">
            A private, borrower-first self-assessment that separates a likely
            lender range from a safer monthly commitment.
          </p>
          <Link className="button button-primary hero-button" href="/assessment">
            Start my assessment <span aria-hidden="true">→</span>
          </Link>
          <p className="hero-footnote">Takes about 3 minutes · No account · No saved personal data</p>
        </div>
        <div className="hero-visual" aria-label="A preview of the borrower decision framework">
          <div className="visual-label">Your borrowing brief</div>
          <div className="visual-number">02</div>
          <div className="visual-rule" />
          <div className="visual-row"><span>Lender may consider</span><strong>₹8.0L</strong></div>
          <div className="visual-row visual-row-safe"><span>You may safely carry</span><strong>₹6.2L</strong></div>
          <div className="visual-caption">The useful answer is not always the larger number.</div>
        </div>
      </section>
      <section className="principles" aria-label="What the assessment covers">
        <div><span>01</span><strong>Borrow or wait</strong><p>See the reason behind the recommendation.</p></div>
        <div><span>02</span><strong>Two maximums</strong><p>Compare lender appetite with safe capacity.</p></div>
        <div><span>03</span><strong>Fair cost</strong><p>Look beyond the headline interest rate.</p></div>
      </section>
      <footer className="landing-footer">
        <span>Prototype for decision support</span>
        <span>Ranges over false precision</span>
      </footer>
    </main>
  );
}
