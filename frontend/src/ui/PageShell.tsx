import type { ReactNode } from "react";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <main className="app-shell">
      <div className="site-page-shell">
        {children}
      </div>
    </main>
  );
}
