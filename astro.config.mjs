import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import node from "@astrojs/node";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  site: "https://www.platcox.com",
  adapter: node({ mode: "standalone" }),
  integrations: [
    react(),
    tailwind(),
    sitemap(),
  ],
  server: { host: true },
});
