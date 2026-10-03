# Datos sembrados en el branch de Neon `e2e-tests`

Este documento describe EXACTAMENTE los datos que produce `pnpm run seed:e2e` (ver
`scripts/seed-e2e.ts`) en el branch aislado de Neon `e2e-tests`. El servidor de desarrollo
para e2e corre en **http://localhost:3001** (puerto separado del dev server real en :3000,
`.next-e2e` como build dir separado) y apunta exclusivamente a ese branch — nunca a datos reales.

No hace falta volver a sembrar para escribir/correr tests: el branch YA tiene estos datos.
Si necesitas datos adicionales que el seed actual no cubre, NO edites `scripts/seed-e2e.ts`
directamente (varios agentes pueden estar trabajando en paralelo) — repórtalo en tu resumen final.

## Cómo autenticarte en un test

```ts
cy.task("mintAccessToken", 1).then((token) => {
  cy.setCookie("access_token", token as string);
});
cy.visit("/");
```

`1` es el `familyId` sembrado (único family en este branch). Usuario: `e2e@test.local` /
`e2e-test-password-123` (útil para probar el flujo de login real por `/login`, en vez del
cookie directo, en al menos un test).

## Cómo verificar datos contra la base (no inventar/confiar solo en la UI)

```ts
cy.task("dbQuery", "select amount_cents from transactions where id = 25").then((rows) => {
  // rows es un array de objetos — solo LECTURA, el task rechaza cualquier INSERT/UPDATE/DELETE/etc.
});
```

## Family / Usuario

- `familyId = 1`, `userId = 1`, nombre "E2E Tester", email `e2e@test.local`.
- `today` al sembrar: **ajústalo dinámicamente en tus tests con `new Date()`**, no lo
  hardcodees — el seed usa fechas relativas a "hoy" (periodos, recurrentes, etc. se recalculan
  cada vez que se corre `seed:e2e`). Los IDs de abajo sí son estables entre corridas mientras
  no se vuelva a correr `reset:e2e` + `seed:e2e`.

## Cuentas (`/accounts`)

| id | nombre | type | classification | detalle |
|----|--------|------|-----------------|---------|
| 1 | Nu Débito | checking | asset | cuenta principal, usada en casi todas las transacciones |
| 2 | Nu Ahorro | savings | asset | vinculada a la meta "Vacaciones" |
| 3 | Nu TDC | credit_card | liability | límite de crédito $50,000.00 (5,000,000 cents), con compra real (-$1,200 Amazon) y 1 pago de tarjeta recibido (+$2,000) |
| 4 | Préstamo Auto | loan | liability | 1 pago de préstamo recibido (+$3,000) |
| 5 | Efectivo | cash | asset | **isActive: false** (archivada) — tiene 1 transacción histórica ("Cine", -$150), por eso se archivó en vez de borrarse. Úsala para probar la lista de archivadas + restaurar. |

## Categorías (`/settings`)

| id | nombre | classification | color |
|----|--------|-----------------|-------|
| 1 | Servicios | expense | #0d7d6f |
| 2 | Vivienda | expense | #2563eb |
| 3 | Alimentación | expense | #d97706 |
| 4 | Transporte | expense | #7c3aed |
| 5 | Ocio | expense | #db2777 |
| 6 | Nómina | income | #16a34a |
| 7 | Pago de deuda | expense | #64748b |

## Proveedores (`/settings`)

| id | nombre |
|----|--------|
| 1 | Telmex |
| 2 | CFE |
| 3 | Netflix |

## Conceptos (`/settings`)

| id | nombre | categoryId | providerId | flow |
|----|--------|-----------|------------|------|
| 1 | Internet Casa | 1 (Servicios) | 1 (Telmex) | expense |
| 2 | Luz | 2 (Vivienda) | 2 (CFE) | expense |
| 3 | Netflix | 5 (Ocio) | 3 (Netflix) | expense |

## Recurrentes (`/recurring`)

| id | nombre | monto esperado | día | conceptId | accountId | status |
|----|--------|-----------------|-----|-----------|-----------|--------|
| 1 | Internet Casa | -$499.00 | 5 | 1 | 1 (Nu Débito) | active — **PAGADO este periodo** (hay una transacción real con conceptId=1 el primer día del periodo actual) |
| 2 | Luz | -$600.00 | 20 | 2 | 1 (Nu Débito) | active — **NO pagado este periodo** (día 20 cae dentro del periodo actual pero no hay transacción con conceptId=2) → debe verse "Esperado" o "Atrasado" según si ya pasó el día 20 |
| 3 | Netflix | -$229.00 | 10 | 3 | 1 (Nu Débito) | active — sin transacción que lo pague este periodo (la transacción de Netflix que existe NO tiene conceptId, ver sugerencia pendiente abajo) |

Candidato de recurrente pendiente (`RecurringCandidatesCard` en dashboard y `/recurring`):

- id=1, patternSignature="spotify-e2e-seed", suggestedName="Spotify", suggestedAmountCents=-12900, suggestedCategoryId=5 (Ocio), accountId=1, status="pending".

## Sugerencia de concepto pendiente (`ConceptSuggestionsCard` en dashboard)

- id=1, transactionId=25 (transacción "Netflix.com", -$229.00, categoryId=5 Ocio, SIN conceptId), suggestedConceptId=3 (concepto Netflix), score=55, status="pending".
- Al confirmarla: la transacción 25 debe quedar con conceptId=3 y categoryId=5 (ya coincide). Al rechazarla: status pasa a "rejected", la transacción no cambia.

## Presupuestos (`/budgets` y `BudgetByCategoryCard`)

| categoryId | cadence | presupuestado | real este periodo | resultado esperado |
|-----------|---------|----------------|---------------------|---------------------|
| 3 (Alimentación) | monthly | $3,000.00 | -$3,600.00 ("Supermercado") | **SOBRE presupuesto por $600.00** — debe verse en rojo con el texto de desviación |
| 4 (Transporte) | monthly | $2,000.00 | -$800.00 ("Gasolina") | **DEBAJO del presupuesto**, $1,200.00 disponibles |

## Meta de ahorro (`/goals`)

- id=1, "Vacaciones", targetAmountCents=2,000,000 ($20,000.00), targetDate ~180 días a futuro desde que se sembró, vinculada a la cuenta 2 (Nu Ahorro).
- La cuenta Nu Ahorro recibió una transferencia de $5,000.00 este periodo (ver abajo) → el progreso de la meta debe reflejar ese balance (~25% si no hay más movimientos en esa cuenta).

## Transacciones del periodo actual (periodo que contiene "hoy", ver `/transactions`)

Todas registradas el primer día del periodo actual salvo que se indique otra cosa:

1. Nómina: +$20,000.00, categoryId=6 (Nómina), cuenta 1.
2. "PAGO MI TELMEX": -$499.00, categoryId=1 (Servicios), **conceptId=1** (Internet Casa — pagado), cuenta 1.
3. "Supermercado": -$3,600.00, categoryId=3 (Alimentación), cuenta 1.
4. "Gasolina": -$800.00, categoryId=4 (Transporte), cuenta 1.
5. "Cine": -$150.00, categoryId=5 (Ocio), cuenta 5 (Efectivo, luego archivada).
6. Transferencia: -$5,000.00 en cuenta 1 / +$5,000.00 en cuenta 2 (kind="transfer").
7. Pago de tarjeta: -$2,000.00 en cuenta 1 / +$2,000.00 en cuenta 3 (kind="cc_payment").
8. Pago de préstamo: -$3,000.00 en cuenta 1 / +$3,000.00 en cuenta 4 (kind="loan_payment").
9. "Amazon": -$1,200.00, categoryId=5 (Ocio), cuenta 3 (Nu TDC) — compra real con tarjeta, debe sumar a la deuda.
10. "Netflix.com": -$229.00, categoryId=5 (Ocio), SIN conceptId, cuenta 1, id=25 — es la transacción de la sugerencia pendiente (ver arriba).

## Transacciones históricas (para `FinancialEvolutionCard`, 6 meses atrás)

Por cada uno de los últimos 6 meses (día 1 de cada mes): +$20,000.00 "Nómina" (categoryId=6) y
-$1,500.00 "Renta" (categoryId=2, Vivienda), ambas en cuenta 1. Esto da una serie de
ingresos/gastos/balance con variación real en los rangos 3m/6m/1y — el rango 30d solo debe
mostrar los movimientos del periodo actual descritos arriba.

## Pago programado (`FinancialCalendarCard`, sección "programado")

- id=1, "Pago seguro auto", -$850.00, categoryId=7 (Pago de deuda), cuenta 1, scheduledDate ≈ hoy+5 días, status="planned". No tiene transacción real que lo cubra → debe verse como "pendiente" en el calendario, dentro del periodo actual.

## Periodos de pago

26 quincenas autogeneradas (desde 60 días atrás). El periodo "actual" (el que contiene "hoy")
es el que tiene índice `currentPeriodIndex` — consúltalo con `dbQuery` o
`listPayPeriodsUseCase`/la propia UI en vez de asumir un id fijo, porque corre desde "hoy" y
cambia si el seed se vuelve a correr otro día.
