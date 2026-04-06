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
});
