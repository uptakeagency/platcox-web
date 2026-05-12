# Phase 0 Gate B — Storybook + Astro Decision

**Date decided:** 2026-05-13
**Decided by:** Phase 0 research (controller-driven)
**Status:** RESOLVED — Candidate **B** selected (no Storybook in v1; dev-only playground)

---

## Question

How do we document, demo, and visually verify motion primitives during development?

## Candidates considered

| ID | Approach | Status |
|---|---|---|
| **A** | Storybook 10 React-vite installed alongside Astro | ⚠️ Astro not in official Storybook framework list; compatibility unknown |
| **B** | Dev-only `src/pages/_motion-playground.astro` (underscore prefix excludes from production build) | ✅ **selected** |
| C | Histoire 1.x (Vite-native, lighter) | rejected — Gate A B3 made all primitives React; Storybook patterns are more common; if we add a playground tool later, defer the choice to v2 |

## Findings

Sources:
- https://storybook.js.org/docs/get-started/install (fetched 2026-05-13)
- Gate A decision (sister doc) — all 8 primitives are now React `.tsx`

| Question | Answer |
|---|---|
| Storybook current major | 10.3 |
| Node requirement | 20+ (we are on v25.4.0, OK) |
| Astro in official framework list | **No.** Supported list: Angular, Ember, HTML, Next.js, Nuxt, Preact, Qwik, React, React Native, Solid, Svelte, SvelteKit, Vue 3, Web Components. Astro is absent. |
| React-vite + Astro 6 combination | Not documented; would require manual `vite.config.ts` shaping; subtle compatibility risk |
| `@storybook/addon-a11y` compat | Generic addon; should work with React-vite, but unverified in Astro context |
| Gate A impact | All 8 primitives are React `.tsx` now → `@storybook-astro/framework` is moot; only Storybook React-vite vs no-Storybook remains |

## Rationale for B

Three factors:

1. **Compatibility risk vs. value.** Setting up Storybook 10 inside an Astro 6 project is undocumented territory. Even if it works, debugging it costs Phase 0 hours that don't go into primitives.

2. **Playground is sufficient for v1.** Eight primitives can be demonstrated on a single dev-only Astro page. Stakeholders viewing demos don't need Storybook's controls — they need to see motion in context. Static variants in a grid layout suffice.

3. **Astro's underscore-prefix-not-built convention is elegant.** `src/pages/_motion-playground.astro` exists in dev (`/motion-playground` URL), zero production bundle impact. No deps, no config, no maintenance.

## Implications for the rest of the plan

The following plan tasks change:

- **Task 0.15 (Storybook setup):** Renamed to "Playground page setup". Replaces all Storybook install/config work with creating `src/pages/_motion-playground.astro` shell.
- **Per-primitive story tasks (Tasks 1.x, 2.x, 3.x, 4.x):** Replace "Create `*.stories.tsx`" with "Add primitive entry to playground". Each primitive contributes a section to `_motion-playground.astro`.
- **§12.2 of spec (≥22 stories acceptance criterion):** Revised to "≥22 visible variants in the playground" (2-3 variants per primitive). The acceptance count is preserved; the medium changes.
- **§16.1.3 of spec:** "Per-primitive Storybook stories" → "Per-primitive playground variants". Same coverage requirement.
- **Phase 0 estimate:** Lower by 2-3 hours (Storybook install + config was the largest single Phase 0 line item).
- **Phase 7 polish:** Storybook MDX docs replaced by inline comments + the playground page itself. README links to playground URL.

## Decision

**Selected:** B (no Storybook in v1; dev-only `_motion-playground.astro`).

Storybook may be re-evaluated for motion library v2 once Astro ecosystem support matures.

## Follow-up actions

- [x] Record this decision in this file.
- [ ] Task 0.15 simplifies to a one-step playground page creation.
- [ ] Primitive tasks include "append to playground" sub-step instead of writing `.stories.tsx`.
- [ ] PR description (Task 7.5) cites this decision and links to this file.
- [ ] Phase 7 polish includes README pointer to `http://localhost:4321/motion-playground` for dev demos.
