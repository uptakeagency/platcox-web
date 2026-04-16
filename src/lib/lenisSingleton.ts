import Lenis from "lenis";

let instance: Lenis | null = null;
let rafId: number | null = null;

export function getLenis(): Lenis | null {
  if (typeof window === "undefined") return null;
  if (instance) return instance;

  instance = new Lenis({
    duration: 1.1,
    smoothWheel: true,
    syncTouch: true,
    touchMultiplier: 1.2,
  });

  const loop = (time: number) => {
    instance?.raf(time);
    rafId = requestAnimationFrame(loop);
  };
  rafId = requestAnimationFrame(loop);

  return instance;
}

export function destroyLenis(): void {
  if (rafId !== null) cancelAnimationFrame(rafId);
  instance?.destroy();
  instance = null;
  rafId = null;
}
