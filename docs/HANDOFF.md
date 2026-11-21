# Handoff para el compañero de equipo

**Hora límite:** 3:00 p. m. (Guatemala), hoy 2026-11-21. **Repo:** quiqueb06/LegacyArchive, rama base `feat/demo-expediente`.

## Qué ya existe (no lo rehagas)
- App Next.js 15 + TypeScript + Tailwind 4 + Zod + SQLite nativo de Node 22 (`node:sqlite`).
- Recorrido completo: elegir trámite → importar CSV heredado + JSON del gestor → revisar con procedencia → resolver conflicto de dirección → completar pendientes → descargar JSON / resumen imprimible → cargar patente y RTU sintéticos → IGSS reutiliza → segundo expediente preparado.
- Catálogo curado y verificado el 2026-11-21 en `catalog/catalogo.json` (fuentes oficiales enlazadas en cada requisito).
- Integración de Croma en servidor: `src/server/croma.ts`, endpoint `POST /api/croma`, botón en `/catalogo`. **No probada**: falta la clave.
- 32 pruebas en `tests/` (`npm test`) y recorrido en navegador `scripts/e2e.mjs` (`npm run e2e`).

## Cómo arrancar
```bash
git clone https://github.com/quiqueb06/LegacyArchive && cd LegacyArchive
git checkout feat/demo-expediente
npm install            # Node 22.13 o superior
cp .env.example .env.local   # y pon tu CROMA_API_KEY (no la compartas en el chat)
npm run dev            # http://localhost:3000
```

## Tareas para ti (independientes de las mías)
Yo (Claude en la sesión de quique) sigo con: recorrido e2e, README, guion de 3 minutos y PR. No toques `src/app/tramite/**`, `scripts/e2e.mjs` ni `README.md` para evitar conflictos.

### Tarea 1 — Probar Croma de verdad (prioridad alta, el equipo la exige)
1. Con `CROMA_API_KEY` en `.env.local`, abre `/catalogo` y pulsa «Extraer candidatos con Croma» en cada fuente oficial (5 URL).
2. Si falla, mira el mensaje guardado (incluye el `X-Request-Id`) y corrige `src/server/croma.ts`. Documentación: https://docs.usecroma.com/guides/global/generate.md (POST `https://api.croma.run/global/generate/json/v1`, cuerpo `url`, `instructions`, `json_schema`, `effort`; respuesta en `result`; errores en `error.code`).
3. Compara los candidatos con `catalog/catalogo.json` y escribe `docs/croma-resultados.md`: fecha y hora, URL, qué coincidió, qué faltó o sobró. **No cambies el catálogo automáticamente.** Si hay que corregirlo, hazlo a mano en un commit aparte que diga «revisión humana de la extracción de Croma del <fecha>».
4. Si funciona, cambia `"croma": { "estado": "probado", "nota": "..." }` en el catálogo con la fecha de la prueba. Si no funciona antes de las 2:30, déjalo en `pendiente` y anótalo.
5. Una extracción guardada se muestra como «Extracción candidata» con fecha. Nunca la presentes como llamada en vivo si no lo es.

### Tarea 2 — Diapositivas de la presentación (3 minutos)
- Usa la skill `frontend-slides` (si tu cuenta no la tiene, un HTML simple basta). Carpeta: `presentacion/`.
- Basa el contenido en `docs/GUION.md` (lo escribo yo; estará en la rama a las ~2:20) y en las capturas de `docs/capturas/`.
- 6 diapositivas máximo: problema (la persona como puente entre sistemas), qué hace LegacyArchive, demo en vivo (momento clave: el IGSS ya tiene los datos), qué es real y qué está simulado, Croma, cierre.
- No anuncies porcentajes de ahorro: solo cifras medidas en la demo (campos reutilizados, escritos, pendientes, tiempo del recorrido).

### Tarea 3 — Ensayo en la laptop de la presentación
- Corre `npm run build && npm start` en la laptop que se usará. Pulsa «Reiniciar la demo» en `/expediente` antes de presentar.
- Si algo falla, abre un issue o avísale a quique con el paso exacto y el error.

## Skills
- En el repo: `.claude/skills/` (superpowers: brainstorming, writing-plans, test-driven-development, systematic-debugging, verification-before-completion, requesting-code-review…). Claude Code las carga al abrir el repo.
- De la cuenta de quique (si tu cuenta las tiene): `emil-design-eng` para pulido de interfaz y `frontend-slides` para la presentación.

## Prompt sugerido para tu sesión de Claude
> Lee `CLAUDE.md` y `docs/HANDOFF.md` del repo LegacyArchive (rama `feat/demo-expediente`). Usa las skills de superpowers de `.claude/skills`. Haz la Tarea 1 (probar Croma) y luego la Tarea 2 (diapositivas). Trabaja en la rama `feat/croma-y-presentacion`, sin `Co-Authored-By: Claude` en los commits, y abre un PR contra `feat/demo-expediente`. Tengo hasta las 3:00 p. m. de Guatemala.
