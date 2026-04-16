#!/usr/bin/env bun
/**
 * Generate cinematic hero images via Gemini Nano Banana Pro.
 *
 * Usage: GEMINI_API_KEY=... bun scripts/generate-cinematic-images.ts
 *
 * Writes PNG files to /tmp then converts them to WebP into public/images/cinematic/.
 * Keeps the original PNGs in /tmp for debugging; they are not committed.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const MODEL = "gemini-3-pro-image-preview";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("Missing GEMINI_API_KEY in environment.");
  process.exit(1);
}

interface Target {
  name: string;
  prompt: string;
}

const TARGETS: Target[] = [
  {
    name: "cinematic-a",
    prompt:
      "Cinematic wide-angle photograph of a congested international shipping port at dusk. " +
      "Dense stacks of rusted shipping containers in amber, burgundy, teal, and charcoal, " +
      "towering chaotic bureaucracy — loose paper documents swirling mid-air caught in wind, " +
      "tangled cranes and cables overhead, dense low-lying fog hugging the ground, " +
      "sodium-vapor streetlights casting orange highlights on wet asphalt, " +
      "silhouetted dockworkers in the middle distance giving scale, " +
      "dramatic long shadows, moody atmospheric color grading, " +
      "analog 35mm film grain, slight anamorphic lens distortion at the edges, " +
      "2.39:1 cinematic aspect ratio, shot on Arri Alexa with Panavision lenses, " +
      "deep navy sky, rich chiaroscuro, no text, no logos, no watermarks.",
  },
  {
    name: "cinematic-b",
    prompt:
      "Cinematic wide-angle abstract visualization of a next-generation global supply chain " +
      "as an organized, luminous digital network. Glowing data nodes connected by " +
      "soft cyan and white light beams forming clean geometric lattices, translucent " +
      "glass-like modular architectural planes floating at varied depths, subtle " +
      "volumetric light, gentle particle accents drifting upward, minimal composition " +
      "with generous negative space, optimistic calm atmosphere, crisp edges, " +
      "holographic UI panels in the midground showing abstract data flows, " +
      "deep soft gradient background from pale cyan to soft white, " +
      "faint hints of distant connected continents as a dotted mesh, " +
      "photorealistic rendering quality with a minimalist futurist aesthetic, " +
      "studio lighting from above-left, shallow depth of field, " +
      "2.39:1 cinematic aspect ratio, no text, no logos, no watermarks.",
  },
];

async function generateOne(target: Target): Promise<string> {
  console.log(`\n→ ${target.name}`);

  const body = {
    contents: [{ parts: [{ text: target.prompt }] }],
    generationConfig: {
      responseModalities: ["IMAGE"],
    },
  };

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "x-goog-api-key": API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini API ${res.status}: ${text}`);
  }

  const json = (await res.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }>;
      };
    }>;
  };

  const part = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!part?.inlineData?.data) {
    throw new Error(`No image in response: ${JSON.stringify(json).slice(0, 400)}`);
  }

  const mime = part.inlineData.mimeType ?? "image/png";
  const ext = mime === "image/jpeg" ? "jpg" : "png";
  const pngPath = `/tmp/${target.name}.${ext}`;
  writeFileSync(pngPath, Buffer.from(part.inlineData.data, "base64"));

  const bytes = readFileSync(pngPath).byteLength;
  console.log(`  • raw ${ext}: ${pngPath} (${(bytes / 1024).toFixed(1)} KB)`);

  return pngPath;
}

async function convertToWebp(src: string, dst: string): Promise<void> {
  // Resize to 2048×1152 and encode webp at quality 82
  const proc = Bun.spawn(
    [
      "cwebp",
      "-q", "82",
      "-resize", "2048", "1152",
      "-mt",
      src,
      "-o", dst,
      "-quiet",
    ],
    { stdout: "pipe", stderr: "pipe" },
  );
  const code = await proc.exited;
  if (code !== 0) {
    const err = await new Response(proc.stderr).text();
    throw new Error(`cwebp failed (${code}): ${err}`);
  }
  const bytes = readFileSync(dst).byteLength;
  console.log(`  • webp: ${dst} (${(bytes / 1024).toFixed(1)} KB)`);
}

async function main() {
  const outDir = join(process.cwd(), "public", "images", "cinematic");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  for (const t of TARGETS) {
    const pngPath = await generateOne(t);
    const webpPath = join(outDir, `${t.name}.webp`);
    await convertToWebp(pngPath, webpPath);
  }

  console.log("\n✓ Done. WebP files written to public/images/cinematic/");
}

main().catch((e) => {
  console.error("\n✗ Error:", e.message);
  process.exit(1);
});
