import { useEffect, useRef, type RefObject } from "react";

// gsap + ScrollTrigger statik import DEĞİL (Codex P3): statik olsaydı bu hook'u
// import eden HER modül (ör. viewport-only ManifestoRise adası) scroll-progress
// modunu hiç kullanmasa bile GSAP'ı bundle'lardı. Bunun yerine yalnızca
// adapter+element guard'ları geçince, effect içinde dinamik import ediyoruz;
// böylece GSAP kendi lazy chunk'ına düşer ve viewport-only build'lere sızmaz.
let scrollTriggerRegistered = false;

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
          `[useScrollProgress] Trigger element not found: ${opts.triggerSelector}`,
        );
      }
      return;
    }

    // GSAP + ScrollTrigger dinamik import — sadece bu koda ulaşıldığında (adapter
    // + element mevcut) yüklenir. Import async olduğu için setup'ı IIFE içinde
    // yapıyoruz; unmount import çözülmeden gelirse `cancelled` ile iptal ediyoruz.
    let cancelled = false;
    let cleanup: (() => void) | null = null;

    void (async () => {
      const gsapMod = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (cancelled) return;

      const gsap = gsapMod.default ?? (gsapMod as unknown as typeof gsapMod.default);
      if (!scrollTriggerRegistered) {
        gsap.registerPlugin(ScrollTrigger);
        scrollTriggerRegistered = true;
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

      cleanup = () => {
        st.kill(true); // pin spacer'ı da kaldır
        adapter.off("scroll", onAdapterScroll);
        mq.removeEventListener("change", onBreakpointChange);
      };

      // Setup tam biterken unmount olduysa hemen temizle (race guard).
      if (cancelled) {
        cleanup();
        cleanup = null;
      }
    })();

    return () => {
      cancelled = true;
      if (cleanup) {
        cleanup();
        cleanup = null;
      }
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
