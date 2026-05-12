# Motion Library — Design Spec

**Date:** 2026-05-12
**Status:** Approved (brainstorming output)
**Branch target:** `feat/motion-library` (to be created from `main`)
**Parent project:** PlatcoX Web full rewrite (decomposed into 5 sub-projects; this is sub-project #1)
**Related specs:**
- `docs/superpowers/specs/2026-04-05-platcox-web-redesign-design.md` — Palantir-inspired visual direction (umbrella)
- `docs/superpowers/specs/2026-04-16-cinematic-showcase-design.md` — superseded; cinematic showcase decommissioned

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

| Layer | Tool | Status |
|---|---|---|
| Framework | Astro 6 | already present |
| UI islands | React 19 | already present |
| Declarative motion | Framer Motion 12 | already present |
| Scroll-pinned timelines | GSAP 3 + ScrollTrigger | **NEW** (preserved from cinematic branch package.json) |
| Smooth scroll | Lenis 1.2 | **NEW** (preserved from cinematic branch package.json) |
| Native primitives | SVG SMIL, CSS keyframes, IntersectionObserver, requestAnimationFrame | built-in |
| Testing | bun:test, jsdom, @testing-library/react | already present (test setup migrated from cinematic) |
| Component playground | Storybook 9.x | **NEW** |

**Explicitly NOT added (rejected from cinematic branch):**
- `three`
- `@react-three/fiber`
- `@react-three/drei`
- `@types/three`

## 5. Architecture & File Layout

```
src/components/motion/
├── index.ts                       # Barrel export
├── tokens.ts                      # DURATION, EASE, SCROLL_STAGES, REDUCED_MOTION_DURATION
├── types.ts                       # MotionPrimitiveProps, Trigger union
├── hooks/
│   ├── useReducedMotion.ts        # Migrated from cinematic branch
│   ├── useInViewport.ts           # NEW — IntersectionObserver wrapper
│   └── useScrollProgress.ts       # Migrated from cinematic branch
├── lib/
│   ├── lenisSingleton.ts          # Migrated from cinematic branch
│   └── intersectionObserverSingleton.ts  # NEW — one observer, many primitives
├── primitives/
│   ├── TradeRoute.astro           # SVG SMIL, zero-JS
│   ├── SketchStroke.astro         # SVG SMIL, zero-JS
│   ├── OntologyGraph.tsx          # SVG + hover state, React island
│   ├── ManifestoRise.tsx          # Framer Motion + optional useScrollProgress
│   ├── NumberedReveal.tsx         # Framer Motion stagger
│   ├── DecisionPulse.tsx          # CSS @keyframes + Framer presence
│   ├── DataScan.tsx               # Framer + CSS scan-bar (composite trigger)
│   └── TickCounter.tsx            # requestAnimationFrame + Framer trigger
├── ScrollReveal.tsx               # MOVED from src/components/, existing wrapper
├── __tests__/
│   ├── useInViewport.test.ts
│   ├── useReducedMotion.test.tsx  # Migrated
│   ├── useScrollProgress.test.tsx # Migrated
│   ├── TradeRoute.test.tsx
│   ├── SketchStroke.test.tsx
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
└── stories/                       # Storybook 9 stories
    ├── TradeRoute.stories.tsx
    ├── SketchStroke.stories.tsx
    ├── OntologyGraph.stories.tsx
    ├── ManifestoRise.stories.tsx
    ├── NumberedReveal.stories.tsx
    ├── DecisionPulse.stories.tsx
    ├── DataScan.stories.tsx
    └── TickCounter.stories.tsx
```

### 5.1 Internal-heterogeneous, external-homogeneous

Each primitive picks its optimal internal tool (SVG SMIL, Framer, GSAP, CSS keyframes) but exposes a consistent external API. Consumers never need to know the implementation detail.

### 5.2 Astro vs React decision rule

- `.astro` chosen when the primitive is **stateless, hover-less, and SSR-safe** (TradeRoute, SketchStroke).
- `.tsx` chosen when the primitive needs React state, hover/click handlers, scroll-progress hooks, or imperative ref API (the other six).
- React primitives are imported with `client:visible` directive in Astro pages — they hydrate only when scrolled into viewport.

### 5.3 ScrollReveal migration

`src/components/ScrollReveal.tsx` (existing, Framer Motion wrapper, imported by 11 section files) moves to `src/components/motion/ScrollReveal.tsx`. All 11 existing imports must be updated:

- `AboutSection.astro`, `ClientsWhySection.astro`, `ContactSection.astro`, `DecisionEngineSection.astro`, `HeroSection.astro`, `LocationsSection.astro`, `NewsSection.astro`, `PhilosophySection.astro`, `SolutionsSection.astro`, `SustainabilitySection.astro`, `TestimonialsSection.astro`.

No behavior change.

## 6. Motion Tokens

`src/components/motion/tokens.ts`:

```ts
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

export const REDUCED_MOTION_DURATION = {
  any: 0.001, // effectively-instant, but pipeline-safe
} as const;
```

**Rationale:** Five named tokens prevent ad-hoc `duration: 0.5` / `ease: 'easeInOut'` writes that fragment the site's feel. Same DURATION values may optionally be mirrored in `tailwind.config.ts` as transition-duration utilities (deferred decision).

## 7. Reduced-Motion Contract

Three-layered. Inherited and extended from cinematic branch's pattern.

1. **Token layer:** `REDUCED_MOTION_DURATION.any = 0.001` (0.001 not 0, to avoid Framer Motion layout-skip bug).
2. **Hook layer:** `useReducedMotion()` is the single source of truth — `window.matchMedia('(prefers-reduced-motion: reduce)').matches`.
3. **Primitive layer:** Each primitive checks reduced-motion and **jumps to end-state**. "No animation" never means "invisible" — it means "transitions skipped, end-state shown immediately."

### 7.1 Per-primitive end-state behavior under reduced-motion

| Primitive | End-state shown |
|---|---|
| TradeRoute | Path fully drawn (stroke-dashoffset = 0) |
| SketchStroke | Path fully drawn |
| ManifestoRise | Typography at final position, full opacity |
| NumberedReveal | All rows visible simultaneously |
| DecisionPulse | Card visible, no pulse ring |
| DataScan | All rows visible, no scan bar |
| TickCounter | Final number shown directly |
| OntologyGraph | Nodes/edges visible, no breathing |

### 7.2 Test enforcement

Every `*.test.tsx` includes a `prefers-reduced-motion: reduce` scenario with end-state assertion. This contract is verified, not assumed.

## 8. Primitive API Contract

### 8.1 Common props

```ts
interface MotionPrimitiveProps {
  class?: string;          // Tailwind composition (Astro)
  className?: string;      // Tailwind composition (React)
  trigger?: Trigger;       // see section 8.2; default per-primitive
  duration?: number;       // override DURATION.medium default (ms)
  ariaLabel?: string;      // required if non-decorative
}

type Trigger =
  | "viewport-once"      // intersect once, then complete
  | "viewport-repeat"    // re-trigger on each intersect cycle
  | "scroll-progress"    // tied to scroll progress [0,1]
  | "hover"              // pointer enter/leave
  | "always"             // continuous loop (paused when offscreen)
  | "manual";            // imperative ref API
```

### 8.2 Per-primitive trigger support

Each primitive supports only a subset; defaults are per-primitive.

| Primitive | Supported triggers | Default |
|---|---|---|
| TradeRoute | `viewport-once`, `viewport-repeat`, `manual` | `viewport-once` |
| SketchStroke | `viewport-once`, `manual` | `viewport-once` |
| ManifestoRise | `viewport-once`, `scroll-progress` | `viewport-once` |
| NumberedReveal | `viewport-once` | `viewport-once` |
| DecisionPulse | `always` (pulse ring); emphasis effect via ref API + `pulse` prop, not via trigger | `always` |
| DataScan | composite `{ rows: "viewport-once", scan: "always" }` | composite |
| TickCounter | `viewport-once`, `manual` | `viewport-once` |
| OntologyGraph | composite `{ breathing: "always", detail: "hover" }` | composite |

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

Alert/decision card with continuous CSS pulse ring on the indicator dot. The ring animation runs `always` (pauses when scrolled offscreen). When new data arrives, the card briefly scales to emphasize the update; this emphasis is triggered either by:

- **Prop change**: `value` or `trend` prop changing — `useEffect` detects and triggers emphasis.
- **Imperative ref**: parent calls `pulseRef.current?.start()` for manual emphasis (e.g., on websocket message arrival when prop diffing is insufficient).

**Props:** `title`, `value`, `trend?: "up" | "down" | "neutral"`, `pulse?: boolean` (set false to disable ring entirely), `className`. `ref` accepts `MotionRef` interface for imperative emphasis.

**Use cases:** DecisionEngineDemo, real-time data callouts, alert sections.

### 9.7 DataScan (React/composite)

Terminal-style data row list with scanning bar that traverses bottom edge continuously. Rows stagger in once on viewport entry; scan bar loops always.

**Props:** `rows: {label: string, value: string}[]`, `mono?: boolean` (use monospace font, default true), `staggerDelay?: number` (between rows, default 80 ms), trigger (composite), className.

**Use cases:** Sustainability metrics, supply chain summary, "we move data" hero sub-element.

### 9.8 TickCounter (React/RAF + Framer)

Large numeric count-up from 0 to target. Uses `requestAnimationFrame` with cubic ease-out; `font-variant-numeric: tabular-nums` prevents digit width jitter.

**Props:** `target: number`, `format?: "number" | "currency" | "percent"`, `locale?: string`, `suffix?: string`, trigger (`viewport-once` or `manual`), className.

**Use cases:** Hero stat callouts ("240,000 SKUs"), Locations count, KPIs.

## 10. Cinematic Branch Decommissioning

### 10.1 Preserved (migrated to motion library)

| Source path | Destination path |
|---|---|
| `src/lib/lenisSingleton.ts` | `src/components/motion/lib/lenisSingleton.ts` |
| `src/components/cinematic/useReducedMotion.ts` | `src/components/motion/hooks/useReducedMotion.ts` |
| `src/components/cinematic/useScrollProgress.ts` | `src/components/motion/hooks/useScrollProgress.ts` |
| `src/components/__tests__/useReducedMotion.test.tsx` | `src/components/motion/__tests__/useReducedMotion.test.tsx` |
| `src/components/__tests__/useScrollProgress.test.tsx` | `src/components/motion/__tests__/useScrollProgress.test.tsx` |
| `src/lib/__tests__/lenisSingleton.test.ts` | `src/components/motion/__tests__/lenisSingleton.test.ts` |
| `test-setup.ts` (new file) | `test-setup.ts` (project root) |
| `package.json` deps: `gsap`, `lenis` | `package.json` deps |

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

## 11. Testing Strategy

### 11.1 Stack

- `bun:test` test runner (existing)
- `jsdom` DOM environment
- `@testing-library/react` for React primitives
- Custom helpers under `__tests__/helpers/`

### 11.2 Required test cases per primitive

Each primitive's `*.test.tsx` must include at minimum:

1. **Render test:** Component mounts and produces expected DOM structure.
2. **Reduced-motion test:** With `matchMedia` mocked to `prefers-reduced-motion: reduce`, the primitive renders its **end-state**.
3. **Trigger test:** Each supported trigger mode behaves correctly (e.g., `manual` mode does not auto-start; `viewport-once` triggers only once).
4. **A11y test:** `ariaLabel` prop produces correct ARIA attributes; decorative usage (no ariaLabel) produces `role="presentation"`.

### 11.3 Test helpers

```ts
// __tests__/helpers/mockMatchMedia.ts
export function mockMatchMedia(query: string, matches: boolean): void { /* ... */ }

// __tests__/helpers/mockIntersectionObserver.ts
export function mockIntersectionObserver(): { trigger: (isIntersecting: boolean) => void } { /* ... */ }

// __tests__/helpers/flushFramerAnimations.ts
export async function flushFramerAnimations(): Promise<void> { /* ... */ }
```

### 11.4 SMIL primitives (TradeRoute, SketchStroke)

jsdom does not execute SMIL animations. Tests verify the **DOM attribute correctness** (`<animate>` element has correct `begin`, `dur`, `keySplines`), not animation playback. Production correctness is verified via Storybook visual inspection.

### 11.5 Out of scope

- Playwright screenshot diff tests (deferred to motion library v2).
- Cross-browser SMIL animation timing tests.
- Performance benchmarks (FPS, bundle size delta) — checked manually in Phase 7 polish.

## 12. Storybook 9 Setup

### 12.1 Configuration

- Storybook 9.x with Vite builder.
- `.storybook/main.ts` configures React + Astro file handling.
- Story files: `src/components/motion/stories/*.stories.tsx`.
- `bun run story` script alias in `package.json`.

### 12.2 Stories per primitive

At least three stories per primitive:

1. **Default** — most common usage with sensible defaults.
2. **EdgeCase** — extreme prop values (very long duration, custom curve, multiple instances).
3. **InteractiveControl** — manual ref API or trigger variation demo.

Eight primitives × 3 stories = 24 minimum stories.

### 12.3 Documentation

Each `.stories.tsx` includes Storybook autodocs metadata. Component-level MDX docs deferred to Phase 7 polish — not blocking.

## 13. Integration into Existing Sections (Phase 6)

Motion library is not catalog-only. Phase 6 integrates it into the live homepage:

| Section file | Integration |
|---|---|
| `src/components/DecisionEngineDemo.tsx` | Wrap alert cards in `<DecisionPulse>`; replace numeric callouts with `<TickCounter>` |
| `src/components/WorldMap.tsx` | Replace static SVG lines between locations with `<TradeRoute>` |
| `src/components/AboutSection.astro` | Replace static numbered items with `<NumberedReveal>` |
| `src/components/PhilosophySection.astro` | `<NumberedReveal>` for principles |
| `src/components/SolutionsSection.astro` | `<NumberedReveal>` for solutions list |
| `src/components/HeroSection.astro` | Add `<ManifestoRise lines={["Where global trade", "Gets redefined."]}>` over existing video bg |
| `src/components/SustainabilitySection.astro` | `<DataScan rows={...}>` for sustainability metrics OR `<TickCounter>` for big numbers |
| `src/components/LocationsSection.astro` | `<TickCounter>` for location count callout |

A minimum of **five sections** must integrate primitives before PR merge. Listed eight sections are candidates; final integration list confirmed during Phase 6 execution.

## 14. Phasing

| Phase | Scope | Estimate |
|---|---|---|
| **0** | Infrastructure: branch, deps, motion/ skeleton, hooks/lib migrated, tokens/types, Storybook setup, ScrollReveal moved | 4-6 h |
| **1** | Astro/SMIL primitives: TradeRoute, SketchStroke (+ tests + stories) | 3-4 h |
| **2** | Basic React primitives: NumberedReveal, ManifestoRise (viewport-once) | 4-5 h |
| **3** | State-driven primitives: TickCounter, DecisionPulse, DataScan | 6-8 h |
| **4** | Interactive primitive: OntologyGraph | 4-5 h |
| **5** | Scroll-tied advanced: ManifestoRise scroll-progress version (GSAP + Lenis) | 4-6 h |
| **6** | Integration into 5+ existing sections | 6-8 h |
| **7** | Polish: README, Storybook MDX, performance audit, a11y audit, PR open | 3-4 h |

**Total estimate: 34-46 hours** (1-1.5 weeks full-time; 2-3 weeks part-time).

**Phase 5 is optional** — if time pressure, scroll-tied ManifestoRise ships in motion library v2.
**Phase 6 is mandatory** — library without integration is not deliverable.

## 15. PR Strategy

**Single large PR** (`feat/motion-library` → `main`), estimated ~3000 lines.

Rationale: motion library is not partially-shippable. Reviewing it in pieces forces the reviewer to evaluate each PR without context of the whole; reviewing it as one piece concentrates the cognitive load to a single review session. The trade-off (heavy PR) is mitigated by:
- Comprehensive Storybook (reviewers can see primitives running)
- Comprehensive tests (reviewers can verify behavior)
- Phase commit boundaries (each phase = a few commits) keep `git log` readable
- `pr-review-toolkit` skill cluster used for systematic review

Sub-PRs into the branch may happen during phases for working incrementally, but the final merge to main is one PR.

## 16. Acceptance Criteria

PR is mergeable when **all** of the following hold:

1. All 8 primitives implemented per Section 9 specifications.
2. Each primitive has ≥4 tests per Section 11.2.
3. Each primitive has ≥3 Storybook stories per Section 12.2.
4. `prefers-reduced-motion: reduce` end-state contract verified for all 8 primitives via test assertions.
5. Cinematic branch infrastructure migrated per Section 10.1; discarded artifacts deleted per Section 10.2.
6. ScrollReveal moved to motion/ and all 11 existing section imports updated (see Section 5.3).
7. At least 5 homepage sections integrate motion primitives (Phase 6).
8. `bun run type-check` passes (Astro check + tsc --noEmit).
9. `bun test` passes (all tests green).
10. CI on PR is green.
11. Lighthouse performance score ≥ 90 on homepage (no regression vs main).
12. Manual a11y check passes (axe-core report has no new violations vs main).
13. Bundle size delta documented in PR description.
14. `archive/cinematic-showcase-2026-04-16` tag exists in origin.

## 17. Open Questions

None at spec-approval time. Implementation-time questions surface during writing-plans skill execution.

## 18. Glossary

- **Primitive**: a self-contained motion component with consistent API contract.
- **Trigger**: the event that starts a primitive's animation (viewport entry, scroll progress, hover, etc.).
- **Composite trigger**: a primitive whose different sub-behaviors have different triggers (DataScan, OntologyGraph).
- **End-state**: the visual state a primitive should hold when animation cannot or should not play (reduced-motion).
- **A paradigm / B paradigm**: Monumental (Palantir-like) and Micro-interactions (Stripe-like) motion vocabularies; site mix is 70/30 A/B.

---

**Spec source brainstorm session:** `.superpowers/brainstorm/6184-1778614647/` (mockups preserved for reference).
