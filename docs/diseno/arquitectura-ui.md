# Arquitectura de la capa de UI

Regla: los componentes **solo renderizan**. Cualquier decisión, cálculo, derivación o llamada va en otra capa.

| Qué | Dónde | Ejemplos |
|---|---|---|
| Reglas de negocio puras | `src/domain/**` (con pruebas) | `canConfirmImport`, `summarizeAccountsTotals`, `summarizeRecurring`, `creditUtilization` |
| Orquestación y datos de la página | `src/application/pages/**` | `GetAccountsPageUseCase`, `GetRecurringPageUseCase` |
| Derivaciones de presentación (puras, con pruebas) | `src/lib/presenters/**` | `budgetTree`, `explorer`, `statementReview`, `amount`, `periodSelection` |
| Estado de UI y efectos | `src/hooks/**` | `useExplorer`, `useBudgetTree`, `useReviewQueue`, `useStatementReview`, `useAccountExplorer`, `useFileDrop` |
| Estado global de cliente | `src/providers/**` | `StatementImportProvider` |
| Acceso HTTP desde el cliente | `src/lib/*Api.ts` | `statementsApi.ts` |
| Componentes | `src/components/{atoms,molecules,organisms,templates}` | solo props, JSX y manejadores que delegan |
| Primitivos | `src/components/ui` (shadcn) | no se editan salvo variantes del proyecto |

## Componentes genéricos y quién los extiende

- `ReviewQueueBanner` → `CaptureReviewBanner`, `TransferReviewBanner`, `RecurringBudgetDecisionBanner`.
- `DeleteEntityButton` (sobre `ConfirmDeleteButton`) → cuentas, categorías, metas, recurrentes, movimientos.
- `EntityFormModal` (sobre `FormModal`) → modales de alta y edición.
- `FileDropzone` (hook `useFileDrop`) → importación de estados.
- `StepList`, `PageSection`, `StatBlockRow`/`StatBlock`, `EmptyState`, `FilterPanel`, `PeriodPicker`, `SegmentedButtons`, `ResponsiveDialog`, `DataTable` (con `mobileGroup`).

## Checklist por componente nuevo

1. ¿Tiene `if`/`map`/`reduce` con reglas? → presentador o dominio, con prueba.
2. ¿Tiene `useState` + efectos? → hook.
3. ¿Hace `fetch`? → `src/lib/*Api.ts`.
4. ¿Se parece a uno existente? → extenderlo en vez de copiarlo.
5. ¿Existe en shadcn? → usarlo con sus variantes, sin envolver.

## Avisos de éxito y error (toda inserción, edición o borrado)

Flujo único, sin duplicar código:

1. **Servidor** — toda acción usa `runFormAction` (con formulario) o `runUserAction` (sin formulario) en `src/app/lib/actionRunner.ts`. Cada una declara `success` (texto fijo o función de la entrada/resultado). Devuelven `ActionResult` (`{ ok, message }`): errores esperados del dominio (`tolerate`) → mensaje legible; validación o propiedad → mensaje estándar; errores inesperados → se registran y devuelven un mensaje genérico (no se rompe la pantalla).
2. **Tipos compartidos** — `src/lib/actionResult.ts` (`ActionResult`, `FormAction`, `sentenceCase`).
3. **Servicio** — `src/services/actionFeedback.ts`: `reportResult` y `withFeedback` dependen de la interfaz `Notifier` (por defecto Sonner), así que se prueban con un notificador falso.
4. **Componentes y hooks genéricos** — `ActionForm` (formularios), `useFormModalController` (modales: solo se cierran si salió bien), `useFeedbackAction` (acciones sueltas) y `FormSwitch`/`PeriodViewSwitch`/`RestoreAccountButton` ya los usan.

Para una acción nueva: agrega `success` en el servidor y usa `ActionForm` o `useFeedbackAction` en el cliente; el aviso sale solo.
