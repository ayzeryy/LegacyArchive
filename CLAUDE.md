# Lazô — instrucciones para Claude

Demo de hackathon (track «Legacy», Guatemala). Una comerciante individual ficticia (María) prepara dos expedientes —Registro Mercantil e inscripción patronal del IGSS— reutilizando datos de dos fuentes sintéticas incompatibles. Entrega: 2026-11-21, 3:00 p. m. (hora de Guatemala).

## Reglas que no se negocian
- Solo datos y documentos **sintéticos**, marcados como tales.
- CUI ≠ NIT. Dirección fiscal ≠ dirección de la empresa ≠ residencia. Nunca se completan entre sí.
- Nunca vincular personas por nombre parecido: solo referencia de expediente + identificadores exactos.
- Conservar valor original, fuente, campo de origen y fechas conocidas. Fechas desconocidas = «desconocida».
- No sobrescribir valores contradictorios: ambos se conservan y la persona elige con motivo.
- No inventar vigencias ni requisitos. «Verificado en fuente oficial» solo con verificación real y evidencia (la demo no lo usa).
- Catálogo público (`catalog/`) separado del expediente privado (`data/`, fuera de git).
- Croma solo desde el servidor, con `CROMA_API_KEY` en `.env.local`. Nunca pedir ni pegar claves en el chat. Una extracción de Croma es **candidata** y requiere revisión humana.
- Textos de la interfaz en español. Botón final: «Descargar expediente preparado». Estados de salida: «Borrador incompleto» / «Preparado para revisión según el catálogo de la demo».
- Commits **sin** la línea `Co-Authored-By: Claude`.

## Cómo trabajar
- Usa las skills de superpowers en `.claude/skills/` (writing-plans, test-driven-development, systematic-debugging, verification-before-completion).
- Dominio puro en `src/domain/` (con pruebas en `tests/`); persistencia en `src/server/`; UI en `src/app` y `src/components`.
- Antes de decir que algo funciona: `npm test`, `npm run lint`, `npm run build` y `npm run e2e`.
- Trabaja en una rama propia y abre PR contra `feat/demo-expediente` (o `main` cuando exista).
