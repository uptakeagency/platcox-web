// Tüm motion primitive'lerinin paylaştığı baz prop'lar.
export interface BaseMotionProps {
  durationMs?: number;
  ariaLabel?: string;
}

export interface BaseAstroProps extends BaseMotionProps {
  class?: string;
}

export interface BaseReactProps extends BaseMotionProps {
  className?: string;
}

// Tetikleyici discriminated union — her primitive bunu accept eder.
export type Trigger =
  | { kind: "viewport-once" }
  | { kind: "viewport-repeat" }
  | { kind: "scroll-progress"; sectionId: string }
  | { kind: "hover" }
  | { kind: "always" }
  | { kind: "manual"; id: string };

// Yan veri taşımayan trigger'lar için kısayol.
export type TriggerShorthand =
  | "viewport-once"
  | "viewport-repeat"
  | "hover"
  | "always";

// Imperative kontrol arayüzü (forwardRef ile expose edilir).
export interface MotionRef {
  start: () => void;
  reset: () => void;
  play?: () => void;
  pause?: () => void;
}
