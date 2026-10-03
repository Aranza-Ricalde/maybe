Quiero que evoluciones mi aplicación de finanzas personales para que funcione como una aplicación financiera seria y bien diseñada, no simplemente como un tracker de gastos o un Excel con gráficas.

## Objetivo principal

La aplicación debe ayudar al usuario a:

1. Registrar correctamente su dinero.
2. Entender qué representa cada movimiento.
3. Conciliar movimientos reales contra pagos/ingresos esperados.
4. Controlar presupuestos.
5. Controlar deudas.
6. Controlar metas de ahorro.
7. Medir su situación financiera.
8. Analizar tendencias y hábitos.
9. Proyectar su situación futura.
10. Detectar anomalías y cambios importantes.
11. Entender POR QUÉ está mejorando o empeorando.
12. Simular escenarios futuros.

La filosofía debe ser:

**Registrar → Entender → Conciliar → Medir → Comparar → Explicar → Proyectar → Simular**

No quiero una colección de dashboards bonitos sin fundamento. El dashboard debe ser una consecuencia de un modelo financiero correcto.

---

# 1. PRINCIPIO FUNDAMENTAL DEL MODELO

No mezcles estos conceptos:

* Cuenta
* Movimiento
* Tipo de movimiento
* Categoría
* Subcategoría
* Comercio/proveedor
* Concepto de gasto
* Recurrente
* Presupuesto
* Deuda
* Meta
* Activo
* Pasivo

Cada uno tiene una responsabilidad diferente.

## Cuenta

Representa dónde está el dinero o dónde existe una obligación.

Ejemplos:

* Nu Débito
* BBVA Débito
* Efectivo
* Nu Crédito

La cuenta NO debe definir por sí misma qué tipo de gasto es.

---

# 2. MOVIMIENTOS

Un movimiento debe representar un hecho financiero real.

Ejemplos:

### Gasto

Nu Débito → -$499 → PAGO MI TELMEX

### Ingreso

Nu Débito → +$10,000 → Nómina

### Transferencia

Nu Débito → -$5,000
BBVA → +$5,000

Esto NO es un gasto.

### Pago de tarjeta

Nu Débito → -$3,000
Nu Crédito → reducción de pasivo de $3,000

Esto tampoco debe contarse nuevamente como gasto si las compras ya fueron registradas cuando se realizaron.

La aplicación debe distinguir correctamente:

* gasto
* ingreso
* transferencia
* pago de deuda
* ajuste/reembolso, si aplica

Evitar doble contabilización.

---

# 3. CUENTA ≠ CATEGORÍA

Este es un punto crítico.

Una transacción:

> Nu Débito → $499 → PAGO MI TELMEX

puede ser:

* Cuenta: Nu Débito
* Categoría: Servicios
* Subcategoría: Internet
* Proveedor: Telmex
* Concepto: Internet Casa

La cuenta es solamente el origen/destino del dinero.

NO debe ser requisito para identificar un gasto recurrente.

---

# 4. CATEGORÍAS Y SUBCATEGORÍAS

Debe existir una clasificación jerárquica.

Ejemplo:

Servicios

* Internet
* Electricidad
* Agua
* Gas
* Telefonía

Alimentación

* Despensa
* Restaurantes
* Delivery
* Snacks

Transporte

* Gasolina
* Uber
* Mantenimiento
* Transporte público

Ocio

* Entretenimiento
* Videojuegos
* Salidas
* etc.

La categoría responde:

> ¿Qué tipo de gasto es?

La subcategoría permite mayor precisión.

No usar una categoría genérica como "Servicios" para distinguir Internet, Luz y Agua cuando se necesita identificar el gasto concreto.

---

# 5. PROVEEDOR / COMERCIO

Debe existir una entidad para identificar quién recibe el dinero.

Ejemplos:

* Telmex
* CFE
* JAPAY
* Netflix
* Spotify
* Walmart
* Uber

Esto permite reconocer diferentes descripciones de una misma empresa.

Por ejemplo:

* PAGO MI TELMEX
* TELMEX
* TELMEX SA
* TELMEX INTERNET

pueden asociarse al mismo proveedor.

Considerar aliases/reglas para normalizar nombres.

---

# 6. CONCEPTO DE GASTO

Agregar una capa que represente el gasto específico que el usuario entiende.

Ejemplos:

Internet Casa

* Categoría: Servicios
* Subcategoría: Internet
* Proveedor: Telmex

Luz

* Categoría: Servicios
* Subcategoría: Electricidad
* Proveedor: CFE

Agua

* Categoría: Servicios
* Subcategoría: Agua
* Proveedor: JAPAY

Netflix

* Categoría: Entretenimiento
* Subcategoría: Streaming
* Proveedor: Netflix

El concepto es mucho más específico que una categoría.

---

# 7. RECURRENTES

Un recurrente representa una EXPECTATIVA.

No representa una transacción real.

Ejemplo:

Internet Casa

* Monto esperado: $499
* Frecuencia: mensual
* Día esperado: 2
* Categoría: Servicios
* Subcategoría: Internet
* Proveedor: Telmex
* Concepto: Internet Casa
* Cuenta habitual: Nu Débito (opcional)

IMPORTANTE:

`cuenta habitual` NO debe ser obligatoria.

Es solamente una señal/preferencia histórica.

El recurrente debe seguir funcionando aunque el usuario cambie de cuenta.

---

# 8. MATCHING DE RECURRENTES

Cuando el usuario registra:

> Nu Débito
> -$499
> PAGO MI TELMEX

el sistema debe buscar qué obligación/recurrente representa.

NO debe hacer:

```text
recurrente.account_id === transaction.account_id
AND
recurrente.category_id === transaction.category_id
```

como condición obligatoria.

Debe utilizar múltiples señales.

Ejemplo:

* proveedor/descripción
* categoría
* subcategoría
* concepto
* monto
* fecha
* cuenta habitual
* frecuencia histórica
* aliases del comercio

La cuenta debe ser una señal, no una llave obligatoria.

Ejemplo conceptual:

```text
PAGO MI TELMEX
      ↓
Proveedor: Telmex ✓
Categoría: Servicios ✓
Subcategoría: Internet ✓
Monto: $499 ✓
Fecha esperada ✓
Cuenta habitual: Nu Débito ✓
      ↓
Internet Casa
      ↓
MATCH FUERTE
      ↓
Recurrente marcado como PAGADO
```

No necesariamente necesito mostrar un porcentaje al usuario, pero internamente debe existir algún concepto de confidence/scoring si ayuda al sistema.

---

# 9. MATCHING AMBIGUO

Si el sistema no está seguro, NO debe inventar.

Ejemplo:

> $500 — Servicios

Podría ser:

* Internet Casa
* Luz
* Agua

Entonces debe mostrar:

> ¿A qué corresponde este movimiento?

Opciones:

* Internet Casa
* Luz
* Agua
* Otro

Una vez que el usuario decide, guardar esa información para mejorar futuras clasificaciones.

---

# 10. APRENDIZAJE

La aplicación debería aprender de las decisiones del usuario.

Ejemplo:

Primera vez:

`PAGO MI TELMEX - $499`

Pregunta:

> ¿Qué es?

Usuario:

> Internet Casa

La siguiente vez:

`PAGO MI TELMEX - $499`

Debe reconocerlo automáticamente.

Guardar aliases/reglas históricas.

La aplicación debe reducir progresivamente el trabajo manual.

---

# 11. RECURRENTES VS PRESUPUESTOS

No mezclarlos.

Un recurrente responde:

> ¿Qué espero que ocurra?

Un presupuesto responde:

> ¿Cuánto quiero permitir/gastar?

Ejemplo:

Presupuesto:

* Alimentación: $3,000
* Transporte: $2,000
* Ocio: $1,500
* Servicios: $2,000

Dentro de Servicios pueden existir recurrentes:

* Internet: $499
* Luz: $600
* Agua: $200

---

# 12. PRESUPUESTO VS REAL

Cada categoría debe poder mostrar:

* presupuesto
* gasto real
* diferencia
* porcentaje utilizado
* tendencia histórica

Ejemplo:

```text
Comida
Presupuesto: $3,000
Real:        $3,600
Diferencia:  +$600
```

La aplicación debe detectar:

> Comida está $600 por encima del presupuesto.

Y no solamente mostrar una barra.

---

# 13. ESTADO FINANCIERO

El dashboard principal debe poder responder:

* ¿Cuánto dinero tengo?
* ¿Cuánto puedo gastar?
* ¿Cuánto debo?
* ¿Cuánto dinero está comprometido?
* ¿Cuánto ahorré?
* ¿Cuál es mi patrimonio?
* ¿Cuánto gasté este mes?
* ¿Cuánto ingresé?
* ¿Cuánto me queda?
* ¿Qué pagos vienen?

Métricas principales:

* Disponible
* Ingresos del periodo
* Gastos del periodo
* Deuda total
* Ahorro
* Tasa de ahorro
* Patrimonio neto
* Dinero comprometido

IMPORTANTE:

El crédito disponible de una tarjeta NO debe sumarse al dinero disponible.

La tarjeta representa capacidad de endeudamiento, no dinero propio.

---

# 14. ACTIVOS, PASIVOS Y PATRIMONIO

Debe existir una distinción entre:

### Activos

* cuentas bancarias
* efectivo
* inversiones
* otros activos

### Pasivos

* tarjetas
* préstamos
* otras deudas

### Patrimonio neto

```text
Activos - Pasivos
```

Debe existir una gráfica histórica de patrimonio.

La aplicación debe responder:

> ¿Mi patrimonio está aumentando o disminuyendo?

---

# 15. DEUDAS

La sección de deuda debe permitir:

* deuda total
* deuda por cuenta/acreedor
* saldo pendiente
* tasa/interés cuando esté disponible
* pago mínimo
* pago realizado
* fecha de pago
* interés pagado
* evolución histórica
* proyección de liquidación

La app debe distinguir:

### Compra con tarjeta

Es gasto.

### Pago de tarjeta

Es pago de pasivo/transferencia.

No duplicar el gasto.

---

# 16. AHORRO

Medir:

* ahorro absoluto
* tasa de ahorro
* ahorro mensual
* ahorro por quincena
* tendencia histórica
* ahorro acumulado

La tasa de ahorro debe poder calcularse como porcentaje de ingresos.

Ejemplo:

```text
Ingresos: $20,000
Ahorro:    $4,000
Tasa:        20%
```

---

# 17. FONDO DE EMERGENCIA

Calcular:

```text
Fondo disponible / gasto esencial mensual
```

Mostrar:

> Tienes cobertura equivalente a 1.8 meses.

También permitir definir una meta.

---

# 18. METAS

Cada meta debe tener:

* nombre
* monto objetivo
* monto actual
* fecha objetivo opcional
* progreso
* ahorro asignado
* proyección de cumplimiento

Ejemplo:

```text
Mudanza
Objetivo: $24,000
Actual:   $17,000
Progreso: 71%
```

La aplicación puede calcular cuándo se alcanzaría manteniendo el ritmo actual.

---

# 19. FLUJO DE EFECTIVO

Debe existir una vista de:

Ingresos
→ gastos
→ deuda
→ ahorro
→ dinero libre

Y debe poder analizarse por:

* mes
* quincena
* semana
* día

La aplicación debe responder:

> ¿Cuánto dinero realmente me queda después de mis compromisos?

---

# 20. SALDO PROYECTADO

Crear una proyección futura basada en:

* saldo actual
* ingresos esperados
* recurrentes pendientes
* pagos de deuda
* gastos presupuestados
* otros movimientos programados

Debe poder mostrar:

```text
Hoy              $12,000
+ Nómina         +$10,000
- Renta           -$6,000
- Internet          -$499
- Tarjeta         -$2,500
--------------------------------
Saldo proyectado  $13,001
```

Debe detectar si el saldo futuro cae por debajo de un mínimo configurado.

Ejemplo:

> ⚠️ Tu saldo proyectado cae por debajo de tu colchón de seguridad el 12 de octubre.

---

# 21. CALENDARIO FINANCIERO

Crear una vista calendario que muestre:

* ingresos esperados
* recurrentes
* pagos de deuda
* vencimientos
* movimientos reales

Debe permitir diferenciar:

REAL vs ESPERADO.

---

# 22. ANÁLISIS DE GASTOS

La aplicación debe poder responder:

* ¿Dónde gasto más?
* ¿Qué categorías están creciendo?
* ¿Qué categorías están disminuyendo?
* ¿Qué comercios consumen más dinero?
* ¿Cuánto gasto en gastos esenciales?
* ¿Cuánto en gastos discrecionales?
* ¿Cuánto gasto en suscripciones?
* ¿Cuánto gasto en pequeños gastos frecuentes?

---

# 23. TENDENCIAS

No limitarse al mes actual.

Comparar:

* mes actual vs mes anterior
* mes actual vs promedio de 3 meses
* mes actual vs promedio de 6 meses
* año actual vs año anterior cuando exista información suficiente

Ejemplo:

> Transporte aumentó 21% respecto al promedio de los últimos 3 meses.

Esto debe poder visualizarse.

---

# 24. DETECCIÓN DE ANOMALÍAS

Detectar automáticamente:

* gasto inusualmente alto
* gasto duplicado
* recurrente más caro de lo habitual
* categoría que crece rápidamente
* disminución importante del ahorro
* gasto inesperado
* movimiento sin clasificación
* posible transferencia mal clasificada

Ejemplo:

> ⚠️ Tu pago de Internet fue $300 superior a tu promedio habitual.

---

# 25. GASTOS RECURRENTES Y SUSCRIPCIONES

Detectar patrones recurrentes incluso si el usuario no los configuró manualmente.

Ejemplo:

```text
Spotify
$129
mensual
```

La aplicación podría sugerir:

> Parece que este gasto ocurre mensualmente. ¿Quieres convertirlo en recurrente?

Pero no debe crear recurrentes automáticamente sin suficiente confianza.

---

# 26. GASTOS HORMIGA

Detectar acumulaciones de pequeños gastos.

Ejemplo:

```text
Snacks       $390
Cafés        $480
Delivery     $730
Otros        $620
-------------------
Total       $2,220
```

La aplicación debe mostrar el impacto acumulado, no juzgar al usuario.

---

# 27. COSTO DE VIDA

Separar:

### Gastos esenciales

* vivienda
* alimentación básica
* servicios
* transporte
* salud

### Gastos discrecionales

* ocio
* restaurantes
* entretenimiento
* compras
* viajes

Calcular:

> Costo de vida esencial mensual.

Y:

> Costo de vida total mensual.

Esto alimentará también el cálculo del fondo de emergencia.

---

# 28. DASHBOARD

El dashboard no debe tener gráficas arbitrarias.

Cada componente debe responder una pregunta.

### Estado actual

* Disponible
* Ingresos
* Gastos
* Deuda
* Ahorro
* Patrimonio

### Gráficas

1. Ingresos vs gastos
2. Flujo de efectivo
3. Gastos por categoría
4. Tendencia de gastos
5. Presupuesto vs real
6. Evolución de deuda
7. Evolución de ahorro
8. Evolución de patrimonio
9. Progreso de metas
10. Saldo proyectado

No mostrar todas al mismo tiempo si genera saturación.

Priorizar información accionable.

---

# 29. SECCIÓN "¿QUÉ ESTÁ PASANDO?"

Crear una sección de insights.

Debe generar observaciones basadas en datos reales.

Ejemplos:

### 🟢 Positivo

"Tu ahorro aumentó 12% respecto al promedio de los últimos 3 meses."

### 🔴 Cambio importante

"Tu gasto en ocio aumentó $900 este mes."

### 🟡 Atención

"Transporte lleva 3 meses consecutivos aumentando."

### 🎯 Meta

"Al ritmo actual alcanzarías tu meta de ahorro aproximadamente en 7 semanas."

La aplicación no debe moralizar ni decirle al usuario qué debe hacer.

Debe explicar datos y consecuencias.

---

# 30. ¿POR QUÉ CAMBIÓ MI SITUACIÓN?

Esta debería ser una función central.

Si los gastos aumentaron:

```text
Gastos +$1,800
       ↓
Ocio +$900
Comida +$600
Transporte +$300
```

Y luego:

```text
Ocio +$900
       ↓
Restaurantes +$500
Videojuegos +$250
Otros +$150
```

El usuario debe poder navegar desde el indicador hasta los movimientos concretos que lo provocaron.

---

# 31. PROYECCIONES

La aplicación debe poder contestar:

* ¿Cuánto tendré en 3 meses?
* ¿Cuánto tendré en 6 meses?
* ¿Cuándo liquidaré mi deuda?
* ¿Cuándo alcanzaré una meta?
* ¿Cuándo tendré X meses de fondo de emergencia?
* ¿Cómo evolucionaría mi patrimonio?

Las proyecciones deben dejar claros sus supuestos.

No presentar predicciones como certezas.

---

# 32. ESCENARIOS "¿QUÉ PASA SI?"

Permitir simulaciones.

Ejemplos:

> ¿Qué pasa si ahorro $1,000 adicionales por quincena?

> ¿Qué pasa si gasto $2,000 adicionales este mes?

> ¿Qué pasa si pago $2,000 extra de deuda?

> ¿Qué pasa si mis ingresos aumentan $3,000?

Mostrar únicamente las consecuencias proyectadas.

No tomar decisiones por el usuario.

---

# 33. UX PRINCIPAL

El usuario debería poder hacer algo como:

```text
Registrar movimiento
       ↓
"Pago Telmex $499"
       ↓
La app identifica:
Cuenta: Nu Débito
Proveedor: Telmex
Concepto: Internet Casa
Categoría: Servicios > Internet
       ↓
¿Confirmar?
       ↓
Movimiento registrado
       ↓
Internet Casa → PAGADO
```

La mayor parte debe ser automática.

El usuario solamente corrige cuando sea necesario.

---

# 34. REGLA DE ORO

Nunca crear asociaciones falsas solamente para que una pantalla diga "pagado".

Si la confianza es alta:

→ asociar automáticamente.

Si es media:

→ pedir confirmación.

Si es baja:

→ dejar sin asociar.

La precisión debe ser más importante que la automatización.

---

# 35. LO QUE QUIERO QUE HAGAS EN EL CÓDIGO

Antes de implementar cambios:

1. Revisa el modelo de datos actual.
2. Revisa cómo se representan:

   * cuentas
   * transacciones
   * categorías
   * subcategorías
   * recurrentes
   * deudas
   * presupuestos
   * metas
3. Revisa cómo actualmente se determina si un recurrente está pagado.
4. Revisa cómo se clasifican las transacciones.
5. Identifica dónde están mezcladas responsabilidades.
6. Identifica qué partes del modelo actual pueden reutilizarse.
7. Identifica qué cambios son necesarios para soportar este modelo.

NO hagas un refactor masivo sin antes entender el sistema existente.

Quiero que preserves compatibilidad con los datos existentes siempre que sea razonable.

---

# 36. PRIORIDAD DE IMPLEMENTACIÓN

No intentes construir todo de golpe.

Prioridad:

### Fase 1 — Modelo financiero correcto

* cuentas
* movimientos
* tipos de movimiento
* categorías
* subcategorías
* proveedores
* conceptos
* recurrentes
* relación correcta entre ellos
* evitar doble contabilización

### Fase 2 — Matching

* detección por descripción
* proveedor
* concepto
* categoría
* monto
* fecha
* cuenta habitual como señal opcional
* aliases
* reglas
* confirmación cuando haya ambigüedad

### Fase 3 — Presupuesto y recurrentes

* esperado vs real
* pagos pendientes
* desviaciones
* calendario

### Fase 4 — Dashboard

* estado actual
* ingresos vs gastos
* categorías
* presupuesto
* deuda
* ahorro
* patrimonio

### Fase 5 — Análisis

* tendencias
* anomalías
* explicaciones
* insights

### Fase 6 — Proyecciones

* saldo futuro
* metas
* deuda
* fondo de emergencia
* escenarios

---

# 37. IMPORTANTE SOBRE LA IMPLEMENTACIÓN

No quiero que inventes entidades innecesarias si el modelo existente ya puede representar correctamente el concepto.

Antes de crear una tabla nueva, determina si una entidad existente puede evolucionar.

Pero tampoco quiero que fuerces todo dentro de `transactions`, `categories` y `recurring` si eso produce responsabilidades mezcladas.

Busca un equilibrio entre:

* modelo correcto
* simplicidad
* mantenibilidad
* compatibilidad
* facilidad de evolución

---

# 38. CRITERIOS DE ACEPTACIÓN

El sistema debería poder manejar correctamente este escenario:

Tengo un recurrente:

```text
Internet Casa
$499
Mensual
Servicios > Internet
Proveedor: Telmex
Cuenta habitual: Nu Débito
```

Registro:

```text
Nu Débito
-$499
PAGO MI TELMEX
```

Debe identificarlo como:

```text
Internet Casa
✅ Pagado
```

Pero si posteriormente registro:

```text
BBVA
-$499
PAGO MI TELMEX
```

también debe poder reconocerlo.

Cambiar de cuenta NO debe crear un nuevo recurrente.

---

Otro escenario:

Tengo:

```text
Luz
Servicios > Electricidad
CFE
```

Y:

```text
Agua
Servicios > Agua
JAPAY
```

Y:

```text
Internet Casa
Servicios > Internet
Telmex
```

Las tres pueden utilizar la misma cuenta.

El sistema debe distinguirlas por el conjunto de señales disponibles, no por la cuenta.

---

Otro escenario:

```text
$500
Servicios
```

sin proveedor ni subcategoría.

No debe adivinar.

Debe pedir al usuario que determine qué es si existe ambigüedad.

---

# 39. PRINCIPIO FINAL

Quiero que esta aplicación responda de forma confiable:

> **¿Dónde está mi dinero?**

> **¿De dónde viene?**

> **¿En qué se está yendo?**

> **¿Qué pagos tengo pendientes?**

> **¿Qué pagos ya hice?**

> **¿Estoy gastando más o menos que antes?**

> **¿Estoy cumpliendo mi presupuesto?**

> **¿Mi deuda está bajando?**

> **¿Mi ahorro está creciendo?**

> **¿Mi patrimonio está creciendo?**

> **¿Qué está provocando los cambios?**

> **¿Qué ocurrirá si mantengo este comportamiento?**

> **¿Qué ocurriría si cambio determinada variable?**

La aplicación debe convertirse en un sistema de diagnóstico y seguimiento financiero personal, no solamente en un registro de transacciones.

Antes de modificar código, analiza la arquitectura actual y explícame qué partes del sistema actual no cumplen con este modelo y qué propones cambiar. Después podemos implementar por fases.
