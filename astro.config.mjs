import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  site: "https://www.platcox.com",
  integrations: [
    react(),
    tailwind(),
    sitemap(),
  ],
});
