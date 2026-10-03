# domain/

Entidades y reglas de negocio puras: cálculo de progreso de un goal, proyección de flujo de caja, qué cuenta como "patrón recurrente", lógica de presupuesto.

Reglas de esta capa:
- Cero imports de `next/*`, `drizzle-orm` o cualquier cosa de `infrastructure/`.
- Se debe poder probar con `node --test` sin levantar servidor ni base de datos.
- Si un archivo aquí necesita saber cómo se guarda algo en Postgres, está en la capa equivocada.

Vacío por ahora — se llena a medida que se construyen los casos de uso en `application/`.
