import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // node:sqlite es un módulo nativo de Node; se usa solo en el servidor.
  serverExternalPackages: [],
  poweredByHeader: false,
};

export default nextConfig;
