// Cloudflare Pages Function: iletişim formu uç noktası (yalnızca POST).

export type ContactEnv = {
  TURNSTILE_SECRET_KEY: string;
  RESEND_API_KEY: string;
  CONTACT_TO: string;
  CONTACT_FROM: string;
};

// Dış çağrılar yalnızca buradan geçer; test'te sahte fetch enjekte edilir.
export type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export const LIMITS = { name: 100, email: 200, message: 1500 } as const;
export const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
export const RESEND_EMAILS_URL = "https://api.resend.com/emails";

const REQUIRED_ENV_KEYS: ReadonlyArray<keyof ContactEnv> = [
  "TURNSTILE_SECRET_KEY",
  "RESEND_API_KEY",
  "CONTACT_TO",
  "CONTACT_FROM",
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function jsonResponse(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

// Eksik değişkenin ADI hataya girer, değeri asla.
function assertEnv(env: ContactEnv): void {
  for (const key of REQUIRED_ENV_KEYS) {
    if (!env[key]) throw new Error(`Missing environment variable: ${key}`);
  }
}

function fieldValue(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}

function isValidSubmission(name: string, email: string, message: string): boolean {
  return (
    name.length >= 1 &&
    name.length <= LIMITS.name &&
    email.length >= 1 &&
    email.length <= LIMITS.email &&
    EMAIL_PATTERN.test(email) &&
    message.length >= 1 &&
    message.length <= LIMITS.message
  );
}

// Tamamlanamayan çağrı (DNS, bağlantı, timeout) doğrulanmış çağrı değildir.
async function isTurnstileVerified(
  fetchImpl: FetchLike,
  body: URLSearchParams,
): Promise<boolean> {
  try {
    const response = await fetchImpl(TURNSTILE_VERIFY_URL, { method: "POST", body });
    if (!response.ok) {
      console.error(`Turnstile siteverify request failed: ${response.status}`);
      return false;
    }
    const result = (await response.json()) as { success?: unknown; "error-codes"?: unknown };
    if (result.success !== true) {
      if (result["error-codes"]) {
        console.error("Turnstile verification failed", result["error-codes"]);
      }
      return false;
    }
    return true;
  } catch (err) {
    console.error(`Turnstile siteverify error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

// Ağ hatası da "gönderilemedi" sayılır; JSON sözleşmesi 502'de kalır.
async function isDelivered(fetchImpl: FetchLike, init: RequestInit): Promise<boolean> {
  try {
    const response = await fetchImpl(RESEND_EMAILS_URL, init);
    if (!response.ok) {
      const bodyText = (await response.text()).slice(0, 500);
      console.error(`Resend delivery failed: ${response.status} ${bodyText}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`Resend delivery error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export async function handleContact(
  request: Request,
  env: ContactEnv,
  fetchImpl: FetchLike = fetch,
): Promise<Response> {
  assertEnv(env);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonResponse(400, { ok: false, error: "invalid" });
  }

  const name = fieldValue(form, "name").trim();
  const email = fieldValue(form, "email").trim();
  const message = fieldValue(form, "message").trim();
  const contactRef = fieldValue(form, "contact_ref");
  const token = fieldValue(form, "cf-turnstile-response");

  // Bal küpü dolduysa bot'a başarı göster, hiçbir dış çağrı yapma.
  if (contactRef !== "") return jsonResponse(200, { ok: true });

  if (!isValidSubmission(name, email, message)) {
    return jsonResponse(400, { ok: false, error: "invalid" });
  }

  if (token === "") return jsonResponse(400, { ok: false, error: "verification" });

  const verifyBody = new URLSearchParams({
    secret: env.TURNSTILE_SECRET_KEY,
    response: token,
  });
  const clientIp = request.headers.get("CF-Connecting-IP");
  if (clientIp) verifyBody.set("remoteip", clientIp);

  if (!(await isTurnstileVerified(fetchImpl, verifyBody))) {
    return jsonResponse(400, { ok: false, error: "verification" });
  }

  // Konu satırında CR/LF header enjeksiyonuna kapı bırakmamak için ad tek satıra sıkıştırılır.
  const subjectName = name.replace(/\s+/g, " ");

  // Yalnızca düz metin gönderilir; HTML enjeksiyonu yüzeyi yok.
  const delivered = await isDelivered(fetchImpl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.CONTACT_FROM,
      to: [env.CONTACT_TO],
      reply_to: email,
      subject: `Website inquiry from ${subjectName}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    }),
  });

  if (!delivered) return jsonResponse(502, { ok: false, error: "send" });

  return jsonResponse(200, { ok: true });
}

export const onRequestPost = ({ request, env }: { request: Request; env: ContactEnv }) =>
  handleContact(request, env);
