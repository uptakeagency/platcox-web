import { describe, it, expect, afterEach } from "bun:test";
import { getLenis, destroyLenis } from "../lenisSingleton";

describe("lenisSingleton", () => {
  afterEach(() => {
    destroyLenis();
  });

  it("returns the same instance across repeated calls", () => {
    const a = getLenis();
    const b = getLenis();
    expect(a).not.toBeNull();
    expect(b).toBe(a);
  });

  it("returns a fresh instance after destroyLenis()", () => {
    const first = getLenis();
    destroyLenis();
    const second = getLenis();
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(second).not.toBe(first);
  });

  it("returns null when window is undefined", () => {
    const savedWindow = globalThis.window;
    // @ts-expect-error intentional test setup
    delete globalThis.window;
    try {
      expect(getLenis()).toBeNull();
    } finally {
      globalThis.window = savedWindow;
    }
  });
});
