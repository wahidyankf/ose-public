import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

export default defineConfig({
  server: {
    port: 3301,
    proxy: {
      "/api": process.env.BACKEND_URL || "http://localhost:8201",
      "/health": process.env.BACKEND_URL || "http://localhost:8201",
      "/.well-known": process.env.BACKEND_URL || "http://localhost:8201",
    },
  },
  plugins: [tanstackStart()],
});
