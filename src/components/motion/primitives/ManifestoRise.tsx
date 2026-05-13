import { motion } from "framer-motion";
import { createElement, useEffect, useState, type Ref } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useInViewport } from "../hooks/useInViewport";
import {
  useScrollProgress,
  type ScrollAdapter,
} from "../hooks/useScrollProgress";

// Reduced-motion'ı mount-time sync olarak yakala (Codex P2): hook'un
// SSR-safe pattern'i ilk render false dönüyor; scroll-progress dalında
// bu race ScrollTrigger.create + cleanup arasında pin spacer flicker
// yaratıyor. useState initializer client-side ilk render'da çalışır.
function getReducedSync(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
import { toFramerSeconds } from "../adapters/framer";
import { DURATION, EASE } from "../tokens";
import type { BaseReactProps } from "../types";

export interface ManifestoRiseProps extends BaseReactProps {
  lines: string[];
  staggerDelay?: number; // satırlar arası gecikme, ms
  as?: "h1" | "h2" | "h3" | "div";
  trigger?: "viewport-once" | "scroll-progress";
  sectionId?: string; // scroll-progress için target element id'si
  scrollAdapter?: ScrollAdapter | null; // GSAP-aware scroll provider (örn. Lenis)
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
  trigger = "viewport-once",
  sectionId,
  scrollAdapter = null,
  className,
  ariaLabel,
}: ManifestoRiseProps) {
  const reduced = useReducedMotion();
  // Mount-time sync detection (Codex P2): yalnızca ilk render'da kullanılır
  // (ScrollTrigger pin-spacer flicker'ı önleme). Mount sonrası useReducedMotion
  // canlı senkron olduğundan ona delege ederiz; aksi halde kullanıcı OS/browser
  // reduced-motion ayarını kapatınca da animation sonsuza kadar kilitli kalırdı
  // (Codex P3 follow-up).
  const [initialReducedSync] = useState<boolean>(getReducedSync);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const effectiveReduced = mounted ? reduced : initialReducedSync;
  const { ref, isInView } = useInViewport({ threshold: 0.3, once: true });

  // Phase 5 Task 5.3: scroll-progress variant.
  // Hooks rule: koşullu çağıramayız → useScrollProgress'i her zaman çağırıp
  // disabled flag ile gate'liyoruz. reduced-motion veya farklı trigger'da no-op.
  const isScrollMode = trigger === "scroll-progress";
  useScrollProgress({
    triggerSelector: sectionId ? `#${sectionId}` : "__manifesto-noop__",
    pinDistanceDesktop: "+=150%",
    pinDistanceMobile: "+=100%",
    disabled: !isScrollMode || effectiveReduced || !sectionId,
    adapter: scrollAdapter,
  });

  // Reduced-motion: framer-motion bypass, plain heading
  if (effectiveReduced) {
    return createElement(
      as,
      {
        className,
        ref: ref as Ref<HTMLElement>,
        "aria-label": ariaLabel,
      },
      lines.flatMap((line, i) => [
        <span key={i} style={{ display: "block" }}>
          {line}
        </span>,
        // Adjacent span'leri textContent'te ayırmak için literal newline.
        i < lines.length - 1 ? "\n" : null,
      ]),
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
    lines.flatMap((line, i) => [
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
      </motion.span>,
      i < lines.length - 1 ? "\n" : null,
    ]),
  );
}
