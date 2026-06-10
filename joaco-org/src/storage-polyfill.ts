/**
 * Polyfill de window.storage (la API de persistencia de los artefactos de
 * Claude) respaldado por localStorage. DCOS Navigator y Blondie Macro ya
 * traen su lógica de guardado escrita contra esta API: con esto funciona
 * en joaco.org sin tocar su código.
 */
const PREFIX = "joaco-storage:";

declare global {
  interface Window {
    storage?: {
      get(key: string, shared?: boolean): Promise<{ key: string; value: string; shared: boolean } | null>;
      set(key: string, value: string, shared?: boolean): Promise<{ key: string; value: string; shared: boolean }>;
      delete(key: string, shared?: boolean): Promise<{ key: string; deleted: boolean; shared: boolean }>;
      list(prefix?: string, shared?: boolean): Promise<{ keys: string[]; prefix?: string; shared: boolean }>;
    };
  }
}

if (typeof window !== "undefined" && !window.storage) {
  window.storage = {
    async get(key) {
      const value = localStorage.getItem(PREFIX + key);
      return value === null ? null : { key, value, shared: false };
    },
    async set(key, value) {
      localStorage.setItem(PREFIX + key, value);
      return { key, value, shared: false };
    },
    async delete(key) {
      localStorage.removeItem(PREFIX + key);
      return { key, deleted: true, shared: false };
    },
    async list(prefix = "") {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(PREFIX + prefix)) keys.push(k.slice(PREFIX.length));
      }
      return { keys, prefix, shared: false };
    },
  };
}

export {};
