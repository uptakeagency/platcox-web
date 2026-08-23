# Platcox — Hybrid Homepage (Motion site + Mission Card) — Design

**Tarih:** 2026-07-17
**Durum:** Design — kullanıcı yönü + mockup'ı onayladı, spec incelemesi + plan bekliyor
**Öncül:** [[project-minimal-homepage]] (minimal-only, PR #3 merged) + [[project-motion-library]] (motion site, PR #2 draft). Bu hybrid ikisini birleştirir.

## 1. Amaç

Güzel bulunan **motion sitesini koru**, ama alttaki 3 bölümü çıkar ve yerlerine **beyaz "Mission Card" bölümü** koy (minimal kartın özü + haber şeridi). İkisinin en iyisi: motion'lı monümental üst + sade nefes + akan haberler.

## 2. Onaylanan / design'dan ayrılan GÖRÜNÜR noktalar (kullanıcı onaylı)

- **Kaldırılan 3 bölüm** (görünür kayıp, onaylı): `SustainabilitySection` ("SUSTAINABILITY BY DESIGN" / "IMPACT METRICS") · `TestimonialsSection` ("WHAT THEY SAY") · `NewsSection` ("Latest from PlatcoX").
- **Eklenen:** beyaz `MissionCardSection` — dev mission cümlesi + haber şeridi. Bölümün News'in yerini tutması: haberler kaybolmaz, şeride döner.
- **Mission animasyonu:** düz CSS rise DEĞİL, **ManifestoRise primitive'i** (site motion vokabülerine uyum). Yeşil nokta imzası CSS `::after` ile korunur (aşağıda).
- **Beyaz nefes:** bölüm saf beyaz (#fff), gri monümental akış içinde kasıtlı duraklama.
- **DEĞİŞMEYEN:** `ClientsWhySection` ("WHO WE WORK WITH / WHY PLATCOX") ve Hero/About/Philosophy/Solutions/Janus/Contact/Locations/DualCTA/Footer — hepsi motion sitesindeki gibi kalır.

## 3. Bölüm sırası (final)

`Header → Hero → About → Philosophy → Solutions → Janus → ClientsWhy → **MissionCard (yeni)** → Contact → Locations → DualCTA → Footer`

## 4. MissionCard bölümü spec

Tam-viewport (`min-height:100vh`), **beyaz**, dikey+yatay ortalı, `position:relative` (şerit için).
1. **Mission cümlesi** — `<ManifestoRise>` ile, `as="h1"`, `client:visible` (görünürken hydrate), `trigger="viewport-once"`, 3 satır:
   `["Organize global trade", "and make products accessible", "anywhere in the world"]`
   Inter 300, ortalı, `clamp(34px→92px)`, tight tracking. ManifestoRise her satırı `<span style="display:block">` basar.
2. **Yeşil nokta imzası** — string'e gömülemez (ManifestoRise düz metin); son satır span'ine CSS ile: `.mission-rise span:last-of-type::after { content:"."; color:#22C55E }`. Nokta son satırla birlikte yükselir.
3. **Haber şeridi** — bölümün **alt kenarında** (`position:absolute; bottom:0`, section `position:relative` olduğu için viewport'a değil bölüme oturur). Fixed DEĞİL.

## 5. Haber şeridi — main'den port

`src/lib/ticker.ts` + `src/components/NewsTicker.astro` **main'den (merged PR #3) aynen kopyalanır** — bu hybrid `feat/motion-library`'den dallandığı için orada yoklar. Davranış korunur: build-time `getCollection('news')` + `buildTicker` (sıralama + sayı-guard), yeşil `◦` ayraç, İSTANBUL chyron + nabız, `<nav aria-label>`, sayı-guard (<4 sabit/ortalı, 0 gizli), mobil-statik, hover+focus-within pause, reduced-motion sabit, `lang="tr"`, tıklanır → `/news/<slug>`. Sıfır JS (şerit CSS). Tek fark: `position:absolute` artık MissionCard bölümüne göre çözülür (kod değişmez, sarmalayan bölüm `position:relative`).

## 6. Teknik

- **Base branch:** `feat/motion-library` (d41e579) — güzel motion sitesi burada. Yeni branch: `feat/hybrid-homepage`.
- **BaseLayout (motion) KALIR** — bu motion sitesi; Lenis + scroll reveal + primitive'ler aktif. (Minimal'deki `BusinessCardLayout` burada kullanılmaz.)
- **Port:** `src/lib/ticker.ts` + `src/components/NewsTicker.astro` main'den kopyalanıp commit.
- **Yeni:** `src/components/MissionCardSection.astro` (beyaz bölüm + ManifestoRise + NewsTicker).
- **`src/pages/index.astro`:** 3 bölümün import+kullanımı silinir, `MissionCardSection` ClientsWhy ile Contact arasına eklenir.
- **News makale sayfaları:** motion branch'teki mevcut `src/pages/news/[...slug].astro` (BaseLayout'lu) OLDUĞU GİBİ kalır — şerit linkleri zaten çözülür. (Minimal NewsArticleLayout'a geçiş kapsam dışı.)
- Kaldırılan 3 bölüm bileşeni index'ten çıkar; dosyaları silmek opsiyonel (build'de kullanılmıyorsa zarar yok — ayrı temizlik).

## 7. Git / yön gerçeği (kullanıcı onaylı)

Şu an `main` = minimal-only kart (PR #3 merged). Bu hybrid merge olunca **`main` motion+kart olur; minimal-only canlı anasayfadan kalkar** (commit geçmişi + PR #3'te korunur). Akış: `feat/hybrid-homepage` → PR → merge → main. Deploy otomatik.

## 8. Korunanlar

- `feat/motion-library` + Draft PR #2 dokunulmaz (base olarak kullanılır, üstüne yazılmaz).
- Arşiv tag `archive/motion-homepage-2026-07-16` + minimal-only commit'ler (main geçmişinde) durur.

## 9. Kapsam dışı

- Kaldırılan 3 bölümün bileşen dosyalarını fiziksel silmek (index'ten çıkması yeterli; temizlik ayrı).
- News makale sayfalarını minimal NewsArticleLayout'a çevirmek.
- Astro 7 / Tailwind 4 migration.

## 10. Kabul kriterleri

- Anasayfa bölüm sırası §3'teki gibi; Sustainability/Testimonials/News DOM'da yok; MissionCard ClientsWhy ile Contact arasında.
- MissionCard: beyaz tam-viewport, mission ManifestoRise ile 3 satır belirir, yeşil nokta son satırda görünür, şerit bölüm alt kenarında.
- Şerit main'deki davranışı korur (guard/mobil/a11y/◦/lang), `/news/<slug>`'a gider ve o sayfalar 200 döner.
- `bun run type-check` 0 · `bun test` geçer (ManifestoRise + ticker testleri) · `bun run build` başarılı.
- Motion sitesinin geri kalanı (Hero trade routes, Janus, ScrollReveal'lar) çalışır durumda.
- Rollback: `feat/motion-library` veya arşiv tag redeploy.
