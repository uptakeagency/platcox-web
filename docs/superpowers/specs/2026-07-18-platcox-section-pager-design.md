# Platcox — Section Pager (fullPage-style scroll) — Design

**Tarih:** 2026-07-18
**Durum:** Design — kullanıcı yönü + mobil/nav kararlarını onayladı; spec incelemesi + plan bekliyor
**Bağlam:** [[project-minimal-homepage]] hybrid `main`'de canlı. Kullanıcı proximity snap'i "zayıf" buldu; asıl istediği **paging** (her kaydırma = sonraki bölüm, slide gibi). Branch `feat/scroll-snap` (Snap denemesi burada — kaldırılacak).

## 1. Amaç

Masaüstünde **section-pager**: her kaydırma/klavye hareketi anasayfayı bir bölüm ilerletir/geri alır (fullPage.js mantığı). Uzun bölümler önce kendi içinde kayar, sonra geçer (içerik hapsolmaz). Yan tarafta ince nokta nav. Lenis'in Snap denemesi kaldırılır.

## 2. Onaylanan kararlar (kullanıcı)

- **Mobil:** paging YOK → native scroll (pager yalnız masaüstü: `min-width:768px` ve `pointer: fine`).
- **Nav göstergesi:** VAR → sağda ince dikey nokta nav, aktif bölüm vurgulu, tıkla → o bölüme kayar.
- **reduced-motion:** pager KAPALI → native scroll (a11y).
- **Klavye:** ↓/↑, PageDown/PageUp, Space ile paging (a11y).

## 3. Ölçülen kısıt (bağlayıcı)

Bölüm yükseklikleri (viewport 811px'te): hero 1.0×, about 0.92×, philosophy 0.93×, solutions 1.08×, **janus 1.56×**, **clients 1.54×**, mission 1.0×, contact 1.19×, locations 1.25×, DualCTA 0.16×. → 5 bölüm ekrandan uzun. Bu yüzden "bir bölüm = bir ekran" mandatory paging İÇERİĞİ GİZLER; pager **uzun bölümleri iç-kaydırmayla** ele almalı.

## 4. Davranış

### 4.1 Niyet yakalama (masaüstü)
- `wheel` olayı yakalanır (`preventDefault`), delta yönü belirlenir. Bir "hareket" = bir geçiş: geçiş sırasında (`isAnimating`) ve kısa bir debounce penceresinde (~ transition süresi) yeni niyet **yutulur** (trackpad momentum'u tek geçişe indirger).
- Klavye: ArrowDown/PageDown/Space → ileri; ArrowUp/PageUp → geri (input/textarea focus'ta değilken; `preventDefault`).

### 4.2 Uzun bölüm iç-kaydırma (crux)
- Aktif bölümün `getBoundingClientRect()` ile üst/alt konumu bilinir. Bir bölüm "uzun" = `sectionHeight > viewport`.
- **İleri niyet:** aktif bölümün ALT kenarı henüz viewport altındaysa (bölümün görülmemiş kısmı var) → bölüm içinde ~`0.85 * viewport` ilerlet (`lenis.scrollTo(hedef)`), bölüm dibini aşmayacak şekilde clamp. Alt kenar zaten görünürse → **sonraki bölümün üstüne** geç.
- **Geri niyet:** simetrik — bölümün ÜST kenarı viewport üstündeyse iç-yukarı adım; değilse önceki bölüme geç.
- Full-height/kısa bölümlerde ilk niyet direkt sonraki/önceki bölüme geçer.

### 4.3 Hedefleme + header offset
- `lenis.scrollTo(target, { offset: -HEADER, duration, easing })`; fixed header (~80px) için offset. Bölüm üstü header altına gizlenmez.
- Snap değil `scrollTo` — Lenis animasyonuyla akıcı geçiş.

### 4.4 Nokta nav
- `main > section` başına bir nokta (DualCTA gibi çok kısa/yardımcı bölümler hariç tutulabilir — ölçüye göre; başlangıçta tüm section'lar). Sağda `position: fixed`, dikey ortalı.
- Aktif nokta: IntersectionObserver ile o an baskın bölüm vurgulanır.
- Tıkla → `lenis.scrollTo(section, {offset})`. Her nokta `<button>`, `aria-label` bölüm adı.
- reduced-motion / mobilde nav gizli mi? → **mobilde gizli** (pager yok), reduced-motion'da görünür ama tıklama native `scrollIntoView` ile çalışır (opsiyonel). Basit tut: nav yalnız pager aktifken (masaüstü, non-reduced) render/aktif.

## 5. Guard'lar & a11y

- **Aktivasyon:** `matchMedia('(min-width:768px) and (pointer:fine)').matches && !prefers-reduced-motion`. Değilse pager hiç kurulmaz → native scroll + nav gizli.
- `resize`/media-change dinlenir; masaüstü↔mobil geçişte pager kur/yık.
- Anchor linkler (Header `#about` vb.) çalışmaya devam eder — pager wheel/key yakalar ama programatik `scrollTo`/hash navigasyonunu engellemez.
- Klavye kullanıcısı Tab ile içerikte gezebilmeli; pager focus'u hapsetmez. Bir öğe focus'landığında (input/link) pager onu ezmez.
- `wheel` listener `{ passive: false }` (preventDefault için); yalnız pager aktifken bağlanır, yıkımda kaldırılır.

## 6. Teknik mimari

- **Yeni:** `src/lib/sectionPager.ts` — `createSectionPager({ lenis, sections, headerOffset })` → `{ destroy() }`. Saf TS, DOM + Lenis API. Niyet yakalama + uzun-bölüm mantığı + debounce burada. **Birim-test edilebilir kısım:** hedef-hesaplama saf fonksiyonu (`nextTarget(state)` → intra-step mi next-section mi + hedef px), TDD ile.
- **Nav:** `src/components/SectionNav.astro` (veya pager içinde DOM üretimi). Noktalar + IntersectionObserver + click→scrollTo.
- **BaseLayout:** Lenis kurulum bloğunda (reduced-motion guard'lı, masaüstü guard'lı) `createSectionPager` çağrılır. **Snap denemesi (`lenis/snap` bloğu) kaldırılır.**
- Motion library'ye dokunulmaz (bu app-shell scroll davranışı, primitive değil).

## 7. Test / doğrulama

- **TDD:** `nextTarget` saf fonksiyonu — kısa bölüm→next; uzun bölüm alt-görünmez→intra-step (clamp); uzun bölüm alt-görünür→next; üst simetri; ilk/son bölüm sınırları.
- **Feel (bağlayıcı):** lokal preview'da kullanıcıyla wheel/trackpad/klavye hissi tune edilir (debounce süresi, intra-step oranı, duration/easing) — **deploy'dan önce kullanıcı onayı şart.**
- type-check 0, mevcut 129 test kırılmaz, build 5 sayfa.
- Mobilde (dar viewport / touch) pager kurulmaz — native scroll doğrulanır.
- reduced-motion'da pager kurulmaz.

## 8. Kapsam dışı

- Mobilde touch-swipe paging (kullanıcı native istedi).
- Yatay paging, section geçiş animasyonları (fade/parallax) — yalnız scroll konumu.
- URL hash senkronu (bölüm değişince `#id` güncelleme) — opsiyonel, sonra.

## 9. Kabul kriterleri

- Masaüstünde bir wheel/klavye hareketi = bir bölüm geçişi (kısa bölümler); uzun bölümler iç-kaydırıp sonra geçer, içerik gizlenmez.
- Sağda nokta nav: aktif bölüm doğru vurgulu, tıkla→doğru bölüme kayar.
- Mobil: native scroll, pager+nav yok. reduced-motion: native scroll, pager yok.
- Header anchor linkleri çalışır; klavye ile içerik erişilebilir.
- `nextTarget` birim testleri geçer; type-check 0; mevcut 129 test kırılmaz; build başarılı.
- Kullanıcı lokal preview'da hissi onayladı → sonra PR + deploy.
