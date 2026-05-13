import { motion, type Variant } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { useReducedMotion } from "./hooks/useReducedMotion";
import { useInViewport } from "./hooks/useInViewport";
import { toFramerSeconds } from "./adapters/framer";

type AnimationType =
  | "fade-up"
  | "fade-in"
  | "slide-left"
  | "slide-right"
  | "scale-up"
  | "split-left"
  | "split-right";

interface Props {
  children: ReactNode;
  animation?: AnimationType;
  delay?: number;       // milliseconds
  durationMs?: number;  // milliseconds (eski API'da `duration` saniye idi)
  className?: string;
}

const variants: Record<AnimationType, { hidden: Variant; visible: Variant }> = {
  "fade-up":     { hidden: { opacity: 0, y: 40 },     visible: { opacity: 1, y: 0 } },
  "fade-in":     { hidden: { opacity: 0 },            visible: { opacity: 1 } },
  "slide-left":  { hidden: { opacity: 0, x: -60 },    visible: { opacity: 1, x: 0 } },
  "slide-right": { hidden: { opacity: 0, x: 60 },     visible: { opacity: 1, x: 0 } },
  "scale-up":    { hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } },
  "split-left":  { hidden: { opacity: 0, x: -80 },    visible: { opacity: 1, x: 0 } },
  "split-right": { hidden: { opacity: 0, x: 80 },     visible: { opacity: 1, x: 0 } },
};

// SSR-visible kontrat (spec §5.2.2): HTML her zaman end-state ile basılır.
// Animation yalnızca client-side hydrate sonrası, ilk viewport-girişinde
// tetiklenir; mount anında zaten ekranda olan içerik animate edilmez
// (sayfa açılışındaki sıçramayı önler).
export default function ScrollReveal({
  children,
  animation = "fade-up",
  delay = 0,
  durationMs = 600,
  className,
}: Props) {
  const v = variants[animation];
  const reduced = useReducedMotion();
  const { ref, isInView } = useInViewport({ threshold: 0.2, once: true });
  const [hydrated, setHydrated] = useState(false);
  const initialInView = useRef(false);

  useEffect(() => {
    setHydrated(true);
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      initialInView.current = rect.top < window.innerHeight && rect.bottom > 0;
    }
  }, [ref]);

  // SSR + henüz hydrate olmamış + reduced-motion + mount anında zaten görünür
  // durumlarda animation pipeline'ı bypass → plain div, end-state.
  if (!hydrated || reduced || initialInView.current) {
    return (
      <div ref={ref as RefObject<HTMLDivElement>} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref as RefObject<HTMLDivElement>}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: v.hidden,
        visible: {
          ...v.visible,
          transition: {
            duration: toFramerSeconds(durationMs),
            delay: toFramerSeconds(delay),
            ease: "easeOut",
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
