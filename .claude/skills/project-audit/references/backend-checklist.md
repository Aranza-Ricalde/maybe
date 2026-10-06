# Checklist de Backend

Aplica cada regla en orden. Los patrones de Grep son punto de partida: ajústalos al stack detectado (ORM, cliente SQL, SDK de Gemini, framework) y confirma siempre leyendo el archivo.

Antes de empezar identifica: capas (controllers/routes/actions, casos de uso, dominio, infraestructura), cliente de BD, esquema/migraciones, módulo de auth, SDK de Gemini y librería de validación.

---

## B1. Clean Architecture

**Criterio**: controllers/routes/actions → casos de uso → dominio ← infraestructura. El dominio no conoce frameworks, ORM ni SDKs.

Violaciones:
- `domain/` importa ORM, cliente SQL, `next/*`, `@google/genai` o cualquier SDK, `process.env`.
- Casos de uso que importan implementaciones concretas de infraestructura en vez de puertos (interfaces).
- Controllers/routes/actions con lógica de negocio o queries directas.
- Entidades del dominio acopladas a la forma de las tablas o de las respuestas HTTP.
- Reglas de negocio dentro de la capa de infraestructura (por ejemplo en repositorios o SQL).
- Defaults de estado o listas de valores permitidos fijados en la BD (CHECK/enum) cuando el proyecto decide mantenerlos en el backend. Revisa la memoria del proyecto antes de reportar.

Detección:
- Grep dentro de `domain/`: `import .* from ['"](?!\.)` y revisa cada paquete externo.
- Grep en `application/`: imports de `infrastructure|db|drizzle|prisma|neon|@google`.
- Grep en routes/actions: `SELECT|INSERT|UPDATE|DELETE|db\.|sql\``.

Severidad: alta (dominio contaminado, negocio en controller), media (caso de uso acoplado a una implementación).

---

## B2. SOLID

- **S**: servicios/casos de uso con una sola razón de cambio. Señales: archivos de más de ~250 líneas, funciones de más de ~50 líneas, casos de uso que validan, consultan, calculan, llaman a IA y notifican todo a la vez.
- **O**: cadenas largas de `if/else` o `switch` por tipo/estado/proveedor que obligan a modificar la función para cada caso nuevo. Sugiere mapa de estrategias o polimorfismo.
- **L**: implementaciones de un puerto que lanzan "no soportado" o cambian el contrato.
- **I**: puertos/interfaces gordos que fuerzan a implementar métodos que no se usan. Divide por consumidor.
- **D**: dependencias creadas con `new` o importadas como singletons dentro del caso de uso. Debe haber inyección (parámetros, factory, composición en un único punto).

Detección:
- `wc -l` sobre los archivos de aplicación/dominio e inspección de los más grandes.
- Grep: `new [A-Z]\w+\(` dentro de casos de uso, `switch \(`, `else if` con 4+ ramas.

Severidad: media; alta si bloquea tests o intercambiar implementaciones.

---

## B3. Queries y base de datos

Busca y confirma:
- **N+1**: query dentro de `for`, `forEach`, `map`, `Promise.all(items.map(...))` que consulta la BD por elemento.
- **Queries en loops** en general, incluidos inserts/updates uno a uno que deberían ser batch.
- **`SELECT *`** o equivalentes (`returning *`, traer filas completas del ORM) cuando solo se usan unas columnas.
- **Sin paginación ni límite** en listados que crecen con el tiempo (transacciones, eventos, logs).
- **Falta de índices**: columnas usadas en `WHERE`, `JOIN`, `ORDER BY` o `GROUP BY` sin índice. Compara los filtros de las queries con los índices del esquema/migraciones. Revisa claves foráneas sin índice y filtros compuestos (usuario + fecha).
- **Joins innecesarios** o que multiplican filas (join con tabla 1:N seguido de agregación).
- **Falta de transacciones** donde varias escrituras deben ser atómicas (crear X y Y, mover saldos, importaciones masivas, escrituras con efectos secundarios).
- **Sobre-obtención**: traer todo para filtrar o agregar en memoria cuando la BD puede hacerlo (`SUM`, `GROUP BY`, `COUNT`).
- **Condiciones de carrera**: leer-modificar-escribir sin bloqueo ni restricción única donde se necesita idempotencia (importaciones, webhooks, mensajes repetidos).
- Consultas repetidas con los mismos parámetros dentro de una misma petición.

Detección:
- Grep: `SELECT \*|returning \*|\.findMany\(|\.select\(\)`, y bucles con `await` dentro: `for .*\{[^}]*await`, `\.map\(async`.
- Lee los archivos de esquema y migraciones para listar los índices existentes.
- Revisa los `ORDER BY`/`LIMIT` de cada listado.

Severidad: alta (N+1 en rutas frecuentes, falta de transacción con riesgo de inconsistencia), media (sin índice, SELECT *, sin paginación), baja (join evitable).

Si hay acceso MCP a la BD (por ejemplo Neon), solo usa herramientas de lectura (`describe_table_schema`, `explain_sql_statement`, `list_slow_queries`). Nunca ejecutes escrituras.

---

## B4. Llamadas a Gemini

Localiza todas las llamadas (`@google/genai`, `@google/generative-ai`, `generateContent`, `models.generate`, `ai-sdk` con proveedor google, fetch a `generativelanguage.googleapis.com`).

Revisa:
- **Tamaño de prompt y contexto**: prompts con datos completos cuando bastan campos clave, historiales sin recortar, listas enteras de catálogos enviadas en cada llamada. Estima el tamaño en tokens.
- **Caché**: respuestas deterministas repetibles (misma entrada → misma salida) sin caché; uso de context caching de Gemini para prefijos largos y estables; caché de resultados por clave normalizada.
- **Llamadas redundantes**: la misma consulta repetida en una petición, o llamadas a IA para casos que una regla o una búsqueda local resuelve. Si el proyecto declara que el sistema aprende y evita la IA constante, valida que se cumpla.
- **Secuencial vs paralelo/batch**: `await` en serie de llamadas independientes (usar `Promise.all` con límite de concurrencia) o N llamadas que pueden agruparse en una sola con salida estructurada de lista.
- **Timeouts**: toda llamada debe tener timeout (`AbortSignal.timeout`, opciones del SDK).
- **Reintentos con backoff**: reintentos con backoff exponencial y jitter solo en errores transitorios (429, 5xx). Marca ausencia de reintentos o reintentos ilimitados/sin espera.
- **Rate limits y errores**: manejo explícito de 429, 5xx, bloqueos de seguridad y respuestas vacías; degradación controlada; sin propagar el error crudo al usuario.
- **Elección del modelo**: modelos pequeños/rápidos (Flash/Flash-Lite) para clasificar, extraer y normalizar; modelos grandes solo para razonamiento complejo. Marca el modelo más caro usado para tareas simples. Verifica que los IDs de modelo estén centralizados en configuración.
- **Límites de salida**: `maxOutputTokens` definido, y temperatura adecuada a la tarea (baja para extracción).
- **Salida estructurada**: uso de `responseMimeType: 'application/json'` con `responseSchema` (o equivalente) en vez de parsear texto libre con regex. Valida la salida con un esquema (Zod u otro) antes de usarla.
- **Costos y observabilidad**: registro de tokens usados y latencia, sin registrar el contenido sensible del prompt.

Detección:
- Grep: `generateContent|GoogleGenAI|GoogleGenerativeAI|gemini-|maxOutputTokens|responseSchema|responseMimeType|AbortSignal|backoff|retry`.
- Para cada punto de llamada, anota: modelo, tamaño aproximado del prompt, timeout, reintentos, salida estructurada, caché.

Severidad: alta (sin timeout ni manejo de errores en ruta de usuario, parseo frágil de JSON libre, bucle de llamadas), media (modelo sobredimensionado, sin caché, sin límite de salida), baja (falta de métricas).

---

## B5. Seguridad (OWASP Top 10)

Revisa cada punto y confirma antes de reportar.

1. **Control de acceso roto (A01)**: cada recurso debe verificar propiedad (`WHERE user_id = :sesión`), no solo que haya sesión. Marca endpoints/actions que reciben un `id` y lo usan sin comprobar el dueño (IDOR), rutas sin autenticación, acciones de servidor expuestas sin comprobación, webhooks sin verificación de firma/secreto (por ejemplo bot de Telegram sin validar el token o el origen).
2. **Fallos criptográficos (A02)**: secretos o tokens en el código, hashes débiles, cookies sin `httpOnly`/`secure`/`sameSite`, HTTP sin TLS.
3. **Inyección (A03)**: SQL por concatenación o interpolación de strings (`sql.raw`, template string con input), comandos de shell con input, NoSQL con objetos sin validar, `eval`/`new Function`.
4. **Diseño inseguro (A04)**: ausencia de límites de negocio (montos, tamaños de CSV, número de filas), flujos sin idempotencia.
5. **Configuración incorrecta (A05)**: CORS con `*` o reflejando origen, headers de seguridad ausentes (CSP, HSTS, X-Content-Type-Options, X-Frame-Options/frame-ancestors, Referrer-Policy), modo debug, errores con stack trace al cliente. Revisa `next.config.*`, middleware/proxy y respuestas.
6. **Componentes vulnerables (A06)**: ejecuta `npm audit --omit=dev` (solo lectura) o revisa lockfile; reporta dependencias con CVE alta/crítica y paquetes abandonados. Si no se puede ejecutar, indícalo.
7. **Autenticación (A07)**: sesiones sin expiración, comparaciones de secretos sin tiempo constante, ausencia de límite de intentos, contraseñas débiles permitidas.
8. **Integridad (A08)**: deserialización insegura, importaciones de CSV sin validar, dependencias por CDN sin integridad.
9. **Logging y monitoreo (A09)**: logs con datos sensibles (tokens, contraseñas, montos con identificadores, prompts completos, cuerpos de peticiones), ausencia de logs de eventos de seguridad.
10. **SSRF (A10)**: `fetch` a URLs construidas con input del usuario sin lista de permitidos.

Además, siempre:
- **Validación y sanitización de inputs**: todo input externo (body, query, params, formularios, CSV, mensajes de Telegram, salida de Gemini) validado con esquema (tipo, longitud, rango, formato) en la frontera. Marca `as Type` sobre input sin validar y `JSON.parse` sin validación.
- **Secretos y variables de entorno**: `.env` fuera de git (`.gitignore`), `.env.example` sin valores reales, secretos con prefijo `NEXT_PUBLIC_` (expuestos al cliente), claves hardcodeadas, validación de variables al arranque. Busca patrones de claves: `AIza[0-9A-Za-z_-]{35}`, `sk-`, `postgres(ql)?://\w+:\w+@`, `Bearer `, `BEGIN (RSA|PRIVATE)`. Nunca imprimas el valor encontrado.
- **Rate limiting** en login, endpoints públicos, webhooks y rutas que disparan llamadas a Gemini (riesgo de abuso y costo).
- **Exposición de datos sensibles**: respuestas con campos de más (hashes, tokens, campos internos), mensajes de error detallados, enumeración de usuarios.
- **Prompt injection hacia Gemini**: input del usuario o contenido externo (nombre de comercio, descripción de CSV, mensajes) insertado en el prompt sin delimitar; el modelo con capacidad de decidir acciones o escribir en la BD sin validación posterior; salida del modelo usada como SQL, ruta o comando; ausencia de instrucciones de sistema separadas del contenido del usuario; falta de validación de la salida con esquema y listas de valores permitidos.

Detección:
- Grep: `sql\.raw|\$\{.*\}.*(SELECT|INSERT|UPDATE|DELETE)|eval\(|new Function|exec\(|child_process|NEXT_PUBLIC_|process\.env|console\.(log|error)|cors|Access-Control|dangerouslySetInnerHTML|JSON\.parse`.
- Lista todos los puntos de entrada (routes, actions, webhooks) y revisa uno por uno: auth, autorización por recurso, validación, rate limit.

Severidad: crítica (IDOR, inyección, secretos expuestos, webhook sin autenticar con efectos), alta (sin validación de inputs, sin rate limit en rutas con costo, prompt injection con efectos), media (headers ausentes, logs con datos sensibles), baja (endurecimiento menor).

---

## B6. Cero comentarios

Mismo criterio que el frontend (F5):
- Prohibidos: `//`, `/* */`, JSDoc/TSDoc, TODO/FIXME, código comentado, `@ts-ignore`, comentarios en SQL de migraciones escritas a mano (`--`) si el proyecto aplica la regla a todo el código.
- Permitidos y justificados: `eslint-disable <regla>` con motivo, `@ts-expect-error` con descripción, directivas obligatorias (`'use server'`, shebang).

Detección: Grep sobre carpetas de backend, scripts y esquemas (sin generados ni tests): `^\s*//`, `/\*`, `^\s*--`. Descarta URLs, strings y regex. Un hallazgo por archivo con la lista de líneas. Severidad: baja; media si es código comentado.
