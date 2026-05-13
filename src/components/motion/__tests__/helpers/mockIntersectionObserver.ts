import { spyOn } from "bun:test";

export interface MockIO {
  trigger: (isIntersecting: boolean, target?: Element) => void;
  disconnect: ReturnType<typeof spyOn>;
  observe: ReturnType<typeof spyOn>;
  unobserve: ReturnType<typeof spyOn>;
}

export function mockIntersectionObserver(): MockIO {
  const callbacks: IntersectionObserverCallback[] = [];
  const observed = new Set<Element>();

  // Method'lar prototype'ta olmalı ki spyOn yakalasın; class field syntax instance'a koyar.
  const ObserverMock = class {
    root: Element | null = null;
    rootMargin = "";
    thresholds: number[] = [];
    constructor(cb: IntersectionObserverCallback) {
      callbacks.push(cb);
    }
    observe(el: Element) { observed.add(el); }
    unobserve(el: Element) { observed.delete(el); }
    disconnect() { observed.clear(); }
    takeRecords() { return []; }
  };

  // @ts-ignore - test-only global override
  globalThis.IntersectionObserver = ObserverMock as unknown as typeof IntersectionObserver;

  const trigger = (isIntersecting: boolean, target?: Element) => {
    const realTarget = target ?? Array.from(observed)[0];
    if (!realTarget) return;
    const entry = {
      isIntersecting,
      target: realTarget,
      time: Date.now(),
      boundingClientRect: realTarget.getBoundingClientRect(),
      intersectionRatio: isIntersecting ? 1 : 0,
      intersectionRect: realTarget.getBoundingClientRect(),
      rootBounds: null,
    } as unknown as IntersectionObserverEntry;
    callbacks.forEach((cb) => cb([entry], {} as IntersectionObserver));
  };

  return {
    trigger,
    disconnect: spyOn(ObserverMock.prototype, "disconnect"),
    observe: spyOn(ObserverMock.prototype, "observe"),
    unobserve: spyOn(ObserverMock.prototype, "unobserve"),
  };
}
