# Suscripciones · activar la sincronización (Supabase)

La app (`#/app/suscripciones`) funciona sin esto: guarda en el navegador. Con estos pasos,
cada persona puede crear una cuenta y ver sus suscripciones igual en todos sus dispositivos.

## Estado (12 nov 2026)

- Proyecto Supabase **joaco-org** (`zdlmpppkwfvtwkohwzct`, Frankfurt, plan gratuito).
- Tabla `sx_store` creada con este SQL, RLS comprobado (otra cuenta ve 0 filas) y Realtime activo.
- URL y clave *publishable* puestas en `src/lib/supabase.ts`: no hace falta tocar Vercel.
- **Pendiente (solo desde el panel de Supabase):** el paso 2, URL Configuration.
- Ojo, plan gratuito: un proyecto sin peticiones durante 7 días se pausa. La app sigue funcionando
  en el navegador y avisa de «No se ha podido sincronizar»; se reactiva desde el panel
  (Restore). Si pasa demasiado tiempo en pausa ya no se puede reactivar, como le pasó a «personal».

Los pasos de abajo son los generales, por si hay que montarlo en otro proyecto.

## 1. Base de datos (2 minutos)

Supabase → tu proyecto → **SQL Editor** → pega entero `supabase/suscripciones.sql` → **Run**.
Se puede volver a ejecutar sin perder datos.

## 2. Correos de confirmación y de «he olvidado la contraseña»

https://supabase.com/dashboard/project/zdlmpppkwfvtwkohwzct/auth/url-configuration →

- **Site URL**: `https://joaco.org`
- **Redirect URLs**: añade `https://joaco.org/?sx_auth=1` y `https://joaco.org/?sx_reset=1`
  (o, más simple, `https://joaco.org/**`).

Si *Confirm email* está activado (Authentication → Sign In / Providers → Email), al crear la
cuenta llega un correo para confirmarla; después se entra con correo y contraseña.

## 3. Claves en Vercel

Supabase → Project Settings → **API**: copia *Project URL* y la clave *anon public*
(o *publishable*). En Vercel → proyecto del portal → Settings → **Environment Variables**
(entorno Production):

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...   (o sb_publishable_...)
```

Después: Deployments → el último → **Redeploy**. Vite lee estas variables al compilar: sin
volver a desplegar no se aplican.

Alternativa: pegar los dos valores en `FALLBACK_URL` y `FALLBACK_ANON_KEY` de
`src/lib/supabase.ts` y hacer push. La clave anon es pública por diseño (no da acceso a nada
sin sesión gracias a RLS), así que puede ir en el repositorio.

## 4. Primera vez

1. joaco.org → Proyectos → Suscripciones → indicador «Sin cuenta · Sincronizar» → **Crear cuenta**.
2. En los demás dispositivos: mismo indicador → **Entrar**. Lo que hubiera en cada uno se suma.
3. Opcional: si no quieres que otros visitantes abran cuentas en tu Supabase, desactiva
   *Allow new users to sign up* (Authentication → Sign In / Providers) **después** de crear la
   tuya. Ojo: afecta a todas las apps del mismo proyecto (también /ingles).

## Cómo funciona

- El navegador es la copia principal: se guarda siempre ahí, con o sin conexión.
- Con sesión, cada cambio se sube a los ~1,2 s. Al abrir la app, al volver a la pestaña,
  al recuperar la conexión y cada 5 minutos se baja lo que hayan cambiado otros dispositivos;
  si Realtime está activo (el SQL lo activa), llega al momento.
- Fusión por suscripción: cada una lleva la fecha de su última edición y gana la más reciente.
  Los borrados dejan una marca con fecha (13 meses) para que no reaparezcan desde otro dispositivo.
- Escritura con control de versión (`rev`): si otro dispositivo escribió entre la lectura y la
  escritura, se vuelve a leer, fusionar y escribir.

## Comprobar que está bien

- [ ] Crear cuenta en el móvil con alguna suscripción ya apuntada → el indicador pasa a «Sincronizado».
- [ ] Entrar en el ordenador → aparecen las del móvil.
- [ ] Borrar una en el ordenador → al volver a la app en el móvil, desaparece.
- [ ] «¿Has olvidado la contraseña?» → el enlace del correo, abierto en el mismo navegador, lleva
      a la app y pide la contraseña nueva.
- [ ] En Supabase → Table Editor → `sx_store`: una fila por cuenta.
