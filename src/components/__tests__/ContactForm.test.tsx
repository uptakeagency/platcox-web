import { describe, it, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import ContactForm from "../ContactForm";

describe("ContactForm", () => {
  it("renders form with name, email, message fields", () => {
    render(<ContactForm />);

    expect(screen.getByPlaceholderText("Name")).toBeTruthy();
    expect(screen.getByPlaceholderText("Email")).toBeTruthy();
    expect(screen.getByPlaceholderText("Message")).toBeTruthy();
  });

  it("renders submit button with 'Send Message' text", () => {
    render(<ContactForm />);

    const button = screen.getByRole("button", { name: "Send Message" });
    expect(button).toBeTruthy();
    expect(button.getAttribute("type")).toBe("submit");
  });

  it("all inputs are required", () => {
    render(<ContactForm />);

    const name = screen.getByPlaceholderText("Name") as HTMLInputElement;
    const email = screen.getByPlaceholderText("Email") as HTMLInputElement;
    const message = screen.getByPlaceholderText("Message") as HTMLTextAreaElement;

    expect(name.required).toBe(true);
    expect(email.required).toBe(true);
    expect(message.required).toBe(true);
  });

  it("email input has type email", () => {
    render(<ContactForm />);

    const email = screen.getByPlaceholderText("Email") as HTMLInputElement;
    expect(email.type).toBe("email");
  });

  it("uses bottom-border-only input styling (no boxed inputs)", () => {
    render(<ContactForm />);

    const name = screen.getByPlaceholderText("Name") as HTMLInputElement;
    // Bottom-border inputs should have border-b class and bg-transparent
    expect(name.className).toContain("border-b");
    expect(name.className).toContain("bg-transparent");
  });

  it("submit button has dark background (#1A1A1A), not green", () => {
    render(<ContactForm />);

    const button = screen.getByRole("button", { name: "Send Message" });
    expect(button.className).toContain("bg-[#1A1A1A]");
    expect(button.className).toContain("text-white");
    expect(button.className).not.toContain("bg-[#22C55E]");
  });
});
