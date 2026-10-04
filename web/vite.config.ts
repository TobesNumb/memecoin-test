import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));

export default defineConfig({
  // Relatieve paden: de build werkt dan ook onder een subpad (bijv. GitHub Pages).
  base: "./",
  // De map assets/ in de projectmap wordt als / geserveerd (bijv. /logo.png).
  publicDir: fileURLToPath(new URL("../assets", import.meta.url)),
  server: {
    // token.config.ts staat buiten web/; sta de projectmap toe.
    fs: { allow: [projectRoot] },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
