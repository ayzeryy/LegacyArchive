# Demo de expediente reutilizable — Plan de implementación

> **Para agentes:** usar superpowers:executing-plans. Pasos con casillas (`- [ ]`).

**Objetivo:** que María (comerciante individual ficticia) prepare el expediente del Registro Mercantil y luego el de inscripción patronal del IGSS reutilizando datos de dos fuentes sintéticas incompatibles.

**Arquitectura:** Next.js 15 (App Router) con páginas de servidor que leen SQLite (`node:sqlite`) y endpoints `/api/*` para las mutaciones. El dominio (`src/domain`) es TypeScript puro y sin E/S: adaptadores, vinculación, motor de requisitos y exportación. `src/server` persiste. El catálogo público vive en `catalog/` (JSON versionado); el expediente privado vive en `data/` (fuera de git).

**Stack:** Next.js, TypeScript, Tailwind 4, Zod, SQLite nativo de Node 22, Vitest, Playwright (verificación de recorrido).

## Mapa de archivos

| Archivo | Responsabilidad |
|---|---|
| `src/domain/conceptos.ts` | Conceptos del modelo común y sus etiquetas |
| `src/domain/normalizar.ts` | Claves de comparación, CUI, NIT, fechas heredadas |
| `src/domain/adaptadores.ts` | CSV heredado (Windows-1252, `;`) y JSON de exportación → registros normalizados |
| `src/domain/vinculacion.ts` | Vincular solo por referencia de expediente + identificadores exactos |
| `src/domain/catalogo.ts` | Esquema Zod del catálogo y carga |
| `src/domain/motor.ts` | Estado de cada requisito, conflictos, avance, reutilización |
| `src/domain/exportar.ts` | JSON descargable con procedencia y estado real |
| `src/server/db.ts`, `src/server/repo.ts` | Esquema SQLite y consultas |
| `tests/*.test.ts` | Criterios de aceptación como pruebas |
| `scripts/e2e.mjs` | Recorrido completo en navegador real |

## Tareas

- [ ] 1. Pruebas de adaptadores (RED) → adaptadores (GREEN)
- [ ] 2. Pruebas de vinculación: nombre igual + CUI distinto no vincula
- [ ] 3. Pruebas del motor: fiscal ≠ comercial, conflicto conserva ambos, faltantes, vigencia, reutilización
- [ ] 4. Persistencia: reabrir la base conserva valores y confirmaciones
- [ ] 5. Exportación: estado «Borrador incompleto» vs «Preparado para revisión según el catálogo de la demo»
- [ ] 6. Interfaz de cinco vistas y endpoints
- [ ] 7. Recorrido e2e con los archivos de `muestras/`
- [ ] 8. README, guion de 3 minutos, verificación final
