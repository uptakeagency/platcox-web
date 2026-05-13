import { motion } from "framer-motion";
import { type RefObject } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useInViewport } from "../hooks/useInViewport";
import { toFramerSeconds } from "../adapters/framer";
import { DURATION, EASE } from "../tokens";
import type { BaseReactProps } from "../types";

export interface DataScanRow {
  label: string;
  value: string;
}

export interface DataScanProps extends BaseReactProps {
  rows: DataScanRow[];
  mono?: boolean;
  staggerDelay?: number; // satırlar arası gecikme, ms
}

// Veri tablosu için "tarama" görseli: dt/dd satırları staggered fade-up +
// alt kenarda sürekli yatay scan-bar (CSS keyframe data-scan).
// SSR-visible kontrat: initial="visible" → HTML opacity:1.
// Reduced-motion: framer-motion bypass + scan-bar tamamen omit.
export default function DataScan({
  rows,
  mono = true,
  staggerDelay = 80,
  durationMs = DURATION.medium,
  className,
  ariaLabel,
}: DataScanProps) {
  const reduced = useReducedMotion();
  const { ref, isInView } = useInViewport({ threshold: 0.3, once: true });
  const fontFamily = mono ? "'JetBrains Mono', Courier, monospace" : "inherit";

  // Codex P2: scan-bar artık <dl> child'ı değil, sibling wrapper'da.
  // <dl> sadece dt/dd gruplarını içeriyor (HTML spec'i, a11y validator).
  const rootStyle = { fontFamily, position: "relative" as const };

  if (reduced) {
    return (
      <div
        ref={ref as RefObject<HTMLDivElement>}
        className={className}
        aria-label={ariaLabel}
        style={rootStyle}
      >
        <dl style={{ margin: 0 }}>
          {rows.map((row, i) => (
            <div
              key={i}
              style={{ display: "flex", justifyContent: "space-between" }}
            >
              <dt>{row.label}</dt>
              <dd style={{ fontWeight: 600, margin: 0 }}>{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    );
  }

  const animateState = isInView === false ? "hidden" : "visible";
  const variants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div
      ref={ref as RefObject<HTMLDivElement>}
      className={className}
      aria-label={ariaLabel}
      style={rootStyle}
    >
      <dl style={{ margin: 0 }}>
        {rows.map((row, i) => {
          const transition = {
            duration: toFramerSeconds(durationMs),
            delay: toFramerSeconds(staggerDelay * i),
            ease: EASE.scan,
          };
          return (
            <div
              key={i}
              style={{ display: "flex", justifyContent: "space-between" }}
            >
              <motion.dt
                initial="visible"
                animate={animateState}
                variants={variants}
                transition={transition}
              >
                {row.label}
              </motion.dt>
              <motion.dd
                initial="visible"
                animate={animateState}
                variants={variants}
                transition={transition}
                style={{ fontWeight: 600, margin: 0 }}
              >
                {row.value}
              </motion.dd>
            </div>
          );
        })}
      </dl>
      {/* Scan-bar artık dl dışında — semantik kontrat korunuyor (Codex P2). */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 1,
          overflow: "hidden",
          background: "transparent",
        }}
      >
        <div
          data-scan-bar
          style={{
            height: "100%",
            background:
              "linear-gradient(90deg, transparent, currentColor, transparent)",
            animation: "data-scan 2.4s linear infinite",
          }}
        />
      </div>
    </div>
  );
}
