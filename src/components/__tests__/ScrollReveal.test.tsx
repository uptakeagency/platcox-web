import { describe, it, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import ScrollReveal from "../ScrollReveal";

describe("ScrollReveal", () => {
  it("renders children correctly", () => {
    render(<ScrollReveal><p>Hello World</p></ScrollReveal>);
    // getByText throws if element not found, so reaching here = success
    expect(screen.getByText("Hello World")).toBeTruthy();
  });

  it("defaults to fade-up animation (renders a motion div)", () => {
    const { container } = render(
      <ScrollReveal><span>Content</span></ScrollReveal>
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toBeTruthy();
    expect(wrapper.tagName).toBe("DIV");
    // Framer Motion applies initial styles; opacity should start at 0 for fade-up
    expect(wrapper.style.opacity).toBe("0");
  });

  it("applies custom className", () => {
    const { container } = render(
      <ScrollReveal className="my-custom-class"><p>Test</p></ScrollReveal>
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.classList.contains("my-custom-class")).toBe(true);
  });

  it("accepts all 7 animation types without error", () => {
    const animations = [
      "fade-up",
      "fade-in",
      "slide-left",
      "slide-right",
      "scale-up",
      "split-left",
      "split-right",
    ] as const;

    for (const animation of animations) {
      const { container, unmount } = render(
        <ScrollReveal animation={animation}>
          <p>{animation}</p>
        </ScrollReveal>
      );
      const wrapper = container.firstElementChild as HTMLElement;
      expect(wrapper).toBeTruthy();
      expect(screen.getByText(animation)).toBeTruthy();
      unmount();
    }
  });

  it("passes delay and duration props without error", () => {
    const { container } = render(
      <ScrollReveal delay={0.3} duration={1.2}>
        <p>Delayed</p>
      </ScrollReveal>
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toBeTruthy();
    expect(screen.getByText("Delayed")).toBeTruthy();
  });
});
