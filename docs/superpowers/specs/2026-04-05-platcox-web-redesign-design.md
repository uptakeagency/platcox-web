# PlatcoX Web Redesign — Design Spec

**Date:** 2026-04-05
**Status:** Approved
**Repo:** `platcox-web` (new, separate from data pipeline)
**Inspiration:** Palantir.com — light theme, massive typography, minimal enterprise aesthetic

---

## 1. Overview

Rebuild platcox.com from WordPress/Elementor to Astro SSG with React islands. Goals:
- Palantir-inspired enterprise presence — light, minimal, authoritative
- LLM SEO optimized (llms.txt, JSON-LD, semantic HTML)
- Self-hosted on Coolify (static + single SSR endpoint)
- Cinematic scroll experience with Framer Motion animations

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Astro 6 (hybrid output: static + SSR) |
| UI Islands | React 19 + Framer Motion |
| Styling | Tailwind CSS v4 |
| Fonts | Inter (headings, light weight) + Inter (body) |
| Form Backend | Resend API (SSR endpoint) |
| Map | Custom SVG world map + CSS/React hover |
| Content | Astro Content Collections (Markdown) |
| Deploy | Coolify (Dockerfile: bun build → node serve) |
| Package Manager | Bun |

## 3. Design System

### Color Palette — "Palantir Light"

| Token | Hex | Usage |
|-------|-----|-------|
| `bg` | #FAFAFA | Page background |
| `surface` | #FFFFFF | Cards, elevated surfaces |
| `surface-alt` | #F5F5F5 | Secondary surfaces, testimonial cards |
| `text` | #1A1A1A | Primary text |
| `muted` | #999999 | Secondary text, labels, section numbers |
| `dark` | #1A1A2E | Dark blocks (hero mockup, CTA) |
| `accent` | #22C55E | Minimal accent — logo "X" only |
| `border` | #E5E7EB | Subtle dividers, card borders |

Design principle: Monochrome dominates. Green appears only in the logo "X" and very sparingly as an accent. The authority comes from typography and whitespace, not color.

### Typography

| Role | Font | Weight | Size |
|------|------|--------|------|
| H1 (Hero) | Inter | 300 (light) | 72-96px, letter-spacing: -2px |
| H2 (Statement) | Inter | 300 (light) | 48-64px, letter-spacing: -1px |
| H3 (Section) | Inter | 400 (regular) | 24-32px |
| Body | Inter | 400 | 16-18px |
| Label | Inter | 500 | 11px, uppercase, letter-spacing: 3px |
| Section Number | Inter | 400 | 12px, color: muted |
| CTA Text | Inter | 400 | 20-24px |

Key difference from previous spec: Light font weights (300) for headings create the Palantir "thin, powerful" feel. One font family (Inter) throughout — no second font needed.

### Spacing

- Section padding: 160-200px vertical (desktop), 100px (mobile) — much more than typical
- Content max-width: 1100px, centered
- Between sections: thin 1px border dividers (not background color changes)
- Card padding: 24-32px
- Component gap: 16-24px

### Visual Language

- **No rounded corners** — sharp edges (border-radius: 0-4px max)
- **Thin dividers** — 1px solid #E5E7EB between sections
- **Monochrome** — black/white/grey dominates
- **Massive whitespace** — let content breathe
- **Section numbering** — right-aligned `/0.1`, `/0.2` indices
- **Scroll-triggered text reveal** — words fade from muted to text color on scroll

## 4. Page Structure & Sections

Single-page site with Palantir-style scroll layout. Minimal top navigation.

### 4.1 Header
- Fixed position, white background with subtle bottom border on scroll
- Left: platcoX logo text (black + green "X")
- Center/Right: Horizontal text nav links (Solutions, About, Sustainability)
- Far right: "Get Started" button (outlined, not filled) + hamburger menu icon
- Mobile: Hamburger only, full-screen overlay menu

### 4.2 Section 01 — Hero
- Full viewport height, centered content
- Top half: Product/dashboard mockup in dark container (laptop frame style, like Palantir)
- Bottom half: Large, light-weight heading: "Where Global Trade Gets Rede**fined**" (bold on last word only)
- Below heading: "Scroll to Explore" + down arrow
- No video background — clean, static, fast-loading
- Animation: Mockup scales up slightly, text fades in

### 4.3 Section 02 — About (Numbered List)
- Large statement text at top (font-weight: 300, 48-64px):
  "Our solutions power real-time, cross-border commerce **from the sourcing floor to the storefront**" (muted color on the second part, revealing on scroll)
- Below: numbered items separated by thin dividers:
  - `/0.1` — "Every operation is meticulously organized — strategy isn't an afterthought."
  - `/0.2` — "We turn data into direction — foresight drives every move we make."
  - `/0.3` — "From concept to commerce — we carry brands across borders, seamlessly."
- Numbers right-aligned in muted color
- Animation: Each line reveals as scroll reaches it (text color transition from muted to text)

### 4.4 Section 03 — Philosophy
- Section label: "OUR PHILOSOPHY" (uppercase, muted, tracked)
- 3 equal-width cards in a row, flat background (surface-alt), no borders:
  - DISCIPLINE — "Precision logistics and operations, executed quietly."
  - ACCESS — "Trusted global networks that don't advertise themselves."
  - DESIGN THINKING — "Scalable commerce solutions crafted like timeless style."
- Card titles are uppercase labels, descriptions are body text
- Animation: Cards stagger fade-up

### 4.5 Section 04 — Solutions
- Section label: "OUR SOLUTIONS"
- Heading: "Engineered to scale vision with precision."
- Description paragraph
- Numbered list with dividers (Palantir style), each item a solution:
  - `/01` Idea Factories — "Creative churns & birth of concepts and ideas"
  - `/02` Design Centres — "Bringing art and science together"
  - `/03` Product Development — "Transforming ideas and concepts into products"
  - `/04` Manufacturing Centres — "Threading together designs into products"
  - `/05` Showrooms — "Bringing alive the look & feel"
- Each item: left-aligned title, description, right-aligned number
- Animation: Items reveal on scroll with line drawing effect on dividers

### 4.6 Section 05 — Clients & Why PlatcoX
- Split layout — two columns
- Left: "Who We Work With" section image (team/office photo placeholder)
- Right: "There is so much left to build" (large heading, Palantir style) + description + "Learn More" link
- Below: "Why platcoX?" as a large statement: "Because real influence happens off-stage."
- Bullet points: Trusted, Global, Fast-moving
- Animation: Image slides in from left, text from right

### 4.7 Section 06 — Sustainability
- Dark background block (#1A1A2E) — contrast break in the page
- Section label: "SUSTAINABILITY BY DESIGN" in white
- Heading: "Not a statement. An operating system." in white
- YouTube embed (lazy loaded, privacy-enhanced mode)
- Quote in white italic
- 3 numbered pillars in a row (dark card backgrounds):
  1. Systemic Efficiency
  2. Circular Commerce Enablement
  3. Responsible Scale
- Closing statement
- Animation: Entire dark section fades in

### 4.8 Section 07 — Testimonials (NEW — Palantir pattern)
- Horizontal scrolling testimonial cards (like Palantir's customer quotes)
- Each card: Company name (uppercase label), quote text, attribution
- Cards are surface-alt background, minimal styling
- Horizontal scroll with grab/drag or button navigation
- Animation: Cards slide in from right
- Content: placeholder quotes initially (to be replaced with real partner testimonials)

### 4.9 Section 08 — News
- Section label: "NEWS"
- Tag/pill filter bar (like Palantir): category filters
- 2-column card grid: thumbnail area + title + date + category tag + excerpt
- Links to individual news pages
- Animation: Cards stagger fade-up

### 4.10 Section 09 — Contact
- Split layout: form left, company info right
- Form fields: Name, Email, Message (minimal styling, bottom-border inputs)
- Company info: Address, Phone (tel: link), Email (mailto:), LinkedIn
- No background cards — just content on page background
- Animation: Fade up

### 4.11 Section 10 — Locations (World Map)
- Custom SVG world map (React island)
- Dark background block (contrast with rest of page, like sustainability section)
- 9 location markers with hover tooltips
- Markers use accent color (#22C55E) with subtle glow
- Animation: Map fade-in + markers stagger

### 4.12 Dual CTA Footer (NEW — Palantir pattern)
- Two large side-by-side blocks spanning full width:
  - Left: "Request a Quote →" on light grey background
  - Right: "Start Building →" on dark background (#1A1A2E), white text
- Each block is clickable, links to contact section or external
- Below: minimal footer line — copyright + LinkedIn link

## 5. React Islands

Only 5 components hydrate as React islands. Everything else is zero-JS Astro.

| Island | Purpose | Hydration |
|--------|---------|-----------|
| `MobileMenu.tsx` | Full-screen menu overlay | `client:media="(max-width: 1023px)"` |
| `ContactForm.tsx` | Form validation + Resend submit | `client:visible` |
| `WorldMap.tsx` | SVG map hover interactivity | `client:visible` |
| `ScrollReveal.tsx` | Framer Motion scroll-triggered wrapper | `client:visible` |
| `TestimonialsCarousel.tsx` | Horizontal scrolling testimonials | `client:visible` |

## 6. LLM SEO

### llms.txt
Static file at `/public/llms.txt` — same as before.

### JSON-LD (in BaseLayout.astro)
- `Organization` — name, logo, URL, social profiles
- `LocalBusiness` — address, phone, geo coordinates
- `WebSite` — name, URL
- `ContactPoint` — email, phone, contact type

### Meta Tags
- `<title>` — "PlatcoX — Where Global Trade Gets Redefined"
- `<meta name="description">` — Company description
- Open Graph: title, description, image, type
- Twitter Card: large image summary
- Canonical URL

### Sitemap & Robots
- `@astrojs/sitemap` integration — auto-generated
- `robots.txt` — allow all, reference sitemap and llms.txt

## 7. Content Collections

```typescript
// src/content/config.ts
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

## 8. Contact Form API

```
POST /api/contact
Content-Type: application/json

{ "name": "...", "email": "...", "message": "..." }
```

- Server-side validation (zod)
- Rate limiting: basic in-memory (IP-based, 5 requests/hour)
- Sends email via Resend API to cem@platcox.com
- Returns JSON: `{ success: true }` or `{ error: "..." }`
- Resend API key from environment variable (`RESEND_API_KEY`)

## 9. Project Structure

```
platcox-web/
├── astro.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── Dockerfile
├── .env.example              # RESEND_API_KEY
├── public/
│   ├── llms.txt
│   ├── robots.txt
│   ├── favicon.svg
│   ├── og-image.jpg
│   └── images/               # Section imagery
├── src/
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── components/
│   │   ├── Header.astro
│   │   ├── MobileMenu.tsx
│   │   ├── HeroSection.astro
│   │   ├── AboutSection.astro
│   │   ├── PhilosophySection.astro
│   │   ├── SolutionsSection.astro
│   │   ├── ClientsWhySection.astro
│   │   ├── SustainabilitySection.astro
│   │   ├── TestimonialsSection.astro
│   │   ├── TestimonialsCarousel.tsx    # React island
│   │   ├── NewsSection.astro
│   │   ├── ContactSection.astro
│   │   ├── ContactForm.tsx
│   │   ├── LocationsSection.astro
│   │   ├── WorldMap.tsx
│   │   ├── ScrollReveal.tsx
│   │   ├── DualCTA.astro
│   │   └── Footer.astro
│   ├── content/
│   │   ├── config.ts
│   │   └── news/
│   │       ├── ai-ticaret.md
│   │       └── surdurulebilirlik.md
│   ├── pages/
│   │   ├── index.astro
│   │   ├── news/
│   │   │   └── [...slug].astro
│   │   └── api/
│   │       └── contact.ts
│   └── styles/
│       └── global.css
```

## 10. Deployment

### Dockerfile (multi-stage)
Hybrid mode (SSR for `/api/contact`) requires a Node runtime:
1. **Build stage:** `oven/bun` image → `bun install` → `astro build`
2. **Run stage:** `oven/bun` → `node dist/server/entry.mjs` (Astro Node adapter)

### Coolify Config
- Source: GitHub repo `platcox-web`
- Build: Dockerfile
- Environment: `RESEND_API_KEY` (from Bitwarden)
- Domain: `platcox.uptakeagency.com` (staging) → `www.platcox.com` (production)
- Auto-deploy on push to `main`

## 11. Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|-----------|-------|----------------|
| Mobile | < 768px | Stack all, hamburger menu, single column |
| Tablet | 768-1024px | 2-column where applicable |
| Desktop | > 1024px | Full layout, side-by-side sections |

## 12. Assets Needed

| Asset | Source | Status |
|-------|--------|--------|
| platcoX logo (SVG) | Extract from current site | Needed |
| Hero product mockup | Create dashboard screenshot in laptop frame | Needed |
| Sustainability video | Upload to YouTube | Needed |
| Section imagery | Office/team photos | Review needed |
| Location data (9 cities) | Current site markers | Extract coordinates |
| News thumbnails | Current site | Migrate |
| OG share image (1200x630) | Create new | Needed |
| Favicon | Current logo adapted | Create SVG |
| Testimonial quotes | Collect from partners | Placeholder initially |
