# LegacyArchive — demo Guatemala

> Normalizamos los requisitos institucionales y reutilizamos la información de la persona para preparar expedientes con menos repetición.

María, una comerciante individual **ficticia**, prepara dos expedientes relacionados: la inscripción de comerciante individual y empresa ante el **Registro Mercantil** y, después, la **inscripción patronal de persona individual ante el IGSS**. LegacyArchive lee dos fuentes con estructuras incompatibles, conserva el origen de cada dato, muestra conflictos y faltantes, y al abrir el segundo trámite propone la información compatible sin volver a escribirla.

El resultado es un expediente descargable para continuar por el canal oficial. **No es una inscripción presentada ni aprobada.** Todos los datos y documentos son sintéticos.

## Iniciar

Requiere Node.js 22.13 o superior (usa el SQLite nativo de Node).

```bash
npm install
cp .env.example .env.local     # opcional: CROMA_API_KEY para la extracción con Croma
npm run dev                    # http://localhost:3000
```

Para la presentación: `npm run build && npm start`. Antes de empezar, pulsa «Reiniciar la demo» en **Mi expediente**.

## Recorrido (≈ 3 minutos)

1. En «¿Qué trámite deseas hacer hoy?» escribe «negocio» → abre el Registro Mercantil → responde las preguntas → «Empezar este trámite».
2. **Reutilizar expediente** → «Cargar caso de demostración» (o sube los archivos de `muestras/`). Observa: un nombre parecido con otro CUI no se vincula, y un registro con la misma referencia pero CUI distinto queda bloqueado.
3. **Revisar información** → la dirección de la empresa está **en conflicto** (CSV 2019 vs. JSON 2025). Elige el valor, escribe el motivo y resuelve. Confirma los demás datos.
4. **Completar pendientes** → estado civil, fecha de inicio, empleados a contratar y copia del DPI (`muestras/documentos/dpi_MUESTRA.pdf`). Los comprobantes de pago quedan **faltantes**.
5. **Preparar expediente** → «Descargar expediente preparado» → sale **«Borrador incompleto»**.
6. **Mi expediente → Documentos** → carga la patente y la constancia de RTU de muestra, indicando que representan documentos obtenidos previamente.
7. **Trámites → IGSS** → «Tu expediente ya tiene información compatible» → «Usar mi información en este trámite». La dirección resuelta, los nombres, el NIT y el DPI aparecen ya confirmados.
8. Completa la cantidad de trabajadores (se sugiere «empleados a contratar» como dato relacionado, no equivalente) y declara que el RTU está ratificado.
9. Descarga: **«Preparado para revisión según el catálogo de la demo»**.
10. Detén y vuelve a iniciar el servidor: todo se conserva en `data/legacyarchive.db`.

La presentación está en `presentacion/index.html` (ábrela en el navegador).

## Archivos sintéticos

| Archivo | Qué representa |
|---|---|
| `muestras/sistema_antiguo_contribuyentes.csv` | Sistema antiguo: Windows-1252, `;`, campos `DPI_NO`, `NIT_CONT`, `NOM1`, `DIR_FISC`, `DIR_NEG`, fechas `dd/mm/aaaa`. 3 personas. |
| `muestras/exportacion_gestor_2025.json` | Gestor actual: `document_number`, `tax_id`, `fiscal_address`, `business_address`, `home_address`. Incluye un registro con el mismo nombre y otro CUI. |
| `muestras/importacion_invalida.csv` | Para mostrar el error de importación. |
| `muestras/documentos/*_MUESTRA.pdf` | DPI, patente y constancia de RTU simulados, marcados como muestra. |

## Variables de entorno (sin secretos en el repo)

| Variable | Uso |
|---|---|
| `LEGACYARCHIVE_DB_PATH` | Ruta del SQLite. Por defecto `data/legacyarchive.db` (fuera de git). |
| `CROMA_API_KEY` | Opcional. Clave de Croma, solo en el servidor. Se crea en platform.usecroma.com. |
| `CROMA_BASE_URL` | Opcional. Por defecto `https://api.croma.run`. |

## Verificaciones

```bash
npm test        # 35 pruebas: adaptadores, vinculación, motor, catálogo y recorrido sobre SQLite
npm run lint    # TypeScript estricto
npm run build
npm run e2e     # recorrido completo en Chromium (Playwright) con los archivos de muestra
```

Resultado de la última ejecución (2026-11-21): 35/35 pruebas, build correcto y **19/19 comprobaciones del recorrido en navegador**, incluido reiniciar el servidor y una pantalla de 390 px sin desplazamiento horizontal. Capturas en `docs/capturas/`.

## Cómo está hecho

| Capa | Archivos |
|---|---|
| Modelo común y normalización | `src/domain/conceptos.ts`, `normalizar.ts` |
| Adaptadores de solo lectura | `src/domain/adaptadores.ts` (CSV heredado, JSON de exportación, validación Zod) |
| Vinculación | `src/domain/vinculacion.ts`: referencia de expediente + CUI/NIT exactos; nunca por nombre |
| Motor de requisitos | `src/domain/motor.ts`: existencia, autorización, vigencia y equivalencia exacta |
| Catálogo público versionado | `catalog/catalogo.json` (fuentes oficiales y fecha de revisión) |
| Expediente privado | `src/server/db.ts`, `repo.ts` (SQLite) |
| Exportación | `src/domain/exportar.ts` (JSON con procedencia) y `/tramite/[id]/resumen` (imprimible) |
| Croma | `src/server/croma.ts`, `POST /api/croma`, página `/catalogo` |

Estados modelados: disponible, confirmado por la persona, en conflicto, faltante, vencido y por confirmar. «Verificado en fuente oficial» existe pero la demo nunca lo asigna.

## Fuentes oficiales (revisadas el 2026-11-21)

- Registro Mercantil: [página del trámite](https://sistemaseguimiento.registromercantil.gob.gt/inscripcion-de-empresa-mercantil/), [PDF de requisitos](https://sistemaseguimiento.registromercantil.gob.gt/wp-content/uploads/Tramites/11%20INSCRIPCION%20COMERCIANTE%20IND%20Y%20EMPRESA%20MERC_actual.pdf), [formulario](https://servicios.registromercantil.gob.gt/formatoSolicitudes/Solicitudes/solicitud_inscrip_comerciante_individual_empresa).
- IGSS: [requisitos de inscripción](https://www.igssgt.org/patronos/requisitos-de-inscripcion/), [Acuerdo 1529 JD](https://servicios.igssgt.org/servicios/Patronos/inscripcion_patrono/Prerequisitos/INSCRIPCION%20Requisitos%20Acuerdo%201529%20JD.pdf), [rev. 2023](https://www.igssgt.org/wp-content/uploads/2026/09/Requisitos-de-Inscripcion-Patronal-IGSS-rev-2023.pdf).

## Limitaciones e integraciones pendientes

- **Croma:** probada el 2026-11-21 a las 13:55 (Guatemala) con la cuenta del equipo: 6 extracciones candidatas guardadas con su `X-Request-Id`. La cobertura es parcial y hay errores de clasificación (ver `docs/croma-resultados.md`), así que el catálogo sigue siendo curado a mano y ningún candidato se incorporó automáticamente.
- No hay conexión con Registro Mercantil, SAT, RENAP ni IGSS. No se presenta, paga ni aprueba nada.
- Los campos del formulario DRPT-001 del IGSS requieren sesión: los datos de apoyo del IGSS se marcan como «Supuesto de la demo».
- Ninguna fuente publica plazos de vigencia para estos documentos; no se inventan. El RTU «ratificado» queda «por confirmar» hasta que la persona lo declara.
- Un solo expediente y sin autenticación: solo para datos sintéticos.
- Fuera de alcance: sociedades, sucursales, copropiedad completa, extranjeros, afiliación de trabajadores.
- `node:sqlite` muestra un aviso «experimental» en la consola; es esperado.
