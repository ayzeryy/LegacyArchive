# Guion de presentación — 3 minutos

**Antes:** `npm start`, «Reiniciar la demo» en Mi expediente, pestaña abierta en Trámites. Ten a mano `muestras/documentos/`.

## 0:00–0:25 · El problema
«En Guatemala, quien abre un negocio es el puente entre sistemas que no se hablan. María, una comerciante ficticia, tiene sus datos en un sistema antiguo y en un gestor más nuevo, con formatos distintos. Cada trámite le pide escribir todo otra vez.»

## 0:25–0:50 · Importar y normalizar
- Escribe «negocio» en el buscador → Registro Mercantil → «Empezar este trámite» → «Cargar caso de demostración».
- «Un CSV de 2019 en Windows-1252 y un JSON de 2025. LegacyArchive los lleva a un modelo común y guarda de dónde salió cada valor.»
- Señala: «Esta persona se llama casi igual pero tiene otro CUI: **no se vincula por nombre**. Y este registro tiene la misma referencia y otro CUI: queda bloqueado.»

## 0:50–1:20 · Revisar y resolver
- Revisar información → dirección de la empresa **en conflicto**. Abre «De…»: campo `DIR_NEG` de 2019 y `business_address` de 2025.
- Elige la de 2025, motivo «El negocio se trasladó en 2024», «Resolver diferencia». «La otra no se borra.»
- «Confirmar los datos sin conflicto.» Menciona: «la dirección fiscal nunca rellena la de la empresa».

## 1:20–1:45 · Pendientes y primer expediente
- Completar pendientes: estado civil, «Al inscribirse», 2 empleados, DPI de muestra.
- «Los comprobantes de pago faltan: se obtienen en Banrural.» Preparar → «Descargar expediente preparado» → **Borrador incompleto**.

## 1:45–2:30 · El momento clave: el segundo trámite
- «Semanas después María ya tiene su patente y su RTU.» Mi expediente → carga patente y RTU de muestra: «representan documentos obtenidos previamente; no los emitimos».
- Buscador «IGSS» → «Empezar este trámite» → **«Tu expediente ya tiene información compatible»** → «Usar mi información».
- Revisar: «Nombres, NIT, la dirección que resolvimos y el DPI ya están, con su origen. María no escribió nada.»
- Pendientes: trabajadores a inscribir (la sugerencia es un dato relacionado, no el mismo), declarar el RTU ratificado.
- Descargar → **Preparado para revisión según el catálogo de la demo**. Lee las cifras: reutilizados vs. escritos.

## 2:30–2:50 · Qué es real
- «Importación, normalización, conflictos, reutilización y persistencia son reales: si reinicio el servidor, todo sigue.»
- «El catálogo sale de las páginas oficiales del Registro Mercantil y del IGSS, revisadas hoy, con su fuente en cada requisito. Croma propone requisitos desde esas páginas y una persona los revisa.» (Croma se probó hoy: muestra `/catalogo` con las extracciones candidatas guardadas, con fecha y ID de solicitud. No son llamadas en vivo y no cambian el catálogo sin revisión.)
- «No nos conectamos con instituciones ni aprobamos nada: entregamos un expediente para el canal oficial.»

## 2:50–3:00 · Cierre
«Preparamos dos expedientes a partir de información reutilizada de fuentes con estructuras distintas. Mostramos qué falta y qué requiere confirmación, y dejamos el resultado listo para continuar por el canal oficial.»

**No digas** porcentajes de ahorro: solo las cifras que muestra la pantalla.
