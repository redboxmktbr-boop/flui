import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/poppins/latin-400.css";
import "@fontsource/poppins/latin-500.css";
import "@fontsource/poppins/latin-600.css";
import "@fontsource/poppins/latin-700.css";
import App from "./App";
import "./style.css";
import "./brand.css";
import "./experience.css";
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        const notify = () => window.dispatchEvent(new Event("flui-update"));
        if (reg.waiting) notify();
        reg.addEventListener("updatefound", () =>
          reg.installing?.addEventListener("statechange", () => {
            if (reg.waiting && navigator.serviceWorker.controller) notify();
          }),
        );
      })
      .catch(() => {
        /* The app remains usable if the browser blocks installation. */
      });
  });
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
