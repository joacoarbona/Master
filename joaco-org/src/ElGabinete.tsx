import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";

/**
 * ElGabinete — single-file launcher for Joaquín's standalone HTML tools.
 *
 * Drop this .tsx next to the HTML files on your domain and render it from
 * App.tsx. Six real entries + five reserved slots; edit DEFAULT_WORKS to
 * add or rename. Pass `onSelect` to intercept navigation (router), or leave
 * it out and tiles open their `href` directly.
 *
 * Design notes: ink-blue study, brass accents, Fraunces display over Sora
 * body, and a heraldic seal (SVG lozenge with the work's initial) as the
 * signature element. Arrow-key / remote navigation kept from the other hubs.
 */

export type WorkKind = "dossier" | "simulador" | "herramienta" | "juego";

export interface Work {
  id: string;
  title: string;
  description: string;
  kind: WorkKind;
  /** Initial shown inside the heraldic seal. */
  initial: string;
  /** Relative URL of the standalone HTML file. */
  href?: string;
  /** Reserved slot: dimmed, focusable, inert. */
  placeholder?: boolean;
}

const slot = (n: number): Work => ({
  id: `reservado-${n}`,
  title: "Reservado",
  description: "Hueco para el próximo trabajo",
  kind: "herramienta",
  initial: "·",
  placeholder: true,
});

export const DEFAULT_WORKS: Work[] = [
  {
    id: "bpo-zero-based",
    title: "BPO Zero-Based Operating Plan",
    description: "Marco operativo base cero para OBU",
    kind: "dossier",
    initial: "B",
    href: "/gabinete/bpo-zero-based-operating-plan.html",
  },
  {
    id: "data-leadership",
    title: "Data Project Leadership",
    description: "Dossier de liderazgo de proyectos de datos",
    kind: "dossier",
    initial: "D",
    href: "/gabinete/data-project-leadership-dossier.html",
  },
  {
    id: "aic-bbu",
    title: "AIC · BBU Senior Director",
    description: "Dossier de preparación del rol",
    kind: "dossier",
    initial: "A",
    href: "/gabinete/aic-bbu-senior-director-dossier.html",
  },
  {
    id: "progmgmt-navigator",
    title: "ProgMgmt Navigator",
    description: "Navegador de program management",
    kind: "herramienta",
    initial: "N",
    href: "/gabinete/progmgmt-navigator.html",
  },
  {
    id: "pension-fire",
    title: "FIRE & Convenio Especial",
    description: "Simulador de pensión y cese anticipado",
    kind: "simulador",
    initial: "F",
    href: "/gabinete/pension_simulator.html",
  },
  {
    id: "rescate-princesa",
    title: "Rescate de la Princesa",
    description: "Laberinto — para Constanza y Casilda",
    kind: "juego",
    initial: "P",
    href: "/gabinete/rescate-princesa-laberinto.html",
  },
  {
    id: "dcos-navigator",
    title: "DCOS Navigator",
    description: "Sistema operativo del equipo PM",
    kind: "herramienta",
    initial: "C",
    href: "#/app/dcos-navigator",
  },
  {
    id: "atlas",
    title: "Atlas Enterprise",
    description: "Inteligencia de portfolio multi-agente",
    kind: "herramienta",
    initial: "T",
    href: "#/app/atlas",
  },
    {
    id: "Innovation",
    title: "Innovation application",
    description: "Dossier for innovation",
    kind: "dossier",
    initial: "I",
    href: "/gabinete/innovation.html",
  },
    {
    id: "python_lean",
    title: "Python and Lean",
    description: "Python learning and Lean basics",
    kind: "dossier",
    initial: "P",
    href: "/gabinete/python_lean.html",
  },
      {
    id: "Bridge",
    title: "Bridge",
    description: "Bridge",
    kind: "herramienta",
    initial: "B",
    href: "#/app/bridge",
  },
       {
    id: "SlideBuilder",
    title: "SlideBuilder",
    description: "Bridge",
    kind: "herramienta",
    initial: "S",
    href: "#/app/SlideBuilder",
  },
  slot(5),
];

const KIND_LABEL: Record<WorkKind, string> = {
  dossier: "Dossier",
  simulador: "Simulador",
  herramienta: "Herramienta",
  juego: "Juego",
};

/* Seal tint per kind — quiet variations on brass, not a rainbow. */
const KIND_TINT: Record<WorkKind, string> = {
  dossier: "#c9a64e", // brass
  simulador: "#8fb8a8", // verdigris
  herramienta: "#a9b4d4", // steel
  juego: "#c98a93", // faded carmine
};

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,650&family=Sora:wght@400;600&family=IBM+Plex+Mono:wght@400;500&display=swap');

.gab-root{
  --ink:#11182e; --panel:#19223e; --panel-hi:#202b4d;
  --line:rgba(201,166,78,.28); --brass:#c9a64e;
  --text:#eee7d6; --muted:#98a1bd;
  min-height:100vh; background:
    radial-gradient(1100px 500px at 80% -10%, rgba(201,166,78,.07), transparent 60%),
    var(--ink);
  color:var(--text); font-family:'Sora',sans-serif;
  display:flex; flex-direction:column;
  padding:clamp(20px,4vh,48px) clamp(16px,4vw,56px) clamp(24px,4vh,48px);
}
.gab-root *{box-sizing:border-box;}

.gab-head{flex:none; max-width:1180px; width:100%; margin:0 auto;
  display:flex; align-items:flex-end; justify-content:space-between; gap:18px; flex-wrap:wrap;
  border-bottom:1px solid var(--line); padding-bottom:clamp(14px,2.4vh,24px);}
.gab-title h1{
  font-family:'Fraunces',serif; font-weight:650; margin:0;
  font-size:clamp(30px,5vh,52px); line-height:1.02; letter-spacing:.01em;
}
.gab-title h1 em{font-style:italic; color:var(--brass);}
.gab-title .gab-sub{margin-top:8px; color:var(--muted); font-size:clamp(12px,1.8vh,15px); max-width:52ch;}
.gab-count{font-family:'IBM Plex Mono',monospace; font-size:12px; color:var(--muted);
  text-transform:uppercase; letter-spacing:.14em; white-space:nowrap; padding-bottom:6px;}
.gab-count b{color:var(--brass); font-weight:500;}

.gab-grid{
  flex:1; width:100%; max-width:1180px; margin:clamp(16px,3vh,30px) auto 0;
  display:grid; grid-template-columns:repeat(auto-fill,minmax(250px,1fr));
  gap:clamp(10px,1.8vh,18px); align-content:start;
}

.gab-tile{
  position:relative; display:flex; gap:14px; align-items:center;
  text-decoration:none; color:var(--text);
  background:var(--panel); border:1px solid rgba(255,255,255,.07);
  border-radius:14px; padding:clamp(14px,2vh,20px);
  transition:transform .16s ease, border-color .16s ease, background .16s ease;
  outline:none; cursor:pointer; min-height:96px;
}
.gab-tile::after{ /* brass hairline that extends on focus */
  content:""; position:absolute; left:16px; right:auto; bottom:10px; height:1px;
  width:26px; background:var(--tint,var(--brass)); opacity:.55;
  transition:width .22s ease, opacity .22s ease;
}
.gab-tile:hover, .gab-tile:focus-visible, .gab-tile.is-focused{
  transform:translateY(-2px); background:var(--panel-hi); border-color:var(--line);
}
.gab-tile:hover::after, .gab-tile:focus-visible::after, .gab-tile.is-focused::after{
  width:calc(100% - 32px); opacity:.9;
}
.gab-tile:focus-visible{box-shadow:0 0 0 2px var(--brass);}

.gab-seal{flex:none; width:54px; height:62px; display:block;}
.gab-tile:hover .gab-seal, .gab-tile.is-focused .gab-seal{filter:drop-shadow(0 0 6px rgba(201,166,78,.35));}

.gab-meta{min-width:0;}
.gab-kind{
  font-family:'IBM Plex Mono',monospace; font-size:10.5px; letter-spacing:.16em;
  text-transform:uppercase; color:var(--tint,var(--brass)); margin-bottom:4px;
}
.gab-name{
  font-family:'Fraunces',serif; font-weight:650; font-size:clamp(16px,2.2vh,19px);
  line-height:1.12; margin-bottom:4px;
}
.gab-desc{color:var(--muted); font-size:12.5px; line-height:1.35;}

.gab-tile.is-placeholder{
  background:transparent; border:1px dashed rgba(255,255,255,.16);
  color:var(--muted); cursor:default;
}
.gab-tile.is-placeholder::after{display:none;}
.gab-tile.is-placeholder:hover, .gab-tile.is-placeholder.is-focused{
  transform:none; background:rgba(255,255,255,.03); border-color:rgba(201,166,78,.4);
}
.gab-tile.is-placeholder .gab-name{color:var(--muted);}

.gab-foot{flex:none; max-width:1180px; width:100%; margin:clamp(14px,2.6vh,26px) auto 0;
  border-top:1px solid rgba(255,255,255,.07); padding-top:12px;
  display:flex; justify-content:space-between; gap:14px; flex-wrap:wrap;
  color:var(--muted); font-size:12px;}
.gab-foot kbd{
  font-family:'IBM Plex Mono',monospace; font-size:11px;
  border:1px solid rgba(255,255,255,.2); border-radius:5px; padding:1px 6px;
  background:rgba(255,255,255,.05); color:var(--text);
}

@media (max-width:560px){
  .gab-grid{grid-template-columns:1fr;}
}
@media (prefers-reduced-motion:reduce){
  .gab-tile, .gab-tile::after{transition:none;}
  .gab-tile:hover, .gab-tile.is-focused{transform:none;}
}
`;

/** Heraldic lozenge seal with the work's initial. */
function Seal({ initial, tint, dim }: { initial: string; tint: string; dim?: boolean }) {
  const stroke = dim ? "rgba(255,255,255,.22)" : tint;
  const fill = dim ? "transparent" : "rgba(255,255,255,.03)";
  return (
    <svg className="gab-seal" viewBox="0 0 54 62" aria-hidden="true">
      {/* shield outline */}
      <path
        d="M27 3 L48 10 V32 C48 45 39 54 27 59 C15 54 6 45 6 32 V10 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.6"
      />
      {/* inner hairline */}
      <path
        d="M27 8.5 L43.5 14 V31.5 C43.5 42 36.5 49.5 27 53.8 C17.5 49.5 10.5 42 10.5 31.5 V14 Z"
        fill="none"
        stroke={stroke}
        strokeWidth="0.8"
        opacity="0.55"
      />
      <text
        x="27"
        y="36"
        textAnchor="middle"
        fontFamily="Fraunces, serif"
        fontWeight="650"
        fontSize="22"
        fill={stroke}
      >
        {initial}
      </text>
    </svg>
  );
}

export interface ElGabineteProps {
  works?: Work[];
  /** Fired for real tiles; overrides href navigation. */
  onSelect?: (work: Work) => void;
  autoFocus?: boolean;
}

export default function ElGabinete({
  works = DEFAULT_WORKS,
  onSelect,
  autoFocus = true,
}: ElGabineteProps) {
  const [focused, setFocused] = useState(0);
  const tileRefs = useRef<Array<HTMLAnchorElement | null>>([]);

  const realCount = works.filter((w) => !w.placeholder).length;

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
      const next = Math.max(0, Math.min(works.length - 1, i));
      setFocused(next);
      tileRefs.current[next]?.focus();
    },
    [works.length],
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

  const handleActivate = (e: MouseEvent<HTMLAnchorElement>, work: Work, i: number) => {
    setFocused(i);
    if (work.placeholder) {
      e.preventDefault();
      return;
    }
    if (onSelect) {
      e.preventDefault();
      onSelect(work);
    }
  };

  return (
    <div className="gab-root">
      <style>{STYLES}</style>

      <header className="gab-head">
        <div className="gab-title">
          <h1>
            El <em>Gabinete</em>
          </h1>
          <div className="gab-sub">
            Dossiers, simuladores y herramientas — cada pieza es un HTML
            independiente que se abre desde aquí.
          </div>
        </div>
        <div className="gab-count">
          <b>{realCount}</b> trabajos · {works.length - realCount} reservados
        </div>
      </header>

      <div className="gab-grid" role="menu">
        {works.map((work, i) => {
          const tint = KIND_TINT[work.kind];
          return (
            <a
              key={work.id}
              ref={(el) => { tileRefs.current[i] = el; }}
              className={
                "gab-tile" +
                (i === focused ? " is-focused" : "") +
                (work.placeholder ? " is-placeholder" : "")
              }
              style={{ ["--tint" as string]: tint }}
              href={work.placeholder ? undefined : work.href ?? "#"}
              role="menuitem"
              aria-disabled={work.placeholder || undefined}
              tabIndex={i === focused ? 0 : -1}
              onMouseEnter={() => setFocused(i)}
              onClick={(e) => handleActivate(e, work, i)}
            >
              <Seal initial={work.initial} tint={tint} dim={work.placeholder} />
              <div className="gab-meta">
                <div className="gab-kind">
                  {work.placeholder ? "Reservado" : KIND_LABEL[work.kind]}
                </div>
                <div className="gab-name">{work.title}</div>
                <div className="gab-desc">{work.description}</div>
              </div>
            </a>
          );
        })}
      </div>

      <footer className="gab-foot">
        <span>
          <kbd>←</kbd> <kbd>→</kbd> <kbd>↑</kbd> <kbd>↓</kbd> moverse ·{" "}
          <kbd>Enter</kbd> abrir
        </span>
        <span>Edita DEFAULT_WORKS para sustituir los huecos reservados.</span>
      </footer>
    </div>
  );
}
