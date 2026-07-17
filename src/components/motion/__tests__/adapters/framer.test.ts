import { describe, it, expect } from "bun:test";
import { toFramerSeconds } from "../../adapters/framer";

describe("toFramerSeconds", () => {
  it("converts ms to seconds with 3 decimals", () => {
    expect(toFramerSeconds(600)).toBe(0.6);
    expect(toFramerSeconds(150)).toBe(0.15);
    expect(toFramerSeconds(1200)).toBe(1.2);
    expect(toFramerSeconds(1)).toBe(0.001);
  });
});
