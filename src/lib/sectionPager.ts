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
