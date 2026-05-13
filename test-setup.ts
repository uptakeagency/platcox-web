import { JSDOM } from "jsdom";
import { afterEach } from "bun:test";

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
  url: "http://localhost",
  pretendToBeVisual: true,
});

// Default matchMedia stub'unu test'ler arasında izole etmek için.
const defaultMatchMedia = (q: string) => ({
  matches: false,
  media: q,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
});

// Clear body between tests so duplicate-element queries don't bleed across tests.
// Ayrıca matchMedia'yı default stub'a geri al — `delete window.matchMedia`
// yapan test'ler sonraki dosyalara state sızdırmasın (Codex Task 0.12 P3).
afterEach(() => {
  dom.window.document.body.innerHTML = "";
  (dom.window as any).matchMedia = defaultMatchMedia;
});

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  navigator: dom.window.navigator,
  // lenis'in `instanceof Window` kontrolü için global Window constructor.
  Window: dom.window.Window,
  HTMLElement: dom.window.HTMLElement,
  HTMLDivElement: dom.window.HTMLDivElement,
  Element: dom.window.Element,
  Node: dom.window.Node,
  Text: dom.window.Text,
  DocumentFragment: dom.window.DocumentFragment,
  MutationObserver: dom.window.MutationObserver,
  SVGElement: dom.window.SVGElement,
  getComputedStyle: dom.window.getComputedStyle,
  requestAnimationFrame: dom.window.requestAnimationFrame,
  cancelAnimationFrame: dom.window.cancelAnimationFrame,
  IntersectionObserver: class IntersectionObserver {
    constructor(_cb: any, _opts?: any) {}
    observe() {}
    unobserve() {}
    disconnect() {}
  },
  // lenis Dimensions sınıfı autoResize true iken ResizeObserver çağırır.
  ResizeObserver: class ResizeObserver {
    constructor(_cb: any) {}
    observe() {}
    unobserve() {}
    disconnect() {}
  },
});

// Phase 5'te eklenecek GSAP ScrollTrigger gibi modül yüklemesinde
// matchMedia'ya dokunan kütüphaneler için default stub. Her test
// gerektiğinde window.matchMedia'yı override edebilir; afterEach
// içinde default'a geri alınır.
(dom.window as any).matchMedia = defaultMatchMedia;
