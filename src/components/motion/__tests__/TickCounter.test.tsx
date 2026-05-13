import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import TickCounter from "../primitives/TickCounter";
import { __resetPoolsForTesting } from "../hooks/useInViewport";
import { mockMatchMedia } from "./helpers/mockMatchMedia";
import { mockIntersectionObserver } from "./helpers/mockIntersectionObserver";
import { mockRAF, type MockRAF } from "./helpers/mockRAF";

describe("TickCounter", () => {
  let raf: MockRAF;

  beforeEach(() => {
    __resetPoolsForTesting();
    mockMatchMedia("(prefers-reduced-motion: reduce)", false);
    mockIntersectionObserver();
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

  it("uses aria-label fallback to the formatted value when none is provided", () => {
    const { container } = render(<TickCounter target={500} />);
    const span = container.querySelector("span");
    expect(span?.getAttribute("aria-label")).toBe("500");
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
});
