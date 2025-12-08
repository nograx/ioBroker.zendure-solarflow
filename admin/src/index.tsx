import React from "react";
import { createRoot } from "react-dom/client";
import "../style.css";
import App from "./app";

declare global {
  interface Window {
    sentryDSN: string;
    adapterName: string | undefined;
  }
}

window.adapterName = "zendure-solarflow";

const container = window.document.getElementById("root");

if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
