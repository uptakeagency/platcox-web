import { useEffect, useRef } from "react";
import FramePlayer from "./FramePlayer";
import ShowcaseFallback from "./ShowcaseFallback";
import { useReducedMotion } from "./useReducedMotion";
import { useScrollProgress } from "./useScrollProgress";

const MOBILE_QUERY = "(max-width: 767px)";
const FRAME_COUNT = 220;

function buildFrameUrls(): string[] {
  return Array.from({ length: FRAME_COUNT }, (_, i) => {
    const idx = String(i).padStart(3, "0");
    return `/images/cinematic/frames/frame-${idx}.webp`;
  });
}

const FRAMES = buildFrameUrls();

export default function ShowcaseCanvasFrames() {
  const reduced = useReducedMotion();
  const line1Ref = useRef<HTMLSpanElement>(null);
  const line2Ref = useRef<HTMLSpanElement>(null);
  const shadeRef = useRef<HTMLDivElement>(null);

  const progressRef = useScrollProgress({
    triggerSelector: "#cinematic-showcase",
    pinDistanceDesktop: "+=150%",
    pinDistanceMobile: "+=100%",
    mobileQuery: MOBILE_QUERY,
    disabled: reduced,
  });

  useEffect(() => {
    if (reduced) return;
    const line1 = line1Ref.current;
    const line2 = line2Ref.current;
    const shade = shadeRef.current;
    if (!line1 || !line2 || !shade) return;

    // "Where Global Trade" fades in at the start
    const L1_START = 0.02;
    const L1_END = 0.1;
    // "Gets Redefined" fades in gradually mid-to-late
    const L2_START = 0.5;
    const L2_END = 0.85;
    // Bottom white shade fades in with the end reveal
    const SHADE_START = 0.8;
    const SHADE_END = 0.95;

    const lerp = (p: number, a: number, b: number) =>
      Math.max(0, Math.min(1, (p - a) / (b - a)));

    let rafId: number;
    const update = () => {
      const p = progressRef.current ?? 0;
      const t1 = lerp(p, L1_START, L1_END);
      const t2 = lerp(p, L2_START, L2_END);
      const ts = lerp(p, SHADE_START, SHADE_END);
      line1.style.opacity = String(t1);
      line1.style.transform = `translateY(${(1 - t1) * 8}px)`;
      line2.style.opacity = String(t2);
      line2.style.transform = `translateY(${(1 - t2) * 8}px)`;
      shade.style.opacity = String(ts);
      rafId = requestAnimationFrame(update);
    };
    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, [reduced, progressRef]);

  if (reduced) return <ShowcaseFallback />;

  return (
    <>
      <div style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <FramePlayer frames={FRAMES} progressRef={progressRef} />
      </div>
      <div
        ref={shadeRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-1/2 bg-gradient-to-b from-transparent to-bg"
        style={{ opacity: 0 }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 flex -translate-y-1/2 justify-center px-6">
        <h2
          className="text-center text-5xl font-light leading-tight tracking-tight text-white md:text-7xl lg:text-[96px] lg:leading-[1.05] lg:tracking-[-2px]"
          style={{ textShadow: "0 2px 24px rgba(0,0,0,0.55)" }}
        >
          <span
            ref={line1Ref}
            className="block"
            style={{ opacity: 0, transform: "translateY(8px)" }}
          >
            Where Global Trade
          </span>
          <span
            ref={line2Ref}
            className="block"
            style={{ opacity: 0, transform: "translateY(8px)" }}
          >
            Gets Rede<span className="font-semibold">fined</span>
          </span>
        </h2>
      </div>
    </>
  );
}
