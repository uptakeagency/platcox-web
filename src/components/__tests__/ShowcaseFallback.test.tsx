import { describe, it, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import ShowcaseFallback from "../cinematic/ShowcaseFallback";

describe("ShowcaseFallback", () => {
  it("renders both images with alt text", () => {
    render(<ShowcaseFallback />);
    const imgA = screen.getByAltText(/traditional.*trade/i);
    const imgB = screen.getByAltText(/network.*trade/i);
    expect(imgA).toBeTruthy();
    expect(imgB).toBeTruthy();
  });

  it("renders the manifesto copy", () => {
    render(<ShowcaseFallback />);
    expect(screen.getByText(/global trade/i)).toBeTruthy();
    expect(screen.getByText(/redefined/i)).toBeTruthy();
  });

  it("uses semantic img elements pointing to the cinematic assets", () => {
    const { container } = render(<ShowcaseFallback />);
    const srcs = Array.from(container.querySelectorAll("img")).map((n) => n.getAttribute("src"));
    expect(srcs).toContain("/images/cinematic/cinematic-a.webp");
    expect(srcs).toContain("/images/cinematic/cinematic-b.webp");
  });
});
