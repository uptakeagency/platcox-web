import { motion } from "framer-motion";
import { type RefObject } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useInViewport } from "../hooks/useInViewport";
import { toFramerSeconds } from "../adapters/framer";
import { DURATION, EASE } from "../tokens";
import type { BaseReactProps } from "../types";

export interface NumberedRevealItem {
  num: string;
  title: string;
  description?: string;
}

export interface NumberedRevealProps extends BaseReactProps {
  items: NumberedRevealItem[];
  staggerDelay?: number; // items arası gecikme, ms
}

// Sıralı liste için numara + başlık staggered reveal.
// SSR-visible kontrat (§5.2.2): initial="visible" → HTML opacity:1.
// Observer ilk callback'i null'dan true/false'a geçince animate dinamik olur;
// `isInView === false` durumunda hidden'a girer, `true` ya da `null`'da visible.
// Reduced-motion: tüm framer-motion bypass → plain <ol>/<li> end-state'te.
export default function NumberedReveal({
  items,
  staggerDelay = 120,
  durationMs = DURATION.medium,
  className,
  ariaLabel,
}: NumberedRevealProps) {
  const reduced = useReducedMotion();
  const { ref, isInView } = useInViewport({ threshold: 0.2, once: true });

  if (reduced) {
    return (
      <ol
        ref={ref as RefObject<HTMLOListElement>}
        className={className}
        aria-label={ariaLabel}
      >
        {items.map((item, i) => (
          <li key={i} aria-label={`${item.num} ${item.title}`}>
            <span className="text-muted">{item.num}</span>
            <span>{item.title}</span>
            {item.description && <p>{item.description}</p>}
          </li>
        ))}
      </ol>
    );
  }

  const animateState = isInView === false ? "hidden" : "visible";

  return (
    <ol
      ref={ref as RefObject<HTMLOListElement>}
      className={className}
      aria-label={ariaLabel}
    >
      {items.map((item, i) => {
        const delay = staggerDelay * i;
        return (
          <motion.li
            key={i}
            initial="visible"
            animate={animateState}
            variants={{
              hidden: { opacity: 0, y: 16 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{
              duration: toFramerSeconds(durationMs),
              delay: toFramerSeconds(delay),
              ease: EASE.standard,
            }}
            aria-label={`${item.num} ${item.title}`}
          >
            <span className="text-muted">{item.num}</span>
            <span>{item.title}</span>
            {item.description && <p>{item.description}</p>}
          </motion.li>
        );
      })}
    </ol>
  );
}
