import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // The design system lives beside the app and is imported, never copied.
      "@design-system": fileURLToPath(new URL("../design-system", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    // Let the dev server read ../design-system.
    fs: { allow: [repoRoot] },
    proxy: { "/api": "http://127.0.0.1:8000" },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    css: false,
  },
});
