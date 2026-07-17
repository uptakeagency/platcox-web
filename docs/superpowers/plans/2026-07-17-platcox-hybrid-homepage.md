# Platcox Hybrid Homepage (Motion site + Mission Card) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Motion sitesini koruyup 3 alt bölümü (Sustainability/Testimonials/News) beyaz bir Mission Card bölümüyle (mission cümlesi ManifestoRise + haber şeridi) değiştirmek.

**Architecture:** Yeni `feat/hybrid-homepage` branch'i `feat/motion-library`'den (d41e579). Ticker (`ticker.ts` + `NewsTicker.astro`) `origin/main`'den (merged PR #3) port edilir. Yeni `MissionCardSection.astro` (beyaz section + ManifestoRise mission + NewsTicker). `index.astro`'da 3 bölüm çıkar, MissionCard ClientsWhy ile Contact arasına girer.

**Tech Stack:** Astro 6.1.3, motion library (ManifestoRise/GSAP/Lenis), BaseLayout (motion), bun test, scoped CSS.

**Design source:** `~/Projects/platcox-web/docs/superpowers/specs/2026-07-17-platcox-hybrid-homepage-design.md`

## Design'dan / onaylanandan GÖRÜNÜR noktalar (kullanıcı onaylı)

1. Sustainability + Testimonials + News bölümleri anasayfadan çıkar.
2. Yerine beyaz MissionCard: mission cümlesi **ManifestoRise** ile belirir (site motion diline uyum), yeşil nokta CSS `::after` ile korunur, şerit bölüm alt kenarında.
3. Merge → `main` motion+kart olur, minimal-only kalkar (geçmişte durur).

## Global Constraints

- **Base branch:** `feat/hybrid-homepage`, `feat/motion-library`'den (d41e579). Motion branch + PR #2 üstüne YAZILMAZ.
- **BaseLayout (motion) KALIR** — bu motion sitesi. `BusinessCardLayout` kullanılmaz.
- **Mission cümlesi metni:** tam olarak "Organize global trade and make products accessible anywhere in the world" (3 satıra bölünür, sonda yeşil nokta).
- **Aksan yeşil `#22C55E`**, mission metin `#111`, MissionCard zemin `#fff`.
- **Şerit davranışı korunur** (main'deki NewsTicker): sayı-guard (<4 sabit/ortalı, 0 gizli), mobil-statik, hover+`:focus-within` pause, reduced-motion sabit, yeşil `◦`, `lang="tr"`, `<nav aria-label>`, tıklanır `/news/<slug>`. Sıfır JS (CSS).
- **Bölüm sırası:** `... Janus → ClientsWhy → MissionCard → Contact → Locations ...`
- **Test:** `bun test <dosya>`. **Tip:** `bun run type-check`. **Build:** `bun run build`.

---

### Task 1: Branch + worktree (feat/motion-library'den)

**Files:** Create (git): branch `feat/hybrid-homepage`; worktree `../platcox-web-hybrid`. Copy: spec + plan.

**Interfaces:** Produces `../platcox-web-hybrid` worktree'si `feat/hybrid-homepage` üzerinde (d41e579'dan), spec+plan commit'li. Sonraki tüm task'ler burada.

- [ ] **Step 1: Doğrula — motion tip senkron**

Run:
```bash
cd ~/Projects/platcox-web && git fetch origin
git rev-parse d41e579 origin/feat/motion-library   # aynı SHA
```
Expected: iki satır da `d41e579...`.

- [ ] **Step 2: Worktree'yi motion branch'ten aç**

```bash
git worktree add ../platcox-web-hybrid -b feat/hybrid-homepage d41e579
```
Expected: `Preparing worktree (new branch 'feat/hybrid-homepage')`, HEAD d41e579.

- [ ] **Step 3: Spec + plan'ı taşı ve commit**

```bash
mkdir -p ../platcox-web-hybrid/docs/superpowers/specs ../platcox-web-hybrid/docs/superpowers/plans
cp docs/superpowers/specs/2026-07-17-platcox-hybrid-homepage-design.md ../platcox-web-hybrid/docs/superpowers/specs/
cp docs/superpowers/plans/2026-07-17-platcox-hybrid-homepage.md ../platcox-web-hybrid/docs/superpowers/plans/
git -C ../platcox-web-hybrid add docs/superpowers/
git -C ../platcox-web-hybrid commit -m "docs: hybrid homepage design spec + plan"
```
Expected: 2 dosya commit. **Bundan sonra tüm iş `../platcox-web-hybrid`'de.**

- [ ] **Step 4: Bağımlılıklar kurulu**

```bash
cd ../platcox-web-hybrid && bun install
```
Expected: kurulum tamam (motion deps: framer/gsap/lenis zaten lockfile'da).

---

### Task 2: Ticker'ı main'den port et

**Files:**
- Create: `src/lib/ticker.ts`, `src/lib/ticker.test.ts`, `src/components/NewsTicker.astro` (main'den kopya)

**Interfaces:** Produces `NewsTicker` bileşeni + `buildTicker` — Task 3 (MissionCardSection) tüketir.

- [ ] **Step 1: Dosyaları origin/main'den çıkar**

Run (worktree `../platcox-web-hybrid`'de):
```bash
cd ~/Projects/platcox-web-hybrid
mkdir -p src/lib
git show origin/main:src/lib/ticker.ts > src/lib/ticker.ts
git show origin/main:src/lib/ticker.test.ts > src/lib/ticker.test.ts
git show origin/main:src/components/NewsTicker.astro > src/components/NewsTicker.astro
```

- [ ] **Step 2: Ticker testi geçiyor mu**

Run: `bun test src/lib/ticker.test.ts`
Expected: PASS — 5 tests. (Saf TS; motion branch'te de aynı çalışır.)

- [ ] **Step 3: Type-check**

Run: `bun run type-check`
Expected: 0 error. (`getCollection('news')` motion branch'te de var; `@fontsource/inter` gerekmez — NewsTicker kendi scoped CSS'ini kullanır.)

- [ ] **Step 4: Commit**

```bash
git add src/lib/ticker.ts src/lib/ticker.test.ts src/components/NewsTicker.astro
git commit -m "feat(ticker): port news ticker + veri modülü from minimal homepage (main)"
```

---

### Task 3: MissionCardSection bileşeni

**Files:**
- Create: `src/components/MissionCardSection.astro`

**Interfaces:**
- Consumes: `ManifestoRise` (`./motion/primitives/ManifestoRise`), `NewsTicker` (`./NewsTicker.astro`).
- Produces: `<MissionCardSection />` — Task 4 index'e ekler.

- [ ] **Step 1: Bileşeni yaz**

`src/components/MissionCardSection.astro`:
```astro
---
import ManifestoRise from "./motion/primitives/ManifestoRise";
import NewsTicker from "./NewsTicker.astro";
---
<section id="mission" class="mission-card">
  <ManifestoRise
    client:visible
    as="h1"
    trigger="viewport-once"
    lines={["Organize global trade", "and make products accessible", "anywhere in the world"]}
    className="mission-rise"
  />
  <NewsTicker />
</section>

<style>
  .mission-card {
    position: relative;
    min-height: 100vh;
    background: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: clamp(40px, 7vw, 90px) clamp(28px, 6vw, 90px) 92px;
  }
  /* ManifestoRise React island → scope delinir (:global) */
  :global(.mission-rise) {
    font-weight: 300;
    letter-spacing: -0.028em;
    line-height: 1.08;
    font-size: clamp(34px, 6vw, 92px);
    max-width: 15ch;
    color: #111;
    margin: 0;
  }
  /* yeşil nokta imzası — son satır span'ine (string'e gömülemez) */
  :global(.mission-rise span:last-of-type)::after {
    content: ".";
    color: #22C55E;
  }
</style>
```

- [ ] **Step 2: Type-check + build**

Run: `bun run type-check && bun run build`
Expected: 0 tip hatası; build başarılı. (MissionCardSection henüz index'te değil — bu adım yalnız bileşenin derlendiğini doğrular; index entegrasyonu Task 4.)

- [ ] **Step 3: Commit**

```bash
git add src/components/MissionCardSection.astro
git commit -m "feat(home): MissionCardSection — beyaz bölüm, ManifestoRise mission + yeşil nokta + haber şeridi"
```

---

### Task 4: index.astro entegrasyonu (3 bölüm çıkar, MissionCard ekle)

**Files:**
- Modify: `src/pages/index.astro`

**Interfaces:** Consumes `MissionCardSection` (Task 3). Produces final anasayfa bölüm sırası.

- [ ] **Step 1: 3 bölümün import'unu kaldır, MissionCard import'u ekle**

`src/pages/index.astro` frontmatter'ında bu 3 satırı SİL:
```astro
import SustainabilitySection from "../components/SustainabilitySection.astro";
import TestimonialsSection from "../components/TestimonialsSection.astro";
import NewsSection from "../components/NewsSection.astro";
```
Ve `ClientsWhySection` import satırından hemen sonra EKLE:
```astro
import MissionCardSection from "../components/MissionCardSection.astro";
```

- [ ] **Step 2: 3 bölüm kullanımını MissionCard ile değiştir**

`src/pages/index.astro` gövdesinde bu 3 satırı:
```astro
    <SustainabilitySection />
    <TestimonialsSection />
    <NewsSection />
```
tek satırla DEĞİŞTİR:
```astro
    <MissionCardSection />
```
(Sonuç: `<ClientsWhySection />` → `<MissionCardSection />` → `<ContactSection />`.)

- [ ] **Step 3: Build + bölüm sırası doğrula**

Run:
```bash
bun run type-check
bun run build
echo "--- kaldırılan bölümler DOM'da olmamalı:"
grep -c "SUSTAINABILITY BY DESIGN\|WHAT THEY SAY\|Latest from PlatcoX" dist/index.html || echo "0 (kaldırıldı ✓)"
echo "--- MissionCard + şerit var mı:"
grep -c "mission-rise" dist/index.html
grep -c "<nav class=\"ticker\"" dist/index.html
grep -c "Organize global trade" dist/index.html
echo "--- ClientsWhy + Contact duruyor mu:"
grep -c "WHY PLATCOX\|WHO WE WORK WITH" dist/index.html
```
Expected: kaldırılan 3 başlık = 0; mission-rise ≥1, nav ticker =1, mission cümlesi ≥1; ClientsWhy başlığı ≥1.

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat(home): 3 bölümü (Sustainability/Testimonials/News) MissionCard ile değiştir"
```

---

### Task 5: Final doğrulama + görsel + PR

**Files:** (yok — doğrulama)

- [ ] **Step 1: Tam suite**

Run:
```bash
cd ~/Projects/platcox-web-hybrid
bun install --frozen-lockfile
bun run type-check
bun test
bun run build
```
Expected: type-check 0; testler geçer (ticker + ManifestoRise + diğer motion testleri); build başarılı.

- [ ] **Step 2: Görsel doğrulama (controller yapar)**

`dist`'i servis et, tarayıcıda anasayfayı ClientsWhy → MissionCard → Contact akışında gör: beyaz bölüm, mission ManifestoRise ile belirir, yeşil nokta son satırda, şerit alt kenarda ortalı (2 haber → sabit). Kaldırılan 3 bölüm yok. (Controller screenshot ile ground-truth doğrular.)

- [ ] **Step 3: Push + PR (ONAY sonrası)**

```bash
git push -u origin feat/hybrid-homepage
gh pr create --base main --head feat/hybrid-homepage \
  --title "feat: hybrid homepage — motion site + Mission Card section" \
  --body "Motion sitesi korunur; Sustainability/Testimonials/News bölümleri beyaz Mission Card ile (mission ManifestoRise + haber şeridi) değiştirilir. Merge → main motion+kart olur (minimal-only geçmişte korunur). Base: feat/motion-library."
```
Expected: PR açılır. **Merge/deploy ONAY bekler.**

---

## Self-Review Notları

- **Spec kapsamı:** §2 çıkan bölümler → Task 4; §4 MissionCard → Task 3; §5 ticker port → Task 2; §6 teknik → Task 1-4; §3 sıra → Task 4 Step 3 doğrulama; §7 git → Task 1 + Task 5. ✓
- **Type tutarlılığı:** ManifestoRise props (lines/as/trigger/className/client:visible) HeroSection kullanımıyla uyumlu; NewsTicker/buildTicker main'deki imza.
- **Bilinen risk:** `:global(.mission-rise span:last-of-type)::after` — ManifestoRise'ın viewport-once branch'i motion.span render eder; `span:last-of-type` yine eşleşir. Task 3 Step 2 build + Task 5 görsel doğrulama yeşil noktayı teyit eder; görünmezse `:global` seçici son-satır sarmalını hedefleyecek şekilde ayarlanır (fallback: düz nokta + şeridin yeşili section aksanı taşır).
- Motion branch üstüne yazılmaz; iş sibling worktree'de.
