# Phase 0 Gate A — `.astro` Test Lane Decision

**Date decided:** 2026-05-13
**Decided by:** Phase 0 research (controller-driven, no implementer subagent dispatch)
**Status:** RESOLVED — Candidate **B3** selected

---

## Question

Which lane do we use to test TradeRoute and SketchStroke (the two Astro primitives planned for Phase 1)?

## Candidates considered

| ID | Approach | Status |
|---|---|---|
| **B1** | Astro Container API (`experimental_AstroContainer`) + `bun:test` | ❌ rejected — not supported |
| **B2** | Snapshot of `.astro` static output + manual Storybook QA | ⚠️ viable but inferior |
| **B3** | Convert primitives to React `.tsx` → uniform Lane A (`bun:test` + `jsdom` + `@testing-library/react`) | ✅ **selected** |

## Findings — Astro Container API

Source: https://docs.astro.build/en/reference/container-reference/ (fetched 2026-05-13)

| Question | Answer |
|---|---|
| Stability marker | **"This API is experimental and subject to breaking changes, even in minor or patch releases."** |
| Added in | Astro 4.9.0 (we are on 6.1.3, version OK) |
| Import path | `import { experimental_AstroContainer } from "astro/container"` |
| Test runner compatibility | **"Currently scoped to allow testing of `.astro` component output in `vite` environments such as `vitest`."** No mention of `bun:test`. |
| SMIL animation execution | Not addressed in docs (jsdom limitation regardless) |
| Known limitations | Experimental, may break in minor/patch releases; manual renderer imports for non-Vite environments |

## Rationale for B3

Three factors pushed the decision to **B3 (convert to React `.tsx`)**:

1. **Container API stability risk.** Astro explicitly warns the API may break in minor or patch releases. Motion library is intended to last through 2027-2028 (per spec §17.Q3); pinning a test lane to an experimental API guarantees future churn.

2. **Toolchain mismatch.** Container API is scoped to Vite-based runners (Vitest). Our test runner is `bun:test`. Adopting B1 would require either:
   - Adding Vitest as a second test runner (test infrastructure split — bad), OR
   - Hoping `bun:test`'s Vite-compatible mode handles `astro/container` (undocumented, fragile).

3. **Bundle delta is marginal.** The "minimum-JS" claim of `.astro` primitives was attractive but contextually weak:
   - WorldMap, DecisionEngineDemo, MobileMenu, TestimonialsCarousel are already React islands → every page already ships a React runtime.
   - TradeRoute as `.tsx` adds ~2-3 KB gzipped per page that uses it. For a single-use site like platcoX (one homepage), this is invisible.
   - SMIL `<animate>` elements still work inside React-rendered SVG — no animation pipeline change.

## Implications for the rest of the plan

The following plan tasks change:

- **Task 1.1 (TradeRoute):** `.astro` → `.tsx`. Tests use Lane A. Storybook story file `TradeRoute.stories.tsx` (not `.ts`), full React-renderer support.
- **Task 1.2 (SketchStroke):** Same change.
- **§5.2.1 of spec ("minimum-JS Astro primitive contract"):** No longer applies. The sayfa-düzeyi motion observer script in BaseLayout still ships (for `data-motion-trigger` attribute coordination), but its consumers are React components that call `window.__motionObserver` from `useEffect` instead of declarative attribute reliance.
- **§5.1 file tree:** `primitives/TradeRoute.astro` → `primitives/TradeRoute.tsx`, same for SketchStroke. Tests use `.test.tsx` and React Testing Library APIs.
- **§12.2 Storybook story criteria:** Renderer-aware split is no longer needed (Gate B may still split based on its own outcome). All 8 primitives become "React" for Storybook purposes.
- **§14 Phase 1 estimate:** Marginally lower (~30 min) because `.tsx` is the team's default rendering target — no separate Astro-specific test learning curve.

## Decision

**Selected:** B3 (convert TradeRoute and SketchStroke to React `.tsx`).

This decision is final unless a future spec revision explicitly reopens it.

## Follow-up actions

- [x] Record this decision in this file.
- [ ] When Task 1.1 starts, implementer subagent receives this decision as part of its dispatch context.
- [ ] When Task 1.2 starts, same.
- [ ] Phase 0 Task 0.5 (motion/ scaffold) creates `primitives/TradeRoute.tsx` and `primitives/SketchStroke.tsx` stubs (empty files) instead of `.astro` files.
- [ ] PR description (Task 7.5) cites this decision and links to this file.
