import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GuestModeProvider } from "./lib/guestMode";
import App from "./App";
import "./index.css";

// Portfolio traffic beacon — one visit/session to the shared leaderboard sink.
if (typeof window !== "undefined" && !sessionStorage.getItem("_av_lb")) {
  sessionStorage.setItem("_av_lb", "1");
  fetch("https://azoni.ai/.netlify/functions/log-visit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source: "crypto-tax-2025" }),
  }).catch(() => {});
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <GuestModeProvider>
        <App />
      </GuestModeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
