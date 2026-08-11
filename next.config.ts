import type { NextConfig } from "next";

/** Prefixo público — manter igual a `NEXT_PUBLIC_BASE_PATH` no `.env*`. */
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "/empresarial").replace(/\/$/, "");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  basePath: basePath || undefined,
  async redirects() {
    if (!basePath) return [];
    return [
      {
        source: "/",
        destination: basePath,
        permanent: false,
        basePath: false,
      },
    ];
  },
};

export default nextConfig;
