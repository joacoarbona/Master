import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";

/**
 * PartyGamesMenu — React + TypeScript port of the "Centro de Juegos" hub
 * (originally index.html).
 *
 * Keeps the original look (gradient backdrop, animated tiles) and the full
 * arrow-key / gamepad navigation, which is handy for Fire TV / casting.
 *
 * Navigation is decoupled: pass `onSelect` to integrate with your router
 * (react-router, a state machine, etc.). If you don't, the tiles fall back to
 * plain anchors using each game's `href`.
 */

export type TileColor = "c1" | "c2" | "c3" | "c4";

export interface PartyGame {
  id: string;
  emoji: string;
  title: string;
  description: string;
  color: TileColor;
  /** Optional URL — used only when `onSelect` is NOT provided. */
  href?: string;
}

export interface PartyGamesMenuProps {
  title?: string;
  subtitle?: string;
  footer?: string;
  games?: PartyGame[];
  /**
   * Called when a tile is activated (click or Enter).
   * If provided, it takes precedence over the tile's `href`.
   */
  onSelect?: (game: PartyGame) => void;
  /** Focus the first tile on mount (default: true). */
  autoFocus?: boolean;
}

export const DEFAULT_GAMES: PartyGame[] = [
  { id: "quien-dijo-que", emoji: "🕵️", title: "¿Quién dijo qué?", description: "Concurso sobre las invitadas", color: "c1", href: "/fiesta/quien-dijo-que.html" },
  { id: "bingo", emoji: "🎱", title: "Bingo", description: "Bingo 1–90 con voz", color: "c2", href: "/fiesta/bingo.html" },
  { id: "memoria-fotos", emoji: "📸", title: "Memoria", description: "Parejas con fotos", color: "c3", href: "/fiesta/memoria-fotos.html" },
  { id: "adivina-foto", emoji: "🔍", title: "¿Quién es?", description: "Adivina la foto", color: "c4", href: "/fiesta/adivina-foto.html" },
  { id: "mimica", emoji: "🎭", title: "Mímica", description: "Contrarreloj por equipos", color: "c2", href: "/fiesta/mimica.html" },
  { id: "ruleta", emoji: "🎡", title: "La Ruleta", description: "Sorteos y turnos", color: "c1", href: "/fiesta/ruleta.html" },
  { id: "quiz", emoji: "🎂", title: "Quiz", description: "Preguntas de la cumpleañera", color: "c3", href: "/fiesta/quiz-cumpleanera.html" },
  { id: "princesas-magicas", emoji: "🧚", title: "Princesas Mágicas", description: "Fondo + princesa + tu cara", color: "c4", href: "/fiesta/princesas-magicas.html" },
  { id: "ruleta-letras", emoji: "🔤", title: "Ruleta de Letras", description: "Letra aleatoria con historial", color: "c2", href: "/fiesta/ruleta-letras.html" },
];

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Baloo+2:wght@700;800&display=swap');

.pgm-root{
  font-family:'Fredoka',sans-serif;color:#fff;min-height:100vh;overflow:hidden;
  display:flex;flex-direction:column;padding:clamp(10px,2vh,22px) clamp(12px,2vw,30px);
  background:
    radial-gradient(circle at 12% 15%, rgba(255,210,63,.32), transparent 40%),
    radial-gradient(circle at 88% 18%, rgba(38,215,174,.32), transparent 42%),
    radial-gradient(circle at 82% 92%, rgba(255,95,162,.4), transparent 46%),
    linear-gradient(135deg,#5b21b6,#7b3ff2 55%,#9d4edd);
}
.pgm-root *{box-sizing:border-box;}
.pgm-root header{text-align:center;margin-bottom:clamp(8px,1.5vh,16px);flex:none;}
.pgm-root h1{
  font-family:'Baloo 2';font-weight:800;font-size:clamp(24px,5vh,52px);line-height:1;margin:0;
  text-shadow:0 4px 0 rgba(123,63,242,.6),0 10px 26px rgba(0,0,0,.35);
}
.pgm-root .pgm-sub{opacity:.92;margin-top:4px;font-size:clamp(13px,2vh,18px);}
.pgm-grid{
  flex:1;min-height:0;display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:1fr;
  gap:clamp(8px,1.5vh,18px);width:100%;max-width:1200px;margin:0 auto;
}
.pgm-tile{
  display:flex;flex-direction:column;gap:2px;align-items:flex-start;justify-content:center;
  text-decoration:none;color:#fff;border-radius:20px;padding:clamp(12px,2.2vh,26px);overflow:hidden;
  border:3px solid rgba(255,255,255,.25);background:rgba(255,255,255,.1);
  transition:transform .15s, box-shadow .15s, background .15s;outline:none;cursor:pointer;
}
.pgm-tile .pgm-emoji{font-size:clamp(26px,4.5vh,50px);line-height:1;}
.pgm-tile .pgm-title{font-family:'Baloo 2';font-weight:800;font-size:clamp(16px,2.6vh,26px);line-height:1.05;}
.pgm-tile .pgm-desc{font-size:clamp(11px,1.7vh,15px);opacity:.9;line-height:1.1;}
.pgm-tile:hover,.pgm-tile:focus,.pgm-tile.is-focused{
  transform:scale(1.04);background:rgba(255,255,255,.22);
  box-shadow:0 0 0 4px #ffd23f, 0 10px 26px rgba(0,0,0,.4);
}
.pgm-tile.c1{background:linear-gradient(160deg,rgba(255,126,182,.5),rgba(255,95,162,.25));}
.pgm-tile.c2{background:linear-gradient(160deg,rgba(63,189,242,.5),rgba(38,215,174,.25));}
.pgm-tile.c3{background:linear-gradient(160deg,rgba(255,210,63,.5),rgba(255,140,66,.25));}
.pgm-tile.c4{background:linear-gradient(160deg,rgba(157,78,221,.5),rgba(123,63,242,.25));}
.pgm-foot{flex:none;text-align:center;font-size:clamp(11px,1.6vh,14px);opacity:.8;margin-top:clamp(6px,1.2vh,12px);}
@media (max-width:760px){
  .pgm-root{height:auto;min-height:100vh;overflow:auto;}
  .pgm-grid{grid-template-columns:repeat(2,1fr);grid-auto-rows:minmax(110px,1fr);}
}
`;

export default function PartyGamesMenu({
  title = "🎉 Juegos de la Fiesta",
  subtitle = "Flechas del mando para moverte · OK para abrir · Atrás para volver",
  footer = "Para los juegos donde se toca (marcar aciertos, cargar fotos) va mejor castear desde el móvil.",
  games = DEFAULT_GAMES,
  onSelect,
  autoFocus = true,
}: PartyGamesMenuProps) {
  const [focused, setFocused] = useState(0);
  const tileRefs = useRef<Array<HTMLAnchorElement | null>>([]);

  // How many tiles fit per row, measured from the live layout (matches original).
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
      const next = Math.max(0, Math.min(games.length - 1, i));
      setFocused(next);
      tileRefs.current[next]?.focus();
    },
    [games.length],
  );

  // Arrow-key / Enter navigation across the grid.
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

  const handleActivate = (e: MouseEvent<HTMLAnchorElement>, game: PartyGame, i: number) => {
    setFocused(i);
    if (onSelect) {
      e.preventDefault();
      onSelect(game);
    }
    // else: let the anchor navigate via its href
  };

  return (
    <div className="pgm-root">
      <style>{STYLES}</style>

      <header>
        <h1>{title}</h1>
        <div className="pgm-sub">{subtitle}</div>
      </header>

      <div className="pgm-grid" role="menu">
        {games.map((game, i) => (
          <a
            key={game.id}
            ref={(el) => { tileRefs.current[i] = el; }}
            className={`pgm-tile ${game.color}${i === focused ? " is-focused" : ""}`}
            href={game.href ?? "#"}
            role="menuitem"
            tabIndex={i === focused ? 0 : -1}
            onMouseEnter={() => setFocused(i)}
            onClick={(e) => handleActivate(e, game, i)}
          >
            <span className="pgm-emoji">{game.emoji}</span>
            <span className="pgm-title">{game.title}</span>
            <span className="pgm-desc">{game.description}</span>
          </a>
        ))}
      </div>

      <div className="pgm-foot">{footer}</div>
    </div>
  );
}
