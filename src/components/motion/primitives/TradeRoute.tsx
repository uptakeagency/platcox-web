import { toSmilDur } from "../adapters/smil";
import { DURATION, EASE } from "../tokens";

interface Endpoint {
  x: number;
  y: number;
  label?: string;
}

export interface TradeRouteProps {
  from: Endpoint;
  to: Endpoint;
  curve?: number;
  durationMs?: number;
  trigger?: "viewport-once" | "viewport-repeat" | "manual";
  id?: string;
  ariaLabel?: string;
  className?: string;
}

// TradeRoute: iki konum arasındaki ticaret rotasını çizen SMIL primitive.
// Sayfa-düzeyi observer (BaseLayout.astro) bu SVG'yi viewport'a girince
// veya manual trigger geldiğinde beginElement() ile başlatır.
export default function TradeRoute({
  from,
  to,
  curve = 0.4,
  durationMs = DURATION.long,
  trigger = "viewport-once",
  id,
  ariaLabel,
  className = "",
}: TradeRouteProps) {
  const cx = (from.x + to.x) / 2;
  const cy = Math.min(from.y, to.y) - Math.abs(to.x - from.x) * curve;

  const role = ariaLabel ? "img" : "presentation";
  const motionId = trigger === "manual" ? id : undefined;
  const keySplines = EASE.draw.join(" ");

  return (
    <svg
      viewBox="0 0 200 100"
      overflow="visible"
      className={`trade-route ${className}`.trim()}
      data-motion-trigger={trigger}
      data-motion-id={motionId}
      data-motion-reduced-end-state
      role={role}
      aria-label={ariaLabel}
    >
      <path
        d={`M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        pathLength="1"
        strokeDasharray="1"
        strokeDashoffset="1"
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
      <circle cx={from.x} cy={from.y} r="3" fill="currentColor" />
      <circle cx={to.x} cy={to.y} r="3" fill="var(--color-accent, #22C55E)" />
      {from.label && (
        <title>
          {from.label} → {to.label ?? "destination"}
        </title>
      )}
    </svg>
  );
}
