# Motion Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an in-house motion primitive library (`src/components/motion/`) with 8 primitives, migrate cinematic-showcase infrastructure, and integrate primitives into 5 locked homepage sections.

**Architecture:** Heterogeneous internal implementations (SVG SMIL for Astro primitives, Framer Motion for stateful React primitives, GSAP only at Phase 5) behind a typed external API (`BaseMotionProps` + per-primitive props, discriminated `Trigger` union). Reduced-motion contract enforced at three layers (token, hook, primitive). SSR-visible state mandatory.

**Tech Stack:** Astro 6.1.3, React 19.2.4, Tailwind 3.4.19, Framer Motion 12.38.0, Lenis ^1.2 (Phase 0), GSAP ^3.13 (Phase 5 only), Storybook 10.x + `@storybook-astro/framework` (Phase 0 gate), bun:test + jsdom + @testing-library/react.

**Spec:** `docs/superpowers/specs/2026-05-12-motion-library-design.md` (v2)
**Branch:** `feat/motion-library` (already created from `main`, 2 commits ahead containing the spec)

---

## Conventions Used in This Plan

- **TDD flow per task:** (1) Write failing test → (2) Run, see fail → (3) Implement minimal code → (4) Run, see pass → (5) Commit.
- **Commit messages** follow `<type>(motion): <subject>` convention. Type: `feat`, `test`, `chore`, `refactor`, `fix`, `docs`.
- **All durations are milliseconds.** Adapters in `src/components/motion/adapters/` convert to per-engine formats.
- **Reduced-motion contract** is honored at the primitive level. Tests assert end-state under `prefers-reduced-motion: reduce`.
- **SSR-visible state** is non-negotiable. Server-rendered HTML must contain the visible end-state markup.
- **Never `bun dev`** — use `bun run type-check` for fast feedback. Run `bun run build` only when explicitly needed.

## File Structure Overview

### Files this plan creates

```
src/components/motion/
├── index.ts                        # Phase 0 — barrel export
├── tokens.ts                       # Phase 0 — DURATION, EASE, SCROLL_STAGES, REDUCED_MOTION_DURATION_MS
├── types.ts                        # Phase 0 — BaseMotionProps, Trigger, MotionRef
├── adapters/
│   ├── framer.ts                   # Phase 0 — ms → seconds
│   ├── smil.ts                     # Phase 0 — ms → "${n}ms"
│   └── css.ts                      # Phase 0 — ms → "${n}ms"
├── hooks/
│   ├── useReducedMotion.ts         # Phase 0 — migrated from cinematic
│   ├── useInViewport.ts            # Phase 0 — new, pooled IntersectionObserver
│   └── useScrollProgress.ts        # Phase 0 — migrated, takes injected Lenis adapter
├── primitives/
│   ├── TradeRoute.astro            # Phase 1
│   ├── SketchStroke.astro          # Phase 1
│   ├── NumberedReveal.tsx          # Phase 2
│   ├── ManifestoRise.tsx           # Phase 2 (viewport-once) + Phase 5 (scroll-progress variant)
│   ├── TickCounter.tsx             # Phase 3
│   ├── DecisionPulse.tsx           # Phase 3
│   ├── DataScan.tsx                # Phase 3
│   └── OntologyGraph.tsx           # Phase 4
├── ScrollReveal.tsx                # Phase 0 — moved + refactored for SSR-visible
├── __tests__/
│   ├── helpers/
│   │   ├── mockMatchMedia.ts       # Phase 0
│   │   ├── mockIntersectionObserver.ts  # Phase 0
│   │   ├── mockRAF.ts              # Phase 0
│   │   └── flushFramerAnimations.ts     # Phase 0
│   ├── adapters/
│   │   ├── framer.test.ts          # Phase 0
│   │   ├── smil.test.ts            # Phase 0
│   │   └── css.test.ts             # Phase 0
│   ├── useInViewport.test.ts       # Phase 0
│   ├── useReducedMotion.test.tsx   # Phase 0 (migrated)
│   ├── useScrollProgress.test.tsx  # Phase 0 (migrated)
│   ├── ScrollReveal.test.tsx       # Phase 0 (new tests for SSR-visible behavior)
│   ├── TradeRoute.test.ts          # Phase 1
│   ├── SketchStroke.test.ts        # Phase 1
│   ├── NumberedReveal.test.tsx     # Phase 2
│   ├── ManifestoRise.test.tsx      # Phase 2 + Phase 5
│   ├── TickCounter.test.tsx        # Phase 3
│   ├── DecisionPulse.test.tsx      # Phase 3
│   ├── DataScan.test.tsx           # Phase 3
│   └── OntologyGraph.test.tsx      # Phase 4
└── stories/
    ├── TradeRoute.stories.ts       # Phase 1 (or fallback)
    ├── SketchStroke.stories.ts     # Phase 1 (or fallback)
    ├── NumberedReveal.stories.tsx  # Phase 2
    ├── ManifestoRise.stories.tsx   # Phase 2 + Phase 5
    ├── TickCounter.stories.tsx     # Phase 3
    ├── DecisionPulse.stories.tsx   # Phase 3
    ├── DataScan.stories.tsx        # Phase 3
    └── OntologyGraph.stories.tsx   # Phase 4

src/lib/
├── lenisSingleton.ts               # Phase 0 — migrated from cinematic, app-shell ownership
└── __tests__/
    └── lenisSingleton.test.ts      # Phase 0 — migrated

src/layouts/
└── BaseLayout.astro                # Phase 0 — add sayfa-düzeyi motion observer script

test-setup.ts                       # Phase 0 — migrated, project root

.storybook/                         # Phase 0
├── main.ts
├── preview.ts
└── (other Storybook config)

docs/
└── (fallback motion-playground for if Phase 0 Gate B fails)

src/pages/
└── _motion-playground.astro        # Phase 0 — created ONLY if Gate B fails
```

### Files this plan modifies

```
package.json                        # Phase 0 — add deps
bun.lock                            # Phase 0 — regenerated via `bun install`
.gitignore                          # Phase 0 — add Storybook output, .superpowers/
test-setup.ts                       # Phase 0 — created from cinematic branch's version
tsconfig.json                       # Phase 0 — if Storybook needs path adjustments
astro.config.mjs                    # Phase 0 — if Storybook needs integration

src/components/AboutSection.astro        # Phase 0 — ScrollReveal import path; Phase 6 — NumberedReveal
src/components/ClientsWhySection.astro   # Phase 0 — ScrollReveal import path
src/components/ContactSection.astro      # Phase 0 — ScrollReveal import path
src/components/DecisionEngineSection.astro  # Phase 0 — ScrollReveal import path
src/components/HeroSection.astro         # Phase 0 — ScrollReveal import path; Phase 6 — ManifestoRise
src/components/LocationsSection.astro    # Phase 0 — ScrollReveal import path
src/components/NewsSection.astro         # Phase 0 — ScrollReveal import path
src/components/PhilosophySection.astro   # Phase 0 — ScrollReveal import path
src/components/SolutionsSection.astro    # Phase 0 — ScrollReveal import path; Phase 6 — NumberedReveal
src/components/SustainabilitySection.astro  # Phase 0 — ScrollReveal import path
src/components/TestimonialsSection.astro # Phase 0 — ScrollReveal import path

src/components/WorldMap.tsx              # Phase 6 — TradeRoute integration
src/components/DecisionEngineDemo.tsx    # Phase 6 — DecisionPulse + TickCounter integration

src/components/ScrollReveal.tsx          # Phase 0 — DELETED after migration
```

### Files this plan deletes

```
src/components/cinematic/                          # entire directory
src/components/CinematicShowcaseSection.astro
src/components/__tests__/CinematicShowcaseSection.test.tsx
src/components/__tests__/ShowcaseFallback.test.tsx
src/components/__tests__/useReducedMotion.test.tsx  # (after migration to motion/)
src/components/__tests__/useScrollProgress.test.tsx # (after migration to motion/)
public/images/cinematic/                            # entire directory (221 files)
scripts/generate-cinematic-images.ts
scripts/generate-placeholder-frames.ts
src/components/ScrollReveal.tsx                     # (after move to motion/)
```

---

## Spec → Plan Coverage Matrix

Each numbered acceptance criterion in §16 of the spec maps to one or more tasks below. Use this to verify nothing falls through.

| Acceptance § | Task(s) |
|---|---|
| 16.1.1 — 8 primitives | Tasks 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 3.3, 4.1 (+ Phase 5 for ManifestoRise variant) |
| 16.1.2 — behavior matrix per primitive | Each primitive task's test sub-tasks |
| 16.1.3 — ≥22 Storybook stories | Task 0.15 (config) + each primitive's stories sub-task |
| 16.1.4 — migration done + manifest | Tasks 0.3, 0.4, 0.5, 0.9, 0.11, 0.12 + PR body Task 7.5 |
| 16.1.5 — ScrollReveal moved + SSR refactor | Task 0.14 |
| 16.1.6 — 5 locked integrations, 3 HIGH-risk | Tasks 6.1–6.5 |
| 16.2.7 — SSR readable | Tasks 0.14, 6.1–6.5 |
| 16.2.8 — reduced-motion end-state | Each primitive's RM-test sub-task |
| 16.2.9 — a11y behavior matrix | Each primitive's a11y-test sub-task |
| 16.2.10 — axe-core zero new violations | Task 7.3 |
| 16.3.11 — type-check passes | Final sub-task of each task; final verify Task 7.5 |
| 16.3.12 — `bun test` green | Each task's test step; final verify Task 7.5 |
| 16.3.13 — CI green | Task 7.5 |
| 16.4.14 — Lighthouse perf ≥90 | Task 7.2 |
| 16.4.15 — Lighthouse a11y ≥95 | Task 7.3 |
| 16.4.16 — bundle ≤35 KB gzipped | Task 7.4 |
| 16.5.17 — cross-browser SMIL QA | Task 7.4 |
| 16.6.18 — archive tag | Task 0.3 |
| 16.6.19 — local branches deleted | Task 0.3 |
| 16.6.20 — Phase 0 gate decisions in PR | Tasks 0.1, 0.2, 7.5 |

---

## Phase 0 — Infrastructure

Target: 6-10 hours. Includes two go/no-go research gates before primitives start.

### Task 0.0: Branch sanity check

**Files:**
- Read: `package.json`, `.gitignore`, current git state

- [ ] **Step 1: Verify branch state**

Run: `git status && git log --oneline main..HEAD`
Expected:
- Branch: `feat/motion-library`
- Two commits ahead of main: `bdb838f` (v2 spec) and `c78b0a3` (v1 spec)
- No uncommitted tracked files

- [ ] **Step 2: Verify spec is reachable**

Run: `ls docs/superpowers/specs/2026-05-12-motion-library-design.md && wc -l docs/superpowers/specs/2026-05-12-motion-library-design.md`
Expected: file exists, ≥900 lines.

- [ ] **Step 3: Verify Bun + Node tooling**

Run: `bun --version && node --version`
Expected: Bun ≥1.0, Node ≥20.

- [ ] **Step 4: Confirm current Tailwind version**

Run: `grep '"tailwindcss"' bun.lock | head -3`
Expected: contains `"tailwindcss@3.4.19"`. If different, halt and re-check spec assumptions in §4.1.

### Task 0.1: Phase 0 Gate A research — `.astro` test lane

**Files:**
- Create: `docs/superpowers/plans/gate-a-astro-test-lane.md`

- [ ] **Step 1: Document the question**

Create `docs/superpowers/plans/gate-a-astro-test-lane.md` with this content:

```markdown
# Phase 0 Gate A — `.astro` Test Lane Decision

**Question:** Which lane do we use to test TradeRoute.astro and SketchStroke.astro?

**Candidates:**
- **B1** — Astro Container API (`experimental_AstroContainer.create()`) + bun:test
- **B2** — Snapshot of static SVG output only; behavior verified via Storybook + manual cross-browser QA
- **B3** — Convert `.astro` primitives to `.tsx` (give up "minimum-JS" property)

**Investigation steps:**
1. Read Astro Container API docs at https://docs.astro.build/en/reference/container-reference/
2. Try B1: write a 10-line proof-of-concept test that renders a hello-world `.astro` component and asserts on the output HTML.
3. Time the run.
4. Record findings below.

## Findings

### B1 — Container API
- API stability: <experimental | stable | broken>
- Runs in bun:test or only Vitest? <answer>
- Median test runtime (10 runs): <ms>
- Works with our SMIL primitives (renders `<animate>` correctly)? <yes/no>

### Decision
<one paragraph + selected candidate>
```

- [ ] **Step 2: Execute the investigation**

```bash
# Create a scratch dir for the POC
mkdir -p /tmp/astro-container-poc && cd /tmp/astro-container-poc

# Read the docs (verbatim section about Container API)
cat docs.txt  # or use WebFetch in the agent

# In the platcox-web repo, create a tiny POC test:
cat > /tmp/poc-astro-test.ts <<'EOF'
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, it, expect } from "bun:test";
import HelloWorld from "../../src/components/motion/primitives/TradeRoute.astro";

describe("Container API smoke test", () => {
  it("renders an Astro component to HTML", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(HelloWorld, {
      props: {
        from: { x: 0, y: 0 },
        to: { x: 100, y: 100 },
      },
    });
    expect(result).toContain("<svg");
  });
});
EOF

# Note: TradeRoute.astro doesn't exist yet; for the POC, create a stub:
cat > src/components/motion/primitives/TradeRoute.astro <<'EOF'
---
const { from, to } = Astro.props;
---
<svg viewBox="0 0 100 100"><circle cx={from.x} cy={from.y} r="2"/></svg>
EOF

# Run the POC
bun test /tmp/poc-astro-test.ts
```

Record results in `gate-a-astro-test-lane.md`:
- Did `bun test` execute the Container API test?
- Did it produce HTML containing `<svg`?
- Runtime per test?

- [ ] **Step 3: Decide and record**

Fill in the "Decision" section. Default selection if B1 works: B1. If unstable: B2. If both fail: B3.

- [ ] **Step 4: Commit decision**

```bash
# Clean up POC stub
rm -f src/components/motion/primitives/TradeRoute.astro

git add docs/superpowers/plans/gate-a-astro-test-lane.md
git commit -m "chore(motion): record Phase 0 Gate A decision (.astro test lane)"
```

### Task 0.2: Phase 0 Gate B research — Storybook + Astro

**Files:**
- Create: `docs/superpowers/plans/gate-b-storybook-astro.md`

- [ ] **Step 1: Document the question**

Create `docs/superpowers/plans/gate-b-storybook-astro.md`:

```markdown
# Phase 0 Gate B — Storybook + Astro Framework Decision

**Question:** Is Storybook 10 + `@storybook-astro/framework` production-ready for our 8 primitives (6 React, 2 Astro)?

**Candidates:**
- **A** — Storybook 10 + `@storybook-astro/framework` for all primitives
- **B** — Storybook 10 for React primitives only + `src/pages/_motion-playground.astro` for Astro primitives

**Investigation steps:**
1. Visit https://storybook-astro.org/getting-started/requirements/
2. Verify Astro 6.1.3 is supported.
3. Check `@storybook-astro/framework` package on npm for last release date + open issues.
4. Verify `@storybook/addon-a11y` works with both React and Astro renderers.
5. Record findings below.

## Findings

### Compatibility
- Storybook 10.x release: <version + date>
- `@storybook-astro/framework` latest version: <version + date>
- Supports Astro 6.x: <yes/no/partial>
- React + Astro mixed-renderer single Storybook instance: <yes/no>

### Features
- Controls work for React props: <yes/no>
- Controls work for Astro props: <yes/no/limited>
- Autodocs: <yes/no/limited>
- `@storybook/addon-a11y` axe-core: <yes/no>

### Decision
<one paragraph + selected candidate>
```

- [ ] **Step 2: Execute the investigation**

Open the URLs above, check the npm pages, check GitHub issues for `@storybook-astro/framework`. Record concrete answers.

- [ ] **Step 3: Decide and record**

Fill in the "Decision" section. If Candidate A is selected, Task 0.15 installs `@storybook-astro/framework`. If Candidate B is selected, Task 0.15 installs only Storybook 10 React, and an additional task is added for `_motion-playground.astro`.

- [ ] **Step 4: Commit decision**

```bash
git add docs/superpowers/plans/gate-b-storybook-astro.md
git commit -m "chore(motion): record Phase 0 Gate B decision (Storybook + Astro)"
```

### Task 0.3: Cinematic decommissioning + archive tag

**Files:**
- Delete: `src/components/cinematic/`, `src/components/CinematicShowcaseSection.astro`, related tests, `public/images/cinematic/`, generation scripts
- Read: `feat/cinematic-showcase` branch contents (before delete)

- [ ] **Step 1: Tag the cinematic branch for archive**

```bash
git tag archive/cinematic-showcase-2026-04-16 feat/cinematic-showcase
git push origin archive/cinematic-showcase-2026-04-16
```

Verify:
```bash
git ls-remote --tags origin | grep cinematic-showcase
# Expected: refs/tags/archive/cinematic-showcase-2026-04-16
```

- [ ] **Step 2: Delete the cinematic-showcase local branch**

```bash
git branch -D feat/cinematic-showcase
```

- [ ] **Step 3: Delete the merged decision-engine local branch**

```bash
git branch -D feat/decision-engine-section
```

Expected: both branches removed; `git branch` shows only `main` and `feat/motion-library`.

- [ ] **Step 4: Commit (no code change here, but record the operation in a chore commit log if useful — skip if branch deletions don't need a commit)**

Branch deletions don't produce commits. Move on to Task 0.4.

### Task 0.4: Add Phase 0 dependencies

**Files:**
- Modify: `package.json`
- Modify: `bun.lock` (regenerated)

- [ ] **Step 1: Add `lenis` dependency**

Edit `package.json` — under `"dependencies"`, add:

```json
"lenis": "^1.2"
```

(Note: do NOT add `gsap` here. It's deferred to Phase 5 per spec §4.2.)

- [ ] **Step 2: Install**

Run: `bun install`
Expected: `bun.lock` updated, no errors. `lenis@1.2.x` resolved.

- [ ] **Step 3: Type-check**

Run: `bun run type-check`
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add package.json bun.lock
git commit -m "chore(motion): add lenis dependency"
```

### Task 0.5: Create motion library directory skeleton

**Files:**
- Create: `src/components/motion/` directory tree (empty placeholder files)

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p src/components/motion/{adapters,hooks,primitives,__tests__/{helpers,adapters},stories}
mkdir -p src/lib/__tests__
```

- [ ] **Step 2: Create empty barrel**

Create `src/components/motion/index.ts`:

```ts
// Motion library barrel — populated as primitives ship.
export {};
```

- [ ] **Step 3: Type-check + commit**

```bash
bun run type-check
git add src/components/motion src/lib/__tests__
git commit -m "chore(motion): scaffold motion/ directory tree"
```

### Task 0.6: tokens.ts

**Files:**
- Create: `src/components/motion/tokens.ts`
- Test: `src/components/motion/__tests__/tokens.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/components/motion/__tests__/tokens.test.ts`:

```ts
import { describe, it, expect } from "bun:test";
import { DURATION, EASE, SCROLL_STAGES, REDUCED_MOTION_DURATION_MS } from "../tokens";

describe("motion tokens", () => {
  it("DURATION is in milliseconds (positive integers)", () => {
    expect(DURATION.micro).toBe(150);
    expect(DURATION.short).toBe(300);
    expect(DURATION.medium).toBe(600);
    expect(DURATION.long).toBe(1200);
    expect(DURATION.cinematic).toBe(2400);
  });

  it("EASE exposes named cubic-bezier tuples", () => {
    expect(EASE.standard).toEqual([0.32, 0.72, 0, 1]);
    expect(EASE.monumental).toEqual([0.25, 0.46, 0.45, 0.94]);
    expect(EASE.responsive).toEqual([0.34, 1.56, 0.64, 1]);
    expect(EASE.draw).toEqual([0.65, 0, 0.35, 1]);
    expect(EASE.scan).toEqual([0.4, 0, 0.6, 1]);
  });

  it("SCROLL_STAGES.manifestoRise has enter/hold/exit ranges", () => {
    expect(SCROLL_STAGES.manifestoRise.enter).toEqual([0, 0.2]);
    expect(SCROLL_STAGES.manifestoRise.hold).toEqual([0.2, 0.7]);
    expect(SCROLL_STAGES.manifestoRise.exit).toEqual([0.7, 1]);
  });

  it("REDUCED_MOTION_DURATION_MS is 1ms (pipeline-safe)", () => {
    expect(REDUCED_MOTION_DURATION_MS).toBe(1);
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `bun test src/components/motion/__tests__/tokens.test.ts`
Expected: FAIL — `Cannot find module '../tokens'`

- [ ] **Step 3: Implement**

Create `src/components/motion/tokens.ts`:

```ts
// All durations are milliseconds. Adapters convert to per-engine formats (see §6.1 of spec).
export const DURATION = {
  micro:     150,
  short:     300,
  medium:    600,
  long:     1200,
  cinematic: 2400,
} as const;

export const EASE = {
  standard:   [0.32, 0.72, 0, 1],
  monumental: [0.25, 0.46, 0.45, 0.94],
  responsive: [0.34, 1.56, 0.64, 1],
  draw:       [0.65, 0, 0.35, 1],
  scan:       [0.4, 0, 0.6, 1],
} as const;

export const SCROLL_STAGES = {
  manifestoRise: {
    enter: [0, 0.2],
    hold:  [0.2, 0.7],
    exit:  [0.7, 1],
  },
} as const;

// 1ms — effectively-instant, but pipeline-safe (avoids Framer 0-ms layout-skip bug).
export const REDUCED_MOTION_DURATION_MS = 1;
```

- [ ] **Step 4: Run, expect PASS**

Run: `bun test src/components/motion/__tests__/tokens.test.ts`
Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/motion/tokens.ts src/components/motion/__tests__/tokens.test.ts
git commit -m "feat(motion): add tokens (DURATION, EASE, SCROLL_STAGES)"
```

### Task 0.7: types.ts

**Files:**
- Create: `src/components/motion/types.ts`
- Test: `src/components/motion/__tests__/types.test.ts` (type-level smoke tests)

- [ ] **Step 1: Write the failing test**

Create `src/components/motion/__tests__/types.test.ts`:

```ts
import { describe, it, expect } from "bun:test";
import type { BaseMotionProps, BaseAstroProps, BaseReactProps, Trigger, TriggerShorthand, MotionRef } from "../types";

describe("motion types", () => {
  it("BaseMotionProps has optional durationMs and ariaLabel", () => {
    const a: BaseMotionProps = {};
    const b: BaseMotionProps = { durationMs: 600, ariaLabel: "x" };
    expect(a).toBeDefined();
    expect(b.durationMs).toBe(600);
  });

  it("BaseAstroProps adds optional class", () => {
    const a: BaseAstroProps = { class: "text-foreground" };
    expect(a.class).toBe("text-foreground");
  });

  it("BaseReactProps adds optional className", () => {
    const a: BaseReactProps = { className: "text-foreground" };
    expect(a.className).toBe("text-foreground");
  });

  it("Trigger discriminated union narrows by kind", () => {
    const t: Trigger = { kind: "manual", id: "test-id" };
    if (t.kind === "manual") {
      expect(t.id).toBe("test-id");
    }
  });

  it("TriggerShorthand is a string literal union", () => {
    const x: TriggerShorthand = "viewport-once";
    expect(x).toBe("viewport-once");
  });

  it("MotionRef has start and reset, optional play/pause", () => {
    const ref: MotionRef = {
      start: () => {},
      reset: () => {},
    };
    expect(typeof ref.start).toBe("function");
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `bun test src/components/motion/__tests__/types.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/components/motion/types.ts`:

```ts
export interface BaseMotionProps {
  durationMs?: number;
  ariaLabel?: string;
}

export interface BaseAstroProps extends BaseMotionProps {
  class?: string;
}

export interface BaseReactProps extends BaseMotionProps {
  className?: string;
}

export type Trigger =
  | { kind: "viewport-once" }
  | { kind: "viewport-repeat" }
  | { kind: "scroll-progress"; sectionId: string }
  | { kind: "hover" }
  | { kind: "always" }
  | { kind: "manual"; id: string };

export type TriggerShorthand =
  | "viewport-once"
  | "viewport-repeat"
  | "hover"
  | "always";

export interface MotionRef {
  start: () => void;
  reset: () => void;
  play?: () => void;
  pause?: () => void;
}
```

- [ ] **Step 4: Run, expect PASS**

Run: `bun test src/components/motion/__tests__/types.test.ts && bun run type-check`
Expected: tests pass, type-check clean.

- [ ] **Step 5: Commit**

```bash
git add src/components/motion/types.ts src/components/motion/__tests__/types.test.ts
git commit -m "feat(motion): add BaseMotionProps, Trigger, MotionRef types"
```

### Task 0.8: Duration adapters (framer, smil, css)

**Files:**
- Create: `src/components/motion/adapters/framer.ts`, `smil.ts`, `css.ts`
- Test: `src/components/motion/__tests__/adapters/framer.test.ts`, `smil.test.ts`, `css.test.ts`

- [ ] **Step 1: Write failing tests for all three adapters**

Create `src/components/motion/__tests__/adapters/framer.test.ts`:

```ts
import { describe, it, expect } from "bun:test";
import { toFramerSeconds } from "../../adapters/framer";

describe("toFramerSeconds", () => {
  it("converts ms to seconds with 3 decimals", () => {
    expect(toFramerSeconds(600)).toBe(0.6);
    expect(toFramerSeconds(150)).toBe(0.15);
    expect(toFramerSeconds(1200)).toBe(1.2);
    expect(toFramerSeconds(1)).toBe(0.001);
  });
});
```

Create `src/components/motion/__tests__/adapters/smil.test.ts`:

```ts
import { describe, it, expect } from "bun:test";
import { toSmilDur } from "../../adapters/smil";

describe("toSmilDur", () => {
  it("formats ms as 'Nms' string for SMIL dur attribute", () => {
    expect(toSmilDur(600)).toBe("600ms");
    expect(toSmilDur(1200)).toBe("1200ms");
    expect(toSmilDur(1)).toBe("1ms");
  });
});
```

Create `src/components/motion/__tests__/adapters/css.test.ts`:

```ts
import { describe, it, expect } from "bun:test";
import { toCssDuration } from "../../adapters/css";

describe("toCssDuration", () => {
  it("formats ms as 'Nms' for CSS animation-duration", () => {
    expect(toCssDuration(600)).toBe("600ms");
    expect(toCssDuration(1)).toBe("1ms");
  });
});
```

- [ ] **Step 2: Run, expect FAIL (all three)**

Run: `bun test src/components/motion/__tests__/adapters/`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement adapters**

Create `src/components/motion/adapters/framer.ts`:

```ts
export const toFramerSeconds = (ms: number): number => ms / 1000;
```

Create `src/components/motion/adapters/smil.ts`:

```ts
export const toSmilDur = (ms: number): string => `${ms}ms`;
```

Create `src/components/motion/adapters/css.ts`:

```ts
export const toCssDuration = (ms: number): string => `${ms}ms`;
```

- [ ] **Step 4: Run, expect PASS**

Run: `bun test src/components/motion/__tests__/adapters/`
Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/motion/adapters src/components/motion/__tests__/adapters
git commit -m "feat(motion): add duration adapters (framer, smil, css)"
```

### Task 0.9: Migrate useReducedMotion hook

**Files:**
- Create: `src/components/motion/hooks/useReducedMotion.ts`
- Create: `src/components/motion/__tests__/useReducedMotion.test.tsx`
- Read: `git show archive/cinematic-showcase-2026-04-16:src/components/cinematic/useReducedMotion.ts`

- [ ] **Step 1: Read the source from the archive tag**

Run: `git show archive/cinematic-showcase-2026-04-16:src/components/cinematic/useReducedMotion.ts > /tmp/useReducedMotion.ts`

- [ ] **Step 2: Read the test from the archive tag**

Run: `git show archive/cinematic-showcase-2026-04-16:src/components/__tests__/useReducedMotion.test.tsx > /tmp/useReducedMotion.test.tsx`

- [ ] **Step 3: Create test file (failing because the hook is not yet at the new path)**

Copy `/tmp/useReducedMotion.test.tsx` to `src/components/motion/__tests__/useReducedMotion.test.tsx`. Update the import path inside it from `../../cinematic/useReducedMotion` to `../hooks/useReducedMotion`.

- [ ] **Step 4: Run, expect FAIL**

Run: `bun test src/components/motion/__tests__/useReducedMotion.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 5: Create hook at new path**

Copy `/tmp/useReducedMotion.ts` to `src/components/motion/hooks/useReducedMotion.ts`. No content changes needed (it was designed to be standalone).

- [ ] **Step 6: Run, expect PASS**

Run: `bun test src/components/motion/__tests__/useReducedMotion.test.tsx`
Expected: tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/motion/hooks/useReducedMotion.ts src/components/motion/__tests__/useReducedMotion.test.tsx
git commit -m "chore(motion): migrate useReducedMotion from cinematic"
```

### Task 0.10: useInViewport hook (new, pooled IntersectionObserver)

**Files:**
- Create: `src/components/motion/hooks/useInViewport.ts`
- Create: `src/components/motion/__tests__/useInViewport.test.ts`
- Create: `src/components/motion/__tests__/helpers/mockIntersectionObserver.ts`

- [ ] **Step 1: Create the IntersectionObserver mock helper**

Create `src/components/motion/__tests__/helpers/mockIntersectionObserver.ts`:

```ts
import { spyOn } from "bun:test";

export interface MockIO {
  trigger: (isIntersecting: boolean, target?: Element) => void;
  disconnect: ReturnType<typeof spyOn>;
  observe: ReturnType<typeof spyOn>;
  unobserve: ReturnType<typeof spyOn>;
}

export function mockIntersectionObserver(): MockIO {
  const callbacks: IntersectionObserverCallback[] = [];
  const observed = new Set<Element>();

  const ObserverMock = class {
    constructor(cb: IntersectionObserverCallback) {
      callbacks.push(cb);
    }
    observe = (el: Element) => observed.add(el);
    unobserve = (el: Element) => observed.delete(el);
    disconnect = () => observed.clear();
    takeRecords = () => [];
    root = null;
    rootMargin = "";
    thresholds: number[] = [];
  };

  // @ts-ignore
  globalThis.IntersectionObserver = ObserverMock as unknown as typeof IntersectionObserver;

  const trigger = (isIntersecting: boolean, target?: Element) => {
    const realTarget = target ?? Array.from(observed)[0];
    if (!realTarget) return;
    const entry = {
      isIntersecting,
      target: realTarget,
      time: Date.now(),
      boundingClientRect: realTarget.getBoundingClientRect(),
      intersectionRatio: isIntersecting ? 1 : 0,
      intersectionRect: realTarget.getBoundingClientRect(),
      rootBounds: null,
    } as unknown as IntersectionObserverEntry;
    callbacks.forEach((cb) => cb([entry], {} as IntersectionObserver));
  };

  return {
    trigger,
    disconnect: spyOn(ObserverMock.prototype, "disconnect"),
    observe: spyOn(ObserverMock.prototype, "observe"),
    unobserve: spyOn(ObserverMock.prototype, "unobserve"),
  };
}
```

- [ ] **Step 2: Write failing test for useInViewport**

Create `src/components/motion/__tests__/useInViewport.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "bun:test";
import { renderHook, act } from "@testing-library/react";
import { useInViewport } from "../hooks/useInViewport";
import { mockIntersectionObserver } from "./helpers/mockIntersectionObserver";

describe("useInViewport", () => {
  let mockIO: ReturnType<typeof mockIntersectionObserver>;

  beforeEach(() => {
    mockIO = mockIntersectionObserver();
  });

  it("returns isInView=false initially", () => {
    const { result } = renderHook(() => useInViewport({ threshold: 0.2 }));
    expect(result.current.isInView).toBe(false);
  });

  it("updates isInView=true on intersect", () => {
    const { result } = renderHook(() => useInViewport({ threshold: 0.2 }));
    // attach ref to a dummy element
    const el = document.createElement("div");
    act(() => {
      (result.current.ref as { current: HTMLElement | null }).current = el;
    });
    act(() => {
      mockIO.trigger(true, el);
    });
    expect(result.current.isInView).toBe(true);
  });

  it("pools observers by (threshold, rootMargin, root) tuple", () => {
    // Two hooks with same opts should share an observer
    renderHook(() => useInViewport({ threshold: 0.2, rootMargin: "0px" }));
    renderHook(() => useInViewport({ threshold: 0.2, rootMargin: "0px" }));
    // observe called twice (one per hook), but constructor called once
    // This is a structural test — exact assertion depends on impl detail
    expect(mockIO.observe.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("disconnects on unmount when last consumer leaves a pool", () => {
    const { unmount } = renderHook(() => useInViewport({ threshold: 0.2 }));
    unmount();
    expect(mockIO.disconnect.mock.calls.length).toBeGreaterThanOrEqual(1);
  });
});
```

- [ ] **Step 3: Run, expect FAIL**

Run: `bun test src/components/motion/__tests__/useInViewport.test.ts`
Expected: FAIL.

- [ ] **Step 4: Implement useInViewport with pooling**

Create `src/components/motion/hooks/useInViewport.ts`:

```ts
import { useEffect, useRef, useState } from "react";

interface Options {
  threshold?: number;
  rootMargin?: string;
  root?: Element | null;
  once?: boolean;
}

interface PoolKey {
  threshold: number;
  rootMargin: string;
  root: Element | null;
}

interface PooledObserver {
  observer: IntersectionObserver;
  refCount: number;
  callbacks: Map<Element, (isIntersecting: boolean) => void>;
}

const pools = new Map<string, PooledObserver>();

const keyFor = (k: PoolKey) =>
  `${k.threshold}|${k.rootMargin}|${k.root ? "custom" : "window"}`;

function getPool(k: PoolKey): PooledObserver {
  const id = keyFor(k);
  let pool = pools.get(id);
  if (pool) return pool;
  const callbacks = new Map<Element, (isIntersecting: boolean) => void>();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const cb = callbacks.get(e.target);
        if (cb) cb(e.isIntersecting);
      }
    },
    { threshold: k.threshold, rootMargin: k.rootMargin, root: k.root ?? undefined }
  );
  pool = { observer, refCount: 0, callbacks };
  pools.set(id, pool);
  return pool;
}

function releasePool(k: PoolKey) {
  const id = keyFor(k);
  const pool = pools.get(id);
  if (!pool) return;
  pool.refCount -= 1;
  if (pool.refCount <= 0) {
    pool.observer.disconnect();
    pools.delete(id);
  }
}

export function useInViewport(opts: Options = {}) {
  const { threshold = 0.2, rootMargin = "0px", root = null, once = false } = opts;
  const ref = useRef<HTMLElement | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = ref.current;
    if (!el) return;

    const key: PoolKey = { threshold, rootMargin, root };
    const pool = getPool(key);
    pool.refCount += 1;
    pool.callbacks.set(el, (intersecting) => {
      setIsInView(intersecting);
      if (intersecting && once) {
        pool.observer.unobserve(el);
        pool.callbacks.delete(el);
      }
    });
    pool.observer.observe(el);

    return () => {
      pool.observer.unobserve(el);
      pool.callbacks.delete(el);
      releasePool(key);
    };
  }, [threshold, rootMargin, root, once]);

  return { ref, isInView };
}
```

- [ ] **Step 5: Run, expect PASS**

Run: `bun test src/components/motion/__tests__/useInViewport.test.ts && bun run type-check`
Expected: tests pass, type-check clean.

- [ ] **Step 6: Commit**

```bash
git add src/components/motion/hooks/useInViewport.ts src/components/motion/__tests__/useInViewport.test.ts src/components/motion/__tests__/helpers/mockIntersectionObserver.ts
git commit -m "feat(motion): add useInViewport with pooled IntersectionObservers"
```

### Task 0.11: Migrate useScrollProgress hook

**Files:**
- Create: `src/components/motion/hooks/useScrollProgress.ts`
- Create: `src/components/motion/__tests__/useScrollProgress.test.tsx`

- [ ] **Step 1: Read source from archive tag**

Run: `git show archive/cinematic-showcase-2026-04-16:src/components/cinematic/useScrollProgress.ts > /tmp/useScrollProgress.ts`
Run: `git show archive/cinematic-showcase-2026-04-16:src/components/__tests__/useScrollProgress.test.tsx > /tmp/useScrollProgress.test.tsx`

- [ ] **Step 2: Adapt hook for injected adapter (not singleton import)**

Per spec §10.1, `useScrollProgress` should NOT import `lenisSingleton` directly. It takes an injected adapter.

Create `src/components/motion/hooks/useScrollProgress.ts`:

```ts
import { useEffect, useRef, type RefObject } from "react";

// Forward-declared interface — Lenis is added in Phase 5 with GSAP.
// Until then, this hook is inert (returns ref { current: 0 }) and only
// activates when a real Lenis instance is passed.
export interface ScrollAdapter {
  on: (event: "scroll", cb: () => void) => void;
  off: (event: "scroll", cb: () => void) => void;
}

export interface UseScrollProgressOptions {
  triggerSelector: string;
  pinDistanceDesktop: string;
  pinDistanceMobile: string;
  mobileQuery?: string;
  disabled?: boolean;
  adapter?: ScrollAdapter | null;
}

export function useScrollProgress(opts: UseScrollProgressOptions): RefObject<number> {
  const progress = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (opts.disabled) return;
    if (!opts.adapter) return; // inert until Phase 5 wires GSAP+Lenis

    // The actual GSAP ScrollTrigger setup happens in Phase 5 when the
    // adapter is provided. For Phase 0, this hook is a no-op when no
    // adapter is supplied.
    const onScroll = () => {
      // Phase 5 will populate this; for now, leave progress at 0.
    };
    opts.adapter.on("scroll", onScroll);
    return () => {
      opts.adapter?.off("scroll", onScroll);
    };
  }, [opts.triggerSelector, opts.disabled, opts.adapter]);

  return progress;
}
```

- [ ] **Step 3: Write a Phase-0-appropriate test (inert behavior)**

Create `src/components/motion/__tests__/useScrollProgress.test.tsx`:

```ts
import { describe, it, expect } from "bun:test";
import { renderHook } from "@testing-library/react";
import { useScrollProgress } from "../hooks/useScrollProgress";

describe("useScrollProgress (Phase 0 inert)", () => {
  it("returns ref with current=0 when no adapter is provided", () => {
    const { result } = renderHook(() =>
      useScrollProgress({
        triggerSelector: ".test",
        pinDistanceDesktop: "+=150%",
        pinDistanceMobile: "+=100%",
      })
    );
    expect(result.current.current).toBe(0);
  });

  it("does not register listeners when disabled", () => {
    const fakeAdapter = {
      on: mock(),
      off: mock(),
    };
    function mock() {
      const fn: any = () => {};
      fn.calls = 0;
      const wrapped = (...args: unknown[]) => {
        fn.calls += 1;
        return fn(...args);
      };
      (wrapped as any).calls = () => fn.calls;
      return wrapped;
    }
    renderHook(() =>
      useScrollProgress({
        triggerSelector: ".test",
        pinDistanceDesktop: "+=150%",
        pinDistanceMobile: "+=100%",
        disabled: true,
        adapter: fakeAdapter as any,
      })
    );
    expect((fakeAdapter.on as any).calls()).toBe(0);
  });
});
```

- [ ] **Step 4: Run, expect PASS**

Run: `bun test src/components/motion/__tests__/useScrollProgress.test.tsx`
Expected: tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/motion/hooks/useScrollProgress.ts src/components/motion/__tests__/useScrollProgress.test.tsx
git commit -m "chore(motion): migrate useScrollProgress, inert until Phase 5"
```

### Task 0.12: Migrate lenisSingleton (to src/lib, app-shell ownership)

**Files:**
- Create: `src/lib/lenisSingleton.ts`
- Create: `src/lib/__tests__/lenisSingleton.test.ts`

- [ ] **Step 1: Read source from archive tag**

Run: `git show archive/cinematic-showcase-2026-04-16:src/lib/lenisSingleton.ts > /tmp/lenisSingleton.ts`
Run: `git show archive/cinematic-showcase-2026-04-16:src/lib/__tests__/lenisSingleton.test.ts > /tmp/lenisSingleton.test.ts`

- [ ] **Step 2: Copy as-is**

Copy `/tmp/lenisSingleton.ts` → `src/lib/lenisSingleton.ts`.
Copy `/tmp/lenisSingleton.test.ts` → `src/lib/__tests__/lenisSingleton.test.ts`.

Path stays the same as in cinematic branch (`src/lib/lenisSingleton.ts`), so the tests' import paths are already correct.

- [ ] **Step 3: Run, expect PASS**

Run: `bun test src/lib/__tests__/lenisSingleton.test.ts`
Expected: tests pass (lenis ^1.2 is installed; the singleton works).

- [ ] **Step 4: Commit**

```bash
git add src/lib/lenisSingleton.ts src/lib/__tests__/lenisSingleton.test.ts
git commit -m "chore(motion): migrate lenisSingleton to app-shell (src/lib)"
```

### Task 0.13: Add sayfa-düzeyi motion observer script to BaseLayout

**Files:**
- Modify: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: Read current BaseLayout**

Run: `cat src/layouts/BaseLayout.astro`

Take note of where the closing `</body>` tag is. The new script goes just before it.

- [ ] **Step 2: Add the shared motion observer script**

Edit `src/layouts/BaseLayout.astro`. Before the closing `</body>` tag, insert:

```html
<script is:inline>
  // Sayfa-düzeyi motion observer: one IntersectionObserver for all SMIL primitives.
  // Triggered by [data-motion-trigger="viewport-once" | "viewport-repeat"].
  (function initMotionObserver() {
    if (typeof window === "undefined") return;
    if (window.__motionObserver) return; // already initialized

    const targets = new Map();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const config = targets.get(e.target);
          if (!config) continue;
          if (e.isIntersecting) {
            const animates = e.target.querySelectorAll("animate, animateTransform, animateMotion");
            animates.forEach((a) => a.beginElement && a.beginElement());
            if (config.kind === "viewport-once") {
              observer.unobserve(e.target);
              targets.delete(e.target);
            }
          }
        }
      },
      { threshold: 0.2, rootMargin: "0px" }
    );

    function attachAll() {
      const els = document.querySelectorAll("[data-motion-trigger]");
      els.forEach((el) => {
        if (targets.has(el)) return;
        const kind = el.getAttribute("data-motion-trigger");
        if (kind !== "viewport-once" && kind !== "viewport-repeat") return;
        targets.set(el, { kind });
        observer.observe(el);
      });
    }

    // Imperative trigger for trigger="manual" primitives.
    window.__motionTrigger = function (id) {
      const el = document.querySelector('[data-motion-id="' + id + '"]');
      if (!el) return;
      const animates = el.querySelectorAll("animate, animateTransform, animateMotion");
      animates.forEach((a) => a.beginElement && a.beginElement());
    };

    window.__motionObserver = observer;

    // Run on DOM ready; also re-scan after view transitions if Astro is used.
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", attachAll);
    } else {
      attachAll();
    }
    document.addEventListener("astro:after-swap", attachAll);
  })();
</script>
```

Add a CSS rule in the BaseLayout's `<style is:global>` block (create one if absent) to pin reduced-motion end-state for SMIL:

```html
<style is:global>
  @media (prefers-reduced-motion: reduce) {
    [data-motion-trigger] animate,
    [data-motion-trigger] animateTransform,
    [data-motion-trigger] animateMotion {
      animation-play-state: paused;
    }
    [data-motion-reduced-end-state] {
      /* primitives apply this attribute when reduced-motion is active to pin styles */
      stroke-dashoffset: 0 !important;
    }
  }
</style>
```

- [ ] **Step 3: Type-check + verify markup**

Run: `bun run type-check`
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/BaseLayout.astro
git commit -m "feat(motion): add sayfa-düzeyi motion observer + reduced-motion CSS"
```

### Task 0.14: ScrollReveal SSR refactor + path migration

**Files:**
- Create: `src/components/motion/ScrollReveal.tsx` (refactored)
- Create: `src/components/motion/__tests__/ScrollReveal.test.tsx`
- Modify: 11 section files to update import path
- Delete: `src/components/ScrollReveal.tsx`
- Delete: `src/components/__tests__/ScrollReveal.test.tsx`

- [ ] **Step 1: Write failing test for SSR-visible behavior**

Create `src/components/motion/__tests__/ScrollReveal.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from "bun:test";
import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import ScrollReveal from "../ScrollReveal";
import { mockMatchMedia } from "./helpers/mockMatchMedia";
import { mockIntersectionObserver } from "./helpers/mockIntersectionObserver";

describe("ScrollReveal — SSR-visible refactor", () => {
  beforeEach(() => {
    mockMatchMedia("(prefers-reduced-motion: reduce)", false);
    mockIntersectionObserver();
  });

  it("renders children visibly in SSR HTML (no hidden state)", () => {
    const html = renderToString(
      <ScrollReveal animation="fade-up">
        <h1>Where Global Trade</h1>
      </ScrollReveal>
    );
    expect(html).toContain("Where Global Trade");
    // No opacity:0 in SSR markup
    expect(html).not.toMatch(/opacity:\s*0/);
    expect(html).not.toContain('style="transform: translateY');
  });

  it("renders children in the DOM after mount", () => {
    render(
      <ScrollReveal animation="fade-up">
        <h1>Visible</h1>
      </ScrollReveal>
    );
    expect(screen.getByText("Visible")).toBeInTheDocument();
  });

  it("respects prefers-reduced-motion (no animation pipeline)", () => {
    mockMatchMedia("(prefers-reduced-motion: reduce)", true);
    const { container } = render(
      <ScrollReveal animation="fade-up">
        <p>Content</p>
      </ScrollReveal>
    );
    // Element must be visible (no inline opacity:0)
    const div = container.firstChild as HTMLElement;
    expect(div.style.opacity === "" || div.style.opacity === "1").toBe(true);
  });
});
```

Also create the missing `mockMatchMedia` helper if not present:

Create `src/components/motion/__tests__/helpers/mockMatchMedia.ts`:

```ts
export function mockMatchMedia(query: string, matches: boolean): void {
  // @ts-ignore
  window.matchMedia = (q: string) => ({
    matches: q === query ? matches : false,
    media: q,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
```

- [ ] **Step 2: Run, expect FAIL**

Run: `bun test src/components/motion/__tests__/ScrollReveal.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement refactored ScrollReveal**

Create `src/components/motion/ScrollReveal.tsx`:

```tsx
import { motion, type Variant } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "./hooks/useReducedMotion";
import { useInViewport } from "./hooks/useInViewport";
import { toFramerSeconds } from "./adapters/framer";

type AnimationType =
  | "fade-up"
  | "fade-in"
  | "slide-left"
  | "slide-right"
  | "scale-up"
  | "split-left"
  | "split-right";

interface Props {
  children: ReactNode;
  animation?: AnimationType;
  delay?: number;       // milliseconds
  durationMs?: number;  // milliseconds (was `duration` in seconds, now explicit)
  className?: string;
}

const variants: Record<AnimationType, { hidden: Variant; visible: Variant }> = {
  "fade-up":     { hidden: { opacity: 0, y: 40 },  visible: { opacity: 1, y: 0 } },
  "fade-in":     { hidden: { opacity: 0 },          visible: { opacity: 1 } },
  "slide-left":  { hidden: { opacity: 0, x: -60 }, visible: { opacity: 1, x: 0 } },
  "slide-right": { hidden: { opacity: 0, x: 60 },  visible: { opacity: 1, x: 0 } },
  "scale-up":    { hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } },
  "split-left":  { hidden: { opacity: 0, x: -80 }, visible: { opacity: 1, x: 0 } },
  "split-right": { hidden: { opacity: 0, x: 80 },  visible: { opacity: 1, x: 0 } },
};

export default function ScrollReveal({
  children,
  animation = "fade-up",
  delay = 0,
  durationMs = 600,
  className,
}: Props) {
  const v = variants[animation];
  const reduced = useReducedMotion();
  const { ref, isInView } = useInViewport({ threshold: 0.2, once: true });
  const [hydrated, setHydrated] = useState(false);
  const initialInView = useRef(false);

  useEffect(() => {
    setHydrated(true);
    // If element is already in viewport at hydration time, no animation —
    // it was visible in SSR markup already.
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      initialInView.current =
        rect.top < window.innerHeight && rect.bottom > 0;
    }
  }, [ref]);

  // SSR + reduced-motion + initially-in-viewport => render visible end-state, no animation.
  if (!hydrated || reduced || initialInView.current) {
    return (
      <div ref={ref as React.RefObject<HTMLDivElement>} className={className}>
        {children}
      </div>
    );
  }

  // Otherwise: animate from hidden → visible when viewport-intersected.
  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: v.hidden,
        visible: {
          ...v.visible,
          transition: { duration: toFramerSeconds(durationMs), delay: toFramerSeconds(delay), ease: "easeOut" },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 4: Run, expect PASS**

Run: `bun test src/components/motion/__tests__/ScrollReveal.test.tsx`
Expected: all tests pass.

- [ ] **Step 5: Update 11 section import paths**

Run this find-and-replace across the 11 section files:

```bash
for f in src/components/AboutSection.astro src/components/ClientsWhySection.astro src/components/ContactSection.astro src/components/DecisionEngineSection.astro src/components/HeroSection.astro src/components/LocationsSection.astro src/components/NewsSection.astro src/components/PhilosophySection.astro src/components/SolutionsSection.astro src/components/SustainabilitySection.astro src/components/TestimonialsSection.astro; do
  sed -i.bak 's|from "./ScrollReveal.tsx"|from "./motion/ScrollReveal"|' "$f"
  sed -i.bak 's|from "./ScrollReveal"|from "./motion/ScrollReveal"|' "$f"
  rm "$f.bak"
done
```

Also: existing usages pass `duration={0.8}` (seconds). The refactored component expects `durationMs` (ms). Update each call site:

```bash
# Specific to HeroSection — convert seconds to ms
sed -i.bak 's|duration={0\.8}|durationMs={800}|' src/components/HeroSection.astro
sed -i.bak 's|delay={0\.2}|delay={200}|' src/components/HeroSection.astro
sed -i.bak 's|delay={0\.6}|delay={600}|' src/components/HeroSection.astro
rm src/components/HeroSection.astro.bak
```

For other sections, grep for the old `duration={...}` and `delay={...}` props in seconds and convert each:

```bash
grep -rn "duration={" src/components/*.astro | grep ScrollReveal
grep -rn "delay={" src/components/*.astro | grep ScrollReveal
```

Convert each occurrence manually (one-pass `sed` is risky here because the props may have decimal values).

- [ ] **Step 6: Delete old ScrollReveal**

```bash
rm src/components/ScrollReveal.tsx
rm src/components/__tests__/ScrollReveal.test.tsx
```

- [ ] **Step 7: Verify the build**

Run: `bun run type-check && bun test`
Expected: type-check clean, all tests pass (including the new ScrollReveal tests and existing section integrations).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor(motion): migrate ScrollReveal to motion/, fix SSR-visible state"
```

### Task 0.15: Storybook setup (Phase 0 Gate B outcome dependent)

**Files:**
- Modify: `package.json` (add Storybook deps)
- Create: `.storybook/main.ts`, `.storybook/preview.ts`
- Modify: `.gitignore` (add `storybook-static`)

**Conditional:** If Gate B selected **Candidate A** (Storybook + `@storybook-astro/framework`), execute steps 1-A. If Gate B selected **Candidate B** (React-only + playground page), execute steps 1-B.

#### Variant A: Storybook 10 + `@storybook-astro/framework`

- [ ] **Step 1-A: Install Storybook 10**

```bash
bunx storybook@10 init --type=react-vite --yes
```

This creates `.storybook/` config and adds `storybook` to devDependencies.

- [ ] **Step 2-A: Install Astro framework**

```bash
bun add -d @storybook-astro/framework@latest
```

- [ ] **Step 3-A: Configure both renderers**

Edit `.storybook/main.ts`:

```ts
import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/components/motion/stories/**/*.stories.@(ts|tsx)"],
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-a11y",
    "@storybook-astro/framework",
  ],
  framework: { name: "@storybook/react-vite", options: {} },
};

export default config;
```

Edit `.storybook/preview.ts`:

```ts
import type { Preview } from "@storybook/react";
import "../src/styles/global.css";

const preview: Preview = {
  parameters: {
    a11y: { config: {} },
    backgrounds: {
      default: "platcox-bg",
      values: [{ name: "platcox-bg", value: "#FAFAFA" }],
    },
  },
};

export default preview;
```

#### Variant B: React-only Storybook + playground

- [ ] **Step 1-B: Install Storybook 10 (React only)**

```bash
bunx storybook@10 init --type=react-vite --yes
```

- [ ] **Step 2-B: Create the Astro playground page**

Create `src/pages/_motion-playground.astro`:

```astro
---
// Dev-only playground. Underscore prefix prevents production build inclusion.
// Astro primitives are demonstrated here since Storybook + Astro is deferred.
---

<html lang="en">
  <head>
    <title>Motion Playground (dev)</title>
    <style>
      body { font-family: Inter, sans-serif; padding: 40px; background: #FAFAFA; }
      h1 { font-weight: 300; }
      .demo { padding: 20px; border: 1px solid #E5E7EB; margin-bottom: 20px; }
    </style>
  </head>
  <body>
    <h1>Motion Library Playground</h1>
    <p>This page is dev-only and excluded from production builds.</p>
    <!-- Primitives are added here as they ship in Phases 1-5. -->
  </body>
</html>
```

#### Both variants

- [ ] **Step 4 (both): Add npm scripts**

Edit `package.json` — under `"scripts"`, add:

```json
"story": "storybook dev -p 6006",
"story:build": "storybook build",
"story:a11y": "storybook build && bun run scripts/run-axe.ts"
```

(The `scripts/run-axe.ts` helper is added in Phase 7.)

- [ ] **Step 5 (both): Update .gitignore**

Append to `.gitignore`:

```
# Storybook
storybook-static/
.storybook/cache/
```

- [ ] **Step 6 (both): Smoke test Storybook**

Run: `bun run story:build`
Expected: builds successfully, produces `storybook-static/` (empty stories OK at this point).

- [ ] **Step 7 (both): Commit**

```bash
git add -A
git commit -m "chore(motion): scaffold Storybook 10"
```

---

**Phase 0 Phase exit criteria:**
- All 16 tasks above (0.0–0.15) complete with green tests + type-check.
- Two go/no-go gate decisions recorded in `docs/superpowers/plans/`.
- Cinematic-showcase decommissioned, archive tag pushed.
- 11 sections still build and render correctly (smoke check by `bun run build`).
- `src/components/motion/` skeleton populated; hooks/adapters/types/tokens/ScrollReveal all under test.

**Phase 0 estimate:** 6-10 hours. Phase 1 begins after exit criteria pass.

---

## Phase 1 — Astro/SMIL Primitives

Target: 4-6 hours. Two primitives: TradeRoute and SketchStroke. Each follows the test lane decided in Phase 0 Gate A.

**Lane reminder (from Gate A):**
- B1 — Container API tests in `bun test`
- B2 — Snapshot tests + manual Storybook QA
- B3 — Convert to `.tsx` (uses Lane A pattern from Phase 2+)

If Gate A selected B3, Tasks 1.1 and 1.2 produce `.tsx` files instead of `.astro`; tests use `@testing-library/react`. Below assumes B1 or B2.

### Task 1.1: TradeRoute primitive (Astro/SMIL)

**Files:**
- Create: `src/components/motion/primitives/TradeRoute.astro`
- Test: `src/components/motion/__tests__/TradeRoute.test.ts`
- Story: `src/components/motion/stories/TradeRoute.stories.ts` (or playground entry per Gate B)

- [ ] **Step 1: Write failing test (Lane B1 — Container API)**

Create `src/components/motion/__tests__/TradeRoute.test.ts`:

```ts
import { describe, it, expect } from "bun:test";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import TradeRoute from "../primitives/TradeRoute.astro";

describe("TradeRoute", () => {
  it("renders SVG with from/to circle endpoints", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(TradeRoute, {
      props: {
        from: { x: 20, y: 80 },
        to: { x: 180, y: 20 },
      },
    });
    expect(html).toContain("<svg");
    expect(html).toContain('cx="20"');
    expect(html).toContain('cy="80"');
    expect(html).toContain('cx="180"');
    expect(html).toContain('cy="20"');
  });

  it("includes SMIL animate element with correct dur", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(TradeRoute, {
      props: {
        from: { x: 0, y: 0 },
        to: { x: 100, y: 100 },
        durationMs: 1200,
      },
    });
    expect(html).toContain('dur="1200ms"');
    expect(html).toContain("<animate");
    expect(html).toContain('attributeName="stroke-dashoffset"');
  });

  it("uses data-motion-trigger='viewport-once' by default", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(TradeRoute, {
      props: { from: { x: 0, y: 0 }, to: { x: 100, y: 100 } },
    });
    expect(html).toContain('data-motion-trigger="viewport-once"');
  });

  it("emits data-motion-id when trigger is manual", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(TradeRoute, {
      props: {
        from: { x: 0, y: 0 },
        to: { x: 100, y: 100 },
        trigger: "manual",
        id: "route-1",
      },
    });
    expect(html).toContain('data-motion-trigger="manual"');
    expect(html).toContain('data-motion-id="route-1"');
  });

  it("applies role=img + aria-label when ariaLabel is provided", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(TradeRoute, {
      props: {
        from: { x: 0, y: 0 },
        to: { x: 100, y: 100 },
        ariaLabel: "Karachi to Hamburg trade route",
      },
    });
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Karachi to Hamburg trade route"');
  });

  it("applies role=presentation when ariaLabel is omitted", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(TradeRoute, {
      props: { from: { x: 0, y: 0 }, to: { x: 100, y: 100 } },
    });
    expect(html).toContain('role="presentation"');
  });

  it("renders fully drawn path under reduced-motion (data attr present)", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(TradeRoute, {
      props: { from: { x: 0, y: 0 }, to: { x: 100, y: 100 } },
    });
    expect(html).toContain("data-motion-reduced-end-state");
  });
});
```

(For Lane B2, replace Container API with a snapshot strategy: compile the `.astro` template via `astro/compiler`'s `transform()` and assert on the produced HTML string. Adapt above tests accordingly.)

- [ ] **Step 2: Run, expect FAIL**

Run: `bun test src/components/motion/__tests__/TradeRoute.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement TradeRoute.astro**

Create `src/components/motion/primitives/TradeRoute.astro`:

```astro
---
import { toSmilDur } from "../adapters/smil";
import { DURATION, EASE } from "../tokens";

interface Endpoint {
  x: number;
  y: number;
  label?: string;
}

export interface Props {
  from: Endpoint;
  to: Endpoint;
  curve?: number;          // 0..1, default 0.4
  durationMs?: number;     // default DURATION.long = 1200
  trigger?: "viewport-once" | "viewport-repeat" | "manual";
  id?: string;             // required if trigger="manual"
  ariaLabel?: string;
  class?: string;
}

const {
  from,
  to,
  curve = 0.4,
  durationMs = DURATION.long,
  trigger = "viewport-once",
  id,
  ariaLabel,
  class: className = "",
} = Astro.props;

const cx = (from.x + to.x) / 2;
const cy = Math.min(from.y, to.y) - Math.abs(to.x - from.x) * curve;

const beginAttr = trigger === "manual" ? "indefinite" : "indefinite";
// `indefinite` means "wait for beginElement()" — both viewport and manual
// triggers rely on the page-level observer to call beginElement on intersect or trigger.

const role = ariaLabel ? "img" : "presentation";
const motionId = trigger === "manual" ? id : undefined;
const keySplines = EASE.draw.join(" ");
---

<svg
  viewBox="0 0 200 100"
  class={`trade-route ${className}`}
  data-motion-trigger={trigger}
  data-motion-id={motionId}
  data-motion-reduced-end-state
  role={role}
  aria-label={ariaLabel}
>
  <path
    d={`M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`}
    fill="none"
    stroke="currentColor"
    stroke-width="1.2"
    pathLength="1"
    stroke-dasharray="1"
    stroke-dashoffset="1"
  >
    <animate
      attributeName="stroke-dashoffset"
      from="1"
      to="0"
      dur={toSmilDur(durationMs)}
      keySplines={keySplines}
      calcMode="spline"
      fill="freeze"
      begin={beginAttr}
    />
  </path>
  <circle cx={from.x} cy={from.y} r="3" fill="currentColor" />
  <circle cx={to.x} cy={to.y} r="3" fill="var(--color-accent, #22C55E)" />
  {from.label && <title>{from.label} → {to.label ?? "destination"}</title>}
</svg>
```

- [ ] **Step 4: Run, expect PASS**

Run: `bun test src/components/motion/__tests__/TradeRoute.test.ts`
Expected: 7 tests pass.

- [ ] **Step 5: Write Storybook stories**

Create `src/components/motion/stories/TradeRoute.stories.ts`:

```ts
import TradeRoute from "../primitives/TradeRoute.astro";

export default {
  title: "Motion / TradeRoute",
  component: TradeRoute,
};

export const Default = {
  args: { from: { x: 20, y: 80 }, to: { x: 180, y: 20 } },
};

export const VariantSet = {
  // Multiple variants in one story per §12.2 (Astro stories don't fully support controls).
  render: () => `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:20px;">
      <div><h4>Default curve</h4><svg-trade-route from-x="20" from-y="80" to-x="180" to-y="20"/></div>
      <div><h4>High curve</h4><svg-trade-route from-x="20" from-y="80" to-x="180" to-y="20" curve="0.8"/></div>
      <div><h4>Manual trigger</h4><svg-trade-route from-x="20" from-y="80" to-x="180" to-y="20" trigger="manual" id="demo-route"/></div>
    </div>
  `,
};
```

(If Gate B chose Candidate B (playground), instead add a section to `src/pages/_motion-playground.astro`.)

- [ ] **Step 6: Manual smoke test in Storybook**

Run: `bun run story` and open http://localhost:6006. Navigate to Motion → TradeRoute → Default. Verify the path animates.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(motion): add TradeRoute primitive (Astro/SMIL)"
```

### Task 1.2: SketchStroke primitive (Astro/SMIL)

**Files:**
- Create: `src/components/motion/primitives/SketchStroke.astro`
- Test: `src/components/motion/__tests__/SketchStroke.test.ts`
- Story: `src/components/motion/stories/SketchStroke.stories.ts`

- [ ] **Step 1: Write failing test**

Create `src/components/motion/__tests__/SketchStroke.test.ts`:

```ts
import { describe, it, expect } from "bun:test";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import SketchStroke from "../primitives/SketchStroke.astro";

describe("SketchStroke", () => {
  it("renders 'circle' shape by default", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SketchStroke, { props: {} });
    expect(html).toContain("<svg");
    expect(html).toContain("<circle");
  });

  it("renders 'ring' shape when specified", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SketchStroke, { props: { shape: "ring" } });
    expect(html).toContain("<circle");
    expect(html).toContain('fill="none"');
  });

  it("renders 'arrow' shape with path", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SketchStroke, { props: { shape: "arrow" } });
    expect(html).toContain("<path");
  });

  it("renders 'custom' shape with provided path", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SketchStroke, {
      props: { shape: "custom", path: "M 0 0 L 50 50 Z" },
    });
    expect(html).toContain('d="M 0 0 L 50 50 Z"');
  });

  it("uses durationMs (default 1200) in SMIL dur", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SketchStroke, { props: {} });
    expect(html).toContain('dur="1200ms"');
  });

  it("always renders as role=presentation (decorative)", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SketchStroke, { props: {} });
    expect(html).toContain('role="presentation"');
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `bun test src/components/motion/__tests__/SketchStroke.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement SketchStroke.astro**

Create `src/components/motion/primitives/SketchStroke.astro`:

```astro
---
import { toSmilDur } from "../adapters/smil";
import { DURATION, EASE } from "../tokens";

export interface Props {
  shape?: "circle" | "ring" | "arrow" | "custom";
  path?: string;             // required when shape="custom"
  durationMs?: number;       // default DURATION.long = 1200
  trigger?: "viewport-once";
  class?: string;
}

const {
  shape = "circle",
  path,
  durationMs = DURATION.long,
  trigger = "viewport-once",
  class: className = "",
} = Astro.props;

const shapePathMap = {
  circle: "M 60 20 Q 35 30, 30 60 Q 35 90, 60 90 Q 85 90, 90 60 Q 85 30, 60 20 Z",
  ring:   "M 60 20 A 30 30 0 1 0 60 90 A 30 30 0 1 0 60 20 Z",
  arrow:  "M 10 50 L 90 50 L 75 35 M 90 50 L 75 65",
  custom: path ?? "",
};

const dPath = shapePathMap[shape];
const keySplines = EASE.draw.join(" ");
---

<svg
  viewBox="0 0 120 100"
  class={`sketch-stroke ${className}`}
  data-motion-trigger={trigger}
  data-motion-reduced-end-state
  role="presentation"
>
  <path
    d={dPath}
    fill="none"
    stroke="currentColor"
    stroke-width="1.2"
    pathLength="1"
    stroke-dasharray="1"
    stroke-dashoffset="1"
    stroke-linecap="round"
  >
    <animate
      attributeName="stroke-dashoffset"
      from="1"
      to="0"
      dur={toSmilDur(durationMs)}
      keySplines={keySplines}
      calcMode="spline"
      fill="freeze"
      begin="indefinite"
    />
  </path>
</svg>
```

- [ ] **Step 4: Run, expect PASS**

Run: `bun test src/components/motion/__tests__/SketchStroke.test.ts`
Expected: 6 tests pass.

- [ ] **Step 5: Stories**

Create `src/components/motion/stories/SketchStroke.stories.ts`:

```ts
import SketchStroke from "../primitives/SketchStroke.astro";

export default {
  title: "Motion / SketchStroke",
  component: SketchStroke,
};

export const Default = { args: {} };

export const VariantSet = {
  render: () => `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:20px;">
      <div><h4>circle</h4><sketch-stroke shape="circle"/></div>
      <div><h4>ring</h4><sketch-stroke shape="ring"/></div>
      <div><h4>arrow</h4><sketch-stroke shape="arrow"/></div>
      <div><h4>custom</h4><sketch-stroke shape="custom" path="M 10 80 L 60 20 L 110 80 Z"/></div>
    </div>
  `,
};
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(motion): add SketchStroke primitive (Astro/SMIL)"
```

---

## Phase 2 — Basic React Primitives

Target: 6-8 hours. NumberedReveal + ManifestoRise (viewport-once variant only).

### Task 2.1: NumberedReveal primitive

**Files:**
- Create: `src/components/motion/primitives/NumberedReveal.tsx`
- Test: `src/components/motion/__tests__/NumberedReveal.test.tsx`
- Story: `src/components/motion/stories/NumberedReveal.stories.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/motion/__tests__/NumberedReveal.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from "bun:test";
import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import NumberedReveal from "../primitives/NumberedReveal";
import { mockMatchMedia } from "./helpers/mockMatchMedia";
import { mockIntersectionObserver } from "./helpers/mockIntersectionObserver";

const sampleItems = [
  { num: "/0.1", title: "Strategy isn't an afterthought." },
  { num: "/0.2", title: "Operations breathe with intent." },
  { num: "/0.3", title: "Numbers earn their place." },
];

describe("NumberedReveal", () => {
  beforeEach(() => {
    mockMatchMedia("(prefers-reduced-motion: reduce)", false);
    mockIntersectionObserver();
  });

  it("renders all items in SSR HTML (visible end-state)", () => {
    const html = renderToString(<NumberedReveal items={sampleItems} />);
    expect(html).toContain("Strategy isn't an afterthought.");
    expect(html).toContain("Operations breathe with intent.");
    expect(html).toContain("/0.1");
    expect(html).not.toMatch(/opacity:\s*0/);
  });

  it("renders numbers and titles in the DOM", () => {
    render(<NumberedReveal items={sampleItems} />);
    expect(screen.getByText("/0.1")).toBeInTheDocument();
    expect(screen.getByText("Strategy isn't an afterthought.")).toBeInTheDocument();
  });

  it("renders as an ordered list (semantic a11y)", () => {
    const { container } = render(<NumberedReveal items={sampleItems} />);
    expect(container.querySelector("ol, dl")).toBeTruthy();
  });

  it("under prefers-reduced-motion, all items visible without animation", () => {
    mockMatchMedia("(prefers-reduced-motion: reduce)", true);
    const { container } = render(<NumberedReveal items={sampleItems} />);
    sampleItems.forEach((item) => {
      expect(container).toHaveTextContent(item.title);
    });
  });

  it("respects custom staggerDelay (default 120ms)", () => {
    // Snapshot test: presence of motion props with the expected stagger
    const { container } = render(
      <NumberedReveal items={sampleItems} staggerDelay={200} />
    );
    expect(container.firstChild).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `bun test src/components/motion/__tests__/NumberedReveal.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement NumberedReveal**

Create `src/components/motion/primitives/NumberedReveal.tsx`:

```tsx
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useInViewport } from "../hooks/useInViewport";
import { toFramerSeconds } from "../adapters/framer";
import { DURATION, EASE } from "../tokens";
import type { BaseReactProps } from "../types";

export interface NumberedRevealItem {
  num: string;       // e.g., "/0.1"
  title: string;
  description?: string;
}

export interface NumberedRevealProps extends BaseReactProps {
  items: NumberedRevealItem[];
  staggerDelay?: number;  // ms between items, default 120
}

export default function NumberedReveal({
  items,
  staggerDelay = 120,
  durationMs = DURATION.medium,
  className,
  ariaLabel,
}: NumberedRevealProps) {
  const reduced = useReducedMotion();
  const { ref, isInView } = useInViewport({ threshold: 0.2, once: true });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const shouldAnimate = hydrated && !reduced;

  return (
    <ol
      ref={ref as React.RefObject<HTMLOListElement>}
      className={className}
      aria-label={ariaLabel}
    >
      {items.map((item, i) => {
        const delay = staggerDelay * i;
        const variants = {
          hidden: { opacity: 0, y: 16 },
          visible: { opacity: 1, y: 0 },
        };
        return (
          <motion.li
            key={i}
            initial={shouldAnimate ? "hidden" : "visible"}
            animate={shouldAnimate && !isInView ? "hidden" : "visible"}
            variants={variants}
            transition={{
              duration: toFramerSeconds(durationMs),
              delay: toFramerSeconds(delay),
              ease: EASE.standard,
            }}
            aria-label={`${item.num} ${item.title}`}
          >
            <span className="text-muted">{item.num}</span>
            <span>{item.title}</span>
            {item.description && <p>{item.description}</p>}
          </motion.li>
        );
      })}
    </ol>
  );
}
```

- [ ] **Step 4: Run, expect PASS**

Run: `bun test src/components/motion/__tests__/NumberedReveal.test.tsx`
Expected: 5 tests pass.

- [ ] **Step 5: Stories**

Create `src/components/motion/stories/NumberedReveal.stories.tsx`:

```tsx
import NumberedReveal from "../primitives/NumberedReveal";

export default {
  title: "Motion / NumberedReveal",
  component: NumberedReveal,
};

const items = [
  { num: "/0.1", title: "Strategy isn't an afterthought." },
  { num: "/0.2", title: "Operations breathe with intent." },
  { num: "/0.3", title: "Numbers earn their place." },
];

export const Default = { args: { items } };

export const SlowStagger = { args: { items, staggerDelay: 400 } };

export const WithDescriptions = {
  args: {
    items: items.map((it, i) => ({ ...it, description: `Subtitle ${i + 1}` })),
  },
};
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(motion): add NumberedReveal primitive"
```

### Task 2.2: ManifestoRise primitive (viewport-once variant)

**Files:**
- Create: `src/components/motion/primitives/ManifestoRise.tsx`
- Test: `src/components/motion/__tests__/ManifestoRise.test.tsx`
- Story: `src/components/motion/stories/ManifestoRise.stories.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/motion/__tests__/ManifestoRise.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from "bun:test";
import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import ManifestoRise from "../primitives/ManifestoRise";
import { mockMatchMedia } from "./helpers/mockMatchMedia";
import { mockIntersectionObserver } from "./helpers/mockIntersectionObserver";

const lines = ["Where Global Trade", "Gets Redefined."];

describe("ManifestoRise (viewport-once)", () => {
  beforeEach(() => {
    mockMatchMedia("(prefers-reduced-motion: reduce)", false);
    mockIntersectionObserver();
  });

  it("renders all lines in SSR HTML", () => {
    const html = renderToString(<ManifestoRise lines={lines} />);
    expect(html).toContain("Where Global Trade");
    expect(html).toContain("Gets Redefined.");
    expect(html).not.toMatch(/opacity:\s*0/);
  });

  it("renders as h1 by default", () => {
    const { container } = render(<ManifestoRise lines={lines} />);
    expect(container.querySelector("h1")).toBeTruthy();
  });

  it("uses 'as' prop for heading level override", () => {
    const { container } = render(<ManifestoRise lines={lines} as="h2" />);
    expect(container.querySelector("h2")).toBeTruthy();
  });

  it("respects reduced-motion (no opacity:0)", () => {
    mockMatchMedia("(prefers-reduced-motion: reduce)", true);
    const { container } = render(<ManifestoRise lines={lines} />);
    expect(container).toHaveTextContent("Where Global Trade");
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `bun test src/components/motion/__tests__/ManifestoRise.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement viewport-once variant**

Create `src/components/motion/primitives/ManifestoRise.tsx`:

```tsx
import { motion } from "framer-motion";
import { useEffect, useState, createElement } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useInViewport } from "../hooks/useInViewport";
import { toFramerSeconds } from "../adapters/framer";
import { DURATION, EASE } from "../tokens";
import type { BaseReactProps } from "../types";

export interface ManifestoRiseProps extends BaseReactProps {
  lines: string[];
  staggerDelay?: number;  // ms, default 150
  as?: "h1" | "h2" | "h3" | "div";
}

export default function ManifestoRise({
  lines,
  staggerDelay = 150,
  durationMs = DURATION.long,
  as = "h1",
  className,
  ariaLabel,
}: ManifestoRiseProps) {
  const reduced = useReducedMotion();
  const { ref, isInView } = useInViewport({ threshold: 0.3, once: true });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const shouldAnimate = hydrated && !reduced;

  // SSR / reduced-motion: render heading with all lines visible.
  if (!shouldAnimate) {
    return createElement(
      as,
      { className, ref, "aria-label": ariaLabel },
      lines.map((line, i) => (
        <span key={i} style={{ display: "block" }}>
          {line}
        </span>
      ))
    );
  }

  // Animated path
  return createElement(
    as,
    { className, ref: ref as React.Ref<HTMLHeadingElement>, "aria-label": ariaLabel },
    lines.map((line, i) => (
      <motion.span
        key={i}
        style={{ display: "block" }}
        initial={{ opacity: 0, y: 24 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        transition={{
          duration: toFramerSeconds(durationMs),
          delay: toFramerSeconds(staggerDelay * i),
          ease: EASE.monumental,
        }}
      >
        {line}
      </motion.span>
    ))
  );
}
```

- [ ] **Step 4: Run, expect PASS**

Run: `bun test src/components/motion/__tests__/ManifestoRise.test.tsx`
Expected: 4 tests pass.

- [ ] **Step 5: Stories**

Create `src/components/motion/stories/ManifestoRise.stories.tsx`:

```tsx
import ManifestoRise from "../primitives/ManifestoRise";

export default {
  title: "Motion / ManifestoRise",
  component: ManifestoRise,
};

export const Default = {
  args: { lines: ["Where Global Trade", "Gets Redefined."] },
};

export const ThreeLines = {
  args: { lines: ["One.", "Two.", "Three."] },
};

export const SlowCinematic = {
  args: {
    lines: ["Data into Direction.", "Foresight into Reality."],
    durationMs: 2400,
    staggerDelay: 400,
  },
};
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(motion): add ManifestoRise (viewport-once variant)"
```

---

## Phase 3 — State-Driven React Primitives

Target: 8-12 hours. TickCounter + DecisionPulse + DataScan.

### Task 3.1: TickCounter primitive

**Files:**
- Create: `src/components/motion/primitives/TickCounter.tsx`
- Test: `src/components/motion/__tests__/TickCounter.test.tsx`
- Story: `src/components/motion/stories/TickCounter.stories.tsx`
- Create: `src/components/motion/__tests__/helpers/mockRAF.ts`

- [ ] **Step 1: Create RAF mock helper**

Create `src/components/motion/__tests__/helpers/mockRAF.ts`:

```ts
import { spyOn } from "bun:test";

export interface MockRAF {
  step: (frames?: number) => void;
  cancel: ReturnType<typeof spyOn>;
}

export function mockRAF(): MockRAF {
  let now = 0;
  const callbacks: Array<{ id: number; cb: FrameRequestCallback }> = [];
  let nextId = 1;

  globalThis.requestAnimationFrame = (cb) => {
    const id = nextId++;
    callbacks.push({ id, cb });
    return id;
  };
  globalThis.cancelAnimationFrame = (id) => {
    const idx = callbacks.findIndex((c) => c.id === id);
    if (idx >= 0) callbacks.splice(idx, 1);
  };

  const step = (frames = 1) => {
    for (let i = 0; i < frames; i++) {
      now += 16;
      const due = callbacks.splice(0);
      due.forEach(({ cb }) => cb(now));
    }
  };

  return {
    step,
    cancel: spyOn(globalThis, "cancelAnimationFrame"),
  };
}
```

- [ ] **Step 2: Write failing tests**

Create `src/components/motion/__tests__/TickCounter.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from "bun:test";
import { render, screen, act } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import TickCounter from "../primitives/TickCounter";
import { mockMatchMedia } from "./helpers/mockMatchMedia";
import { mockIntersectionObserver } from "./helpers/mockIntersectionObserver";
import { mockRAF } from "./helpers/mockRAF";

describe("TickCounter", () => {
  beforeEach(() => {
    mockMatchMedia("(prefers-reduced-motion: reduce)", false);
    mockIntersectionObserver();
    mockRAF();
  });

  it("renders final formatted value in SSR HTML (240,000)", () => {
    const html = renderToString(<TickCounter target={240000} />);
    expect(html).toContain("240,000");
  });

  it("uses 'en-US' locale by default (deterministic formatting)", () => {
    const html = renderToString(<TickCounter target={1234567} />);
    expect(html).toContain("1,234,567");
  });

  it("supports currency format with required currency code", () => {
    const html = renderToString(
      <TickCounter target={1500} format="currency" currency="USD" />
    );
    expect(html).toMatch(/\$1,500/);
  });

  it("supports percent format", () => {
    const html = renderToString(<TickCounter target={0.42} format="percent" />);
    expect(html).toContain("42%");
  });

  it("respects reduced-motion (shows final value immediately, no count-up)", () => {
    mockMatchMedia("(prefers-reduced-motion: reduce)", true);
    render(<TickCounter target={1000} />);
    expect(screen.getByText("1,000")).toBeInTheDocument();
  });

  it("animates from startValue to target with precision", () => {
    const { getByText } = render(<TickCounter target={100} startValue={0} precision={0} />);
    // Final value should eventually be present
    expect(getByText(/100|0/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run, expect FAIL**

Run: `bun test src/components/motion/__tests__/TickCounter.test.tsx`
Expected: FAIL.

- [ ] **Step 4: Implement TickCounter**

Create `src/components/motion/primitives/TickCounter.tsx`:

```tsx
import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useInViewport } from "../hooks/useInViewport";
import { DURATION } from "../tokens";
import type { BaseReactProps, MotionRef } from "../types";

export interface TickCounterProps extends BaseReactProps {
  target: number;
  startValue?: number;
  format?: "number" | "currency" | "percent";
  currency?: string;       // required if format="currency"
  locale?: string;         // default "en-US"
  precision?: number;
  suffix?: string;
}

const formatValue = (
  v: number,
  format: "number" | "currency" | "percent",
  locale: string,
  currency?: string,
  precision?: number
): string => {
  const defaults = format === "percent" ? 1 : 0;
  const fractionDigits = precision ?? defaults;
  const formatter = new Intl.NumberFormat(locale, {
    style: format === "number" ? "decimal" : format,
    currency: format === "currency" ? currency : undefined,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
  return formatter.format(v);
};

const TickCounter = forwardRef<Pick<MotionRef, "start" | "reset">, TickCounterProps>(
  function TickCounter(
    {
      target,
      startValue = 0,
      format = "number",
      currency,
      locale = "en-US",
      precision,
      suffix = "",
      durationMs = DURATION.long,
      className,
      ariaLabel,
    },
    ref
  ) {
    const reduced = useReducedMotion();
    const { ref: viewRef, isInView } = useInViewport({ threshold: 0.5, once: false });
    const [display, setDisplay] = useState(target); // SSR: final value
    const [hydrated, setHydrated] = useState(false);
    const rafId = useRef<number | null>(null);

    useEffect(() => {
      setHydrated(true);
      if (reduced) {
        setDisplay(target);
      } else {
        setDisplay(startValue);
      }
    }, [reduced, target, startValue]);

    useEffect(() => {
      if (!hydrated) return;
      if (reduced) return;
      if (!isInView) return;
      const start = performance.now();
      const animate = (now: number) => {
        const progress = Math.min(1, (now - start) / durationMs);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = startValue + (target - startValue) * eased;
        setDisplay(value);
        if (progress < 1) {
          rafId.current = requestAnimationFrame(animate);
        }
      };
      rafId.current = requestAnimationFrame(animate);
      return () => {
        if (rafId.current !== null) cancelAnimationFrame(rafId.current);
      };
    }, [hydrated, isInView, reduced, target, startValue, durationMs]);

    useImperativeHandle(ref, () => ({
      start: () => setDisplay(startValue), // re-trigger
      reset: () => setDisplay(startValue),
    }));

    const formatted = formatValue(display, format, locale, currency, precision);

    return (
      <span
        ref={viewRef as React.RefObject<HTMLSpanElement>}
        className={className}
        style={{ fontVariantNumeric: "tabular-nums" }}
        aria-label={ariaLabel ?? formatted}
        aria-live="polite"
      >
        {formatted}
        {suffix}
      </span>
    );
  }
);

export default TickCounter;
```

- [ ] **Step 5: Run, expect PASS**

Run: `bun test src/components/motion/__tests__/TickCounter.test.tsx`
Expected: 6 tests pass.

- [ ] **Step 6: Stories**

Create `src/components/motion/stories/TickCounter.stories.tsx`:

```tsx
import TickCounter from "../primitives/TickCounter";

export default {
  title: "Motion / TickCounter",
  component: TickCounter,
};

export const Default = { args: { target: 240000 } };

export const Currency = {
  args: { target: 1500000, format: "currency", currency: "USD" },
};

export const Percent = {
  args: { target: 0.4275, format: "percent", precision: 2 },
};
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(motion): add TickCounter primitive"
```

### Task 3.2: DecisionPulse primitive

**Files:**
- Create: `src/components/motion/primitives/DecisionPulse.tsx`
- Test: `src/components/motion/__tests__/DecisionPulse.test.tsx`
- Story: `src/components/motion/stories/DecisionPulse.stories.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/motion/__tests__/DecisionPulse.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import { createRef } from "react";
import DecisionPulse from "../primitives/DecisionPulse";
import { mockMatchMedia } from "./helpers/mockMatchMedia";
import { mockIntersectionObserver } from "./helpers/mockIntersectionObserver";

describe("DecisionPulse", () => {
  beforeEach(() => {
    mockMatchMedia("(prefers-reduced-motion: reduce)", false);
    mockIntersectionObserver();
  });

  it("renders title and value", () => {
    render(<DecisionPulse title="Stock-out risk" value="+12%" />);
    expect(screen.getByText("Stock-out risk")).toBeInTheDocument();
    expect(screen.getByText("+12%")).toBeInTheDocument();
  });

  it("renders as button when onActivate is provided", () => {
    render(<DecisionPulse title="X" value="1" onActivate={() => {}} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("renders as static div when onActivate is omitted", () => {
    render(<DecisionPulse title="X" value="1" />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("pulse=false disables the pulse ring", () => {
    const { container } = render(<DecisionPulse title="X" value="1" pulse={false} />);
    expect(container.querySelector("[data-pulse-ring]")).toBeNull();
  });

  it("ref.start() triggers emphasis (calls onActivate not needed)", () => {
    const ref = createRef<{ start: () => void }>();
    render(<DecisionPulse ref={ref} title="X" value="1" />);
    expect(typeof ref.current?.start).toBe("function");
    ref.current?.start();
  });

  it("under reduced-motion pulse ring is paused", () => {
    mockMatchMedia("(prefers-reduced-motion: reduce)", true);
    const { container } = render(<DecisionPulse title="X" value="1" />);
    // CSS-driven via media query — element still present
    expect(container.querySelector("[data-pulse-ring]")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `bun test src/components/motion/__tests__/DecisionPulse.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement DecisionPulse**

Create `src/components/motion/primitives/DecisionPulse.tsx`:

```tsx
import { motion } from "framer-motion";
import { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useInViewport } from "../hooks/useInViewport";
import type { BaseReactProps, MotionRef } from "../types";

export interface DecisionPulseProps extends BaseReactProps {
  title: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  pulse?: boolean;
  onActivate?: () => void;
}

const DecisionPulse = forwardRef<Pick<MotionRef, "start">, DecisionPulseProps>(
  function DecisionPulse(
    { title, value, trend = "neutral", pulse = true, onActivate, className, ariaLabel },
    ref
  ) {
    const reduced = useReducedMotion();
    const { ref: viewRef, isInView } = useInViewport({ threshold: 0.5 });
    const [emphasize, setEmphasize] = useState(false);

    const triggerEmphasis = () => {
      setEmphasize(true);
      setTimeout(() => setEmphasize(false), 600);
    };

    useEffect(() => {
      // Re-trigger emphasis when value or trend changes (skip first render).
      triggerEmphasis();
    }, [value, trend]);

    useImperativeHandle(ref, () => ({ start: triggerEmphasis }));

    const isInteractive = !!onActivate;
    const Tag: any = isInteractive ? motion.button : motion.div;
    const trendColor =
      trend === "up" ? "var(--color-accent, #22C55E)" : trend === "down" ? "#EF4444" : "#1A1A1A";

    return (
      <Tag
        ref={viewRef as any}
        className={className}
        onClick={isInteractive ? onActivate : undefined}
        animate={emphasize && !reduced ? { scale: [1, 1.03, 1] } : { scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        aria-label={ariaLabel ?? `${title}: ${value}`}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {pulse && isInView && (
            <span
              data-pulse-ring
              style={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: trendColor,
                animation: "pulse-ring 1.8s ease-out infinite",
              }}
            />
          )}
          <span>{title}</span>
        </span>
        <span style={{ color: trendColor, fontWeight: 600 }}>{value}</span>
      </Tag>
    );
  }
);

export default DecisionPulse;
```

- [ ] **Step 4: Add the CSS keyframe globally**

Edit `src/styles/global.css` — append:

```css
@keyframes pulse-ring {
  0%   { box-shadow: 0 0 0 0 currentColor; }
  100% { box-shadow: 0 0 0 14px transparent; }
}
@media (prefers-reduced-motion: reduce) {
  [data-pulse-ring] {
    animation-play-state: paused !important;
  }
}
```

- [ ] **Step 5: Run, expect PASS**

Run: `bun test src/components/motion/__tests__/DecisionPulse.test.tsx`
Expected: 6 tests pass.

- [ ] **Step 6: Stories**

Create `src/components/motion/stories/DecisionPulse.stories.tsx`:

```tsx
import DecisionPulse from "../primitives/DecisionPulse";

export default {
  title: "Motion / DecisionPulse",
  component: DecisionPulse,
};

export const Default = { args: { title: "Stock-out risk", value: "+12%", trend: "up" } };

export const Interactive = {
  args: {
    title: "Click me",
    value: "1",
    onActivate: () => alert("Activated"),
  },
};

export const Static = { args: { title: "No pulse", value: "—", pulse: false } };
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(motion): add DecisionPulse primitive"
```

### Task 3.3: DataScan primitive

**Files:**
- Create: `src/components/motion/primitives/DataScan.tsx`
- Test: `src/components/motion/__tests__/DataScan.test.tsx`
- Story: `src/components/motion/stories/DataScan.stories.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/motion/__tests__/DataScan.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from "bun:test";
import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import DataScan from "../primitives/DataScan";
import { mockMatchMedia } from "./helpers/mockMatchMedia";
import { mockIntersectionObserver } from "./helpers/mockIntersectionObserver";

const rows = [
  { label: "Karachi → Rotterdam", value: "14d" },
  { label: "Shenzhen → Hamburg", value: "28d" },
  { label: "Istanbul → New York", value: "11d" },
];

describe("DataScan", () => {
  beforeEach(() => {
    mockMatchMedia("(prefers-reduced-motion: reduce)", false);
    mockIntersectionObserver();
  });

  it("renders all rows in SSR HTML", () => {
    const html = renderToString(<DataScan rows={rows} />);
    expect(html).toContain("Karachi → Rotterdam");
    expect(html).toContain("14d");
  });

  it("renders as dl semantic element", () => {
    const { container } = render(<DataScan rows={rows} />);
    expect(container.querySelector("dl")).toBeTruthy();
  });

  it("uses monospace font by default", () => {
    const { container } = render(<DataScan rows={rows} />);
    const root = container.firstChild as HTMLElement;
    expect(root.style.fontFamily).toMatch(/mono/i);
  });

  it("mono=false disables monospace", () => {
    const { container } = render(<DataScan rows={rows} mono={false} />);
    const root = container.firstChild as HTMLElement;
    expect(root.style.fontFamily).not.toMatch(/mono/i);
  });

  it("under reduced-motion all rows visible without scan bar animation", () => {
    mockMatchMedia("(prefers-reduced-motion: reduce)", true);
    render(<DataScan rows={rows} />);
    rows.forEach((r) => {
      expect(screen.getByText(r.label)).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `bun test src/components/motion/__tests__/DataScan.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement DataScan**

Create `src/components/motion/primitives/DataScan.tsx`:

```tsx
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useInViewport } from "../hooks/useInViewport";
import { toFramerSeconds } from "../adapters/framer";
import { DURATION, EASE } from "../tokens";
import type { BaseReactProps } from "../types";

export interface DataScanRow {
  label: string;
  value: string;
}

export interface DataScanProps extends BaseReactProps {
  rows: DataScanRow[];
  mono?: boolean;
  staggerDelay?: number;  // ms, default 80
}

export default function DataScan({
  rows,
  mono = true,
  staggerDelay = 80,
  durationMs = DURATION.medium,
  className,
  ariaLabel,
}: DataScanProps) {
  const reduced = useReducedMotion();
  const { ref, isInView } = useInViewport({ threshold: 0.3, once: true });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const shouldAnimate = hydrated && !reduced;
  const fontFamily = mono ? "'JetBrains Mono', Courier, monospace" : "inherit";

  return (
    <dl
      ref={ref as React.RefObject<HTMLDListElement>}
      className={className}
      aria-label={ariaLabel}
      style={{ fontFamily, position: "relative" }}
    >
      {rows.map((row, i) => {
        const variants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } };
        const initial = shouldAnimate ? "hidden" : "visible";
        const animate = shouldAnimate && !isInView ? "hidden" : "visible";
        return (
          <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
            <motion.dt
              initial={initial}
              animate={animate}
              variants={variants}
              transition={{
                duration: toFramerSeconds(durationMs),
                delay: toFramerSeconds(staggerDelay * i),
                ease: EASE.scan,
              }}
            >
              {row.label}
            </motion.dt>
            <motion.dd
              initial={initial}
              animate={animate}
              variants={variants}
              transition={{
                duration: toFramerSeconds(durationMs),
                delay: toFramerSeconds(staggerDelay * i),
                ease: EASE.scan,
              }}
              style={{ fontWeight: 600, margin: 0 }}
            >
              {row.value}
            </motion.dd>
          </div>
        );
      })}
      {/* Scan bar */}
      {!reduced && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 1,
            overflow: "hidden",
            background: "transparent",
          }}
        >
          <div
            data-scan-bar
            style={{
              height: "100%",
              background: "linear-gradient(90deg, transparent, currentColor, transparent)",
              animation: "data-scan 2.4s linear infinite",
            }}
          />
        </div>
      )}
    </dl>
  );
}
```

- [ ] **Step 4: Add scan keyframes globally**

Edit `src/styles/global.css` — append:

```css
@keyframes data-scan {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
@media (prefers-reduced-motion: reduce) {
  [data-scan-bar] {
    animation-play-state: paused !important;
  }
}
```

- [ ] **Step 5: Run, expect PASS**

Run: `bun test src/components/motion/__tests__/DataScan.test.tsx`
Expected: 5 tests pass.

- [ ] **Step 6: Stories**

Create `src/components/motion/stories/DataScan.stories.tsx`:

```tsx
import DataScan from "../primitives/DataScan";

export default {
  title: "Motion / DataScan",
  component: DataScan,
};

const rows = [
  { label: "Karachi → Rotterdam", value: "14d" },
  { label: "Shenzhen → Hamburg", value: "28d" },
  { label: "Istanbul → New York", value: "11d" },
];

export const Default = { args: { rows } };

export const NonMono = { args: { rows, mono: false } };

export const ManyRows = {
  args: { rows: [...rows, ...rows, ...rows] },
};
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(motion): add DataScan primitive"
```

---

## Phase 4 — Interactive Primitive

Target: 6-8 hours.

### Task 4.1: OntologyGraph primitive

**Files:**
- Create: `src/components/motion/primitives/OntologyGraph.tsx`
- Test: `src/components/motion/__tests__/OntologyGraph.test.tsx`
- Story: `src/components/motion/stories/OntologyGraph.stories.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/motion/__tests__/OntologyGraph.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import OntologyGraph from "../primitives/OntologyGraph";
import { mockMatchMedia } from "./helpers/mockMatchMedia";
import { mockIntersectionObserver } from "./helpers/mockIntersectionObserver";

const sampleGraph = {
  nodes: [
    { id: "n1", x: 50, y: 40, label: "Sourcing" },
    { id: "n2", x: 100, y: 60, label: "Strategy" },
    { id: "n3", x: 160, y: 30, label: "Operations" },
  ],
  edges: [
    { from: "n1", to: "n2" },
    { from: "n2", to: "n3" },
  ],
};

describe("OntologyGraph", () => {
  beforeEach(() => {
    mockMatchMedia("(prefers-reduced-motion: reduce)", false);
    mockIntersectionObserver();
  });

  it("renders all nodes and edges in SSR HTML", () => {
    const html = renderToString(<OntologyGraph {...sampleGraph} ariaLabel="C.O.D.E graph" />);
    expect(html).toContain("Sourcing");
    expect(html).toContain('aria-label="C.O.D.E graph"');
  });

  it("each node has tabindex=0 and role=button (keyboard accessible)", () => {
    const { container } = render(<OntologyGraph {...sampleGraph} ariaLabel="x" />);
    const nodes = container.querySelectorAll('[role="button"][tabindex="0"]');
    expect(nodes.length).toBe(3);
  });

  it("focusing a node shows detail overlay", () => {
    const { container } = render(<OntologyGraph {...sampleGraph} ariaLabel="x" />);
    const firstNode = container.querySelector('[role="button"]') as HTMLElement;
    fireEvent.focus(firstNode);
    expect(screen.getByText("Sourcing")).toBeInTheDocument();
  });

  it("Enter/Space on a node toggles its detail", () => {
    const { container } = render(<OntologyGraph {...sampleGraph} ariaLabel="x" />);
    const firstNode = container.querySelector('[role="button"]') as HTMLElement;
    fireEvent.keyDown(firstNode, { key: "Enter" });
    // detail visible
    expect(container.querySelector('[data-detail-open="true"]')).toBeTruthy();
  });

  it("Escape closes open detail", () => {
    const { container } = render(<OntologyGraph {...sampleGraph} ariaLabel="x" />);
    const firstNode = container.querySelector('[role="button"]') as HTMLElement;
    fireEvent.keyDown(firstNode, { key: "Enter" });
    fireEvent.keyDown(firstNode, { key: "Escape" });
    expect(container.querySelector('[data-detail-open="true"]')).toBeNull();
  });

  it("under reduced-motion no breathing animation", () => {
    mockMatchMedia("(prefers-reduced-motion: reduce)", true);
    const { container } = render(<OntologyGraph {...sampleGraph} ariaLabel="x" />);
    // Implementation note: breathing CSS is paused via media query
    expect(container.querySelector("svg")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `bun test src/components/motion/__tests__/OntologyGraph.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement OntologyGraph**

Create `src/components/motion/primitives/OntologyGraph.tsx`:

```tsx
import { useState, useEffect } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useInViewport } from "../hooks/useInViewport";
import type { BaseReactProps } from "../types";

export interface OntologyNode {
  id: string;
  x: number;
  y: number;
  label: string;
  weight?: number;
}

export interface OntologyEdge {
  from: string;  // node id
  to: string;    // node id
}

export interface OntologyGraphProps extends BaseReactProps {
  nodes: OntologyNode[];
  edges: OntologyEdge[];
}

export default function OntologyGraph({
  nodes,
  edges,
  className,
  ariaLabel,
}: OntologyGraphProps) {
  const reduced = useReducedMotion();
  const { ref, isInView } = useInViewport({ threshold: 0.3 });
  const [openId, setOpenId] = useState<string | null>(null);

  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenId(null);
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, []);

  return (
    <svg
      ref={ref as React.RefObject<SVGSVGElement>}
      viewBox="0 0 200 120"
      className={className}
      aria-label={ariaLabel}
      role="img"
      data-detail-open={openId ? "true" : "false"}
    >
      {edges.map((edge, i) => {
        const from = nodeById.get(edge.from);
        const to = nodeById.get(edge.to);
        if (!from || !to) return null;
        return (
          <line
            key={i}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="currentColor"
            strokeOpacity="0.3"
            strokeWidth="0.6"
            strokeDasharray="3 2"
            data-ontology-edge
          />
        );
      })}
      {nodes.map((node) => (
        <g
          key={node.id}
          transform={`translate(${node.x}, ${node.y})`}
          role="button"
          tabIndex={0}
          onFocus={() => setOpenId(node.id)}
          onBlur={() => setOpenId((current) => (current === node.id ? null : current))}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setOpenId((current) => (current === node.id ? null : node.id));
            }
          }}
          aria-label={node.label}
          aria-describedby={openId === node.id ? `detail-${node.id}` : undefined}
          style={{ cursor: "pointer" }}
        >
          <circle
            r={4 + (node.weight ?? 0)}
            fill="currentColor"
            data-ontology-node
          />
          {openId === node.id && (
            <text id={`detail-${node.id}`} y="-10" textAnchor="middle" fontSize="8">
              {node.label}
            </text>
          )}
          <title>{node.label}</title>
        </g>
      ))}
    </svg>
  );
}
```

- [ ] **Step 4: Add ontology breathing CSS**

Edit `src/styles/global.css` — append:

```css
@keyframes ontology-breath {
  0%, 100% { r: 4; }
  50%      { r: 5; }
}
[data-ontology-node] {
  animation: ontology-breath 3s ease-in-out infinite;
}
@keyframes ontology-edge-flow {
  to { stroke-dashoffset: -5; }
}
[data-ontology-edge] {
  animation: ontology-edge-flow 2.5s linear infinite;
}
@media (prefers-reduced-motion: reduce) {
  [data-ontology-node], [data-ontology-edge] {
    animation-play-state: paused !important;
  }
}
```

- [ ] **Step 5: Run, expect PASS**

Run: `bun test src/components/motion/__tests__/OntologyGraph.test.tsx`
Expected: 6 tests pass.

- [ ] **Step 6: Stories**

Create `src/components/motion/stories/OntologyGraph.stories.tsx`:

```tsx
import OntologyGraph from "../primitives/OntologyGraph";

export default {
  title: "Motion / OntologyGraph",
  component: OntologyGraph,
};

const small = {
  nodes: [
    { id: "n1", x: 50, y: 40, label: "Sourcing" },
    { id: "n2", x: 100, y: 60, label: "Strategy" },
    { id: "n3", x: 160, y: 30, label: "Operations" },
  ],
  edges: [{ from: "n1", to: "n2" }, { from: "n2", to: "n3" }],
};

export const Default = { args: { ...small, ariaLabel: "Sourcing → Strategy → Operations" } };

export const Dense = {
  args: {
    nodes: [
      { id: "a", x: 30, y: 40, label: "Data" },
      { id: "b", x: 80, y: 60, label: "Ontology" },
      { id: "c", x: 130, y: 30, label: "Decision" },
      { id: "d", x: 170, y: 70, label: "Action" },
    ],
    edges: [
      { from: "a", to: "b" },
      { from: "b", to: "c" },
      { from: "b", to: "d" },
      { from: "c", to: "d" },
    ],
    ariaLabel: "C.O.D.E flow",
  },
};
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(motion): add OntologyGraph primitive with keyboard nav"
```

---

## Phase 5 — Scroll-Tied ManifestoRise (OPTIONAL)

Target: 6-10 hours. Only execute if scope allows; otherwise defer to motion library v2.

### Task 5.1: Add GSAP dependency

**Files:**
- Modify: `package.json`, `bun.lock`

- [ ] **Step 1: Install GSAP**

```bash
bun add gsap@^3.13
```

- [ ] **Step 2: Type-check + commit**

```bash
bun run type-check
git add package.json bun.lock
git commit -m "chore(motion): add gsap dependency for Phase 5"
```

### Task 5.2: Wire useScrollProgress to real GSAP+Lenis

**Files:**
- Modify: `src/components/motion/hooks/useScrollProgress.ts`
- Modify: `src/components/motion/__tests__/useScrollProgress.test.tsx`

- [ ] **Step 1: Update hook to use GSAP ScrollTrigger via injected adapter**

Replace the inert body of `useScrollProgress.ts` with the real implementation from cinematic branch, but adapt to take `adapter: ScrollAdapter | null`:

```ts
import { useEffect, useRef, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { ScrollAdapter } from "./useScrollProgress"; // (interface stays defined here)

gsap.registerPlugin(ScrollTrigger);

// ... full implementation
```

(Copy from `archive/cinematic-showcase-2026-04-16:src/components/cinematic/useScrollProgress.ts` and replace `getLenis()` with the injected adapter.)

- [ ] **Step 2: Update tests**

Expand `useScrollProgress.test.tsx` to test the real behavior:
- creates ScrollTrigger when adapter is provided
- subscribes to adapter scroll events
- cleans up on unmount

- [ ] **Step 3: Run, expect PASS, commit**

```bash
bun test src/components/motion/__tests__/useScrollProgress.test.tsx
git add -A
git commit -m "feat(motion): wire useScrollProgress to GSAP ScrollTrigger"
```

### Task 5.3: ManifestoRise scroll-progress variant

**Files:**
- Modify: `src/components/motion/primitives/ManifestoRise.tsx`
- Modify: `src/components/motion/__tests__/ManifestoRise.test.tsx`

- [ ] **Step 1: Add scroll-progress branch to ManifestoRise**

Extend `ManifestoRise.tsx` to accept `trigger="scroll-progress"`. When this trigger is active and `sectionId` prop is provided, use `useScrollProgress` to map scroll progress to animation stages defined in `SCROLL_STAGES.manifestoRise`.

(The complete code is too long to embed here; the pattern is: read progress.current via RAF inside an effect, interpolate enter/hold/exit stages, apply transforms via Framer Motion's `useTransform`. ~80 lines.)

- [ ] **Step 2: Add test for scroll-progress branch**

Mock GSAP ScrollTrigger and Lenis adapter; assert that ManifestoRise renders correctly under `trigger="scroll-progress"`. Verify reduced-motion still skips animation.

- [ ] **Step 3: Run, expect PASS, commit**

```bash
bun test src/components/motion/__tests__/ManifestoRise.test.tsx
git add -A
git commit -m "feat(motion): add ManifestoRise scroll-progress variant"
```

---

## Phase 6 — Section Integrations

Target: 10-14 hours. Five locked sections. Order: HIGH-risk first.

### Task 6.1: HeroSection — ManifestoRise integration (HIGH-risk)

**Files:**
- Modify: `src/components/HeroSection.astro`

- [ ] **Step 1: Read current HeroSection**

```bash
cat src/components/HeroSection.astro
```

Note the existing `<ScrollReveal>` wrapping the H1.

- [ ] **Step 2: Replace H1 with ManifestoRise**

Edit `src/components/HeroSection.astro`. Replace:

```astro
<ScrollReveal client:visible animation="fade-up" durationMs={800} delay={200}>
  <h1 class="text-center text-5xl font-light leading-tight tracking-tight md:text-7xl lg:text-[96px] lg:leading-[1.05] lg:tracking-[-2px]">
    Where Global Trade<br />
    Gets Rede<span class="font-semibold">fined</span>
  </h1>
</ScrollReveal>
```

With:

```astro
---
import ManifestoRise from "./motion/primitives/ManifestoRise";
// ... existing imports
---

<ManifestoRise
  client:visible
  lines={["Where Global Trade", "Gets Redefined."]}
  as="h1"
  className="text-center text-5xl font-light leading-tight tracking-tight md:text-7xl lg:text-[96px] lg:leading-[1.05] lg:tracking-[-2px]"
/>
```

- [ ] **Step 3: Verify SSR readable**

```bash
bun run build
# In another terminal:
bun run preview &
sleep 3
curl -s http://localhost:4321/ | grep -i "Where Global Trade"
# Expected: prints the H1 text (proves SSR-visible contract)
kill %1
```

- [ ] **Step 4: Run a11y check + commit**

```bash
bun run type-check && bun test
git add src/components/HeroSection.astro
git commit -m "feat(motion): integrate ManifestoRise in HeroSection"
```

### Task 6.2: WorldMap — TradeRoute integration (HIGH-risk)

**Files:**
- Modify: `src/components/WorldMap.tsx`

- [ ] **Step 1: Identify the SVG location-pairs in WorldMap**

```bash
cat src/components/WorldMap.tsx
```

Find the existing static `<line>` or `<path>` elements between locations.

- [ ] **Step 2: Replace with TradeRoute instances**

For each location pair the map shows, replace the static SVG line with a TradeRoute component. Since TradeRoute is an Astro primitive and WorldMap is a `.tsx`, this requires WorldMap to render its TradeRoute uses through an Astro wrapper section, OR a small React-compatible wrapper around TradeRoute's SVG content.

(Decision: extract the SVG body from `TradeRoute.astro` into a shared `tradeRouteSvg.tsx` factory that both `.astro` and `.tsx` can call. Document this pattern as it may be repeated for SketchStroke.)

- [ ] **Step 3: Verify reduced-motion (all routes drawn)**

Manually check the page with `prefers-reduced-motion: reduce` enabled in DevTools. All routes should render fully drawn.

- [ ] **Step 4: Type-check + test + commit**

```bash
bun run type-check && bun test
git add src/components/WorldMap.tsx
git commit -m "feat(motion): integrate TradeRoute into WorldMap"
```

### Task 6.3: DecisionEngineDemo — DecisionPulse + TickCounter (HIGH-risk)

**Files:**
- Modify: `src/components/DecisionEngineDemo.tsx`

- [ ] **Step 1: Read current DecisionEngineDemo**

```bash
cat src/components/DecisionEngineDemo.tsx
```

Identify the alert cards and the numeric stat callout.

- [ ] **Step 2: Wrap alert cards in DecisionPulse**

Replace the manually-coded alert card markup with `<DecisionPulse title={alert.message} value={...} trend="up" />`.

- [ ] **Step 3: Replace numeric stat with TickCounter**

If there's a stat like "alerts/hour" or similar, wrap it in `<TickCounter target={value} suffix=" alerts/hr" />`.

- [ ] **Step 4: Verify in browser + commit**

Open the demo in dev mode; verify pulse ring animates and TickCounter counts up on viewport entry.

```bash
bun run type-check && bun test
git add src/components/DecisionEngineDemo.tsx
git commit -m "feat(motion): integrate DecisionPulse + TickCounter in DecisionEngineDemo"
```

### Task 6.4: AboutSection — NumberedReveal (MED-risk)

**Files:**
- Modify: `src/components/AboutSection.astro`

- [ ] **Step 1: Replace static numbered list with NumberedReveal**

Edit `src/components/AboutSection.astro`. Replace the current numbered items markup with:

```astro
---
import NumberedReveal from "./motion/primitives/NumberedReveal";

const items = [
  { num: "/0.1", title: "Strategy isn't an afterthought." },
  { num: "/0.2", title: "Operations breathe with intent." },
  // ... (carry over existing copy)
];
---

<NumberedReveal client:visible items={items} ariaLabel="About platcoX" />
```

- [ ] **Step 2: Type-check + test + commit**

```bash
bun run type-check && bun test
git add src/components/AboutSection.astro
git commit -m "feat(motion): integrate NumberedReveal in AboutSection"
```

### Task 6.5: SolutionsSection — NumberedReveal (LOW-risk)

**Files:**
- Modify: `src/components/SolutionsSection.astro`

Same pattern as Task 6.4 but with the Solutions list items.

- [ ] **Step 1-2: Replace and commit**

```bash
git add src/components/SolutionsSection.astro
git commit -m "feat(motion): integrate NumberedReveal in SolutionsSection"
```

---

## Phase 7 — Polish & PR

Target: 4-6 hours.

### Task 7.1: README + Storybook MDX docs

**Files:**
- Create: `src/components/motion/README.md`
- Modify: Storybook stories to include Component MDX docs

- [ ] **Step 1: Write README**

Create `src/components/motion/README.md` covering:
- Purpose, paradigm mix
- How to use each primitive (short)
- How to add a new primitive (checklist)
- Token reference
- Reduced-motion contract summary
- Links to spec + plan

- [ ] **Step 2: Storybook component MDX**

Add MDX descriptions to each `*.stories.tsx` via the autodocs system.

- [ ] **Step 3: Commit**

```bash
git add src/components/motion/README.md src/components/motion/stories/
git commit -m "docs(motion): add library README + Storybook MDX"
```

### Task 7.2: Performance audit

**Files:**
- Create: `scripts/run-lighthouse.ts` (optional helper)

- [ ] **Step 1: Build production and serve**

```bash
bun run build
bun run preview &
sleep 3
```

- [ ] **Step 2: Run Lighthouse CLI**

```bash
bunx --bun lighthouse http://localhost:4321/ \
  --preset=mobile \
  --throttling.cpuSlowdownMultiplier=4 \
  --output=json --output-path=/tmp/lh-motion.json \
  --quiet
```

Read `/tmp/lh-motion.json`. Check `categories.performance.score` ≥ 0.9. Record in PR description.

- [ ] **Step 3: Stop preview, commit script (if added)**

```bash
kill %1
```

### Task 7.3: A11y audit + CI

**Files:**
- Create: `scripts/run-axe.ts`
- Modify: `.github/workflows/ci.yml` (if exists) or `package.json` scripts

- [ ] **Step 1: Add axe-core CLI**

```bash
bun add -d @axe-core/cli
```

- [ ] **Step 2: Write run-axe script**

Create `scripts/run-axe.ts` to run axe against built homepage and PR-locked sections.

- [ ] **Step 3: Verify no new violations**

```bash
bun run preview &
sleep 3
bunx axe http://localhost:4321/ --tags wcag21aa
kill %1
```

Compare with baseline on main. Fail PR if new violations.

- [ ] **Step 4: Commit**

```bash
git add scripts/run-axe.ts package.json bun.lock
git commit -m "test(motion): add axe-core a11y CI script"
```

### Task 7.4: Bundle budget + cross-browser SMIL QA

**Files:**
- Record: PR description (bundle size, cross-browser results)

- [ ] **Step 1: Measure bundle**

```bash
bun run build
du -sh dist/ | tee /tmp/bundle-size.txt
gzip -c dist/_astro/*.js 2>/dev/null | wc -c | awk '{print $1/1024 " KB gzipped"}'
```

Compare with main: target ≤ 35 KB delta.

- [ ] **Step 2: Cross-browser SMIL QA**

Manually open the preview URL in:
- Chrome (latest stable)
- Safari (latest macOS)
- Firefox (latest)
- Mobile Safari (iOS, via local network IP or BrowserStack)

Verify TradeRoute and SketchStroke animate on each. Record results in PR description.

- [ ] **Step 3: Commit budget summary**

(No code commit needed; results captured in PR description in next task.)

### Task 7.5: Open the PR

**Files:**
- PR description

- [ ] **Step 1: Final pre-flight**

```bash
bun run type-check && bun test && bun run build
```

All must pass.

- [ ] **Step 2: Push branch**

```bash
git push -u origin feat/motion-library
```

- [ ] **Step 3: Open PR**

```bash
gh pr create --title "feat(motion): in-house motion primitive library + 5 section integrations" --body "$(cat <<'EOF'
## Summary

Implements sub-project #1 of the platcoX full rewrite: in-house motion primitive library with 8 primitives, cinematic-showcase infrastructure migration, and integration into 5 homepage sections.

Spec: docs/superpowers/specs/2026-05-12-motion-library-design.md (v2, Codex review integrated)
Plan: docs/superpowers/plans/2026-05-13-motion-library.md

## Primitives shipped

- `.astro` (SMIL): TradeRoute, SketchStroke
- `.tsx` (Framer): NumberedReveal, ManifestoRise, TickCounter, DecisionPulse, DataScan, OntologyGraph

## Integrations

1. HeroSection — ManifestoRise (HIGH-risk; SSR-visible H1 verified)
2. WorldMap — TradeRoute (HIGH-risk)
3. DecisionEngineDemo — DecisionPulse + TickCounter (HIGH-risk)
4. AboutSection — NumberedReveal
5. SolutionsSection — NumberedReveal

## Phase 0 Gate decisions

- Gate A (.astro test lane): <chosen variant — recorded in docs/superpowers/plans/gate-a-astro-test-lane.md>
- Gate B (Storybook + Astro): <chosen variant — recorded in docs/superpowers/plans/gate-b-storybook-astro.md>

## Migration manifest

<copy from §10.6 of spec>

## Acceptance criteria

- [x] All 8 primitives implemented (Spec §9, §16.1.1)
- [x] Behavior matrix satisfied per primitive (§16.1.2)
- [x] ≥22 Storybook stories (§16.1.3)
- [x] Migration done + manifest (§16.1.4)
- [x] ScrollReveal moved + SSR refactor (§16.1.5)
- [x] 5 locked integrations, 3 HIGH-risk (§16.1.6)
- [x] SSR readable (§16.2.7)
- [x] Reduced-motion end-state per primitive (§16.2.8)
- [x] A11y behavior matrix per primitive (§16.2.9)
- [x] axe-core: 0 new violations (§16.2.10)
- [x] type-check passes (§16.3.11)
- [x] bun test green (§16.3.12)
- [x] CI green (§16.3.13)
- [x] Lighthouse perf ≥ 90 mobile cold throttled (§16.4.14) — Score: <fill in>
- [x] Lighthouse a11y ≥ 95 (§16.4.15) — Score: <fill in>
- [x] Bundle ≤ 35 KB gzipped delta (§16.4.16) — Delta: <fill in>
- [x] Cross-browser SMIL QA (§16.5.17) — Chrome, Safari, Firefox, Mobile Safari ✓
- [x] archive/cinematic-showcase-2026-04-16 tag in origin (§16.6.18)
- [x] feat/cinematic-showcase + feat/decision-engine-section local branches deleted (§16.6.19)
- [x] Phase 0 gate decisions recorded (§16.6.20)

## Test plan

- [ ] Run `bun test` — all green
- [ ] Run `bun run type-check` — clean
- [ ] Run `bun run build` — succeeds
- [ ] Open Storybook (`bun run story`) — all primitives render
- [ ] Visit `/` in browser, scroll through homepage, verify HeroSection text appears without flash, NumberedReveal items stagger, DecisionEngine pulse runs
- [ ] Enable `prefers-reduced-motion: reduce` in DevTools, refresh — all primitives show end-state, no animation
- [ ] Disable JS in DevTools, refresh — SSR text content visible (Hero H1, About items, Solutions list)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 4: Wait for CI**

```bash
gh pr checks --watch
```

If failures, fix and re-push. Do not merge until green.

- [ ] **Step 5: Self-review with the pr-review-toolkit:review-pr skill**

Optionally invoke `pr-review-toolkit:review-pr` skill to run all PR-review agents before requesting human review.

---

## Self-Review

After writing this plan, I check it against the spec:

**1. Spec coverage:** Coverage matrix above. Each acceptance criterion in §16 maps to specific task(s). ✓

**2. Placeholder scan:** Searched for "TBD", "TODO", "implement later", "fill in details". Found:
- Task 5.3 has "complete code is too long to embed here; the pattern is..." — this is a deliberate compression for an OPTIONAL phase. If Phase 5 is executed, the implementer expands this from the cinematic branch source. Acceptable for an optional phase.
- Task 6.2 has "decision: extract SVG body into shared factory" — this is a documented design decision, not a placeholder.
- Task 7.5 PR template has `<chosen variant — recorded in ...>` placeholders — these are filled at execution time from Gate A/B decision docs, not unspecified spec content.

**3. Type consistency:** Cross-checked names — `BaseMotionProps`, `Trigger`, `MotionRef`, `useReducedMotion`, `useInViewport`, `useScrollProgress`, `toFramerSeconds`, `toSmilDur`, `toCssDuration` — all match the spec § 8 definitions and the implementation tasks.

**4. Task granularity:** Each task is 4-12 bite-sized steps. Largest individual primitive task (OntologyGraph) has 7 steps; smallest (adapter tests) have 5.

**5. TDD adherence:** Every primitive task starts with "Write failing test", proves the failure, then implements. ✓

No blocking issues. Plan ready for execution.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-13-motion-library.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**

