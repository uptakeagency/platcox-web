import { motion } from "framer-motion";
import { createElement, type Ref } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useInViewport } from "../hooks/useInViewport";
import { toFramerSeconds } from "../adapters/framer";
import { DURATION, EASE } from "../tokens";
import type { BaseReactProps } from "../types";

export interface ManifestoRiseProps extends BaseReactProps {
  lines: string[];
  staggerDelay?: number; // satırlar arası gecikme, ms
  as?: "h1" | "h2" | "h3" | "div";
}

// Manifesto satırlarını sırayla yükselterek ortaya çıkarır.
// SSR-visible kontrat: initial="visible" → HTML'de end-state.
// useInViewport null-safe: callback gelene kadar visible kalır, "viewport içinde"
// veya "henüz bilinmiyor" durumunda kayıp yok. isInView===false ise hidden.
export default function ManifestoRise({
  lines,
  staggerDelay = 150,
  durationMs = DURATION.long,
  as = "h1",
  className,
  ariaLabel,
}: ManifestoRiseProps) {
  const reduced = useReducedMotion();
  const { ref, isInView } = useInViewport({ threshold: 0.3, once: true });

  // Reduced-motion: framer-motion bypass, plain heading
  if (reduced) {
    return createElement(
      as,
      {
        className,
        ref: ref as Ref<HTMLElement>,
        "aria-label": ariaLabel,
      },
      lines.map((line, i) => (
        <span key={i} style={{ display: "block" }}>
          {line}
        </span>
      )),
    );
  }

  const animateState = isInView === false ? "hidden" : "visible";

  return createElement(
    as,
    {
      className,
      ref: ref as Ref<HTMLElement>,
      "aria-label": ariaLabel,
    },
    lines.map((line, i) => (
      <motion.span
        key={i}
        style={{ display: "block" }}
        initial="visible"
        animate={animateState}
        variants={{
          hidden: { opacity: 0, y: 24 },
          visible: { opacity: 1, y: 0 },
        }}
        transition={{
          duration: toFramerSeconds(durationMs),
          delay: toFramerSeconds(staggerDelay * i),
          ease: EASE.monumental,
        }}
      >
        {line}
      </motion.span>
    )),
  );
}
