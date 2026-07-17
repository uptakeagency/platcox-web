# Platcox Minimal "Business Card" Homepage — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mevcut 12 bölümlük siteyi, tek misyon cümlesi + tıklanır haber şeridi taşıyan tek ekranlık minimal kartvizit anasayfasıyla değiştirmek.

**Architecture:** `origin/main`'den yeni `feat/minimal-homepage` branch'i (arşiv-önce, hiçbir şey kaybolmaz). Yeni `BusinessCardLayout.astro` (sıfır-runtime JS) + yeniden yazılan `index.astro`. Haber şeridi build-time `getCollection('news')` + CSS marquee (JS yok); başlıklar minimal makale sayfalarına gider. Ticker veri mantığı (sıralama + sayı-guard) saf TS modülünde TDD ile.

**Tech Stack:** Astro 6.1.3, @astrojs/sitemap, @fontsource/inter (self-host), bun test + test-setup.ts, plain scoped CSS (Tailwind utility'lerine bağlı değil).

**Design source:** `~/Projects/platcox-web/docs/superpowers/specs/2026-07-15-platcox-minimal-homepage-design.md`

## Design'dan / mockup'tan ayrılan görünür noktalar (kullanıcı onaylı)

1. **Şerit launch'ta SABİT, animasyonsuz.** Mockup'ta 2 başlık animasyonlu akıyordu; guard kuralı (<4 başlık → animasyon yok, çünkü geniş ekranda "H1◦H2◦H1◦H2" bozuk durur) gereği launch'ta 2 başlıkla şerit sabit. Animasyon **4+ başlıkta** otomatik açılır. *(Gemini review bulgusu, spec §4.1'de onaylandı.)*
2. **Mobilde marquee yok** — statik/kaydırılır (mobilde hover-durdurma yok + kaza dokunuşu). *(spec §4.1)*
3. 12 bölüm + motion library rafa (arşivde korunur); tek anlamlı motion kalıntısı = misyon cümlesinin açılış rise'ı (CSS-only). *(spec §3)*

## Global Constraints

- **Branch:** tüm iş `feat/minimal-homepage` üzerinde, `origin/main`'den. Motion branch (`feat/motion-library`) + PR #2 DOKUNULMAZ.
- **Sıfır runtime uygulama-JS:** `dist/index.html` içinde `astro-island`, app modül script, Lenis, GSAP, Framer, video referansı OLMAYACAK. Şerit + rise CSS-only; guard'lar build-time frontmatter koşulu.
- **Site URL:** `https://www.platcox.com` (absolute canonical/OG).
- **İletişim e-postası:** `info@platcox.com` (mailto + JSON-LD).
- **Renk:** aksan yeşil `#22C55E`, metin `#111`, zemin `#FFFFFF`. **Font:** Inter (300/500/600), self-host.
- **Test komutu:** `bun test <dosya>`. **Tip:** `bun run type-check` (= `astro check && tsc --noEmit`). **Build:** `bun run build`.
- **a11y:** şerit WCAG 2.2.2 → hover + `:focus-within` durdurur, `prefers-reduced-motion`'da sabit (ilk başlık tam), mobilde animasyonsuz, focus ring `outline:2px solid #22C55E; offset 4px`.

---

### Task 1: Arşiv + branch güvenliği (hiçbir şey kaybolmaz)

**Files:**
- Create (git): tag `archive/motion-homepage-2026-07-16`, branch `archive/untracked-design-assets-2026-07-16`, branch `feat/minimal-homepage`
- Create (worktree): `../platcox-web-minimal`
- Copy: spec + bu plan → yeni branch

**Interfaces:**
- Produces: `../platcox-web-minimal` worktree'si `feat/minimal-homepage` üzerinde, `origin/main`'den; içinde `docs/superpowers/specs/2026-07-15-...md` + `docs/superpowers/plans/2026-07-16-...md` commit'li. Sonraki tüm task'ler BU worktree'de çalışır.

- [ ] **Step 1: Doğrula — motion tip ve main senkron, temiz**

Run:
```bash
cd ~/Projects/platcox-web
git fetch origin
git rev-parse d41e579 origin/feat/motion-library   # ikisi de aynı SHA olmalı
```
Expected: iki satır da `d41e579...` ile başlar.

- [ ] **Step 2: Motion tip'i arşiv tag'iyle dondur + push**

Run:
```bash
git tag -a archive/motion-homepage-2026-07-16 d41e579 \
  -m "Archive 12-section homepage + motion library before minimal homepage"
git push origin refs/tags/archive/motion-homepage-2026-07-16
```
Expected: `* [new tag] archive/motion-homepage-2026-07-16 -> archive/motion-homepage-2026-07-16`

- [ ] **Step 3: Untracked varlıkları (poster + 2 redesign doc) ayrı arşiv branch'ine koru**

Untracked dosyalar tag'e girmez (tag yalnız tracked içeriği korur). Ayrı worktree + explicit `git add` (asla `git add .`):
```bash
git worktree add ../platcox-web-archive -b archive/untracked-design-assets-2026-07-16 d41e579
cp src/pages/poster.astro ../platcox-web-archive/src/pages/poster.astro
cp docs/superpowers/plans/2026-04-05-platcox-web-redesign.md ../platcox-web-archive/docs/superpowers/plans/
cp docs/superpowers/specs/2026-04-05-platcox-web-redesign-design.md ../platcox-web-archive/docs/superpowers/specs/
git -C ../platcox-web-archive add -- \
  src/pages/poster.astro \
  docs/superpowers/plans/2026-04-05-platcox-web-redesign.md \
  docs/superpowers/specs/2026-04-05-platcox-web-redesign-design.md
git -C ../platcox-web-archive commit -m "archive: preserve poster + 2026-04-05 redesign design docs"
git -C ../platcox-web-archive push -u origin archive/untracked-design-assets-2026-07-16
git worktree remove ../platcox-web-archive
```
Expected: push başarılı; `worktree remove` sessiz döner.

- [ ] **Step 4: Minimal branch worktree'sini main'den aç**

```bash
git worktree add ../platcox-web-minimal -b feat/minimal-homepage origin/main
```
Expected: `Preparing worktree (new branch 'feat/minimal-homepage')` + `HEAD is now at <main-sha>`.

- [ ] **Step 5: Spec + plan'ı yeni branch'e taşı ve commit'le**

```bash
mkdir -p ../platcox-web-minimal/docs/superpowers/specs ../platcox-web-minimal/docs/superpowers/plans
cp docs/superpowers/specs/2026-07-15-platcox-minimal-homepage-design.md ../platcox-web-minimal/docs/superpowers/specs/
cp docs/superpowers/plans/2026-07-16-platcox-minimal-homepage.md ../platcox-web-minimal/docs/superpowers/plans/
git -C ../platcox-web-minimal add docs/superpowers/
git -C ../platcox-web-minimal commit -m "docs: minimal homepage design spec + implementation plan"
```
Expected: 2 dosya commit'lenir. **Bundan sonraki tüm komutlar `cd ../platcox-web-minimal` içinde koşar.**

---

### Task 2: Ticker veri modülü (TDD — saf TS)

**Files:**
- Create: `src/lib/ticker.ts`
- Test: `src/lib/ticker.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface NewsEntryLike { id: string; data: { title: string; date: Date } }
  export interface TickerItem { title: string; href: string }
  export interface TickerModel { items: TickerItem[]; animate: boolean }
  export function buildTicker(entries: NewsEntryLike[]): TickerModel
  ```
  `items` tarihe göre yeniden-eskiye sıralı; `href = /news/<id>`; `animate = items.length >= 4`.

- [ ] **Step 1: Failing test yaz**

`src/lib/ticker.test.ts`:
```ts
import { test, expect } from "bun:test";
import { buildTicker } from "./ticker";

const mk = (id: string, y: number, title: string) => ({ id, data: { title, date: new Date(y, 0, 1) } });

test("tarihe göre yeniden-eskiye sıralar", () => {
  const { items } = buildTicker([mk("a", 2024, "Eski"), mk("b", 2026, "Yeni"), mk("c", 2025, "Orta")]);
  expect(items.map((i) => i.title)).toEqual(["Yeni", "Orta", "Eski"]);
});

test("href /news/<id> üretir", () => {
  const { items } = buildTicker([mk("ai-ticaret", 2025, "T")]);
  expect(items[0].href).toBe("/news/ai-ticaret");
});

test("4'ten az başlıkta animate=false", () => {
  expect(buildTicker([mk("a", 2025, "1"), mk("b", 2025, "2"), mk("c", 2025, "3")]).animate).toBe(false);
});

test("4+ başlıkta animate=true", () => {
  const e = [1, 2, 3, 4].map((n) => mk("id" + n, 2025, "" + n));
  expect(buildTicker(e).animate).toBe(true);
});

test("boş girişte items=[] ve animate=false", () => {
  expect(buildTicker([])).toEqual({ items: [], animate: false });
});
```

- [ ] **Step 2: Testin FAIL ettiğini gör**

Run: `cd ../platcox-web-minimal && bun test src/lib/ticker.test.ts`
Expected: FAIL — `Cannot find module "./ticker"`.

- [ ] **Step 3: Minimal implementasyon**

`src/lib/ticker.ts`:
```ts
export interface NewsEntryLike { id: string; data: { title: string; date: Date } }
export interface TickerItem { title: string; href: string }
export interface TickerModel { items: TickerItem[]; animate: boolean }

// Haberleri yeniden-eskiye sırala, ticker item'larına çevir, sayı-guard'ı hesapla.
export function buildTicker(entries: NewsEntryLike[]): TickerModel {
  const items = [...entries]
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
    .map((e) => ({ title: e.data.title, href: `/news/${e.id}` }));
  return { items, animate: items.length >= 4 };
}
```

- [ ] **Step 4: Testin PASS ettiğini gör**

Run: `bun test src/lib/ticker.test.ts`
Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ticker.ts src/lib/ticker.test.ts
git commit -m "feat(ticker): news ticker veri modülü — sıralama + sayı-guard (TDD)"
```

---

### Task 3: Inter self-host + minimal `BusinessCardLayout.astro`

**Files:**
- Modify: `package.json` (add `@fontsource/inter`)
- Create: `src/layouts/BusinessCardLayout.astro`
- Create: `src/styles/card-reset.css`

**Interfaces:**
- Produces: `BusinessCardLayout` — `Props { title?: string; description?: string; ogImage?: string }`. `<head>` içinde SEO meta + Organization/WebSite JSON-LD (email `info@platcox.com`, logo ≥112×112), Inter 300/500/600 import, `card-reset.css`. `global.css`/BaseLayout KULLANMAZ. Slot: sayfa gövdesi.

- [ ] **Step 1: Inter'i self-host olarak ekle**

Run:
```bash
cd ../platcox-web-minimal
bun add @fontsource/inter@^5
```
Expected: `@fontsource/inter` dependencies'e eklenir.

- [ ] **Step 2: Minimal reset yaz**

`src/styles/card-reset.css`:
```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { -webkit-text-size-adjust: 100%; }
body {
  font-family: "Inter", system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  color: #111;
  background: #fff;
}
a { color: inherit; }
img { max-width: 100%; display: block; }
```

- [ ] **Step 3: Layout'u yaz**

`src/layouts/BusinessCardLayout.astro`:
```astro
---
import "@fontsource/inter/300.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "../styles/card-reset.css";

interface Props { title?: string; description?: string; ogImage?: string }
const {
  title = "PlatcoX — Organize global trade",
  description = "Organize global trade and make products accessible anywhere in the world. Get in touch: info@platcox.com",
  ogImage = "/og-default.png",
} = Astro.props;

const canonical = new URL(Astro.url.pathname, Astro.site);
const ogImageURL = new URL(ogImage, Astro.site);

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.platcox.com/#organization",
      name: "PlatcoX",
      url: "https://www.platcox.com",
      logo: { "@type": "ImageObject", url: "https://www.platcox.com/logo-512.png", width: 512, height: 512 },
      email: "info@platcox.com",
    },
    { "@type": "WebSite", "@id": "https://www.platcox.com/#website", url: "https://www.platcox.com", name: "PlatcoX" },
  ],
};
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical.href} />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="PlatcoX" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonical.href} />
    <meta property="og:image" content={ogImageURL.href} />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={ogImageURL.href} />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <script type="application/ld+json" set:html={JSON.stringify(jsonLd)} />
  </head>
  <body>
    <slot />
  </body>
</html>
```

- [ ] **Step 4: Tip kontrolü geçer**

Run: `bun run type-check`
Expected: 0 error. (Astro `Astro.site` tanımlı — config'de `site` var.)

- [ ] **Step 5: Commit**

```bash
git add package.json bun.lock src/layouts/BusinessCardLayout.astro src/styles/card-reset.css
git commit -m "feat(layout): minimal BusinessCardLayout — self-host Inter, SEO head, JSON-LD (info@ + 512 logo)"
```

---

### Task 4: `index.astro` — V3 kartvizit (wordmark + misyon + mailto + rise)

**Files:**
- Overwrite: `src/pages/index.astro`

**Interfaces:**
- Consumes: `BusinessCardLayout` (Task 3), news ticker (Task 5 — bu task'te henüz yok; şerit Task 5'te eklenir). Bu task yalnız merkez içeriği kurar.
- Produces: `/` — tek `<h1>` = misyon, wordmark, `mailto:info@platcox.com`, açılış rise (CSS). Hiç `client:*` yok.

- [ ] **Step 1: Sayfayı yaz (mevcut main index'ini TAMAMEN değiştir)**

`src/pages/index.astro`:
```astro
---
import BusinessCardLayout from "../layouts/BusinessCardLayout.astro";
---
<BusinessCardLayout>
  <main class="card">
    <div class="center">
      <div class="mark rise d1">platco<span class="x">x</span></div>
      <h1 class="mission rise d2">
        Organize global trade and make products accessible anywhere in the world<span class="dot">.</span>
      </h1>
      <a class="cta rise d3" href="mailto:info@platcox.com">info@platcox.com</a>
    </div>
  </main>

  <style>
    .card {
      min-height: 100vh;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      text-align: center;
      padding: clamp(28px, 5vw, 72px) clamp(28px, 5vw, 72px) 90px;
    }
    .center { display: flex; flex-direction: column; align-items: center; gap: clamp(30px, 5vh, 56px); max-width: 900px; }
    .mark { font-weight: 600; letter-spacing: -0.02em; font-size: clamp(22px, 2.4vw, 30px); }
    .mark .x { color: #22C55E; }
    .mission { font-weight: 300; letter-spacing: -0.025em; line-height: 1.1; font-size: clamp(28px, 4.4vw, 60px); max-width: 20ch; }
    .mission .dot { color: #22C55E; }
    .cta {
      text-decoration: none; font-weight: 500; font-size: clamp(15px, 1.5vw, 19px);
      border-bottom: 1px solid rgba(0,0,0,.25); padding-bottom: 2px;
    }
    .cta:focus-visible { outline: 2px solid #22C55E; outline-offset: 4px; }

    @keyframes rise { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: none; } }
    .rise { animation: rise 1s cubic-bezier(.2,.7,.2,1) both; }
    .rise.d1 { animation-delay: .15s; } .rise.d2 { animation-delay: .5s; } .rise.d3 { animation-delay: .85s; }
    @media (prefers-reduced-motion: reduce) { .rise { animation: none; } }
  </style>
</BusinessCardLayout>
```

- [ ] **Step 2: Build + sıfır-JS doğrula**

Run:
```bash
bun run build
grep -c "astro-island" dist/index.html || echo "0 island (beklenen)"
grep -Eic "hero-bg|gsap|lenis|\.mp4" dist/index.html || echo "0 motion/video ref (beklenen)"
```
Expected: `astro-island` = 0 (grep exit 1 → "0 island"), motion/video ref = 0.

- [ ] **Step 3: Görsel doğrula (opsiyonel ama önerilir)**

Run: `bun run preview` (arka planda değil — kısa), tarayıcıda `/` aç, kapat. **Not:** dev server bırakma; preview'ı gör ve durdur. *(Executor bu adımı screenshot ile de yapabilir.)*

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat(home): V3 minimal kartvizit — misyon + mailto + açılış rise, sıfır-JS"
```

---

### Task 5: Haber şeridi (ticker) — CSS marquee, a11y, guard, tıklanır

**Files:**
- Create: `src/components/NewsTicker.astro`
- Modify: `src/pages/index.astro` (şeridi ekle)

**Interfaces:**
- Consumes: `buildTicker` (Task 2), `getCollection('news')`.
- Produces: `<NewsTicker />` — alt kenarda şerit; 0 başlıkta hiç render etmez; `animate=false`'da sabit; masaüstünde hover/focus-within durur; mobilde animasyonsuz.

- [ ] **Step 1: Bileşeni yaz**

`src/components/NewsTicker.astro`:
```astro
---
import { getCollection } from "astro:content";
import { buildTicker } from "../lib/ticker";

const news = await getCollection("news");
const { items, animate } = buildTicker(news);
---
{items.length > 0 && (
  <div class="ticker" aria-label="Latest news">
    <div class="ticker__label"><span class="livedot" aria-hidden="true"></span><span>İSTANBUL</span></div>
    <div class="ticker__track" data-animate={animate ? "true" : "false"}>
      <div class="marquee">
        {items.map((i) => <a class="item" href={i.href}>{i.title}</a>)}
        {animate && items.map((i) => <a class="item" href={i.href} aria-hidden="true" tabindex="-1">{i.title}</a>)}
      </div>
    </div>
  </div>
)}

<style>
  .ticker {
    position: absolute; left: 0; right: 0; bottom: 0; height: 46px;
    display: flex; align-items: stretch; background: #fff;
    border-top: 1px solid rgba(17,17,17,.08); z-index: 40;
  }
  .ticker__label {
    display: flex; align-items: center; gap: 9px; padding: 0 20px;
    border-right: 1px solid rgba(17,17,17,.08); flex: 0 0 auto;
  }
  .ticker__label span:last-child { font-size: 10.5px; font-weight: 600; letter-spacing: .16em; color: rgba(17,17,17,.8); }
  .livedot { width: 7px; height: 7px; border-radius: 50%; background: #22C55E; position: relative; }
  .livedot::after {
    content: ""; position: absolute; inset: -4px; border-radius: 50%;
    background: #22C55E; opacity: .35; animation: pulse 2.4s ease-out infinite;
  }
  @keyframes pulse { 0% { transform: scale(.6); opacity: .5; } 100% { transform: scale(1.8); opacity: 0; } }

  .ticker__track {
    flex: 1; overflow: hidden; display: flex; align-items: center; position: relative;
    -webkit-mask-image: linear-gradient(90deg, transparent, #000 40px, #000 calc(100% - 40px), transparent);
            mask-image: linear-gradient(90deg, transparent, #000 40px, #000 calc(100% - 40px), transparent);
  }
  .marquee { display: inline-flex; align-items: center; white-space: nowrap; }
  .item {
    font-size: 12.5px; color: rgba(17,17,17,.52); letter-spacing: .01em;
    text-decoration: none; padding: 14px 22px;  /* dikey padding = büyük hitbox */
  }
  .item:hover, .item:focus-visible { color: #111; text-decoration: underline; }
  .item:focus-visible { outline: 2px solid #22C55E; outline-offset: 4px; }

  /* animasyon yalnız data-animate=true + geniş ekran + reduced-motion kapalıysa */
  @media (min-width: 768px) and (prefers-reduced-motion: no-preference) {
    .ticker__track[data-animate="true"] .marquee {
      animation: marquee 34s linear infinite;
      will-change: transform;
    }
    .ticker__track[data-animate="true"]:hover .marquee,
    .ticker__track[data-animate="true"]:focus-within .marquee { animation-play-state: paused; }
  }
  @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }

  /* mobil: animasyon yok, kaydırılır */
  @media (max-width: 767px) {
    .ticker__track { overflow-x: auto; scroll-snap-type: x proximity; }
  }
</style>
```

Not: `animate=true` iken içerik iki kez basılır (kesintisiz `translateX(-50%)` döngüsü); ikinci kopya `aria-hidden` + `tabindex="-1"` (ekran okuyucu/klavye tekrar görmez). `animate=false` iken tek kopya, sabit.

- [ ] **Step 2: Şeridi index'e ekle**

`src/pages/index.astro` içinde import ekle ve `</main>`'den SONRA, layout slot'u içinde yerleştir:
```astro
---
import BusinessCardLayout from "../layouts/BusinessCardLayout.astro";
import NewsTicker from "../components/NewsTicker.astro";
---
<BusinessCardLayout>
  <main class="card">
    <!-- ... center bloğu aynı ... -->
  </main>
  <NewsTicker />
</BusinessCardLayout>
```
(`.card`'ın `padding-bottom: 90px`'i şeridin 46px'iyle çakışmayı önler; şerit `position:absolute; bottom:0` → `<body>`'ye göre; kısa ekranda merkez padding'i korur.)

- [ ] **Step 3: Build + doğrula (2 başlık → sabit, sıfır-JS)**

Run:
```bash
bun run build
grep -o 'data-animate="[a-z]*"' dist/index.html          # 2 haber var → "false" beklenir
grep -c "astro-island" dist/index.html || echo "0 island"
grep -c "İSTANBUL" dist/index.html                         # 1 beklenir
grep -o '/news/[a-z-]*' dist/index.html | sort -u          # /news/ai-ticaret, /news/surdurulebilirlik
```
Expected: `data-animate="false"` (2 başlık, guard), 0 island, İSTANBUL var, 2 news link.

- [ ] **Step 4: 4+ başlık davranışını test et (geçici)**

`src/content/news/` altına geçici 2 dummy `.md` ekle (title/date/category/thumbnail/excerpt), `bun run build`, `dist/index.html`'de `data-animate="true"` ve çift kopya (marquee) doğrula, sonra dummy'leri sil + tekrar build (`data-animate="false"`).
Expected: 4 başlıkta `true`, geri alınca `false`. (Guard'ın canlı doğrulaması.)

- [ ] **Step 5: Commit**

```bash
git add src/components/NewsTicker.astro src/pages/index.astro
git commit -m "feat(ticker): alt haber şeridi — CSS marquee, sayı-guard, mobil-statik, a11y (hover/focus pause)"
```

---

### Task 6: Minimal makale sayfası — `NewsArticleLayout` + `news/[...slug]`

**Files:**
- Create: `src/layouts/NewsArticleLayout.astro`
- Overwrite: `src/pages/news/[...slug].astro` (main'deki BaseLayout'lu sürümü değiştir)

**Interfaces:**
- Consumes: `getCollection('news')`, `render(entry)` (astro:content).
- Produces: `/news/<slug>` — minimal makale; header nav yok; "← Platcox" dönüş linki; kendi title/description/canonical.

- [ ] **Step 1: Makale layout'u yaz**

`src/layouts/NewsArticleLayout.astro`:
```astro
---
import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "../styles/card-reset.css";

interface Props { title: string; description: string }
const { title, description } = Astro.props;
const canonical = new URL(Astro.url.pathname, Astro.site);
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title} — PlatcoX</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical.href} />
    <meta property="og:type" content="article" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonical.href} />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  </head>
  <body>
    <main class="article">
      <a class="back" href="/">← Platcox</a>
      <article><slot /></article>
    </main>
    <style>
      .article { max-width: 720px; margin: 0 auto; padding: clamp(40px, 8vh, 96px) clamp(24px, 5vw, 40px); }
      .back { display: inline-block; margin-bottom: 48px; font-size: 14px; font-weight: 500; text-decoration: none; color: rgba(17,17,17,.6); }
      .back:hover, .back:focus-visible { color: #111; }
      .back:focus-visible { outline: 2px solid #22C55E; outline-offset: 4px; }
      article :global(h1) { font-weight: 300; font-size: clamp(28px, 4vw, 48px); letter-spacing: -.02em; line-height: 1.15; margin-bottom: 24px; }
      article :global(p) { font-size: 17px; line-height: 1.7; color: rgba(17,17,17,.8); margin-bottom: 20px; }
    </style>
  </body>
</html>
```

- [ ] **Step 2: Route'u yaz (main sürümünün üstüne)**

`src/pages/news/[...slug].astro`:
```astro
---
import { getCollection, render } from "astro:content";
import NewsArticleLayout from "../../layouts/NewsArticleLayout.astro";

export async function getStaticPaths() {
  const news = await getCollection("news");
  return news.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}

const { entry } = Astro.props;
const { Content } = await render(entry);
---
<NewsArticleLayout title={entry.data.title} description={entry.data.excerpt}>
  <h1>{entry.data.title}</h1>
  <Content />
</NewsArticleLayout>
```

- [ ] **Step 3: Build + route doğrula**

Run:
```bash
bun run build
ls dist/news/                                  # ai-ticaret + surdurulebilirlik dizinleri
grep -c "astro-island" dist/news/ai-ticaret/index.html || echo "0 island"
grep -c "BaseLayout\|Lenis\|gsap" dist/news/ai-ticaret/index.html || echo "0 motion (beklenen)"
```
Expected: iki makale dizini var, 0 island, 0 motion.

- [ ] **Step 4: Tip kontrolü**

Run: `bun run type-check`
Expected: 0 error.

- [ ] **Step 5: Commit**

```bash
git add src/layouts/NewsArticleLayout.astro src/pages/news/[...slug].astro
git commit -m "feat(news): minimal makale sayfası + layout — nav yok, ← Platcox dönüş, kendi SEO"
```

---

### Task 7: Bundle temizliği + correctness fix'leri

**Files:**
- Delete: shelved section components, `src/pages/poster.astro` (yeni branch'te yoksa atla), unused videos, `src/pages/_*`/playground
- Modify: `nginx/nginx.conf`, `public/llms.txt`, `.gitignore`, `.dockerignore`
- Create: `src/pages/404.astro`, `public/logo-512.png`

**Interfaces:**
- Produces: temiz dist (motion/video yok), gerçek 404, güncel llms.txt, doğru JSON-LD logosu.

- [ ] **Step 1: Kullanılmayan bileşen + varlıkları sil (yeni branch main'den geldiği için 12-bölüm bileşenleri burada)**

```bash
cd ../platcox-web-minimal
# index/news dışında kalan section bileşenleri + demolar:
git rm src/components/HeroSection.astro src/components/AboutSection.astro \
  src/components/PhilosophySection.astro src/components/SolutionsSection.astro \
  src/components/ClientsWhySection.astro src/components/SustainabilitySection.astro \
  src/components/TestimonialsSection.astro src/components/TestimonialsCarousel.tsx \
  src/components/NewsSection.astro src/components/ContactSection.astro src/components/ContactForm.tsx \
  src/components/LocationsSection.astro src/components/WorldMap.tsx src/components/DualCTA.astro \
  src/components/Header.astro src/components/MobileMenu.tsx src/components/LazyVideo.astro \
  src/components/DecisionEngineSection.astro src/components/DecisionEngineDemo.tsx 2>/dev/null
git rm -r src/components/__tests__ 2>/dev/null   # silinen bileşenlerin testleri
# kullanılmayan videolar:
git rm public/videos/*.mp4 2>/dev/null; rm -f public/videos/hero-poster.jpg 2>/dev/null
```
Not: Bir bileşen `git rm` sırasında "pathspec did not match" verirse (main'de farklı adla), atla — Step 4 build'i eksik/fazla referansı yakalar.

- [ ] **Step 2: nginx soft-404 → gerçek 404**

`nginx/nginx.conf` içinde `try_files $uri $uri/ /index.html;` satırını değiştir:
```nginx
        try_files $uri $uri/ =404;
```
`src/pages/404.astro`:
```astro
---
import BusinessCardLayout from "../layouts/BusinessCardLayout.astro";
---
<BusinessCardLayout title="404 — PlatcoX">
  <main style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;text-align:center;padding:40px;">
    <h1 style="font-weight:300;font-size:clamp(28px,4vw,48px);">Page not found<span style="color:#22C55E;">.</span></h1>
    <a href="/" style="font-weight:500;border-bottom:1px solid rgba(0,0,0,.25);text-decoration:none;">← Platcox</a>
  </main>
</BusinessCardLayout>
```

- [ ] **Step 3: llms.txt + ignore dosyaları + logo**

`public/llms.txt` içeriğini tek gerçeğe indir:
```
# PlatcoX
Organize global trade and make products accessible anywhere in the world.
Contact: info@platcox.com
```
`.gitignore` ve `.dockerignore` sonuna ekle (ikisi de):
```
.worktrees/
```
512×512 kurumsal logo ekle: `public/logo-512.png` (mevcut `src/assets/platcox-logo.png`'den türet — kare, ≥112px; JSON-LD Task 3'te `/logo-512.png`'e işaret ediyor). Basit yol:
```bash
# ImageMagick varsa:
magick src/assets/platcox-logo.png -resize 512x512 -background white -gravity center -extent 512x512 public/logo-512.png
# yoksa: kare bir PNG'yi manuel yerleştir; JSON-LD referansı /logo-512.png kalmalı
```

- [ ] **Step 4: Build temiz + referans kırığı yok**

Run:
```bash
bun run type-check
bun run build
```
Expected: 0 tip hatası; build başarılı (silinen bileşene kalan import varsa burada patlar → import'u temizle).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: bundle temizliği + correctness (nginx =404, 404 sayfası, llms.txt, .worktrees ignore, 512 logo)"
```

---

### Task 8: Final doğrulama (kabul kriterleri)

**Files:** (yok — doğrulama)

- [ ] **Step 1: Tam suite**

Run:
```bash
cd ../platcox-web-minimal
bun install --frozen-lockfile
bun run type-check
bun test
bun run build
```
Expected: type-check 0, testler geçer (ticker), build başarılı.

- [ ] **Step 2: dist assertion'ları**

Run:
```bash
grep -c "astro-island" dist/index.html || echo "0 island ✓"
grep -Eic "gsap|lenis|framer|\.mp4|hero-bg" dist/index.html || echo "0 motion/video ✓"
test -d dist/news/ai-ticaret && test -d dist/news/surdurulebilirlik && echo "news routes ✓"
test ! -d dist/poster && test ! -d dist/motion-playground && echo "poster/playground yok ✓"
grep -q "platcox" dist/sitemap-0.xml && echo "sitemap ✓"
grep -o "info@platcox.com" dist/index.html | head -1
```
Expected: hepsi ✓; sitemap yalnız `/` + `/news/*`.

- [ ] **Step 3: a11y/behavior manuel kontrol**

`bun run preview` → tarayıcıda: (a) misyon CSS'siz okunur mu (devtools ile CSS kapat), (b) Tab ile `info@` ve şerit başlıklarına focus + focus ring, (c) şerit 2 başlıkta sabit, (d) reduced-motion açıkken rise + şerit durur. Preview'ı durdur (dev server bırakma).

- [ ] **Step 4: Push + PR**

```bash
git push -u origin feat/minimal-homepage
gh pr create --title "feat: minimal business-card homepage + news ticker" \
  --body "12-section site → tek ekran kartvizit. Misyon: 'Organize global trade and make products accessible anywhere in the world.' + tıklanır haber şeridi. Sıfır-JS. Arşiv: tag archive/motion-homepage-2026-07-16, branch archive/untracked-design-assets-2026-07-16. PR #2 (motion) dokunulmadı. Rollback: arşiv tag'i redeploy."
```
Expected: PR açılır. **Merge/deploy ONAY bekler — bu plan merge etmez.**

---

## Self-Review Notları (yazım sonrası)

- **Spec kapsamı:** §4 içerik → Task 4+5; §4.1 şerit (guard/mobil/a11y) → Task 5; §5 görsel → Task 3+4; §6 teknik → Task 3-6; §7 arşiv → Task 1; §8 SEO/a11y → Task 3+6+8; §9 correctness → Task 7; §11 kabul → Task 8. ✓
- **Rollback:** her task commit'li, arşiv tag Task 1'de; PR merge etmez.
- **Motion branch dokunulmuyor:** tüm iş sibling worktree `../platcox-web-minimal`'de.
- **Bilinen açık uç:** `public/images/news/*.jpg` thumbnail'ları makale sayfasında kullanılmıyor (excerpt/title yeterli); ticker yalnız title. Thumbnail'lı makale görseli ileride eklenebilir (kapsam dışı).
