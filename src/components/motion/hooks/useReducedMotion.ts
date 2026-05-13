import { useEffect, useState } from "react";

// prefers-reduced-motion için React hook'u.
// SSR güvenli: ilk render her zaman `false` döner (server + client deterministik
// olarak aynı; React hydration mismatch warning tetiklenmez). Gerçek değer
// post-mount'ta useEffect içinde matchMedia üzerinden sync edilir.
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent | { matches: boolean }) =>
      setReduced(e.matches);
    mq.addEventListener("change", handler as (e: MediaQueryListEvent) => void);
    return () => mq.removeEventListener("change", handler as (e: MediaQueryListEvent) => void);
  }, []);

  return reduced;
}
