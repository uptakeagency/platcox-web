import { useRef } from "react";
import { motion } from "framer-motion";

interface Testimonial {
  company: string;
  quote: string;
}

const testimonials: Testimonial[] = [
  { company: "PARTNER", quote: "PlatcoX transformed our cross-border operations in ways we didn't think possible." },
  { company: "BRAND", quote: "From sourcing to delivery, the precision is unmatched." },
  { company: "RETAILER", quote: "They don't just consult — they build the infrastructure." },
  { company: "MANUFACTURER", quote: "Working with PlatcoX gave us access to markets we couldn't reach alone." },
  { company: "DISTRIBUTOR", quote: "The level of operational discipline is unlike anything we've experienced." },
];

export default function TestimonialsCarousel() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={containerRef}
      className="flex gap-4 overflow-x-auto pb-4 cursor-grab active:cursor-grabbing snap-x snap-mandatory scrollbar-hide"
      style={{ scrollbarWidth: "none" }}
    >
      {testimonials.map((t, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="min-w-[300px] max-w-[350px] shrink-0 snap-start bg-[#F5F5F5] p-8"
        >
          <p className="text-[11px] font-medium uppercase tracking-[2px] text-[#999]">{t.company}</p>
          <p className="mt-6 text-[#1A1A1A] leading-relaxed">"{t.quote}"</p>
        </motion.div>
      ))}
    </motion.div>
  );
}
