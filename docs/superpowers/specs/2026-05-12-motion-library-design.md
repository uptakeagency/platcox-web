# Motion Library — Design Spec

**Date:** 2026-05-12 (revised 2026-05-13)
**Status:** Revised v2 — addresses Codex review findings (8 High + 9 Medium + 3 Low)
**Branch target:** `feat/motion-library` (created from `main`)
**Parent project:** PlatcoX Web full rewrite (decomposed into 5 sub-projects; this is sub-project #1)
**Related specs:**
- `docs/superpowers/specs/2026-04-05-platcox-web-redesign-design.md` — Palantir-inspired visual direction (umbrella)
- `docs/superpowers/specs/2026-04-16-cinematic-showcase-design.md` — superseded; cinematic showcase decommissioned

**v2 revision log (high-impact changes from v1):**
- §4 Tech stack split into current baseline (verified Tailwind 3.4.19) + target delta. GSAP/Lenis deferred to Phase 5. Storybook **10** not 9.
- §5.2.2 SSR-visible state contract added (critical SEO/a11y fix; ScrollReveal refactored).
- §6.1 Duration unit contract: `durationMs` everywhere + adapter helpers for Framer/SMIL/CSS.
- §7 expanded to full a11y contract (keyboard/focus/SR matrix per primitive).
- §8.1 Type architecture clarified: `BaseMotionProps` + per-primitive typed extensions, discriminated `Trigger` union.
- §10.6 Migration manifest added.
- §11 Two test lanes (React Lane A + Astro Lane B with three candidate approaches); behavior matrix replaces "≥4 tests".
- §12 Storybook 10 + `@storybook-astro/framework`, renderer-aware story criteria, fallback path.
- §13 Five locked integration sections, 3 high-risk required.
- §14 Estimate revised to 50-74h (with Phase 5) or 44-64h (without); two Phase 0 go/no-go gates added.
- §16 Acceptance criteria behavior-driven, with concrete Lighthouse measurement conditions and bundle budget.
- §17 Six open questions documented with Phase 0 deadlines.

---

## 1. Intent

Build an in-house motion primitive library (`src/components/motion/`) that gives platcoX's website a distinctive, originally-named motion vocabulary. The library is the foundational layer for the larger site rewrite: once primitives exist, the new information architecture, copy, visual design, and section rebuilds compose them.

The library must **not** be perceived as derivative from any third-party design-prototype tool. Industry-standard motion techniques (CSS keyframes, SVG SMIL, IntersectionObserver, Framer Motion, GSAP ScrollTrigger) are used freely; primitive **names, semantics, and usage** belong to platcoX's domain language (trade, ontology, decisions, supply chain).

External design-prototype tools (e.g., claude.ai/design) may be used as inspiration sounding boards, not as production output. No primitive is a 1:1 reproduction of an external example.

## 2. Goals & Non-Goals

### 2.1 Goals

- Eight motion primitives, each independently usable, independently tested, with consistent external API and heterogeneous internal implementation.
- Reduced-motion contract honored in every primitive (no animation suppression that hides content).
- TDD discipline: every primitive ships with at least four tests (render, reduced-motion, trigger, a11y).
- Storybook 9 with at least three stories per primitive.
- Integration into at least five existing homepage sections, demonstrating real value (not catalog-only delivery).
- Cinematic-showcase branch's infrastructure (`useReducedMotion`, `useScrollProgress`, `lenisSingleton`, test setup) preserved; everything else (WebGL shaders, disintegrate mesh, 220 frame WebPs) decommissioned.

### 2.2 Non-Goals

- Visual redesign of sections (handled in sub-project #4).
- Information architecture changes (handled in sub-project #2).
- Copy rewrites (sub-project #3).
- Section-by-section rebuild (sub-project #5).
- Dark-themed atmospheric WebGL (C paradigm rejected during brainstorming).
- Visual regression testing infrastructure (Playwright screenshot diffs) — deferred to motion library v2.
- Section-spanning cinematic moments beyond what `useScrollProgress` already supports.

## 3. Motion Paradigm Mix

The site's motion vocabulary is a **70% A / 30% B** blend:

- **A — Monumental** (Palantir/Apple sensibility): slow, scroll-tied transitions; large typography that enters, holds, exits; sketchy/hand-drawn detail; scarce but meaningful motion. Carries the site skeleton.
- **B — Micro-interactions** (Stripe/Linear sensibility): pulses, live counters, scan lines, gradient mesh; "alive" feeling in data-dense areas (Decision Engine, World Map, Sustainability metrics, Locations).

Paradigm C (cinematic/dark WebGL atmospherics) is explicitly rejected.

The 70/30 ratio is not enforced by primitive count (4 of 8 lean A, 4 of 8 lean B) but by **usage frequency across the site** — A primitives apply broadly across hero/manifesto/sections; B primitives concentrate in data-heavy sections.

## 4. Tech Stack & Dependencies

### 4.1 Current baseline (verified against `package.json` + `bun.lock` on 2026-05-12)

| Layer | Tool | Version |
|---|---|---|
| Framework | Astro | 6.1.3 |
| UI islands | React + React DOM | 19.2.4 |
| Styling | **Tailwind CSS** | **3.4.19** — NOT v4 |
| Tailwind integration | @astrojs/tailwind | 6.0.2 (peer: tailwindcss `^3`) |
| Declarative motion | Framer Motion | 12.38.0 |
| Schema validation | zod | 4.3.6 |
| Test runner | `bun:test` (Bun built-in) | — |
| DOM environment | jsdom | 29.0.1 |
| React testing | @testing-library/react + jest-dom | 16.3.2 + 6.9.1 |
| Package manager | Bun | per CLAUDE.md |
| Native primitives | SVG SMIL, CSS keyframes, IntersectionObserver, RAF | built-in |

### 4.2 Target delta (added or deferred by this spec)

| Tool | Version | Phase | Justification |
|---|---|---|---|
| GSAP + ScrollTrigger | `^3.13` | **Phase 5 (deferred)** | Only needed for ManifestoRise scroll-tied variant. Not added in Phase 0; introduced only when Phase 5 is committed. |
| Lenis | `^1.2` | **Phase 5 (deferred)** | Smooth-scroll bridge for GSAP. Same deferral as GSAP. |
| Storybook + `@storybook-astro/framework` | **Storybook 10.x** | **Phase 0 (after research checkpoint)** | Storybook 9 does **not** support Astro. Community `@storybook-astro/framework` requires Storybook **10.0.0+** and Astro **5.5.3+ / 6.0.0+**. See §17 Q2 for the Phase 0 go/no-go research. Risk: the integration is community-maintained and may not cover all features (renderer-bazlı story kriterleri §12'de tanımlı). |
| `test-setup.ts` | (migrated from cinematic) | Phase 0 | Test environment globals + matchMedia/IntersectionObserver mocks. |

### 4.3 Tailwind v3 → v4 migration

**Out of scope for this spec.** Motion library is designed for the **Tailwind 3.4.19** baseline. Any v4 migration is a separate sub-project; the motion library will be expected to work post-migration but does not block on it. The `motion-reduce:` variant used in this spec exists in v3.4+.

### 4.4 Explicitly NOT added

- `three`, `@react-three/fiber`, `@react-three/drei`, `@types/three` — C paradigm rejected during brainstorming.

### 4.5 Note on cinematic-branch package drift

The cinematic branch's `package.json` contains `gsap`, `lenis`, `three`, and `R3F`. This spec adds **only** `gsap` and `lenis` to current baseline, **only** at Phase 5 commit. The cinematic branch is not cherry-picked; dependencies are explicitly re-added via Phase 0/5 commits so the change is auditable in git history.

## 5. Architecture & File Layout

```
src/components/motion/
├── index.ts                       # Barrel export
├── tokens.ts                      # DURATION (ms), EASE, SCROLL_STAGES, REDUCED_MOTION_DURATION
├── types.ts                       # BaseMotionProps, Trigger discriminated unions, MotionRef
├── adapters/
│   ├── framer.ts                  # ms → seconds converter for Framer Motion
│   ├── smil.ts                    # ms → `${n}ms` string for SMIL `dur` attribute
│   └── css.ts                     # ms → CSS `animation-duration` value
├── hooks/
│   ├── useReducedMotion.ts        # Migrated from cinematic branch
│   ├── useInViewport.ts           # NEW — pooled IntersectionObserver (option-tuple keyed)
│   └── useScrollProgress.ts       # Migrated; consumes injected Lenis adapter (no singleton import)
├── primitives/
│   ├── TradeRoute.astro           # SVG SMIL + shared sayfa-düzeyi observer script
│   ├── SketchStroke.astro         # SVG SMIL + shared sayfa-düzeyi observer script
│   ├── OntologyGraph.tsx          # SVG + hover/focus state, React island
│   ├── ManifestoRise.tsx          # Framer Motion + optional useScrollProgress (Phase 5)
│   ├── NumberedReveal.tsx         # Framer Motion stagger
│   ├── DecisionPulse.tsx          # CSS @keyframes + Framer presence
│   ├── DataScan.tsx               # Framer + CSS scan-bar (composite trigger)
│   └── TickCounter.tsx            # requestAnimationFrame + Framer trigger
├── ScrollReveal.tsx               # MOVED from src/components/, refactored for SSR-visible state (§5.3)
├── __tests__/
│   ├── useInViewport.test.ts
│   ├── useReducedMotion.test.tsx  # Migrated
│   ├── useScrollProgress.test.tsx # Migrated
│   ├── adapters/
│   │   ├── framer.test.ts
│   │   ├── smil.test.ts
│   │   └── css.test.ts
│   ├── TradeRoute.test.ts         # Astro Container API (experimental) OR snapshot of SVG
│   ├── SketchStroke.test.ts
│   ├── OntologyGraph.test.tsx
│   ├── ManifestoRise.test.tsx
│   ├── NumberedReveal.test.tsx
│   ├── DecisionPulse.test.tsx
│   ├── DataScan.test.tsx
│   ├── TickCounter.test.tsx
│   └── helpers/
│       ├── mockMatchMedia.ts
│       ├── mockIntersectionObserver.ts
│       └── flushFramerAnimations.ts
└── stories/                       # Storybook 10 + @storybook-astro/framework
    ├── TradeRoute.stories.ts      # renderer="astro" — limited features (see §12.2)
    ├── SketchStroke.stories.ts    # renderer="astro"
    ├── OntologyGraph.stories.tsx  # renderer="react" — full features
    ├── ManifestoRise.stories.tsx
    ├── NumberedReveal.stories.tsx
    ├── DecisionPulse.stories.tsx
    ├── DataScan.stories.tsx
    └── TickCounter.stories.tsx

src/lib/                           # APP-SHELL OWNS the Lenis instance, NOT motion library
└── lenisSingleton.ts              # MOVED from cinematic, lives at app-shell level (§10)

src/layouts/BaseLayout.astro       # Adds ONE shared script: window.__motionObserver
                                   # for all data-trigger="viewport" SMIL primitives
```

### 5.1 Internal-heterogeneous, external-homogeneous

Each primitive picks its optimal internal tool (SVG SMIL, Framer, GSAP, CSS keyframes) but exposes a consistent external API. Consumers never need to know the implementation detail.

### 5.2 Astro vs React decision rule

- `.astro` chosen for primitives that are **stateless, focus-less, and dominated by SVG markup** (TradeRoute, SketchStroke).
- `.tsx` chosen when the primitive needs React state, hover/focus handlers, scroll-progress hooks, or imperative ref API (the other six).
- React primitives are imported with `client:visible` directive in Astro pages — they hydrate only when scrolled into viewport.

### 5.2.1 The "minimum-JS" Astro primitive contract (NOT "zero-JS")

The earlier draft claimed `.astro` primitives are **zero-JS**. This is misleading: `viewport-once`, `viewport-repeat`, and `manual` triggers all require JavaScript at the page level. The revised contract:

- The `.astro` primitive itself renders **only SVG markup** — no React, no per-primitive script tag.
- **One** sayfa-düzeyi (page-level) shared script lives in `BaseLayout.astro` (~30 lines, no dependencies). It exposes `window.__motionObserver` which:
  - Watches all `[data-motion-trigger]` elements via a single pooled IntersectionObserver
  - Calls `.beginElement()` on contained SMIL `<animate>` nodes on intersect
  - Exposes a global `window.__motionTrigger(id)` for `trigger="manual"` use cases
- Reduced-motion handling for `.astro` primitives is **CSS-driven**: `@media (prefers-reduced-motion: reduce)` rule sets `stroke-dashoffset: 0` and `animation-play-state: paused`.
- `trigger="manual"` on `.astro` primitives requires the consumer to call `window.__motionTrigger(id)`. The primitive emits `id={...}` attribute. React primitive's `ref` API is NOT shared with `.astro` primitives — separate semantic, documented separately.

**Net impact:** Astro primitives contribute roughly 30 lines of always-loaded JS at the document head. No per-primitive React hydration, no per-primitive observer.

### 5.2.2 SSR-visible state contract (critical accessibility & SEO requirement)

**Problem identified in Codex review:** the existing `ScrollReveal` pattern uses `initial="hidden"` + `whileInView="visible"` with `client:visible` directive. This renders **invisible content** to SSR HTML — search engines, screen readers, and users with disabled JS see blank H1s. Above-the-fold content (e.g., HeroSection H1) is hydration-blocked.

**Revised contract for all React primitives:**

1. **SSR HTML must contain the readable end-state markup.** The primitive's server-rendered output is what a reader sees if JS never runs.
2. **Animations are progressive enhancement.** On mount, the primitive transitions from the server-rendered visible state into a "ready for re-animation" state, then animates on the relevant trigger.
3. For viewport-once triggers: if the element is already inside the viewport on mount (e.g., HeroSection H1), the animation is **skipped** — element stays in its visible end-state. Only elements that were below-the-fold at mount animate when scrolled into view.
4. For `scroll-progress` triggers: SSR shows the primitive at its `progress=0` visible state; scroll progress drives transitions from there.
5. `motion-reduce:` Tailwind variant always pins the SSR/end-state.

**Implementation note:** Framer Motion supports this via `initial={false}` on hydration, with an explicit `useEffect` to enable animation post-mount, plus a viewport check to determine whether to animate or skip.

### 5.3 ScrollReveal migration + SSR refactor

`src/components/ScrollReveal.tsx` (existing, Framer Motion wrapper, imported by **11 section files**) moves to `src/components/motion/ScrollReveal.tsx`. All 11 imports must be updated:

- `AboutSection.astro`, `ClientsWhySection.astro`, `ContactSection.astro`, `DecisionEngineSection.astro`, `HeroSection.astro`, `LocationsSection.astro`, `NewsSection.astro`, `PhilosophySection.astro`, `SolutionsSection.astro`, `SustainabilitySection.astro`, `TestimonialsSection.astro`.

**Beyond rehoming, the component is refactored** to honor §5.2.2 SSR-visible contract:

- Remove `initial="hidden"` SSR state. Render children in the final-visible position on the server.
- On mount, if `prefers-reduced-motion: reduce` or element is already in viewport, no animation runs.
- Otherwise, the component briefly resets to its "hidden" state and animates to visible on viewport entry. The hydration transition is invisible to the user because the brief reset happens before paint.

This is **a behavior change** for existing consumers but corrects an SEO/a11y bug. Visual diff: above-the-fold sections (Hero, About) no longer fade in on page load — they appear with the page. Below-the-fold sections animate as before.

## 6. Motion Tokens

`src/components/motion/tokens.ts`:

```ts
// ALL DURATIONS ARE MILLISECONDS — single source of truth.
// Adapters convert to each engine's expected format (see §6.1).
export const DURATION = {
  micro:     150,   // hover, button press
  short:     300,   // small reveals, fade-in/out
  medium:    600,   // section enter, default
  long:     1200,   // manifesto rise, sketch stroke draw
  cinematic: 2400,  // scroll-tied manifesto, hero
} as const;

export const EASE = {
  standard:    [0.32, 0.72, 0, 1],       // most reveals (Apple-like)
  monumental:  [0.25, 0.46, 0.45, 0.94], // slow start, slow end — A imzası
  responsive:  [0.34, 1.56, 0.64, 1],    // overshoot — B pulse imzası
  draw:        [0.65, 0, 0.35, 1],       // SVG path stroke-draw
  scan:        [0.4, 0, 0.6, 1],         // smooth scan
} as const;

export const SCROLL_STAGES = {
  manifestoRise: {
    enter: [0.00, 0.20],
    hold:  [0.20, 0.70],
    exit:  [0.70, 1.00],
  },
} as const;

// 1 ms — effectively-instant, but pipeline-safe (avoids Framer 0-ms layout-skip bug).
export const REDUCED_MOTION_DURATION_MS = 1;
```

### 6.1 Duration unit contract + adapters

All public APIs and tokens use **milliseconds**. The prop name is **`durationMs`**, never just `duration` (the latter is ambiguous; Framer Motion's `duration` is seconds, SMIL's `dur` is a string like `"1200ms"`, CSS's `animation-duration` accepts both).

Adapters under `src/components/motion/adapters/` translate ms tokens into each engine's required format:

```ts
// adapters/framer.ts
export const toFramerSeconds = (ms: number): number => ms / 1000;

// adapters/smil.ts
export const toSmilDur = (ms: number): string => `${ms}ms`;

// adapters/css.ts
export const toCssDuration = (ms: number): string => `${ms}ms`;
```

This means:
- React primitive using Framer Motion: `transition={{ duration: toFramerSeconds(durationMs) }}`
- `.astro` primitive using SMIL: `dur={toSmilDur(durationMs)}`
- CSS keyframes: `style={`animation-duration: ${toCssDuration(durationMs)}`}`

**Rationale:** Mixing units is one of the highest-frequency bugs in motion libraries. A single unit at the API surface + adapter conversion at the boundary eliminates the entire bug class.

**Tailwind integration is deferred.** Tailwind v3.4 transition-duration utilities use ms strings (`duration-300`); mirroring DURATION tokens into `tailwind.config.ts` is a low-priority enhancement, not required for v1.

## 7. Accessibility Contract

This section covers reduced-motion (visual motion preferences), but also keyboard navigation, focus management, screen reader semantics, and pause/stop expectations — none of which can be left implicit.

### 7.1 Reduced-motion: three-layered enforcement

1. **Token layer:** `REDUCED_MOTION_DURATION_MS = 1` (1 ms, not 0, to avoid Framer Motion layout-skip bug).
2. **Hook layer:** `useReducedMotion()` (migrated from cinematic) is the single source of truth.
3. **Primitive layer:** Each primitive checks reduced-motion and **jumps to end-state**. "No animation" never means "invisible" — it means "transitions skipped, end-state shown immediately."

### 7.2 Per-primitive end-state behavior under reduced-motion

| Primitive | End-state shown |
|---|---|
| TradeRoute | Path fully drawn (`stroke-dashoffset = 0`) — pinned via CSS `@media` rule |
| SketchStroke | Path fully drawn |
| ManifestoRise | Typography at final position, full opacity |
| NumberedReveal | All rows visible simultaneously |
| DecisionPulse | Card visible, pulse ring `animation-play-state: paused` (still rendered, frozen) |
| DataScan | All rows visible, scan bar `animation-play-state: paused` |
| TickCounter | Final number shown directly |
| OntologyGraph | Nodes/edges visible, breathing `animation-play-state: paused` |

### 7.3 Per-primitive a11y behavior matrix

| Primitive | Decorative default | Informative mode | Keyboard / focus | Screen reader text |
|---|---|---|---|---|
| TradeRoute | yes, `role="presentation"` if no `ariaLabel` | with `ariaLabel`, becomes `role="img"` with that label | not interactive | from `ariaLabel`; endpoints get visually-hidden `<title>` |
| SketchStroke | always decorative | n/a | not interactive | none |
| OntologyGraph | informative by default | always; `ariaLabel` describes the graph as a whole | each node is `<g role="button" tabindex="0">`, Enter/Space opens detail (same as hover); Escape closes | per-node `<title>` and `aria-describedby` for detail panel |
| ManifestoRise | informative; renders as `<h1>` or as specified by `as` prop | text content is the SR semantics | not interactive (unless contains a link) | from rendered text |
| NumberedReveal | informative; renders as ordered list or `<dl>` | each item's `num` becomes `aria-label` augmenter | not interactive | from rendered text |
| DecisionPulse | informative | always; `title` and `value` props form `aria-label` | not interactive by default; if `onActivate` prop provided, exposes as `<button>` | "{title}: {value}" + trend indicator |
| DataScan | informative; renders as `<table>` or `<dl>` | always | not interactive | row labels and values readable as table |
| TickCounter | informative | always; final value announced via `aria-live="polite"` exactly once on completion | not interactive | final value as text |

**Pause/stop expectations:** Continuous animations (DecisionPulse pulse ring, DataScan scan bar, OntologyGraph breathing) automatically respect `prefers-reduced-motion: reduce` via CSS `animation-play-state`. A11y-required explicit pause buttons are **out of scope** because no primitive animates for more than 5 seconds without user-initiated trigger (WCAG 2.2.2 threshold).

### 7.4 Test enforcement

Every primitive's test file MUST include a `prefers-reduced-motion: reduce` scenario with end-state assertion AND an a11y attribute check (presence of correct `role`, `aria-label`, `tabindex` per §7.3). This contract is verified, not assumed.

CI runs `axe-core` against representative integrations (Phase 6 sections) as part of the test suite. New axe violations vs. main block merge.

## 8. Primitive API Contract

### 8.1 Type architecture: external-homogeneous *concepts*, internal typed *specifics*

The earlier draft claimed "external-homogeneous API" universally. Codex correctly flagged that this is not type-accurate: `class` vs `className` differ between Astro and React, composite triggers don't match scalar triggers, and ref semantics differ by primitive. The revised model is:

- `BaseMotionProps` — **conceptual** common surface: `durationMs?`, `ariaLabel?`, classes
- Per-primitive **typed** props extend `BaseMotionProps` with their own concrete shape
- `Trigger` is a **discriminated union** with explicit variants per primitive
- `MotionRef` is only applied to primitives that share the same imperative semantics

```ts
// types.ts
export interface BaseMotionProps {
  /** Tailwind composition. Astro components accept `class`, React accepts `className`. */
  durationMs?: number;
  ariaLabel?: string;
}

export interface BaseAstroProps extends BaseMotionProps {
  class?: string;
}

export interface BaseReactProps extends BaseMotionProps {
  className?: string;
}

// Discriminated union: each variant is a literal-typed object,
// per-primitive type narrows to its supported variants.
export type Trigger =
  | { kind: "viewport-once" }
  | { kind: "viewport-repeat" }
  | { kind: "scroll-progress"; sectionId: string }
  | { kind: "hover" }
  | { kind: "always" }
  | { kind: "manual"; id: string };

// Convenience scalar form for simple cases; resolved internally to discriminated union.
export type TriggerShorthand =
  | "viewport-once"
  | "viewport-repeat"
  | "hover"
  | "always";

// Imperative API — only on React primitives that need it.
// Each primitive declares its own subset of this interface.
export interface MotionRef {
  start: () => void;
  reset: () => void;
  play?: () => void;
  pause?: () => void;
}
```

**Per-primitive prop interfaces are declared in each primitive's own file** (e.g., `TradeRouteProps`, `DecisionPulseProps`). The barrel `index.ts` re-exports them.

### 8.2 Per-primitive trigger support

Each primitive supports only a subset; defaults are per-primitive.

| Primitive | Supported triggers | Default | Notes |
|---|---|---|---|
| TradeRoute | `viewport-once`, `viewport-repeat`, `manual` | `viewport-once` | Manual trigger requires `window.__motionTrigger(id)` (page-level helper, §5.2.1). |
| SketchStroke | `viewport-once` | `viewport-once` | `manual` removed — keep the primitive's contract simple; no use case identified. |
| ManifestoRise | `viewport-once`, `scroll-progress` | `viewport-once` | `scroll-progress` ships in Phase 5; requires GSAP/Lenis. |
| NumberedReveal | `viewport-once` | `viewport-once` | — |
| DecisionPulse | `always` (pulse ring runs continuously) | `always` | Emphasis effect on new data: triggered via `pulse` prop + `MotionRef` API, not via trigger. |
| DataScan | composite `{ rows: "viewport-once", scan: "always" }` | composite | Single object form documented in §8.3. |
| TickCounter | `viewport-once`, `manual` | `viewport-once` | Manual re-trigger fires on `target` prop change OR explicit `ref.start()`. |
| OntologyGraph | composite `{ breathing: "always", detail: "hover" }` | composite | `detail: "hover"` also responds to keyboard focus (`Enter`/`Space`); see §7.3. |

### 8.3 Composite trigger object form

For DataScan and OntologyGraph, `trigger` accepts a small object instead of a string:

```tsx
<DataScan
  trigger={{ rows: "viewport-once", scan: "always" }}
  rows={[...]}
/>
```

Scalar default keeps simple use easy; object override allows composite expression.

### 8.4 Manual trigger ref API

For primitives supporting `trigger="manual"`, the React component exposes via `useImperativeHandle`:

```ts
interface MotionRef {
  start: () => void;
  reset: () => void;
  play: () => void;
  pause: () => void;
}
```

Use case: `<DecisionPulse ref={pulseRef} ... />` then `pulseRef.current?.start()` when a new alert arrives.

### 8.5 Naming conventions

- Primitive names: **PascalCase nouns** — `TradeRoute`, `DecisionPulse`, `OntologyGraph` (never `RouteDrawer`, `PulseAnimator`).
- Hooks: `useX` — `useInViewport`, `useReducedMotion`, `useScrollProgress`.
- Tokens: UPPER_SNAKE — `DURATION.long`, `EASE.monumental`.

## 9. The Eight Primitives

### 9.1 TradeRoute (Astro/SMIL)

SVG path-draw between two points. `stroke-dasharray` + SMIL `<animate>` + `pathLength="1"` trick for length-independent timing.

**Props:** `from: {x,y,label?}`, `to: {x,y,label?}`, `curve?: number` (0..1), trigger, duration, ariaLabel, class.

**Use cases:** WorldMap location connections, supply chain diagrams, "from sourcing to delivery" flow visualizations.

**Reduced-motion:** `motion-reduce:!stroke-dashoffset-0` Tailwind variant ensures path renders fully drawn.

### 9.2 SketchStroke (Astro/SMIL)

Hand-drawn SVG decoration (circle, ring, arrow, abstract shape). Optional jitter for "hand-drawn" feel via stroke-width variation.

**Props:** `shape: "circle" | "ring" | "arrow" | "custom"`, `path?: string` (when shape="custom"), trigger, duration, class.

**Use cases:** Hero decorative element, section heading accents, /0.1 numbering ornaments.

### 9.3 OntologyGraph (React/SVG composite)

Force-directed-feel node-edge graph. Nodes breathe continuously (subtle radius pulse); edges have animated dash flow; hover on a node shows label/detail overlay.

**Props:** `nodes: {id, x, y, label, weight?}[]`, `edges: {from, to}[]`, trigger (composite), className.

**Use cases:** Cloud Ontology Decision Engine (C.O.D.E) explainer; "everything is connected" visualization in Philosophy or Sustainability sections.

### 9.4 ManifestoRise (React/Framer)

Large typography stage entry. Lines stagger in from below, hold at full opacity, then either exit upward (scroll-tied version) or remain (viewport-once version).

**Props:** `lines: string[]`, trigger (`viewport-once` or `scroll-progress`), `staggerDelay?: number` (between lines, default 150 ms), className.

**Use cases:** Hero manifesto, section transition manifestos. Highest-impact A-paradigm primitive — use sparingly.

**Phase 2 ships the `viewport-once` version. Phase 5 ships the `scroll-progress` version using `useScrollProgress` and Lenis pinning.**

### 9.5 NumberedReveal (React/Framer)

`/0.1`, `/0.2`, `/0.3` numbered list reveal. On viewport entry: number fades in first, then heading, then 1px divider draws across. Staggered between items.

**Props:** `items: {num: string, title: string, description?: string}[]`, `staggerDelay?: number` (between items, default 120 ms), className.

**Use cases:** About, Solutions, Philosophy sections. Palantir's signature pattern, native to redesign spec.

### 9.6 DecisionPulse (React/CSS + Framer)

Alert/decision card with continuous CSS pulse ring on the indicator dot. The ring animation runs `always` (pauses when scrolled offscreen via CSS `animation-play-state` toggled by `useInViewport`). When new data arrives, the card briefly scales to emphasize the update; this emphasis is triggered either by:

- **Prop change**: `value` or `trend` prop changing — `useEffect` detects and triggers emphasis.
- **Imperative ref**: parent calls `pulseRef.current?.start()` for manual emphasis (e.g., on websocket message arrival when prop diffing is insufficient).

**Props:**

```ts
interface DecisionPulseProps extends BaseReactProps {
  title: string;
  value: string | number;            // explicit union
  trend?: "up" | "down" | "neutral";
  pulse?: boolean;                   // default true; set false to disable ring entirely
  onActivate?: () => void;           // if provided, card renders as `<button>` (a11y, §7.3)
}
```

`ref` accepts `Pick<MotionRef, "start">` interface — `start()` triggers the emphasis effect. `reset`, `play`, `pause` are not meaningful for DecisionPulse.

**Use cases:** DecisionEngineDemo, real-time data callouts, alert sections.

### 9.7 DataScan (React/composite)

Terminal-style data row list with scanning bar that traverses bottom edge continuously. Rows stagger in once on viewport entry; scan bar loops always.

**Props:** `rows: {label: string, value: string}[]`, `mono?: boolean` (use monospace font, default true), `staggerDelay?: number` (between rows, default 80 ms), trigger (composite), className.

**Use cases:** Sustainability metrics, supply chain summary, "we move data" hero sub-element.

### 9.8 TickCounter (React/RAF + Framer)

Large numeric count-up from `startValue` (default `0`) to `target`. Uses `requestAnimationFrame` with cubic ease-out; `font-variant-numeric: tabular-nums` prevents digit width jitter.

**Props:**

```ts
interface TickCounterProps extends BaseReactProps {
  target: number;
  startValue?: number;             // default 0
  format?: "number" | "currency" | "percent";   // default "number"
  /** ISO 4217 code, required if format="currency". */
  currency?: string;
  /** BCP-47 locale; default "en-US". Set explicitly to avoid SSR/client drift. */
  locale?: string;
  /** Fraction digits for the final value. Default: 0 for number/currency, 1 for percent. */
  precision?: number;
  suffix?: string;
}
```

**SSR contract** (per §5.2.2): server renders the **final formatted value**. On mount, if `useInViewport` reports the element in viewport AND reduced-motion is false, the count-up runs from `startValue` → `target`. Otherwise, the final value is what users see. Locale and precision are deterministic across SSR/client because `locale` defaults to `"en-US"` (not `Intl.DateTimeFormat().resolvedOptions().locale`, which drifts).

`ref` accepts `Pick<MotionRef, "start" | "reset">` — `start()` re-runs animation, `reset()` returns to `startValue` immediately.

**Use cases:** Hero stat callouts ("240,000 SKUs"), Locations count, KPIs.

## 10. Cinematic Branch Decommissioning

### 10.1 Preserved (migrated)

| Source path (cinematic branch) | Destination path | Owner level |
|---|---|---|
| `src/lib/lenisSingleton.ts` | `src/lib/lenisSingleton.ts` (UNCHANGED) | **app-shell** — NOT inside motion library, prevents global behavior leak |
| `src/lib/__tests__/lenisSingleton.test.ts` | `src/lib/__tests__/lenisSingleton.test.ts` | app-shell |
| `src/components/cinematic/useReducedMotion.ts` | `src/components/motion/hooks/useReducedMotion.ts` | motion library |
| `src/components/cinematic/useScrollProgress.ts` | `src/components/motion/hooks/useScrollProgress.ts` | motion library (consumes app-shell Lenis via injected adapter) |
| `src/components/__tests__/useReducedMotion.test.tsx` | `src/components/motion/__tests__/useReducedMotion.test.tsx` | motion library |
| `src/components/__tests__/useScrollProgress.test.tsx` | `src/components/motion/__tests__/useScrollProgress.test.tsx` | motion library |
| `test-setup.ts` | `test-setup.ts` (project root) | project root |
| `package.json` deps: `gsap`, `lenis` | `package.json` deps — added in Phase 0 (lenis) and Phase 5 (gsap) | — |

**Phase split note:** `lenis` is needed at app-shell for smooth scroll integration (added Phase 0). `gsap` is only needed for ManifestoRise scroll-progress in Phase 5 (deferred). `useScrollProgress` therefore lands in Phase 0 but stays inert until GSAP arrives in Phase 5.

### 10.2 Discarded

- `src/components/cinematic/DisintegrateMesh.tsx`
- `src/components/cinematic/DisintegrateShader.ts`
- `src/components/cinematic/FramePlayer.tsx`
- `src/components/cinematic/ShowcaseCanvas.tsx`
- `src/components/cinematic/ShowcaseCanvasFrames.tsx`
- `src/components/cinematic/ShowcaseFallback.tsx`
- `src/components/CinematicShowcaseSection.astro`
- `src/components/__tests__/CinematicShowcaseSection.test.tsx`
- `src/components/__tests__/ShowcaseFallback.test.tsx`
- `public/images/cinematic/frames/frame-*.webp` (220 files)
- `public/images/cinematic/noise.webp`
- `scripts/generate-cinematic-images.ts`
- `scripts/generate-placeholder-frames.ts`
- `package.json` deps: `three`, `@react-three/fiber`, `@types/three`

### 10.3 Branch operations

1. Tag preservation: `git tag archive/cinematic-showcase-2026-04-16 feat/cinematic-showcase && git push origin archive/cinematic-showcase-2026-04-16`
2. Branch deletion: `git branch -D feat/cinematic-showcase` (after tag push confirmed)
3. `feat/decision-engine-section` cleanup: branch already merged on 2026-04-07; delete local (`git branch -D feat/decision-engine-section`); the four post-merge commits get redistributed:
   - Cinematic plan/spec docs → carried into `feat/motion-library` as reference
   - `.worktrees/` gitignore → separate small PR to main
   - Gemini prompts doc → discard (no longer relevant; C paradigm rejected)

### 10.4 Unrelated untracked files

These exist but are not in scope for this spec:

- `docs/superpowers/plans/2026-04-05-platcox-web-redesign.md` — full rewrite umbrella; commit to a separate `chore/redesign-docs` branch, separate PR.
- `docs/superpowers/specs/2026-04-05-platcox-web-redesign-design.md` — same.
- `src/pages/poster.astro` — separate `feat/poster-page` branch, separate PR. Must address production route exposure (rename to `_poster.astro` or guard via robots.txt).

### 10.5 Migration method: manual copy, not cherry-pick

Manual file copying is preferred over `git cherry-pick` because:
- File paths change (`src/components/cinematic/` → `src/components/motion/`)
- Some cinematic commits include unwanted changes (220 frame WebPs in single commits)
- A single clean commit ("chore(motion): seed library from cinematic-showcase infra") is cleaner than 6+ cherry-picked commits with mixed scope

### 10.6 Migration manifest

The Phase 0 seed commit's PR description MUST include an explicit migration manifest:

```
COPIED (with destination):
  - src/lib/lenisSingleton.ts → src/lib/lenisSingleton.ts (unchanged path)
  - src/lib/__tests__/lenisSingleton.test.ts → src/lib/__tests__/lenisSingleton.test.ts
  - src/components/cinematic/useReducedMotion.ts → src/components/motion/hooks/useReducedMotion.ts
  - src/components/cinematic/useScrollProgress.ts → src/components/motion/hooks/useScrollProgress.ts
  - src/components/__tests__/useReducedMotion.test.tsx → src/components/motion/__tests__/useReducedMotion.test.tsx
  - src/components/__tests__/useScrollProgress.test.tsx → src/components/motion/__tests__/useScrollProgress.test.tsx
  - test-setup.ts → test-setup.ts

EXPLICITLY EXCLUDED (kept on archive/cinematic-showcase-2026-04-16 tag):
  - src/components/cinematic/DisintegrateMesh.tsx
  - src/components/cinematic/DisintegrateShader.ts
  - src/components/cinematic/FramePlayer.tsx
  - src/components/cinematic/ShowcaseCanvas.tsx
  - src/components/cinematic/ShowcaseCanvasFrames.tsx
  - src/components/cinematic/ShowcaseFallback.tsx
  - src/components/CinematicShowcaseSection.astro
  - src/components/__tests__/CinematicShowcaseSection.test.tsx
  - src/components/__tests__/ShowcaseFallback.test.tsx
  - public/images/cinematic/* (221 files)
  - scripts/generate-cinematic-images.ts
  - scripts/generate-placeholder-frames.ts

DEPENDENCY DELTA:
  - ADDED: lenis ^1.2 (Phase 0)
  - DEFERRED: gsap ^3.13 (Phase 5)
  - REMOVED: three, @react-three/fiber, @types/three (from cinematic carryover)

ARCHIVE TAG:
  - archive/cinematic-showcase-2026-04-16
```

This manifest makes the diff between Phase 0 commit and the archive tag fully traceable.

## 11. Testing Strategy

### 11.1 Two test lanes

The earlier draft assumed `bun:test + jsdom + @testing-library/react` covers all primitives. This works for React primitives but **not for `.astro` primitives** — Astro's rendering happens in its own Vite pipeline; the Astro Container API for unit testing is officially **experimental** as of 2026-05-13 (see §17 Q3).

The revised strategy uses **two lanes**:

**Lane A — React primitives + hooks + adapters** (default lane):
- `bun:test` test runner
- `jsdom` DOM environment
- `@testing-library/react` + `@testing-library/jest-dom`
- Helpers under `src/components/motion/__tests__/helpers/`
- Coverage: 6 React primitives + 3 hooks + 3 adapters + ScrollReveal

**Lane B — Astro primitives** (TradeRoute, SketchStroke):
- **Decision deferred to Phase 0 research checkpoint** (§14, §17 Q1).
- Two candidate approaches:
  - **B1:** Astro Container API (`experimental_AstroContainer.create()`) + Vitest in a separate `astro:test` script. Risk: experimental status.
  - **B2:** Snapshot-test the static SVG output via a tiny helper that invokes Astro's render programmatically; verify SMIL attribute correctness (`begin`, `dur`, `keySplines`). Behavior verification (animation playback) is handled in Storybook + manual cross-browser QA, not unit tests. Risk: lower coverage of dynamic behavior.
  - **B3:** Convert `.astro` primitives to React `.tsx` (giving up "minimum-JS" claim) → unified Lane A. Risk: dependency cost, ~30% larger bundle for hero illustrations.
- Phase 0 produces a decision document; Phase 1 implements the chosen lane.

### 11.2 Required behavior matrix per primitive

Instead of "≥4 tests", every primitive must satisfy the following **behavior matrix**. A test file may collapse multiple cells into one test; what matters is each cell is covered.

| # | Behavior | Why |
|---|---|---|
| 1 | **Render correctness** — component mounts and produces expected DOM structure for default props | smoke test |
| 2 | **SSR visible-state** — server-rendered output (via Astro Container API or React `renderToString`) is readable / visible end-state (§5.2.2) | a11y/SEO regression guard |
| 3 | **Reduced-motion end-state** — with `matchMedia` mocked to `(prefers-reduced-motion: reduce)`, primitive renders end-state without animation pipeline running | a11y |
| 4 | **Trigger behaviors** — for each supported `Trigger.kind` (per §8.2), exactly the expected animation starts/doesn't start | API contract |
| 5 | **Unmount cleanup** — observers, RAF handles, listeners, and Framer animations are torn down on unmount; assertions via spies on `IntersectionObserver.disconnect`, `cancelAnimationFrame`, etc. | memory leak guard |
| 6 | **Manual ref API** (where applicable per §8.2 column) — `ref.current.start()` / `.reset()` produce expected state changes | imperative contract |
| 7 | **A11y attributes** — `role`, `aria-label`, `tabindex` match §7.3 table for the given prop set | a11y |
| 8 | **Prop variation** — at least 2 non-default prop combinations render correctly (e.g., custom `durationMs`, custom `curve`) | API surface coverage |

Eight behaviors × 8 primitives (+ adapters, hooks, ScrollReveal) → roughly 70-100 test cases total. **Counts are derived from this matrix, not vice versa.**

### 11.3 Test helpers

```ts
// __tests__/helpers/mockMatchMedia.ts
export function mockMatchMedia(query: string, matches: boolean): void;

// __tests__/helpers/mockIntersectionObserver.ts
export function mockIntersectionObserver(): {
  trigger: (isIntersecting: boolean, target?: Element) => void;
  disconnect: ReturnType<typeof spyOn>;
};

// __tests__/helpers/flushFramerAnimations.ts
export async function flushFramerAnimations(): Promise<void>;

// __tests__/helpers/mockRAF.ts
export function mockRAF(): {
  step: (frames?: number) => void;
  cancel: ReturnType<typeof spyOn>;
};
```

### 11.4 Storybook + axe-core a11y testing

Storybook 10's `@storybook/addon-a11y` runs axe-core checks per story. Phase 7 adds CI integration:

- `bun run story:a11y` builds Storybook and runs axe against each story; fails on any violation.
- Phase 6 integration sections (5+ pages) are also axe-tested in their natural homepage context via `bun run lighthouse:a11y` (a thin wrapper invoking Lighthouse CLI with `--only-categories=accessibility`).

### 11.5 Out of scope

- Playwright screenshot diff tests (deferred to motion library v2; tracked as a follow-up).
- Cross-browser SMIL animation timing tests (manual QA covers this — see acceptance §16).
- Performance benchmarks (FPS, bundle size delta) — measured in Phase 7 polish, not in unit tests.

## 12. Storybook 10 Setup (with renderer-aware story criteria)

### 12.1 Toolchain

- **Storybook 10.x** with Vite builder.
- **`@storybook-astro/framework`** — community-maintained Astro framework for Storybook. Requires Storybook 10.0.0+ and Astro 5.5.3+ / 6.0.0+. We are on Astro 6.1.3, compatible.
- `.storybook/main.ts` configures both React (`@storybook/react-vite`) and Astro (`@storybook-astro/framework`) renderers in a single Storybook instance.
- Story files: `src/components/motion/stories/*.stories.tsx` (React) and `*.stories.ts` (Astro).
- `bun run story` script alias in `package.json`.
- **Phase 0 research checkpoint** (§17 Q2): validate that the community framework covers our needs (controls, autodocs, a11y addon). If gaps surface, Phase 1 may switch to **Storybook for React only** + a hand-rolled Astro playground page for SMIL primitives. The decision is made before Phase 1.

### 12.2 Stories per primitive — renderer-aware

**React primitives (6: OntologyGraph, ManifestoRise, NumberedReveal, DecisionPulse, DataScan, TickCounter)** — full Storybook treatment, ≥3 stories each:

1. **Default** — most common usage with sensible defaults.
2. **EdgeCase** — extreme prop values (very long duration, very large `target` for TickCounter, etc.).
3. **InteractiveControl** — manual ref API demo (where applicable) or trigger variation.

**Astro primitives (2: TradeRoute, SketchStroke)** — limited Storybook treatment per community framework feature gaps, ≥2 stories each:

1. **Default** — basic render.
2. **VariantSet** — a single story containing multiple prop variants in a grid layout (since Astro stories don't yet support React-style controls reliably).

Total: 6 × 3 + 2 × 2 = **22 minimum stories**.

### 12.3 Documentation

Each story file includes Storybook autodocs metadata. Component-level MDX docs deferred to Phase 7 polish — not blocking PR merge.

### 12.4 Fallback path

If Phase 0 research determines Storybook + `@storybook-astro/framework` is not production-ready: Storybook ships React-only, Astro primitives are demonstrated via a dev-only `src/pages/_motion-playground.astro` page using underscore-prefix Astro convention (excluded from production build). This fallback was the original brainstorm preference and remains viable.

## 13. Integration into Existing Sections (Phase 6)

Motion library is not catalog-only. Phase 6 integrates it into the live homepage. To prevent the "5 cheap reveals = done" loophole, **the 5 integration targets are locked upfront**, and at least one is high-risk (replacing existing behavior, not just wrapping it).

### 13.1 Locked integration list (5 sections)

| # | Section file | Integration | Risk |
|---|---|---|---|
| **1** | `src/components/HeroSection.astro` | Add `<ManifestoRise lines={["Where Global Trade", "Gets Redefined."]} as="h1">` replacing the existing `<ScrollReveal><h1>…</h1></ScrollReveal>` wrap. Critical: SSR-visible (§5.2.2) — H1 text must be in the source HTML. | **HIGH** |
| **2** | `src/components/WorldMap.tsx` | Replace static SVG lines between locations with `<TradeRoute from={...} to={...}>` instances. Tests must verify reduced-motion still shows all routes drawn. | **HIGH** |
| **3** | `src/components/DecisionEngineDemo.tsx` | Wrap alert cards in `<DecisionPulse title=... value=...>`; replace the numeric stat in the demo card with `<TickCounter target={...}>`. | **HIGH** |
| **4** | `src/components/AboutSection.astro` | Replace static numbered items with `<NumberedReveal items={...}>`. Mostly a wrapper swap. | MED |
| **5** | `src/components/SolutionsSection.astro` | `<NumberedReveal items={...}>` for solutions list. | LOW |

At least **3 of these 5** must be HIGH-risk per the table. Other section integrations (Philosophy, Sustainability, Locations) are encouraged but not required for PR merge.

### 13.2 Integration acceptance per section

Each integrated section must:
- Pass its existing tests after integration.
- Pass an axe-core run against its page (no new a11y violations).
- Have SSR HTML readable when JS is disabled (verified by `curl http://localhost:4321/ | grep "Where Global Trade"`).
- Show no FOIT/FOUC regression on slow 4G throttling.

### 13.3 Out of scope for Phase 6

- Visual redesign of these sections (sub-project #4).
- Copy changes (sub-project #3).
- New IA / section reordering (sub-project #2).

## 14. Phasing

| Phase | Scope | Estimate |
|---|---|---|
| **0** | Infrastructure + **two go/no-go research checkpoints** (§17 Q1 `.astro` test lane, §17 Q2 Storybook+Astro). Branch, deps (lenis only — gsap deferred), motion/ skeleton, hooks/adapters scaffold, tokens/types, lenisSingleton at app-shell, ScrollReveal moved + SSR refactor, sayfa-düzeyi motion observer in BaseLayout. | **6-10 h** |
| **1** | Astro/SMIL primitives: TradeRoute, SketchStroke (+ behavior-matrix tests + Storybook 10 stories OR fallback playground entries depending on Phase 0 outcome) | **4-6 h** |
| **2** | Basic React primitives: NumberedReveal, ManifestoRise (viewport-once variant only) | **6-8 h** |
| **3** | State-driven primitives: TickCounter, DecisionPulse, DataScan | **8-12 h** |
| **4** | Interactive primitive: OntologyGraph (with keyboard/focus support) | **6-8 h** |
| **5** | (OPTIONAL) Scroll-tied advanced: add `gsap` dep + ManifestoRise scroll-progress variant. | **6-10 h** |
| **6** | Integration into the **5 locked sections** (§13.1), 3 of which are HIGH-risk | **10-14 h** |
| **7** | Polish: README, Storybook MDX, performance audit (Lighthouse mobile + desktop with cold cache, throttled 4G), a11y audit (axe-core CI integration), PR open | **4-6 h** |

**Revised total estimate:**
- **With Phase 5: 50-74 hours**
- **Without Phase 5: 44-64 hours**
- (Previous 34-46 estimate did not account for `.astro` test lane uncertainty, SSR contract refactor, integration risk, or research checkpoint time.)

**Phase 0 go/no-go gates:**
- **Gate A** (`.astro` test lane): Container API works for our use case? If not, primitives convert to React → Phase 1 plan changes. ~3 hours research.
- **Gate B** (Storybook + Astro): Community framework adequate? If not, fallback to React-only Storybook + `_motion-playground.astro`. ~2 hours research.

**Phase 5 remains optional.** If time pressure, scroll-tied ManifestoRise ships in motion library v2; the `viewport-once` variant is sufficient for the spec's "70% A paradigm" goal.

**Phase 6 is mandatory.** Library without integration is not deliverable per the brainstorm's "wow factor in real sections" success criterion.

## 15. PR Strategy

**Single large PR** (`feat/motion-library` → `main`), estimated ~3000 lines.

Rationale: motion library is not partially-shippable. Reviewing it in pieces forces the reviewer to evaluate each PR without context of the whole; reviewing it as one piece concentrates the cognitive load to a single review session. The trade-off (heavy PR) is mitigated by:
- Comprehensive Storybook (reviewers can see primitives running)
- Comprehensive tests (reviewers can verify behavior)
- Phase commit boundaries (each phase = a few commits) keep `git log` readable
- `pr-review-toolkit` skill cluster used for systematic review

Sub-PRs into the branch may happen during phases for working incrementally, but the final merge to main is one PR.

## 16. Acceptance Criteria

PR is mergeable when **all** of the following hold. Criteria are behavior-driven; mere count thresholds (e.g., "≥4 tests") are explicitly avoided.

### 16.1 Implementation completeness

1. All 8 primitives implemented per Section 9 specifications.
2. The §11.2 behavior matrix is satisfied for every primitive (each cell covered by at least one assertion).
3. Per-primitive Storybook stories per §12.2 (renderer-aware: 3 each for React, 2 each for Astro; total ≥22).
4. Cinematic branch infrastructure migrated per §10.1; discarded artifacts deleted per §10.2; migration manifest in PR description per §10.6.
5. ScrollReveal moved to `motion/` AND refactored for SSR-visible state (§5.3); all 11 section imports updated.
6. The 5 locked integrations per §13.1 ship with the PR; at least 3 are HIGH-risk.

### 16.2 SSR / a11y guarantees

7. SSR HTML readable without JS: for each integrated section, `curl <url> | grep <expected-content>` returns the visible text (verified in CI for HeroSection's H1, About items, Solutions list).
8. `prefers-reduced-motion: reduce` end-state verified per primitive (§7.2 table).
9. A11y behavior matrix (§7.3) verified per primitive via test assertions on `role`/`aria-label`/`tabindex`.
10. `axe-core` automated check (via Storybook addon + Lighthouse CI) reports **zero new violations** vs `main` baseline.

### 16.3 Quality gates

11. `bun run type-check` passes (Astro check + `tsc --noEmit`).
12. `bun test` passes — all behavior matrix cells green.
13. CI on PR is green; specifically:
    - `bun test`
    - `bun run type-check`
    - `bun run build`
    - `bun run story:a11y` (Storybook + axe)
    - `bun run lighthouse:a11y` (Lighthouse CI accessibility-only on locked integration sections)

### 16.4 Performance budget

14. **Lighthouse performance score ≥ 90** on `/` (homepage), measured with:
    - Form factor: mobile
    - Throttling: Slow 4G + 4× CPU slowdown (default Lighthouse mobile preset)
    - Cache: cold (no service worker, no disk cache)
    - Command: `lhci collect --url=http://localhost:4321/ --numberOfRuns=3`, take the median
15. Lighthouse a11y score ≥ 95 on homepage (same conditions).
16. Bundle size delta vs `main` documented in PR description. Hard limit: JS payload increase ≤ **35 KB gzipped** for homepage. If exceeded, justify or split.

### 16.5 Cross-browser SMIL QA (manual)

17. TradeRoute and SketchStroke render and animate correctly on:
    - Chrome stable (latest)
    - Safari stable (latest, macOS)
    - Firefox stable (latest)
    - Mobile Safari (iOS, latest)
    Recorded as a brief manual QA note in PR description.

### 16.6 Git hygiene

18. `archive/cinematic-showcase-2026-04-16` tag exists in `origin`.
19. `feat/decision-engine-section` and `feat/cinematic-showcase` local branches deleted after tag confirmed pushed.
20. Phase 0 go/no-go gate decisions (§14 Gates A & B) recorded in the PR description.

## 17. Open Questions (resolved during Phase 0)

These items are intentionally unresolved at spec-approval time. Each has a Phase 0 owner and a deadline — they MUST be answered before the corresponding implementation phase starts. Decisions are recorded in the PR description.

### Q1 — `.astro` primitive test lane

**Question:** Can we test TradeRoute and SketchStroke with Astro Container API (`experimental_AstroContainer.create()`) in Bun's test runner?

**Why it matters:** Without a usable test lane, we either convert primitives to React (losing the "minimum-JS" property) or ship them untested (unacceptable).

**Decision criteria:**
- ✅ Adopt Container API if it renders our SMIL primitives correctly in jsdom and tests run in <500 ms each.
- ⚠️ Adopt snapshot-only approach if Container API works but is unstable; supplement with manual cross-browser QA.
- ❌ Convert to React `.tsx` if neither works.

**Phase:** Phase 0, before Phase 1 begins. **Estimate:** ~3 hours.

### Q2 — Storybook + Astro framework readiness

**Question:** Is `@storybook-astro/framework@10.x` production-ready for our primitive count and renderer mix?

**Why it matters:** Storybook is our component playground; if the integration is broken, Phase 1+ stories slip.

**Decision criteria:**
- ✅ Use Storybook 10 + `@storybook-astro/framework` if controls, autodocs, and `@storybook/addon-a11y` all work for both React and Astro stories.
- ❌ Fall back to React-only Storybook + `src/pages/_motion-playground.astro` for Astro primitives.

**Phase:** Phase 0, before Phase 1 begins. **Estimate:** ~2 hours.

### Q3 — SMIL browser-support horizon

**Question:** Will Chrome / Safari / Firefox continue to support SVG SMIL through 2027-2028, the expected lifetime of this design?

**Context:** Chromium published "Intent to deprecate SMIL" in 2015. As of 2026-05-13, the [MDN reference for `<animate>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/animate) marks the feature as **"widely available since January 2020"**; no concrete removal timeline has been announced.

**Decision criteria:**
- ✅ Use SMIL for decorative/progressive-enhancement layer only (TradeRoute, SketchStroke). Reduced-motion CSS rules ensure end-state correctness even if SMIL silently fails in some future browser.
- 📌 Track browser support via a calendar reminder per quarter; if Chrome ships a deprecation warning, migrate to CSS `@property` + `transition` equivalents.

**Phase:** Phase 0 cross-browser manual smoke test. **Estimate:** ~1 hour.

### Q4 — Lenis ownership

**Question:** Should Lenis live in `src/lib/` (app-shell) and be injected into motion library, or stay inside motion library?

**Answer (resolved during this spec revision):** App-shell ownership. Importing a single motion primitive must not change page-wide scroll behavior. The motion library's `useScrollProgress` hook receives the Lenis instance via an injected adapter. The app composes Lenis exactly once at the BaseLayout level. (Codified in §5.1 file tree.)

**Phase:** Phase 0, already decided. No further research needed.

### Q5 — IntersectionObserver pooling strategy

**Question:** Use a single observer with one `IntersectionObserverInit` (won't satisfy varied thresholds), pool observers by option tuple, or just create one observer per hook invocation?

**Decision criteria:**
- Pool observers by `${threshold}-${rootMargin}-${root.tagName || 'window'}` key. Most primitives will share defaults (`threshold: 0.2, rootMargin: '0px'`), so the pool stays small (usually 1-2 observers per page).
- The "single global observer" idea from earlier draft is dropped.

**Phase:** Phase 0 design decision; implementation lands in Phase 0 hooks scaffold. No research needed beyond this note.

### Q6 — Tailwind v3.4 vs v4 ramp

**Question:** Does Tailwind v3.4's `motion-reduce:` variant fully satisfy our reduced-motion CSS needs?

**Answer:** Yes for the primitives in this spec. `motion-reduce:animate-none`, `motion-reduce:transition-none`, and arbitrary value variants (`motion-reduce:!stroke-dashoffset-0`) are all in 3.4. Migrating to v4 is independent of this spec.

**Phase:** Resolved. No action.

## 18. Glossary

- **Primitive**: a self-contained motion component with consistent API contract.
- **Trigger**: the event that starts a primitive's animation (viewport entry, scroll progress, hover, etc.).
- **Composite trigger**: a primitive whose different sub-behaviors have different triggers (DataScan, OntologyGraph).
- **End-state**: the visual state a primitive should hold when animation cannot or should not play (reduced-motion).
- **A paradigm / B paradigm**: Monumental (Palantir-like) and Micro-interactions (Stripe-like) motion vocabularies; site mix is 70/30 A/B.

---

**Spec source brainstorm session:** `.superpowers/brainstorm/6184-1778614647/` (mockups preserved for reference).
