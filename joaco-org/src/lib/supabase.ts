import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase compartido del portal.
 *
 * La configuración son las dos constantes de abajo (proyecto joaco-org). La clave publishable es pública
 * por diseño: sin sesión iniciada no da acceso a nada, siempre que las tablas tengan RLS.
 *
 * flowType "pkce": los enlaces de los correos (recuperar contraseña) vuelven con ?code=…
 * en vez de #access_token=…, que chocaría con las rutas #/ del portal.
 */
// Proyecto Supabase «joaco-org» (región Frankfurt). Clave publishable: pública por diseño.
const FALLBACK_URL = "https://zdlmpppkwfvtwkohwzct.supabase.co";
const FALLBACK_ANON_KEY = "sb_publishable_4M5hYAhlyWb3FlpdtMt5uQ_ZWUFROZY";

// En producción mandan siempre las constantes de arriba: una variable VITE_SUPABASE_* antigua en Vercel
// (de otro proyecto ya parado) haría que las cuentas fallaran sin que se viera por qué. Las variables de
// entorno solo se leen al desarrollar en local (npm run dev) o con VITE_SUPABASE_FORCE_ENV=1.
const env = ((import.meta as any).env || {}) as Record<string, string | boolean | undefined>;
const useEnv = env.DEV === true || env.VITE_SUPABASE_FORCE_ENV === "1";
const URL_ = String((useEnv && env.VITE_SUPABASE_URL) || FALLBACK_URL).trim();
const KEY_ = String((useEnv && env.VITE_SUPABASE_ANON_KEY) || FALLBACK_ANON_KEY).trim();
/** Identificador del proyecto, para poder comprobar a qué base de datos apunta la web publicada. */
export const supabaseRef = (/^https:\/\/([a-z0-9]+)\.supabase\.co/.exec(URL_) || [])[1] || URL_;

// https obligatorio; http solo para pruebas en local.
export const supabaseConfigured = /^(https:\/\/[^\s/]+|http:\/\/(localhost|127\.0\.0\.1)(:\d+)?)/.test(URL_) && KEY_.length > 20;

let client: SupabaseClient | null = null;
export function getSupabase(): SupabaseClient | null {
  if (!supabaseConfigured) return null;
  if (!client) client = createClient(URL_, KEY_, { auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  return client;
}
