import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@design-system/tokens.css";
import "@design-system/components/bundle.css";
import "./styles/app.css";
import { App } from "./App";
import { AnswersProvider } from "./state/answers";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element");

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <AnswersProvider>
        <App />
      </AnswersProvider>
    </BrowserRouter>
  </StrictMode>,
);
