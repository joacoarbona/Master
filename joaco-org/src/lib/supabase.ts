import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase compartido del portal.
 *
 * Toma la configuración de las variables de entorno de Vercel (Vite solo expone las que
 * empiezan por VITE_; se leen al compilar, así que tras cambiarlas hay que volver a desplegar):
 *   VITE_SUPABASE_URL       = https://xxxx.supabase.co
 *   VITE_SUPABASE_ANON_KEY  = eyJ… (o sb_publishable_…)
 *
 * Si no están, se usan las dos constantes de abajo (proyecto joaco-org). La clave anon/publishable es pública por
 * diseño: sin sesión iniciada no da acceso a nada, siempre que las tablas tengan RLS.
 *
 * flowType "pkce": los enlaces de los correos (recuperar contraseña) vuelven con ?code=…
 * en vez de #access_token=…, que chocaría con las rutas #/ del portal.
 */
// Proyecto Supabase «joaco-org» (región Frankfurt). Clave publishable: pública por diseño.
const FALLBACK_URL = "https://zdlmpppkwfvtwkohwzct.supabase.co";
const FALLBACK_ANON_KEY = "sb_publishable_4M5hYAhlyWb3FlpdtMt5uQ_ZWUFROZY";

const env = ((import.meta as any).env || {}) as Record<string, string | undefined>;
const URL_ = String(env.VITE_SUPABASE_URL || FALLBACK_URL).trim();
const KEY_ = String(env.VITE_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY).trim();

// https obligatorio; http solo para pruebas en local.
export const supabaseConfigured = /^(https:\/\/[^\s/]+|http:\/\/(localhost|127\.0\.0\.1)(:\d+)?)/.test(URL_) && KEY_.length > 20;

let client: SupabaseClient | null = null;
export function getSupabase(): SupabaseClient | null {
  if (!supabaseConfigured) return null;
  if (!client) client = createClient(URL_, KEY_, { auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  return client;
}
