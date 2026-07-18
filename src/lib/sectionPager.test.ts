import { test, expect } from "bun:test";
import { nextTarget } from "./sectionPager";

// 3 bölüm: kısa(600), uzun(1600), kısa(600); viewport 800, header 80.
// Pager daima "hizalı" konuma (top - header, clamp>=0) oturur:
// alignedTop = [0, 520, 2120]. Testler gerçekçi scrollY (= hizalı konum) kullanır.
const S = [
  { top: 0, height: 600 },
  { top: 600, height: 1600 },
  { top: 2200, height: 600 },
];
const base = { viewport: 800, headerOffset: 80, sections: S };

test("kısa bölümde down → sonraki bölümün hizalı konumuna", () => {
  expect(nextTarget({ ...base, scrollY: 0, direction: 1 })).toEqual({ scrollTo: 520, index: 1 });
});

test("uzun bölümde down, alt görünmüyor → iç-adım (clamp)", () => {
  // section1 hizalı = 520. bottom = 2200; 520+800=1320 < 2196 → iç-adım
  const r = nextTarget({ ...base, scrollY: 520, direction: 1 });
  expect(r?.index).toBe(1);
  expect(r?.scrollTo).toBe(Math.min(520 + 800 * 0.85, 2200 - 800)); // min(1200,1400)=1200
});

test("uzun bölümde down, alt görünüyor → sonraki bölüm", () => {
  // scrollY 1420 → 1420+800=2220 >= 2196 → next (section2 hizalı 2120)
  expect(nextTarget({ ...base, scrollY: 1420, direction: 1 })).toEqual({ scrollTo: 2120, index: 2 });
});

test("son bölümde down → null", () => {
  expect(nextTarget({ ...base, scrollY: 2120, direction: 1 })).toBeNull();
});

test("ilk bölümde up → null", () => {
  expect(nextTarget({ ...base, scrollY: 0, direction: -1 })).toBeNull();
});

test("kısa bölümde (hizalı) up → önceki bölüm", () => {
  expect(nextTarget({ ...base, scrollY: 2120, direction: -1 })).toEqual({ scrollTo: 520, index: 1 });
});

test("uzun bölümde içerideyken up → iç-yukarı adım (komşuya atlamaz)", () => {
  // section1 içinde derinde (1200): up → hizalı tepe 520'ye doğru iç-adım
  const r = nextTarget({ ...base, scrollY: 1200, direction: -1 });
  expect(r?.index).toBe(1);
  expect(r?.scrollTo).toBe(Math.max(1200 - 800 * 0.85, 520)); // max(520,520)=520
});
