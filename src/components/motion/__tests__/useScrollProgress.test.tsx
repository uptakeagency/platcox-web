import { describe, it, expect } from "bun:test";
import { renderHook } from "@testing-library/react";
import { useScrollProgress } from "../hooks/useScrollProgress";

describe("useScrollProgress (Phase 0 inert)", () => {
  it("returns ref with current=0 when no adapter is provided", () => {
    const { result } = renderHook(() =>
      useScrollProgress({
        triggerSelector: ".test",
        pinDistanceDesktop: "+=150%",
        pinDistanceMobile: "+=100%",
      })
    );
    expect(result.current.current).toBe(0);
  });

  it("does not register listeners when disabled", () => {
    const fakeAdapter = {
      on: makeSpy(),
      off: makeSpy(),
    };
    renderHook(() =>
      useScrollProgress({
        triggerSelector: ".test",
        pinDistanceDesktop: "+=150%",
        pinDistanceMobile: "+=100%",
        disabled: true,
        adapter: fakeAdapter,
      })
    );
    expect(fakeAdapter.on.callCount()).toBe(0);
  });

  it("registers a scroll listener when an adapter is provided and not disabled", () => {
    const fakeAdapter = {
      on: makeSpy(),
      off: makeSpy(),
    };
    renderHook(() =>
      useScrollProgress({
        triggerSelector: ".test",
        pinDistanceDesktop: "+=150%",
        pinDistanceMobile: "+=100%",
        adapter: fakeAdapter,
      })
    );
    expect(fakeAdapter.on.callCount()).toBe(1);
  });
});

// Closure tabanlı çağrı sayacı; bun:test mock API'sından bağımsız çalışır.
function makeSpy() {
  let calls = 0;
  const fn = (..._args: unknown[]) => {
    calls += 1;
  };
  fn.callCount = () => calls;
  return fn;
}
