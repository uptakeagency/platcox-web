import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { render, screen, act } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { createRef } from "react";
import TickCounter from "../primitives/TickCounter";
import { __resetPoolsForTesting } from "../hooks/useInViewport";
import { mockMatchMedia } from "./helpers/mockMatchMedia";
import { mockIntersectionObserver } from "./helpers/mockIntersectionObserver";
import { mockRAF, type MockRAF } from "./helpers/mockRAF";
import type { MotionRef } from "../types";

describe("TickCounter", () => {
  let raf: MockRAF;
  let mockIO: ReturnType<typeof mockIntersectionObserver>;

  beforeEach(() => {
    __resetPoolsForTesting();
    mockMatchMedia("(prefers-reduced-motion: reduce)", false);
    mockIO = mockIntersectionObserver();
    raf = mockRAF();
  });

  afterEach(() => {
    raf.restore();
  });

  it("renders the final formatted value in SSR HTML (240,000)", () => {
    const html = renderToString(<TickCounter target={240000} />);
    expect(html).toContain("240,000");
  });

  it("uses 'en-US' locale by default for deterministic separators", () => {
    const html = renderToString(<TickCounter target={1234567} />);
    expect(html).toContain("1,234,567");
  });

  it("supports custom locale (e.g. tr-TR uses dot as thousand separator)", () => {
    const html = renderToString(<TickCounter target={1234567} locale="tr-TR" />);
    // Türkçe locale: 1.234.567
    expect(html).toMatch(/1\.234\.567/);
  });

  it("supports currency format with explicit currency code", () => {
    const html = renderToString(
      <TickCounter target={1500} format="currency" currency="USD" />,
    );
    expect(html).toMatch(/\$1,500/);
  });

  it("supports percent format (multiplies by 100)", () => {
    const html = renderToString(
      <TickCounter target={0.42} format="percent" />,
    );
    expect(html).toContain("42%");
  });

  it("supports precision (fraction digits)", () => {
    const html = renderToString(
      <TickCounter target={1234.567} precision={2} />,
    );
    expect(html).toContain("1,234.57");
  });

  it("renders an optional suffix after the number", () => {
    const html = renderToString(<TickCounter target={100} suffix="+" />);
    expect(html).toContain("100+");
  });

  it("respects reduced-motion (shows final value, no count-up)", () => {
    mockMatchMedia("(prefers-reduced-motion: reduce)", true);
    render(<TickCounter target={1000} />);
    expect(screen.getByText(/1,000/)).toBeTruthy();
  });

  it("uses aria-label fallback to the final target value when none is provided", () => {
    const { container } = render(<TickCounter target={500} />);
    const span = container.querySelector("span");
    expect(span?.getAttribute("aria-label")).toBe("500");
  });

  it("does not use aria-live (avoids per-frame screen-reader spam)", () => {
    const { container } = render(<TickCounter target={500} />);
    const span = container.querySelector("span");
    expect(span?.getAttribute("aria-live")).toBeNull();
  });

  it("applies tabular-nums fontVariantNumeric for stable column width", () => {
    const { container } = render(<TickCounter target={1} />);
    const span = container.querySelector("span") as HTMLSpanElement;
    expect(span.style.fontVariantNumeric).toBe("tabular-nums");
  });

  // Codex P2: format=currency + currency eksik → Intl throw etmemeli, plain'e düşmeli.
  it("does not throw when format='currency' is used without a currency code", () => {
    expect(() => {
      const html = renderToString(<TickCounter target={1500} format="currency" />);
      expect(html).toContain("1,500");
    }).not.toThrow();
  });

  // Codex P1: imperative start() viewport içinde animasyonu YENİDEN koşturmalı.
  // (Bug: start() sadece ref bump'lıyor, effect dependency değişmediği için
  //  RAF planlanmıyor → sayaç startValue'da takılı kalıyor.)
  it("re-runs the count-up when start() is called imperatively while in view", () => {
    // performance.now'ı 0'a sabitle: effect'in yakaladığı start=0 olsun ki
    // mockRAF'ın 0-tabanlı saatiyle progress hesabı deterministik olsun.
    const originalNow = performance.now;
    performance.now = () => 0;
    try {
      const ref = createRef<Pick<MotionRef, "start" | "reset">>();
      const { container } = render(
        <TickCounter ref={ref} target={100} startValue={0} durationMs={100} />,
      );
      const span = container.querySelector("span") as HTMLSpanElement;

      // Viewport'a gir → ilk count-up target'a ulaşsın.
      act(() => {
        mockIO.trigger(true, span);
      });
      act(() => {
        raf.step(10); // now=160 > durationMs → target'a var
      });
      expect(span.textContent).toBe("100");

      // reset → başa dön, animasyon dursun.
      act(() => {
        ref.current!.reset();
      });
      expect(span.textContent).toBe("0");

      // Imperative start → animasyon yeniden koşmalı (bug'da 0'da kalır).
      act(() => {
        ref.current!.start();
      });
      act(() => {
        raf.step(1);
      });
      expect(Number(span.textContent)).toBeGreaterThan(0);
    } finally {
      performance.now = originalNow;
    }
  });
});
