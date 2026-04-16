import { describe, it, expect, mock } from "bun:test";
import { renderHook } from "@testing-library/react";
import { useScrollProgress } from "../cinematic/useScrollProgress";

describe("useScrollProgress", () => {
  it("returns a ref whose initial value is 0", () => {
    const { result } = renderHook(() =>
      useScrollProgress({
        triggerSelector: "#never-exists",
        pinDistanceDesktop: "+=150%",
        pinDistanceMobile: "+=100%",
        disabled: true,
      })
    );
    expect(result.current.current).toBe(0);
  });

  it("does not throw when trigger selector matches nothing and disabled is true", () => {
    expect(() => {
      renderHook(() =>
        useScrollProgress({
          triggerSelector: "#also-never-exists",
          pinDistanceDesktop: "+=150%",
          pinDistanceMobile: "+=100%",
          disabled: true,
        })
      );
    }).not.toThrow();
  });

  it("warns (but does not throw) when disabled is false and element is missing", () => {
    const warn = mock((..._args: unknown[]) => {});
    const original = console.warn;
    console.warn = warn;
    try {
      renderHook(() =>
        useScrollProgress({
          triggerSelector: "#still-nonexistent",
          pinDistanceDesktop: "+=150%",
          pinDistanceMobile: "+=100%",
          disabled: false,
        })
      );
      expect(warn).toHaveBeenCalled();
    } finally {
      console.warn = original;
    }
  });
});
