# Cinematic Showcase Section — Design Spec

**Date:** 2026-04-16
**Branch target:** `feat/cinematic-showcase` (to be created)
**Status:** Approved by user, ready for implementation planning

---

## 1. Intent

Add a scroll-driven cinematic showcase section between `HeroSection` and `SolutionsSection` on the homepage. The section tells a visual story of "global trade, redefined": an AI-generated image of chaotic traditional trade disintegrates into particles, which reform into an AI-generated image of an organized, network-driven modern trade system. A single manifesto sentence appears at the end.

The effect exists to carry meaning (chaos → order, platcoX's positioning), not as decoration. Per Nielsen Norman Group research, scroll-pinned animations succeed when they convey a narrative; they fail when used purely for "wow".

## 2. Scope

**In scope:**
- New Astro section component `CinematicShowcaseSection`
- WebGL shader-based metamorphosis effect (two textures + displacement via noise)
- Scroll-pin via GSAP ScrollTrigger, smooth scroll via Lenis (bare, not wrapper)
- Accessibility fallback for `prefers-reduced-motion` and non-WebGL browsers
- AI-generated image assets (A: chaos, B: order) + noise texture
- Manifesto copy: *"Global trade, redefined."*
- Responsive behavior (desktop / mobile)

**Out of scope:**
- Changes to `HeroSection`, `SolutionsSection`, or other sections
- Global smooth-scroll rollout (Lenis is introduced but used scoped to this section's scroll bridge; full-page smooth scroll is a separate decision)
- Audio / sound design
- Additional showcase variants or cinematic sections elsewhere on the site

## 3. Story & Choreography

### 3.1 Section position

Inserted in `src/pages/index.astro` between the existing hero and solutions sections. The section has a total scrollable height greater than the viewport (so it can be pinned while scroll progress drives the animation).

### 3.2 Pin duration

| Breakpoint | Total pin (scroll distance while pinned) |
|------------|-------------------------------------------|
| Desktop (≥ 768px) | 150vh |
| Mobile (< 768px) | 100vh |

Rationale: NNG research warns that pins exceeding ~50% of page height frustrate users. 150vh is within the safe range while still allowing a multi-stage animation to breathe. Mobile users resolve scroll faster; 100vh keeps it snappy.

### 3.3 Scroll progress stages

Progress value `p ∈ [0, 1]` drives the animation. Stages:

| Progress | Visual state | Opacity | Text |
|----------|--------------|---------|------|
| 0.00 – 0.15 | Image A (chaotic trade) at rest | 1.0 | — |
| 0.15 – 0.40 | A begins cracking; displacement amplitude 0 → 0.6 | 1.0 | — |
| 0.40 – 0.60 | Particle/dust field; maximum noise; mid-transition | 0.5 | — |
| 0.60 – 0.85 | Particles collapse into Image B arrangement | 1.0 | — |
| 0.85 – 1.00 | Image B (ordered network) at rest; manifesto fades in | 1.0 | *"Global trade, redefined."* |

### 3.4 Manifesto typography

- Font family: matches hero (`font-light` + `font-semibold` highlight on final word)
- Sizes: 48px / 72px / 96px across breakpoints
- Color: `foreground` token (existing Tailwind theme token)
- Animation: opacity 0 → 1 + slight y-translate (8px → 0) across `p ∈ [0.85, 1.0]`
- The word "redefined" is `font-semibold` to match the hero pattern (`Rede<span>fined</span>`)

## 4. Technical Architecture

### 4.1 Stack choices

| Concern | Choice | Reason |
|---------|--------|--------|
| WebGL wrapper | `@react-three/fiber` (R3F) + `@react-three/drei` | Mature React ecosystem, Suspense-aware, memory cleanup handled. OGL rejected due to thin ecosystem. |
| Scroll driver | GSAP + ScrollTrigger | Scrub-accurate pinning; de-facto standard. framer-motion's `useScroll` insufficient for shader uniform coordination. |
| Smooth scroll | Lenis (bare, singleton) | `ReactLenis` wrapper causes iOS framerate drops (GSAP forum reports). Integration via `lenis.on('scroll', ScrollTrigger.update)`. |
| Image format | WebP | Best size/quality tradeoff; universal 2026 support. |
| Fallback | Static crossfade via framer-motion (already in deps) | Zero new dependencies in reduced-motion path. |

### 4.2 New dependencies

```json
{
  "@react-three/fiber": "^9.x",
  "@react-three/drei": "^10.x",
  "three": "^0.170.x",
  "gsap": "^3.13.x",
  "lenis": "^1.2.x"
}
```

Installed via `bun add`. GSAP ScrollTrigger is included in the free GSAP distribution as of 2024; no license purchase required.

### 4.3 File structure

```
src/
├── components/
│   ├── CinematicShowcaseSection.astro          # Astro wrapper, SSR-safe skeleton
│   └── cinematic/
│       ├── ShowcaseCanvas.tsx                   # R3F <Canvas> root + Suspense
│       ├── DisintegrateMesh.tsx                 # Plane + ShaderMaterial
│       ├── DisintegrateShader.ts                # GLSL vertex + fragment strings
│       ├── useScrollProgress.ts                 # Hook bridging Lenis + ScrollTrigger → progress ref
│       ├── useReducedMotion.ts                  # matchMedia hook
│       └── ShowcaseFallback.tsx                 # prefers-reduced-motion + no-WebGL fallback
├── lib/
│   └── lenis-singleton.ts                      # App-wide single Lenis instance
└── pages/
    └── index.astro                              # Insert section between hero & solutions
public/
└── images/cinematic/
    ├── cinematic-a.webp                         # ~250KB, 2048×1152
    ├── cinematic-b.webp                         # ~250KB, 2048×1152
    └── noise.webp                               # ~30KB, 512×512 tileable
```

### 4.4 Data flow

```
Lenis singleton
  └─ lenis.on('scroll', ScrollTrigger.update)
        │
        ▼
GSAP ScrollTrigger
  trigger: #cinematic-showcase
  start: "top top"
  end: "+=150%" (desktop) / "+=100%" (mobile)
  pin: true
  scrub: 1
  onUpdate: (self) => progressRef.current = self.progress
        │
        ▼
ShowcaseCanvas (R3F useFrame every tick)
  material.uniforms.uProgress.value = progressRef.current
  material.uniforms.uTime.value += delta
        │
        ▼
DisintegrateShader (GPU)
  fragment:
    noise = texture(uNoise, vUv + uTime*0.01).rg
    disp = sin(uProgress * PI) * 0.6
    uv = vUv + (noise - 0.5) * disp
    colA = texture(uImageA, uv)
    colB = texture(uImageB, uv)
    mixFactor = smoothstep(0.4, 0.6, uProgress)
    color = mix(colA, colB, mixFactor)
    alpha *= 1.0 - smoothstep(0.45, 0.5, abs(uProgress - 0.5)) * 0.3
```

### 4.5 Shader implementation sketch

```glsl
// vertex.glsl
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
```

```glsl
// fragment.glsl
uniform sampler2D uImageA, uImageB, uNoise;
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
```

### 4.6 Astro / React integration

- `CinematicShowcaseSection.astro` renders the static skeleton (section element, min-height, layout container).
- Inside, `<ShowcaseCanvas client:visible />` — the `client:visible` directive defers hydration until the section scrolls into view, protecting hero LCP.
- The manifesto text renders in plain HTML (not inside the canvas) so it stays selectable, SEO-crawlable, and accessible to screen readers.

## 5. Performance

| Metric | Target | Strategy |
|--------|--------|----------|
| LCP | unchanged vs. current | Canvas hydrates only on `client:visible`; hero remains LCP element |
| CLS | 0 | Section has fixed `min-height`; canvas is absolutely positioned inside |
| Section asset weight | < 800KB gz | R3F tree-shaken; Three.js imports limited to `PlaneGeometry`, `ShaderMaterial`, `TextureLoader`; no bloat from drei helpers beyond what's used |
| FPS | 60 desktop / ≥ 30 mobile | Single plane + shader (no CPU particle loop); `planeSegments` tuned per breakpoint |
| WebGL context | Single context | R3F manages one `<Canvas>`; no Three.js elsewhere in app |

Key: this is **not** a particle system per pixel. The "particle" appearance comes from shader-driven UV displacement on a single plane mesh. This is the approach community research identified as GPU-friendly and mobile-safe.

## 6. Accessibility

- **`prefers-reduced-motion: reduce`** → `<ShowcaseFallback />` renders instead of the canvas. Fallback is a static two-image vertical layout: Image A stacked above Image B with short captions, and the manifesto below Image B. No scroll-linked animation, no crossfade — the reduced-motion preference takes precedence over the visual metaphor.
- **No WebGL context available** → same fallback (wrapped with `<ErrorBoundary>` around R3F canvas).
- **Manifesto text is real DOM**, not canvas-rendered; screen readers announce it.
- **Alt text** on both images: describes chaos/order metaphor meaningfully, not just "image".
- **Keyboard / focus** behavior: section is non-interactive content; focus is never trapped.
- **Pause control:** not needed — animation is scroll-linked, not auto-playing. User controls progression by scrolling.

## 7. Responsive & Mobile

| Property | Desktop (≥ 768px) | Mobile (< 768px) |
|----------|-------------------|------------------|
| Total pin scroll | 150vh | 100vh |
| `planeSegments` | 64×64 | 32×32 |
| Manifesto font size | 72 / 96px | 48px |
| Canvas DPR cap | 2 | 1.5 |

Mobile detection uses `useMediaQuery('(max-width: 768px)')` and `useMediaQuery('(pointer: coarse)')` combined where precision matters (e.g., touch-specific Lenis config).

## 8. Asset Specification

### 8.1 Image A — `cinematic-a.webp`

- Dimensions: 2048×1152 (16:9 cinematic)
- Size target: ≤ 250KB WebP, quality ~82
- Subject: chaotic traditional trade. Congested port at dusk, stacked shipping containers, paper documents mid-air, dense fog, warm low-key lighting with amber streetlights, analog film grain, moody color grading.
- Palette: deep blues, charcoal grays, amber accents.

### 8.2 Image B — `cinematic-b.webp`

- Dimensions: 2048×1152
- Size target: ≤ 250KB WebP, quality ~82
- Subject: abstract organized network. Glowing data nodes forming a structured supply chain, translucent geometric layers, clean modular architecture, floating holographic interfaces, soft cyan/white highlights, optimistic minimalist composition.
- Palette: light blues, white, cyan highlights.

### 8.3 Noise texture — `noise.webp`

- Dimensions: 512×512
- Size target: ≤ 30KB
- Grayscale Perlin/Simplex noise, seamlessly tileable.

### 8.4 Generation prompts (Nano Banana Pro 2)

> **A:** *"Cinematic wide-angle shot of a congested traditional port at dusk, stacked shipping containers, paper documents floating in wind, dense fog, orange streetlights, chaotic logistics, dramatic shadows, analog film grain, moody color grading, 2.39:1 aspect ratio"*

> **B:** *"Abstract digital network of glowing data nodes forming an organized supply chain, translucent geometric layers, soft cyan and white highlights, clean modular architecture, floating holographic interfaces, optimistic lighting, minimalist composition, 2.39:1 aspect ratio"*

## 9. Testing

- **Unit:** `src/components/__tests__/CinematicShowcase.test.tsx`
  - Renders `<ShowcaseFallback />` when `prefers-reduced-motion: reduce` is set
  - Manifesto text is always present in the DOM regardless of motion preference
- **Type:** `bun run type-check` must pass
- **Manual smoke:**
  - Chrome DevTools Rendering → FPS meter shows ≥ 55fps desktop during pin
  - Mobile emulation (iPhone 14) shows ≥ 28fps
  - Lighthouse on `/` shows LCP regression ≤ 100ms vs. current baseline
  - Section does not shift layout (CLS visible in DevTools)
  - Tabbing through the page does not trap focus in the section

## 10. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| LCP regression from R3F bundle | `client:visible` directive; canvas lazy-hydrates after hero paints |
| iOS scroll jank (Lenis wrapper bug) | Use bare Lenis; never adopt `ReactLenis` component wrapper |
| Bundle bloat from Three.js | Import only what's used; verify with `bun run build --analyze` (or equivalent) after integration |
| Missed reduced-motion branch | Automated test asserts fallback renders under the matching media query |
| Image weight inflating total page size | Hard cap 250KB per WebP; if generation output exceeds this, re-export at lower quality before committing |
| Shader fails on old GPUs | `<ErrorBoundary>` around canvas falls back to static crossfade |

## 11. Open Questions

None at this stage. The manifesto copy may be revisited during implementation if a stronger phrasing emerges from the visual context.

---

## Appendix A — Decisions Log

- **Location:** new section between `HeroSection` and `SolutionsSection` (user choice "A")
- **Visual content:** surreal AI-generated images (user choice "E")
- **Semantic pair:** old chaotic trade → new network-driven trade (user choice "1")
- **Choreography:** A disintegrates into particles, particles reform as B (user choice "C")
- **Text layer:** single manifesto at end (user choice "B")
- **Pin duration:** 150vh desktop / 100vh mobile (revised from initial 200vh after NNG research)
- **Technical approach:** WebGL shader via R3F (revised from raw OGL after Reddit/community research showed OGL ecosystem too thin)
