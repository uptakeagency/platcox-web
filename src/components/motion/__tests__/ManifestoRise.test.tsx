import { describe, it, expect, beforeEach, afterEach, spyOn } from "bun:test";
import { render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import ManifestoRise from "../primitives/ManifestoRise";
import { __resetPoolsForTesting } from "../hooks/useInViewport";
import { mockMatchMedia } from "./helpers/mockMatchMedia";
import { mockIntersectionObserver } from "./helpers/mockIntersectionObserver";
import { ScrollTrigger } from "gsap/ScrollTrigger";

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

  // Codex P2 regresyon: adjacent line span'leri textContent'te yapışmasın.
  it("separates adjacent lines with whitespace in textContent", () => {
    const { container } = render(<ManifestoRise lines={lines} />);
    expect(container.textContent).not.toContain("TradeGets");
    // Trade ve Gets arasında en az bir boşluk karakteri olmalı.
    expect(container.textContent).toMatch(/Trade\s+Gets/);
  });
});

// Phase 5 Task 5.3: scroll-progress variant.
describe("ManifestoRise (scroll-progress variant)", () => {
  let stCreate: ReturnType<typeof spyOn>;

  beforeEach(() => {
    __resetPoolsForTesting();
    mockMatchMedia("(prefers-reduced-motion: reduce)", false);
    mockIntersectionObserver();
    // ScrollTrigger.create jsdom'da heavy → davranışsal kontrata odaklan.
    stCreate = spyOn(ScrollTrigger, "create").mockReturnValue({
      kill: () => {},
    } as unknown as ScrollTrigger);
    spyOn(ScrollTrigger, "update").mockImplementation(() => {});
    spyOn(ScrollTrigger, "refresh").mockImplementation(() => {});
  });

  afterEach(() => {
    stCreate.mockRestore();
    document.body.innerHTML = "";
  });

  it("renders all lines in SSR with scroll-progress trigger (text contract)", () => {
    const html = renderToString(
      <ManifestoRise lines={lines} trigger="scroll-progress" sectionId="hero" />,
    );
    expect(html).toContain("Where Global Trade");
    expect(html).toContain("Gets Redefined.");
    expect(html).not.toMatch(/opacity:\s*0/);
  });

  it("wires useScrollProgress when sectionId + adapter provided", async () => {
    const trigger = document.createElement("section");
    trigger.id = "hero";
    document.body.appendChild(trigger);

    const fakeAdapter = {
      on: makeSpyOn(),
      off: makeSpyOn(),
    };
    render(
      <ManifestoRise
        lines={lines}
        trigger="scroll-progress"
        sectionId="hero"
        scrollAdapter={fakeAdapter}
      />,
    );
    // useScrollProgress GSAP'ı dinamik import ediyor (Codex P3) → create async.
    await flushAsyncImport();
    expect(stCreate.mock.calls.length).toBe(1);
    expect(fakeAdapter.on.callCount()).toBe(1);
  });

  it("scroll-progress variant respects reduced-motion (cleans up wiring after mount)", () => {
    mockMatchMedia("(prefers-reduced-motion: reduce)", true);
    const trigger = document.createElement("section");
    trigger.id = "hero";
    document.body.appendChild(trigger);

    const fakeAdapter = {
      on: makeSpyOn(),
      off: makeSpyOn(),
    };
    const { container } = render(
      <ManifestoRise
        lines={lines}
        trigger="scroll-progress"
        sectionId="hero"
        scrollAdapter={fakeAdapter}
      />,
    );
    // useReducedMotion SSR-safe: ilk render false, useEffect post-mount'ta
    // true'ya çevirir → useScrollProgress effect re-run + cleanup. Net etkide
    // on ve off çağrı sayıları eşitlenir; subscription kalmaz.
    expect(container.textContent).toContain("Where Global Trade");
    expect(fakeAdapter.on.callCount()).toBe(fakeAdapter.off.callCount());
  });

  it("scroll-progress variant skips wiring entirely in SSR (renderToString)", () => {
    mockMatchMedia("(prefers-reduced-motion: reduce)", true);
    const fakeAdapter = {
      on: makeSpyOn(),
      off: makeSpyOn(),
    };
    const html = renderToString(
      <ManifestoRise
        lines={lines}
        trigger="scroll-progress"
        sectionId="hero"
        scrollAdapter={fakeAdapter}
      />,
    );
    expect(html).toContain("Where Global Trade");
    expect(fakeAdapter.on.callCount()).toBe(0);
    expect(stCreate.mock.calls.length).toBe(0);
  });
});

function makeSpyOn() {
  let calls = 0;
  const fn = (..._args: unknown[]) => {
    calls += 1;
  };
  fn.callCount = () => calls;
  return fn;
}

// Hook GSAP'ı effect içinde dinamik import ediyor; modül I/O'su tek makro-task'tan
// uzun sürebildiği için önce cache'i ısıt, sonra bir tur bekle (bkz. useScrollProgress.test).
async function flushAsyncImport(): Promise<void> {
  await import("gsap");
  await import("gsap/ScrollTrigger");
  await new Promise((resolve) => setTimeout(resolve, 0));
}
