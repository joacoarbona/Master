import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";

/**
 * ProjectsMenu — same navigation pattern as PartyGamesMenu, reused for the
 * "proyectos" section. Two real tiles (Wayra, Cybercab) plus 7 placeholder
 * slots you can fill in later by editing DEFAULT_PROJECTS.
 *
 * Placeholders are dimmed, focusable for a complete grid feel, but inert on
 * activation (no href, onSelect not fired).
 */

export type TileColor = "c1" | "c2" | "c3" | "c4";

export interface ProjectTile {
  id: string;
  emoji: string;
  title: string;
  description: string;
  color: TileColor;
  /** Optional URL — used only when `onSelect` is NOT provided. */
  href?: string;
  /** Empty slot: rendered dimmed and not actionable. */
  placeholder?: boolean;
}

export interface ProjectsMenuProps {
  title?: string;
  subtitle?: string;
  footer?: string;
  projects?: ProjectTile[];
  /** Fired when a real (non-placeholder) tile is activated. Overrides href. */
  onSelect?: (project: ProjectTile) => void;
  autoFocus?: boolean;
}

const placeholderSlot = (n: number, color: TileColor): ProjectTile => ({
  id: `slot-${n}`,
  emoji: "➕",
  title: "Próximamente",
  description: "Slot libre",
  color,
  placeholder: true,
});

export const DEFAULT_PROJECTS: ProjectTile[] = [
  { id: "wayra", emoji: "🚀", title: "Wayra Portfolio", description: "Explorador de participadas Telefónica", color: "c1", href: "/proyectos/wayra-portfolio.html" },
  { id: "cybercab", emoji: "🚕", title: "Cybercab Madrid", description: "Simulador de impacto robotaxi", color: "c2", href: "/proyectos/cybercab-madrid-simulador.html" },
  { id: "healthcare-thesis", emoji: "🏥", title: "Healthcare Thesis", description: "Simulador de tesis de inversión 2026-2032", color: "c3", href: "#/app/healthcare-thesis" },
  { id: "healthcare-ira", emoji: "💊", title: "IRA Squeeze", description: "Impacto IRA en farmacéuticas expuestas", color: "c4", href: "#/app/healthcare-ira" },
  { id: "blondie-macro", emoji: "📈", title: "Blondie Macro España", description: "Simulador macroeconómico (lente austriaca)", color: "c1", href: "#/app/blondie-macro" },
  { id: "iq-markets", emoji: "🧠", title: "IQ Markets", description: "Panel de mercados e inteligencia", color: "c2", href: "#/app/iq-markets" },
  { id: "hipoteca", emoji: "🏠", title: "Simulador Hipotecario", description: "Hipotecas España con datos BCE", color: "c3", href: "#/app/hipoteca" },
  { id: "tycoon", emoji: "🎮", title: "AI Product Tycoon", description: "Imperio Agéntico — estrategia PMO/IA", color: "c4", href: "#/app/tycoon" },
  placeholderSlot(7, "c1"),
];

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Baloo+2:wght@700;800&display=swap');

.pjm-root{
  font-family:'Fredoka',sans-serif;color:#fff;min-height:100vh;overflow:hidden;
  display:flex;flex-direction:column;padding:clamp(10px,2vh,22px) clamp(12px,2vw,30px);
  background:
    radial-gradient(circle at 12% 15%, rgba(255,210,63,.32), transparent 40%),
    radial-gradient(circle at 88% 18%, rgba(38,215,174,.32), transparent 42%),
    radial-gradient(circle at 82% 92%, rgba(255,95,162,.4), transparent 46%),
    linear-gradient(135deg,#5b21b6,#7b3ff2 55%,#9d4edd);
}
.pjm-root *{box-sizing:border-box;}
.pjm-root header{text-align:center;margin-bottom:clamp(8px,1.5vh,16px);flex:none;}
.pjm-root h1{
  font-family:'Baloo 2';font-weight:800;font-size:clamp(24px,5vh,52px);line-height:1;margin:0;
  text-shadow:0 4px 0 rgba(123,63,242,.6),0 10px 26px rgba(0,0,0,.35);
}
.pjm-root .pjm-sub{opacity:.92;margin-top:4px;font-size:clamp(13px,2vh,18px);}
.pjm-grid{
  flex:1;min-height:0;display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:1fr;
  gap:clamp(8px,1.5vh,18px);width:100%;max-width:1200px;margin:0 auto;
}
.pjm-tile{
  display:flex;flex-direction:column;gap:2px;align-items:flex-start;justify-content:center;
  text-decoration:none;color:#fff;border-radius:20px;padding:clamp(12px,2.2vh,26px);overflow:hidden;
  border:3px solid rgba(255,255,255,.25);background:rgba(255,255,255,.1);
  transition:transform .15s, box-shadow .15s, background .15s;outline:none;cursor:pointer;
}
.pjm-tile .pjm-emoji{font-size:clamp(26px,4.5vh,50px);line-height:1;}
.pjm-tile .pjm-title{font-family:'Baloo 2';font-weight:800;font-size:clamp(16px,2.6vh,26px);line-height:1.05;}
.pjm-tile .pjm-desc{font-size:clamp(11px,1.7vh,15px);opacity:.9;line-height:1.1;}
.pjm-tile:hover,.pjm-tile:focus,.pjm-tile.is-focused{
  transform:scale(1.04);background:rgba(255,255,255,.22);
  box-shadow:0 0 0 4px #ffd23f, 0 10px 26px rgba(0,0,0,.4);
}
.pjm-tile.c1{background:linear-gradient(160deg,rgba(255,126,182,.5),rgba(255,95,162,.25));}
.pjm-tile.c2{background:linear-gradient(160deg,rgba(63,189,242,.5),rgba(38,215,174,.25));}
.pjm-tile.c3{background:linear-gradient(160deg,rgba(255,210,63,.5),rgba(255,140,66,.25));}
.pjm-tile.c4{background:linear-gradient(160deg,rgba(157,78,221,.5),rgba(123,63,242,.25));}
.pjm-tile.is-placeholder{
  background:rgba(255,255,255,.06);border-style:dashed;border-color:rgba(255,255,255,.3);
  color:rgba(255,255,255,.6);cursor:default;
}
.pjm-tile.is-placeholder:hover,.pjm-tile.is-placeholder.is-focused{
  transform:none;background:rgba(255,255,255,.1);box-shadow:0 0 0 3px rgba(255,210,63,.5);
}
.pjm-foot{flex:none;text-align:center;font-size:clamp(11px,1.6vh,14px);opacity:.8;margin-top:clamp(6px,1.2vh,12px);}
@media (max-width:760px){
  .pjm-root{height:auto;min-height:100vh;overflow:auto;}
  .pjm-grid{grid-template-columns:repeat(2,1fr);grid-auto-rows:minmax(110px,1fr);}
}
`;

export default function ProjectsMenu({
  title = "🧪 Proyectos",
  subtitle = "Flechas del mando para moverte · OK para abrir · Atrás para volver",
  footer = "Edita DEFAULT_PROJECTS para sustituir los slots libres por nuevos proyectos.",
  projects = DEFAULT_PROJECTS,
  onSelect,
  autoFocus = true,
}: ProjectsMenuProps) {
  const [focused, setFocused] = useState(0);
  const tileRefs = useRef<Array<HTMLAnchorElement | null>>([]);

  const getColumns = useCallback(() => {
    const tiles = tileRefs.current.filter(Boolean) as HTMLAnchorElement[];
    if (tiles.length < 2) return 1;
    const top0 = tiles[0].offsetTop;
    let cols = 0;
    for (const t of tiles) {
      if (t.offsetTop === top0) cols++;
      else break;
    }
    return Math.max(1, cols);
  }, []);

  const moveFocus = useCallback(
    (i: number) => {
      const next = Math.max(0, Math.min(projects.length - 1, i));
      setFocused(next);
      tileRefs.current[next]?.focus();
    },
    [projects.length],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const cols = getColumns();
      switch (e.key) {
        case "ArrowRight": moveFocus(focused + 1); e.preventDefault(); break;
        case "ArrowLeft":  moveFocus(focused - 1); e.preventDefault(); break;
        case "ArrowDown":  moveFocus(focused + cols); e.preventDefault(); break;
        case "ArrowUp":    moveFocus(focused - cols); e.preventDefault(); break;
        case "Enter":      tileRefs.current[focused]?.click(); break;
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [focused, getColumns, moveFocus]);

  useEffect(() => {
    if (autoFocus) tileRefs.current[0]?.focus();
  }, [autoFocus]);

  const handleActivate = (e: MouseEvent<HTMLAnchorElement>, project: ProjectTile, i: number) => {
    setFocused(i);
    if (project.placeholder) {
      e.preventDefault();
      return;
    }
    if (onSelect) {
      e.preventDefault();
      onSelect(project);
    }
  };

  return (
    <div className="pjm-root">
      <style>{STYLES}</style>

      <header>
        <h1>{title}</h1>
        <div className="pjm-sub">{subtitle}</div>
      </header>

      <div className="pjm-grid" role="menu">
        {projects.map((project, i) => (
          <a
            key={project.id}
            ref={(el) => { tileRefs.current[i] = el; }}
            className={
              `pjm-tile ${project.color}` +
              (i === focused ? " is-focused" : "") +
              (project.placeholder ? " is-placeholder" : "")
            }
            href={project.placeholder ? undefined : project.href ?? "#"}
            role="menuitem"
            aria-disabled={project.placeholder || undefined}
            tabIndex={i === focused ? 0 : -1}
            onMouseEnter={() => setFocused(i)}
            onClick={(e) => handleActivate(e, project, i)}
          >
            <span className="pjm-emoji">{project.emoji}</span>
            <span className="pjm-title">{project.title}</span>
            <span className="pjm-desc">{project.description}</span>
          </a>
        ))}
      </div>

      <div className="pjm-foot">{footer}</div>
    </div>
  );
}
