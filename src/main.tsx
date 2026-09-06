import "@fontsource-variable/fredoka";
import "@fontsource-variable/nunito-sans";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { registerServiceWorker } from "./registerServiceWorker";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

void registerServiceWorker();
