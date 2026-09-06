# İletişim formu: gerçek gönderim (Pages Function + Resend + Turnstile)

**Spec (özet, bu plan spec'in kendisidir):** platcox.com'daki iletişim formu şu an `mailto:` bağlantısı üretip ziyaretçinin posta uygulamasını açıyor (2026-07-15 spec'inde bilinçli MVP kesintisi). Hedef: form doğrudan gönderir; ziyaretçi ekranda "gönderildi" onayı görür, hiçbir uygulama açılmaz; mesaj `CONTACT_TO` adresine e-posta olarak düşer, yanıtlanınca ziyaretçiye gider (Reply-To). Robot koruması Cloudflare Turnstile + görünmez bal küpü alanı.

**Mimari:** Site statik Astro, Cloudflare Pages'te Git'e bağlı (main = canlı). Sunucu ucu Pages Function olarak `functions/api/contact.ts` (repo kökü; Pages build'de otomatik derlenir, Astro çıktı modu değişmez). E-posta Resend REST API ile (SDK yok, `fetch`). Turnstile sunucu doğrulaması `siteverify`.

## Global Constraints

- **Gizli değer yok, fallback yok.** Kodda hiçbir anahtar/e-posta sabiti yok. Env değişkenleri: `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `CONTACT_TO`, `CONTACT_FROM` (sunucu; Pages projesinde tanımlı), `PUBLIC_TURNSTILE_SITE_KEY` (istemci, public; build-time). Eksik sunucu değişkeni → handler başında **değişkenin ADINI** söyleyen `Error` fırlatılır (değeri değil), `process.env.X || "default"` YASAK.
- **Dış çağrılar enjekte edilebilir:** handler `fetchImpl: typeof fetch = fetch` parametresi alır; testler gerçek ağa çıkmaz.
- **Kullanıcıya görünür tüm metin İngilizce** (`src/lib/__tests__/siteLanguage.test.ts` nöbetçisi; `src/components/**` ve `src/pages/**` altında yorum dışı satırlarda Türkçe karakter ihlaldir). Yeni görünür metinde **em dash (—) kullanma**.
- **Kod yorumları Türkçe, kısa.** İsimler açıklayıcı, docstring yok.
- **Yeni bağımlılık ekleme.** `functions/` klasöründe yalnızca Web API tipleri (`Request`, `Response`, `FormData`, `fetch`; Astro tsconfig `lib: dom` sağlar). `@cloudflare/workers-types` EKLENMEZ; `PagesFunction` tipi yerine yerel `{ request: Request; env: Env }` tipi.
- **Dokunma:** `Dockerfile`, `.dockerignore`, `nginx/`, `docs/`, diğer bileşenler, `src/lib/__tests__/siteLanguage.test.ts`.
- **Doğrulama kapısı (her task):** `bun test` (tüm suite; şu an 146 test, hepsi geçmeli + yeni testler), `bun run type-check` (0 hata). Task 2 ayrıca `PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA bun run build` (Cloudflare'in resmi test site anahtarı; her zaman geçer).
- **Commit:** Türkçe, conventional (`feat(contact): ...`), sonunda `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`. Push YOK, PR YOK (kontrolör yapar).

## Task 1: Sunucu ucu `functions/api/contact.ts` (TDD)

**Dosyalar:** `functions/api/contact.ts` (yeni), `functions/api/__tests__/contact.test.ts` (yeni). `bun test` kök dizindeki tüm `*.test.ts` dosyalarını bulur; `bunfig.toml` preload'u (jsdom) zararsızdır.

**Sözleşme:**

```ts
export type ContactEnv = {
  TURNSTILE_SECRET_KEY: string;
  RESEND_API_KEY: string;
  CONTACT_TO: string;
  CONTACT_FROM: string;
};

export const LIMITS = { name: 100, email: 200, message: 1500 } as const;
export const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
export const RESEND_EMAILS_URL = "https://api.resend.com/emails";

// Saf handler; test edilen şey bu.
export async function handleContact(
  request: Request,
  env: ContactEnv,
  fetchImpl: typeof fetch = fetch,
): Promise<Response>;

// Pages Function girişi (yalnızca POST). GET vb. export edilmez; Pages statik varlığa düşer (404).
export const onRequestPost = ({ request, env }: { request: Request; env: ContactEnv }) =>
  handleContact(request, env);
```

**Davranış (sırayla):**

1. Env kontrolü: dört anahtardan biri boş/`undefined` ise `throw new Error(\`Missing environment variable: ${name}\`)` (ilk eksik olan). Bu, isteğe bakmadan önce yapılır.
2. Gövde `await request.formData()` ile okunur; okunamazsa (JSON/boş gövde gibi) → **400** `{ ok: false, error: "invalid" }`.
3. Alanlar: `name`, `email`, `message`, `company` (bal küpü), `cf-turnstile-response`. String değilse boş sayılır; `name`/`email`/`message` `.trim()` edilir.
4. **Bal küpü:** `company` boş değilse → **200** `{ ok: true }` ve HİÇBİR dış çağrı yapılmaz (bot "başarılı" sanır).
5. Doğrulama; ihlalde **400** `{ ok: false, error: "invalid" }`, dış çağrı yok:
   - `name`: 1..LIMITS.name karakter
   - `email`: 1..LIMITS.email karakter ve `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` ile eşleşir
   - `message`: 1..LIMITS.message karakter
6. **Turnstile:** `fetchImpl(TURNSTILE_VERIFY_URL, { method: "POST", body })` — `body` bir `URLSearchParams`: `secret=env.TURNSTILE_SECRET_KEY`, `response=<cf-turnstile-response>`, ve istekte `CF-Connecting-IP` başlığı varsa `remoteip=<o değer>`. Yanıt JSON `{ success: boolean }`; `success !== true` ise (ya da yanıt `ok` değilse / JSON bozuksa) → **400** `{ ok: false, error: "verification" }`; Resend çağrılmaz. Token boşsa siteverify'a gitmeden aynı 400.
7. **Resend:** `fetchImpl(RESEND_EMAILS_URL, { method: "POST", headers: { Authorization: \`Bearer ${env.RESEND_API_KEY}\`, "Content-Type": "application/json" }, body: JSON.stringify({ from: env.CONTACT_FROM, to: [env.CONTACT_TO], reply_to: email, subject: \`Website inquiry from ${name}\`, text: \`Name: ${name}\nEmail: ${email}\n\n${message}\` }) })`. `html` alanı YOK (düz metin; HTML enjeksiyonu yok). Yanıt `ok` değilse → **502** `{ ok: false, error: "send" }`.
8. Başarı → **200** `{ ok: true }`.
9. Tüm yanıtlar `Content-Type: application/json; charset=utf-8` ve `Cache-Control: no-store`.

**Testler (önce yazılır, kırmızı görülür, sonra en küçük implementasyon):** Yardımcı: `makeRequest(fields: Record<string,string>, headers?)` → `new Request("https://platcox.com/api/contact", { method: "POST", body: FormData, headers })`; `fakeFetch` → URL'ye göre yanıt döndüren ve çağrıları kaydeden fonksiyon (`calls: { url, init }[]`). Geçerli env: dört alan da dolu sahte değerler.

1. Eksik env: dört değişkenin her biri için ayrı ayrı eksik bırakıldığında `handleContact` **reject** eder ve hata mesajı o değişkenin adını içerir; `fakeFetch` hiç çağrılmaz.
2. JSON gövdeli istek (`body: JSON.stringify({...})`, `Content-Type: application/json`) → 400 `invalid`, fetch çağrılmaz.
3. Alan sınırları: `name` 101 karakter → 400; `email` `"not-an-email"` → 400; `message` 1501 karakter → 400; her birinde fetch çağrılmaz. Sınır içi (tam 100 / tam 1500) kabul edilir (happy path ile).
4. Bal küpü: `company: "Acme"` (diğer alanlar geçerli) → 200 `{ ok: true }`, fetch çağrılmaz.
5. Token boş → 400 `verification`, fetch çağrılmaz.
6. Turnstile `{ success: false }` → 400 `verification`; siteverify çağrısında gövde `URLSearchParams` olarak `secret`, `response` ve (istek `CF-Connecting-IP: 203.0.113.7` taşıyorsa) `remoteip=203.0.113.7` içerir; Resend çağrılmaz.
7. Turnstile `{ success: true }`, Resend `403` → 502 `send`.
8. Happy path → 200 `{ ok: true }`; Resend çağrısında `Authorization` başlığı `Bearer <RESEND_API_KEY>`, JSON gövdede `from`, `to` (dizi), `reply_to` = form e-postası, `subject` = `Website inquiry from <name>`, `text` ad/e-posta/mesajı içerir, `html` alanı YOK.
9. Yanıt başlıkları: 200 ve 400 yanıtlarında `Content-Type` `application/json` ile başlar ve `Cache-Control: no-store`.

**Kabul:** `bun test functions` yeşil; `bun test` tüm suite yeşil (146 + yeni); `bun run type-check` 0 hata. Rapor: komut çıktıları olduğu gibi.

## Task 2: İstemci formu, Astro env şeması, bölüm bağlantısı (TDD)

**Dosyalar:** `src/components/ContactForm.tsx` (yeniden yazılır), `src/components/__tests__/ContactForm.test.tsx` (güncellenir), `src/components/ContactSection.astro` (prop geçişi), `astro.config.mjs` (env şeması), `.env.example` (yeni).

**astro.config.mjs:** `import { defineConfig, envField } from "astro/config";` ve `defineConfig({...})` içine:
```js
env: {
  schema: {
    // Turnstile site anahtarı public'tir; build'de gömülür. Eksikse build düşer (fallback yok).
    PUBLIC_TURNSTILE_SITE_KEY: envField.string({ context: "client", access: "public" }),
  },
},
```

**.env.example:**
```
# Cloudflare Turnstile site anahtarı (public). Lokal build için resmi test anahtarı:
PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
```

**ContactSection.astro:** frontmatter'a `import { PUBLIC_TURNSTILE_SITE_KEY } from "astro:env/client";` ve `<ContactForm client:visible turnstileSiteKey={PUBLIC_TURNSTILE_SITE_KEY} />`. Başka değişiklik yok (mailto bağlantısı olan adres bloğu KALIR; o bir bağlantı, form değil).

**ContactForm.tsx sözleşmesi:**
- `export default function ContactForm({ turnstileSiteKey }: { turnstileSiteKey: string })`.
- `export const CONTACT_ENDPOINT = "/api/contact";` ve `export const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";`
- Durum: `"idle" | "sending" | "sent" | "error"`.
- `useEffect` (mount): `document.querySelector(\`script[src="${TURNSTILE_SCRIPT_SRC}"]\`)` yoksa `<script async defer src=...>` ekler (iki bileşen/yeniden render → tek script).
- Form alanları mevcut stil sınıflarıyla (`inputClass`, `border-b`, `bg-transparent`; gönder düğmesi `bg-foreground text-bg`, `bg-accent` YOK) aynen: `name` (required, maxLength 100, placeholder "Name"), `email` (type email, required, maxLength 200, placeholder "Email"), `message` (textarea, required, maxLength 1500, rows 4, placeholder "Message").
- **Bal küpü:** `<input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />` (required DEĞİL, label yok).
- **Turnstile kutusu:** form içinde `<div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-theme="light" />` (implicit rendering; Turnstile bu kutuyu form içinde `cf-turnstile-response` gizli alanıyla doldurur).
- **Gönderim:** `onSubmit` → `preventDefault`; durum `sending`; `fetch(CONTACT_ENDPOINT, { method: "POST", body: new FormData(form) })`; `res.ok` ve JSON `ok: true` → `sent`; aksi halde (`ok` değil, JSON bozuk, ağ hatası) → `error` ve varsa `window.turnstile?.reset?.()` çağrılır (tip: `declare global { interface Window { turnstile?: { reset?: () => void } } }`).
- `window.location.href` ATANMAZ; `mailto` kelimesi dosyada geçmez.
- **Görünüm:** `sending` iken düğme `disabled` ve metni "Sending..."; `idle`/`error`'da "Send Message". `sent` durumunda form yerine `<p role="status">Thanks, your message has been sent. We will get back to you shortly.</p>` (form DOM'dan kalkar). `error` durumunda formun altında `<p role="alert" className="text-sm text-red-600">Something went wrong. Please try again or email us directly.</p>` ve form kalır (girilen değerler korunur).

**Testler (`ContactForm.test.tsx`; `render(<ContactForm turnstileSiteKey="test-key" />)`; `fireEvent` + `waitFor` from `@testing-library/react`; `globalThis.fetch` her testte `mock(...)` ile değiştirilir, `afterEach` ile eski değer geri konur):**
- Mevcut 6 test korunur (prop eklenerek).
- Turnstile kutusu: `document.querySelector(".cf-turnstile")?.getAttribute("data-sitekey") === "test-key"`; iki kez render sonrası `document.querySelectorAll(\`script[src="${TURNSTILE_SCRIPT_SRC}"]\`).length === 1`.
- Bal küpü: `name="company"` alanı var, `required` değil, `tabIndex === -1`, `aria-hidden="true"`.
- Gönderim: alanlar doldurulup form `submit` edilince `fetch` tam bir kez, `CONTACT_ENDPOINT` ve `method: "POST"` ile, `body instanceof FormData` ve `body.get("name") === "Ada"` (vb.) ile çağrılır.
- Başarı: fetch `{ ok: true, json: async () => ({ ok: true }) }` döndürünce `role="status"` metni görünür ve `placeholder="Name"` alanı DOM'da yok.
- Hata (HTTP): fetch `{ ok: false, json: async () => ({ ok: false, error: "verification" }) }` → `role="alert"` görünür, form kalır, `window.turnstile.reset` (testte mock) bir kez çağrılmış.
- Hata (ağ): fetch reject → `role="alert"` görünür.
- Gönderim sırasında düğme `disabled` ve metni "Sending..." (fetch'i çözülmeyen promise ile bekleterek).
- `window.location.href` gönderim sonrası değişmemiş (mailto yok).

**Kabul:** `bun test` tüm suite yeşil (dil nöbetçisi dahil), `bun run type-check` 0 hata, `PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA bun run build` başarılı ve `dist/index.html` içinde `cf-turnstile` ile `1x00000000000000000000AA` geçer, `mailto:cem@platcox.com` yalnızca adres bloğunda (1 kez) geçer. Rapor: komut çıktıları olduğu gibi.
