import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { isEmbedded } from "./embed";
import "./styles.css";

if (isEmbedded()) document.documentElement.classList.add("is-embedded");

const root = document.getElementById("root");
if (!root) throw new Error("Missing root element");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
