import { describe, it, expect } from "bun:test";
import { renderHook, act } from "@testing-library/react";
import { useReducedMotion } from "../cinematic/useReducedMotion";

function mockMatchMedia(matches: boolean) {
  const listeners: Array<(e: { matches: boolean }) => void> = [];
  let removedCount = 0;
  (window as any).matchMedia = (_: string) => ({
    matches,
    media: "(prefers-reduced-motion: reduce)",
    addEventListener: (ev: string, cb: (e: { matches: boolean }) => void) => {
      if (ev !== "change") throw new Error(`Unexpected event: ${ev}`);
      listeners.push(cb);
    },
    removeEventListener: (ev: string, cb: (e: { matches: boolean }) => void) => {
      if (ev !== "change") throw new Error(`Unexpected event: ${ev}`);
      const i = listeners.indexOf(cb);
      if (i >= 0) {
        listeners.splice(i, 1);
        removedCount++;
      }
    },
    onchange: null,
    dispatchEvent: () => false,
  });
  return {
    trigger: (v: boolean) => listeners.forEach((l) => l({ matches: v })),
    getListenerCount: () => listeners.length,
    getRemovedCount: () => removedCount,
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

  it("removes the change listener on unmount", () => {
    const mm = mockMatchMedia(false);
    const { unmount } = renderHook(() => useReducedMotion());
    expect(mm.getListenerCount()).toBe(1);
    unmount();
    expect(mm.getListenerCount()).toBe(0);
    expect(mm.getRemovedCount()).toBe(1);
  });
});
