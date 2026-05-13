import { useEffect, useRef, useState } from "react";

interface Options {
  threshold?: number;
  rootMargin?: string;
  root?: Element | null;
  once?: boolean;
}

interface PoolKey {
  threshold: number;
  rootMargin: string;
  root: Element | null;
}

interface PooledObserver {
  observer: IntersectionObserver;
  refCount: number;
  callbacks: Map<Element, (isIntersecting: boolean) => void>;
}

// Aynı (threshold, rootMargin, root) anahtarına sahip tüm hook'lar tek bir IO paylaşır.
const pools = new Map<string, PooledObserver>();

// Test-only: pool state'ini sıfırla (modül-level singleton, test izolasyonu için).
export function __resetPoolsForTesting() {
  for (const pool of pools.values()) pool.observer.disconnect();
  pools.clear();
}

const keyFor = (k: PoolKey) =>
  `${k.threshold}|${k.rootMargin}|${k.root ? "custom" : "window"}`;

function getPool(k: PoolKey): PooledObserver {
  const id = keyFor(k);
  let pool = pools.get(id);
  if (pool) return pool;
  const callbacks = new Map<Element, (isIntersecting: boolean) => void>();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const cb = callbacks.get(e.target);
        if (cb) cb(e.isIntersecting);
      }
    },
    { threshold: k.threshold, rootMargin: k.rootMargin, root: k.root ?? undefined }
  );
  pool = { observer, refCount: 0, callbacks };
  pools.set(id, pool);
  return pool;
}

function releasePool(k: PoolKey) {
  const id = keyFor(k);
  const pool = pools.get(id);
  if (!pool) return;
  pool.refCount -= 1;
  if (pool.refCount <= 0) {
    pool.observer.disconnect();
    pools.delete(id);
  }
}

export function useInViewport(opts: Options = {}) {
  const { threshold = 0.2, rootMargin = "0px", root = null, once = false } = opts;
  const ref = useRef<HTMLElement | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = ref.current;
    if (!el) return;

    const key: PoolKey = { threshold, rootMargin, root };
    const pool = getPool(key);
    pool.refCount += 1;
    pool.callbacks.set(el, (intersecting) => {
      setIsInView(intersecting);
      if (intersecting && once) {
        pool.observer.unobserve(el);
        pool.callbacks.delete(el);
      }
    });
    pool.observer.observe(el);

    return () => {
      pool.observer.unobserve(el);
      pool.callbacks.delete(el);
      releasePool(key);
    };
  }, [threshold, rootMargin, root, once]);

  return { ref, isInView };
}
