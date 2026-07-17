import { motion, type Variant } from "framer-motion";
import { type ReactNode, type RefObject } from "react";
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

// Tek motion.div mimarisi (Codex P1 follow-up, Task 0.14):
// - SSR HTML'inde initial="visible" → end-state, opacity:1 (kontrat §5.2.2)
// - Hydration sonrası AYNI element; ref re-attach problemi yok, observer
//   detached node'a bağlı kalmaz.
// - isInView=null (observer henüz callback vermedi) iken "visible" tercih
//   edilir; ilk callback geldiğinde true/false ile transition tetiklenir.
// - reduced-motion → plain <div>, animation pipeline tamamen bypass.
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

  if (reduced) {
    return (
      <div ref={ref as RefObject<HTMLDivElement>} className={className}>
        {children}
      </div>
    );
  }

  const animateState = isInView === false ? "hidden" : "visible";

  return (
    <motion.div
      ref={ref as RefObject<HTMLDivElement>}
      initial="visible"
      animate={animateState}
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
