import Lenis from "lenis";

let instance: Lenis | null = null;
let rafId: number | null = null;

// Section pager aktifken (yalnız anasayfa/masaüstü) Lenis wheel'i YUTMAZ —
// pager tek sahip olur, Lenis sadece programatik scrollTo animasyonunu oynatır.
// Haber vb. sayfalarında pager kurulmaz → flag false → Lenis normal smooth wheel.
let pagerOwnsWheel = false;
export function setPagerOwnsWheel(v: boolean): void {
  pagerOwnsWheel = v;
}

/**
 * Returns the app-wide Lenis instance (lazy-initialized on first call).
 *
 * IMPORTANT — reduced-motion contract:
 * This function does NOT check `prefers-reduced-motion`. Callers who want to
 * respect that preference must guard their call site. See `useScrollProgress`
 * for the pattern: pass `disabled: true` when reduced-motion is active so the
 * hook never calls `getLenis`, and native scroll behavior is preserved.
 *
 * Calling getLenis() unconditionally takes over the page's scroll behavior
 * for all users, including those who have requested reduced motion.
 */
export function getLenis(): Lenis | null {
  if (typeof window === "undefined") return null;
  if (instance) return instance;

  instance = new Lenis({
    duration: 1.1,
    smoothWheel: true,
    syncTouch: true,
    touchMultiplier: 1.2,
    // Pager sahipse wheel'i Lenis'e verme (çifte-tüketimi keser) — Codex ccg.
    virtualScroll: ({ event }: { event: Event }) =>
      !(pagerOwnsWheel && event.type === "wheel"),
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
