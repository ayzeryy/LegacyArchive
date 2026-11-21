import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mantener el cliente y el driver local fuera del bundle del servidor.
  serverExternalPackages: ["@libsql/client", "libsql"],
  poweredByHeader: false,
};

export default nextConfig;
