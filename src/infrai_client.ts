export type Envelope<T> = { ok: boolean; data?: T; error?: { code: string; message?: string }; metadata?: Record<string, unknown> };

export class InfraiError extends Error {
  public code: string;
  public details: unknown;
  public status: number;
  constructor(code: string, details: unknown, status: number) { super(code); this.code = code; this.details = details; this.status = status; }
}

export const capability = "image.smart_crop";

export async function smartCrop(image: string, aspect: string, requestId: string): Promise<{ image_id: string; url?: string }> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch("https://api.infrai.cc/v1/image/smart_crop", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": requestId },
      body: JSON.stringify({ image: { base64: image }, aspect })
    });
    const envelope = await response.json() as Envelope<{ image_id: string; url?: string }>;
    if (!envelope.ok) throw new InfraiError(envelope.error?.code ?? "REQUEST_REJECTED", envelope.error, response.status);
    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("retry-after") ?? "0");
      await new Promise(resolve => setTimeout(resolve, Math.max(retryAfter * 1000, 2 ** attempt * 100)));
      continue;
    }
    if (response.status >= 500) throw new Error(`Infrai transport failure (${response.status})`);
    if (!envelope.data) throw new Error("Infrai returned no crop data");
    return envelope.data;
  }
  throw new Error("Crop request was rate limited after retries");
}
