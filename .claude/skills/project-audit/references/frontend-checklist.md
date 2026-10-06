# Checklist de Frontend

Aplica cada regla en orden. Los patrones de Grep son punto de partida: ajústalos a las rutas detectadas y confirma siempre leyendo el archivo.

Identifica antes las capas del frontend (por ejemplo `components/atoms|molecules|organisms|templates`, `app/**/page.tsx`, `hooks/`, `utils/`, `services/`, `application/`, `domain/`).

---

## F1. Clean Architecture

**Criterio**: las dependencias apuntan hacia adentro: UI → hooks/casos de uso → dominio. Nunca al revés.

Violaciones:
- El dominio (`domain/`) importa React, Next, librerías de UI, `fetch`, ORM o SDKs.
- Hooks o casos de uso importan componentes.
- Componentes presentacionales importan infraestructura directamente (clientes HTTP, ORM, SDKs, acceso a BD).
- Tipos del dominio definidos dentro de componentes y reutilizados desde otras capas.
- Imports circulares entre capas.

Detección:
- Grep de imports prohibidos dentro de `domain/`: `from ['"](react|next|@/components|@/app)`.
- Grep en componentes: imports de `infrastructure`, `db`, `drizzle`, `prisma`, `@neondatabase`, `@google/genai`.
- Lista los imports de cada capa y comprueba el sentido de la dependencia.

Severidad: alta (dominio contaminado), media (componente que salta una capa).

---

## F2. Atomic Design sin lógica

**Criterio**: pages, templates, organisms, molecules y atoms son puramente presentacionales. Se permite lógica puramente visual (renderizado condicional simple, mapeo de props a clases, `map` para listas).

Violaciones (marca todas):
- `fetch`, `axios`, `XMLHttpRequest`, llamadas a Server Actions o a la BD desde el componente.
- Acceso a `localStorage`, `sessionStorage`, `document.cookie`, `indexedDB`.
- `useState`/`useReducer`/`useEffect` que contenga lógica de negocio (cálculo de totales, estados de dominio, reglas de validación, sincronización de datos).
- Transformaciones de datos: `reduce`, `filter`, `sort`, `Object.groupBy` o cálculos de dinero/fechas/porcentajes dentro del JSX o del cuerpo del componente.
- Validaciones, reglas de negocio, condicionales basados en estados de dominio (`if (status === 'overdue' && amount > …)`).
- Formateo de dominio inline (moneda, periodos, categorías) en vez de utilidades.

Permitido sin reporte:
- Estado puramente visual (`isOpen`, pestaña activa, hover, foco).
- Renderizado condicional simple (`cond ? <A/> : <B/>`, `&&`).
- Handlers que solo delegan a props o a un hook (`onClick={onSubmit}`).

Detección:
- Grep en carpetas de componentes: `fetch\(|axios|localStorage|sessionStorage|useEffect|useReducer|\.reduce\(|\.filter\(|\.sort\(|new Date\(|Intl\.`.
- Revisa cada `useState` y `useEffect` y clasifica el estado como visual o de negocio.
- Páginas de App Router: una `page.tsx` puede orquestar la carga de datos en el servidor, pero no debe contener cálculos de negocio. Si llama a consultas, debe hacerlo mediante funciones de la capa de aplicación o de queries, no con SQL ni transformaciones inline.

Severidad: alta (fetch/storage/negocio en componente), media (transformación o cálculo moderado), baja (utilidad de formato pequeña).

Sugerencia tipo: extraer a un hook `useX` (estado + efectos), a `utils/` (funciones puras) o a un caso de uso, y pasar el resultado por props.

---

## F3. SOLID

- **S**: un componente, una responsabilidad. Señales de componente "dios": más de ~200 líneas, más de ~8 props, varios `useState` sin relación, mezcla de lista + formulario + modal.
- **O**: `switch`/`if` encadenados por tipo en el JSX que obligan a editar el componente para cada variante nueva. Sugiere un mapa de variantes o composición.
- **L**: componentes que reciben props de un tipo base pero rompen el contrato (ignoran props, lanzan por variantes no soportadas).
- **I**: props "bolsa" (objetos enteros de dominio cuando solo se usan 2 campos). Props mínimas y específicas.
- **D**: dependencias inyectadas por props o hooks. Marca imports directos de servicios concretos dentro de componentes.

Detección:
- Cuenta líneas por archivo de componente (Bash `wc -l` sobre la lista de Glob) y revisa los de mayor tamaño.
- Revisa los tipos de props: `any`, objetos de dominio completos, props booleanas en cascada (`isA`, `isB`, `isC`).

Severidad: media; alta si el componente dios concentra lógica de negocio.

---

## F4. Buenas prácticas

- **Tipado estricto**: `strict: true` en tsconfig. Marca `any`, `as any`, `as unknown as`, `@ts-ignore`, `!` en cadena, props sin tipar.
- **Nombres claros**: variables de una letra fuera de lambdas cortas, `data`, `item`, `tmp`, `handle` sin sujeto, abreviaturas opacas.
- **Duplicación**: bloques JSX o funciones casi idénticos en 2+ archivos. Confirma leyendo antes de reportar.
- **Estados de carga/error**: toda carga asíncrona y todo envío de formulario deben manejar loading, error y vacío. Revisa `loading.tsx`, `error.tsx`, `Suspense` y estados de botones durante el envío.
- **Accesibilidad básica**: `<img>` sin `alt`, botones solo con icono sin `aria-label`, inputs sin `label`, `div`/`span` con `onClick` sin rol ni teclado, modales sin gestión de foco ni `aria-modal`, contraste evidente insuficiente, `tabIndex` positivo.
- **Re-renders**: objetos/arrays/funciones creados en el render y pasados a hijos memoizados, `key={index}` en listas dinámicas, contextos con valores no estables, componentes definidos dentro de otros componentes, falta de `useMemo`/`useCallback` solo cuando hay un costo medible (no pidas memoización indiscriminada).
- **Server vs Client** (Next/React): `'use client'` innecesario en componentes sin interactividad; datos pesados enviados al cliente como props.

Detección:
- Grep: `: any\b|as any|@ts-ignore|key=\{(i|index|idx)\}|<img |onClick=` en `div|span`.
- Lee `tsconfig.json` y `eslint.config.*`.

Severidad: media (`any` en fronteras, falta de error/loading), baja (nombres, alt, key).

---

## F5. Cero comentarios

**Criterio**: no debe haber comentarios en el código. El código se explica con nombres.

Excepciones permitidas, que además deben estar justificadas en la misma línea o en el nombre de la regla desactivada:
- `eslint-disable*` con la regla concreta (no `eslint-disable` global).
- `@ts-expect-error` con descripción.
- Directivas técnicas obligatorias: `'use client'`, `'use server'`, shebang, `/// <reference />`, `@jsxImportSource`.

Marca como violación:
- `//` y `/* */` con explicaciones, TODO, FIXME, código comentado.
- JSDoc/TSDoc (`/** */`).
- Comentarios JSX `{/* */}`.
- `@ts-ignore` (debe ser `@ts-expect-error` justificado).
- `eslint-disable` sin regla o sin justificación.

Detección:
- Grep multilínea sobre `src` (excluye tests y generados): `^\s*//`, `/\*`, `\{/\*`, `\s//\s` (cuidado con URLs `https://` y strings).
- Confirma que el hallazgo no es una URL, un string o una expresión regular.

Reporta un solo hallazgo por archivo con la lista de líneas. Severidad: baja. Si hay código comentado (código muerto), media.
