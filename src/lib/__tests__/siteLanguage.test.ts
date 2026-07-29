import { describe, it, expect } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const SRC = join(import.meta.dir, "..", "..");

// Site dili İngilizce. Kod yorumları Türkçe kalır (proje konvansiyonu) — bu yüzden
// tarama yorumları ve <style>/<script> bloklarını eler, yalnızca kullanıcıya görünen
// metni denetler.
const TR_CHARS = /[ğşıçöüĞŞİÇÖÜ]/;

// Posta adresi yerel kalır: kargo ve harita için doğrusu bu.
const ALLOWED = ["Kültür Mah", "Nisbetiye Cad", "Beşiktaş", "Türkiye"];

function stripNonVisible(src: string): string {
  return src
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

function visibleText(src: string): string[] {
  const body = stripNonVisible(src);
  const out: string[] = [];
  for (const m of body.matchAll(/>([^<>{}]+)</g)) out.push(m[1].trim());
  for (const m of body.matchAll(
    /(?:aria-label|alt|placeholder|title|label)\s*[:=]\s*["']([^"']+)["']/g,
  )) out.push(m[1]);
  return out.filter(Boolean);
}

function offenders(text: string[]): string[] {
  return text.filter(
    (t) => TR_CHARS.test(t) && !ALLOWED.some((a) => t.includes(a)),
  );
}

function componentFiles(): string[] {
  const dir = join(SRC, "components");
  return readdirSync(dir)
    .filter((f) => /\.(astro|tsx)$/.test(f))
    .map((f) => join(dir, f));
}

describe("site dili İngilizce", () => {
  it("bileşenlerde görünür Türkçe metin yok", () => {
    const bad: string[] = [];
    for (const file of componentFiles()) {
      const hits = offenders(visibleText(readFileSync(file, "utf8")));
      if (hits.length) bad.push(`${file.split("/").pop()}: ${hits[0]}`);
    }
    expect(bad).toEqual([]);
  });

  it("haber başlık ve özetleri İngilizce", () => {
    const dir = join(SRC, "content", "news");
    const bad: string[] = [];
    for (const f of readdirSync(dir).filter((f) => f.endsWith(".md"))) {
      const fm = readFileSync(join(dir, f), "utf8").split("---")[1] ?? "";
      for (const line of fm.split("\n")) {
        if (!/^(title|excerpt|category):/.test(line.trim())) continue;
        if (offenders([line]).length) bad.push(`${f}: ${line.trim()}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it("haber dosya adları (URL slug) latin harflerle", () => {
    const dir = join(SRC, "content", "news");
    const bad = readdirSync(dir).filter((f) => !/^[a-z0-9-]+\.md$/.test(f));
    expect(bad).toEqual([]);
  });
});
