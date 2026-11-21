import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ErrorDemo } from "./repo";

export async function responder(fn: () => Promise<unknown> | unknown) {
  try {
    const r = await fn();
    return NextResponse.json({ ok: true, ...(r && typeof r === "object" ? r : {}) });
  } catch (e) {
    if (e instanceof ErrorDemo) return NextResponse.json({ ok: false, error: e.message }, { status: e.estado });
    if (e instanceof z.ZodError) return NextResponse.json({ ok: false, error: "Datos de la solicitud inválidos: " + e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") }, { status: 400 });
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error inesperado en el servidor. Tus datos guardados no se modificaron." }, { status: 500 });
  }
}
