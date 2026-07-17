// Tüm süreler milisaniye. Adapter'lar engine-specific formata çevirir (spec §6.1).
export const DURATION = {
  micro:     150,
  short:     300,
  medium:    600,
  long:     1200,
  cinematic: 2400,
} as const;

export const EASE = {
  standard:   [0.32, 0.72, 0, 1],
  monumental: [0.25, 0.46, 0.45, 0.94],
  responsive: [0.34, 1.56, 0.64, 1],
  draw:       [0.65, 0, 0.35, 1],
  scan:       [0.4, 0, 0.6, 1],
} as const;

export const SCROLL_STAGES = {
  manifestoRise: {
    enter: [0, 0.2],
    hold:  [0.2, 0.7],
    exit:  [0.7, 1],
  },
} as const;

// 1ms — etkin olarak anlık ama pipeline-safe (Framer'ın 0-ms layout-skip bug'ından kaçınır).
export const REDUCED_MOTION_DURATION_MS = 1;
