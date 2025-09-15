# README — Seedream 4.0 Edit (fal.ai) Setup

> Fast start guide to use **Bytedance Seedream 4.0 Edit** on **fal.ai** in Node/TypeScript and cURL. Model ID: `fal-ai/bytedance/seedream/v4/edit`.

## 1) Prerequisites

- Node.js 18+ (or Bun/PNPM/NPM)  
- A **fal.ai API key** (`FAL_KEY`) with access to the model.  
- Publicly accessible image URLs (or use fal storage upload).

## 2) Install

```bash
npm install --save @fal-ai/client
# or: pnpm add @fal-ai/client
# or: bun add @fal-ai/client
```

> Note: `@fal-ai/serverless-client` is deprecated. Migrate to `@fal-ai/client`.

## 3) Configure Auth

Set your API key as an environment variable:

```bash
export FAL_KEY="YOUR_API_KEY"
```

Or configure in code (avoid this in browsers—see “Security”):

```ts
import { fal } from "@fal-ai/client";

fal.config({
  credentials: process.env.FAL_KEY!, // or a literal string if you must
});
```

## 4) Quick Start (Auto-managed subscribe)

```ts
import { fal } from "@fal-ai/client";

async function main() {
  const result = await fal.subscribe("fal-ai/bytedance/seedream/v4/edit", {
    input: {
      prompt: "Dress the model in the clothes and shoes.",
      image_urls: [
        "https://storage.googleapis.com/falserverless/example_inputs/seedream4_edit_input_1.png",
        "https://storage.googleapis.com/falserverless/example_inputs/seedream4_edit_input_2.png",
        "https://storage.googleapis.com/falserverless/example_inputs/seedream4_edit_input_3.png",
        "https://storage.googleapis.com/falserverless/example_inputs/seedream4_edit_input_4.png"
      ]
    },
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === "IN_PROGRESS") {
        update.logs?.map((log) => log.message).forEach(console.log);
      }
    },
  });

  console.log("requestId:", result.requestId);
  console.log("output:", result.data);
}

main().catch(console.error);
```

## 5) Queue Workflow (Submit → Poll → Result)

**Submit:**
```ts
import { fal } from "@fal-ai/client";

const { request_id } = await fal.queue.submit("fal-ai/bytedance/seedream/v4/edit", {
  input: {
    prompt: "Dress the model in the clothes and shoes.",
    image_urls: [
      "https://storage.googleapis.com/falserverless/example_inputs/seedream4_edit_input_1.png",
      "https://storage.googleapis.com/falserverless/example_inputs/seedream4_edit_input_2.png",
      "https://storage.googleapis.com/falserverless/example_inputs/seedream4_edit_input_3.png",
      "https://storage.googleapis.com/falserverless/example_inputs/seedream4_edit_input_4.png"
    ]
  },
  webhookUrl: "https://your.server.tld/fal/webhook"
});
```

**Status:**
```ts
const status = await fal.queue.status("fal-ai/bytedance/seedream/v4/edit", {
  requestId: request_id,
  logs: true,
});
console.log(status);
```

**Result:**
```ts
const result = await fal.queue.result("fal-ai/bytedance/seedream/v4/edit", {
  requestId: request_id,
});
console.log(result.data);
```

## 6) File Handling

```ts
import { fal } from "@fal-ai/client";

const url = await fal.storage.upload(new File(["hello"], "hello.txt", { type: "text/plain" }));
```

## 7) Minimal cURL

```bash
curl -X POST https://your.server.tld/api/seedream-edit   -H "Content-Type: application/json"   -d '{
    "prompt": "Dress the model in the clothes and shoes.",
    "image_urls": [
      "https://storage.googleapis.com/falserverless/example_inputs/seedream4_edit_input_1.png",
      "https://storage.googleapis.com/falserverless/example_inputs/seedream4_edit_input_2.png"
    ]
  }'
```

## 8) Input Schema

- **prompt** *(string, required)*  
- **image_urls** *(string[], required)* up to 10  
- **image_size** *(enum or custom object)*  
- **num_images** *(int)* default 1  
- **max_images** *(int)* default 1  
- **seed** *(int)*  
- **sync_mode** *(boolean)*  
- **enable_safety_checker** *(boolean, default true)*  

### Example JSON
```json
{
  "prompt": "Dress the model in the clothes and shoes.",
  "image_size": { "width": 1280, "height": 1280 },
  "num_images": 1,
  "max_images": 1,
  "enable_safety_checker": true,
  "image_urls": [
    "https://storage.googleapis.com/falserverless/example_inputs/seedream4_edit_input_1.png",
    "https://storage.googleapis.com/falserverless/example_inputs/seedream4_edit_input_2.png",
    "https://storage.googleapis.com/falserverless/example_inputs/seedream4_edit_input_3.png",
    "https://storage.googleapis.com/falserverless/example_inputs/seedream4_edit_input_4.png"
  ]
}
```

## 9) Output Schema

```json
{
  "images": [
    { "url": "https://storage.googleapis.com/falserverless/example_outputs/seedream4_edit_output.png" }
  ],
  "seed": 746406749
}
```

## 10) Example Structure

```
/seedream-edit/
  ├─ src/
  │   ├─ client.ts
  │   ├─ subscribe.ts
  │   ├─ queue-submit.ts
  │   ├─ queue-status.ts
  │   ├─ queue-result.ts
  │   └─ webhook.ts
  ├─ .env
  ├─ package.json
  └─ README.md
```
