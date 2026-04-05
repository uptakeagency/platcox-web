import { type FormEvent } from "react";

export default function ContactForm() {
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const subject = encodeURIComponent(`Inquiry from ${data.name}`);
    const body = encodeURIComponent(`Name: ${data.name}\nEmail: ${data.email}\n\n${data.message}`);
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
          className="w-full border-b border-[#E5E7EB] bg-transparent py-3 text-[#1A1A1A] placeholder:text-[#999] focus:border-[#1A1A1A] focus:outline-none"
        />
      </div>
      <div>
        <input
          type="email"
          name="email"
          placeholder="Email"
          required
          className="w-full border-b border-[#E5E7EB] bg-transparent py-3 text-[#1A1A1A] placeholder:text-[#999] focus:border-[#1A1A1A] focus:outline-none"
        />
      </div>
      <div>
        <textarea
          name="message"
          placeholder="Message"
          required
          rows={4}
          className="w-full resize-none border-b border-[#E5E7EB] bg-transparent py-3 text-[#1A1A1A] placeholder:text-[#999] focus:border-[#1A1A1A] focus:outline-none"
        />
      </div>

      <button
        type="submit"
        className="bg-[#1A1A1A] px-8 py-3 text-sm font-medium text-white transition-opacity hover:opacity-80"
      >
        Send Message
      </button>
    </form>
  );
}
