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

// Bir bölümün "hizalı" scroll konumu: üstü fixed header'ın altına oturur.
// Pager daima buraya scrollTo eder; sınır tespiti de buna göre yapılır
// (ham section.top değil — yoksa header offset ilk/son bölümde no-op üretir).
function alignedTop(s: PagerState, i: number): number {
  return Math.max(0, s.sections[i].top - s.headerOffset);
}

// Aktif bölüm: scrollY'nin (küçük tolerlansla) düştüğü son bölüm.
function activeIndex(s: PagerState): number {
  for (let k = s.sections.length - 1; k >= 0; k--) {
    if (s.scrollY + EDGE >= alignedTop(s, k)) return k;
  }
  return 0;
}

// Verili scroll durumu + yön için sonraki hedefi hesaplar.
// null = sınır (hareket yok). Kısa bölüm → komşu bölüm; uzun bölüm →
// önce kendi içinde ~STEP*viewport adım, dibine/tepesine gelince komşu.
export function nextTarget(s: PagerState): PagerTarget | null {
  const i = activeIndex(s);
  const sec = s.sections[i];
  let target: number;
  let index: number;

  if (s.direction === 1) {
    const bottom = sec.top + sec.height;
    const bottomVisible = s.scrollY + s.viewport >= bottom - EDGE;
    if (!bottomVisible) {
      target = Math.min(s.scrollY + s.viewport * STEP, bottom - s.viewport);
      index = i;
    } else if (i >= s.sections.length - 1) {
      return null;
    } else {
      index = i + 1;
      target = alignedTop(s, index);
    }
  } else {
    const atTop = s.scrollY <= alignedTop(s, i) + EDGE;
    if (!atTop) {
      target = Math.max(s.scrollY - s.viewport * STEP, alignedTop(s, i));
      index = i;
    } else if (i <= 0) {
      return null;
    } else {
      index = i - 1;
      target = alignedTop(s, index);
    }
  }

  target = Math.max(0, target);
  if (Math.abs(target - s.scrollY) < EDGE) return null; // no-op = sınır
  return { scrollTo: target, index };
}

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
