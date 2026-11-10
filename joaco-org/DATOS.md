# Actualización de datos de los simuladores

Objetivo: que actualizar datos sea editar **un fichero**, no buscar números en 14.000 líneas.

## Cadencia recomendada: cada 3 meses

Primera semana de **febrero, mayo, agosto y noviembre**, justo después de la EPA trimestral
(sale a finales de enero, abril, julio y octubre). Así el dato de empleo, el más visible, siempre está fresco.

Una vez al año (febrero) se revisan además los datos anuales: SMI, bases de cotización,
pensión máxima, tramos de IRPF, Gini, natalidad.

## Cómo se hace (10 minutos)

1. `npm run datos` → lista cada dato con su fecha y marca **REVISAR** los caducados.
2. Edita `src/data/blondie-coyuntura.json`: cambia `value`, `source`, `date` y `status`.
3. Actualiza `meta.asOf`, `meta.label`, `meta.nextReview` y `meta.nextReviewLabel`.
4. `npm run build`, commit y push. Vercel publica solo.

La app muestra la fecha de los datos y la próxima revisión en la pestaña Vigilancia.

## Qué va en el JSON y de dónde sale

| Dato | Fuente | Frecuencia |
|---|---|---|
| Paro, ocupados, parados | INE, nota de prensa EPA | trimestral |
| Afiliados | Seguridad Social, afiliación media | mensual |
| IPC general y subyacente | INE, IPC (dato definitivo, no el adelantado) | mensual |
| Tipo BCE (depósito) | BCE, decisiones de política monetaria | 8 reuniones/año |
| Euríbor 12 m | Banco de España, media mensual | mensual |
| Deuda pública % PIB | Banco de España, deuda PDE | trimestral |
| Brent, EUR/USD | EIA / BCE | mensual |
| PIB nominal | INE, Contabilidad Nacional Trimestral | trimestral |
| SMI | BOE | anual |

`status`: `ok` (vigente) · `revisar` (pendiente) · `anual` (solo en febrero) · `supuesto` (hipótesis del modelo, no dato).

## Qué NO está aún en el JSON (segunda fase)

- 9 indicadores de Vigilancia siguen con dato de abril 2026 (lista en `vigilanciaPendiente`).
  Para actualizarlos basta añadirlos a `vigilancia` en el JSON.
- Tablas anuales dentro de `BlondieMacro.tsx`: distribución IRPF por tramo (AEAT), CCAA,
  comparativa europea, pensiones, inmigración, gasto público. Cambian una vez al año.
- Textos narrativos («Lectura del ciclo», escenarios semilla, lentes): hay que releerlos
  en cada revisión, porque ningún JSON los actualiza.

## Simulador hipotecario

Se actualiza solo: al abrirse pide el euríbor al BCE. La tabla local `EUR_BASE` de
`MortgageSimulator.jsx` es el respaldo sin conexión; conviene añadirle los meses nuevos en cada revisión.

## Otros simuladores con datos que caducan

| Simulador | Qué caduca | Frecuencia |
|---|---|---|
| IRPF 2018→2026 | tramos, mínimos, salarios por percentil | anual (enero) |
| Healthcare Thesis / IRA Squeeze | cotizaciones, hitos regulatorios | semestral |
| Puntocom vs IA | niveles del Nasdaq, capex | trimestral |
| Cybercab Madrid | supuestos de coste y regulación | anual |
