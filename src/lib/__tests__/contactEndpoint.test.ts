import { describe, it, expect, spyOn } from "bun:test";
import {
  handleContact,
  onRequestPost,
  LIMITS,
  RESEND_EMAILS_URL,
  TURNSTILE_VERIFY_URL,
  type ContactEnv,
  type FetchLike,
} from "../../../functions/api/contact";

const ENDPOINT = "https://platcox.com/api/contact";

const ENV_KEYS = [
  "TURNSTILE_SECRET_KEY",
  "RESEND_API_KEY",
  "CONTACT_TO",
  "CONTACT_FROM",
] as const;

function validEnv(): ContactEnv {
  return {
    TURNSTILE_SECRET_KEY: "test-turnstile-secret",
    RESEND_API_KEY: "test-resend-key",
    CONTACT_TO: "inbox@example.test",
    CONTACT_FROM: "site@example.test",
  };
}

// Tek anahtarı boş/undefined bırakılmış env üretir.
function envMissing(key: keyof ContactEnv, value: string | undefined): ContactEnv {
  const env: Record<string, string | undefined> = { ...validEnv() };
  env[key] = value;
  return env as ContactEnv;
}

// contact_ref: gerçek tarayıcının her zaman gönderdiği (boş) bal küpü değeri; "yok" senaryosu değil.
const validFields: Record<string, string> = {
  name: "Ada Lovelace",
  email: "ada@example.test",
  message: "We would like to discuss a project.",
  contact_ref: "",
  "cf-turnstile-response": "turnstile-token",
};

function makeRequest(
  fields: Record<string, string>,
  headers?: Record<string, string>,
): Request {
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) body.append(key, value);
  return new Request(ENDPOINT, { method: "POST", body, headers });
}

function makeJsonRequest(): Request {
  return new Request(ENDPOINT, {
    method: "POST",
    body: JSON.stringify(validFields),
    headers: { "Content-Type": "application/json" },
  });
}

type FetchCall = { url: string; init: RequestInit | undefined };

// Ağa çıkmayan sahte fetch; çağrıları kaydeder, URL'ye göre yanıt döndürür.
function createFakeFetch(routes: Record<string, () => Response> = {}) {
  const calls: FetchCall[] = [];
  const fetchImpl: FetchLike = async (input, init) => {
    const url =
      typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    calls.push({ url, init });
    const route = routes[url];
    if (!route) throw new Error(`Unexpected fetch call: ${url}`);
    return route();
  };
  return { fetchImpl, calls };
}

const turnstileSuccess = () => new Response(JSON.stringify({ success: true }), { status: 200 });
const turnstileFailure = () =>
  new Response(JSON.stringify({ success: false, "error-codes": ["invalid-input-response"] }), {
    status: 200,
  });
const resendAccepted = () => new Response(JSON.stringify({ id: "sent-id" }), { status: 200 });

// Ağ seviyesinde başarısız çağrı: fetch hiç yanıt üretmeden reject eder.
const networkFailure = (): Response => {
  throw new TypeError("network request failed");
};

function happyRoutes(): Record<string, () => Response> {
  return { [TURNSTILE_VERIFY_URL]: turnstileSuccess, [RESEND_EMAILS_URL]: resendAccepted };
}

function callBody(call: FetchCall | undefined): unknown {
  return call?.init?.body;
}

describe("handleContact env guard", () => {
  for (const key of ENV_KEYS) {
    it(`rejects with the variable name when ${key} is missing`, async () => {
      for (const value of [undefined, ""]) {
        const { fetchImpl, calls } = createFakeFetch(happyRoutes());
        await expect(
          handleContact(makeRequest(validFields), envMissing(key, value), fetchImpl),
        ).rejects.toThrow(key);
        expect(calls).toHaveLength(0);
      }
    });
  }
});

describe("handleContact body parsing", () => {
  it("returns 400 invalid for a JSON body and makes no external call", async () => {
    const { fetchImpl, calls } = createFakeFetch(happyRoutes());

    const response = await handleContact(makeJsonRequest(), validEnv(), fetchImpl);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false, error: "invalid" });
    expect(calls).toHaveLength(0);
  });
});

describe("handleContact field validation", () => {
  const cases: Array<{ label: string; fields: Record<string, string> }> = [
    {
      label: "name longer than the limit",
      fields: { ...validFields, name: "a".repeat(LIMITS.name + 1) },
    },
    { label: "malformed email", fields: { ...validFields, email: "not-an-email" } },
    {
      label: "message longer than the limit",
      fields: { ...validFields, message: "m".repeat(LIMITS.message + 1) },
    },
    { label: "blank name", fields: { ...validFields, name: "   " } },
    { label: "empty message", fields: { ...validFields, message: "" } },
  ];

  for (const { label, fields } of cases) {
    it(`returns 400 invalid for ${label} without any external call`, async () => {
      const { fetchImpl, calls } = createFakeFetch(happyRoutes());

      const response = await handleContact(makeRequest(fields), validEnv(), fetchImpl);

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ ok: false, error: "invalid" });
      expect(calls).toHaveLength(0);
    });
  }

  it("accepts values exactly at the name and message limits", async () => {
    const { fetchImpl, calls } = createFakeFetch(happyRoutes());
    const fields = {
      ...validFields,
      name: "a".repeat(LIMITS.name),
      message: "m".repeat(LIMITS.message),
    };

    const response = await handleContact(makeRequest(fields), validEnv(), fetchImpl);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(calls.map((call) => call.url)).toEqual([TURNSTILE_VERIFY_URL, RESEND_EMAILS_URL]);
  });
});

describe("handleContact honeypot", () => {
  it("returns 200 ok and makes no external call when contact_ref is filled", async () => {
    const { fetchImpl, calls } = createFakeFetch(happyRoutes());

    const response = await handleContact(
      makeRequest({ ...validFields, contact_ref: "Acme" }),
      validEnv(),
      fetchImpl,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(calls).toHaveLength(0);
  });

  it("treats a whitespace-only contact_ref as filled and makes no external call", async () => {
    const { fetchImpl, calls } = createFakeFetch(happyRoutes());

    const response = await handleContact(
      makeRequest({ ...validFields, contact_ref: "   " }),
      validEnv(),
      fetchImpl,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(calls).toHaveLength(0);
  });

  it("treats an empty contact_ref (the shape a real browser sends) as not a bot and reaches Turnstile and Resend", async () => {
    const { fetchImpl, calls } = createFakeFetch(happyRoutes());

    const response = await handleContact(
      makeRequest({ ...validFields, contact_ref: "" }),
      validEnv(),
      fetchImpl,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(calls.map((call) => call.url)).toEqual([TURNSTILE_VERIFY_URL, RESEND_EMAILS_URL]);
  });
});

describe("handleContact turnstile verification", () => {
  it("returns 400 verification for an empty token without calling siteverify or logging", async () => {
    const consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});
    const { fetchImpl, calls } = createFakeFetch(happyRoutes());

    const response = await handleContact(
      makeRequest({ ...validFields, "cf-turnstile-response": "" }),
      validEnv(),
      fetchImpl,
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false, error: "verification" });
    expect(calls).toHaveLength(0);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it("returns 400 verification when siteverify reports failure, logs the error codes, and never calls Resend", async () => {
    const consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});
    const { fetchImpl, calls } = createFakeFetch({
      [TURNSTILE_VERIFY_URL]: turnstileFailure,
      [RESEND_EMAILS_URL]: resendAccepted,
    });
    const env = validEnv();

    const response = await handleContact(
      makeRequest(validFields, { "CF-Connecting-IP": "203.0.113.7" }),
      env,
      fetchImpl,
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false, error: "verification" });
    expect(calls.map((call) => call.url)).toEqual([TURNSTILE_VERIFY_URL]);

    const body = callBody(calls[0]);
    expect(body).toBeInstanceOf(URLSearchParams);
    const params = body as URLSearchParams;
    expect(calls[0]?.init?.method).toBe("POST");
    expect(params.get("secret")).toBe(env.TURNSTILE_SECRET_KEY);
    expect(params.get("response")).toBe(validFields["cf-turnstile-response"] as string);
    expect(params.get("remoteip")).toBe("203.0.113.7");

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    const loggedArgs = consoleErrorSpy.mock.calls[0]?.map((arg) => JSON.stringify(arg)).join(" ");
    expect(loggedArgs).toContain("invalid-input-response");
    consoleErrorSpy.mockRestore();
  });

  it("returns 400 verification and logs the status when siteverify responds with a non-ok status", async () => {
    const consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});
    const { fetchImpl, calls } = createFakeFetch({
      [TURNSTILE_VERIFY_URL]: () => new Response("", { status: 500 }),
      [RESEND_EMAILS_URL]: resendAccepted,
    });

    const response = await handleContact(makeRequest(validFields), validEnv(), fetchImpl);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false, error: "verification" });
    expect(calls.map((call) => call.url)).toEqual([TURNSTILE_VERIFY_URL]);

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(String(consoleErrorSpy.mock.calls[0]?.[0])).toContain("500");
    consoleErrorSpy.mockRestore();
  });

  it("returns 400 verification and logs an error when siteverify returns malformed JSON", async () => {
    const consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});
    const { fetchImpl, calls } = createFakeFetch({
      [TURNSTILE_VERIFY_URL]: () => new Response("not json", { status: 200 }),
      [RESEND_EMAILS_URL]: resendAccepted,
    });

    const response = await handleContact(makeRequest(validFields), validEnv(), fetchImpl);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false, error: "verification" });
    expect(calls.map((call) => call.url)).toEqual([TURNSTILE_VERIFY_URL]);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    consoleErrorSpy.mockRestore();
  });

  it("returns 400 verification and logs the network error when the siteverify request fails at the network level", async () => {
    const consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});
    const { fetchImpl, calls } = createFakeFetch({
      [TURNSTILE_VERIFY_URL]: networkFailure,
      [RESEND_EMAILS_URL]: resendAccepted,
    });

    const response = await handleContact(makeRequest(validFields), validEnv(), fetchImpl);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false, error: "verification" });
    expect(calls.map((call) => call.url)).toEqual([TURNSTILE_VERIFY_URL]);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(String(consoleErrorSpy.mock.calls[0]?.[0])).toContain("network request failed");
    consoleErrorSpy.mockRestore();
  });
});

describe("handleContact delivery", () => {
  it("returns 502 send and logs the status and truncated body when Resend rejects the message", async () => {
    const consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});
    const { fetchImpl, calls } = createFakeFetch({
      [TURNSTILE_VERIFY_URL]: turnstileSuccess,
      [RESEND_EMAILS_URL]: () => new Response("forbidden sender domain", { status: 403 }),
    });

    const response = await handleContact(makeRequest(validFields), validEnv(), fetchImpl);

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ ok: false, error: "send" });
    expect(calls.map((call) => call.url)).toEqual([TURNSTILE_VERIFY_URL, RESEND_EMAILS_URL]);

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    const logged = String(consoleErrorSpy.mock.calls[0]?.[0]);
    expect(logged).toContain("403");
    expect(logged).toContain("forbidden sender domain");
    consoleErrorSpy.mockRestore();
  });

  it("truncates a long Resend error body to 500 characters in the log", async () => {
    const consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});
    const longBody = "x".repeat(600);
    const { fetchImpl } = createFakeFetch({
      [TURNSTILE_VERIFY_URL]: turnstileSuccess,
      [RESEND_EMAILS_URL]: () => new Response(longBody, { status: 500 }),
    });

    await handleContact(makeRequest(validFields), validEnv(), fetchImpl);

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    const logged = String(consoleErrorSpy.mock.calls[0]?.[0]);
    expect(logged).not.toContain("x".repeat(501));
    consoleErrorSpy.mockRestore();
  });

  it("returns 502 send and logs the network error when the Resend request fails at the network level", async () => {
    const consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});
    const { fetchImpl, calls } = createFakeFetch({
      [TURNSTILE_VERIFY_URL]: turnstileSuccess,
      [RESEND_EMAILS_URL]: networkFailure,
    });

    const response = await handleContact(makeRequest(validFields), validEnv(), fetchImpl);

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ ok: false, error: "send" });
    expect(calls.map((call) => call.url)).toEqual([TURNSTILE_VERIFY_URL, RESEND_EMAILS_URL]);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(String(consoleErrorSpy.mock.calls[0]?.[0])).toContain("network request failed");
    consoleErrorSpy.mockRestore();
  });

  it("never logs the Authorization header, the Resend key, or the request body on failure", async () => {
    const consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});
    const env = validEnv();
    const { fetchImpl } = createFakeFetch({
      [TURNSTILE_VERIFY_URL]: turnstileSuccess,
      [RESEND_EMAILS_URL]: () => new Response("nope", { status: 403 }),
    });

    await handleContact(makeRequest(validFields), env, fetchImpl);

    const loggedText = consoleErrorSpy.mock.calls.flat().map(String).join(" ");
    expect(loggedText).not.toContain(env.RESEND_API_KEY);
    expect(loggedText).not.toContain(env.TURNSTILE_SECRET_KEY);
    expect(loggedText).not.toContain("Bearer");
    consoleErrorSpy.mockRestore();
  });

  it("returns 200 ok and sends a plain-text Resend payload on the happy path", async () => {
    const { fetchImpl, calls } = createFakeFetch(happyRoutes());
    const env = validEnv();

    const response = await handleContact(makeRequest(validFields), env, fetchImpl);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(calls.map((call) => call.url)).toEqual([TURNSTILE_VERIFY_URL, RESEND_EMAILS_URL]);

    // CF-Connecting-IP yoksa remoteip gönderilmez.
    const verifyParams = callBody(calls[0]) as URLSearchParams;
    expect(verifyParams.has("remoteip")).toBe(false);

    const resendCall = calls[1];
    expect(resendCall?.init?.method).toBe("POST");
    const headers = new Headers(resendCall?.init?.headers);
    expect(headers.get("Authorization")).toBe(`Bearer ${env.RESEND_API_KEY}`);
    expect(headers.get("Content-Type")).toBe("application/json");

    const payload = JSON.parse(String(callBody(resendCall))) as Record<string, unknown>;
    expect(payload.from).toBe(env.CONTACT_FROM);
    expect(payload.to).toEqual([env.CONTACT_TO]);
    expect(payload.reply_to).toBe(validFields.email);
    expect(payload.subject).toBe(`Website inquiry from ${validFields.name}`);
    expect(String(payload.text)).toContain(validFields.name as string);
    expect(String(payload.text)).toContain(validFields.email as string);
    expect(String(payload.text)).toContain(validFields.message as string);
    expect("html" in payload).toBe(false);
  });

  it("collapses CR/LF in the name for the subject only, keeping the original name in the text body", async () => {
    const { fetchImpl, calls } = createFakeFetch(happyRoutes());
    const fields = { ...validFields, name: "Ada\r\nBcc: x@y.test" };

    const response = await handleContact(makeRequest(fields), validEnv(), fetchImpl);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });

    const resendCall = calls[1];
    const payload = JSON.parse(String(callBody(resendCall))) as Record<string, unknown>;
    expect(payload.subject).toBe("Website inquiry from Ada Bcc: x@y.test");
    expect(String(payload.subject)).not.toMatch(/[\r\n]/);
    expect(String(payload.text)).toContain("Ada\r\nBcc: x@y.test");
  });
});

describe("handleContact response headers", () => {
  it("sets JSON content type and no-store on success and on failure", async () => {
    const { fetchImpl } = createFakeFetch(happyRoutes());

    const ok = await handleContact(makeRequest(validFields), validEnv(), fetchImpl);
    const invalid = await handleContact(makeJsonRequest(), validEnv(), fetchImpl);

    for (const response of [ok, invalid]) {
      expect(response.headers.get("Content-Type")?.startsWith("application/json")).toBe(true);
      expect(response.headers.get("Cache-Control")).toBe("no-store");
    }
    expect(ok.status).toBe(200);
    expect(invalid.status).toBe(400);
  });
});

describe("onRequestPost", () => {
  it("delegates to handleContact", async () => {
    const response = await onRequestPost({ request: makeJsonRequest(), env: validEnv() });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false, error: "invalid" });
  });
});
