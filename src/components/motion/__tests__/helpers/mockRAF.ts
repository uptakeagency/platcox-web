// Deterministik requestAnimationFrame mock'u.
// Frame'leri manuel olarak step() ile ilerletir; her step ~16ms zaman atlatır.
export interface MockRAF {
  step: (frames?: number) => void;
  restore: () => void;
}

export function mockRAF(): MockRAF {
  let now = 0;
  const callbacks: Array<{ id: number; cb: FrameRequestCallback }> = [];
  let nextId = 1;

  const originalRaf = globalThis.requestAnimationFrame;
  const originalCancel = globalThis.cancelAnimationFrame;

  globalThis.requestAnimationFrame = (cb) => {
    const id = nextId++;
    callbacks.push({ id, cb });
    return id;
  };
  globalThis.cancelAnimationFrame = (id) => {
    const idx = callbacks.findIndex((c) => c.id === id);
    if (idx >= 0) callbacks.splice(idx, 1);
  };

  const step = (frames = 1) => {
    for (let i = 0; i < frames; i++) {
      now += 16;
      // Snapshot mevcut callback'leri; bunlar tetiklenirken yeni rAF push edebilir.
      const due = callbacks.splice(0);
      due.forEach(({ cb }) => cb(now));
    }
  };

  const restore = () => {
    globalThis.requestAnimationFrame = originalRaf;
    globalThis.cancelAnimationFrame = originalCancel;
  };

  return { step, restore };
}
