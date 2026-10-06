# Checklist de calidad visual

Se evalúa por pantalla, contra `design-direction.md`.

## 1. Jerarquía
- En 3 segundos queda claro qué es lo principal, lo secundario y lo terciario.
- Un solo foco por pantalla. En finanzas, normalmente una cifra héroe.
- Contraste de tamaño, peso y color que guíe la mirada.

## 2. Tipografía
- Máximo 2 familias.
- Escala consistente y pesos con propósito.
- `tabular-nums` en todo número que se compara o se alinea.
- Interlineado cómodo, líneas de 45 a 75 caracteres en texto corrido.
- Centavos en menor peso o tamaño en cifras grandes.

## 3. Espaciado y ritmo
- Escala consistente (múltiplos de 4 u 8).
- Agrupación por proximidad, espacio en blanco generoso.
- Sin elementos amontonados ni espacios arbitrarios.

## 4. Color
- Paleta limitada: neutros, un acento, semánticos.
- Semánticos de dinero consistentes en toda la app (ingreso, gasto, deuda, ahorro, alerta, sobre presupuesto).
- Contraste WCAG AA: 4.5:1 texto normal, 3:1 texto grande y componentes.
- No comunicar información solo por color (agregar signo, icono o texto en variaciones positivas y negativas).
- Modo claro y oscuro coherentes. Sin negro puro.

## 5. Anti-patrón "puras cards y botones"
Para cada card de cada pantalla pregunta si es un objeto discreto. Si no lo es, evalúa si funcionaría mejor como lista, tabla, sección con separadores, bloque editorial o layout asimétrico.
- Variedad de composición entre pantallas.
- Jerarquía de botones: primario, secundario, terciario o enlace. Un solo primario por contexto.
- Conteo por pantalla: cards totales frente a cards justificadas.

## 6. Consistencia
- Componentes equivalentes se ven y se comportan igual.
- Tokens en lugar de valores sueltos (hex, px repetidos).
- Radios, sombras y bordes con un sistema coherente.
- Los avisos de "por revisar" tienen un único patrón.

## 7. Datos y gráficas
- Cifras con formato regional correcto, moneda y signo consistentes.
- Gráficas con cuadrícula discreta, ejes sobrios, etiquetado directo si es posible.
- Un color por serie y siempre el mismo para la misma métrica.
- Eje Y no truncado sin aviso. Periodos parciales señalados.
- Variaciones con indicador claro de dirección y si es buena o mala.

## 8. Refinamiento
- Iconografía de un solo estilo.
- Estados completos: hover, focus, active, disabled, loading, error.
- Estados vacíos útiles (Cuentas, Proyección, Metas).
- Skeletons que imitan la forma real del contenido (revisar los `loading.tsx`), sin saltos de layout.
- Animaciones sutiles y funcionales, con `prefers-reduced-motion` respetado.

## 9. Tono formal
- Sin exceso de gradientes, sombras pesadas, emojis decorativos ni animaciones llamativas.
- Debe transmitir seriedad, orden y confianza.

## 10. Accesibilidad básica
- Foco visible, navegación por teclado, etiquetas en inputs.
- Textos alternativos y `aria-label` en botones de icono.
- Tablas con encabezados semánticos.