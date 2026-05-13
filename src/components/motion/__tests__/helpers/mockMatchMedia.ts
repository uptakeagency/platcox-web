// Test helper: window.matchMedia'yı override eder.
// Belirli bir query için matches değerini sabitler; diğer query'lerde false döner.
export function mockMatchMedia(query: string, matches: boolean): void {
  (window as unknown as { matchMedia: (q: string) => MediaQueryList }).matchMedia = (
    q: string,
  ) =>
    ({
      matches: q === query ? matches : false,
      media: q,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}
