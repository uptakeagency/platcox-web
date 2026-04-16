import { describe, it, expect, beforeEach } from "bun:test";
import { render, screen } from "@testing-library/react";
import ShowcaseCanvas from "../cinematic/ShowcaseCanvas";

function setMatchMedia(matchesByQuery: Record<string, boolean>) {
  (window as any).matchMedia = (q: string) => ({
    matches: matchesByQuery[q] ?? false,
    media: q,
    addEventListener: () => {},
    removeEventListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  });
}

describe("ShowcaseCanvas integration", () => {
  beforeEach(() => {
    setMatchMedia({});
  });

  it("renders the static fallback when prefers-reduced-motion is set", () => {
    setMatchMedia({ "(prefers-reduced-motion: reduce)": true });
    render(<ShowcaseCanvas />);
    expect(screen.getByAltText(/traditional.*trade/i)).toBeTruthy();
    expect(screen.getByAltText(/network.*trade/i)).toBeTruthy();
    expect(screen.getByText(/redefined/i)).toBeTruthy();
  });

  it("does NOT render a <canvas> element in the reduced-motion branch", () => {
    setMatchMedia({ "(prefers-reduced-motion: reduce)": true });
    const { container } = render(<ShowcaseCanvas />);
    expect(container.querySelector("canvas")).toBeNull();
  });
});
