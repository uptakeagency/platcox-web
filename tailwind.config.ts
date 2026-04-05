import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{astro,html,js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#FAFAFA",
        surface: "#FFFFFF",
        "surface-alt": "#F5F5F5",
        text: "#1A1A1A",
        muted: "#999999",
        dark: "#1A1A2E",
        accent: "#22C55E",
        border: "#E5E7EB",
      },
      fontFamily: {
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
