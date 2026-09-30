import assert from "node:assert/strict";
import { processPaymentImage } from "./smart_crop_service.js";

const result = await processPaymentImage({ paymentId: "pay_high", image: "img_123", aspects: ["1:1"], risk: "high" });
assert.deepEqual(result.crops, {});
assert.equal(result.events[0]?.outcome, "manual_review_required");
console.log("high-risk payments are held for review");
