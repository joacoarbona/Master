import { Component, Suspense, lazy, useEffect, useState, type ReactNode } from "react";
import ElGabinete from "./ElGabinete";
import PartyGamesMenu from "./PartyGamesMenu";
import ProjectsMenu from "./ProjectsMenu";

/**
 * Rutas:
 *   #/            → El Gabinete (portada)
 *   #/proyectos   → hub de proyectos
 *   #/fiesta      → hub de la fiesta
 *   #/app/<id>    → componente React del registro APPS
 *
 * Para añadir una app React nueva:
 *   1. copia el .jsx/.tsx a src/works/
 *   2. añade una línea al registro APPS
 *   3. añade su tile en ElGabinete.tsx o ProjectsMenu.tsx con href "#/app/<id>"
 */

const APPS: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  "dcos-navigator": lazy(() => import("./works/DCOSNavigator.jsx")),
  "atlas": lazy(() => import("./works/AtlasEnterprise.jsx")),
  "tycoon": lazy(() => import("./works/AIProductTycoon.jsx")),
  "hipoteca": lazy(() => import("./works/MortgageSimulator.jsx")),
  "healthcare-thesis": lazy(() => import("./works/HealthcareThesis")),
  "healthcare-ira": lazy(() => import("./works/HealthcareIRA")),
  "blondie-macro": lazy(() => import("./works/BlondieMacro")),
  "iq-markets": lazy(() => import("./works/IQMarkets.jsx")),
  "bridge": lazy(() => import("./works/Bridge.jsx")),
  "slidebuilder": lazy(() => import("./works/SlideBuilder.jsx")),
  "postlabor": lazy(() => import("./works/Postlabor.jsx")),
};

type Route = { kind: "gabinete" | "fiesta" | "proyectos" } | { kind: "app"; id: string };

function routeFromHash(): Route {
  const h = window.location.hash;
  const app = h.match(/^#\/app\/([\w-]+)/);
  if (app && APPS[app[1]]) return { kind: "app", id: app[1] };
  if (h.startsWith("#/fiesta")) return { kind: "fiesta" };
  if (h.startsWith("#/proyectos")) return { kind: "proyectos" };
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
        <nav style={NAV_STYLE}><a style={LINK_STYLE} href="#/">← Gabinete</a></nav>
        <ErrorBoundary>
          <Suspense fallback={<div style={{ padding: 40, fontFamily: "monospace" }}>Cargando…</div>}>
            <LazyApp />
          </Suspense>
        </ErrorBoundary>
      </>
    );
  }

  return (
    <>
      <nav style={NAV_STYLE}>
        <a style={LINK_STYLE} href="#/">Gabinete</a>
        <a style={LINK_STYLE} href="#/proyectos">Proyectos</a>
        <a style={LINK_STYLE} href="#/fiesta">Fiesta</a>
      </nav>
      {route.kind === "gabinete" && <ElGabinete autoFocus={false} />}
      {route.kind === "fiesta" && <PartyGamesMenu autoFocus={false} />}
      {route.kind === "proyectos" && <ProjectsMenu autoFocus={false} />}
    </>
  );
}
