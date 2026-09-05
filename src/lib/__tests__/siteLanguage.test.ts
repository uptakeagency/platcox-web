import { describe, it, expect } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const SRC = join(import.meta.dir, "..", "..");

// Site dili İngilizce. Kod yorumları Türkçe kalır (proje konvansiyonu) — bu yüzden
// yorum/style/script bloklarını eleyip geri kalan HER satırı denetliyoruz: "görünür
// metni çıkarmaya çalış" yerine "kod dışı hiçbir satırda Türkçe karakter kalmasın".
// Bu, {expr} ile karışık metin düğümlerini ve frontmatter veri dizilerini de kapsar.
const TR_CHARS = /[ğşıçöüĞŞİÇÖÜ]/;

// Posta adresi yerel kalır: kargo ve harita için doğrusu bu.
const ALLOWED = ["Kültür Mah", "Nisbetiye Cad", "Beşiktaş", "Türkiye"];

function stripNonVisible(src: string): string {
  return src
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/\s\/\/.*$/gm, ""); // satır sonu yorumu; https:// gibi URL'ler bozulmaz
}

function checkedLines(src: string): string[] {
  return stripNonVisible(src)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function offenders(lines: string[]): string[] {
  return lines.filter((line) => {
    let rest = line;
    for (const a of ALLOWED) rest = rest.replaceAll(a, "");
    return TR_CHARS.test(rest);
  });
}

function componentFiles(dir = join(SRC, "components")): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "__tests__") continue;
    if (e.isDirectory()) out.push(...componentFiles(join(dir, e.name)));
    else if (/\.(astro|tsx|ts)$/.test(e.name) && !e.name.includes(".test."))
      out.push(join(dir, e.name));
  }
  return out;
}

// Yayınlanan sayfalar. motion-playground dev-only bir primitive vitrini:
// sitemap'ten hariç, hiçbir yerden link verilmiyor — Türkçe kalması bilinçli.
const PAGE_EXCEPTIONS = ["motion-playground.astro"];

function pageFiles(dir = join(SRC, "pages")): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) out.push(...pageFiles(join(dir, e.name)));
    else if (e.name.endsWith(".astro") && !PAGE_EXCEPTIONS.includes(e.name))
      out.push(join(dir, e.name));
  }
  return out;
}

function layoutFiles(): string[] {
  const dir = join(SRC, "layouts");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".astro"))
    .map((f) => join(dir, f));
}

describe("site dili İngilizce", () => {
  it("bileşenlerde görünür Türkçe metin yok", () => {
    const bad: string[] = [];
    for (const file of componentFiles()) {
      const hits = offenders(checkedLines(readFileSync(file, "utf8")));
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

  it("yayınlanan sayfalarda görünür Türkçe metin yok", () => {
    const bad: string[] = [];
    for (const file of [...pageFiles(), ...layoutFiles()]) {
      const hits = offenders(checkedLines(readFileSync(file, "utf8")));
      if (hits.length) bad.push(`${file.split("/").pop()}: ${hits[0]}`);
    }
    expect(bad).toEqual([]);
  });

  // İçerik İngilizceye çevrildi; lang="tr" kalırsa ekran okuyucu İngilizce
  // başlıkları Türkçe telaffuz kurallarıyla okur.
  it("İngilizce içerik lang=\"tr\" ile işaretlenmiyor", () => {
    const bad: string[] = [];
    for (const file of [...componentFiles(), ...pageFiles(), ...layoutFiles()]) {
      if (/lang\s*=\s*["']tr["']/.test(readFileSync(file, "utf8")))
        bad.push(file.split("/").pop()!);
    }
    expect(bad).toEqual([]);
  });

  it("haber dosya adları (URL slug) latin harflerle", () => {
    const dir = join(SRC, "content", "news");
    const bad = readdirSync(dir).filter((f) => !/^[a-z0-9-]+\.md$/.test(f));
    expect(bad).toEqual([]);
  });
});
