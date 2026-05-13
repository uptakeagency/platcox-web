import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
  type RefObject,
} from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useInViewport } from "../hooks/useInViewport";
import { DURATION } from "../tokens";
import type { BaseReactProps, MotionRef } from "../types";

export interface TickCounterProps extends BaseReactProps {
  target: number;
  startValue?: number;
  format?: "number" | "currency" | "percent";
  currency?: string; // format="currency" iken zorunlu
  locale?: string;
  precision?: number; // fraction digits
  suffix?: string;
}

// Intl.NumberFormat ile formatlı sayıyı locale + format'a göre döndürür.
// format="currency" + currency yok → Intl throw etmesin diye decimal'a düşer
// (Codex P2 fix; warning dev'de tek seferlik).
let warnedNoCurrency = false;
function formatValue(
  v: number,
  format: "number" | "currency" | "percent",
  locale: string,
  currency: string | undefined,
  precision: number | undefined,
): string {
  let effectiveFormat = format;
  if (format === "currency" && !currency) {
    if (!warnedNoCurrency && typeof console !== "undefined") {
      // eslint-disable-next-line no-console
      console.warn(
        "TickCounter: format=\"currency\" verildi ama currency prop'u yok — decimal'a düşülüyor.",
      );
      warnedNoCurrency = true;
    }
    effectiveFormat = "number";
  }
  const fractionDigits = precision ?? 0;
  const opts: Intl.NumberFormatOptions = {
    style: effectiveFormat === "number" ? "decimal" : effectiveFormat,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  };
  if (effectiveFormat === "currency") opts.currency = currency;
  return new Intl.NumberFormat(locale, opts).format(v);
}

// TickCounter: target değerine kadar count-up animation.
// SSR'da final value basılır (kontrat); hydration sonrası viewport'a girince
// startValue'dan target'a animate eder (cubic ease-out). Reduced-motion'da
// final value sabit. forwardRef + MotionRef ile dışarıdan tetiklenebilir.
const TickCounter = forwardRef<
  Pick<MotionRef, "start" | "reset">,
  TickCounterProps
>(function TickCounter(
  {
    target,
    startValue = 0,
    format = "number",
    currency,
    locale = "en-US",
    precision,
    suffix = "",
    durationMs = DURATION.long,
    className,
    ariaLabel,
  },
  imperativeRef,
) {
  const reduced = useReducedMotion();
  const { ref: viewRef, isInView } = useInViewport({
    threshold: 0.5,
    once: false,
  });
  // SSR'da final value (kontrat); client mount sonrası animation başlasın.
  const [display, setDisplay] = useState<number>(target);
  const [hydrated, setHydrated] = useState(false);
  const rafIdRef = useRef<number | null>(null);
  const animateTokenRef = useRef(0);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Reduced-motion: animation iptal, final value'da sabit kal.
  useEffect(() => {
    if (!hydrated) return;
    if (reduced) {
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
      setDisplay(target);
    }
  }, [hydrated, reduced, target]);

  // Animation tetikleyici: viewport'a girince startValue → target arası interpolate.
  useEffect(() => {
    if (!hydrated) return;
    if (reduced) return;
    if (!isInView) return;

    // Token: cleanup sonrası eski animasyon callback'leri state'i kirletmesin.
    animateTokenRef.current += 1;
    const token = animateTokenRef.current;
    setDisplay(startValue);
    const start = performance.now();

    const animate = (now: number) => {
      if (token !== animateTokenRef.current) return;
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3); // cubic ease-out
      const value = startValue + (target - startValue) * eased;
      setDisplay(value);
      if (progress < 1) {
        rafIdRef.current = requestAnimationFrame(animate);
      } else {
        rafIdRef.current = null;
      }
    };
    rafIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [hydrated, isInView, reduced, target, startValue, durationMs]);

  useImperativeHandle(imperativeRef, () => ({
    start: () => {
      animateTokenRef.current += 1;
      setDisplay(startValue);
      // useEffect'in trigger edebilmesi için isInView'in zaten true olması gerek;
      // dışarıdan start çağrısı viewport-out durumunda etkisiz olur (intentional).
    },
    reset: () => {
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
      animateTokenRef.current += 1;
      setDisplay(startValue);
    },
  }));

  const formatted = formatValue(display, format, locale, currency, precision);

  return (
    <span
      ref={viewRef as RefObject<HTMLSpanElement>}
      className={className}
      style={{ fontVariantNumeric: "tabular-nums" }}
      aria-label={ariaLabel ?? formatted}
      aria-live="polite"
    >
      {formatted + suffix}
    </span>
  );
});

export default TickCounter;
