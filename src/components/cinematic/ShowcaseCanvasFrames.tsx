import FramePlayer from "./FramePlayer";
import ShowcaseFallback from "./ShowcaseFallback";
import { useReducedMotion } from "./useReducedMotion";
import { useScrollProgress } from "./useScrollProgress";

const MOBILE_QUERY = "(max-width: 767px)";
const FRAME_COUNT = 30;

function buildFrameUrls(): string[] {
  return Array.from({ length: FRAME_COUNT }, (_, i) => {
    const idx = String(i).padStart(3, "0");
    return `/images/cinematic/frames/frame-${idx}.webp`;
  });
}

const FRAMES = buildFrameUrls();

export default function ShowcaseCanvasFrames() {
  const reduced = useReducedMotion();

  const progressRef = useScrollProgress({
    triggerSelector: "#cinematic-showcase",
    pinDistanceDesktop: "+=150%",
    pinDistanceMobile: "+=100%",
    mobileQuery: MOBILE_QUERY,
    disabled: reduced,
  });

  if (reduced) return <ShowcaseFallback />;

  return (
    <div style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      <FramePlayer frames={FRAMES} progressRef={progressRef} />
    </div>
  );
}
