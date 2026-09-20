import { describe, it, expect, mock, spyOn, afterEach, beforeAll, afterAll } from "bun:test";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import ContactForm, { CONTACT_ENDPOINT, TURNSTILE_SCRIPT_SRC } from "../ContactForm";

const TEST_KEY = "test-key";
const originalFetch = globalThis.fetch;
const originalFormData = globalThis.FormData;

// Bun'ın native FormData'sı jsdom'un HTMLFormElement'inden alan okuyamıyor;
// jsdom'un kendi FormData'sı okuyabiliyor. Sadece bu dosyada değiştirip geri alıyoruz.
// Global swap: Bun test dosyalarını tek process'te sırayla koşturduğu için güvenli
// (afterAll'da eski değere dönülüyor); paralel koşumda diğer dosyaları etkilerdi.
beforeAll(() => {
  globalThis.FormData = (window as unknown as { FormData: typeof FormData }).FormData;
});

afterAll(() => {
  globalThis.FormData = originalFormData;
});

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  delete (window as unknown as { turnstile?: unknown }).turnstile;
});

function fillValidForm() {
  fireEvent.change(screen.getByPlaceholderText("Name"), { target: { value: "Ada" } });
  fireEvent.change(screen.getByPlaceholderText("Email"), {
    target: { value: "ada@example.com" },
  });
  fireEvent.change(screen.getByPlaceholderText("Message"), {
    target: { value: "Hello there" },
  });
}

function submitForm() {
  const form = screen.getByRole("button", { name: /send message/i }).closest("form");
  if (!form) throw new Error("form not found");
  fireEvent.submit(form);
}

function jsonOk(body: unknown): Response {
  return { ok: true, json: async () => body } as unknown as Response;
}

function jsonError(body: unknown): Response {
  return { ok: false, json: async () => body } as unknown as Response;
}

describe("ContactForm", () => {
  it("renders form with name, email, message fields", () => {
    render(<ContactForm turnstileSiteKey={TEST_KEY} />);

    expect(screen.getByPlaceholderText("Name")).toBeTruthy();
    expect(screen.getByPlaceholderText("Email")).toBeTruthy();
    expect(screen.getByPlaceholderText("Message")).toBeTruthy();
  });

  it("renders submit button with 'Send Message' text", () => {
    render(<ContactForm turnstileSiteKey={TEST_KEY} />);

    const button = screen.getByRole("button", { name: "Send Message" });
    expect(button).toBeTruthy();
    expect(button.getAttribute("type")).toBe("submit");
  });

  it("all inputs are required", () => {
    render(<ContactForm turnstileSiteKey={TEST_KEY} />);

    const name = screen.getByPlaceholderText("Name") as HTMLInputElement;
    const email = screen.getByPlaceholderText("Email") as HTMLInputElement;
    const message = screen.getByPlaceholderText("Message") as HTMLTextAreaElement;

    expect(name.required).toBe(true);
    expect(email.required).toBe(true);
    expect(message.required).toBe(true);
  });

  it("email input has type email", () => {
    render(<ContactForm turnstileSiteKey={TEST_KEY} />);

    const email = screen.getByPlaceholderText("Email") as HTMLInputElement;
    expect(email.type).toBe("email");
  });

  it("uses bottom-border-only input styling (no boxed inputs)", () => {
    render(<ContactForm turnstileSiteKey={TEST_KEY} />);

    const name = screen.getByPlaceholderText("Name") as HTMLInputElement;
    // Bottom-border inputs should have border-b class and bg-transparent
    expect(name.className).toContain("border-b");
    expect(name.className).toContain("bg-transparent");
  });

  it("submit button uses foreground (dark) background, not accent green", () => {
    render(<ContactForm turnstileSiteKey={TEST_KEY} />);

    const button = screen.getByRole("button", { name: "Send Message" });
    expect(button.className).toContain("bg-foreground");
    expect(button.className).toContain("text-bg");
    expect(button.className).not.toContain("bg-accent");
  });

  it("renders the Turnstile widget box with the given site key", () => {
    render(<ContactForm turnstileSiteKey={TEST_KEY} />);

    const box = document.querySelector(".cf-turnstile");
    expect(box).toBeTruthy();
    expect(box?.getAttribute("data-sitekey")).toBe(TEST_KEY);
  });

  it("loads the Turnstile script only once across multiple mounts", () => {
    render(<ContactForm turnstileSiteKey={TEST_KEY} />);
    render(<ContactForm turnstileSiteKey={TEST_KEY} />);

    const scripts = document.querySelectorAll(`script[src="${TURNSTILE_SCRIPT_SRC}"]`);
    expect(scripts.length).toBe(1);
  });

  it("includes a hidden, non-required honeypot field", () => {
    render(<ContactForm turnstileSiteKey={TEST_KEY} />);

    const honeypot = document.querySelector('input[name="contact_ref"]') as HTMLInputElement;
    expect(honeypot).toBeTruthy();
    expect(honeypot.required).toBe(false);
    expect(honeypot.tabIndex).toBe(-1);
    expect(honeypot.getAttribute("aria-hidden")).toBe("true");
  });

  it("submits form data to the contact endpoint via POST with a FormData body", async () => {
    const fetchMock = mock(async () => jsonOk({ ok: true }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    render(<ContactForm turnstileSiteKey={TEST_KEY} />);
    fillValidForm();
    submitForm();

    await waitFor(() => expect(fetchMock.mock.calls.length).toBe(1));

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(CONTACT_ENDPOINT);
    expect(init.method).toBe("POST");
    expect(init.body instanceof FormData).toBe(true);
    const body = init.body as FormData;
    expect(body.get("name")).toBe("Ada");
    expect(body.get("email")).toBe("ada@example.com");
    expect(body.get("message")).toBe("Hello there");
    expect(body.get("contact_ref")).toBe("");
  });

  it("shows a success message and removes the form after a successful submit", async () => {
    globalThis.fetch = mock(async () => jsonOk({ ok: true })) as unknown as typeof fetch;

    render(<ContactForm turnstileSiteKey={TEST_KEY} />);
    fillValidForm();
    submitForm();

    await waitFor(() => expect(screen.getByRole("status")).toBeTruthy());
    expect(screen.queryByPlaceholderText("Name")).toBeNull();
  });

  it("shows an error and resets Turnstile when the server rejects the submission", async () => {
    const consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});
    globalThis.fetch = mock(async () =>
      jsonError({ ok: false, error: "verification" }),
    ) as unknown as typeof fetch;
    const reset = mock(() => {});
    (window as unknown as { turnstile?: { reset?: () => void } }).turnstile = { reset };

    render(<ContactForm turnstileSiteKey={TEST_KEY} />);
    fillValidForm();
    submitForm();

    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect(screen.getByPlaceholderText("Name")).toBeTruthy();
    expect(reset.mock.calls.length).toBe(1);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    consoleErrorSpy.mockRestore();
  });

  it("shows an error message when the network request fails", async () => {
    const consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});
    globalThis.fetch = mock(() => Promise.reject(new Error("network down"))) as unknown as typeof fetch;

    render(<ContactForm turnstileSiteKey={TEST_KEY} />);
    fillValidForm();
    submitForm();

    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    const loggedText = consoleErrorSpy.mock.calls.flat().map(String).join(" ");
    expect(loggedText).toContain("network down");
    consoleErrorSpy.mockRestore();
  });

  it("disables the submit button and shows 'Sending...' while the request is in flight", async () => {
    globalThis.fetch = mock(() => new Promise<Response>(() => {})) as unknown as typeof fetch;

    render(<ContactForm turnstileSiteKey={TEST_KEY} />);
    fillValidForm();
    submitForm();

    await waitFor(() => {
      const button = screen.getByRole("button", { name: "Sending..." }) as HTMLButtonElement;
      expect(button.disabled).toBe(true);
    });
  });

  it("does not navigate away via window.location.href on submit", async () => {
    const initialHref = window.location.href;
    globalThis.fetch = mock(async () => jsonOk({ ok: true })) as unknown as typeof fetch;

    render(<ContactForm turnstileSiteKey={TEST_KEY} />);
    fillValidForm();
    submitForm();

    await waitFor(() => expect(screen.getByRole("status")).toBeTruthy());
    expect(window.location.href).toBe(initialHref);
  });
});
