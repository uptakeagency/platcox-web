import { describe, it, expect, beforeEach } from "bun:test";
import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import NumberedReveal from "../primitives/NumberedReveal";
import { __resetPoolsForTesting } from "../hooks/useInViewport";
import { mockMatchMedia } from "./helpers/mockMatchMedia";
import { mockIntersectionObserver } from "./helpers/mockIntersectionObserver";

const sampleItems = [
  { num: "/0.1", title: "Strategy is not an afterthought." },
  { num: "/0.2", title: "Operations breathe with intent." },
  { num: "/0.3", title: "Numbers earn their place." },
];

describe("NumberedReveal", () => {
  beforeEach(() => {
    __resetPoolsForTesting();
    mockMatchMedia("(prefers-reduced-motion: reduce)", false);
    mockIntersectionObserver();
  });

  it("renders all items in SSR HTML (visible end-state, no opacity:0 inline)", () => {
    const html = renderToString(<NumberedReveal items={sampleItems} />);
    expect(html).toContain("Strategy is not an afterthought.");
    expect(html).toContain("Operations breathe with intent.");
    expect(html).toContain("/0.1");
    expect(html).not.toMatch(/opacity:\s*0/);
  });

  it("renders numbers and titles in the DOM after mount", () => {
    render(<NumberedReveal items={sampleItems} />);
    expect(screen.getByText("/0.1")).toBeTruthy();
    expect(screen.getByText("Strategy is not an afterthought.")).toBeTruthy();
  });

  it("renders as an ordered list (semantic a11y)", () => {
    const { container } = render(<NumberedReveal items={sampleItems} />);
    const list = container.querySelector("ol");
    expect(list).toBeTruthy();
    expect(list?.children.length).toBe(sampleItems.length);
  });

  it("under prefers-reduced-motion, all items still render with full text", () => {
    mockMatchMedia("(prefers-reduced-motion: reduce)", true);
    const { container } = render(<NumberedReveal items={sampleItems} />);
    sampleItems.forEach((item) => {
      expect(container.textContent).toContain(item.title);
    });
  });

  it("renders optional description when provided on an item", () => {
    const itemsWithDesc = sampleItems.map((it, i) => ({
      ...it,
      description: `Subtitle ${i + 1}`,
    }));
    const { container } = render(<NumberedReveal items={itemsWithDesc} />);
    expect(container.textContent).toContain("Subtitle 1");
    expect(container.textContent).toContain("Subtitle 3");
  });

  it("accepts a custom staggerDelay prop without crashing", () => {
    const { container } = render(
      <NumberedReveal items={sampleItems} staggerDelay={250} />,
    );
    expect(container.firstChild).toBeTruthy();
  });

  // Codex P2 regresyon: num ve title span'leri arasında textContent separator.
  it("inserts visible whitespace between num and title (textContent regression)", () => {
    const { container } = render(<NumberedReveal items={sampleItems} />);
    const items = container.querySelectorAll("li");
    expect(items[0].textContent).toContain("/0.1 Strategy");
  });
});
