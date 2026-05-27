import { StrictMode, Component } from "react";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./ui-foundation.css";
import "./styles.css";

class RootErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: "2rem", fontFamily: "monospace", color: "#fff", background: "#1a0a0a" }}>
          <h2 style={{ color: "#f87171" }}>App crashed</h2>
          <pre style={{ whiteSpace: "pre-wrap", color: "#fca5a5" }}>{String(this.state.error)}</pre>
          <pre style={{ whiteSpace: "pre-wrap", color: "#7f8ea3", fontSize: "0.8em" }}>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function showCrash(message: string) {
  document.body.style.cssText = "margin:0;padding:2rem;background:#1a0a0a;font-family:monospace;color:#f87171";
  document.body.innerHTML = `<h2>App crashed</h2><pre style="white-space:pre-wrap;color:#fca5a5">${message}</pre>`;
}

window.addEventListener("error", (e) => showCrash(e.message + "\n" + (e.error?.stack ?? "")));
window.addEventListener("unhandledrejection", (e) => showCrash(String(e.reason)));

function showDiagnostics() {
  const sheets = Array.from(document.styleSheets);
  const cssInfo = sheets.map((s) => {
    try { return `${s.href ?? "(inline)"}: ${s.cssRules.length} rules`; }
    catch { return `${s.href ?? "(inline)"}: (CORS blocked)`; }
  });
  const bg = getComputedStyle(document.body).getPropertyValue("background-color");
  const appBg = getComputedStyle(document.documentElement).getPropertyValue("--color-app-bg");
  const diag = document.createElement("div");
  diag.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:99999;background:#1a0a0a;color:#fca5a5;font-family:monospace;font-size:12px;padding:8px 12px;border-bottom:2px solid #f87171";
  diag.innerHTML = `<b>CSS DIAG</b> | body bg: <b>${bg}</b> | --color-app-bg: "<b>${appBg}</b>" | sheets: ${sheets.length} | ${cssInfo.slice(0, 4).join(" | ")}`;
  document.body.prepend(diag);
}

try {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <RootErrorBoundary>
        <App />
      </RootErrorBoundary>
    </StrictMode>
  );
  // Show CSS diagnostics after React renders
  setTimeout(showDiagnostics, 500);
} catch (e) {
  showCrash(String(e) + "\n" + (e instanceof Error ? e.stack ?? "" : ""));
}
