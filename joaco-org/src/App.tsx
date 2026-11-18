import { Component, Suspense, lazy, useEffect, useState, type ReactNode } from "react";
import { Analytics } from "@vercel/analytics/react";
import ElGabinete from "./ElGabinete";
import PartyGamesMenu from "./PartyGamesMenu";
import ProjectsMenu from "./ProjectsMenu";
import PrivateArea, { PrivateGate } from "./PrivateArea";

/**
 * Rutas:
 *   #/            → El Gabinete (portada)
 *   #/proyectos   → hub de proyectos
 *   #/fiesta      → hub de la fiesta
 *   #/privado     → zona privada (con contraseña)
 *   #/app/<id>    → componente React del registro APPS
 *
 * Para añadir una app React nueva:
 *   1. copia el .jsx/.tsx a src/works/
 *   2. añade una línea al registro APPS
 *   3. añade su tile en ElGabinete.tsx o ProjectsMenu.tsx con href "#/app/<id>"
 */

/**
 * Tras un despliegue nuevo, una pestaña (o la app de la pantalla de inicio) que seguía abierta pide trozos
 * de código con el nombre antiguo, que ya no existen. En vez de mostrar el error, se recarga la página una
 * vez para coger la versión nueva. La marca en sessionStorage evita recargar en bucle si el fallo es otro.
 */
const RELOAD_KEY = "joaco-chunk-reload";
const isChunkError = (e: unknown) => /dynamically imported module|Importing a module script failed|error loading dynamically imported|Unable to preload CSS|Loading chunk/i.test(String((e as any)?.message || e));
function fresh<T>(load: () => Promise<T>): () => Promise<T> {
  return () => load().then(
    (m) => { try { sessionStorage.removeItem(RELOAD_KEY); } catch { /* sin almacenamiento */ } return m; },
    (e) => {
      let last = 0;
      try { last = Number(sessionStorage.getItem(RELOAD_KEY)) || 0; } catch { /* sin almacenamiento */ }
      if (isChunkError(e) && navigator.onLine !== false && Date.now() - last > 30000) {
        try { sessionStorage.setItem(RELOAD_KEY, String(Date.now())); } catch { /* sin almacenamiento */ }
        window.location.reload();
        return new Promise<T>(() => { /* la página se está recargando */ });
      }
      throw e;
    },
  );
}

const APPS: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  "dcos-navigator": lazy(fresh(() => import("./works/DCOSNavigator.jsx"))),
  "atlas": lazy(fresh(() => import("./works/AtlasEnterprise.jsx"))),
  "tycoon": lazy(fresh(() => import("./works/AIProductTycoon.jsx"))),
  "hipoteca": lazy(fresh(() => import("./works/MortgageSimulator.jsx"))),
  "healthcare-thesis": lazy(fresh(() => import("./works/HealthcareThesis"))),
  "healthcare-ira": lazy(fresh(() => import("./works/HealthcareIRA"))),
  "blondie-macro": lazy(fresh(() => import("./works/BlondieMacro"))),
  "iq-markets": lazy(fresh(() => import("./works/IQMarkets.jsx"))),
  "bridge": lazy(fresh(() => import("./works/Bridge.jsx"))),
  "slidebuilder": lazy(fresh(() => import("./works/SlideBuilder.jsx"))),
  "postlabor": lazy(fresh(() => import("./works/PostLabor.jsx"))),
  "nubes": lazy(fresh(() => import("./works/WordClouds"))),
  "suscripciones": lazy(fresh(() => import("./works/Suscripciones"))),
  "documentos": lazy(fresh(() => import("./works/Documentos"))),
  "tarareo": lazy(fresh(() => import("./works/Tarareo"))),
};

type Route = { kind: "gabinete" | "fiesta" | "proyectos" | "privado" } | { kind: "app"; id: string };

function routeFromHash(): Route {
  const h = window.location.hash;
  const app = h.match(/^#\/app\/([\w-]+)/);
  if (app && APPS[app[1]]) return { kind: "app", id: app[1] };
  if (h.startsWith("#/fiesta")) return { kind: "fiesta" };
  if (h.startsWith("#/proyectos")) return { kind: "proyectos" };
  if (h.startsWith("#/privado")) return { kind: "privado" };
  return { kind: "gabinete" };
}

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: "monospace", color: "#c33" }}>
          <h2>Esta app ha fallado al cargar</h2>
          <pre style={{ whiteSpace: "pre-wrap" }}>{String(this.state.error)}</pre>
          <p style={{ color: "#333" }}>{isChunkError(this.state.error) ? "Hay una versión nueva del sitio o no hay conexión. Recarga la página." : "Tus datos guardados no se han tocado. Prueba a recargar."}</p>
          <button onClick={() => window.location.reload()} style={{ font: "inherit", padding: "8px 14px", marginRight: 12, cursor: "pointer" }}>Recargar</button>
          <a href="#/">← Volver al Gabinete</a>
        </div>
      );
    }
    return this.props.children;
  }
}

const NAV_STYLE: React.CSSProperties = {
  position: "fixed", top: 10, right: 14, zIndex: 100,
  display: "flex", gap: 8, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12,
};
const LINK_STYLE: React.CSSProperties = {
  color: "#eee7d6", background: "rgba(0,0,0,.45)",
  border: "1px solid rgba(255,255,255,.25)", borderRadius: 8,
  padding: "4px 10px", textDecoration: "none",
};

// Inside an app the link shrinks to a round button in the bottom-left corner, clear of the app's own header.
const APP_NAV_STYLE: React.CSSProperties = {
  position: "fixed", left: "max(10px, env(safe-area-inset-left, 0px))", bottom: "max(10px, env(safe-area-inset-bottom, 0px))", zIndex: 100,
};
const APP_LINK_STYLE: React.CSSProperties = {
  display: "grid", placeItems: "center", width: 34, height: 34, borderRadius: 999,
  color: "#eee7d6", background: "rgba(0,0,0,.5)", border: "1px solid rgba(255,255,255,.3)",
  textDecoration: "none", fontFamily: "'IBM Plex Mono', monospace", fontSize: 16, lineHeight: 1,
};

export default function App() {
  const [route, setRoute] = useState<Route>(routeFromHash);

  useEffect(() => {
    const onHash = () => { setRoute(routeFromHash()); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  if (route.kind === "app") {
    const LazyApp = APPS[route.id];
    return (
      <>
        <nav style={APP_NAV_STYLE}><a style={APP_LINK_STYLE} href="#/" title="Volver al Gabinete" aria-label="Volver al Gabinete">←</a></nav>
        <ErrorBoundary>
          <Suspense fallback={<div style={{ padding: 40, fontFamily: "monospace" }}>Cargando…</div>}>
            <LazyApp />
          </Suspense>
        </ErrorBoundary>
        <Analytics />
      </>
    );
  }

  return (
    <>
      <nav style={NAV_STYLE}>
        <a style={LINK_STYLE} href="#/">Gabinete</a>
        <a style={LINK_STYLE} href="#/proyectos">Proyectos</a>
        <a style={LINK_STYLE} href="#/fiesta">Fiesta</a>
        <a style={LINK_STYLE} href="#/privado">Privado</a>
      </nav>
      {route.kind === "gabinete" && <ElGabinete autoFocus={false} />}
      {route.kind === "fiesta" && (
        <PrivateGate heading={<>La <em>fiesta</em></>} hint="Escribe la contraseña para entrar en los juegos de la fiesta.">
          {(api) => <PartyGamesMenu autoFocus={false} onSelect={(g) => api.open(g.href, g.title)} />}
        </PrivateGate>
      )}
      {route.kind === "proyectos" && <ProjectsMenu autoFocus={false} />}
      {route.kind === "privado" && <PrivateArea />}
      <Analytics />
    </>
  );
}
