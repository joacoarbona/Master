import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./storage-polyfill";

// Vuelta de los correos de Suscripciones (confirmar cuenta, nueva contraseña): llegan a /?sx_…=1&code=…
// sin ruta; se lleva a la app, que termina el inicio de sesión y limpia la URL.
{
  const q = new URLSearchParams(window.location.search);
  if ((q.has("sx_auth") || q.has("sx_reset")) && !window.location.hash.startsWith("#/app/suscripciones")) {
    window.history.replaceState(null, "", window.location.pathname + window.location.search + "#/app/suscripciones");
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Sin conexión: el service worker guarda lo ya visitado. Solo en producción, para no interferir al desarrollar.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => { navigator.serviceWorker.register("/sw.js").catch(() => { /* sin soporte o bloqueado */ }); });
}
