import { Outlet } from "@tanstack/react-router";
import { useAppErrorState } from "./ErrorContext";
import { AppHeader } from "./AppHeader";

export default function AppShell() {
  const error = useAppErrorState();
  return (
    <>
      <AppHeader />
      {error ? (
        <div className="mt-[18px] rounded-2xl border border-[var(--color-negative-border)] bg-[var(--color-negative-soft)] text-[var(--color-text-primary)] px-4 py-[14px]">
          {error}
        </div>
      ) : null}
      <main className="app-shell">
        <Outlet />
      </main>
    </>
  );
}
