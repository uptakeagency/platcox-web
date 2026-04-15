# Cinematic Showcase Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a scroll-driven cinematic showcase section on the platcoX homepage that morphs between two AI-generated images (chaos → order) via a WebGL shader, with a manifesto fade-in, and an accessible static fallback for `prefers-reduced-motion`.

**Architecture:** A pinned section between `HeroSection` and `AboutSection`. Smooth scroll is handled by a bare Lenis singleton; a GSAP ScrollTrigger provides pin + scrub, pushing `progress` into a ref. A React Three Fiber `<Canvas>` (hydrated via `client:visible`) renders a single plane with a custom GLSL shader that displaces UVs by a noise texture and crossfades two image textures. On reduced-motion or WebGL failure, a static two-image fallback renders.

**Tech Stack:** Astro 6, React 19, @react-three/fiber 9, three 0.170+, @react-three/drei 10, gsap 3.13 (ScrollTrigger core), lenis 1.2, framer-motion 12 (already in deps), Tailwind CSS, bun:test, @testing-library/react.

**Reference spec:** `docs/superpowers/specs/2026-04-16-cinematic-showcase-design.md`

**Conventions in this codebase:**
- Test framework: `bun:test` + `@testing-library/react`, setup in `test-setup.ts` (jsdom)
- Run tests: `bun test <path>`
- Run type-check: `bun run type-check`
- Never run `bun dev` (dev server policy)
- Astro components use `client:visible` for hydration-on-scroll
- Existing test pattern: see `src/components/__tests__/ScrollReveal.test.tsx`

---

## File Structure

**New files (to create):**
```
src/
├── components/
│   ├── CinematicShowcaseSection.astro
│   ├── cinematic/
│   │   ├── ShowcaseCanvas.tsx
│   │   ├── DisintegrateMesh.tsx
│   │   ├── DisintegrateShader.ts
│   │   ├── useScrollProgress.ts
│   │   ├── useReducedMotion.ts
│   │   └── ShowcaseFallback.tsx
│   └── __tests__/
│       ├── useReducedMotion.test.tsx
│       ├── ShowcaseFallback.test.tsx
│       └── CinematicShowcaseSection.test.tsx
├── lib/
│   └── lenisSingleton.ts

public/images/cinematic/
├── cinematic-a.webp   (asset, placeholder until final generation)
├── cinematic-b.webp   (asset, placeholder until final generation)
└── noise.webp         (generated procedurally or downloaded)
```

**Modified files:**
```
src/pages/index.astro        (insert <CinematicShowcaseSection /> after <HeroSection />)
package.json                 (new deps)
```

---

## Task 1: Install new dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1.1: Install runtime deps**

Run:
```bash
bun add @react-three/fiber@^9 @react-three/drei@^10 three@^0.170 gsap@^3.13 lenis@^1.2
```

Expected: `package.json` updated; `bun.lockb` / `bun.lock` regenerated; install succeeds with no peer warnings other than optional ones.

- [ ] **Step 1.2: Install types for three**

Run:
```bash
bun add -d @types/three@^0.170
```

Expected: devDependencies updated.

- [ ] **Step 1.3: Verify type-check still passes**

Run:
```bash
bun run type-check
```

Expected: PASS (no new errors; we haven't used the libs yet).

- [ ] **Step 1.4: Commit**

```bash
git add package.json bun.lock* bun.lockb 2>/dev/null; git commit -m "chore: add R3F, three, gsap, lenis for cinematic showcase"
```

---

## Task 2: Add placeholder image assets

Reason for placeholders first: components import them; tests and type-check should not fail waiting on final AI generation. Final images replace the placeholders byte-for-byte before merge.

**Files:**
- Create: `public/images/cinematic/cinematic-a.webp`
- Create: `public/images/cinematic/cinematic-b.webp`
- Create: `public/images/cinematic/noise.webp`
- Create: `public/images/cinematic/README.md`

- [ ] **Step 2.1: Create directory**

Run:
```bash
mkdir -p public/images/cinematic
```

- [ ] **Step 2.2: Generate 3 solid-color placeholder webp files**

Run:
```bash
# Requires ImageMagick `magick` (preinstalled on most macOS setups).
# If absent, download any 3 arbitrary small webp files of matching dimensions.
magick -size 2048x1152 xc:"#1a3a5c" public/images/cinematic/cinematic-a.webp
magick -size 2048x1152 xc:"#d0e8f5" public/images/cinematic/cinematic-b.webp
magick -size 512x512 gradient:gray -attenuate 10 +noise Gaussian public/images/cinematic/noise.webp
```

Expected: three webp files exist; each under 100KB.

- [ ] **Step 2.3: Write README documenting the asset contract**

Write: `public/images/cinematic/README.md`
```markdown
# Cinematic Showcase Assets

These are placeholders. Before merging to `main`, replace with final AI-generated assets.

## Contract

| File | Dimensions | Max size | Content |
|------|-----------|----------|---------|
| `cinematic-a.webp` | 2048×1152 | 250KB | Chaotic traditional trade (see spec) |
| `cinematic-b.webp` | 2048×1152 | 250KB | Organized AI-driven trade network (see spec) |
| `noise.webp` | 512×512 | 30KB | Tileable grayscale noise |

## Generation prompts

See `docs/superpowers/specs/2026-04-16-cinematic-showcase-design.md` §8.4.
```

- [ ] **Step 2.4: Commit**

```bash
git add public/images/cinematic
git commit -m "chore: add cinematic showcase placeholder assets"
```

---

## Task 3: `useReducedMotion` hook + test (TDD)

**Files:**
- Create: `src/components/cinematic/useReducedMotion.ts`
- Create: `src/components/__tests__/useReducedMotion.test.tsx`

- [ ] **Step 3.1: Write the failing test**

Write: `src/components/__tests__/useReducedMotion.test.tsx`
```tsx
import { describe, it, expect } from "bun:test";
import { renderHook, act } from "@testing-library/react";
import { useReducedMotion } from "../cinematic/useReducedMotion";

function mockMatchMedia(matches: boolean) {
  const listeners: Array<(e: { matches: boolean }) => void> = [];
  (window as any).matchMedia = (_: string) => ({
    matches,
    media: "(prefers-reduced-motion: reduce)",
    addEventListener: (_ev: string, cb: (e: { matches: boolean }) => void) => listeners.push(cb),
    removeEventListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  });
  return {
    trigger: (v: boolean) => listeners.forEach((l) => l({ matches: v })),
  };
}

describe("useReducedMotion", () => {
  it("returns true when the media query matches", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it("returns false when the media query does not match", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it("updates when the media query changes", () => {
    const mm = mockMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
    act(() => mm.trigger(true));
    expect(result.current).toBe(true);
  });
});
```

- [ ] **Step 3.2: Run test to verify it fails**

Run:
```bash
bun test src/components/__tests__/useReducedMotion.test.tsx
```

Expected: FAIL — `Cannot find module '../cinematic/useReducedMotion'`.

- [ ] **Step 3.3: Implement the hook**

Write: `src/components/cinematic/useReducedMotion.ts`
```ts
import { useEffect, useState } from "react";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent | { matches: boolean }) =>
      setReduced(e.matches);
    mq.addEventListener("change", handler as (e: MediaQueryListEvent) => void);
    setReduced(mq.matches);
    return () => mq.removeEventListener("change", handler as (e: MediaQueryListEvent) => void);
  }, []);

  return reduced;
}
```

- [ ] **Step 3.4: Run tests — they pass**

Run:
```bash
bun test src/components/__tests__/useReducedMotion.test.tsx
```

Expected: PASS (3 tests).

- [ ] **Step 3.5: Commit**

```bash
git add src/components/cinematic/useReducedMotion.ts src/components/__tests__/useReducedMotion.test.tsx
git commit -m "feat(cinematic): add useReducedMotion hook"
```

---

## Task 4: `ShowcaseFallback` component + test (TDD)

This is the static reduced-motion/no-WebGL view. Two images stacked with the manifesto. Uses Tailwind tokens already in the project.

**Files:**
- Create: `src/components/cinematic/ShowcaseFallback.tsx`
- Create: `src/components/__tests__/ShowcaseFallback.test.tsx`

- [ ] **Step 4.1: Write the failing test**

Write: `src/components/__tests__/ShowcaseFallback.test.tsx`
```tsx
import { describe, it, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import ShowcaseFallback from "../cinematic/ShowcaseFallback";

describe("ShowcaseFallback", () => {
  it("renders both images with alt text", () => {
    render(<ShowcaseFallback />);
    const imgA = screen.getByAltText(/traditional.*trade/i);
    const imgB = screen.getByAltText(/network.*trade/i);
    expect(imgA).toBeTruthy();
    expect(imgB).toBeTruthy();
  });

  it("renders the manifesto copy", () => {
    render(<ShowcaseFallback />);
    expect(screen.getByText(/global trade/i)).toBeTruthy();
    expect(screen.getByText(/redefined/i)).toBeTruthy();
  });

  it("uses semantic img elements pointing to the cinematic assets", () => {
    const { container } = render(<ShowcaseFallback />);
    const srcs = Array.from(container.querySelectorAll("img")).map((n) => n.getAttribute("src"));
    expect(srcs).toContain("/images/cinematic/cinematic-a.webp");
    expect(srcs).toContain("/images/cinematic/cinematic-b.webp");
  });
});
```

- [ ] **Step 4.2: Run test to verify it fails**

Run:
```bash
bun test src/components/__tests__/ShowcaseFallback.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 4.3: Implement the component**

Write: `src/components/cinematic/ShowcaseFallback.tsx`
```tsx
export default function ShowcaseFallback() {
  return (
    <div className="flex flex-col items-center gap-8 py-16 px-6">
      <figure className="w-full max-w-4xl">
        <img
          src="/images/cinematic/cinematic-a.webp"
          alt="Traditional trade: a congested port at dusk with stacked shipping containers and paper documents"
          width={2048}
          height={1152}
          loading="lazy"
          className="w-full h-auto rounded"
        />
        <figcaption className="mt-2 text-sm text-muted">Traditional trade</figcaption>
      </figure>

      <figure className="w-full max-w-4xl">
        <img
          src="/images/cinematic/cinematic-b.webp"
          alt="Redefined network trade: a luminous, organized supply chain of glowing nodes"
          width={2048}
          height={1152}
          loading="lazy"
          className="w-full h-auto rounded"
        />
        <figcaption className="mt-2 text-sm text-muted">Trade, redefined</figcaption>
      </figure>

      <p className="text-center text-4xl md:text-6xl lg:text-7xl font-light leading-tight tracking-tight">
        Global trade, <span className="font-semibold">redefined.</span>
      </p>
    </div>
  );
}
```

- [ ] **Step 4.4: Run tests — they pass**

Run:
```bash
bun test src/components/__tests__/ShowcaseFallback.test.tsx
```

Expected: PASS (3 tests).

- [ ] **Step 4.5: Commit**

```bash
git add src/components/cinematic/ShowcaseFallback.tsx src/components/__tests__/ShowcaseFallback.test.tsx
git commit -m "feat(cinematic): add reduced-motion fallback component"
```

---

## Task 5: Lenis singleton

Bare Lenis instance shared across the app. NOT a React context / wrapper component. Only initialized in the browser.

**Files:**
- Create: `src/lib/lenisSingleton.ts`

- [ ] **Step 5.1: Implement the singleton**

Write: `src/lib/lenisSingleton.ts`
```ts
import Lenis from "lenis";

let instance: Lenis | null = null;
let rafId: number | null = null;

export function getLenis(): Lenis | null {
  if (typeof window === "undefined") return null;
  if (instance) return instance;

  instance = new Lenis({
    duration: 1.1,
    smoothWheel: true,
    syncTouch: true,
    touchMultiplier: 1.2,
  });

  const loop = (time: number) => {
    instance?.raf(time);
    rafId = requestAnimationFrame(loop);
  };
  rafId = requestAnimationFrame(loop);

  return instance;
}

export function destroyLenis(): void {
  if (rafId !== null) cancelAnimationFrame(rafId);
  instance?.destroy();
  instance = null;
  rafId = null;
}
```

- [ ] **Step 5.2: Type-check**

Run:
```bash
bun run type-check
```

Expected: PASS.

- [ ] **Step 5.3: Commit**

```bash
git add src/lib/lenisSingleton.ts
git commit -m "feat(cinematic): add bare Lenis singleton"
```

---

## Task 6: `useScrollProgress` hook

Bridges a GSAP ScrollTrigger pin+scrub to a ref updated on every scroll event. Subscribes Lenis to ScrollTrigger.update so smooth scroll and pinning stay in sync.

**Files:**
- Create: `src/components/cinematic/useScrollProgress.ts`

- [ ] **Step 6.1: Implement the hook**

Write: `src/components/cinematic/useScrollProgress.ts`
```ts
import { useEffect, useRef, type MutableRefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getLenis } from "../../lib/lenisSingleton";

gsap.registerPlugin(ScrollTrigger);

export interface UseScrollProgressOptions {
  triggerSelector: string;
  pinDistanceDesktop: string; // e.g. "+=150%"
  pinDistanceMobile: string;  // e.g. "+=100%"
  mobileQuery?: string;       // default: "(max-width: 767px)"
}

export function useScrollProgress(opts: UseScrollProgressOptions): MutableRefObject<number> {
  const progress = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = document.querySelector(opts.triggerSelector);
    if (!el) return;

    const mq = window.matchMedia(opts.mobileQuery ?? "(max-width: 767px)");
    const end = mq.matches ? opts.pinDistanceMobile : opts.pinDistanceDesktop;

    const lenis = getLenis();
    const onLenisScroll = () => ScrollTrigger.update();
    lenis?.on("scroll", onLenisScroll);

    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end,
      pin: true,
      scrub: 1,
      onUpdate: (self) => {
        progress.current = self.progress;
      },
    });

    return () => {
      st.kill();
      lenis?.off("scroll", onLenisScroll);
    };
  }, [opts.triggerSelector, opts.pinDistanceDesktop, opts.pinDistanceMobile, opts.mobileQuery]);

  return progress;
}
```

- [ ] **Step 6.2: Type-check**

Run:
```bash
bun run type-check
```

Expected: PASS.

- [ ] **Step 6.3: Commit**

```bash
git add src/components/cinematic/useScrollProgress.ts
git commit -m "feat(cinematic): add useScrollProgress hook bridging Lenis + ScrollTrigger"
```

---

## Task 7: `DisintegrateShader` module (GLSL strings)

Pure module, no React. Exports `vertex` and `fragment` string constants.

**Files:**
- Create: `src/components/cinematic/DisintegrateShader.ts`

- [ ] **Step 7.1: Write the shader strings**

Write: `src/components/cinematic/DisintegrateShader.ts`
```ts
export const vertex = /* glsl */ `
uniform float uProgress;
uniform sampler2D uNoise;
uniform float uTime;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 pos = position;
  vec2 n = texture2D(uNoise, uv + uTime * 0.01).rg - 0.5;
  float burst = sin(uProgress * 3.14159) * 0.15;
  pos.xy += n * burst;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const fragment = /* glsl */ `
uniform sampler2D uImageA;
uniform sampler2D uImageB;
uniform sampler2D uNoise;
uniform float uProgress;
uniform float uTime;
varying vec2 vUv;

void main() {
  vec2 noise = texture2D(uNoise, vUv + uTime * 0.01).rg;
  float disp = sin(uProgress * 3.14159) * 0.6;
  vec2 uv = vUv + (noise - 0.5) * disp;

  vec4 colA = texture2D(uImageA, uv);
  vec4 colB = texture2D(uImageB, uv);
  float mixFactor = smoothstep(0.4, 0.6, uProgress);
  vec4 col = mix(colA, colB, mixFactor);

  float dimAtMid = 1.0 - smoothstep(0.45, 0.5, abs(uProgress - 0.5)) * 0.3;
  col.a *= dimAtMid;

  gl_FragColor = col;
}
`;
```

- [ ] **Step 7.2: Type-check**

Run:
```bash
bun run type-check
```

Expected: PASS.

- [ ] **Step 7.3: Commit**

```bash
git add src/components/cinematic/DisintegrateShader.ts
git commit -m "feat(cinematic): add disintegrate GLSL shader"
```

---

## Task 8: `DisintegrateMesh` R3F component

Renders the plane with the shader material. Consumes a `progressRef` (from `useScrollProgress`) and updates uniforms each frame.

**Files:**
- Create: `src/components/cinematic/DisintegrateMesh.tsx`

- [ ] **Step 8.1: Implement the mesh**

Write: `src/components/cinematic/DisintegrateMesh.tsx`
```tsx
import { useMemo, useRef, type MutableRefObject } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { TextureLoader, ShaderMaterial, type Mesh } from "three";
import { vertex, fragment } from "./DisintegrateShader";

interface DisintegrateMeshProps {
  progressRef: MutableRefObject<number>;
  imageA: string;
  imageB: string;
  noise: string;
  segments?: number;
}

export default function DisintegrateMesh({
  progressRef,
  imageA,
  imageB,
  noise,
  segments = 64,
}: DisintegrateMeshProps) {
  const meshRef = useRef<Mesh>(null);

  const [texA, texB, texNoise] = useLoader(TextureLoader, [imageA, imageB, noise]);

  const material = useMemo(() => {
    return new ShaderMaterial({
      uniforms: {
        uImageA: { value: texA },
        uImageB: { value: texB },
        uNoise:  { value: texNoise },
        uProgress: { value: 0 },
        uTime: { value: 0 },
      },
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
    });
  }, [texA, texB, texNoise]);

  useFrame((_state, delta) => {
    material.uniforms.uProgress.value = progressRef.current;
    material.uniforms.uTime.value += delta;
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[16, 9, segments, segments]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
```

- [ ] **Step 8.2: Type-check**

Run:
```bash
bun run type-check
```

Expected: PASS.

- [ ] **Step 8.3: Commit**

```bash
git add src/components/cinematic/DisintegrateMesh.tsx
git commit -m "feat(cinematic): add R3F mesh with shader material"
```

---

## Task 9: `ShowcaseCanvas` — R3F root with Suspense + ErrorBoundary

Wraps the R3F `<Canvas>`, handles the reduced-motion branch, suspends during texture load, and falls back to `ShowcaseFallback` if WebGL errors.

**Files:**
- Create: `src/components/cinematic/ShowcaseCanvas.tsx`

- [ ] **Step 9.1: Implement the canvas root**

Write: `src/components/cinematic/ShowcaseCanvas.tsx`
```tsx
import { Component, Suspense, useState, useEffect, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import DisintegrateMesh from "./DisintegrateMesh";
import ShowcaseFallback from "./ShowcaseFallback";
import { useReducedMotion } from "./useReducedMotion";
import { useScrollProgress } from "./useScrollProgress";

const IMAGE_A = "/images/cinematic/cinematic-a.webp";
const IMAGE_B = "/images/cinematic/cinematic-b.webp";
const NOISE   = "/images/cinematic/noise.webp";

class WebGLBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { errored: boolean }> {
  state = { errored: false };
  static getDerivedStateFromError() { return { errored: true }; }
  componentDidCatch(err: Error) { console.warn("[ShowcaseCanvas] WebGL error:", err.message); }
  render() { return this.state.errored ? this.props.fallback : this.props.children; }
}

export default function ShowcaseCanvas() {
  const reduced = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const progressRef = useScrollProgress({
    triggerSelector: "#cinematic-showcase",
    pinDistanceDesktop: "+=150%",
    pinDistanceMobile: "+=100%",
  });

  if (reduced) return <ShowcaseFallback />;

  return (
    <WebGLBoundary fallback={<ShowcaseFallback />}>
      <Canvas
        dpr={isMobile ? 1.5 : 2}
        camera={{ position: [0, 0, 10], fov: 42 }}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <DisintegrateMesh
            progressRef={progressRef}
            imageA={IMAGE_A}
            imageB={IMAGE_B}
            noise={NOISE}
            segments={isMobile ? 32 : 64}
          />
        </Suspense>
      </Canvas>
    </WebGLBoundary>
  );
}
```

- [ ] **Step 9.2: Type-check**

Run:
```bash
bun run type-check
```

Expected: PASS.

- [ ] **Step 9.3: Commit**

```bash
git add src/components/cinematic/ShowcaseCanvas.tsx
git commit -m "feat(cinematic): add canvas root with reduced-motion and WebGL fallback"
```

---

## Task 10: `CinematicShowcaseSection.astro` — the Astro wrapper

Static skeleton: section element with `id="cinematic-showcase"`, fixed min-height, absolute-positioned canvas holder, absolute-positioned manifesto text as real DOM.

**Files:**
- Create: `src/components/CinematicShowcaseSection.astro`

- [ ] **Step 10.1: Implement the section**

Write: `src/components/CinematicShowcaseSection.astro`
```astro
---
import ShowcaseCanvas from "./cinematic/ShowcaseCanvas.tsx";
---

<section
  id="cinematic-showcase"
  class="relative overflow-hidden"
  style="min-height: 100vh;"
  aria-label="Cinematic showcase: traditional trade transformed into a network-driven system"
>
  <div class="absolute inset-0">
    <ShowcaseCanvas client:visible />
  </div>

  <div
    id="cinematic-manifesto"
    class="pointer-events-none absolute inset-x-0 bottom-[12%] flex justify-center px-6 opacity-0 transition-opacity duration-700"
    data-manifesto
  >
    <p class="text-center text-4xl font-light leading-tight tracking-tight md:text-6xl lg:text-7xl">
      Global trade, <span class="font-semibold">redefined.</span>
    </p>
  </div>
</section>

<script>
  // Reveal the manifesto when the section has scrolled past ~85% of its pin distance.
  // Lightweight; does not depend on GSAP (avoids double-animating from the canvas side).
  const section = document.getElementById("cinematic-showcase");
  const manifesto = document.querySelector<HTMLElement>("[data-manifesto]");
  if (section && manifesto) {
    const onScroll = () => {
      const rect = section.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const traveled = Math.min(Math.max(-rect.top, 0), total);
      const progress = total > 0 ? traveled / total : 0;
      manifesto.style.opacity = progress > 0.85 ? "1" : "0";
      manifesto.style.transform = `translateY(${progress > 0.85 ? 0 : 8}px)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
</script>
```

- [ ] **Step 10.2: Type-check**

Run:
```bash
bun run type-check
```

Expected: PASS.

- [ ] **Step 10.3: Commit**

```bash
git add src/components/CinematicShowcaseSection.astro
git commit -m "feat(cinematic): add Astro section wrapper with manifesto"
```

---

## Task 11: Wire section into the homepage

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 11.1: Add import + insert component**

Edit: `src/pages/index.astro`

Replace the existing import block to include the new section:
```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import Header from "../components/Header.astro";
import HeroSection from "../components/HeroSection.astro";
import CinematicShowcaseSection from "../components/CinematicShowcaseSection.astro";
import AboutSection from "../components/AboutSection.astro";
import PhilosophySection from "../components/PhilosophySection.astro";
import SolutionsSection from "../components/SolutionsSection.astro";
import DecisionEngineSection from "../components/DecisionEngineSection.astro";
import ClientsWhySection from "../components/ClientsWhySection.astro";
import SustainabilitySection from "../components/SustainabilitySection.astro";
import TestimonialsSection from "../components/TestimonialsSection.astro";
import NewsSection from "../components/NewsSection.astro";
import ContactSection from "../components/ContactSection.astro";
import LocationsSection from "../components/LocationsSection.astro";
import DualCTA from "../components/DualCTA.astro";
import Footer from "../components/Footer.astro";
---

<BaseLayout>
  <Header />
  <main>
    <HeroSection />
    <CinematicShowcaseSection />
    <AboutSection />
    <PhilosophySection />
    <SolutionsSection />
    <DecisionEngineSection />
    <ClientsWhySection />
    <SustainabilitySection />
    <TestimonialsSection />
    <NewsSection />
    <ContactSection />
    <LocationsSection />
    <DualCTA />
  </main>
  <Footer />
</BaseLayout>
```

- [ ] **Step 11.2: Type-check**

Run:
```bash
bun run type-check
```

Expected: PASS.

- [ ] **Step 11.3: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat(cinematic): insert showcase section on homepage between Hero and About"
```

---

## Task 12: Integration test — section mounts fallback under reduced motion

This is the single high-value end-to-end-ish test. It verifies the whole chain: reduced-motion → fallback render → manifesto + images present.

**Files:**
- Create: `src/components/__tests__/CinematicShowcaseSection.test.tsx`

- [ ] **Step 12.1: Write the test**

Write: `src/components/__tests__/CinematicShowcaseSection.test.tsx`
```tsx
import { describe, it, expect, beforeEach } from "bun:test";
import { render, screen } from "@testing-library/react";
import ShowcaseCanvas from "../cinematic/ShowcaseCanvas";

function setMatchMedia(matchesByQuery: Record<string, boolean>) {
  (window as any).matchMedia = (q: string) => ({
    matches: matchesByQuery[q] ?? false,
    media: q,
    addEventListener: () => {},
    removeEventListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  });
}

describe("ShowcaseCanvas integration", () => {
  beforeEach(() => {
    setMatchMedia({});
  });

  it("renders the static fallback when prefers-reduced-motion is set", () => {
    setMatchMedia({ "(prefers-reduced-motion: reduce)": true });
    render(<ShowcaseCanvas />);
    expect(screen.getByAltText(/traditional.*trade/i)).toBeTruthy();
    expect(screen.getByAltText(/network.*trade/i)).toBeTruthy();
    expect(screen.getByText(/redefined/i)).toBeTruthy();
  });

  it("does NOT render a <canvas> element in the reduced-motion branch", () => {
    setMatchMedia({ "(prefers-reduced-motion: reduce)": true });
    const { container } = render(<ShowcaseCanvas />);
    expect(container.querySelector("canvas")).toBeNull();
  });
});
```

- [ ] **Step 12.2: Run the test**

Run:
```bash
bun test src/components/__tests__/CinematicShowcaseSection.test.tsx
```

Expected: PASS (2 tests).

- [ ] **Step 12.3: Run the full suite — nothing else broke**

Run:
```bash
bun test
```

Expected: PASS (all tests, including the new ones and the existing ContactForm / MobileMenu / ScrollReveal / TestimonialsCarousel suites).

- [ ] **Step 12.4: Commit**

```bash
git add src/components/__tests__/CinematicShowcaseSection.test.tsx
git commit -m "test(cinematic): verify fallback path under prefers-reduced-motion"
```

---

## Task 13: Type-check + build validation

**Files:**
- (no code changes)

- [ ] **Step 13.1: Run full type-check**

Run:
```bash
bun run type-check
```

Expected: PASS, zero errors.

- [ ] **Step 13.2: Run a capped build**

Run:
```bash
timeout 120 bun run build
```

Expected: build completes under 2 minutes; exit 0; `dist/` produced. If the build warns about bundle size for R3F/three, note the size in the commit message but do not block (the assets are dynamically imported via `client:visible`, so hero LCP is protected).

- [ ] **Step 13.3: No commit needed (validation only)**

---

## Task 14: Replace placeholder assets with final AI-generated images

This is the LAST task before merge. Skip only if the user explicitly wants to ship the color placeholders for a staging preview.

**Files:**
- Overwrite: `public/images/cinematic/cinematic-a.webp`
- Overwrite: `public/images/cinematic/cinematic-b.webp`
- Optional: `public/images/cinematic/noise.webp` (only if a hand-authored noise is preferred)

- [ ] **Step 14.1: Generate Image A via Nano Banana Pro 2**

Prompt (from spec §8.4):
> *"Cinematic wide-angle shot of a congested traditional port at dusk, stacked shipping containers, paper documents floating in wind, dense fog, orange streetlights, chaotic logistics, dramatic shadows, analog film grain, moody color grading, 2.39:1 aspect ratio"*

Export 2048×1152, convert to WebP quality ~82, verify size ≤ 250KB.

- [ ] **Step 14.2: Generate Image B via Nano Banana Pro 2**

Prompt (from spec §8.4):
> *"Abstract digital network of glowing data nodes forming an organized supply chain, translucent geometric layers, soft cyan and white highlights, clean modular architecture, floating holographic interfaces, optimistic lighting, minimalist composition, 2.39:1 aspect ratio"*

Export 2048×1152, convert to WebP quality ~82, verify size ≤ 250KB.

- [ ] **Step 14.3: Drop files into `public/images/cinematic/`**

Replace the placeholder `cinematic-a.webp` and `cinematic-b.webp`. Verify sizes:
```bash
ls -lh public/images/cinematic/*.webp
```
Expected: each ≤ 250KB.

- [ ] **Step 14.4: Visual smoke check**

Run:
```bash
timeout 120 bun run build
```

Start a preview and inspect the homepage manually:
```bash
bun run preview
```

In a browser: scroll through the homepage, verify the shader morph plays smoothly, that pin + scrub work, that the manifesto appears near the end, and that iOS Simulator or mobile emulation holds ≥ 28 fps. Stop the preview when done (Ctrl-C).

- [ ] **Step 14.5: Commit**

```bash
git add public/images/cinematic/*.webp
git commit -m "feat(cinematic): add final AI-generated images"
```

---

## Self-Review Checklist (already run)

- **Spec coverage:**
  - §3 Story & Choreography → Tasks 8, 10 (shader progress + manifesto reveal)
  - §4 Technical Architecture → Tasks 1, 5, 6, 8, 9, 10
  - §5 Performance → Tasks 8 (segments/DPR), 10 (client:visible), 13 (build check)
  - §6 Accessibility → Tasks 3, 4, 9, 12
  - §7 Responsive → Tasks 6 (mobile pin), 9 (DPR, segments)
  - §8 Assets → Tasks 2, 14
  - §9 Testing → Tasks 3, 4, 12, 13
  - §10 Risks → Tasks 9 (ErrorBoundary), 10 (client:visible), 13 (build cap)
- **Placeholders:** none; all code shown in full.
- **Type consistency:**
  - `progressRef: MutableRefObject<number>` consistent between `useScrollProgress`, `DisintegrateMesh`, `ShowcaseCanvas`
  - `getLenis()` return type `Lenis | null` handled in `useScrollProgress`
  - Asset paths `/images/cinematic/cinematic-a.webp` consistent between `ShowcaseCanvas`, `ShowcaseFallback`, test assertions
  - Manifesto copy *"Global trade, redefined."* consistent between `CinematicShowcaseSection.astro`, `ShowcaseFallback.tsx`, tests

No issues found.
