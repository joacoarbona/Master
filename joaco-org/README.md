# joaco.org

SPA en React + Vite que sirve de portada (El Gabinete) y enlaza a los HTML
independientes alojados en /public.

## Estructura
- src/            → componentes React (.tsx). Se COMPILAN, nunca se suben tal cual.
- public/         → HTML autocontenidos. Se copian tal cual a la raíz del sitio.
  - /gabinete/    → dossiers, simuladores, navigator
  - /fiesta/      → juegos del cumpleaños
  - /proyectos/   → wayra, cybercab
- dist/           → resultado de `npm run build`. ESTO es lo que se publica.

## Desarrollo local
    npm install
    npm run dev        # abre http://localhost:5173

## Añadir un nuevo HTML
1. Copia el fichero a public/gabinete/ (o la carpeta que toque).
2. En src/ElGabinete.tsx sustituye un slot(n) de DEFAULT_WORKS por
   { id, title, description, kind, initial, href: "/gabinete/mi-fichero.html" }.
3. Commit y push (Vercel) o `npm run build` y re-subir dist/ (IONOS).

## Despliegue A — Vercel (recomendado)
1. Sube esta carpeta a un repositorio de GitHub.
2. En vercel.com → Add New Project → importa el repo. Vercel detecta Vite solo
   (build: `npm run build`, output: `dist`). Deploy.
3. En el proyecto → Settings → Domains → añade joaco.org.
4. En el panel DNS de IONOS, crea los registros que Vercel te indique
   (un registro A para joaco.org y un CNAME para www). NO toques el registro
   de diario.joaco.org: los subdominios son independientes y seguirá
   funcionando donde está.

## Despliegue B — IONOS (hosting estático)
1. En tu máquina: `npm install && npm run build`.
2. Sube TODO el contenido de dist/ (no la carpeta src) a la raíz web de
   joaco.org por SFTP o el gestor de archivos de IONOS.
3. Cada vez que cambies algo: repetir build y re-subir dist/.

En ambos casos las URLs quedan:
  joaco.org                          → El Gabinete
  joaco.org/#/proyectos              → hub de proyectos
  joaco.org/#/fiesta                 → hub de la fiesta
  joaco.org/gabinete/pension_simulator.html  → HTML directo (compartible)
