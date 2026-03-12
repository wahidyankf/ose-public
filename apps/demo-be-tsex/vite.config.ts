import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/main.ts",
      formats: ["es"],
      fileName: "main",
    },
    target: "node20",
    ssr: true,
    rollupOptions: {
      external: /^node:/,
    },
  },
});
