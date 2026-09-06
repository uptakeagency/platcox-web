import { defineConfig, envField } from "astro/config";
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
  env: {
    schema: {
      // Turnstile site anahtarı public'tir; build'de gömülür. Eksikse build düşer (fallback yok).
      PUBLIC_TURNSTILE_SITE_KEY: envField.string({ context: "client", access: "public" }),
    },
  },
});
