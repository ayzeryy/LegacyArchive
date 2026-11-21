// Recorrido completo en navegador real con los archivos de muestras/.
// Uso: npm run build && npm run e2e
import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const { chromium } = createRequire(import.meta.url)("playwright");

const PUERTO = 3123;
const BASE = `http://localhost:${PUERTO}`;
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const capturas = process.env.CAPTURAS_DIR || path.join(raiz, "docs", "capturas");
const ESCALA = Number(process.env.ESCALA || 1);
const EXT = process.env.FORMATO === "jpg" ? "jpg" : "png";
mkdirSync(capturas, { recursive: true });
const db = path.join(mkdtempSync(path.join(os.tmpdir(), "la-e2e-")), "e2e.db");

function iniciar() {
  const p = spawn(process.execPath, [path.join(raiz, "node_modules", "next", "dist", "bin", "next"), "start", "-p", String(PUERTO)], { cwd: raiz, env: { ...process.env, LEGACYARCHIVE_DB_PATH: db, TURSO_DATABASE_URL: "", TURSO_AUTH_TOKEN: "", VERCEL: "" }, stdio: "pipe" });
  return new Promise((ok, mal) => {
    const t = setTimeout(() => mal(new Error("El servidor no inició")), 30000);
    p.stdout.on("data", (d) => { if (String(d).includes("Ready")) { clearTimeout(t); ok(p); } });
    p.stderr.on("data", (d) => process.stderr.write(d));
  });
}

const pasos = [];
const ok = (m) => { pasos.push(m); console.log("✓", m); };
function afirmar(c, m) { if (!c) throw new Error("Falló: " + m); ok(m); }

let servidor = await iniciar();
const navegador = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
const ctx = await navegador.newContext({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: ESCALA, acceptDownloads: true });
const page = await ctx.newPage();
page.setDefaultTimeout(10000);
// Captura de la pantalla visible, centrada en el elemento que importa en ese paso.
async function foto(p, nombre, foco) {
  if (foco) await p.locator(foco).first().evaluate((el) => el.scrollIntoView({ block: "center" }));
  else await p.evaluate(() => window.scrollTo(0, 0));
  await p.waitForTimeout(350);
  await p.screenshot({ path: path.join(capturas, `${nombre}.${EXT}`), ...(EXT === "jpg" ? { quality: 82 } : {}) });
}
const t0 = Date.now();
try {
  // 1. Elegir proceso y tipo de solicitante
  await page.goto(BASE);
  await page.getByPlaceholder(/abrir mi negocio/).fill("negocio");
  afirmar(await page.getByRole("link", { name: /Inscripción patronal/ }).count() === 0, "0. La búsqueda «negocio» filtra los trámites");
  await page.getByRole("link", { name: /Inscripción de comerciante individual/ }).click();
  await page.waitForURL(/rm-comerciante-empresa\/inicio/);
  await page.getByText("Video de ejemplo pendiente de grabar").waitFor();
  await foto(page, "0-inicio-tramite");
  await page.getByRole("button", { name: "Empezar este trámite" }).click();
  await page.waitForURL(/tramite\/rm-comerciante-empresa$/);
  ok("1. Busca el trámite, ve el video de ejemplo y lo abre como persona individual");

  // 2. Importación inválida, luego caso de demostración
  await page.locator('input[type=file][accept=".csv,.dbf,.json,.mdb"]').setInputFiles(path.join(raiz, "muestras", "importacion_invalida.csv"));
  await page.locator("p[role=alert]").waitFor();
  afirmar((await page.locator("p[role=alert]").innerText()).includes("Faltan las columnas"), "2a. Una importación inválida muestra el error y no guarda nada");
  await page.getByRole("button", { name: "Cargar caso de demostración" }).click();
  await page.getByText("exportacion_gestor_2025.json").first().waitFor();
  afirmar(await page.getByText(/no se vincula por semejanza de nombre/).count() > 0, "2b. Nombre parecido con otro CUI no se vincula");
  afirmar(await page.getByText(/no coincide con el del expediente/).count() > 0, "2c. Misma referencia con CUI distinto queda bloqueado");
  await foto(page, "1-fuentes", "li:has-text(\"exportacion_gestor_2025.json\")");

  // 3-4. Revisar y resolver conflicto
  await page.goto(`${BASE}/tramite/rm-comerciante-empresa?paso=revisar`);
  const conflicto = page.locator("#req-rm-direccion-empresa");
  afirmar(await conflicto.getByText("En conflicto").count() === 1, "3. La dirección de la empresa aparece en conflicto con ambos valores");
  afirmar(await page.locator("#req-rm-direccion-empresa").getByText(/12 Calle 5-40/).count() === 0, "3b. La dirección fiscal no se propone como dirección de la empresa");
  await foto(page, "2-conflicto", "#req-rm-direccion-empresa");
  await conflicto.locator("label", { hasText: "7a. Avenida 5-10, Zona 2" }).click();
  await conflicto.getByLabel(/Motivo de tu elección/).fill("El negocio se trasladó en 2024");
  await conflicto.getByRole("button", { name: "Resolver diferencia" }).click();
  await conflicto.getByText("Confirmado por la persona").waitFor();
  ok("4. Conflicto resuelto con motivo");
  await page.getByRole("button", { name: /Confirmar los \d+ datos sin conflicto/ }).click();
  await page.getByRole("button", { name: /Confirmar los \d+ datos sin conflicto/ }).waitFor({ state: "detached" });
  ok("4b. Datos disponibles confirmados");

  // 5. Pendientes
  await page.goto(`${BASE}/tramite/rm-comerciante-empresa?paso=pendientes`);
  const fila = (id) => page.locator(`#req-${id}`);
  await fila("rm-estado-civil").locator("select").selectOption("Soltera/o");
  await fila("rm-estado-civil").getByRole("button", { name: "Guardar dato" }).click();
  await fila("rm-estado-civil").getByText("Confirmado por la persona").waitFor();
  await fila("rm-fecha-inicio").locator("input").fill("Al inscribirse");
  await fila("rm-fecha-inicio").getByRole("button", { name: "Guardar dato" }).click();
  await fila("rm-fecha-inicio").getByText("Confirmado por la persona").waitFor();
  await fila("rm-empleados").locator("input").fill("2");
  await fila("rm-empleados").getByRole("button", { name: "Guardar dato" }).click();
  await fila("rm-empleados").getByText("Confirmado por la persona").waitFor();
  await fila("rm-dpi").locator("input[type=file]").setInputFiles(path.join(raiz, "muestras", "documentos", "dpi_MUESTRA.pdf"));
  await fila("rm-dpi").getByRole("button", { name: "Aportar documento" }).click();
  await fila("rm-dpi").getByRole("button", { name: "Confirmar documento" }).click();
  await fila("rm-dpi").getByText("Confirmado por la persona").waitFor();
  afirmar(await fila("rm-pago-empresa").getByText("Faltante").count() === 1, "5. Los comprobantes de pago ausentes aparecen como faltantes");
  await foto(page, "3-pendientes", "#req-rm-pago-empresa");

  // 6. Descargar primer expediente
  await page.goto(`${BASE}/tramite/rm-comerciante-empresa?paso=preparar`);
  const [d1] = await Promise.all([page.waitForEvent("download"), page.getByRole("link", { name: "Descargar expediente preparado" }).click()]);
  const j1 = JSON.parse(readFileSync(await d1.path(), "utf8"));
  afirmar(j1.estado === "Borrador incompleto", "6. El primer expediente se descarga como «Borrador incompleto»");
  await foto(page, "4-preparar-rm");

  // 7. Documentos obtenidos previamente
  await page.goto(`${BASE}/expediente#documentos`);
  for (const [tipo, archivo] of [["patente_empresa", "patente_empresa_MUESTRA.pdf"], ["constancia_rtu", "constancia_rtu_MUESTRA.pdf"]]) {
    await page.locator("#tipo-doc").selectOption(tipo);
    await page.locator("#arch-doc").setInputFiles(path.join(raiz, "muestras", "documentos", archivo));
    await page.getByLabel(/representa uno obtenido previamente/).check();
    await page.getByRole("button", { name: "Agregar al expediente" }).click();
    await page.getByText(/agregado al expediente/).waitFor();
  }
  ok("7. Patente y RTU sintéticos cargados como documentos obtenidos previamente");

  // 8. IGSS reutiliza
  await page.goto(BASE);
  await page.getByPlaceholder(/abrir mi negocio/).fill("igss");
  await page.getByRole("link", { name: /Inscripción patronal/ }).click();
  await page.getByRole("button", { name: "Empezar este trámite" }).click();
  await page.waitForURL(/tramite\/igss-inscripcion-patronal$/);
  await page.getByText("Tu expediente ya tiene información compatible").waitFor();
  await foto(page, "5-igss-reutilizar");
  await page.getByRole("button", { name: "Usar mi información en este trámite" }).click();
  await page.goto(`${BASE}/tramite/igss-inscripcion-patronal?paso=revisar`);
  const dir = page.locator("#req-igss-direccion-empresa");
  afirmar((await dir.innerText()).includes("7a. Avenida 5-10") && (await dir.innerText()).includes("Confirmado por la persona"), "8. La dirección resuelta en el primer trámite se reutiliza en IGSS sin escribirla");
  await foto(page, "6-igss-revisar", "#req-igss-direccion-empresa");
  await page.getByRole("button", { name: /Confirmar los \d+ datos sin conflicto/ }).click();
  await page.getByRole("button", { name: /Confirmar los \d+ datos sin conflicto/ }).waitFor({ state: "detached" });

  // 9. Completar pendientes y descargar
  await page.goto(`${BASE}/tramite/igss-inscripcion-patronal?paso=pendientes`);
  afirmar(await fila("igss-trabajadores").getByText(/Dato relacionado, no equivalente/).count() === 1, "9a. «Empleados a contratar» se sugiere como relacionado, no se reutiliza automáticamente");
  await fila("igss-trabajadores").locator("input").fill("2");
  await fila("igss-trabajadores").getByRole("button", { name: "Guardar dato" }).click();
  await fila("igss-trabajadores").getByText("Confirmado por la persona").waitFor();
  afirmar(await fila("igss-dpi").getByText("Confirmado por la persona").count() === 1, "9b. La copia del DPI confirmada en el primer trámite se reutiliza");
  await fila("igss-patente").getByRole("button", { name: "Confirmar documento" }).click();
  await fila("igss-patente").getByText("Confirmado por la persona").waitFor();
  await fila("igss-rtu").getByLabel(/Declaro que cumple/).check();
  await fila("igss-rtu").getByRole("button", { name: "Confirmar documento" }).click();
  await fila("igss-rtu").getByText("Confirmado por la persona").waitFor();
  await page.goto(`${BASE}/tramite/igss-inscripcion-patronal?paso=preparar`);
  const [d2] = await Promise.all([page.waitForEvent("download"), page.getByRole("link", { name: "Descargar expediente preparado" }).click()]);
  const j2 = JSON.parse(readFileSync(await d2.path(), "utf8"));
  afirmar(j2.estado === "Preparado para revisión según el catálogo de la demo", "9c. El segundo expediente sale «Preparado para revisión según el catálogo de la demo»");
  ok(`   Reutilizados: ${j2.resumen.reutilizados}, escritos en IGSS: ${j2.resumen.escritos_en_este_tramite}`);
  await foto(page, "7-preparar-igss");

  // 10. Cerrar y reabrir
  servidor.kill("SIGTERM");
  await new Promise((r) => setTimeout(r, 1500));
  servidor = await iniciar();
  await page.goto(`${BASE}/tramite/igss-inscripcion-patronal?paso=preparar`);
  afirmar(await page.getByText("Preparado para revisión según el catálogo de la demo").first().count() === 1, "10. Tras reiniciar el servidor se conservan datos y confirmaciones");
  await page.goto(`${BASE}/tramite/igss-inscripcion-patronal/resumen`);
  await foto(page, "8-resumen-imprimible");

  // Móvil
  const movil = await navegador.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: ESCALA });
  await movil.goto(`${BASE}/tramite/rm-comerciante-empresa?paso=revisar`);
  const ancho = await movil.evaluate(() => document.documentElement.scrollWidth);
  afirmar(ancho <= 390, `Sin desplazamiento horizontal en pantalla de 390 px (ancho ${ancho})`);
  await foto(movil, "9-movil", "#req-rm-direccion-empresa");
  console.log(`\nRecorrido completo en ${Math.round((Date.now() - t0) / 1000)} s. ${pasos.length} comprobaciones.`);
} catch (e) {
  await page.screenshot({ path: path.join(capturas, "error.png"), fullPage: true });
  console.error(e);
  process.exitCode = 1;
} finally {
  await navegador.close();
  servidor.kill("SIGTERM");
}
