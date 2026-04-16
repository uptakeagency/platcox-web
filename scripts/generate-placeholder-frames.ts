#!/usr/bin/env bun
/**
 * Generate 30 placeholder gradient frames for the cinematic frame-sequence PoC.
 *
 * Each frame interpolates from dark (#1a3a5c) to light (#d0e8f5).
 * Outputs 960x540 WebP files at quality 60 into public/images/cinematic/frames/.
 *
 * Usage: bun scripts/generate-placeholder-frames.ts
 */

import { writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const FRAME_COUNT = 30;
const WIDTH = 960;
const HEIGHT = 540;
const QUALITY = 60;

// Color endpoints
const START = { r: 26, g: 58, b: 92 }; // #1a3a5c
const END = { r: 208, g: 232, b: 245 }; // #d0e8f5

const outDir = join(process.cwd(), "public", "images", "cinematic", "frames");
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

async function generateFrame(index: number): Promise<void> {
  const t = index / (FRAME_COUNT - 1);

  const r = lerp(START.r, END.r, t);
  const g = lerp(START.g, END.g, t);
  const b = lerp(START.b, END.b, t);

  // Build PPM (P6 binary format)
  const header = `P6\n${WIDTH} ${HEIGHT}\n255\n`;
  const headerBytes = Buffer.from(header, "ascii");
  const pixelCount = WIDTH * HEIGHT;
  const pixelData = Buffer.alloc(pixelCount * 3);

  for (let i = 0; i < pixelCount; i++) {
    pixelData[i * 3] = r;
    pixelData[i * 3 + 1] = g;
    pixelData[i * 3 + 2] = b;
  }

  const ppm = Buffer.concat([headerBytes, pixelData]);
  const ppmPath = `/tmp/frame-${String(index).padStart(3, "0")}.ppm`;
  writeFileSync(ppmPath, ppm);

  // Convert to WebP
  const webpName = `frame-${String(index).padStart(3, "0")}.webp`;
  const webpPath = join(outDir, webpName);

  const proc = Bun.spawn(
    ["cwebp", "-q", String(QUALITY), "-mt", ppmPath, "-o", webpPath, "-quiet"],
    { stdout: "pipe", stderr: "pipe" },
  );
  const code = await proc.exited;
  if (code !== 0) {
    const err = await new Response(proc.stderr).text();
    throw new Error(`cwebp failed for frame ${index} (exit ${code}): ${err}`);
  }

  const bytes = readFileSync(webpPath).byteLength;
  console.log(
    `  frame-${String(index).padStart(3, "0")}.webp  ` +
      `rgb(${r},${g},${b})  ${(bytes / 1024).toFixed(1)} KB`,
  );
}

async function main() {
  console.log(`Generating ${FRAME_COUNT} placeholder frames (${WIDTH}x${HEIGHT})...\n`);

  for (let i = 0; i < FRAME_COUNT; i++) {
    await generateFrame(i);
  }

  console.log(`\nDone. ${FRAME_COUNT} WebP files in ${outDir}`);
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
