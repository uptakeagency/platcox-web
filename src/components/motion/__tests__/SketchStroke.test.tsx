import { describe, it, expect } from "bun:test";
import { render } from "@testing-library/react";
import SketchStroke from "../primitives/SketchStroke";

describe("SketchStroke", () => {
  it("renders the default 'circle' shape", () => {
    const { container } = render(<SketchStroke />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    const path = container.querySelector("path");
    expect(path).toBeTruthy();
    expect(path?.getAttribute("d")).toContain("M 60 20");
  });

  it("renders 'ring' shape with a circle-only path", () => {
    const { container } = render(<SketchStroke shape="ring" />);
    const path = container.querySelector("path");
    expect(path?.getAttribute("d")).toContain("A 30 30");
    expect(path?.getAttribute("fill")).toBe("none");
  });

  it("renders 'arrow' shape", () => {
    const { container } = render(<SketchStroke shape="arrow" />);
    const path = container.querySelector("path");
    expect(path?.getAttribute("d")).toContain("L 90 50");
  });

  it("renders 'custom' shape with the provided path", () => {
    const { container } = render(
      <SketchStroke shape="custom" path="M 0 0 L 50 50 Z" />,
    );
    const path = container.querySelector("path");
    expect(path?.getAttribute("d")).toBe("M 0 0 L 50 50 Z");
  });

  it("uses durationMs (default 1200) in SMIL dur", () => {
    const { container } = render(<SketchStroke />);
    const animate = container.querySelector("animate");
    expect(animate?.getAttribute("dur")).toBe("1200ms");
  });

  it("uses a custom durationMs in SMIL dur", () => {
    const { container } = render(<SketchStroke durationMs={600} />);
    const animate = container.querySelector("animate");
    expect(animate?.getAttribute("dur")).toBe("600ms");
  });

  it("always renders as role='presentation' (decorative)", () => {
    const { container } = render(<SketchStroke />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("role")).toBe("presentation");
  });

  it("marks the svg with data-motion-reduced-end-state", () => {
    const { container } = render(<SketchStroke />);
    const svg = container.querySelector("svg");
    expect(svg?.hasAttribute("data-motion-reduced-end-state")).toBe(true);
  });
});
