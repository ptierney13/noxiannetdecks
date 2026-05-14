import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./ui-foundation.css";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
