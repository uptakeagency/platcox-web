import { motion, type Variant } from "framer-motion";
import { useEffect, useState, type ReactNode, type RefObject } from "react";
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

// SSR-visible kontrat (spec §5.2.2): SSR HTML her zaman end-state ile basılır
// (plain <div>, opacity:0 inline stili yok). Hydration sonrası motion.div'e
// geçilir; useInViewport observer'ı element viewport'a girdiğinde animation
// pipeline'ını tetikler.
//
// Codex P1 (Task 0.14 follow-up): Astro `client:visible` ile mount edilen
// componentler zaten viewport içindedir; `initialInView` mount-time check'i
// kaldırıldı çünkü her zaman true dönüyordu → motion.div'e hiç geçemiyorduk.
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

  useEffect(() => {
    setHydrated(true);
  }, []);

  // SSR + henüz hydrate olmamış + reduced-motion durumlarda
  // animation pipeline'ı bypass → plain div, end-state.
  if (!hydrated || reduced) {
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
