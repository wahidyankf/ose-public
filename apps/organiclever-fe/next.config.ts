import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@open-sharia-enterprise/ts-ui", "@open-sharia-enterprise/ts-ui-tokens"],
};

export default nextConfig;
