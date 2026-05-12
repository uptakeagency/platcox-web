import { describe, it, expect } from "bun:test";
import { toCssDuration } from "../../adapters/css";

describe("toCssDuration", () => {
  it("formats ms as 'Nms' for CSS animation-duration", () => {
    expect(toCssDuration(600)).toBe("600ms");
    expect(toCssDuration(1)).toBe("1ms");
  });
});
