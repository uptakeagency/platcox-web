import { toSmilDur } from "../adapters/smil";
import { DURATION, EASE } from "../tokens";

export type SketchShape = "circle" | "ring" | "arrow" | "custom";

export interface SketchStrokeProps {
  shape?: SketchShape;
  path?: string; // shape="custom" için zorunlu
  durationMs?: number;
  trigger?: "viewport-once";
  className?: string;
}

// Şekil-bazlı SMIL primitive. Tek path, stroke-dashoffset 1→0 ile çiziliyor.
// Tetikleyici sayfa-düzeyi observer (BaseLayout) tarafından beginElement() ile çağrılır.
const SHAPE_PATHS: Record<Exclude<SketchShape, "custom">, string> = {
  circle:
    "M 60 20 Q 35 30, 30 60 Q 35 90, 60 90 Q 85 90, 90 60 Q 85 30, 60 20 Z",
  ring: "M 60 20 A 30 30 0 1 0 60 90 A 30 30 0 1 0 60 20 Z",
  arrow: "M 10 50 L 90 50 L 75 35 M 90 50 L 75 65",
};

export default function SketchStroke({
  shape = "circle",
  path,
  durationMs = DURATION.long,
  trigger = "viewport-once",
  className = "",
}: SketchStrokeProps) {
  const dPath = shape === "custom" ? (path ?? "") : SHAPE_PATHS[shape];
  const keySplines = EASE.draw.join(" ");

  return (
    <svg
      viewBox="0 0 120 100"
      className={`sketch-stroke ${className}`.trim()}
      data-motion-trigger={trigger}
      data-motion-reduced-end-state
      role="presentation"
    >
      <path
        d={dPath}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        pathLength="1"
        strokeDasharray="1"
        strokeDashoffset="1"
        strokeLinecap="round"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="1"
          to="0"
          dur={toSmilDur(durationMs)}
          keySplines={keySplines}
          calcMode="spline"
          fill="freeze"
          begin="indefinite"
        />
      </path>
    </svg>
  );
}
