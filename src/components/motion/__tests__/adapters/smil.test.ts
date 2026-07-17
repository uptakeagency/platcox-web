import { describe, it, expect } from "bun:test";
import { toSmilDur } from "../../adapters/smil";

describe("toSmilDur", () => {
  it("formats ms as 'Nms' string for SMIL dur attribute", () => {
    expect(toSmilDur(600)).toBe("600ms");
    expect(toSmilDur(1200)).toBe("1200ms");
    expect(toSmilDur(1)).toBe("1ms");
  });
});
