import { motion } from "framer-motion";
import {
  createElement,
  useEffect,
  useRef,
  useState,
  type Ref,
} from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useInViewport } from "../hooks/useInViewport";
import {
  useScrollProgress,
  type ScrollAdapter,
} from "../hooks/useScrollProgress";
import { toFramerSeconds } from "../adapters/framer";
import { DURATION, EASE, SCROLL_STAGES } from "../tokens";
import type { BaseReactProps } from "../types";

// Reduced-motion'ı mount-time sync olarak yakala (Codex P2): hook'un
// SSR-safe pattern'i ilk render false dönüyor; scroll-progress dalında
// bu race ScrollTrigger.create + cleanup arasında pin spacer flicker
// yaratıyor. useState initializer client-side ilk render'da çalışır.
function getReducedSync(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

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
  const [initialReducedSync] = useState<boolean>(getReducedSync);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const effectiveReduced = mounted ? reduced : initialReducedSync;
  const { ref, isInView } = useInViewport({ threshold: 0.3, once: true });

  const isScrollMode = trigger === "scroll-progress";

  // Phase 5 Task 5.3: scroll-progress variant.
  // Eğer caller scrollAdapter pass etmediyse Lenis singleton'ı lazy import
  // ederek kendimiz çözeriz — Hero gibi entegrasyon noktaları için.
  const [resolvedAdapter, setResolvedAdapter] = useState<ScrollAdapter | null>(
    scrollAdapter,
  );
  useEffect(() => {
    if (!isScrollMode || scrollAdapter || effectiveReduced) return;
    let cancelled = false;
    import("../../../lib/lenisSingleton").then(({ getLenis }) => {
      if (cancelled) return;
      const lenis = getLenis();
      if (lenis) setResolvedAdapter(lenis as unknown as ScrollAdapter);
    });
    return () => {
      cancelled = true;
    };
  }, [isScrollMode, scrollAdapter, effectiveReduced]);

  const progress = useScrollProgress({
    triggerSelector: sectionId ? `#${sectionId}` : "__manifesto-noop__",
    pinDistanceDesktop: "+=150%",
    pinDistanceMobile: "+=100%",
    disabled: !isScrollMode || effectiveReduced || !sectionId,
    adapter: resolvedAdapter,
  });

  // Scroll-tied rAF loop: her line için SCROLL_STAGES.manifestoRise.enter
  // dilimine bölünmüş progress'i hesapla → ease-out cubic → opacity + Y.
  const lineRefs = useRef<Array<HTMLSpanElement | null>>([]);
  useEffect(() => {
    if (!isScrollMode || effectiveReduced || !sectionId) return;
    let raf = 0;
    const enterStart = SCROLL_STAGES.manifestoRise.enter[0];
    const enterEnd = SCROLL_STAGES.manifestoRise.enter[1];
    const total = lines.length;
    const tick = () => {
      const p = progress.current;
      for (let i = 0; i < total; i++) {
        const el = lineRefs.current[i];
        if (!el) continue;
        // Her line, enter dilimi içinde ardışık bir slot kaplar.
        const sliceSpan = (enterEnd - enterStart) / total;
        const lineStart = enterStart + i * sliceSpan;
        const lineEnd = lineStart + sliceSpan;
        const local = (p - lineStart) / (lineEnd - lineStart);
        const clamped = local <= 0 ? 0 : local >= 1 ? 1 : local;
        const eased = 1 - Math.pow(1 - clamped, 3);
        el.style.opacity = String(eased);
        el.style.transform = `translateY(${(1 - eased) * 80}px)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      // Cleanup'ta line'ları end-state'te bırak (SSR-visible kontrat).
      lineRefs.current.forEach((el) => {
        if (!el) return;
        el.style.opacity = "1";
        el.style.transform = "";
      });
    };
  }, [isScrollMode, effectiveReduced, sectionId, lines.length, progress]);

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
        i < lines.length - 1 ? "\n" : null,
      ]),
    );
  }

  // Scroll-tied: plain span + rAF DOM mutation (framer-motion bypass).
  // SSR'da end-state (opacity:1) basıyoruz — kontrat §5.2.2; hydration
  // sonrası rAF ilk frame'de progress'e göre opacity/transform uygular.
  if (isScrollMode && sectionId) {
    return createElement(
      as,
      {
        className,
        ref: ref as Ref<HTMLElement>,
        "aria-label": ariaLabel,
      },
      lines.flatMap((line, i) => [
        <span
          key={i}
          ref={(el) => {
            lineRefs.current[i] = el;
          }}
          style={{
            display: "block",
            willChange: "opacity, transform",
          }}
        >
          {line}
        </span>,
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
          hidden: { opacity: 0, y: 80 },
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
