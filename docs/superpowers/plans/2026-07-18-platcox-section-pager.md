# Platcox Section Pager — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Masaüstünde fullPage-style section pager (her wheel/klavye hareketi = bir bölüm; uzun bölümler iç-kaydırıp geçer) + sağda nokta nav. Lenis Snap denemesi kaldırılır.

**Architecture:** Saf TS `nextTarget()` (TDD) hedef-hesaplama + `createSectionPager()` controller (wheel/key niyet, debounce, `lenis.scrollTo`) + `SectionNav.astro` (nokta nav, IntersectionObserver). BaseLayout'ta masaüstü + non-reduced guard'lı kurulur.

**Tech Stack:** Lenis (mevcut), Astro, bun test, TypeScript.

**Design source:** `~/Projects/platcox-web-snap/docs/superpowers/specs/2026-07-18-platcox-section-pager-design.md`
**Worktree:** `~/Projects/platcox-web-snap` (branch `feat/scroll-snap`).

## Global Constraints

- Pager YALNIZ masaüstü: `matchMedia('(min-width:768px) and (pointer:fine)').matches && !prefers-reduced-motion`. Aksi → native scroll, pager+nav kurulmaz.
- Uzun bölüm (`height > viewport`) iç-kaydırır, sonra geçer — içerik gizlenmez.
- Header offset ~80px (fixed header).
- Mevcut 129 test kırılmaz; type-check 0; build 5 sayfa.
- **Feel deploy'dan önce kullanıcıyla lokalde tune edilir** (sabitler: debounce, intra-step oranı, duration).

---

### Task 1: Snap denemesini kaldır + spec/plan commit

**Files:** Modify `src/layouts/BaseLayout.astro`; commit docs.

- [ ] **Step 1: BaseLayout'tan Lenis Snap bloğunu kaldır**

`src/layouts/BaseLayout.astro` içindeki script'te `import Snap from "lenis/snap";` ve `const snap = new Snap(...) ... snap.addElements(...)` bloğunu sil; geriye sadece:
```astro
      import { getLenis } from "../lib/lenisSingleton";
      const reduceMotion = window.matchMedia?.(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (!reduceMotion) {
        getLenis();
      }
```
kalsın (orijinal hâli). (Pager Task 5'te buraya eklenecek.)

- [ ] **Step 2: type-check + commit**

Run: `cd ~/Projects/platcox-web-snap && bun run type-check`
Expected: 0 error.
```bash
git add src/layouts/BaseLayout.astro docs/superpowers/
git commit -m "chore(scroll): revert Lenis Snap deneme + section-pager spec/plan"
```

---

### Task 2: `nextTarget` saf hedef-hesaplama (TDD)

**Files:** Create `src/lib/sectionPager.ts` (tipler + `nextTarget`), Test `src/lib/sectionPager.test.ts`.

**Interfaces (Produces):**
```ts
export interface SectionRect { top: number; height: number }
export interface PagerState {
  scrollY: number;
  viewport: number;
  headerOffset: number;
  sections: SectionRect[];
  direction: 1 | -1;
}
export interface PagerTarget { scrollTo: number; index: number }
export function nextTarget(state: PagerState): PagerTarget | null;
```
Kurallar: aktif bölüm = `scrollY + headerOffset`'in düştüğü section. `down`: bölümün altı görünmüyorsa (`sections[i].top + height > scrollY + viewport + 4`) iç-adım (`scrollTo = min(scrollY + viewport*0.85, top+height-viewport)`, index=i); yoksa next (`scrollTo = sections[i+1].top - headerOffset`, index=i+1; son bölümde `null`). `up` simetrik: bölümün üstü görünmüyorsa (`sections[i].top < scrollY + headerOffset - 4`) iç-yukarı (`scrollTo = max(scrollY - viewport*0.85, sections[i].top - headerOffset)`); yoksa prev (`sections[i-1].top - headerOffset`; ilk bölümde `null`). Tüm `scrollTo` `>= 0`.

- [ ] **Step 1: Failing test**

`src/lib/sectionPager.test.ts`:
```ts
import { test, expect } from "bun:test";
import { nextTarget } from "./sectionPager";

// 3 bölüm: kısa(600), uzun(1600), kısa(600); viewport 800, header 80
const S = [
  { top: 0, height: 600 },
  { top: 600, height: 1600 },
  { top: 2200, height: 600 },
];
const base = { viewport: 800, headerOffset: 80, sections: S };

test("kısa bölümde down → sonraki bölüme geçer", () => {
  expect(nextTarget({ ...base, scrollY: 0, direction: 1 })).toEqual({ scrollTo: 600 - 80, index: 1 });
});

test("uzun bölümde down, alt görünmüyor → iç-adım (clamp)", () => {
  // aktif bölüm 1 (top 600), scrollY 520 → +header 600 bölüm 1'de. alt=2200 > 520+800.
  const r = nextTarget({ ...base, scrollY: 520, direction: 1 });
  expect(r?.index).toBe(1);
  expect(r?.scrollTo).toBe(Math.min(520 + 800 * 0.85, 600 + 1600 - 800)); // min(1200,1400)=1200
});

test("uzun bölümde down, alt görünüyor → sonraki bölüm", () => {
  // scrollY 1420 → alt 2200 <= 1420+800=2220 → next (bölüm 2 top 2200)
  const r = nextTarget({ ...base, scrollY: 1420, direction: 1 });
  expect(r).toEqual({ scrollTo: 2200 - 80, index: 2 });
});

test("son bölümde down → null", () => {
  expect(nextTarget({ ...base, scrollY: 2200, direction: 1 })).toBeNull();
});

test("ilk bölümde up → null", () => {
  expect(nextTarget({ ...base, scrollY: 0, direction: -1 })).toBeNull();
});

test("kısa bölümde up → önceki bölüme", () => {
  expect(nextTarget({ ...base, scrollY: 2200, direction: -1 })).toEqual({ scrollTo: 600 - 80, index: 1 });
});
```

- [ ] **Step 2: RED**

Run: `cd ~/Projects/platcox-web-snap && bun test src/lib/sectionPager.test.ts`
Expected: FAIL (module/function yok).

- [ ] **Step 3: Implement `nextTarget`**

`src/lib/sectionPager.ts`:
```ts
export interface SectionRect { top: number; height: number }
export interface PagerState {
  scrollY: number;
  viewport: number;
  headerOffset: number;
  sections: SectionRect[];
  direction: 1 | -1;
}
export interface PagerTarget { scrollTo: number; index: number }

const STEP = 0.85; // iç-adım = viewport oranı (feel'de tune edilir)
const EDGE = 4;    // px tolerans

// Aktif bölüm: scrollY+header referans noktasını içeren bölüm (yoksa en yakın).
function activeIndex(s: PagerState): number {
  const ref = s.scrollY + s.headerOffset;
  for (let i = s.sections.length - 1; i >= 0; i--) {
    if (ref >= s.sections[i].top - EDGE) return i;
  }
  return 0;
}

export function nextTarget(s: PagerState): PagerTarget | null {
  const i = activeIndex(s);
  const sec = s.sections[i];
  const clampMin = (v: number) => (v < 0 ? 0 : v);
  if (s.direction === 1) {
    const bottom = sec.top + sec.height;
    const bottomVisible = s.scrollY + s.viewport >= bottom - EDGE;
    if (!bottomVisible) {
      const target = Math.min(s.scrollY + s.viewport * STEP, bottom - s.viewport);
      return { scrollTo: clampMin(target), index: i };
    }
    if (i >= s.sections.length - 1) return null;
    return { scrollTo: clampMin(s.sections[i + 1].top - s.headerOffset), index: i + 1 };
  } else {
    const topVisible = sec.top >= s.scrollY + s.headerOffset - EDGE;
    if (!topVisible) {
      const target = Math.max(s.scrollY - s.viewport * STEP, sec.top - s.headerOffset);
      return { scrollTo: clampMin(target), index: i };
    }
    if (i <= 0) return null;
    return { scrollTo: clampMin(s.sections[i - 1].top - s.headerOffset), index: i - 1 };
  }
}
```

- [ ] **Step 4: GREEN**

Run: `bun test src/lib/sectionPager.test.ts`
Expected: PASS (6 tests). (Beklentiler kod ile uyuşmazsa test-design'ı düzelt; kod spec'i yansıtmalı.)

- [ ] **Step 5: Commit**

```bash
git add src/lib/sectionPager.ts src/lib/sectionPager.test.ts
git commit -m "feat(pager): nextTarget saf hedef-hesaplama (TDD) — kısa/uzun bölüm + sınırlar"
```

---

### Task 3: `createSectionPager` controller

**Files:** Modify `src/lib/sectionPager.ts` (controller ekle).

**Interfaces:**
- Consumes: `nextTarget`, Lenis instance (`{ scrollTo(target:number, opts):void; scroll:number }` yeterli).
- Produces: `export function createSectionPager(opts): { destroy(): void }`.

- [ ] **Step 1: Controller'ı ekle**

`src/lib/sectionPager.ts` sonuna:
```ts
export interface PagerLenis {
  scroll: number;
  scrollTo: (target: number, opts?: { duration?: number; offset?: number; easing?: (t: number) => number }) => void;
}
export interface SectionPagerOptions {
  lenis: PagerLenis;
  getSections: () => HTMLElement[];
  headerOffset?: number;
  duration?: number;
  debounceMs?: number;
  onIndex?: (index: number) => void;
}

export function createSectionPager(opts: SectionPagerOptions): { destroy(): void } {
  const headerOffset = opts.headerOffset ?? 80;
  const duration = opts.duration ?? 0.9;
  const debounceMs = opts.debounceMs ?? 700;
  let locked = false;

  const rects = (): SectionRect[] =>
    opts.getSections().map((el) => {
      const r = el.getBoundingClientRect();
      return { top: r.top + window.scrollY, height: r.height };
    });

  const go = (direction: 1 | -1) => {
    if (locked) return;
    const t = nextTarget({
      scrollY: window.scrollY,
      viewport: window.innerHeight,
      headerOffset,
      sections: rects(),
      direction,
    });
    if (!t) return;
    locked = true;
    opts.lenis.scrollTo(t.scrollTo, { duration });
    opts.onIndex?.(t.index);
    window.setTimeout(() => { locked = false; }, duration * 1000 + debounceMs);
  };

  const onWheel = (e: WheelEvent) => {
    if (Math.abs(e.deltaY) < 4) return;
    e.preventDefault();
    go(e.deltaY > 0 ? 1 : -1);
  };
  const onKey = (e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
    if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); go(1); }
    else if (e.key === "ArrowUp" || e.key === "PageUp") { e.preventDefault(); go(-1); }
  };

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("keydown", onKey);

  return {
    destroy() {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
    },
  };
}
```

- [ ] **Step 2: type-check + mevcut testler**

Run: `bun run type-check && bun test src/lib/sectionPager.test.ts`
Expected: 0 error; nextTarget testleri hâlâ PASS (controller saf-fonksiyonu bozmaz).

- [ ] **Step 3: Commit**

```bash
git add src/lib/sectionPager.ts
git commit -m "feat(pager): createSectionPager controller — wheel/klavye niyet + debounce + lenis.scrollTo"
```

---

### Task 4: `SectionNav` nokta nav

**Files:** Create `src/components/SectionNav.astro`.

**Interfaces:** Produces `<SectionNav />` — sağda dikey nokta nav; client-side IntersectionObserver ile aktif nokta; tıkla→scroll. Yalnız masaüstü+non-reduced'da görünür (CSS + JS guard).

- [ ] **Step 1: Bileşeni yaz**

`src/components/SectionNav.astro`:
```astro
---
// Nokta nav — masaüstü pager için bölüm göstergesi. Bölümler client-side
// main > section[id] üzerinden bulunur; SSR'da boş <nav>, JS doldurur.
---
<nav class="section-nav" aria-label="Section navigation" data-section-nav></nav>

<style>
  .section-nav {
    position: fixed; right: 22px; top: 50%; transform: translateY(-50%);
    z-index: 45; display: none; flex-direction: column; gap: 12px;
  }
  @media (min-width: 768px) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
    .section-nav[data-ready] { display: flex; }
  }
  .section-nav :global(button) {
    width: 9px; height: 9px; border-radius: 50%; padding: 0; border: 0;
    background: rgba(17,17,17,.22); cursor: pointer; transition: background .25s, transform .25s;
  }
  .section-nav :global(button:hover) { background: rgba(17,17,17,.5); }
  .section-nav :global(button[aria-current="true"]) { background: #22C55E; transform: scale(1.35); }
  .section-nav :global(button:focus-visible) { outline: 2px solid #22C55E; outline-offset: 3px; }
</style>

<script>
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const desktop = window.matchMedia?.("(min-width:768px) and (pointer:fine)").matches;
  if (!reduce && desktop) {
    const nav = document.querySelector("[data-section-nav]");
    const sections = Array.from(document.querySelectorAll("main > section")) as HTMLElement[];
    if (nav && sections.length) {
      const buttons = sections.map((sec) => {
        const b = document.createElement("button");
        const label = sec.getAttribute("id") || "section";
        b.setAttribute("aria-label", "Go to " + label);
        b.addEventListener("click", () => {
          import("../lib/lenisSingleton").then(({ getLenis }) => {
            const l = getLenis();
            const top = sec.getBoundingClientRect().top + window.scrollY - 80;
            if (l) l.scrollTo(top, { duration: 0.9 });
            else window.scrollTo({ top, behavior: "smooth" });
          });
        });
        nav.appendChild(b);
        return b;
      });
      nav.setAttribute("data-ready", "");
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            const idx = sections.indexOf(e.target as HTMLElement);
            buttons.forEach((b, i) => b.setAttribute("aria-current", i === idx ? "true" : "false"));
          });
        },
        { rootMargin: "-45% 0px -45% 0px" },
      );
      sections.forEach((s) => io.observe(s));
    }
  }
</script>
```

- [ ] **Step 2: index'e ekle + build**

`src/pages/index.astro`: `import SectionNav from "../components/SectionNav.astro";` + `<Footer />`'dan sonra (BaseLayout slot içinde) `<SectionNav />`.
Run: `bun run build`
Expected: build başarılı; `grep -c "section-nav" dist/index.html` ≥1.

- [ ] **Step 3: Commit**

```bash
git add src/components/SectionNav.astro src/pages/index.astro
git commit -m "feat(pager): SectionNav nokta nav — aktif bölüm (IO) + tıkla-atla, masaüstü guard"
```

---

### Task 5: BaseLayout'ta pager kurulumu

**Files:** Modify `src/layouts/BaseLayout.astro`.

- [ ] **Step 1: Lenis bloğuna pager kur**

`src/layouts/BaseLayout.astro` script'inde (Task 1'de sadeleşen blok) `getLenis()` çağrısını genişlet:
```astro
      import { getLenis } from "../lib/lenisSingleton";
      import { createSectionPager } from "../lib/sectionPager";
      const reduceMotion = window.matchMedia?.(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const desktop = window.matchMedia?.(
        "(min-width:768px) and (pointer:fine)",
      ).matches;
      if (!reduceMotion) {
        const lenis = getLenis();
        if (lenis && desktop) {
          createSectionPager({
            lenis,
            getSections: () =>
              Array.from(document.querySelectorAll("main > section")),
            headerOffset: 80,
          });
        }
      }
```
(Not: media-change'te kur/yık — v1'de sadeleştirildi; sayfa reload'da doğru guard yeterli. Resize-time toggle Kapsam dışı §8'e yakın, gerekirse sonra.)

- [ ] **Step 2: type-check + build + tüm testler**

Run: `bun run type-check && bun test && bun run build`
Expected: 0 tip hatası; **129 + 6 yeni pager testi** pass; build 5 sayfa.

- [ ] **Step 3: Commit**

```bash
git add src/layouts/BaseLayout.astro
git commit -m "feat(pager): BaseLayout'ta section pager kurulumu (masaüstü + non-reduced guard)"
```

---

### Task 6: Lokal feel-tuning + doğrulama (kullanıcı ile)

**Files:** (tuning — sabit ayarları)

- [ ] **Step 1: Build + serve**

```bash
cd ~/Projects/platcox-web-snap && bun run build && cd dist && (python3 -m http.server 8898 --bind 127.0.0.1 &)
```
Controller: `http://127.0.0.1:8898/` — kullanıcı wheel/trackpad/klavye ile dener.

- [ ] **Step 2: Feel tune (kullanıcı onayına kadar)**

Ayarlanacak sabitler (`sectionPager.ts`): `debounceMs` (momentum tek geçişe), `STEP` (iç-adım oranı), `duration`/easing. Kullanıcı geri bildirimine göre değiştir → rebuild → tekrar dene. **Deploy ONAY'a kadar bu adımda kal.**

- [ ] **Step 3: Guard doğrula**

Dar viewport (mobil emülasyon) → pager+nav yok, native scroll. reduced-motion → pager yok. Header anchor linkleri çalışır.

- [ ] **Step 4: PR + deploy (kullanıcı onayı sonrası)**

```bash
git push -u origin feat/scroll-snap
gh pr create --base main --head feat/scroll-snap --title "feat: desktop section pager + dot nav" --body-file <body>
```
Merge (onayla) → redeploy (coolify) → canlıda doğrula.

---

## Self-Review Notları

- Spec §4.2 uzun-bölüm mantığı → Task 2 `nextTarget` (TDD, clamp testli). §4.4 nav → Task 4. §5 guard → Task 4+5. §6 mimari → Task 2-5. §7 feel → Task 6.
- `nextTarget` saf + testli; controller DOM/Lenis'i sarar; feel sabitleri controller'da tek yerde (tune kolay).
- Snap denemesi Task 1'de temizlenir (çift scroll-davranışı olmaz).
- Bilinen risk: wheel-hijack feel (Task 6 kullanıcı-onaylı tuning ile ele alınır); resize-time desktop↔mobil toggle v1'de yok (reload ile doğru).
