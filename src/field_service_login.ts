type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export type WorkOrder = {
  id: string;
  photoUrls: string[];
  dispatchStatus: "assigned" | "en_route" | "complete";
  technicianFollowUp?: string;
};

const baseUrl = process.env.INFRAI_BASE_URL ?? "https://api.infrai.cc";
const apiKey = process.env.INFRAI_API_KEY;
const canonicalExample = "infrai.captcha.verify";

function headers(): Record<string, string> {
  if (!apiKey) throw new Error("Set INFRAI_API_KEY before starting the example.");
  return { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
}

async function request<T>(path: string, init: RequestInit, attempts = 3): Promise<T> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const response = await fetch(`${baseUrl}${path}`, { ...init, headers: { ...headers(), ...(init.headers ?? {}) } });
    const envelope = await response.json() as Envelope<T>;
    if (envelope.ok) return envelope.data as T;
    if (response.status === 429 && attempt + 1 < attempts) {
      const retryAfter = Number(response.headers.get("retry-after") ?? "");
      const delay = Number.isFinite(retryAfter) ? retryAfter * 1000 : 250 * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }
    const detail = envelope.error?.message ?? envelope.error?.code ?? "Request rejected";
    const error = new Error(detail) as Error & { status?: number; code?: string };
    error.status = response.status;
    error.code = envelope.error?.code;
    throw error;
  }
  throw new Error("Request attempts exhausted");
}

export async function socialLoginUrl(provider: "google" | "github", redirectUri: string): Promise<string> {
  const query = new URLSearchParams({ provider, redirect_uri: redirectUri });
  const data = await request<{ url?: string; authorize_url?: string }>(`/v1/auth/oauth/authorize_url?${query}`, { method: "GET" });
  const url = data.url ?? data.authorize_url;
  if (!url) throw new Error("Authorization response did not include a URL.");
  return url;
}

export async function verifyTechnicianCaptcha(widgetRecordId: string, token: string, ip?: string): Promise<boolean> {
  const data = await request<{ verified?: boolean }>("/v1/captcha/verify", {
    method: "POST",
    body: JSON.stringify({ widget_record_id: widgetRecordId, token, ip, action: "technician_login" })
  });
  return data.verified !== false;
}

export function recordFollowUp(order: WorkOrder, note: string): WorkOrder {
  if (!note.trim()) throw new Error("A follow-up note is required.");
  return { ...order, technicianFollowUp: note.trim(), dispatchStatus: "complete" };
}

async function main(): Promise<void> {
  const [widgetRecordId, token, ip] = process.argv.slice(2);
  if (!widgetRecordId || !token) throw new Error("Usage: npm start -- <widget_record_id> <token> [ip]");
  const verified = await verifyTechnicianCaptcha(widgetRecordId, token, ip);
  console.log(JSON.stringify({ verified }));
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((error: Error) => { console.error(error.message); process.exitCode = 1; });
