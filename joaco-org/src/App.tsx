import { useEffect, useState } from "react";
import ElGabinete from "./ElGabinete";
import PartyGamesMenu from "./PartyGamesMenu";
import ProjectsMenu from "./ProjectsMenu";

/**
 * Enrutado mínimo por hash, sin dependencias:
 *   joaco.org/            → El Gabinete (portada)
 *   joaco.org/#/fiesta    → Juegos de la fiesta
 *   joaco.org/#/proyectos → Proyectos (Wayra, Cybercab…)
 *
 * Los tiles enlazan a HTML estáticos en /public, así que se abren
 * directamente sin pasar por React.
 */

type Route = "gabinete" | "fiesta" | "proyectos";

function routeFromHash(): Route {
  const h = window.location.hash;
  if (h.startsWith("#/fiesta")) return "fiesta";
  if (h.startsWith("#/proyectos")) return "proyectos";
  return "gabinete";
}

const NAV_STYLE: React.CSSProperties = {
  position: "fixed",
  top: 10,
  right: 14,
  zIndex: 100,
  display: "flex",
  gap: 8,
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 12,
};

const LINK_STYLE: React.CSSProperties = {
  color: "#eee7d6",
  background: "rgba(0,0,0,.35)",
  border: "1px solid rgba(255,255,255,.25)",
  borderRadius: 8,
  padding: "4px 10px",
  textDecoration: "none",
};

export default function App() {
  const [route, setRoute] = useState<Route>(routeFromHash);

  useEffect(() => {
    const onHash = () => setRoute(routeFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return (
    <>
      <nav style={NAV_STYLE}>
        <a style={LINK_STYLE} href="#/">Gabinete</a>
        <a style={LINK_STYLE} href="#/proyectos">Proyectos</a>
        <a style={LINK_STYLE} href="#/fiesta">Fiesta</a>
      </nav>
      {route === "gabinete" && <ElGabinete autoFocus={false} />}
      {route === "fiesta" && <PartyGamesMenu autoFocus={false} />}
      {route === "proyectos" && <ProjectsMenu autoFocus={false} />}
    </>
  );
}
