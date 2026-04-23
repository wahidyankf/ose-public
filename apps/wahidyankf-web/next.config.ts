import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../"),
  transpilePackages: ["@open-sharia-enterprise/ts-ui", "@open-sharia-enterprise/ts-ui-tokens"],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
