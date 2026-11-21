# Prueba real de Croma — 2026-11-21

## Ejecución y alcance

- Fecha: **2026-11-21**, zona **America/Guatemala (UTC−06:00)**.
- Rama: `feat/croma-y-presentacion`.
- Se pulsó «Extraer candidatos con Croma» en las **seis fuentes** que contiene actualmente `/catalogo`; el handoff menciona cinco.
- Solicitudes iniciadas entre **13:55:42 y 13:55:48** (19:55:42–19:55:48 UTC); resultados comprobados en SQLite y en el navegador hacia las 13:56.
- Endpoint: `POST https://api.croma.run/global/generate/json/v1`, `effort: standard`, esquema e instrucciones de `src/server/croma.ts`.
- Resultado técnico: **6/6 extracciones guardadas sin error**, 27 elementos candidatos en total. Esto mide transporte y persistencia, **no exactitud ni cobertura**.
- Las llamadas se hicieron realmente durante esta prueba. Lo que aparece después en la interfaz es una **extracción candidata guardada**, con fecha e identificador de solicitud; no una nueva consulta en vivo. Con `standard` el proveedor puede usar su propia copia de una página: no se certifica lectura fresca de cada origen.
- El catálogo continúa siendo manual. Solo se actualizó su metadato `croma`; ningún requisito, condición, vigencia o paso fue reemplazado por la extracción.

## Comparación con `catalog/catalogo.json`

### 1. Página del Registro Mercantil

- URL: https://sistemaseguimiento.registromercantil.gob.gt/inscripcion-de-empresa-mercantil/
- Hora de solicitud: 13:55:42.571. ID: `req_72958b8d-af6f-404f-9ae3-0cfdd2178781`.
- Resultado: **1 candidato**.
- Coincidió: identifica el trámite de inscripción de comerciante y empresa.
- Faltó: los pasos y documentos del PDF y los campos del formulario no aparecen en esta extracción. No equivale a haber seguido los enlaces de la página.
- Sobró o se clasificó mal: el título del trámite se clasificó como formulario; por sí solo no describe un requisito accionable.

### 2. PDF del Registro Mercantil

- URL: https://sistemaseguimiento.registromercantil.gob.gt/wp-content/uploads/Tramites/11%20INSCRIPCION%20COMERCIANTE%20IND%20Y%20EMPRESA%20MERC_actual.pdf
- Hora de solicitud: 13:55:44.949. ID: `req_42c103ed-8c14-4fc9-8ce8-1dd79fa0aac8`.
- Resultado: **6 candidatos**.
- Coincidió: formulario sin costo, dos pagos de Q100 con códigos 18 y 13, condición de inscripción previa para el comerciante, presentación del DPI y comprobantes en folder oficio, y patente con Q50 en timbres. Concuerda con los pasos y documentos modelados.
- Faltó: separar los documentos y pagos en requisitos individuales. La condición del pago al comerciante queda dentro del texto, pero `condicion` es nulo; no sirve para alimentar automáticamente el motor.
- Sobró respecto del alcance: sucursales, copropietarios y detalles de delegaciones departamentales. Son contenido de la fuente, pero exceden el caso de propietaria única modelado; no se incorporaron.

### 3. Formulario del Registro Mercantil

- URL: https://servicios.registromercantil.gob.gt/formatoSolicitudes/Solicitudes/solicitud_inscrip_comerciante_individual_empresa
- Hora de solicitud: 13:55:45.536. ID: `req_d14d3b1d-8de2-4504-aa19-cf2b266ebd49`.
- Resultado: **16 candidatos**.
- Coincidió parcialmente: profesión, departamento de domicilio, residencia, teléfono, correo y fecha de inicio. Algunos aparecen combinados en un solo elemento.
- Faltó, frente a los campos modelados: nombres, apellidos, NIT, nacionalidad, estado civil, nombre comercial, dirección de la empresa, objeto y empleados a contratar. No se deduce que hayan dejado de ser necesarios: esta extracción es incompleta.
- Sobró: encabezados, saludo y despedida, fecha generada de la página, fecha inicial técnica del año 0001, capital, categoría/sucursal y datos de inscripción previa. Los dos últimos grupos no están modelados en la demo.
- Calidad: devolvió la cadena `"null"` en los campos opcionales, y mezcló etiquetas con un correo de ejemplo. Ni ese correo ni la fecha técnica se consideran datos reales o requisitos. La fecha generada de la página no acredita la actualización de los requisitos.

### 4. Página de requisitos del IGSS

- URL: https://www.igssgt.org/patronos/requisitos-de-inscripcion/
- Hora de solicitud: 13:55:46.518. ID: `req_91696ec8-c4e0-4c19-8c3f-7652d44bb3ac`.
- Resultado: **1 candidato**.
- Coincidió: obligación de inscripción al ocupar uno o más trabajadores, consistente con `aplica_si`.
- Faltó: desglose documental y cantidad de trabajadores como dato separado; la lista documental está modelada con fuentes PDF.
- Clasificación incorrecta: esa regla de aplicabilidad se etiquetó como documento. No debe convertirse en documento faltante.

### 5. PDF IGSS — Acuerdo 1529 JD

- URL: https://servicios.igssgt.org/servicios/Patronos/inscripcion_patrono/Prerequisitos/INSCRIPCION%20Requisitos%20Acuerdo%201529%20JD.pdf
- Hora de solicitud: 13:55:46.587. ID: `req_f902d436-9944-4a74-9131-c0f6bc0ae2bd`.
- Resultado: **2 candidatos**.
- Coincidió: DPI, RTU ratificado, patente para comerciantes y mandato/carta poder en copropiedad, agrupados en un solo bloque.
- Faltó: cantidad de trabajadores, pasos de solicitud/presentación y separación de documentos y condiciones en campos estructurados.
- Sobró respecto del alcance: contratos de servicio y registro administrativo del artículo 18, que ya se declaran fuera del modelo. Un bloque está truncado y el bloque documental se clasificó como formulario.
- Los datos de apoyo marcados `supuesto_demo` en el catálogo siguen siendo supuestos: esta prueba no verificó campos del DRPT-001.

### 6. PDF IGSS — revisión 2023

- URL: https://www.igssgt.org/wp-content/uploads/2026/09/Requisitos-de-Inscripcion-Patronal-IGSS-rev-2023.pdf
- Hora de solicitud: 13:55:48.191. ID: `req_23e7cdc6-5387-40f8-89e2-393b3c8ba2b2`.
- Resultado: **1 candidato**.
- Coincidió: mismo grupo de cuatro documentos de persona individual que en el PDF anterior.
- Faltó: cantidad de trabajadores, pasos y condiciones estructuradas; los documentos no se separaron.
- Clasificación incorrecta: el bloque de documentos se etiquetó como formulario. La extracción no informó una fecha o versión visible; el nombre del archivo no se toma como prueba de vigencia.

## Fallo encontrado y corrección

Una llamada diagnóstica previa a las 13:52:38 devolvió HTTP 200 con `X-Request-Id: req_c2c41c32-68e2-4b24-9bb1-6edd81b1b52e`, pero los candidatos venían en **`data.result`**. El código original solo leía `result`, por lo que habría guardado un falso error aun con respuesta exitosa.

Se ajustó `src/server/croma.ts` para aceptar el envoltorio observado y conservar compatibilidad con el formato directo descrito en la [documentación de Generate](https://docs.usecroma.com/guides/global/generate.md), consultada el 2026-11-21. Se agregaron tres casos de prueba: formato observado, formato directo y error HTTP con código y request ID. Se comprobó el fallo del primer caso antes de corregirlo y su éxito después.

## Evidencia y decisión

Los seis registros completos, incluyendo texto original de candidatos, fecha, URL y request ID, están en la tabla local `croma_extracciones` de `data/legacyarchive.db`; también se dejó `data/croma-resultados.json` como exportación local para inspección. `data/` y `.env.local` están ignorados por Git. La clave no forma parte de este informe ni del catálogo.

**Decisión:** integración probada técnicamente; extracción con cobertura parcial y ruido que requiere revisión humana. No se promueve automáticamente ningún candidato ni se asigna el estado «Verificado en fuente oficial» a los expedientes. No se identificó una corrección de requisitos del catálogo que pueda justificarse solo con estas salidas candidatas.

## Verificación local

- Node 24.18.0; dependencias instaladas tras reintentar un corte de conexión de npm.
- Suite: 35 pruebas aprobadas (32 existentes y 3 de Croma).
- TypeScript sin errores y build de producción generado correctamente.
- Flujo específico de Croma comprobado en navegador: seis botones, seis respuestas guardadas y mostradas como candidatas con fecha y request ID.
- `npm run e2e` se intentó, pero no pudo iniciar: `Cannot find module 'playwright'`. El paquete no está declarado en `package.json`. Por tanto, el recorrido completo del expediente no queda validado por esta sesión. No se modificó `scripts/e2e.mjs`, reservado a la otra sesión por el handoff.
