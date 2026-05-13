import { describe, it, expect, beforeEach } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import { createRef } from "react";
import DecisionPulse from "../primitives/DecisionPulse";
import { __resetPoolsForTesting } from "../hooks/useInViewport";
import { mockMatchMedia } from "./helpers/mockMatchMedia";
import { mockIntersectionObserver } from "./helpers/mockIntersectionObserver";

describe("DecisionPulse", () => {
  beforeEach(() => {
    __resetPoolsForTesting();
    mockMatchMedia("(prefers-reduced-motion: reduce)", false);
    mockIntersectionObserver();
  });

  it("renders title and value text", () => {
    render(<DecisionPulse title="Stock-out risk" value="+12%" />);
    expect(screen.getByText("Stock-out risk")).toBeTruthy();
    expect(screen.getByText("+12%")).toBeTruthy();
  });

  it("renders as a <button> when onActivate is provided", () => {
    render(
      <DecisionPulse title="X" value="1" onActivate={() => {}} />,
    );
    expect(screen.getByRole("button")).toBeTruthy();
  });

  it("renders as a static <div> when onActivate is omitted", () => {
    render(<DecisionPulse title="X" value="1" />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("calls onActivate when the button is clicked", () => {
    let called = 0;
    render(
      <DecisionPulse
        title="X"
        value="1"
        onActivate={() => {
          called += 1;
        }}
      />,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(called).toBe(1);
  });

  it("pulse=false disables the pulse ring", () => {
    const { container } = render(
      <DecisionPulse title="X" value="1" pulse={false} />,
    );
    expect(container.querySelector("[data-pulse-ring]")).toBeNull();
  });

  it("exposes an imperative start() via ref", () => {
    const ref = createRef<{ start: () => void }>();
    render(<DecisionPulse ref={ref} title="X" value="1" />);
    expect(typeof ref.current?.start).toBe("function");
    // Çağırması yan etki üretmeli (state update); throw etmemeli.
    ref.current?.start();
  });

  it("falls back aria-label to '{title}: {value}' when none provided", () => {
    const { container } = render(<DecisionPulse title="Risk" value="42" />);
    const root = container.firstChild as HTMLElement;
    expect(root.getAttribute("aria-label")).toBe("Risk: 42");
  });

  it("under reduced-motion, pulse ring DOM still present (CSS controls play state)", () => {
    mockMatchMedia("(prefers-reduced-motion: reduce)", true);
    const { container } = render(<DecisionPulse title="X" value="1" />);
    // Element gerçek browser'da CSS @media ile paused olur; testte DOM presence yeterli.
    // Reduced-motion altında pulse de mantıken kapatılabilir; current spec presence bekliyor.
    expect(container.querySelector("[data-pulse-ring]")).toBeTruthy();
  });
});
