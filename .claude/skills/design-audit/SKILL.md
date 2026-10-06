---
name: design-audit
description: Audita el diseño de la app web de finanzas personales (Next.js, HeroUI, Tailwind) en dos ejes, responsive en celular/tableta/desktop y calidad visual formal, y propone la dirección de diseño a seguir. Úsala siempre que el usuario pida revisar, validar, mejorar o rediseñar el diseño, la UI, la UX, el responsive, el tema de HeroUI, la tipografía, los colores, las tablas, las gráficas o cómo se ve cualquier pantalla, aunque no mencione la palabra "auditoría". También cuando diga que la app se ve genérica, "con puras cards", poco formal o que no se ve bien en el celular.
---

# Design Audit

Audita el diseño de toda la app y lo contrasta con una dirección de diseño definida: tranquila, precisa y editorial, más cercana a un estado de cuenta bien diseñado que a un dashboard de SaaS. El número es el protagonista y todo lo demás lo sirve.

## Reglas de conducta

- Modo SOLO LECTURA: audita y reporta. No modifiques código salvo que el usuario lo pida después de ver el reporte.
- No asumas cómo se ve algo. Lo que no pudiste ver en una captura real se marca `NO VERIFICADO VISUALMENTE`, nunca se da por correcto.
- Cada hallazgo lleva: pantalla o componente, archivo y línea, regla violada, severidad (crítica / alta / media / baja), evidencia (captura o fragmento de código) y corrección concreta.
- No reportes falsos positivos. Confirma leyendo el componente antes de afirmar.
- Si una decisión de diseño es ambigua o es gusto del usuario, repórtala como pregunta, no la resuelvas por tu cuenta.

## Flujo de trabajo

### 1. Detectar el stack real
Lee `package.json`, `tailwind.config.*`, el archivo del plugin `heroui()`, `globals.css`, el layout raíz y `AppShell`. Identifica: versión de HeroUI, tokens de tema existentes, fuentes cargadas, modo oscuro, librería de gráficas. No asumas rutas ni nombres.

### 2. Inventario
Lista todas las pantallas y rutas (`page.tsx`), plantillas, modales, drawers, tablas, formularios y gráficas. Ninguna pantalla puede quedar sin auditar. Para el estado de referencia de las pantallas esperadas lee `references/app-screens.md`.

### 3. Capturas reales
Si hay Playwright, Chrome DevTools o un MCP de navegador, toma capturas de cada pantalla en 320, 375, 768, 1024, 1440 y 1920 px, en claro y oscuro, y con datos reales o de demostración. Pantallas que requieren sesión: pide credenciales de prueba al usuario, no las inventes. Sin navegador disponible, audita solo desde el código y marca lo visual como no verificado.

### 4. Auditar
- Eje A, responsive: aplica `references/responsive-checklist.md`.
- Eje B, calidad visual: aplica `references/visual-quality-checklist.md` y la dirección de `references/design-direction.md`.
- Tema HeroUI y Tailwind: aplica `references/heroui-tailwind.md`.

### 5. Calificar
Por cada pantalla asigna 1 a 5 en: responsive, jerarquía, tipografía, espaciado, color, consistencia y refinamiento. Justifica cualquier calificación menor a 4.

### 6. Reportar
Usa el formato de `references/report-template.md`. No des por terminado el trabajo hasta que cada pantalla del inventario tenga calificación y estado por breakpoint.

## Al terminar
Resume en 5 líneas lo más grave y ofrece dos caminos: aplicar las correcciones por prioridad, o generar primero un mockup interactivo de las 3 pantallas más débiles para aprobar la dirección antes de tocar código.