# Formato del reporte

Entregar en Markdown, en este orden.

## 1. Resumen ejecutivo
- Calificación global (1 a 5).
- Pantallas auditadas frente al inventario.
- Conteo de hallazgos por severidad.
- Si hubo capturas reales o solo análisis de código.

## 2. Matriz pantalla por breakpoint

| Pantalla | 320 | 375 | 768 | 1024 | 1440 | 1920 |
|---|---|---|---|---|---|---|
| /login | OK | OK | OK | OK | OK | OK |

Valores: `OK`, `PROBLEMAS`, `NO VERIFICADO`.

## 3. Hallazgos responsive
Ordenados por severidad. Cada uno:

- **Pantalla / componente**:
- **Archivo y línea**:
- **Breakpoint afectado**:
- **Regla violada**:
- **Severidad**:
- **Evidencia**: captura o fragmento
- **Corrección sugerida**:

## 4. Hallazgos de calidad visual
Mismo formato, agrupados por criterio del checklist.

## 5. Calificaciones por pantalla

| Pantalla | Responsive | Jerarquía | Tipografía | Espaciado | Color | Consistencia | Refinamiento |
|---|---|---|---|---|---|---|---|

Justificar toda calificación menor a 4.

## 6. Densidad de cards y botones

| Pantalla | Cards | Justificadas | Botones primarios |
|---|---|---|---|

## 7. Propuesta de dirección de diseño
Sistema coherente: paleta (neutros, acento, semánticos de dinero, claro y oscuro), escala tipográfica, escala de espaciado, tratamiento de superficies, radios, y componentes clave. Incluir cómo rediseñar las 3 pantallas más débiles, con composición concreta de bloques.

## 8. Top 10 mejoras priorizadas
Ordenadas por impacto visual sobre esfuerzo.

## 9. Preguntas abiertas
Decisiones de gusto o ambigüedades que requieren respuesta del usuario.

## 10. Lo que está bien logrado
Aspectos a conservar.