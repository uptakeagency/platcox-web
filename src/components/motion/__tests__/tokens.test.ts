import { describe, it, expect } from "bun:test";
import { DURATION, EASE, SCROLL_STAGES, REDUCED_MOTION_DURATION_MS } from "../tokens";

describe("motion tokens", () => {
  it("DURATION is in milliseconds (positive integers)", () => {
    expect(DURATION.micro).toBe(150);
    expect(DURATION.short).toBe(300);
    expect(DURATION.medium).toBe(600);
    expect(DURATION.long).toBe(1200);
    expect(DURATION.cinematic).toBe(2400);
  });

  it("EASE exposes named cubic-bezier tuples", () => {
    expect(EASE.standard).toEqual([0.32, 0.72, 0, 1]);
    expect(EASE.monumental).toEqual([0.25, 0.46, 0.45, 0.94]);
    expect(EASE.responsive).toEqual([0.34, 1.56, 0.64, 1]);
    expect(EASE.draw).toEqual([0.65, 0, 0.35, 1]);
    expect(EASE.scan).toEqual([0.4, 0, 0.6, 1]);
  });

  it("SCROLL_STAGES.manifestoRise has enter/hold/exit ranges", () => {
    expect(SCROLL_STAGES.manifestoRise.enter).toEqual([0, 0.2]);
    expect(SCROLL_STAGES.manifestoRise.hold).toEqual([0.2, 0.7]);
    expect(SCROLL_STAGES.manifestoRise.exit).toEqual([0.7, 1]);
  });

  it("REDUCED_MOTION_DURATION_MS is 1ms (pipeline-safe)", () => {
    expect(REDUCED_MOTION_DURATION_MS).toBe(1);
  });
});
