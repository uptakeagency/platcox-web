import { Component, Suspense, useState, useEffect, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import DisintegrateMesh from "./DisintegrateMesh";
import ShowcaseFallback from "./ShowcaseFallback";
import { useReducedMotion } from "./useReducedMotion";
import { useScrollProgress } from "./useScrollProgress";

const IMAGE_A = "/images/cinematic/cinematic-a.webp";
const IMAGE_B = "/images/cinematic/cinematic-b.webp";
const NOISE   = "/images/cinematic/noise.webp";

class WebGLBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { errored: boolean }> {
  state = { errored: false };
  static getDerivedStateFromError() { return { errored: true }; }
  componentDidCatch(err: Error) { console.warn("[ShowcaseCanvas] WebGL error:", err.message); }
  render() { return this.state.errored ? this.props.fallback : this.props.children; }
}

export default function ShowcaseCanvas() {
  const reduced = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const progressRef = useScrollProgress({
    triggerSelector: "#cinematic-showcase",
    pinDistanceDesktop: "+=150%",
    pinDistanceMobile: "+=100%",
  });

  if (reduced) return <ShowcaseFallback />;

  return (
    <WebGLBoundary fallback={<ShowcaseFallback />}>
      <Canvas
        dpr={isMobile ? 1.5 : 2}
        camera={{ position: [0, 0, 10], fov: 42 }}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <DisintegrateMesh
            progressRef={progressRef}
            imageA={IMAGE_A}
            imageB={IMAGE_B}
            noise={NOISE}
            segments={isMobile ? 32 : 64}
          />
        </Suspense>
      </Canvas>
    </WebGLBoundary>
  );
}
