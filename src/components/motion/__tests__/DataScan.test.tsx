import { describe, it, expect, beforeEach } from "bun:test";
import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import DataScan from "../primitives/DataScan";
import { __resetPoolsForTesting } from "../hooks/useInViewport";
import { mockMatchMedia } from "./helpers/mockMatchMedia";
import { mockIntersectionObserver } from "./helpers/mockIntersectionObserver";

const rows = [
  { label: "Karachi to Rotterdam", value: "14d" },
  { label: "Shenzhen to Hamburg", value: "28d" },
  { label: "Istanbul to New York", value: "11d" },
];

describe("DataScan", () => {
  beforeEach(() => {
    __resetPoolsForTesting();
    mockMatchMedia("(prefers-reduced-motion: reduce)", false);
    mockIntersectionObserver();
  });

  it("renders all rows in SSR HTML with labels and values (no opacity:0)", () => {
    const html = renderToString(<DataScan rows={rows} />);
    expect(html).toContain("Karachi to Rotterdam");
    expect(html).toContain("14d");
    expect(html).toContain("Shenzhen to Hamburg");
    expect(html).not.toMatch(/opacity:\s*0/);
  });

  it("renders as a <dl> semantic element with one <dt>/<dd> pair per row", () => {
    const { container } = render(<DataScan rows={rows} />);
    expect(container.querySelector("dl")).toBeTruthy();
    expect(container.querySelectorAll("dt").length).toBe(rows.length);
    expect(container.querySelectorAll("dd").length).toBe(rows.length);
  });

  it("uses monospace fontFamily by default", () => {
    const { container } = render(<DataScan rows={rows} />);
    const root = container.firstChild as HTMLElement;
    expect(root.style.fontFamily).toMatch(/mono/i);
  });

  it("mono=false uses inherited fontFamily", () => {
    const { container } = render(<DataScan rows={rows} mono={false} />);
    const root = container.firstChild as HTMLElement;
    expect(root.style.fontFamily).not.toMatch(/mono/i);
  });

  it("renders a scan-bar when not under reduced-motion", () => {
    const { container } = render(<DataScan rows={rows} />);
    expect(container.querySelector("[data-scan-bar]")).toBeTruthy();
  });

  it("omits scan-bar under prefers-reduced-motion", () => {
    mockMatchMedia("(prefers-reduced-motion: reduce)", true);
    const { container } = render(<DataScan rows={rows} />);
    expect(container.querySelector("[data-scan-bar]")).toBeNull();
  });

  it("under reduced-motion all rows still visible", () => {
    mockMatchMedia("(prefers-reduced-motion: reduce)", true);
    render(<DataScan rows={rows} />);
    rows.forEach((r) => {
      expect(screen.getByText(r.label)).toBeTruthy();
    });
  });

  // Codex P2: <dl> sadece dt/dd grupları içerebilir; scan-bar dışında olmalı.
  it("does not place the scan-bar inside the <dl> (HTML semantic contract)", () => {
    const { container } = render(<DataScan rows={rows} />);
    const dl = container.querySelector("dl") as HTMLElement;
    const scanBar = container.querySelector("[data-scan-bar]") as HTMLElement;
    expect(dl).toBeTruthy();
    expect(scanBar).toBeTruthy();
    expect(dl.contains(scanBar)).toBe(false);
  });
});
