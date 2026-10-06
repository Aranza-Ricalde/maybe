---
name: project-audit
description: Auditoría técnica de solo lectura del proyecto, separada en frontend y backend. Úsala cuando el usuario pida auditar, revisar la calidad, evaluar la arquitectura o buscar problemas de seguridad, queries, llamadas a Gemini, SOLID, Clean Architecture, Atomic Design o comentarios en el código. También aplica ante frases como "audita el proyecto", "revisión técnica", "project audit" o "qué tan sano está el código". No modifica código.
---

# Project Audit

Auditoría técnica **de solo lectura**. Analiza y reporta. No edites, crees ni borres código del proyecto. Solo corrige si el usuario lo pide después de recibir el reporte.

## Reglas generales

- Detecta la estructura real antes de auditar. No asumas rutas.
- Cada hallazgo incluye: `archivo:línea`, regla violada, severidad (crítica / alta / media / baja), explicación breve y sugerencia concreta de corrección.
- Usa Grep/Glob para detección sistemática y lee el archivo para confirmar. Un hallazgo sin verificar no se reporta.
- Si hay dudas sobre una violación, descártala o márcala como "a confirmar" en una sección aparte.
- Respeta las convenciones propias del proyecto (CLAUDE.md, AGENTS.md, memoria). Si el proyecto documenta una decisión de diseño deliberada, no la reportes como violación.
- Los archivos de test y los generados (`node_modules`, `.next`, `dist`, migraciones autogeneradas, lockfiles) se excluyen, salvo que una regla indique lo contrario.

## Flujo de trabajo

### 1. Reconocimiento

1. Lee `package.json` (o equivalente), `tsconfig*.json`, `CLAUDE.md`, `AGENTS.md` y el README.
2. Si el proyecto usa Next.js, lee la guía relevante en `node_modules/next/dist/docs/` antes de juzgar convenciones: puede diferir de lo que conoces.
3. Mapea el árbol con Glob (`src/**`, `app/**`, `pages/**`, `server/**`, etc.) y clasifica cada carpeta como frontend, backend, dominio, compartida o infraestructura.
4. En frameworks fullstack (Next.js, Remix, Nuxt), la separación es por capa y no por carpeta raíz. Clasifica por contenido: Server Actions, route handlers y `application/`, `domain/`, `infrastructure/` son backend. Componentes, hooks y páginas son frontend.
5. Identifica: framework, ORM/cliente de BD, proveedor de auth, SDK de Gemini, librería de validación, gestor de tests.
6. Escribe un resumen de 5-10 líneas de lo detectado y de las rutas que auditarás. Muéstralo al usuario antes de continuar.

### 2. Dimensionar

- Proyecto pequeño (< ~150 archivos de código): audita todo en una pasada.
- Proyecto grande: divide por módulos (por feature o por carpeta de primer nivel), audita cada uno y conserva un resumen parcial por módulo. Al final consolida.
- Para módulos independientes y voluminosos puedes delegar en subagentes de solo lectura (`Explore`). Pídeles `archivo:línea` y el fragmento exacto, y verifica tú los hallazgos críticos y altos.

### 3. Auditar frontend

Lee `references/frontend-checklist.md` y aplica cada regla con las búsquedas indicadas. Si no hay frontend, indícalo y sáltalo.

### 4. Auditar backend

Lee `references/backend-checklist.md` y aplica cada regla. Si no hay backend, indícalo y sáltalo.

### 5. Verificar

Para cada candidato:
1. Abre el archivo y lee el contexto (mínimo la función completa).
2. Confirma que la regla se viola de verdad y que no hay una mitigación cercana (validación aguas arriba, middleware, wrapper).
3. Asigna la severidad según la escala de abajo.
4. Descarta lo que no resista la verificación.

### 6. Reportar

Lee `references/report-template.md` y entrega el reporte con ese formato exacto. Luego pregunta si el usuario quiere que corrijas algo, empezando por el Top 10.

## Escala de severidad

| Severidad | Criterio |
|---|---|
| Crítica | Vulnerabilidad explotable, pérdida o corrupción de datos, fuga de secretos, acceso sin autorización a recursos ajenos. |
| Alta | Violación arquitectónica que bloquea la evolución, N+1 o query sin límite en rutas calientes, llamadas a Gemini sin timeout ni manejo de errores, lógica de negocio en UI. |
| Media | Violación de SOLID, duplicación relevante, `any` en fronteras de datos, falta de estados de carga/error, falta de índices en filtros frecuentes. |
| Baja | Nombres poco claros, comentarios sueltos, mejoras menores de accesibilidad o rendimiento. |

## Puntaje por área

Cada área (Frontend, Backend) empieza en 100. Resta por hallazgo confirmado: crítica -15, alta -8, media -3, baja -1. Mínimo 0. Muestra el puntaje y el desglose. Los puntajes son orientativos: dilo en el reporte.

## Qué no hacer

- No ejecutes comandos que modifiquen archivos, la BD o servicios externos. No corras migraciones, seeds ni scripts de reset.
- No imprimas valores de secretos si los encuentras en `.env` o en el código: indica solo archivo, línea y tipo de secreto.
- No reportes la misma causa raíz como diez hallazgos: agrúpalos en uno con la lista de ocurrencias.
- No propongas reescrituras amplias. Cada sugerencia debe ser concreta y acotada.
