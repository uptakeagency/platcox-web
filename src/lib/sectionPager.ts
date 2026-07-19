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
// Bölüm bu orandan UZUNSA "gerçekten uzun" sayılır → iç-adım yapar. Aksi hâlde
// (tek-ekran min-h-screen bölüm) tek scroll'da komşuya geçer. Fixed header, bölüm
// altının ~80px'ini gizlediği için tolerans şart; yoksa her bölüm 2 scroll ister.

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
  const isTall = sec.height > s.viewport * 1.15; // gerçekten uzun mu → intra-step
  let target: number;
  let index: number;

  if (s.direction === 1) {
    const bottom = sec.top + sec.height;
    const bottomVisible = s.scrollY + s.viewport >= bottom - EDGE;
    if (isTall && !bottomVisible) {
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
    if (isTall && !atTop) {
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
  scrollTo: (
    target: number,
    opts?: {
      duration?: number;
      lock?: boolean;
      onComplete?: () => void;
      easing?: (t: number) => number;
    },
  ) => void;
}
export interface SectionPagerOptions {
  lenis: PagerLenis;
  getSections: () => HTMLElement[];
  headerOffset?: number;
  duration?: number;      // saniye — geçiş animasyonu
  fireThreshold?: number; // normalize px — bu spike'ta ANINDA tetikle (biriktirme yok)
  cooldownMs?: number;    // animasyon bitince bu kadar sonra kilit düşer (wheel RESET etmez)
  onIndex?: (index: number) => void;
  // Lenis'e "wheel'i pager'a bırak" sinyali. Modül-seviyesi import yerine
  // opts'tan geçer → sectionPager saf kalır (bun:test Lenis yüklemez).
  setWheelOwnership?: (owned: boolean) => void;
}

// deltaMode farklılığı: 0=piksel, 1=satır (~16px), 2=sayfa (~viewport).
// Tek sabit eşik cihaz çeşitliliğinde kırılmasın diye normalize et (Codex ccg).
function normalizeDeltaY(e: WheelEvent): number {
  if (e.deltaMode === 1) return e.deltaY * 16;
  if (e.deltaMode === 2) return e.deltaY * window.innerHeight;
  return e.deltaY;
}

// fullPage-style pager. Lenis wheel'i pager'a bırakır (setWheelOwnership);
// pager niyet spike'ında ANINDA tetikler; geçiş boyunca + kısa sabit cooldown
// kadar kilitli kalır (wheel bunu uzatmaz), sonra sıradaki niyet yeni advance eder.
export function createSectionPager(opts: SectionPagerOptions): { destroy(): void } {
  const headerOffset = opts.headerOffset ?? 80;
  const duration = opts.duration ?? 0.6;
  const fireThreshold = opts.fireThreshold ?? 10;
  const cooldownMs = opts.cooldownMs ?? 120;

  let locked = false;
  let unlockTimer: number | undefined;

  opts.setWheelOwnership?.(true); // Lenis artık wheel'i yutmaz — pager tek sahip

  const rects = (): SectionRect[] =>
    opts.getSections().map((el) => {
      const r = el.getBoundingClientRect();
      return { top: r.top + window.scrollY, height: r.height };
    });

  // nextTarget her seferinde gerçek window.scrollY okur → scrollbar/find/deep-link
  // ile pozisyon değişse bile bayat index'e ışınlanma olmaz (Fable ccg).
  const compute = (direction: 1 | -1): PagerTarget | null =>
    nextTarget({
      scrollY: window.scrollY,
      viewport: window.innerHeight,
      headerOffset,
      sections: rects(),
      direction,
    });

  const go = (t: PagerTarget) => {
    locked = true;
    opts.lenis.scrollTo(t.scrollTo, {
      duration,
      lock: true,
      // Kilit = animasyon + kısa SABİT cooldown. Wheel bunu RESET ETMEZ →
      // sürekli scroll'da her ~(duration+cooldown)'da bir advance.
      onComplete: () => {
        if (unlockTimer !== undefined) clearTimeout(unlockTimer);
        unlockTimer = window.setTimeout(() => {
          locked = false;
        }, cooldownMs);
      },
    });
    opts.onIndex?.(t.index);
  };

  const onWheel = (e: WheelEvent) => {
    if (e.ctrlKey) return; // pinch-zoom'a dokunma
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // yatay gesture
    if (locked) {
      e.preventDefault(); // geçiş sırasında yut (unlock timer'ını RESET ETME)
      return;
    }
    const d = normalizeDeltaY(e);
    if (Math.abs(d) < fireThreshold) return; // mikro titreme
    const t = compute(d > 0 ? 1 : -1);
    // Sınır (ör. son bölümde aşağı → Footer): preventDefault YOK → native scroll
    // footer'a inebilsin (Codex P1). Yalnız gerçek bir hedef varken paging yap.
    if (!t) return;
    e.preventDefault();
    go(t);
  };

  const onKey = (e: KeyboardEvent) => {
    const el = e.target as HTMLElement | null;
    const tag = el?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el?.isContentEditable) return;
    if (locked) return;
    let dir: 1 | -1 | 0 = 0;
    if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") dir = 1;
    else if (e.key === "ArrowUp" || e.key === "PageUp") dir = -1;
    if (!dir) return;
    const t = compute(dir);
    if (!t) return; // sınır → native (footer / klavye scroll)
    e.preventDefault();
    go(t);
  };

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("keydown", onKey);

  return {
    destroy() {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      if (unlockTimer !== undefined) clearTimeout(unlockTimer);
      opts.setWheelOwnership?.(false);
    },
  };
}
