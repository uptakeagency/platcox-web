import { useEffect, useRef, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Lenis veya GSAP-uyumlu başka bir scroll provider için minimal arayüz.
// Hook bu adapter üzerinden subscribe eder; concrete Lenis sınıfı app-shell
// tarafından enjekte edilir (spec §10.1).
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

// useScrollProgress: GSAP ScrollTrigger + injected scroll adapter (Lenis).
// adapter verilmezse veya disabled=true ise no-op kalır (Phase 0 inert kontratı).
// Adapter sağlandığında: triggerSelector elementini pin'ler, scroll progress'i
// progress.current ref'inde (0..1) tutar; bileşenler ref'i rAF içinde okur.
export function useScrollProgress(
  opts: UseScrollProgressOptions,
): RefObject<number> {
  const progress = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (opts.disabled) return;
    if (!opts.adapter) return;

    const adapter = opts.adapter;
    const el = document.querySelector(opts.triggerSelector);
    if (!el) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn(
          `[useScrollProgress] Trigger element bulunamadı: ${opts.triggerSelector}`,
        );
      }
      return;
    }

    const mq = window.matchMedia(opts.mobileQuery ?? "(max-width: 767px)");

    const onAdapterScroll = () => ScrollTrigger.update();
    adapter.on("scroll", onAdapterScroll);

    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: () =>
        mq.matches ? opts.pinDistanceMobile : opts.pinDistanceDesktop,
      pin: true,
      scrub: 1,
      onUpdate: (self) => {
        progress.current = self.progress;
      },
    });

    const onBreakpointChange = () => ScrollTrigger.refresh();
    mq.addEventListener("change", onBreakpointChange);

    return () => {
      st.kill(true); // pin spacer'ı da kaldır
      adapter.off("scroll", onAdapterScroll);
      mq.removeEventListener("change", onBreakpointChange);
    };
  }, [
    opts.triggerSelector,
    opts.pinDistanceDesktop,
    opts.pinDistanceMobile,
    opts.mobileQuery,
    opts.disabled,
    opts.adapter,
  ]);

  return progress;
}
