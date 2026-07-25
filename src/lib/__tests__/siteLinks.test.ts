import { describe, it, expect } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { LINKEDIN_URL } from "../siteLinks";

const SRC_DIR = join(import.meta.dir, "..", "..");

// src altındaki tüm kaynak dosyaları (test dosyaları hariç) topla.
function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__") continue;
      out.push(...sourceFiles(full));
    } else if (/\.(astro|ts|tsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

describe("kurumsal LinkedIn bağlantısı", () => {
  it("şirket sayfasını gösterir", () => {
    expect(LINKEDIN_URL).toBe(
      "https://www.linkedin.com/company/platco-x-technology-and-trade-inc",
    );
  });

  it("hiçbir kaynak dosyada kişisel profil linki kalmadı", () => {
    const stragglers = sourceFiles(SRC_DIR)
      .filter((f) => readFileSync(f, "utf8").includes("linkedin.com/in/"))
      .map((f) => f.replace(SRC_DIR, "src"));
    expect(stragglers).toEqual([]);
  });
});
