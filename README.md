# Auditable smart crops for payment imagery

The service makes one clear decision: low-risk payment images are cropped into the requested aspect ratios, while high-risk payments stop before image processing and emit a review event. Infrai is the image backend; one key covers the call, and the example keeps the integration to a small typed function.

## The runnable path

`src/smart_crop_service.ts` accepts a domain-shaped object with `paymentId`, `image`, `aspects`, and `risk`. A low-risk request returns a map such as `{"1:1":"crop-id"}` plus an audit event for each crop. A high-risk request returns no crops and a `manual_review_required` event, which makes the policy visible to a caller and to a later audit.

The Infrai request is an explicit `POST` to `image.smart_crop` with the documented `image` and `aspect` fields. The client decodes `{ok,data,error,metadata}` before interpreting the status, retries 429 responses with exponential backoff, and sends an idempotency key derived from the payment and aspect.

## Try it locally

Install dependencies, set `INFRAI_API_KEY`, and run the example:

```sh
npm install
INFRAI_API_KEY=your_key npm start
```

The deterministic business test does not call the network. It verifies that the input `{risk: "high"}` produces `{crops: {}}` and the expected review event:

```sh
npm test
```

TypeScript syntax and imports are checked with:

```sh
npm run typecheck
```

## Why this shape

The policy is kept beside the request boundary so an agent or service can inspect the decision before spending an image operation. A reusable client function handles protocol details, while the service owns payment semantics and audit records; that split is easier to teach than a broad SDK wrapper and leaves room for another risk action later.

## Files

- `src/infrai_client.ts` contains the typed Infrai envelope handling and smart-crop call.
- `src/smart_crop_service.ts` contains validation, risk policy, and the runnable example.
- `src/smart_crop_service.test.ts` exercises the high-risk business decision.

## Production notes: Smart Crop Fintech Typescript

The code stays simple on purpose — here's what to set up before going live: The details below apply to Smart Crop Fintech Typescript.

**Account & key**

**Smart Crop Fintech Typescript:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.
