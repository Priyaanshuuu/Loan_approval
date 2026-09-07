import Link from "next/link";
import NegotiationCard from "@/components/NegotiationCard";

export default function NegotiationCardPage() {
  return (
    <main className="card-page">
      <header className="site-header no-print">
        <Link className="brand" href="/"><span className="brand-mark">BC</span><span>Borrower Copilot</span></Link>
        <span className="header-note">A conversation guide, not an approval</span>
      </header>
      <NegotiationCard />
    </main>
  );
}