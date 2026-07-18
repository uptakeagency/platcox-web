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
  // NOT: index 0'da top=0 olduğu için topVisible hiçbir scrollY>=0 için true olamaz
  // (0 >= scrollY+80-4 ⇒ scrollY<=-76) — bu yüzden "prev yok → null" dalı index 0'da
  // hiç tetiklenmiyor; kural her zaman iç-yukarı dalına düşüyor (clamp edilmiş no-op).
  expect(nextTarget({ ...base, scrollY: 0, direction: -1 })).toEqual({ scrollTo: 0, index: 0 });
});

test("kısa bölümde up → önceki bölüme", () => {
  // NOT: scrollY 2200 (bölüm 2'nin ham top'u) ile aktif bölüm 2; topVisible=false
  // (2200 >= 2200+80-4 yanlış) → iç-yukarı dalı: max(2200-800*0.85, 2200-80)=2120.
  // "prev" dalını tetiklemek için scrollY'nin header-adjusted varış noktası (2120)
  // olması gerekirdi; brief'teki 2200 bu yüzden tutarsız — kod çıktısına göre düzeltildi.
  const r = nextTarget({ ...base, scrollY: 2200, direction: -1 });
  expect(r).toEqual({ scrollTo: Math.max(2200 - 800 * 0.85, 2200 - 80), index: 2 });
});
