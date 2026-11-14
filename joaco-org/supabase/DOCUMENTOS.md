# Documentos de la cuenta (`#/app/documentos`)

Documentos HTML que solo puede abrir su dueño, con el progreso sincronizado entre dispositivos.
Se llega desde **Privado → Documentos de la cuenta** o directamente en `joaco.org/#/app/documentos`.

## Cómo está protegido

- Cada documento está cifrado (AES-GCM) en `public/boveda/<id>.bin`. La clave sale de un **código de
  activación** de 20 caracteres (PBKDF2-SHA256, 210.000 iteraciones, sal propia por documento).
- `public/boveda/indice.json` solo lista identificadores, rutas y sales: ni títulos ni contenido.
- El código **no está en el repositorio**. Se comprueba en el navegador. Con sesión iniciada, la clave
  derivada se guarda en la fila `boveda` de `app_store` de la cuenta (RLS: solo la ve su dueño), para no
  tener que escribir el código en cada dispositivo.
- El progreso de cada documento va en la fila `d-<id>` de `app_store`.

## Activar la sincronización (una vez)

1. Supabase → proyecto **joaco-org** → **SQL Editor** → pega entero `supabase/app_store.sql` → **Run**.
2. Authentication → **URL Configuration**: Site URL `https://joaco.org` y, en Redirect URLs,
   `https://joaco.org/**` (sirve también para Suscripciones). Sin esto, los enlaces de confirmación
   y de cambio de contraseña llevan a una dirección que no existe, aunque la cuenta sí se confirma.
3. En joaco.org → Documentos de la cuenta → **Crear cuenta** (o Entrar, si ya existe) → escribir el código.

Sin el paso 1 todo funciona igual, pero solo en el dispositivo: el panel avisa de que falta la tabla.

## Cómo se sincroniza

- El documento guarda su estado como un mapa `clave → [valor, fecha]` (`{ v: 1, e: {…} }`).
- Fusión: de cada clave gana la fecha más reciente. Es conmutativa, así que da igual qué dispositivo
  escriba antes. Los historiales (exámenes, casos) se identifican por su fecha y se suman.
- Escritura con control de versión (`rev`): si otro dispositivo escribió entre medias, se vuelve a leer,
  fusionar y escribir.
- Se sincroniza al abrir, ~1,2 s después de cada cambio, al volver a la pestaña, al recuperar la
  conexión, cada 5 minutos y en directo con Realtime.
- El documento habla con la página por `postMessage` (mismo origen):
  documento → `app:ready`, `app:state {wire}`; página → `host:init {wire,status}`, `host:state {wire}`,
  `host:status {text}`.

## Actualizar o añadir un documento

Lo hace Claude con el código, que guarda fuera del repositorio: vuelve a cifrar con la misma sal y el
mismo código, sustituye el `.bin` y hace push. El progreso no se pierde, porque vive en `app_store`.
Para un documento nuevo: nuevo `id`, nueva sal y nuevo código, y una entrada más en `indice.json`.

## Plan gratuito

Un proyecto sin peticiones durante 7 días se pausa. Los documentos ya añadidos se siguen abriendo en
cada dispositivo (clave y progreso guardados en local) y el panel avisa de que no puede sincronizar.
Se reactiva desde el panel de Supabase (Restore).
