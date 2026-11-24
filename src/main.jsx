import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  const registerOfflineShell = () =>
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("Could not register the offline app shell:", error);
    });

  if (document.readyState === "complete") {
    void registerOfflineShell();
  } else {
    window.addEventListener("load", registerOfflineShell, { once: true });
  }
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
