import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  basePath: "/empresarial",
  async redirects() {
    return [
      {
        source: "/",
        destination: "/empresarial",
        permanent: false,
        basePath: false,
      },
    ];
  },
};

export default nextConfig;
