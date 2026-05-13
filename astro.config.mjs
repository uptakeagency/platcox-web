import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  site: "https://www.platcox.com",
  integrations: [
    react(),
    tailwind(),
    // motion-playground dev-only; sitemap.xml'e dahil edilmesin.
    // Tam pathname eşleşmesi — suffix match dynamic news/[...slug] gibi
    // route'larda /news/motion-playground/ varsa onu da düşürürdü (Codex P3).
    sitemap({
      filter: (page) => new URL(page).pathname !== "/motion-playground/",
    }),
  ],
});
