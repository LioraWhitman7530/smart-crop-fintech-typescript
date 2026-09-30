import { z } from "zod";
import { smartCrop } from "./infrai_client.js";

export const CropRequest = z.object({
  paymentId: z.string().min(1), image: z.string().min(1), aspects: z.array(z.string().regex(/^\d+:\d+$/)).min(1), risk: z.enum(["low", "high"])
});
export type CropRequest = z.infer<typeof CropRequest>;
export type AuditEvent = { paymentId: string; action: "crop" | "review"; outcome: string; at: string };

export async function processPaymentImage(input: unknown): Promise<{ crops: Record<string, string>; events: AuditEvent[] }> {
  const request = CropRequest.parse(input);
  const events: AuditEvent[] = [];
  if (request.risk === "high") {
    events.push({ paymentId: request.paymentId, action: "review", outcome: "manual_review_required", at: new Date().toISOString() });
    return { crops: {}, events };
  }
  const crops: Record<string, string> = {};
  for (const aspect of request.aspects) {
    const result = await smartCrop(request.image, aspect, `${request.paymentId}:${aspect}`);
    crops[aspect] = result.image_id;
    events.push({ paymentId: request.paymentId, action: "crop", outcome: `${aspect}:${crops[aspect]}`, at: new Date().toISOString() });
  }
  return { crops, events };
}

if (process.argv[1]?.endsWith("smart_crop_service.ts")) {
  const imageUrl = "https://upload.wikimedia.org/wikipedia/commons/3/3f/JPEG_example_flower.jpg";
  fetch(imageUrl)
    .then(async response => {
      if (!response.ok) throw new Error(`Example image unavailable (${response.status})`);
      const image = Buffer.from(await response.arrayBuffer()).toString("base64");
      return processPaymentImage({ paymentId: "pay_demo_001", image, aspects: ["1:1", "3:4", "16:9"], risk: "low" });
    })
    .then(result => console.log(JSON.stringify(result, null, 2)))
    .catch(error => { console.error(error.message); process.exitCode = 1; });
}
