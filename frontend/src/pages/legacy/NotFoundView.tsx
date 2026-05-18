import { useNavigate } from "@tanstack/react-router";
import type { MouseEvent } from "react";

export function NotFoundView() {
  const navigate = useNavigate();

  function handleClick(href: string) {
    return (e: MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      void navigate({ href });
    };
  }

  return (
    <section className="grid gap-5 mt-[22px] p-6 border border-[var(--border-mid)] rounded-[18px] bg-[var(--surface)] shadow-[0_16px_40px_rgba(0,0,0,0.3)] max-w-[720px]">
      <div className="section-heading">
        <p className="eyebrow">Not Found</p>
        <h1>That page does not exist</h1>
        <p>The current URL is not mapped to Cards, Deck Explorer, or one of the Tools routes.</p>
      </div>
      <nav className="view-tabs" aria-label="Recovery navigation">
        <a href="/cards" onClick={handleClick("/cards")}>Back to Cards</a>
        <a href="/deck-explorer" onClick={handleClick("/deck-explorer")}>Open Deck Explorer</a>
      </nav>
    </section>
  );
}
