import { describe, it, expect } from "bun:test";
import { OFFICES, projectToMap } from "../offices";

describe("OFFICES", () => {
  it("on bir lokasyon, kimlikler benzersiz", () => {
    expect(OFFICES.length).toBe(11);
    expect(new Set(OFFICES.map((o) => o.id)).size).toBe(11);
  });

  it("tam bir merkez (HQ) var ve o Istanbul", () => {
    const hq = OFFICES.filter((o) => o.type === "HQ");
    expect(hq.length).toBe(1);
    expect(hq[0].city).toBe("Istanbul");
  });

  it("her ofisin en az iki adres satırı var", () => {
    for (const o of OFFICES) expect(o.lines.length).toBeGreaterThanOrEqual(2);
  });

  it("gerçek şubeler listede", () => {
    const cities = OFFICES.map((o) => o.city);
    for (const c of [
      "Leeds", "Barcelona", "Tenerife", "New Delhi", "Reilingen", "Dubai",
      "Hong Kong", "Guangzhou", "Xiamen", "Budapest",
    ])
      expect(cities).toContain(c);
  });

  it("Tenerife Kanarya Adaları'na, Afrika'nın batısına düşer", () => {
    const p = projectToMap(OFFICES.find((o) => o.id === "tenerife")!);
    expect(p.x).toBeLessThan(projectToMap({ lat: 41.22, lng: 1.73 }).x); // Barcelona'nın batısı
    expect(p.y).toBeGreaterThan(40);
  });
});

describe("projectToMap", () => {
  // worldDots.ts'i üreten dotted-map ızgarası: Mercator, enlem -56…71, boylam -168…168.
  it("Istanbul haritada beklenen yüzdeye düşer", () => {
    const p = projectToMap({ lat: 41.01, lng: 28.98 });
    expect(p.x).toBeCloseTo(58.6, 0);
    expect(p.y).toBeCloseTo(33.7, 0);
  });

  it("bölge köşeleri 0 ve 100'e oturur", () => {
    expect(projectToMap({ lat: 71, lng: -168 })).toEqual({ x: 0, y: 0 });
    const se = projectToMap({ lat: -56, lng: 168 });
    expect(se.x).toBeCloseTo(100, 5);
    expect(se.y).toBeCloseTo(100, 5);
  });

  it("tüm ofisler harita içinde kalır", () => {
    for (const o of OFFICES) {
      const p = projectToMap(o);
      expect(p.x).toBeGreaterThan(0);
      expect(p.x).toBeLessThan(100);
      expect(p.y).toBeGreaterThan(0);
      expect(p.y).toBeLessThan(100);
    }
  });
});
