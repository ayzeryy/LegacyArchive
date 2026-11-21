import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "@fontsource-variable/public-sans";
import "./globals.css";

export const metadata: Metadata = {
  title: "LegacyArchive · Demo Guatemala",
  description: "Prepara expedientes del Registro Mercantil y del IGSS reutilizando información, con datos sintéticos.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0e6b62" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-GT">
      <body className="min-h-dvh">
        <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 boton boton-secundario">Saltar al contenido</a>
        <div className="no-imprimir bg-tinta text-white text-sm">
          <p className="mx-auto max-w-6xl px-4 py-2">
            <strong className="font-semibold">Demo con datos sintéticos.</strong> No se conecta con Registro Mercantil, SAT, RENAP ni IGSS. Nada aquí es una inscripción presentada ni aprobada.
          </p>
        </div>
        <header className="no-imprimir border-b border-linea bg-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
              <span aria-hidden className="grid size-8 place-items-center rounded-lg bg-marca text-white text-sm">LA</span>
              LegacyArchive
            </Link>
            <nav aria-label="Principal" className="flex gap-1 text-sm font-medium">
              <Link className="rounded-md px-3 py-2 hover:bg-papel" href="/">Trámites</Link>
              <Link className="rounded-md px-3 py-2 hover:bg-papel" href="/expediente">Mi expediente</Link>
              <Link className="rounded-md px-3 py-2 hover:bg-papel" href="/catalogo">Catálogo</Link>
            </nav>
          </div>
        </header>
        <main id="contenido" className="mx-auto max-w-6xl px-4 py-6 sm:py-10">{children}</main>
      </body>
    </html>
  );
}
