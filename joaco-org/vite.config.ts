import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Las versiones guardadas de los juegos (/…/v1/) solo conservan su course.json; el resto de datos es idéntico
// y se sirve desde la versión actual. En Vercel lo hace la reescritura de vercel.json; aquí, lo mismo para dev/preview.
const V1_DATA = /^\/(golf-madrid|valdecanas)\/v1\/data\/(?!course\.json(?:$|\?))(.+)$/;
const v1Rewrite = (): Plugin => {
  const mw = (req: any, _res: any, next: () => void) => { const m = V1_DATA.exec(req.url || ""); if (m) req.url = `/${m[1]}/data/${m[2]}`; next(); };
  return { name: "v1-data-rewrite", configureServer: (s) => { s.middlewares.use(mw); }, configurePreviewServer: (s) => { s.middlewares.use(mw); } };
};

export default defineConfig({
  plugins: [react(), tailwindcss(), v1Rewrite()],
});
