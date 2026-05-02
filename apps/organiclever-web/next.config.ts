import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@open-sharia-enterprise/ts-ui", "@open-sharia-enterprise/ts-ui-tokens"],
  images: {
    unoptimized: true,
  },
  // Permanent 308 from /app to /app/home. Implemented at the config level so
  // both dev (`nx dev`) and production builds emit the same HTTP status — the
  // server-component `permanentRedirect()` form returns 200 + RSC payload in
  // dev mode and breaks the e2e redirect-status assertion.
  async redirects() {
    return [
      {
        source: "/app",
        destination: "/app/home",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
