// Genera muestras/padron_antiguo_2012.dbf: tabla dBASE III SINTÉTICA, en Windows-1252,
// con las mismas columnas del CSV del sistema antiguo. Uso: node scripts/generar-dbf.mjs
import { writeFileSync } from "node:fs";

const CAMPOS = [
  ["NO_EXP", 12], ["DPI_NO", 16], ["NIT_CONT", 11], ["NOM1", 15], ["NOM2", 15], ["APE1", 15], ["APE2", 15],
  ["NACION", 14], ["PROFESION", 20], ["DIR_FISC", 60], ["DIR_NEG", 60], ["TEL", 10], ["NOM_COM", 30],
  ["ACT_ECO", 45], ["FEC_ACT", 10], ["MUESTRA", 10],
];
const FILAS = [
  { borrado: false, v: ["LA-DEMO-001", "3021 45678 0108", "8451273-6", "MARIA", "IXCHEL", "LOPEZ", "CUMEZ", "GUATEMALTECA", "ARTESANA TEXTIL",
    "12 CALLE 5-40 ZONA 1, SAN JUAN SACATEPEQUEZ, GUATEMALA", "4A. CALLE 3-21 ZONA 1, SAN JUAN SACATEPEQUEZ, GUATEMALA", "7830 1122",
    "TEJIDOS IXCHEL", "VENTA AL POR MENOR DE TEXTILES TÍPICOS", "08/05/2012", "SINTETICO"] },
  { borrado: true, v: ["LA-DEMO-001", "3021 45678 0108", "8451273-6", "MARIA", "", "LOPEZ", "", "GUATEMALTECA", "", "REGISTRO BORRADO", "", "", "", "", "01/01/2010", "SINTETICO"] },
  { borrado: false, v: ["LA-DEMO-003", "1987 65432 0101", "7712345-0", "JOSE", "ARMANDO", "PEREZ", "SIC", "GUATEMALTECA", "CARPINTERO",
    "5 CALLE 2-10 ZONA 4, CHIMALTENANGO", "5 CALLE 2-10 ZONA 4, CHIMALTENANGO", "3321 6540", "CARPINTERIA PEREZ", "FABRICACIÓN DE MUEBLES", "11/09/2012", "SINTETICO"] },
];

// Windows-1252 para el subconjunto que usamos (ASCII + acentos de Latin-1).
const cp1252 = (s) => Uint8Array.from([...s].map((c) => { const n = c.codePointAt(0); if (n > 255) throw new Error(c); return n; }));

const largoCabecera = 32 + 32 * CAMPOS.length + 1;
const largoRegistro = 1 + CAMPOS.reduce((a, [, l]) => a + l, 0);
const buf = new Uint8Array(largoCabecera + largoRegistro * FILAS.length + 1);
const dv = new DataView(buf.buffer);
buf[0] = 0x03; buf[1] = 112; buf[2] = 5; buf[3] = 8; // dBASE III, última actualización 2012-05-08
dv.setUint32(4, FILAS.length, true);
dv.setUint16(8, largoCabecera, true);
dv.setUint16(10, largoRegistro, true);
buf[29] = 0x03; // marca de página de códigos Windows-1252
CAMPOS.forEach(([nombre, largo], i) => {
  const o = 32 + i * 32;
  buf.set(cp1252(nombre), o);
  buf[o + 11] = "C".charCodeAt(0);
  buf[o + 16] = largo;
});
buf[largoCabecera - 1] = 0x0d;
FILAS.forEach((f, r) => {
  let o = largoCabecera + r * largoRegistro;
  buf[o++] = f.borrado ? 0x2a : 0x20;
  CAMPOS.forEach(([, largo], i) => {
    const v = cp1252(f.v[i].padEnd(largo, " ").slice(0, largo));
    if (f.v[i].length > largo) throw new Error(`Campo demasiado largo: ${f.v[i]}`);
    buf.set(v, o);
    o += largo;
  });
});
buf[buf.length - 1] = 0x1a;
writeFileSync(new URL("../muestras/padron_antiguo_2012.dbf", import.meta.url), buf);
console.log("muestras/padron_antiguo_2012.dbf", buf.length, "bytes");
