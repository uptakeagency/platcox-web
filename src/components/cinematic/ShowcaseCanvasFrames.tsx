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
  const manifestoRef = useRef<HTMLDivElement>(null);

  const progressRef = useScrollProgress({
    triggerSelector: "#cinematic-showcase",
    pinDistanceDesktop: "+=150%",
    pinDistanceMobile: "+=100%",
    mobileQuery: MOBILE_QUERY,
    disabled: reduced,
  });

  useEffect(() => {
    if (reduced) return;
    const el = manifestoRef.current;
    if (!el) return;

    let rafId: number;
    const update = () => {
      const p = progressRef.current ?? 0;
      const visible = p > 0.85;
      el.style.opacity = visible ? "1" : "0";
      el.style.transform = `translateY(${visible ? 0 : 8}px)`;
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
        ref={manifestoRef}
        className="pointer-events-none absolute inset-x-0 bottom-[12%] z-10 flex justify-center px-6 transition-[opacity,transform] duration-700"
        style={{ opacity: 0, transform: "translateY(8px)" }}
      >
        <p className="text-center text-4xl font-light leading-tight tracking-tight text-foreground md:text-6xl lg:text-7xl">
          Global trade, <span className="font-semibold">redefined.</span>
        </p>
      </div>
    </>
  );
}
