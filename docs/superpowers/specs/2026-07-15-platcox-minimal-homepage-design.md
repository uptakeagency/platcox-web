# Platcox — Minimal "Business Card" Homepage — Design

**Tarih:** 2026-07-15 (kararlar 2026-07-16'da netleşti)
**Durum:** Design — kullanıcı tüm kararları onayladı, son inceleme + plan bekliyor
**Bağlam kaynağı:** ccg 20260714-180844-60797 (codex + gemini), tarayıcı mockup V1/V2/V3 + ticker

## 1. Amaç

Mevcut 12 bölümlük kurumsal siteyi **tek ekranlık minimal kartvizit sayfasıyla** değiştirmek. Sayfa tümüyle tek bir misyon cümlesinin etrafına kurulur:

> **Organize global trade and make products accessible anywhere in the world.**

## 2. Neden bu radikal sadeleşme savunulabilir

Kritik gerçek: **trafik Cem Bey'in network'ünden — sıcak referansla — geliyor.** Ziyaretçi URL'ye gelmeden güven kurulu; soğuk B2B alıcısını ikna edecek kanıt istifi (logo duvarı, vaka çalışmaları) gereksiz. Gemini'nin "tek cümle güven katili" uyarısı yalnız soğuk trafik için geçerliydi. Çıplak kartvizit + sessiz canlılık sinyali (haber şeridi) = doğru form.

## 3. Bilinçli ayrılmalar (bu sayfa neyi bırakıyor)

Design-source yok; ayrılma **mevcut siteden** ve kullanıcı onaylı:
- 12 bölümün tamamı anasayfadan kalkıyor (arşivde korunuyor — §7).
- 61 commit'lik motion library uykuya geçiyor; **tek anlamlı kalıntı**: misyon cümlesinin açılışta bir kez belirmesi (ManifestoRise ruhu, **CSS-only** — GSAP/Lenis yüklenmez).
- Menü, hero video, testimonial carousel, WorldMap, React iletişim formu — hiçbiri yok.

## 4. Sayfa içeriği (onaylı — seçenek A + haber şeridi)

Tek ekran, dikey ortalanmış (V3 — Ultra-minimal / Stealth):
1. **Wordmark:** `platco` + yeşil `x` (küçük, üstte, ortalı).
2. **Misyon cümlesi** — `<h1>`, tek ağırlıklı öğe. Inter 300, ortalı, ~clamp(28→60px). **Tek renk**; yalnız sondaki nokta yeşil (#22C55E) — sessiz marka imzası.
3. **Tek eylem:** görünür e-posta, altı çizili `mailto:` link → **info@platcox.com** (onaylı).
4. **Haber şeridi (news ticker / chyron)** — sayfa alt kenarında sabit (§4.1).

### 4.1 Haber şeridi

- Alt kenarda tam-genişlik, ~46px sabit strip. Beyaz zemin, hairline üst çizgi.
- **Sol chyron etiketi:** yeşil nabız noktası + `İSTANBUL` (küçük, letter-spacing, konum + etiket görevini birlikte görür). Footer İstanbul buraya taşındı (onaylı).
- **Akan başlıklar:** content collection'dan; yeşil `◦` ile ayrılmış; düşük kontrast (#111 ~%52), 12.5px.
- **Tıklanır (onaylı):** her başlık ilgili makaleye (`/news/<slug>`) gider. Şerit yalnız dekor değil, içeriğe kapı.
- **Kısıt (ucuz kaçmasın):** yavaş marquee (~34s lineer, **`transform: translateX/translate3d` — asla `margin`/`left`**, yoksa titrer ve anında ucuzlar), kenarlarda fade mask, tek renk.
- **Etkileşim (masaüstü):** hover **ve** `:focus-within` marquee'yi durdurur; hover/focus'taki başlık koyulaşır + altı çizilir (tıklanabilirlik geri bildirimi); anchor'lara cömert dikey padding (12.5px küçük hedef, hitbox büyütülür); focus ring `outline:2px solid #22C55E; offset 4px`.
- **Mobil:** marquee YOK. Ya tek en güncel başlık sabit, ya `overflow-x:auto; scroll-snap` ile kaydırılır strip. (Mobilde hover yok → durdurulamaz + kaza dokunuşu + Safari alt bar / iOS home indicator çakışması.)
- **İçerik sayısı guard'ı:** **<4 başlık → animasyon YOK**, sabit ortalı gösterilir (2 başlık geniş masaüstünde "H1 ◦ H2 ◦ H1 ◦ H2" aynı anda görünüp bozuk durur); **0 başlık → şerit satırı tümden gizlenir**. Guard'lar build-time frontmatter koşulu → sıfır runtime JS korunur.
- **reduced-motion:** sabit hâl ilk başlığı TAM gösterir (kenardan kırpılmış değil). Şerit `position:fixed` DEĞİL, 100vh container içinde flex-bottom (kısa ekranda H1 ile çakışmasın).
- **İçerik derinliği:** şu an havuzda 2 gerçek başlık var (`~/Projects/platcox-web/src/content/news/`, Türkçe). Kullanıcı **ayrıca haber/makale ekleyecek** — altyapı content collection'dan beslendiği için yeni `.md` eklemek yeterli, kod değişmez. **Launch'ta 2 başlık → guard devrede (sabit gösterim); ~4+ başlıkta animasyon açılır.**

## 5. Görsel spec (V3 + şerit)

- **Zemin** beyaz #FFFFFF · **metin** #111 · **aksan** yeşil #22C55E (yalnız `x`, bitiş noktası, şerit nabzı/ayraç).
- **Font:** Inter 200–600 — **prod'da self-host** (gizlilik + dış istek + font-render failure elenir). Fallback `system-ui`.
- **Kompozisyon:** flex dikey+yatay ortalı, `gap: clamp(30px,5vh,56px)`; şerit alt-sabit, merkez içeriğe `padding-bottom` ile çarpışmaz.
- **Motion:** (a) açılış rise (opacity+translateY ~1s), (b) şerit marquee. İkisi de CSS-only, `prefers-reduced-motion`'da kapanır. Scroll/sürekli JS animasyon yok.
- **Responsive:** clamp tipografi, yatay taşma yok, dokunma hedefi ≥44px, 200–400% zoom okunur.

## 6. Teknik mimari

- **Homepage:** `src/layouts/BusinessCardLayout.astro` (sıfır-runtime) + `src/pages/index.astro` yeniden yazılır; hiç `client:*` island yok → sıfır uygulama-JS. Mevcut `src/layouts/BaseLayout.astro` KULLANILMAZ (koşulsuz Lenis + page-wide motion observer enjekte ediyor).
- **Şerit:** build-time `getCollection('news')` ile statik HTML; CSS marquee. JS yok.
- **Makale sayfaları:** `src/pages/news/[slug].astro` + minimal `NewsArticleLayout.astro` (motion yok, header nav yok, "← Platcox" ana sayfaya dönüş, kendi SEO meta'sı). Mevcut 2 `.md` korunur, extensible.
- **Site şekli:** 1 anasayfa + N minik makale sayfası (harfiyen tek-route DEĞİL; Codex'in "düşük SEO riski" yolu — news URL'leri yaşar).
- **İletişim:** düz `mailto:` + görünür e-posta. `src/components/ContactForm.tsx` KULLANILMAZ.
- **Logo:** Astro `<Image>`, explicit boyut.
- **Bundle temizliği:** kullanılmayan videolar (`public/videos/*` ~15MB) + hero poster minimal branch'ten çıkar; global Tailwind stylesheet import edilmez (scoped CSS), rafa kalkan bileşenler utility üretmesin.

## 7. Koruma / arşiv (hiçbir şey kaybolmaz) — bağlayıcı

Değişiklikten ÖNCE:
- **Yeni branch main'den:** `feat/minimal-homepage` (`origin/main`'den). **Doğrulandı (2026-07-16):** minimal anasayfanın ihtiyacı olan her şey main'de ve motion tip ile birebir aynı → `src/content/news/*.md` (2 haber), `src/content.config.ts`, `src/assets/platcox-logo.png`, `tailwind.config.ts`, `astro.config.mjs`. Cherry-pick GEREKMEZ; main'den branch hiçbir şey kaybettirmez. Anasayfa PR #2'nin motion branch'inde DEĞİŞTİRİLMEZ (61-commit'lik "motion library" PR'ı incoherent olur, rollback sınırı bozulur). PR #2 draft/dokunulmadan kalır.
- **Arşiv tag:** `archive/motion-homepage-2026-07-16` → `d41e579` (tracked içerik).
- **Untracked arşivi:** tag tracked-only korur → `src/pages/poster.astro` + iki redesign design doc'u ayrı arşiv branch'ine explicit commit'lenir (`git add .` YASAK).
- **Bu design doc + gelecek plan** ilk execution adımında yeni branch'e kopyalanıp orada commit'lenir (motion branch kirletilmez).

## 8. SEO / a11y minimumu

**Homepage:** tek `<h1>` = misyon · descriptive `<title>` · unique meta description · absolute canonical (`https://www.platcox.com`) · OG + Twitter card · `Organization` + `WebSite` JSON-LD · `<html lang="en">` · semantic `<main>` · görünür focus + kontrast · logo alt + explicit boyut.
**Makale sayfaları:** kendi title/description/canonical/OG'si; article JSON-LD opsiyonel.
**Şerit a11y:** hareket eden metin WCAG 2.2.2 (pause/stop/hide) gerektirir → hover **+ `:focus-within`** durdurur, `prefers-reduced-motion`'da sabit (ilk başlık tam), **mobilde marquee yok** (statik). Klavye: başlıklara tab ile erişilir, focus'ta hem durur hem focus ring görünür. Şeride erişilebilir etiket (`aria-label`).

## 9. Bu değişikliğin doğrudan tetiklediği düzeltmeler (correctness — in-scope)

- **nginx soft-404:** `nginx/nginx.conf` `try_files $uri $uri/ /index.html;` → kaldırılan route'lar 200'le anasayfa sunuyor. `=404` + `404.astro`. (Route sildiğimiz için bu işin sonucu.)
- **`public/llms.txt`:** eski konumlandırma/çözümleri yayınlıyor → yeni gerçeğe güncellenir.
- **`.dockerignore` + `.gitignore`:** `.worktrees/` (~48MB) eklenir (Docker `COPY . .` context'ine giriyor).
- **`motion-playground.astro` + `poster.astro`:** minimal branch'te üretilmez (poster sitemap'e giriyor).
- **JSON-LD:** logo 32×32 favicon yerine ≥112×112 crawlable logo; artık doğru olmayan `LocalBusiness`/telefon/kişisel-LinkedIn `sameAs` temizlenir.

## 10. Kapsam dışı (ayrı iş)

- Astro 6→7 / Tailwind 3→4 migration (bu PR'a KATILMAZ — failure surface genişletir).
- Gerçek form backend (Formspree/endpoint) — mailto yeterli; gerekirse sonra.
- Ek haber/makale içeriği — kullanıcı ayrıca ekleyecek; altyapı hazır, bloklamaz.

## 11. Kabul kriterleri

- `dist/index.html` içinde `astro-island`, uygulama modül script'i, Lenis, GSAP, Framer, video referansı YOK (şerit + rise CSS-only).
- Sitemap yalnız kasıtlı public URL'leri içerir (anasayfa + `/news/*`); `/poster/` ve `/motion-playground/` yok.
- Misyon metni CSS kapalıyken okunur; CTA klavye + mobil + 200–400% zoom çalışır; görünür e-posta fallback var.
- Şerit: hover **+ focus-within**'de durur; `prefers-reduced-motion`'da sabit (ilk başlık tam); **mobilde animasyonsuz**; **<4 başlıkta sabit, 0 başlıkta gizli**; başlığa klavye ile focus edilebilir + focus'ta durur + focus ring; başlıklar makaleye gider.
- Dockerize `/` → 200; kaldırılan route → 404/410/301 (anasayfa-200 değil); `/news/<slug>` → 200.
- `bun run type-check` 0 hata; `bun test` geçer; `bun run build` başarılı.
- Rollback: arşiv tag/branch yeniden deploy edilerek belgeli.
