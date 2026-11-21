# Persistencia en Vercel

La aplicación usa SQLite local al desarrollar y **libSQL remoto (Turso)** cuando se configuran `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`. No guarda la base de datos en `/tmp`, no usa una réplica local en Vercel y no recurre silenciosamente a almacenamiento temporal cuando falla una conexión.

## Configurar el despliegue

1. Crea una base de datos **libSQL** en tu cuenta de Turso. Puedes usar la [integración con Vercel](https://docs.turso.tech/integrations/vercel) o el panel del proveedor. Esta tarea no creó una cuenta ni una base de datos de pago.
2. Importa `ayzeryy/LegacyArchive` en Vercel. Usa la rama que contiene este cambio (`feat/persistencia-vercel`, o `feat/demo-expediente` después de integrarlo). Framework: **Next.js**, directorio raíz del repositorio y Node.js **22.x o 24.x**.
3. En **Settings > Environment Variables**, configura para el entorno que vas a desplegar:
   - `TURSO_DATABASE_URL`: URL `libsql://...` o `https://...` de la base libSQL remota.
   - `TURSO_AUTH_TOKEN`: token con permisos de lectura y escritura de esa base.
   - `CROMA_API_KEY`: opcional, para extracciones candidatas desde el servidor.
4. Usa valores secretos del servidor, sin prefijo `NEXT_PUBLIC_`. No copies `.env.local` al repositorio. No configures `LEGACYARCHIVE_DB_PATH` en Vercel.
5. Despliega o vuelve a desplegar después de guardar las variables. El esquema se inicializa automáticamente, con instrucciones idempotentes en una transacción.

El fork y el código **no bastan sin las dos variables de Turso**. Si faltan, la app rechaza el uso de SQLite local en Vercel y registra un error de configuración. Un fallo de conexión no crea otra base vacía ni se presenta como una escritura exitosa.

Esta sigue siendo una **demo de un expediente compartido sin autenticación**: solo admite información y documentos sintéticos. Todos los visitantes del mismo despliegue usan el mismo expediente. Usa bases distintas para producción y previews si necesitas aislar sus estados.

## Uso local y datos existentes

Sin las variables de Turso, `LEGACYARCHIVE_DB_PATH` sigue seleccionando el archivo SQLite, por defecto `data/legacyarchive.db`. El driver libSQL puede leer ese mismo formato y no borra ni reemplaza el archivo existente. Para pruebas puede usarse `:memory:`.

Definir ambas variables activa la base remota también en local. No se migra automáticamente el contenido del archivo local: una base remota nueva empieza vacía y permite cargar nuevamente el caso sintético desde la interfaz. Guarda por separado las bases locales que quieras conservar.

## Comprobaciones

- `npm test`: recorrido del repositorio, datos, confirmaciones, documentos, reapertura del cliente y rollback de lotes fallidos.
- `npm run lint` y `npm run build`.
- `npm run e2e`: recorrido en navegador con una base local temporal independiente. Instala Chromium con `npx playwright install chromium`, o usa el canal de un navegador instalado mediante `PLAYWRIGHT_CHANNEL=msedge`. El script desactiva las variables remotas en su proceso hijo para no modificar la base de Turso.
- Prueba remota opcional después de configurar `.env.local` (PowerShell):

```powershell
$env:PROBAR_TURSO = '1'
node --env-file=.env.local node_modules/vitest/vitest.mjs run tests/remoto.integration.test.ts
Remove-Item Env:PROBAR_TURSO
```

La prueba remota crea una tabla de nombre único con contenido sintético, cierra el cliente, vuelve a abrirlo, comprueba texto y bytes y elimina su tabla. Requiere permisos de creación y borrado de tablas. No reinicia el expediente.

## Cambios de implementación

Las páginas y rutas esperan las consultas asíncronas. El catálogo y el motor de requisitos mantienen su lógica. Los binarios se normalizan a `Uint8Array` antes de descargarlos. Las importaciones y el reinicio usan lotes transaccionales, en lugar de enviar `BEGIN` y `COMMIT` en peticiones HTTP distintas. Un índice único evita importar dos veces el mismo archivo al competir varias solicitudes.

Referencias: [SDK oficial de libSQL](https://tursodatabase.github.io/libsql-client-ts/interfaces/Client.html), [Turso TypeScript](https://docs.turso.tech/sdk/ts/reference), [Vercel y su sistema de archivos](https://vercel.com/docs/functions/runtimes).
