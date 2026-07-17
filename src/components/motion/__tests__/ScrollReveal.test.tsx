import { describe, it, expect, beforeEach } from "bun:test";
import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import ScrollReveal from "../ScrollReveal";
import { __resetPoolsForTesting } from "../hooks/useInViewport";
import { mockMatchMedia } from "./helpers/mockMatchMedia";
import { mockIntersectionObserver } from "./helpers/mockIntersectionObserver";

describe("ScrollReveal — SSR-visible refactor", () => {
  beforeEach(() => {
    __resetPoolsForTesting();
    mockMatchMedia("(prefers-reduced-motion: reduce)", false);
    mockIntersectionObserver();
  });

  it("renders children in SSR HTML without hidden inline state", () => {
    const html = renderToString(
      <ScrollReveal animation="fade-up">
        <h1>Where Global Trade</h1>
      </ScrollReveal>
    );
    expect(html).toContain("Where Global Trade");
    // SSR markup'ı gizli stil içermemeli (opacity:0 / translateY).
    expect(html).not.toMatch(/opacity:\s*0/);
    expect(html).not.toContain("transform:translateY");
  });

  it("renders children in the DOM after mount", () => {
    render(
      <ScrollReveal animation="fade-up">
        <h1>Visible</h1>
      </ScrollReveal>
    );
    expect(screen.getByText("Visible")).toBeTruthy();
  });

  it("respects prefers-reduced-motion (no inline opacity:0 in rendered element)", () => {
    mockMatchMedia("(prefers-reduced-motion: reduce)", true);
    const { container } = render(
      <ScrollReveal animation="fade-up">
        <p>Content</p>
      </ScrollReveal>
    );
    const root = container.firstChild as HTMLElement;
    expect(root.style.opacity === "" || root.style.opacity === "1").toBe(true);
  });
});
