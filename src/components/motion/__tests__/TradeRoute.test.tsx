import { describe, it, expect } from "bun:test";
import { render } from "@testing-library/react";
import TradeRoute from "../primitives/TradeRoute";

describe("TradeRoute", () => {
  it("renders SVG with from/to circle endpoints", () => {
    const { container } = render(
      <TradeRoute from={{ x: 20, y: 80 }} to={{ x: 180, y: 20 }} />,
    );
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    const circles = container.querySelectorAll("circle");
    expect(circles.length).toBe(2);
    expect(circles[0].getAttribute("cx")).toBe("20");
    expect(circles[0].getAttribute("cy")).toBe("80");
    expect(circles[1].getAttribute("cx")).toBe("180");
    expect(circles[1].getAttribute("cy")).toBe("20");
  });

  it("includes SMIL animate element with correct dur", () => {
    const { container } = render(
      <TradeRoute
        from={{ x: 0, y: 0 }}
        to={{ x: 100, y: 100 }}
        durationMs={1200}
      />,
    );
    const animate = container.querySelector("animate");
    expect(animate).toBeTruthy();
    expect(animate?.getAttribute("dur")).toBe("1200ms");
    expect(animate?.getAttribute("attributeName")).toBe("stroke-dashoffset");
  });

  it("uses data-motion-trigger='viewport-once' by default", () => {
    const { container } = render(
      <TradeRoute from={{ x: 0, y: 0 }} to={{ x: 100, y: 100 }} />,
    );
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("data-motion-trigger")).toBe("viewport-once");
  });

  it("emits data-motion-id when trigger is manual", () => {
    const { container } = render(
      <TradeRoute
        from={{ x: 0, y: 0 }}
        to={{ x: 100, y: 100 }}
        trigger="manual"
        id="route-1"
      />,
    );
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("data-motion-trigger")).toBe("manual");
    expect(svg?.getAttribute("data-motion-id")).toBe("route-1");
  });

  it("applies role=img + aria-label when ariaLabel is provided", () => {
    const { container } = render(
      <TradeRoute
        from={{ x: 0, y: 0 }}
        to={{ x: 100, y: 100 }}
        ariaLabel="Karachi to Hamburg trade route"
      />,
    );
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("role")).toBe("img");
    expect(svg?.getAttribute("aria-label")).toBe(
      "Karachi to Hamburg trade route",
    );
  });

  it("applies role=presentation when ariaLabel is omitted", () => {
    const { container } = render(
      <TradeRoute from={{ x: 0, y: 0 }} to={{ x: 100, y: 100 }} />,
    );
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("role")).toBe("presentation");
  });

  it("marks the svg with data-motion-reduced-end-state for the global CSS pin", () => {
    const { container } = render(
      <TradeRoute from={{ x: 0, y: 0 }} to={{ x: 100, y: 100 }} />,
    );
    const svg = container.querySelector("svg");
    expect(svg?.hasAttribute("data-motion-reduced-end-state")).toBe(true);
  });
});
