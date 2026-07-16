# PlatcoX Web Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild platcox.com as a Palantir-inspired Astro SSG site with React islands, cinematic scroll animations, and LLM SEO — deployed on Coolify.

**Architecture:** Single-page corporate site built with Astro 6 hybrid output (static + one SSR endpoint for contact form). React islands handle only interactive pieces (menu, form, map, testimonials carousel, scroll animations). Everything else ships zero JS.

**Tech Stack:** Astro 6, React 19, Framer Motion, Tailwind CSS v4, Resend API, Bun, Coolify (Docker)

**Design Spec:** `docs/superpowers/specs/2026-04-05-platcox-web-redesign-design.md`

**IMPORTANT — Design Direction Change (Palantir-Inspired):**
The spec was updated to a Palantir-inspired light theme. When implementing each task, refer to the UPDATED spec for:
- **Color palette:** Light theme (#FAFAFA bg, #1A1A1A text, #22C55E accent minimal)
- **Typography:** Inter only, light weight (300) for headings, large sizes, tight letter-spacing
- **Layout:** Massive whitespace (160-200px section padding), section numbering (/0.1, /0.2), thin 1px dividers
- **Visual language:** Sharp corners (no rounded), monochrome dominant, green only in logo "X"
- **New sections:** TestimonialsCarousel (horizontal scrolling quotes), DualCTA footer (two large blocks)
- **Hero:** No video — product mockup in laptop frame + thin heading. "Scroll to Explore" indicator.
- **Sustainability:** Dark background block (#1A1A2E) for contrast
- **Solutions:** Numbered list with dividers (not grid cards)
- **About:** Numbered items (/0.1, /0.2, /0.3) with scroll-triggered text color reveal

---

## File Map

```
platcox-web/
├── astro.config.mjs              # Astro config: hybrid, react, sitemap, tailwind
├── tailwind.config.ts            # Palantir Light palette, Inter font
├── tsconfig.json                 # TypeScript strict config
├── package.json                  # Dependencies and scripts
├── Dockerfile                    # Multi-stage: bun build → bun serve
├── .env.example                  # RESEND_API_KEY placeholder
├── .gitignore
├── public/
│   ├── llms.txt                  # LLM-readable site summary
│   ├── robots.txt                # Crawler permissions + llms.txt ref
│   ├── favicon.svg               # platcoX logo favicon
│   └── images/                   # Section imagery, hero mockup
├── src/
│   ├── layouts/
│   │   └── BaseLayout.astro      # HTML shell, JSON-LD, OG tags, font preloads
│   ├── components/
│   │   ├── Header.astro          # Fixed header: logo + hamburger
│   │   ├── MobileMenu.tsx        # React island: full-screen menu overlay
│   │   ├── ScrollReveal.tsx      # React island: Framer Motion scroll wrapper
│   │   ├── HeroSection.astro     # Video bg + hero text
│   │   ├── AboutSection.astro    # Text-focused about
│   │   ├── PhilosophySection.astro # 3 principle cards
│   │   ├── SolutionsSection.astro  # 3+2 grid icon cards
│   │   ├── ClientsWhySection.astro # Split two-column
│   │   ├── SustainabilitySection.astro # YouTube + 3 pillars
│   │   ├── NewsSection.astro     # Content collection cards
│   │   ├── ContactSection.astro  # Form + company info wrapper
│   │   ├── ContactForm.tsx       # React island: form + Resend submit
│   │   ├── LocationsSection.astro # Map wrapper
│   │   ├── WorldMap.tsx          # React island: SVG map + hover
│   │   ├── TestimonialsSection.astro  # Testimonials wrapper
│   │   ├── TestimonialsCarousel.tsx   # React island: horizontal scroll
│   │   ├── DualCTA.astro         # Two large CTA blocks (Palantir style)
│   │   └── Footer.astro          # Minimal copyright + LinkedIn
│   ├── content/
│   │   ├── config.ts             # Content collection schema (news)
│   │   └── news/
│   │       ├── ai-ticaret.md     # Sample article 1
│   │       └── surdurulebilirlik.md # Sample article 2
│   ├── pages/
│   │   ├── index.astro           # Assembles all sections
│   │   ├── news/
│   │   │   └── [...slug].astro   # Dynamic news detail pages
│   │   └── api/
│   │       └── contact.ts        # SSR endpoint → Resend
│   └── styles/
│       └── global.css            # Tailwind imports + custom utilities
```

---

### Task 1: Project Scaffold & Configuration

**Files:**
- Create: `platcox-web/package.json`
- Create: `platcox-web/astro.config.mjs`
- Create: `platcox-web/tailwind.config.ts`
- Create: `platcox-web/tsconfig.json`
- Create: `platcox-web/.gitignore`
- Create: `platcox-web/.env.example`
- Create: `platcox-web/src/styles/global.css`

- [ ] **Step 1: Create project directory and init git**

```bash
cd /Users/cengizselcuk/Projects
mkdir platcox-web && cd platcox-web
git init
```

- [ ] **Step 2: Create package.json**

```json
{
  "name": "platcox-web",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "type-check": "astro check && tsc --noEmit"
  }
}
```

- [ ] **Step 3: Install dependencies**

```bash
bun add astro @astrojs/react @astrojs/node @astrojs/sitemap @astrojs/tailwind react react-dom framer-motion resend zod
bun add -d @types/react @types/react-dom typescript @astrojs/check
```

- [ ] **Step 4: Create astro.config.mjs**

```javascript
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import node from "@astrojs/node";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  site: "https://www.platcox.com",
  output: "hybrid",
  adapter: node({ mode: "standalone" }),
  integrations: [
    react(),
    tailwind(),
    sitemap(),
  ],
  server: { host: true },
});
```

- [ ] **Step 5: Create tailwind.config.ts**

```typescript
import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{astro,html,js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#4ADE80",
        bg: "#070B0F",
        surface: "#0F1A14",
        "surface-alt": "#111111",
        muted: "#6B8F71",
        text: "#F0FDF4",
      },
      fontFamily: {
        heading: ['"Space Grotesk"', "system-ui", "sans-serif"],
        body: ['"Inter"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 6: Create tsconfig.json**

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react"
  }
}
```

- [ ] **Step 7: Create src/styles/global.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-bg text-text font-body antialiased;
  }

  h1, h2, h3, h4 {
    @apply font-heading;
  }
}

@layer components {
  .section-padding {
    @apply py-20 px-6 md:py-[120px] md:px-8;
  }

  .section-label {
    @apply text-xs font-body font-medium uppercase tracking-[3px] text-muted mb-4;
  }

  .container-content {
    @apply max-w-[1200px] mx-auto;
  }
}
```

- [ ] **Step 8: Create .gitignore and .env.example**

`.gitignore`:
```
node_modules/
dist/
.astro/
.env
.DS_Store
.superpowers/
```

`.env.example`:
```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

- [ ] **Step 9: Verify build**

```bash
bunx astro check
```
Expected: No errors.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: scaffold Astro project with React, Tailwind, Node adapter"
```

---

### Task 2: BaseLayout & SEO Infrastructure

**Files:**
- Create: `src/layouts/BaseLayout.astro`
- Create: `public/llms.txt`
- Create: `public/robots.txt`
- Create: `public/favicon.svg`

- [ ] **Step 1: Create BaseLayout.astro**

```astro
---
interface Props {
  title?: string;
  description?: string;
  ogImage?: string;
}

const {
  title = "PlatcoX — Where Global Trade Gets Redefined",
  description = "PlatcoX enables cross-border commerce with intelligent sourcing, strategy, and operational infrastructure for brands scaling globally.",
  ogImage = "/og-image.jpg",
} = Astro.props;

const canonicalURL = new URL(Astro.url.pathname, Astro.site);

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "PlatcoX",
      url: "https://www.platcox.com",
      logo: "https://www.platcox.com/favicon.svg",
      sameAs: ["https://www.linkedin.com/in/cemtunakan"],
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+90-212-288-34-94",
        email: "cem@platcox.com",
        contactType: "sales",
      },
    },
    {
      "@type": "LocalBusiness",
      name: "PlatcoX",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Kültür Mah, Nisbetiye Cad. Akmerkez No:54",
        addressLocality: "Beşiktaş",
        addressRegion: "İstanbul",
        postalCode: "34349",
        addressCountry: "TR",
      },
      telephone: "+90-212-288-34-94",
      geo: {
        "@type": "GeoCoordinates",
        latitude: 41.0784,
        longitude: 29.0133,
      },
    },
    {
      "@type": "WebSite",
      name: "PlatcoX",
      url: "https://www.platcox.com",
    },
  ],
};
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonicalURL} />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

    <!-- Open Graph -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content={canonicalURL} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={new URL(ogImage, Astro.site)} />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={new URL(ogImage, Astro.site)} />

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@600;700;800&display=swap"
      rel="stylesheet"
    />

    <!-- JSON-LD -->
    <script type="application/ld+json" set:html={JSON.stringify(jsonLd)} />
  </head>
  <body>
    <slot />
  </body>
</html>
```

- [ ] **Step 2: Create public/llms.txt**

```
# PlatcoX

> Global trade redefined. Sourcing, strategy, intelligent operations, and ontologic sales — all aligned to shape what's next.

## About

PlatcoX is a cross-border commerce enablement company headquartered in Istanbul, Turkey. We provide end-to-end solutions for brands looking to scale internationally — from intelligent sourcing and product development to market access and operational infrastructure.

## Philosophy

- Discipline: Precision logistics and operations, executed quietly.
- Access: Trusted global networks that don't advertise themselves.
- Design Thinking: Scalable commerce solutions crafted like timeless style.

## Solutions

- Idea Factories: Creative churns & birth of concepts and ideas
- Design Centres: Bringing art and science together
- Product Development: Transforming ideas and concepts into products
- Manufacturing Centres: Threading together designs into products
- Showrooms: Bringing alive the look & feel

## Sustainability

Sustainability by Design — not a statement, an operating system.
- Systemic Efficiency: Embedded into workflows, not a campaign layer.
- Circular Commerce Enablement: Systems that enable reuse, recovery, and smarter distribution.
- Responsible Scale: Growth that doesn't multiply waste.

## Contact

- Email: cem@platcox.com
- Phone: +90 212 288 34 94
- Address: Kültür Mah, Nisbetiye Cad. Akmerkez No:54, Beşiktaş / İstanbul, Türkiye 34349
- LinkedIn: https://www.linkedin.com/in/cemtunakan
- Website: https://www.platcox.com
```

- [ ] **Step 3: Create public/robots.txt**

```
User-agent: *
Allow: /

Sitemap: https://www.platcox.com/sitemap-index.xml

# LLM-readable site description
# See: https://www.platcox.com/llms.txt
```

- [ ] **Step 4: Create public/favicon.svg**

A simple platcoX "X" mark in primary green:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#070B0F"/>
  <path d="M8 8l16 16M24 8L8 24" stroke="#4ADE80" stroke-width="3" stroke-linecap="round"/>
  <circle cx="16" cy="16" r="3" fill="#4ADE80"/>
</svg>
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add BaseLayout with JSON-LD, OG tags, llms.txt, robots.txt"
```

---

### Task 3: ScrollReveal React Island

**Files:**
- Create: `src/components/ScrollReveal.tsx`

This is the reusable Framer Motion wrapper used by all sections. Must be built first since sections depend on it.

- [ ] **Step 1: Create ScrollReveal.tsx**

```tsx
import { motion, type Variant } from "framer-motion";
import type { ReactNode } from "react";

type AnimationType = "fade-up" | "fade-in" | "slide-left" | "slide-right" | "scale-up" | "split-left" | "split-right";

interface Props {
  children: ReactNode;
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  className?: string;
}

const variants: Record<AnimationType, { hidden: Variant; visible: Variant }> = {
  "fade-up": {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  },
  "fade-in": {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  "slide-left": {
    hidden: { opacity: 0, x: -60 },
    visible: { opacity: 1, x: 0 },
  },
  "slide-right": {
    hidden: { opacity: 0, x: 60 },
    visible: { opacity: 1, x: 0 },
  },
  "scale-up": {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
  },
  "split-left": {
    hidden: { opacity: 0, x: -80 },
    visible: { opacity: 1, x: 0 },
  },
  "split-right": {
    hidden: { opacity: 0, x: 80 },
    visible: { opacity: 1, x: 0 },
  },
};

export default function ScrollReveal({
  children,
  animation = "fade-up",
  delay = 0,
  duration = 0.6,
  className,
}: Props) {
  const v = variants[animation];

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={{
        hidden: v.hidden,
        visible: { ...v.visible, transition: { duration, delay, ease: "easeOut" } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
bun run type-check
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ScrollReveal.tsx
git commit -m "feat: add ScrollReveal React island with 7 animation variants"
```

---

### Task 4: Header & MobileMenu

**Files:**
- Create: `src/components/Header.astro`
- Create: `src/components/MobileMenu.tsx`

- [ ] **Step 1: Create MobileMenu.tsx**

```tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "About", href: "#about" },
  { label: "Philosophy", href: "#philosophy" },
  { label: "Solutions", href: "#solutions" },
  { label: "Sustainability", href: "#sustainability" },
  { label: "News", href: "#news" },
  { label: "Contact", href: "#contact" },
];

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative z-50 flex h-10 w-10 flex-col items-end justify-center gap-[5px]"
        aria-label="Toggle menu"
      >
        <motion.span
          animate={isOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
          className="block h-[2px] w-6 bg-text"
        />
        <motion.span
          animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
          className="block h-[2px] w-4 bg-primary"
        />
        <motion.span
          animate={isOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
          className="block h-[2px] w-6 bg-text"
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-bg/95 backdrop-blur-md"
          >
            <nav className="flex flex-col items-center gap-8">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="font-heading text-2xl font-semibold text-text transition-colors hover:text-primary"
                >
                  {link.label}
                </motion.a>
              ))}
            </nav>
            <motion.a
              href="#contact"
              onClick={() => setIsOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-12 rounded-lg bg-primary px-8 py-3 font-body text-sm font-semibold text-bg transition-opacity hover:opacity-90"
            >
              Get a Quote
            </motion.a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

- [ ] **Step 2: Create Header.astro**

```astro
---
import MobileMenu from "./MobileMenu.tsx";

const navLinks = [
  { label: "About", href: "#about" },
  { label: "Philosophy", href: "#philosophy" },
  { label: "Solutions", href: "#solutions" },
  { label: "Sustainability", href: "#sustainability" },
  { label: "News", href: "#news" },
  { label: "Contact", href: "#contact" },
];
---

<header id="site-header" class="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
  <div class="container-content flex items-center justify-between py-5">
    <!-- Logo -->
    <a href="/" class="relative z-50">
      <span class="font-heading text-xl font-bold text-text">
        platco<span class="text-primary">X</span>
      </span>
    </a>

    <!-- Desktop Nav -->
    <nav class="hidden items-center gap-8 lg:flex">
      {navLinks.map((link) => (
        <a
          href={link.href}
          class="text-sm text-muted transition-colors hover:text-text"
        >
          {link.label}
        </a>
      ))}
      <a
        href="#contact"
        class="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-bg transition-opacity hover:opacity-90"
      >
        Get a Quote
      </a>
    </nav>

    <!-- Mobile Menu -->
    <div class="lg:hidden">
      <MobileMenu client:media="(max-width: 1023px)" />
    </div>
  </div>
</header>

<script>
  const header = document.getElementById("site-header");
  if (header) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 80) {
        header.classList.add("bg-bg/90", "backdrop-blur-md", "border-b", "border-surface");
      } else {
        header.classList.remove("bg-bg/90", "backdrop-blur-md", "border-b", "border-surface");
      }
    });
  }
</script>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Header.astro src/components/MobileMenu.tsx
git commit -m "feat: add Header with scroll-aware bg and MobileMenu island"
```

---

### Task 5: Hero Section

**Files:**
- Create: `src/components/HeroSection.astro`

- [ ] **Step 1: Create HeroSection.astro**

```astro
---
import ScrollReveal from "./ScrollReveal.tsx";
---

<section id="hero" class="relative flex min-h-screen items-center overflow-hidden">
  <!-- Video Background -->
  <video
    autoplay
    muted
    loop
    playsinline
    class="absolute inset-0 h-full w-full object-cover"
    poster="/videos/hero-poster.jpg"
  >
    <source src="/videos/hero-bg.mp4" type="video/mp4" />
  </video>

  <!-- Gradient Overlay -->
  <div class="absolute inset-0 bg-gradient-to-b from-bg/80 via-bg/50 to-bg"></div>

  <!-- Content -->
  <div class="container-content relative z-10 px-6 md:px-8">
    <ScrollReveal client:visible animation="fade-in" duration={0.8}>
      <p class="section-label mb-6">WHERE GLOBAL TRADE</p>
    </ScrollReveal>

    <ScrollReveal client:visible animation="fade-up" delay={0.2} duration={0.8}>
      <h1 class="font-heading text-5xl font-extrabold leading-tight md:text-7xl lg:text-8xl">
        Gets<br />
        Rede<span class="text-primary">fined.</span>
      </h1>
    </ScrollReveal>

    <ScrollReveal client:visible animation="fade-up" delay={0.5}>
      <p class="mt-6 max-w-xl text-lg text-muted md:text-xl">
        Sourcing. Strategy. Intelligent Operations.<br />
        All aligned to shape what's next.
      </p>
    </ScrollReveal>

    <ScrollReveal client:visible animation="fade-up" delay={0.7}>
      <a
        href="#contact"
        class="mt-10 inline-block rounded-lg bg-primary px-8 py-3 font-body text-sm font-semibold text-bg transition-all hover:scale-105 hover:opacity-90"
      >
        Start Building
      </a>
    </ScrollReveal>
  </div>

  <!-- Scroll Indicator -->
  <div class="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
    <div class="h-8 w-5 rounded-full border-2 border-muted p-1">
      <div class="h-2 w-1 rounded-full bg-primary mx-auto"></div>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/HeroSection.astro
git commit -m "feat: add Hero section with video bg and staggered reveal"
```

---

### Task 6: About, Philosophy, Solutions Sections

**Files:**
- Create: `src/components/AboutSection.astro`
- Create: `src/components/PhilosophySection.astro`
- Create: `src/components/SolutionsSection.astro`

- [ ] **Step 1: Create AboutSection.astro**

```astro
---
import ScrollReveal from "./ScrollReveal.tsx";

const lines = [
  { text: "Every operation is meticulously organized", highlight: true },
  { text: "— strategy isn't an afterthought.", highlight: false },
  { text: "We turn data into direction", highlight: true },
  { text: "— foresight drives every move we make.", highlight: false },
  { text: "From concept to commerce", highlight: true },
  { text: "— we carry brands across borders, seamlessly.", highlight: false },
];
---

<section id="about" class="section-padding">
  <div class="container-content">
    <div class="grid gap-12 md:grid-cols-[2fr_1fr] md:items-center">
      <div class="space-y-2">
        {lines.map((line, i) => (
          <ScrollReveal client:visible animation="fade-up" delay={i * 0.1}>
            <p class={`text-lg md:text-xl ${line.highlight ? "text-text font-medium" : "text-muted"}`}>
              {line.text}
            </p>
          </ScrollReveal>
        ))}
        <ScrollReveal client:visible animation="fade-up" delay={0.7}>
          <p class="mt-8 font-heading text-2xl font-bold text-primary md:text-3xl">
            Where silent structure meets bold ambition.
          </p>
        </ScrollReveal>
      </div>
      <ScrollReveal client:visible animation="fade-in" delay={0.3}>
        <div class="aspect-square rounded-2xl bg-gradient-to-br from-surface to-surface-alt"></div>
      </ScrollReveal>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Create PhilosophySection.astro**

```astro
---
import ScrollReveal from "./ScrollReveal.tsx";

const principles = [
  { title: "Discipline", description: "Precision logistics and operations, executed quietly." },
  { title: "Access", description: "Trusted global networks that don't advertise themselves." },
  { title: "Design Thinking", description: "Scalable commerce solutions crafted like timeless style." },
];
---

<section id="philosophy" class="section-padding">
  <div class="container-content">
    <ScrollReveal client:visible animation="fade-up">
      <p class="section-label">OUR PHILOSOPHY</p>
      <h2 class="font-heading text-3xl font-bold md:text-5xl">
        Principles that move markets.
      </h2>
    </ScrollReveal>

    <div class="mt-16 grid gap-6 md:grid-cols-3">
      {principles.map((p, i) => (
        <ScrollReveal client:visible animation="slide-left" delay={i * 0.15}>
          <div class="rounded-xl border-l-2 border-primary bg-surface-alt p-8 transition-colors hover:bg-surface">
            <h3 class="font-heading text-xl font-semibold text-primary">{p.title}</h3>
            <p class="mt-3 text-muted">{p.description}</p>
          </div>
        </ScrollReveal>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 3: Create SolutionsSection.astro**

```astro
---
import ScrollReveal from "./ScrollReveal.tsx";

const solutions = [
  { icon: "💡", title: "Idea Factories", description: "Creative churns & birth of concepts and ideas" },
  { icon: "✏️", title: "Design Centres", description: "Bringing art and science together" },
  { icon: "⚙️", title: "Product Development", description: "Transforming ideas and concepts into products" },
  { icon: "🏭", title: "Manufacturing Centres", description: "Threading together designs into products" },
  { icon: "🏬", title: "Showrooms", description: "Bringing alive the look & feel" },
];
---

<section id="solutions" class="section-padding">
  <div class="container-content">
    <ScrollReveal client:visible animation="fade-up">
      <p class="section-label">OUR SOLUTIONS</p>
      <h2 class="font-heading text-3xl font-bold md:text-5xl">
        Engineered to scale vision with precision.
      </h2>
      <p class="mt-4 max-w-2xl text-muted">
        Our solutions are built around intelligent sourcing, product development, cross-border
        operational infrastructure, and market access — enabling scalable international growth.
      </p>
    </ScrollReveal>

    <div class="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {solutions.map((s, i) => (
        <ScrollReveal
          client:visible
          animation="scale-up"
          delay={i * 0.1}
          className={i >= 3 ? "sm:col-span-1 lg:mx-auto lg:w-full" : ""}
        >
          <div class="rounded-xl bg-surface p-8 text-center transition-all hover:bg-surface/80 hover:scale-[1.02]">
            <div class="text-4xl">{s.icon}</div>
            <h3 class="mt-4 font-heading text-lg font-semibold text-text">{s.title}</h3>
            <p class="mt-2 text-sm text-muted">{s.description}</p>
          </div>
        </ScrollReveal>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/AboutSection.astro src/components/PhilosophySection.astro src/components/SolutionsSection.astro
git commit -m "feat: add About, Philosophy, Solutions sections with scroll animations"
```

---

### Task 7: Clients/Why & Sustainability Sections

**Files:**
- Create: `src/components/ClientsWhySection.astro`
- Create: `src/components/SustainabilitySection.astro`

- [ ] **Step 1: Create ClientsWhySection.astro**

```astro
---
import ScrollReveal from "./ScrollReveal.tsx";

const clients = [
  "Brands ready to operate beyond borders",
  "Retailers scaling without operational friction",
  "Innovators who prefer strategy over noise",
  "Visionaries who design the future of commerce",
];

const reasons = [
  "Trusted by those who don't follow the crowd",
  "Global by nature, structured by design",
  "Fast-moving, disciplined, and confidential",
];
---

<section id="clients" class="section-padding">
  <div class="container-content">
    <div class="grid gap-12 md:grid-cols-2 md:gap-16">
      <!-- Who We Work With -->
      <ScrollReveal client:visible animation="split-left">
        <div>
          <p class="section-label">WHO WE WORK WITH</p>
          <ul class="mt-6 space-y-4">
            {clients.map((c) => (
              <li class="flex items-start gap-3 text-lg text-muted">
                <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"></span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      </ScrollReveal>

      <!-- Why PlatcoX -->
      <ScrollReveal client:visible animation="split-right">
        <div>
          <p class="section-label">WHY PLATCOX</p>
          <h3 class="mt-2 font-heading text-2xl font-bold text-text md:text-3xl">
            Because real influence happens off-stage.
          </h3>
          <ul class="mt-6 space-y-4">
            {reasons.map((r) => (
              <li class="flex items-start gap-3 text-lg text-muted">
                <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"></span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      </ScrollReveal>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Create SustainabilitySection.astro**

```astro
---
import ScrollReveal from "./ScrollReveal.tsx";

const pillars = [
  {
    num: "01",
    title: "Systemic Efficiency",
    description: "Sustainability is embedded into workflows — not treated as a campaign layer. We optimize for output, clarity, and operational discipline.",
  },
  {
    num: "02",
    title: "Circular Commerce Enablement",
    description: "We build systems that enable reuse, recovery, and smarter distribution — making circular economy practical at scale.",
  },
  {
    num: "03",
    title: "Responsible Scale",
    description: "Growth should not multiply waste. We design for repeatability, governance, and controlled expansion.",
  },
];
---

<section id="sustainability" class="section-padding">
  <div class="container-content">
    <ScrollReveal client:visible animation="fade-up">
      <p class="section-label text-primary">SUSTAINABILITY BY DESIGN</p>
      <h2 class="font-heading text-3xl font-bold md:text-5xl">
        Not a statement. An operating system.
      </h2>
    </ScrollReveal>

    <!-- YouTube Embed -->
    <ScrollReveal client:visible animation="fade-in" delay={0.2}>
      <div class="mt-12 aspect-video overflow-hidden rounded-2xl bg-surface-alt">
        <iframe
          src="https://www.youtube-nocookie.com/embed/VIDEO_ID"
          title="PlatcoX Sustainability"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          loading="lazy"
          class="h-full w-full"
        ></iframe>
      </div>
    </ScrollReveal>

    <ScrollReveal client:visible animation="fade-up" delay={0.3}>
      <blockquote class="mt-12 border-l-2 border-primary pl-6 text-xl italic text-muted">
        "Sustainability is not a promise. It is a system."
      </blockquote>
    </ScrollReveal>

    <!-- Pillars -->
    <div class="mt-16 grid gap-6 md:grid-cols-3">
      {pillars.map((p, i) => (
        <ScrollReveal client:visible animation="fade-up" delay={0.1 + i * 0.15}>
          <div class="rounded-xl bg-surface p-8">
            <span class="font-heading text-sm font-bold text-primary">{p.num}</span>
            <h3 class="mt-2 font-heading text-xl font-semibold text-text">{p.title}</h3>
            <p class="mt-3 text-sm text-muted">{p.description}</p>
          </div>
        </ScrollReveal>
      ))}
    </div>

    <ScrollReveal client:visible animation="fade-in" delay={0.3}>
      <p class="mt-12 text-center text-muted">
        We do not claim to save the world. We design systems that make global commerce more responsible by default.
      </p>
    </ScrollReveal>
  </div>
</section>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ClientsWhySection.astro src/components/SustainabilitySection.astro
git commit -m "feat: add Clients/Why and Sustainability sections"
```

---

### Task 8: News Section & Content Collections

**Files:**
- Create: `src/content/config.ts`
- Create: `src/content/news/ai-ticaret.md`
- Create: `src/content/news/surdurulebilirlik.md`
- Create: `src/components/NewsSection.astro`
- Create: `src/pages/news/[...slug].astro`

- [ ] **Step 1: Create content collection config**

`src/content/config.ts`:
```typescript
import { defineCollection, z } from "astro:content";

const news = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    date: z.date(),
    category: z.string(),
    thumbnail: z.string(),
    excerpt: z.string(),
  }),
});

export const collections = { news };
```

- [ ] **Step 2: Create sample news articles**

`src/content/news/ai-ticaret.md`:
```markdown
---
title: "Platco 'X', yapay zeka destekli ticaret çözümleri sunuyor"
date: 2025-07-27
category: "In Media"
thumbnail: "/images/news/ai-ticaret.jpg"
excerpt: "PlatcoX is leveraging AI-powered commerce solutions to transform cross-border trade operations."
---

PlatcoX is pioneering the integration of artificial intelligence into global trade operations, creating smarter sourcing and distribution systems for brands looking to scale internationally.
```

`src/content/news/surdurulebilirlik.md`:
```markdown
---
title: "Herkesin kazandığı sürdürülebilir bir sistem yaratıyoruz"
date: 2025-07-27
category: "In Media"
thumbnail: "/images/news/sustainability.jpg"
excerpt: "Building a sustainable system where everyone wins — PlatcoX's approach to responsible commerce."
---

At PlatcoX, sustainability is not a marketing statement. It is built into our operational DNA — from sourcing decisions to logistics optimization.
```

- [ ] **Step 3: Create NewsSection.astro**

```astro
---
import { getCollection } from "astro:content";
import ScrollReveal from "./ScrollReveal.tsx";

const posts = (await getCollection("news"))
  .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
  .slice(0, 4);
---

<section id="news" class="section-padding">
  <div class="container-content">
    <ScrollReveal client:visible animation="fade-up">
      <p class="section-label">NEWS</p>
      <h2 class="font-heading text-3xl font-bold md:text-5xl">Latest from PlatcoX</h2>
    </ScrollReveal>

    <div class="mt-16 grid gap-8 md:grid-cols-2">
      {posts.map((post, i) => (
        <ScrollReveal client:visible animation="fade-up" delay={i * 0.15}>
          <a
            href={`/news/${post.slug}`}
            class="group block overflow-hidden rounded-xl bg-surface-alt transition-colors hover:bg-surface"
          >
            <div class="aspect-video bg-surface"></div>
            <div class="p-6">
              <div class="flex items-center gap-3">
                <span class="rounded-full bg-surface px-3 py-1 text-xs text-primary">
                  {post.data.category}
                </span>
                <span class="text-xs text-muted">
                  {post.data.date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </span>
              </div>
              <h3 class="mt-3 font-heading text-lg font-semibold text-text group-hover:text-primary transition-colors">
                {post.data.title}
              </h3>
              <p class="mt-2 text-sm text-muted">{post.data.excerpt}</p>
            </div>
          </a>
        </ScrollReveal>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 4: Create news detail page**

`src/pages/news/[...slug].astro`:
```astro
---
import { getCollection } from "astro:content";
import BaseLayout from "../../layouts/BaseLayout.astro";
import Header from "../../components/Header.astro";
import Footer from "../../components/Footer.astro";

export async function getStaticPaths() {
  const posts = await getCollection("news");
  return posts.map((post) => ({
    params: { slug: post.slug },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content } = await post.render();
---

<BaseLayout title={`${post.data.title} — PlatcoX`} description={post.data.excerpt}>
  <Header />
  <main class="section-padding pt-32">
    <article class="container-content max-w-3xl">
      <a href="/#news" class="text-sm text-muted hover:text-primary transition-colors">&larr; Back to News</a>
      <div class="mt-6 flex items-center gap-3">
        <span class="rounded-full bg-surface px-3 py-1 text-xs text-primary">{post.data.category}</span>
        <span class="text-xs text-muted">
          {post.data.date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </span>
      </div>
      <h1 class="mt-4 font-heading text-3xl font-bold md:text-5xl">{post.data.title}</h1>
      <div class="prose prose-invert prose-green mt-12 max-w-none">
        <Content />
      </div>
    </article>
  </main>
  <Footer />
</BaseLayout>
```

- [ ] **Step 5: Commit**

```bash
git add src/content/ src/components/NewsSection.astro src/pages/news/
git commit -m "feat: add News section with Content Collections and detail pages"
```

---

### Task 9: Contact Form & API Endpoint

**Files:**
- Create: `src/components/ContactForm.tsx`
- Create: `src/components/ContactSection.astro`
- Create: `src/pages/api/contact.ts`

- [ ] **Step 1: Create ContactForm.tsx**

```tsx
import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Status = "idle" | "submitting" | "success" | "error";

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Something went wrong");
      }

      setStatus("success");
      form.reset();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <input
          type="text"
          name="name"
          placeholder="Name"
          required
          className="w-full rounded-lg border border-surface bg-surface-alt px-4 py-3 text-text placeholder:text-muted/50 focus:border-primary focus:outline-none"
        />
      </div>
      <div>
        <input
          type="email"
          name="email"
          placeholder="Email"
          required
          className="w-full rounded-lg border border-surface bg-surface-alt px-4 py-3 text-text placeholder:text-muted/50 focus:border-primary focus:outline-none"
        />
      </div>
      <div>
        <textarea
          name="message"
          placeholder="Message"
          required
          rows={5}
          className="w-full resize-none rounded-lg border border-surface bg-surface-alt px-4 py-3 text-text placeholder:text-muted/50 focus:border-primary focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-lg bg-primary py-3 font-body text-sm font-semibold text-bg transition-all hover:opacity-90 disabled:opacity-50"
      >
        {status === "submitting" ? "Sending..." : "Send Message"}
      </button>

      <AnimatePresence mode="wait">
        {status === "success" && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center text-sm text-primary"
          >
            Message sent successfully. We'll get back to you soon.
          </motion.p>
        )}
        {status === "error" && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center text-sm text-red-400"
          >
            {errorMsg}
          </motion.p>
        )}
      </AnimatePresence>
    </form>
  );
}
```

- [ ] **Step 2: Create ContactSection.astro**

```astro
---
import ScrollReveal from "./ScrollReveal.tsx";
import ContactForm from "./ContactForm.tsx";
---

<section id="contact" class="section-padding">
  <div class="container-content">
    <ScrollReveal client:visible animation="fade-up">
      <p class="section-label">CONTACT</p>
      <h2 class="font-heading text-3xl font-bold md:text-5xl">
        Let's start the conversation.
      </h2>
      <p class="mt-4 text-muted">
        Your questions, ideas, or partnership inquiries — we're here to listen.
      </p>
    </ScrollReveal>

    <div class="mt-16 grid gap-12 md:grid-cols-2">
      <!-- Form -->
      <ScrollReveal client:visible animation="fade-up" delay={0.2}>
        <ContactForm client:visible />
      </ScrollReveal>

      <!-- Company Info -->
      <ScrollReveal client:visible animation="fade-in" delay={0.3}>
        <div class="space-y-8">
          <div>
            <h3 class="font-heading text-lg font-semibold text-text">Address</h3>
            <p class="mt-2 text-muted">
              Kültür Mah, Nisbetiye Cad. Akmerkez No:54<br />
              Beşiktaş / İstanbul, Türkiye 34349
            </p>
          </div>
          <div>
            <h3 class="font-heading text-lg font-semibold text-text">Email</h3>
            <a href="mailto:cem@platcox.com" class="mt-2 block text-primary hover:underline">
              cem@platcox.com
            </a>
          </div>
          <div>
            <h3 class="font-heading text-lg font-semibold text-text">Phone</h3>
            <a href="tel:+902122883494" class="mt-2 block text-muted hover:text-text transition-colors">
              0212 288 34 94
            </a>
          </div>
          <div>
            <h3 class="font-heading text-lg font-semibold text-text">Social</h3>
            <a
              href="https://www.linkedin.com/in/cemtunakan"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-2 inline-flex items-center gap-2 text-muted hover:text-primary transition-colors"
            >
              LinkedIn &rarr;
            </a>
          </div>
        </div>
      </ScrollReveal>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Create API endpoint**

`src/pages/api/contact.ts`:
```typescript
import type { APIRoute } from "astro";
import { Resend } from "resend";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  message: z.string().min(1).max(5000),
});

const rateLimit = new Map<string, number[]>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimit.get(ip)?.filter((t) => now - t < RATE_WINDOW) ?? [];
  rateLimit.set(ip, timestamps);
  if (timestamps.length >= RATE_LIMIT) return true;
  timestamps.push(now);
  return false;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (isRateLimited(clientAddress)) {
    return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid input." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { name, email, message } = parsed.data;
  const resend = new Resend(process.env.RESEND_API_KEY!);

  const { error } = await resend.emails.send({
    from: "PlatcoX Website <noreply@platcox.com>",
    to: "cem@platcox.com",
    subject: `New inquiry from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
  });

  if (error) {
    return new Response(JSON.stringify({ error: "Failed to send email." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const prerender = false;
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ContactForm.tsx src/components/ContactSection.astro src/pages/api/contact.ts
git commit -m "feat: add Contact form island with Resend API endpoint"
```

---

### Task 10: World Map & Locations

**Files:**
- Create: `src/components/WorldMap.tsx`
- Create: `src/components/LocationsSection.astro`

- [ ] **Step 1: Create WorldMap.tsx**

```tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Location {
  id: string;
  city: string;
  country: string;
  type: string;
  x: number; // % from left
  y: number; // % from top
}

const locations: Location[] = [
  { id: "istanbul", city: "Istanbul", country: "Turkey", type: "HQ", x: 55, y: 32 },
  { id: "london", city: "London", country: "UK", type: "Office", x: 47, y: 25 },
  { id: "mumbai", city: "Mumbai", country: "India", type: "Partner", x: 66, y: 48 },
  { id: "dhaka", city: "Dhaka", country: "Bangladesh", type: "Sourcing", x: 70, y: 44 },
  { id: "shanghai", city: "Shanghai", country: "China", type: "Sourcing", x: 78, y: 36 },
  { id: "newyork", city: "New York", country: "USA", type: "Office", x: 25, y: 30 },
  { id: "dubai", city: "Dubai", country: "UAE", type: "Partner", x: 60, y: 42 },
  { id: "nairobi", city: "Nairobi", country: "Kenya", type: "Partner", x: 57, y: 55 },
  { id: "saopaulo", city: "São Paulo", country: "Brazil", type: "Partner", x: 30, y: 62 },
];

export default function WorldMap() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <div className="relative aspect-[2/1] w-full">
      {/* Simplified SVG world map outline */}
      <svg viewBox="0 0 1000 500" className="h-full w-full" fill="none">
        {/* Simplified continent outlines */}
        <path
          d="M150,120 Q200,100 250,110 Q300,100 350,120 Q330,180 300,200 Q250,220 200,210 Q170,180 150,120Z"
          fill="#0F1A14" stroke="#1a3a2a" strokeWidth="0.5"
        />
        <path
          d="M220,230 Q260,220 300,240 Q310,300 290,350 Q260,370 240,340 Q220,300 220,230Z"
          fill="#0F1A14" stroke="#1a3a2a" strokeWidth="0.5"
        />
        <path
          d="M420,80 Q500,60 580,80 Q600,120 580,160 Q520,200 460,180 Q430,140 420,80Z"
          fill="#0F1A14" stroke="#1a3a2a" strokeWidth="0.5"
        />
        <path
          d="M460,200 Q520,190 560,220 Q580,280 560,320 Q520,340 480,310 Q460,260 460,200Z"
          fill="#0F1A14" stroke="#1a3a2a" strokeWidth="0.5"
        />
        <path
          d="M580,150 Q650,120 720,140 Q750,180 740,220 Q700,240 660,220 Q620,200 580,150Z"
          fill="#0F1A14" stroke="#1a3a2a" strokeWidth="0.5"
        />
        <path
          d="M740,160 Q800,140 860,160 Q880,200 860,240 Q820,260 780,240 Q750,210 740,160Z"
          fill="#0F1A14" stroke="#1a3a2a" strokeWidth="0.5"
        />
      </svg>

      {/* Location markers */}
      {locations.map((loc, i) => (
        <motion.div
          key={loc.id}
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 + i * 0.1 }}
          className="absolute"
          style={{ left: `${loc.x}%`, top: `${loc.y}%`, transform: "translate(-50%, -50%)" }}
          onMouseEnter={() => setActive(loc.id)}
          onMouseLeave={() => setActive(null)}
        >
          {/* Glow */}
          <div className="absolute -inset-3 rounded-full bg-primary/20 animate-pulse" />
          {/* Dot */}
          <div className="relative h-3 w-3 rounded-full bg-primary cursor-pointer" />

          {/* Tooltip */}
          <AnimatePresence>
            {active === loc.id && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 whitespace-nowrap rounded-lg bg-surface-alt px-4 py-2 shadow-lg"
              >
                <p className="font-heading text-sm font-semibold text-text">{loc.city}</p>
                <p className="text-xs text-muted">{loc.country} · {loc.type}</p>
                <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-surface-alt" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create LocationsSection.astro**

```astro
---
import ScrollReveal from "./ScrollReveal.tsx";
import WorldMap from "./WorldMap.tsx";
---

<section id="locations" class="section-padding">
  <div class="container-content">
    <ScrollReveal client:visible animation="fade-up">
      <p class="section-label">OUR LOCATIONS</p>
      <h2 class="font-heading text-3xl font-bold md:text-5xl">Global presence.</h2>
    </ScrollReveal>

    <div class="mt-12">
      <WorldMap client:visible />
    </div>
  </div>
</section>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/WorldMap.tsx src/components/LocationsSection.astro
git commit -m "feat: add SVG world map with hover tooltips for 9 locations"
```

---

### Task 11: Footer & Index Page Assembly

**Files:**
- Create: `src/components/Footer.astro`
- Create: `src/pages/index.astro`

- [ ] **Step 1: Create Footer.astro**

```astro
---
const year = new Date().getFullYear();
---

<footer class="border-t border-surface py-8 px-6">
  <div class="container-content flex flex-col items-center justify-between gap-4 md:flex-row">
    <p class="text-sm text-muted">
      {year} &copy; platco<span class="text-primary">X</span>
    </p>
    <a
      href="https://www.linkedin.com/in/cemtunakan"
      target="_blank"
      rel="noopener noreferrer"
      class="text-sm text-muted transition-colors hover:text-primary"
    >
      LinkedIn &rarr;
    </a>
  </div>
</footer>
```

- [ ] **Step 2: Create index.astro**

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import Header from "../components/Header.astro";
import HeroSection from "../components/HeroSection.astro";
import AboutSection from "../components/AboutSection.astro";
import PhilosophySection from "../components/PhilosophySection.astro";
import SolutionsSection from "../components/SolutionsSection.astro";
import ClientsWhySection from "../components/ClientsWhySection.astro";
import SustainabilitySection from "../components/SustainabilitySection.astro";
import NewsSection from "../components/NewsSection.astro";
import ContactSection from "../components/ContactSection.astro";
import LocationsSection from "../components/LocationsSection.astro";
import Footer from "../components/Footer.astro";
---

<BaseLayout>
  <Header />
  <main>
    <HeroSection />
    <AboutSection />
    <PhilosophySection />
    <SolutionsSection />
    <ClientsWhySection />
    <SustainabilitySection />
    <NewsSection />
    <ContactSection />
    <LocationsSection />
  </main>
  <Footer />
</BaseLayout>
```

- [ ] **Step 3: Build and verify**

```bash
timeout 120 bun run build
```
Expected: Build succeeds, `dist/` directory created.

- [ ] **Step 4: Commit**

```bash
git add src/components/Footer.astro src/pages/index.astro
git commit -m "feat: assemble full page with all sections"
```

---

### Task 12: Dockerfile & Deployment Config

**Files:**
- Create: `Dockerfile`
- Create: `.dockerignore`

- [ ] **Step 1: Create Dockerfile**

```dockerfile
FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM oven/bun:1-slim AS runtime
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000
CMD ["node", "dist/server/entry.mjs"]
```

- [ ] **Step 2: Create .dockerignore**

```
node_modules
dist
.git
.env
.DS_Store
.astro
.superpowers
docs
```

- [ ] **Step 3: Test Docker build locally**

```bash
docker build -t platcox-web .
```
Expected: Build completes successfully.

- [ ] **Step 4: Commit**

```bash
git add Dockerfile .dockerignore
git commit -m "feat: add Dockerfile for Coolify deployment"
```

---

### Task 13: Extract Assets from Current Site

**Files:**
- Create: `public/images/` (directory for extracted assets)

- [ ] **Step 1: Extract logo SVG from current platcox.com**

Navigate to current site, find logo image URL, download and convert to SVG. Place at `public/favicon.svg` (already created as placeholder — replace with real logo).

- [ ] **Step 2: Update YouTube video ID**

In `src/components/SustainabilitySection.astro`, replace `VIDEO_ID` in the YouTube embed URL with the actual video ID after uploading the sustainability video to YouTube.

- [ ] **Step 3: Download hero video**

From current site, extract the short hero video loop. Compress with ffmpeg:

```bash
ffmpeg -i hero-original.mp4 -vcodec libx264 -crf 28 -preset slow -vf scale=1920:-2 -an public/videos/hero-bg.mp4
```
Target: under 2MB.

- [ ] **Step 4: Create video poster image**

Extract first frame as poster:

```bash
ffmpeg -i public/videos/hero-bg.mp4 -vframes 1 -q:v 2 public/videos/hero-poster.jpg
```

- [ ] **Step 5: Extract location coordinates from current site**

Navigate to current site's Leaflet map, extract the 9 marker coordinates from the page's JavaScript. Update `WorldMap.tsx` with real x/y percentages.

- [ ] **Step 6: Create OG share image**

Create a 1200x630 image with platcoX branding for social sharing. Save to `public/og-image.jpg`.

- [ ] **Step 7: Commit**

```bash
git add public/
git commit -m "feat: add extracted assets — logo, video, images"
```

---

### Task 14: GitHub Repo & Coolify Deploy

- [ ] **Step 1: Create GitHub repo**

```bash
gh repo create c3nx/platcox-web --private --source=. --push
```

- [ ] **Step 2: Create Coolify app**

Use Coolify API or UI:
- Source: GitHub `c3nx/platcox-web`
- Build pack: Dockerfile
- Port: 3000
- Domain: `platcox.uptakeagency.com`

- [ ] **Step 3: Set environment variables in Coolify**

Retrieve Resend API key from Bitwarden:

```bash
export BW_PASSWORD=$(security find-generic-password -s "bitwarden-cli" -a "cengizselcuk@gmail.com" -w) && export BW_SESSION=$(bw unlock --passwordenv BW_PASSWORD --raw) && unset BW_PASSWORD
bw get password "Resend"
```

Set `RESEND_API_KEY` in Coolify app environment variables.

- [ ] **Step 4: Deploy and verify**

Trigger deploy from Coolify. Verify:
- Site loads at `platcox.uptakeagency.com`
- All sections render
- Contact form submits
- `llms.txt` accessible
- Lighthouse score > 90

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: deployment adjustments"
```
