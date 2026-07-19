#!/usr/bin/env bun
/**
 * scripts/run-axe.ts
 *
 * Phase 7 Task 7.3 — production build a11y audit.
 *
 * Akış:
 *   1. `bun run build` ile production bundle üretilmiş olmalı (script bunu
 *      tetiklemez; CI pipeline'da build adımının ardından çalıştırın).
 *   2. `bunx astro preview` ile localhost:4321 server'ı arka planda başlatın.
 *   3. Bu script axe CLI'yi homepage üzerinde çalıştırır, JSON sonucu
 *      `/tmp/axe-motion.json`'a yazar; new violation varsa exit 1.
 *
 * CI'da `package.json`'a `"a11y": "astro preview & sleep 3 && bun run scripts/run-axe.ts; kill %1"`
 * benzeri bir composite script eklenebilir.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";

const TARGET = process.env.AXE_TARGET ?? "http://localhost:4321/";
const OUTPUT = process.env.AXE_OUTPUT ?? "/tmp/axe-motion.json";
const TAGS = process.env.AXE_TAGS ?? "wcag21aa";

// Bir önceki koşunun çıktısını sil: axe çöktüğünde (status!=0, dosya üretmeden)
// bayat OUTPUT'un başarısız denetimi maskeleyip false success üretmesini önler (Codex P1).
rmSync(OUTPUT, { force: true });

console.log(`[axe] Running against ${TARGET} (tags: ${TAGS})`);

const result = spawnSync(
  "bunx",
  [
    "--bun",
    "axe",
    TARGET,
    "--tags",
    TAGS,
    "--save",
    OUTPUT,
    "--exit",
  ],
  { stdio: "inherit" },
);

if (result.status !== 0 && !existsSync(OUTPUT)) {
  console.error(`[axe] Hatayla çıktı (status=${result.status}); output dosyası da yok.`);
  process.exit(result.status ?? 1);
}

// Sonuçları parse et — exit code zaten axe tarafında set'lenmiş olabilir,
// biz yine de violation sayısını ekrana basıp net bir özet sunalım.
let violations = 0;
let passes = 0;
try {
  const raw = readFileSync(OUTPUT, "utf-8");
  const parsed = JSON.parse(raw) as
    | { violations: unknown[]; passes: unknown[] }
    | Array<{ violations: unknown[]; passes: unknown[] }>;
  const reports = Array.isArray(parsed) ? parsed : [parsed];
  for (const r of reports) {
    violations += r.violations?.length ?? 0;
    passes += r.passes?.length ?? 0;
  }
} catch (err) {
  // Rapor okunamıyor/parse edilemiyorsa audit KENDİ çıktısını doğrulayamamış
  // demektir — bunu "temiz" (violations=0) sayıp 0 ile çıkmak sessiz geçiş
  // olur. Okunamayan raporu hard failure olarak işle (Codex P1).
  console.error(`[axe] Rapor parse edilemedi (${OUTPUT}): ${err}`);
  console.error("[axe] Audit kendi çıktısını okuyamadı — başarı raporlanmıyor.");
  process.exit(1);
}

console.log(`[axe] Pass: ${passes}, Violation: ${violations}`);

if (violations > 0) {
  console.error(`[axe] ${violations} yeni a11y violation bulundu. Çıktıyı incele: ${OUTPUT}`);
  process.exit(1);
}
console.log("[axe] Temiz. WCAG 2.1 AA bayrakları altında violation yok.");
