import { useEffect, useRef, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getLenis } from "../../lib/lenisSingleton";

gsap.registerPlugin(ScrollTrigger);

export interface UseScrollProgressOptions {
  triggerSelector: string;
  pinDistanceDesktop: string; // e.g. "+=150%"
  pinDistanceMobile: string;  // e.g. "+=100%"
  mobileQuery?: string;       // default: "(max-width: 767px)"
  disabled?: boolean;         // when true, no ScrollTrigger is created (e.g. reduced-motion)
}

export function useScrollProgress(opts: UseScrollProgressOptions): RefObject<number> {
  const progress = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (opts.disabled) return;

    const el = document.querySelector(opts.triggerSelector);
    if (!el) {
      console.warn(`[useScrollProgress] Trigger element not found: ${opts.triggerSelector}`);
      return;
    }

    const mq = window.matchMedia(opts.mobileQuery ?? "(max-width: 767px)");

    const lenis = getLenis();
    const onLenisScroll = () => ScrollTrigger.update();
    lenis?.on("scroll", onLenisScroll);

    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: () => (mq.matches ? opts.pinDistanceMobile : opts.pinDistanceDesktop),
      pin: true,
      scrub: 1,
      onUpdate: (self) => {
        progress.current = self.progress;
      },
    });

    const onBreakpointChange = () => ScrollTrigger.refresh();
    mq.addEventListener("change", onBreakpointChange);

    return () => {
      st.kill(true); // true = also remove pin spacer
      lenis?.off("scroll", onLenisScroll);
      mq.removeEventListener("change", onBreakpointChange);
    };
  }, [opts.triggerSelector, opts.pinDistanceDesktop, opts.pinDistanceMobile, opts.mobileQuery, opts.disabled]);

  return progress;
}
