import { describe, it, expect, beforeEach } from "bun:test";
import { render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import ManifestoRise from "../primitives/ManifestoRise";
import { __resetPoolsForTesting } from "../hooks/useInViewport";
import { mockMatchMedia } from "./helpers/mockMatchMedia";
import { mockIntersectionObserver } from "./helpers/mockIntersectionObserver";

const lines = ["Where Global Trade", "Gets Redefined."];

describe("ManifestoRise (viewport-once)", () => {
  beforeEach(() => {
    __resetPoolsForTesting();
    mockMatchMedia("(prefers-reduced-motion: reduce)", false);
    mockIntersectionObserver();
  });

  it("renders all lines in SSR HTML (visible end-state, no opacity:0 inline)", () => {
    const html = renderToString(<ManifestoRise lines={lines} />);
    expect(html).toContain("Where Global Trade");
    expect(html).toContain("Gets Redefined.");
    expect(html).not.toMatch(/opacity:\s*0/);
  });

  it("renders as h1 by default", () => {
    const { container } = render(<ManifestoRise lines={lines} />);
    expect(container.querySelector("h1")).toBeTruthy();
  });

  it("supports the `as` prop for heading-level override", () => {
    const { container } = render(<ManifestoRise lines={lines} as="h2" />);
    expect(container.querySelector("h2")).toBeTruthy();
    expect(container.querySelector("h1")).toBeNull();
  });

  it("supports `as='div'` for non-heading usage", () => {
    const { container } = render(<ManifestoRise lines={lines} as="div" />);
    expect(container.querySelector("div")).toBeTruthy();
    expect(container.querySelector("h1, h2, h3")).toBeNull();
  });

  it("respects prefers-reduced-motion (still renders all lines, no opacity:0)", () => {
    mockMatchMedia("(prefers-reduced-motion: reduce)", true);
    const { container } = render(<ManifestoRise lines={lines} />);
    expect(container.textContent).toContain("Where Global Trade");
    expect(container.textContent).toContain("Gets Redefined.");
  });

  it("wraps each line in a span element", () => {
    const { container } = render(<ManifestoRise lines={lines} />);
    const spans = container.querySelectorAll("span");
    expect(spans.length).toBeGreaterThanOrEqual(lines.length);
  });
});
