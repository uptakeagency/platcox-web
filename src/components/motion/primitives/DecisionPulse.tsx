import { motion } from "framer-motion";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  type ReactNode,
  type Ref,
} from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useInViewport } from "../hooks/useInViewport";
import type { BaseReactProps, MotionRef } from "../types";

export interface DecisionPulseProps extends BaseReactProps {
  title: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  pulse?: boolean;
  onActivate?: () => void;
}

// Karar destek anı için tekil pulse + scale-emphasis primitive.
// Container interaktif ise motion.button, değilse motion.div.
// Pulse ring CSS keyframe (global.css: pulse-ring) ile sürekli atar;
// prefers-reduced-motion @media içinde animation-play-state:paused.
const DecisionPulse = forwardRef<
  Pick<MotionRef, "start">,
  DecisionPulseProps
>(function DecisionPulse(
  {
    title,
    value,
    trend = "neutral",
    pulse = true,
    onActivate,
    className,
    ariaLabel,
  },
  imperativeRef,
) {
  const reduced = useReducedMotion();
  const { ref: viewRef, isInView } = useInViewport({ threshold: 0.5 });
  const [emphasize, setEmphasize] = useState(false);

  const triggerEmphasis = () => {
    setEmphasize(true);
    setTimeout(() => setEmphasize(false), 600);
  };

  // value/trend değişiminde scale-emphasis tetikle (mount dahil — ilk paint
  // dikkat çekici olsun). Reduced-motion'da scale animasyon görsel olarak
  // bypass edilir, yine de state tutulur (test/imperative API tutarlılığı için).
  useEffect(() => {
    triggerEmphasis();
  }, [value, trend]);

  useImperativeHandle(imperativeRef, () => ({ start: triggerEmphasis }));

  const isInteractive = typeof onActivate === "function";
  const trendColor =
    trend === "up"
      ? "var(--color-accent, #22C55E)"
      : trend === "down"
        ? "#EF4444"
        : "#1A1A1A";

  const animateProps = {
    animate: emphasize && !reduced ? { scale: [1, 1.03, 1] } : { scale: 1 },
    transition: { duration: 0.3, ease: "easeOut" as const },
  };

  const inner: ReactNode = (
    <>
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {pulse && isInView !== false && (
          <span
            data-pulse-ring
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: trendColor,
              // pulse-ring keyframe currentColor kullanıyor: halo'nun
              // trend rengiyle eşleşmesi için color'ı dot'la birlikte set ediyoruz.
              color: trendColor,
              animation: "pulse-ring 1.8s ease-out infinite",
            }}
          />
        )}
        <span>{title}</span>
      </span>
      <span style={{ color: trendColor, fontWeight: 600 }}>{value}</span>
    </>
  );

  const baseStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };

  if (isInteractive) {
    return (
      <motion.button
        ref={viewRef as Ref<HTMLButtonElement>}
        className={className}
        onClick={onActivate}
        type="button"
        aria-label={ariaLabel ?? `${title}: ${value}`}
        style={baseStyle}
        {...animateProps}
      >
        {inner}
      </motion.button>
    );
  }

  return (
    <motion.div
      ref={viewRef as Ref<HTMLDivElement>}
      className={className}
      aria-label={ariaLabel ?? `${title}: ${value}`}
      style={baseStyle}
      {...animateProps}
    >
      {inner}
    </motion.div>
  );
});

export default DecisionPulse;
