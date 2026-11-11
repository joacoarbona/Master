# Zona privada: cómo está protegida

- **Lista de trabajos privados**: cifrada dentro de `src/PrivateArea.tsx` (AES-GCM; la clave sale de la contraseña con PBKDF2).
- **Ficheros privados** (dossiers, pensión, Innovation, plan BPO y los juegos de Fiesta): cifrados en `public/privado/<id>.bin`.
  `indice.json` solo guarda identificadores (hash de la ruta) y el vector de cada fichero; no aparecen nombres.
- Se descifran en el navegador tras escribir la contraseña y se muestran en un marco. Ni el servidor ni el repositorio tienen el texto en claro.
- La sección **Fiesta** pide la misma contraseña.

## Sellar ficheros (la contraseña no sale del navegador del dueño)

1. Entrar en joaco.org → Privado con la contraseña.
2. Si hay ficheros sin cifrar aparece «Sellar los ficheros privados» → **Cifrar ahora** → descargar `privado-sellado.json`.
3. `node scripts/sellar.mjs ruta/privado-sellado.json` crea los `.bin`, actualiza el índice, comprueba tamaños y borra los originales.
4. Commit y push.

Para añadir un fichero privado nuevo: publicarlo, añadir su ruta a `SEAL_PATHS` y repetir el sellado.

## Lo que el cifrado NO arregla

- **El historial de git** conserva las versiones en claro anteriores al sellado. Mientras el repositorio sea público, se pueden leer ahí.
  Solución: poner el repositorio en privado (Vercel sigue desplegando igual) o reescribir el historial.
- La seguridad es la de la contraseña: una contraseña corta se puede adivinar por fuerza bruta contra los ficheros cifrados.
