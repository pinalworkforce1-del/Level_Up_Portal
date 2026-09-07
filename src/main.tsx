import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { prepareJourneyBridge } from "./journeyBridge";
import "./styles.css";
import "./journey-fixes.css";

async function bootstrap() {
  try { await prepareJourneyBridge(); } catch { /* Portal still loads if reconciliation is unavailable. */ }
  createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
}

bootstrap();
