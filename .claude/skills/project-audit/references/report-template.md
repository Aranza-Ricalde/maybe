# Plantilla del reporte

Entrega el reporte en Markdown, en español, con exactamente estas secciones y en este orden. No añadas secciones ni omitas ninguna. Si un área no existe en el proyecto, escribe "No aplica: no se detectó <frontend|backend>".

Reglas de formato:
- Los hallazgos se agrupan por regla (F1–F5, B1–B6) y dentro de cada regla se ordenan de mayor a menor severidad.
- Si una regla no tiene hallazgos, escribe "Sin hallazgos".
- Varias ocurrencias de la misma causa raíz van en un solo hallazgo, con la lista de ubicaciones.
- Las rutas se escriben como `ruta/archivo.ext:línea`.
- No pegues valores de secretos.

---

## Plantilla

```markdown
# Auditoría técnica: <nombre del proyecto>

Fecha: <AAAA-MM-DD> · Alcance: <rutas auditadas> · Stack: <framework, ORM, auth, Gemini SDK>

## 1. Resumen ejecutivo

| Área | Puntaje (0-100) | Crítica | Alta | Media | Baja | Total |
|---|---|---|---|---|---|---|
| Frontend | <n> | <n> | <n> | <n> | <n> | <n> |
| Backend | <n> | <n> | <n> | <n> | <n> | <n> |
| **Total** | **<promedio>** | <n> | <n> | <n> | <n> | <n> |

<Dos a cuatro frases con el estado general, el mayor riesgo y la mayor fortaleza. Aclara que el puntaje es orientativo.>

Limitaciones: <qué no se pudo revisar o verificar, por ejemplo npm audit sin red>

## 2. Hallazgos de Frontend

### F1. Clean Architecture

#### [CRÍTICA|ALTA|MEDIA|BAJA] <título corto del hallazgo>
- **Ubicación**: `ruta/archivo.tsx:42` (más: `ruta/otro.tsx:10`, `ruta/otro2.tsx:77`)
- **Regla violada**: <regla concreta>
- **Explicación**: <una a tres frases con el impacto>
- **Sugerencia**: <cambio concreto y acotado; incluye nombre del hook/función/archivo destino>

### F2. Atomic Design sin lógica
...

### F3. SOLID
...

### F4. Buenas prácticas
...

### F5. Cero comentarios
...

## 3. Hallazgos de Backend

### B1. Clean Architecture
...

### B2. SOLID
...

### B3. Queries y base de datos
...

### B4. Llamadas a Gemini
...

### B5. Seguridad
...

### B6. Cero comentarios
...

## 4. Top 10 de acciones prioritarias

Ordenadas por impacto y luego por esfuerzo. Cada una referencia sus hallazgos.

| # | Acción | Hallazgos | Severidad | Esfuerzo (S/M/L) |
|---|---|---|---|---|
| 1 | <acción> | F2, B5 | Crítica | S |
| ... | | | | |

## 5. Aspectos bien implementados

- <Práctica positiva concreta con ejemplo `archivo:línea` o módulo>
- <Mínimo 3 puntos, solo cosas verificadas>

## Próximo paso

<Una línea: ofrecer corregir empezando por el Top 10. No modifiques nada hasta que el usuario lo confirme.>
```

---

## Cómo calcular el puntaje

Cada área parte de 100 y resta por hallazgo confirmado (agrupado por causa raíz): crítica -15, alta -8, media -3, baja -1. Mínimo 0. El total es el promedio de las áreas aplicables.

## Hallazgos a confirmar

Si quedan sospechas que no pudiste verificar, añádelas al final de la sección 1 bajo "A confirmar", con ubicación y motivo de duda. No cuentan en el puntaje.
