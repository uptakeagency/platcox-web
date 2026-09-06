import { useEffect, useState, type FormEvent } from "react";

export const CONTACT_ENDPOINT = "/api/contact";
export const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

// Turnstile widget'ı global script yükleyip implicit render ile kendini dolduruyor.
declare global {
  interface Window {
    turnstile?: { reset?: () => void };
  }
}

type Status = "idle" | "sending" | "sent" | "error";

const inputClass =
  "w-full border-b border-border bg-transparent py-3 text-foreground placeholder:text-muted focus:border-foreground focus:outline-none";

export default function ContactForm({ turnstileSiteKey }: { turnstileSiteKey: string }) {
  const [status, setStatus] = useState<Status>("idle");

  // Script tek sefer eklenir; birden fazla bileşen/yeniden render aynısını paylaşır.
  useEffect(() => {
    if (document.querySelector(`script[src="${TURNSTILE_SCRIPT_SRC}"]`)) return;
    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus("sending");

    try {
      const res = await fetch(CONTACT_ENDPOINT, { method: "POST", body: new FormData(form) });
      const data = res.ok ? ((await res.json().catch(() => null)) as { ok?: boolean } | null) : null;
      if (res.ok && data?.ok === true) {
        setStatus("sent");
      } else {
        setStatus("error");
        window.turnstile?.reset?.();
      }
    } catch {
      setStatus("error");
      window.turnstile?.reset?.();
    }
  }

  if (status === "sent") {
    return <p role="status">Thanks, your message has been sent. We will get back to you shortly.</p>;
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <input
            type="text"
            name="name"
            placeholder="Name"
            required
            maxLength={100}
            className={inputClass}
          />
        </div>
        <div>
          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            maxLength={200}
            className={inputClass}
          />
        </div>
        <div>
          <textarea
            name="message"
            placeholder="Message"
            required
            rows={4}
            maxLength={1500}
            className={`resize-none ${inputClass}`}
          />
        </div>

        {/* Bal küpü: botlar dolduracak, insanlar görmeyecek */}
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />

        <div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-theme="light" />

        <button
          type="submit"
          disabled={status === "sending"}
          className="bg-foreground px-8 py-3 text-sm font-medium text-bg transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          {status === "sending" ? "Sending..." : "Send Message"}
        </button>
      </form>

      {status === "error" && (
        <p role="alert" className="text-sm text-red-600">
          Something went wrong. Please try again or email us directly.
        </p>
      )}
    </>
  );
}
