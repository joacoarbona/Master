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

## Todos los simuladores: `src/data/registro-datos.json`

Una línea por simulador: de cuándo son sus datos, cuándo toca revisarlo, en qué fichero están y qué hay que cambiar.
`npm run datos` lo imprime y marca **TOCA** los vencidos. Al actualizar uno, cambia su `asOf` y `nextReview`.

| Simulador | Datos a | Próxima revisión | Dónde |
|---|---|---|---|
| Blondie Macro | nov 2026 | feb 2027 (trimestral) | `src/data/blondie-coyuntura.json` |
| Hipotecario | oct 2026 | feb 2027 (trimestral) | `EUR_BASE` en `MortgageSimulator.jsx` |
| Puntocom vs IA | 6 nov 2026 | feb 2027 (trimestral) | `DATA` y tablas en el HTML |
| Healthcare Thesis + IRA | abr 2026 | abr 2027 (anual) | `src/data/healthcare-caps.json` |
| IRPF 2018→2026 | nov 2026 | feb 2027 (anual) | constantes en el HTML |
| Cybercab Madrid | ago 2026 | ago 2027 (anual) | HTML |

### Healthcare (Thesis e IRA comparten fichero)

Las capitalizaciones son una foto de cada abril, con ventana móvil de 4 años. En abril:
quita el primer valor de cada lista, añade el nuevo al final y actualiza `anchors` y `meta.label`.
Los dos simuladores se actualizan a la vez. Revisa también los catalizadores con fecha
(`ASSUMPTIONS` en `HealthcareThesis.tsx`): varios son de 2024-2025 y ya han ocurrido.

### Calendario del año

- **Febrero**: Blondie (trimestral + anual), Hipotecario, Puntocom vs IA, IRPF (año nuevo).
- **Abril**: Healthcare (foto anual).
- **Mayo, agosto, noviembre**: Blondie, Hipotecario, Puntocom vs IA.
- **Agosto**: Cybercab.
