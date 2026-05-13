import { describe, it, expect, beforeEach } from "bun:test";
import { render, fireEvent } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import OntologyGraph from "../primitives/OntologyGraph";
import { __resetPoolsForTesting } from "../hooks/useInViewport";
import { mockMatchMedia } from "./helpers/mockMatchMedia";
import { mockIntersectionObserver } from "./helpers/mockIntersectionObserver";

const sampleGraph = {
  nodes: [
    { id: "n1", x: 50, y: 40, label: "Sourcing" },
    { id: "n2", x: 100, y: 60, label: "Strategy" },
    { id: "n3", x: 160, y: 30, label: "Operations" },
  ],
  edges: [
    { from: "n1", to: "n2" },
    { from: "n2", to: "n3" },
  ],
};

describe("OntologyGraph", () => {
  beforeEach(() => {
    __resetPoolsForTesting();
    mockMatchMedia("(prefers-reduced-motion: reduce)", false);
    mockIntersectionObserver();
  });

  it("renders all nodes and edges in SSR HTML with ariaLabel", () => {
    const html = renderToString(
      <OntologyGraph {...sampleGraph} ariaLabel="C.O.D.E graph" />,
    );
    expect(html).toContain("Sourcing");
    expect(html).toContain("Strategy");
    expect(html).toContain("Operations");
    expect(html).toContain('aria-label="C.O.D.E graph"');
  });

  it("renders one <line> per edge", () => {
    const { container } = render(
      <OntologyGraph {...sampleGraph} ariaLabel="x" />,
    );
    const lines = container.querySelectorAll("[data-ontology-edge]");
    expect(lines.length).toBe(sampleGraph.edges.length);
  });

  it("renders one node group per node with role=button and tabindex=0", () => {
    const { container } = render(
      <OntologyGraph {...sampleGraph} ariaLabel="x" />,
    );
    const nodes = container.querySelectorAll('[role="button"][tabindex="0"]');
    expect(nodes.length).toBe(sampleGraph.nodes.length);
  });

  it("Enter key on a node opens the detail overlay", () => {
    const { container } = render(
      <OntologyGraph {...sampleGraph} ariaLabel="x" />,
    );
    const firstNode = container.querySelector('[role="button"]') as HTMLElement;
    fireEvent.keyDown(firstNode, { key: "Enter" });
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("data-detail-open")).toBe("true");
  });

  it("Space key on a node toggles the detail overlay", () => {
    const { container } = render(
      <OntologyGraph {...sampleGraph} ariaLabel="x" />,
    );
    const firstNode = container.querySelector('[role="button"]') as HTMLElement;
    fireEvent.keyDown(firstNode, { key: " " });
    let svg = container.querySelector("svg");
    expect(svg?.getAttribute("data-detail-open")).toBe("true");
    // İkinci basış kapatmalı (toggle)
    fireEvent.keyDown(firstNode, { key: " " });
    svg = container.querySelector("svg");
    expect(svg?.getAttribute("data-detail-open")).toBe("false");
  });

  it("Escape closes an open detail overlay (window-level)", () => {
    const { container } = render(
      <OntologyGraph {...sampleGraph} ariaLabel="x" />,
    );
    const firstNode = container.querySelector('[role="button"]') as HTMLElement;
    fireEvent.keyDown(firstNode, { key: "Enter" });
    expect(container.querySelector("svg")?.getAttribute("data-detail-open")).toBe(
      "true",
    );
    fireEvent.keyDown(window, { key: "Escape" });
    expect(container.querySelector("svg")?.getAttribute("data-detail-open")).toBe(
      "false",
    );
  });

  it("under reduced-motion the SVG still renders (animation pause is CSS-driven)", () => {
    mockMatchMedia("(prefers-reduced-motion: reduce)", true);
    const { container } = render(
      <OntologyGraph {...sampleGraph} ariaLabel="x" />,
    );
    expect(container.querySelector("svg")).toBeTruthy();
    expect(container.querySelectorAll("[data-ontology-node]").length).toBe(
      sampleGraph.nodes.length,
    );
  });

  it("dangling edge (referencing a missing node) is skipped silently", () => {
    const graphWithDangling = {
      nodes: [{ id: "n1", x: 0, y: 0, label: "A" }],
      edges: [
        { from: "n1", to: "ghost" },
        { from: "ghost", to: "n1" },
      ],
    };
    const { container } = render(
      <OntologyGraph {...graphWithDangling} ariaLabel="x" />,
    );
    expect(container.querySelectorAll("[data-ontology-edge]").length).toBe(0);
  });
});
