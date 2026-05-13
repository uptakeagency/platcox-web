import { useEffect, useRef, type RefObject } from "react";

// Phase 0'da inert tutulan scroll progress hook'u.
// Gerçek GSAP+Lenis bağlantısı Phase 5'te (Task 5.2) eklendiğinde
// adapter parametresi üzerinden enjekte edilecek.
export interface ScrollAdapter {
  on: (event: "scroll", cb: () => void) => void;
  off: (event: "scroll", cb: () => void) => void;
}

export interface UseScrollProgressOptions {
  triggerSelector: string;
  pinDistanceDesktop: string;
  pinDistanceMobile: string;
  mobileQuery?: string;
  disabled?: boolean;
  adapter?: ScrollAdapter | null;
}

export function useScrollProgress(
  opts: UseScrollProgressOptions,
): RefObject<number> {
  const progress = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (opts.disabled) return;
    if (!opts.adapter) return;

    const adapter = opts.adapter;
    // Phase 5'te GSAP ScrollTrigger ile gerçek değerle dolacak;
    // şimdilik no-op handler kaydı tutuyoruz ki teardown sözleşmesi yerinde olsun.
    const onScroll = () => {
      // Phase 5: progress.current = computed value
    };
    adapter.on("scroll", onScroll);
    return () => {
      adapter.off("scroll", onScroll);
    };
  }, [opts.triggerSelector, opts.disabled, opts.adapter]);

  return progress;
}
