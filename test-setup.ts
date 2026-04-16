import { JSDOM } from "jsdom";
import { afterEach } from "bun:test";

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
  url: "http://localhost",
  pretendToBeVisual: true,
});

// Clear body between tests so duplicate-element queries don't bleed across tests
afterEach(() => {
  dom.window.document.body.innerHTML = "";
});

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  navigator: dom.window.navigator,
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
  ResizeObserver: class ResizeObserver {
    constructor(_cb: any) {}
    observe() {}
    unobserve() {}
    disconnect() {}
  },
});

// Default matchMedia stub so libraries that touch it at module-load time
// (e.g. GSAP ScrollTrigger via registerPlugin) don't crash under jsdom.
// Individual tests may override window.matchMedia.
(dom.window as any).matchMedia = (q: string) => ({
  matches: false,
  media: q,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
});
