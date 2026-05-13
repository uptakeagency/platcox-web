import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  site: "https://www.platcox.com",
  integrations: [
    react(),
    tailwind(),
    // motion-playground dev-only; sitemap.xml'e dahil edilmesin (Codex Task 0.15 P3).
    sitemap({
      filter: (page) => !page.endsWith("/motion-playground/"),
    }),
  ],
});
