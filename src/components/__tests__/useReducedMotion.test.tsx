import { describe, it, expect } from "bun:test";
import { renderHook, act } from "@testing-library/react";
import { useReducedMotion } from "../cinematic/useReducedMotion";

function mockMatchMedia(matches: boolean) {
  const listeners: Array<(e: { matches: boolean }) => void> = [];
  (window as any).matchMedia = (_: string) => ({
    matches,
    media: "(prefers-reduced-motion: reduce)",
    addEventListener: (_ev: string, cb: (e: { matches: boolean }) => void) => listeners.push(cb),
    removeEventListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  });
  return {
    trigger: (v: boolean) => listeners.forEach((l) => l({ matches: v })),
  };
}

describe("useReducedMotion", () => {
  it("returns true when the media query matches", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it("returns false when the media query does not match", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it("updates when the media query changes", () => {
    const mm = mockMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
    act(() => mm.trigger(true));
    expect(result.current).toBe(true);
  });
});
