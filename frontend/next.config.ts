import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // El E2E de Playwright accede por 127.0.0.1 mientras `next dev` se anuncia en
  // localhost. Sin esta lista, Next bloquea sus recursos de desarrollo y la
  // hidratación del cliente no ocurre (formularios quedan deshabilitados).
  allowedDevOrigins: ["127.0.0.1"]
};

export default nextConfig;
