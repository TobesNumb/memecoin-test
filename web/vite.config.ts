import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import { tokenConfig } from "../token.config";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));

/** Site-URL met slash op het einde, of een lege string als er nog geen website is. */
const siteUrl = tokenConfig.links.website ? tokenConfig.links.website.replace(/\/?$/, "/") : "";

/** Vult de %PLACEHOLDERS% in index.html met waarden uit token.config.ts. */
function tokenMeta(): Plugin {
  return {
    name: "token-meta",
    transformIndexHtml(html) {
      return html
        .replaceAll("%NAME%", tokenConfig.name)
        .replaceAll("%SYMBOL%", tokenConfig.symbol)
        .replaceAll("%DESCRIPTION%", tokenConfig.description)
        .replaceAll("%SITE_URL%", siteUrl)
        .replaceAll("%LOGO_URL%", `${siteUrl || "./"}logo.png`);
    },
  };
}

export default defineConfig({
  // Relatieve paden: de build werkt dan ook onder een subpad (bijv. GitHub Pages).
  base: "./",
  // De map assets/ in de projectmap wordt als / geserveerd (bijv. /logo.png).
  publicDir: fileURLToPath(new URL("../assets", import.meta.url)),
  plugins: [tokenMeta()],
  server: {
    // token.config.ts staat buiten web/; sta de projectmap toe.
    fs: { allow: [projectRoot] },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
