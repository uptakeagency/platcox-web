import { describe, it, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import TestimonialsCarousel from "../TestimonialsCarousel";

describe("TestimonialsCarousel", () => {
  it("renders all 5 testimonial cards", () => {
    render(<TestimonialsCarousel />);

    const quotes = screen.getAllByText(/^"/);
    expect(quotes).toHaveLength(5);
  });

  it("each card shows company name and quote", () => {
    render(<TestimonialsCarousel />);

    expect(screen.getByText("PARTNER")).toBeTruthy();
    expect(screen.getByText("BRAND")).toBeTruthy();
    expect(screen.getByText("RETAILER")).toBeTruthy();
    expect(screen.getByText("MANUFACTURER")).toBeTruthy();
    expect(screen.getByText("DISTRIBUTOR")).toBeTruthy();

    expect(
      screen.getByText(/PlatcoX transformed our cross-border/),
    ).toBeTruthy();
    expect(
      screen.getByText(/From sourcing to delivery/),
    ).toBeTruthy();
    expect(
      screen.getByText(/They don't just consult/),
    ).toBeTruthy();
    expect(
      screen.getByText(/gave us access to markets/),
    ).toBeTruthy();
    expect(
      screen.getByText(/operational discipline is unlike/),
    ).toBeTruthy();
  });

  it("cards have correct styling classes", () => {
    const { container } = render(<TestimonialsCarousel />);

    // Scroll container has horizontal overflow and snap
    const scrollContainer = container.firstElementChild as HTMLElement;
    expect(scrollContainer.className).toContain("overflow-x-auto");
    expect(scrollContainer.className).toContain("snap-x");
    expect(scrollContainer.className).toContain("cursor-grab");

    // Each card has surface-alt background and snap-start
    const cards = scrollContainer.children;
    expect(cards).toHaveLength(5);

    for (const card of Array.from(cards)) {
      expect((card as HTMLElement).className).toContain("bg-[#F5F5F5]");
      expect((card as HTMLElement).className).toContain("snap-start");
    }
  });
});
