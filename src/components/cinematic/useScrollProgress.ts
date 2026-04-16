import { useEffect, useRef, type MutableRefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getLenis } from "../../lib/lenisSingleton";

gsap.registerPlugin(ScrollTrigger);

export interface UseScrollProgressOptions {
  triggerSelector: string;
  pinDistanceDesktop: string; // e.g. "+=150%"
  pinDistanceMobile: string;  // e.g. "+=100%"
  mobileQuery?: string;       // default: "(max-width: 767px)"
}

export function useScrollProgress(opts: UseScrollProgressOptions): MutableRefObject<number> {
  const progress = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = document.querySelector(opts.triggerSelector);
    if (!el) return;

    const mq = window.matchMedia(opts.mobileQuery ?? "(max-width: 767px)");
    const end = mq.matches ? opts.pinDistanceMobile : opts.pinDistanceDesktop;

    const lenis = getLenis();
    const onLenisScroll = () => ScrollTrigger.update();
    lenis?.on("scroll", onLenisScroll);

    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end,
      pin: true,
      scrub: 1,
      onUpdate: (self) => {
        progress.current = self.progress;
      },
    });

    return () => {
      st.kill();
      lenis?.off("scroll", onLenisScroll);
    };
  }, [opts.triggerSelector, opts.pinDistanceDesktop, opts.pinDistanceMobile, opts.mobileQuery]);

  return progress;
}
