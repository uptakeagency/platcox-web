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

test("görünür alanı taşan bölüm (1.15× eşiğinin altında) → iç-adım, komşuya atlamaz", () => {
  // Kapan bandı: bölüm görünür alandan (viewport-header = 620) uzun ama
  // viewport*1.15 = 805 eşiğinin altında. Eski ölçüt bunu "kısa" sayıp
  // doğrudan komşuya atlıyordu → bölümün alt kısmı hiç görüntülenemiyordu.
  const T = [
    { top: 0, height: 700 },
    { top: 700, height: 787 },
    { top: 1487, height: 700 },
  ];
  const r = nextTarget({ viewport: 700, headerOffset: 80, sections: T, scrollY: 620, direction: 1 });
  expect(r?.index).toBe(1); // hâlâ aynı bölümde: alt kısmı göster
  expect(r?.scrollTo).toBe(Math.min(620 + 700 * 0.85, 1487 - 700)); // min(1215, 787)=787
});

test("tek-ekran bölüm (görünür alan kadar) down → intra DEĞİL, sonraki", () => {
  // Bölümlerin min-height'ı görünür alana eşit (calc(100svh - 88px)) → height
  // 712, görünür alan 720. Tek-ekran bölüm iç-adım yapmamalı, tek scroll'da
  // sonrakine geçmeli. (Bug: header offset her bölümü 2-scroll yapıyordu.)
  const T = [
    { top: 0, height: 712 },
    { top: 712, height: 712 },
    { top: 1424, height: 712 },
  ];
  const r = nextTarget({ viewport: 800, headerOffset: 80, sections: T, scrollY: 632, direction: 1 });
  expect(r).toEqual({ scrollTo: 1344, index: 2 }); // section2 hizalı (1424-80)
});
