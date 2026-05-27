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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>
);
