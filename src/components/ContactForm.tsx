import { type FormEvent } from "react";

const MAX_MESSAGE_LENGTH = 1500;
const inputClass =
  "w-full border-b border-border bg-transparent py-3 text-foreground placeholder:text-muted focus:border-foreground focus:outline-none";

export default function ContactForm() {
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    const { name = "", email = "", message = "" } = data;
    const subject = encodeURIComponent(`Inquiry from ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
    window.location.href = `mailto:cem@platcox.com?subject=${subject}&body=${body}`;
  }

  return (
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
          maxLength={MAX_MESSAGE_LENGTH}
          className={`resize-none ${inputClass}`}
        />
      </div>

      <button
        type="submit"
        className="bg-foreground px-8 py-3 text-sm font-medium text-bg transition-opacity hover:opacity-80"
      >
        Send Message
      </button>
    </form>
  );
}
