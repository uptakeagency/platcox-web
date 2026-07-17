# Motion Library

In-house motion primitive library for platcox-web. Sub-project #1 of a 5-part full rewrite.

## Paradigm

70% **Monumental** (Palantir / Apple feel — slow cinematic, controlled gravity)
30% **Micro-interactions** (Stripe / Linear feel — sharp, purposeful, sub-second response)

Cinematic dark WebGL paradigm explicitly rejected during Gate A/B brainstorm.

## Primitives

| Primitive | Format | Trigger surface | Use case |
|-----------|--------|-----------------|----------|
| `TradeRoute` | `.tsx` + SMIL | `viewport-once \| viewport-repeat \| manual` | Origin → destination flow lines |
| `SketchStroke` | `.tsx` + SMIL | `viewport-once` | Decorative hand-drawn shape reveals (circle, ring, arrow, custom) |
| `NumberedReveal` | `.tsx` + framer-motion | `viewport-once` | Sıralı liste items, staggered fade-up |
| `ManifestoRise` | `.tsx` + framer-motion | `viewport-once \| scroll-progress` | Manifesto/Hero başlık satırları |
| `TickCounter` | `.tsx` + rAF | `viewport-once` | Count-up metric (number / currency / percent) |
| `DecisionPulse` | `.tsx` + framer-motion + CSS | mount, value/trend change, imperative `start()` | KPI card + pulse ring |
| `DataScan` | `.tsx` + framer-motion + CSS | `viewport-once` | dl/dt/dd staggered fade + scan-bar |
| `OntologyGraph` | `.tsx` + CSS keyframes | mount; keyboard `Tab/Enter/Space/Escape` | Interactive node/edge graph viz |
| `ScrollReveal` | `.tsx` (legacy refactored) | `viewport-once` | Generic content wrapper (motion.div) |

Tüm primitive'ler `BaseReactProps` (`durationMs`, `ariaLabel`) genişletir; gerektiğinde `className` ve trigger-spesifik prop'lar eklenir.

## Quick usage

```tsx
import ManifestoRise from "@/components/motion/primitives/ManifestoRise";

<ManifestoRise
  client:load
  lines={["Where Global Trade", "Gets Redefined."]}
  as="h1"
  className="text-center text-7xl font-light"
/>
```

Astro section'larında **Hero/above-fold**: `client:load`. **Below-fold**: `client:idle`. `client:visible` viewport-trigger animation'larla yarış yaratır — kullanma.

## Adding a new primitive (checklist)

1. **Failing test first** (`__tests__/<Name>.test.tsx`) — Pitfall #7 ve #8'e dikkat (`toBeTruthy` yerine `toBeInTheDocument`, HTML entity escape).
2. **Primitive implementation** (`primitives/<Name>.tsx`) — `BaseReactProps`'tan extend et, `useReducedMotion` + `useInViewport` kullan; observer null-safe pattern (`isInView === false ? "hidden" : "visible"`).
3. **SSR-visible kontrat (§5.2.2)** — initial="visible" ile motion bileşeni mount; HTML'de inline `opacity:0` olmasın.
4. **Reduced-motion fallback** — `useReducedMotion()` true ise plain element render et, framer-motion bypass.
5. **Playground entry** (`src/pages/motion-playground.astro`) — en az 2 varyant demo.
6. **CSS keyframe** gerekiyorsa `src/styles/global.css`'a ekle, `[data-…-node]` selector + `@media reduced-motion` pause.
7. **Type-check + bun test + codex review** komutlarını sırasıyla çalıştır.

## Tokens

`src/components/motion/tokens.ts`:

```ts
DURATION = { micro: 150, short: 300, medium: 600, long: 1200, cinematic: 2400 } // ms
EASE = {
  standard:    [0.32, 0.72, 0,    1   ],
  monumental:  [0.25, 0.46, 0.45, 0.94],
  responsive:  [0.34, 1.56, 0.64, 1   ],
  draw:        [0.65, 0,    0.35, 1   ],
  scan:        [0.4,  0,    0.6,  1   ],
}
SCROLL_STAGES.manifestoRise = { enter: [0, 0.2], hold: [0.2, 0.7], exit: [0.7, 1] }
REDUCED_MOTION_DURATION_MS = 1   // pipeline-safe instant
```

Tüm tokens **milisaniye**. Framer-motion saniye bekliyor → `adapters/framer.ts` `toFramerSeconds(ms)` ile çevir. SMIL `dur` attribute için `adapters/smil.ts` `toSmilDur(ms)` (string `"1200ms"`). CSS için `adapters/css.ts` `toCssDuration(ms)`.

## Reduced-motion contract

Tüm primitive'ler şu kuralı sağlar:

1. **SSR HTML** her zaman end-state'i içerir; inline `opacity:0` veya `transform:translateY` yoktur.
2. **`prefers-reduced-motion: reduce`** — framer-motion bypass, plain DOM elementi end-state'te render.
3. **SMIL primitive'ler** — `[data-motion-reduced-end-state]` attribute'ı taşır; `BaseLayout.astro` global CSS bunu pin'ler (`animation-play-state: paused`).
4. **CSS keyframe animation'lar** — global `@media (prefers-reduced-motion: reduce) { *: animation-duration: 0.01ms !important }` ile efektif duraklar.

JS-disabled kullanıcılar SSR HTML'i görür; içerik okunur kalır.

## Architecture decisions (Gate kararları)

- **Gate A → B3**: Tüm primitive'ler `.tsx` (`.astro` Container API testi henüz experimental + Vite/Vitest scope'lu; bun:test ile çalışmıyor).
- **Gate B → B**: v1'de Storybook yok; dev-only `src/pages/motion-playground.astro` kullanılır. Storybook v2 için defer.
- **`lenisSingleton`** `src/lib/` altında (app-shell ownership). Motion library hooks Lenis adapter'ını **prop** olarak alır, doğrudan import etmez.
- **GSAP+Lenis Phase 5'te aktif** (Task 5.2 sonrası). `useScrollProgress` adapter yokken inert kalır.

## Links

- Spec: [`docs/superpowers/specs/2026-05-12-motion-library-design.md`](../../docs/superpowers/specs/2026-05-12-motion-library-design.md) (v2, Codex integrated)
- Plan: [`docs/superpowers/plans/2026-05-13-motion-library.md`](../../docs/superpowers/plans/2026-05-13-motion-library.md)
- Gate A: [`docs/superpowers/plans/gate-a-astro-test-lane.md`](../../docs/superpowers/plans/gate-a-astro-test-lane.md)
- Gate B: [`docs/superpowers/plans/gate-b-storybook-astro.md`](../../docs/superpowers/plans/gate-b-storybook-astro.md)
- Archive: `archive/cinematic-showcase-2026-04-16` tag (legacy hooks/components migration source)
