import { describe, it, expect, beforeEach, afterEach, spyOn } from "bun:test";
import { renderHook } from "@testing-library/react";
import { useScrollProgress } from "../hooks/useScrollProgress";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// ScrollTrigger.create gerçek implementasyonu jsdom'da heavy işler yapıyor
// (DOM measurements, pin spacers). Test'lerimiz davranışsal kontratı doğrular,
// ScrollTrigger internals'ını mock'lar.
function stubScrollTrigger() {
  const killSpy = () => {};
  const fakeST = { kill: killSpy } as unknown as ScrollTrigger;
  return {
    create: spyOn(ScrollTrigger, "create").mockReturnValue(fakeST),
    update: spyOn(ScrollTrigger, "update").mockImplementation(() => {}),
    refresh: spyOn(ScrollTrigger, "refresh").mockImplementation(() => {}),
  };
}

describe("useScrollProgress", () => {
  let stubs: ReturnType<typeof stubScrollTrigger>;

  beforeEach(() => {
    stubs = stubScrollTrigger();
  });

  afterEach(() => {
    stubs.create.mockRestore();
    stubs.update.mockRestore();
    stubs.refresh.mockRestore();
    document.body.innerHTML = "";
  });

  it("returns ref with current=0 when no adapter is provided", () => {
    const { result } = renderHook(() =>
      useScrollProgress({
        triggerSelector: ".missing",
        pinDistanceDesktop: "+=150%",
        pinDistanceMobile: "+=100%",
      }),
    );
    expect(result.current.current).toBe(0);
    expect(stubs.create.mock.calls.length).toBe(0);
  });

  it("does not register listeners when disabled (adapter present but disabled=true)", () => {
    const fakeAdapter = { on: makeSpy(), off: makeSpy() };
    renderHook(() =>
      useScrollProgress({
        triggerSelector: ".missing",
        pinDistanceDesktop: "+=150%",
        pinDistanceMobile: "+=100%",
        disabled: true,
        adapter: fakeAdapter,
      }),
    );
    expect(fakeAdapter.on.callCount()).toBe(0);
    expect(stubs.create.mock.calls.length).toBe(0);
  });

  it("stays inert when triggerSelector element is missing in the DOM", () => {
    const fakeAdapter = { on: makeSpy(), off: makeSpy() };
    renderHook(() =>
      useScrollProgress({
        triggerSelector: ".does-not-exist",
        pinDistanceDesktop: "+=150%",
        pinDistanceMobile: "+=100%",
        adapter: fakeAdapter,
      }),
    );
    expect(fakeAdapter.on.callCount()).toBe(0);
    expect(stubs.create.mock.calls.length).toBe(0);
  });

  it("creates a ScrollTrigger and subscribes to adapter scroll events when wired", async () => {
    const target = document.createElement("div");
    target.className = "trigger-target";
    document.body.appendChild(target);

    const fakeAdapter = { on: makeSpy(), off: makeSpy() };
    renderHook(() =>
      useScrollProgress({
        triggerSelector: ".trigger-target",
        pinDistanceDesktop: "+=150%",
        pinDistanceMobile: "+=100%",
        adapter: fakeAdapter,
      }),
    );

    // GSAP artık dinamik import; setup async IIFE içinde. Import çözülene kadar bekle.
    await flushAsyncImport();

    expect(stubs.create.mock.calls.length).toBe(1);
    expect(fakeAdapter.on.callCount()).toBe(1);
    // ScrollTrigger.create config'i kontrolü: trigger element doğru mu?
    const config = stubs.create.mock.calls[0][0] as {
      trigger: Element;
      scrub: number;
      pin: boolean;
    };
    expect(config.trigger).toBe(target);
    expect(config.scrub).toBe(1);
    expect(config.pin).toBe(true);
  });

  it("cleans up ScrollTrigger and adapter subscription on unmount", async () => {
    const target = document.createElement("div");
    target.className = "cleanup-target";
    document.body.appendChild(target);

    const fakeAdapter = { on: makeSpy(), off: makeSpy() };
    const { unmount } = renderHook(() =>
      useScrollProgress({
        triggerSelector: ".cleanup-target",
        pinDistanceDesktop: "+=150%",
        pinDistanceMobile: "+=100%",
        adapter: fakeAdapter,
      }),
    );

    // Dinamik import çözülene kadar bekle → adapter.on çağrılsın, cleanup kurulsun.
    await flushAsyncImport();

    expect(fakeAdapter.on.callCount()).toBe(1);
    unmount();
    expect(fakeAdapter.off.callCount()).toBe(1);
  });
});

// Hook artık GSAP'ı effect içinde dinamik import ediyor (detached async IIFE).
// Modül I/O'su bir setTimeout(0) turundan uzun sürebildiği için önce aynı
// modülleri burada await'leyip cache'i ısıtıyoruz; ardından bir makro-task turu
// hook'un IIFE devamının create/subscribe'ı bitirmesine izin veriyor.
async function flushAsyncImport(): Promise<void> {
  await import("gsap");
  await import("gsap/ScrollTrigger");
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function makeSpy() {
  let calls = 0;
  const fn = (..._args: unknown[]) => {
    calls += 1;
  };
  fn.callCount = () => calls;
  return fn;
}
