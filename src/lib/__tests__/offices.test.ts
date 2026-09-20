import { describe, it, expect } from "bun:test";
import { OFFICES, projectToMap, displayPosition } from "../offices";

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

describe("displayPosition (pin çakışması)", () => {
  // viewBox 1000x500; pin çekirdeği 12px + pulse halkası 36px → 1400px haritada
  // ~28 birim altı üst üste biner ve hover hedefleri karışır (Codex P2).
  it("hiçbir iki pin 28 viewBox biriminden yakın değil", () => {
    const pts = OFFICES.map((o) => {
      const p = displayPosition(o);
      return { id: o.id, x: p.x * 10, y: p.y * 5 };
    });
    const tooClose: string[] = [];
    for (let a = 0; a < pts.length; a++)
      for (let b = a + 1; b < pts.length; b++) {
        const d = Math.hypot(pts[a].x - pts[b].x, pts[a].y - pts[b].y);
        if (d < 28) tooClose.push(`${pts[a].id}-${pts[b].id}:${d.toFixed(1)}`);
      }
    expect(tooClose).toEqual([]);
  });

  it("kaydırma yalnızca gösterim için, küçük ve harita içinde", () => {
    for (const o of OFFICES) {
      const t = projectToMap(o);
      const d = displayPosition(o);
      expect(Math.abs(d.x - t.x)).toBeLessThanOrEqual(2);
      expect(Math.abs(d.y - t.y)).toBeLessThanOrEqual(3);
    }
  });
});
