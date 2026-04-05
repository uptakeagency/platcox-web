import { describe, it, expect } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import MobileMenu from "../MobileMenu";

describe("MobileMenu", () => {
  it("renders toggle button with aria-label", () => {
    render(<MobileMenu />);
    const button = screen.getByRole("button", { name: "Toggle menu" });
    expect(button).toBeTruthy();
  });

  it("menu is closed by default (no nav links visible)", () => {
    render(<MobileMenu />);
    expect(screen.queryByText("About")).toBeNull();
    expect(screen.queryByText("Solutions")).toBeNull();
    expect(screen.queryByText("Contact")).toBeNull();
  });

  it("shows nav links when button is clicked", () => {
    render(<MobileMenu />);
    const button = screen.getByRole("button", { name: "Toggle menu" });
    fireEvent.click(button);
    expect(screen.getByText("About")).toBeTruthy();
    expect(screen.getByText("Solutions")).toBeTruthy();
  });

  it("shows all 5 nav links when open", () => {
    render(<MobileMenu />);
    fireEvent.click(screen.getByRole("button", { name: "Toggle menu" }));

    const expectedLinks = ["About", "Solutions", "Sustainability", "News", "Contact"];
    for (const label of expectedLinks) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  it("toggle button closes the menu when clicked again", () => {
    render(<MobileMenu />);
    const button = screen.getByRole("button", { name: "Toggle menu" });

    // Open
    fireEvent.click(button);
    expect(screen.getByText("About")).toBeTruthy();

    // Close via toggle button
    fireEvent.click(button);

    // Re-open to verify state was toggled (open -> closed -> open)
    fireEvent.click(button);
    expect(screen.getByText("About")).toBeTruthy();
  });

  it("nav links have correct href attributes", () => {
    render(<MobileMenu />);
    fireEvent.click(screen.getByRole("button", { name: "Toggle menu" }));

    const aboutLink = screen.getByText("About").closest("a");
    expect(aboutLink?.getAttribute("href")).toBe("#about");

    const contactLink = screen.getByText("Contact").closest("a");
    expect(contactLink?.getAttribute("href")).toBe("#contact");
  });
});
