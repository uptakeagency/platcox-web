import { describe, it, expect } from "bun:test";
import type {
  BaseMotionProps,
  BaseAstroProps,
  BaseReactProps,
  Trigger,
  TriggerShorthand,
  MotionRef,
} from "../types";

describe("motion types", () => {
  it("BaseMotionProps has optional durationMs and ariaLabel", () => {
    const a: BaseMotionProps = {};
    const b: BaseMotionProps = { durationMs: 600, ariaLabel: "x" };
    expect(a).toBeDefined();
    expect(b.durationMs).toBe(600);
  });

  it("BaseAstroProps adds optional class", () => {
    const a: BaseAstroProps = { class: "text-foreground" };
    expect(a.class).toBe("text-foreground");
  });

  it("BaseReactProps adds optional className", () => {
    const a: BaseReactProps = { className: "text-foreground" };
    expect(a.className).toBe("text-foreground");
  });

  it("Trigger discriminated union narrows by kind", () => {
    const t: Trigger = { kind: "manual", id: "test-id" };
    if (t.kind === "manual") {
      expect(t.id).toBe("test-id");
    }
  });

  it("TriggerShorthand is a string literal union", () => {
    const x: TriggerShorthand = "viewport-once";
    expect(x).toBe("viewport-once");
  });

  it("MotionRef has start and reset, optional play/pause", () => {
    const ref: MotionRef = {
      start: () => {},
      reset: () => {},
    };
    expect(typeof ref.start).toBe("function");
  });
});
