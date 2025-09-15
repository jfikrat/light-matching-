# Light Matching

Light Matching is a Next.js app that turns a single product photo into multiple stylized marketing shots. It chains two models:

- OpenAI (Responses API) to generate template‑specific prompts
- Google Gemini to generate images conditioned on your photo and each prompt

## API Overview

- `POST /api/prompts` — accepts a template name, optional product description and optional image; returns a list of prompts from OpenAI.
- `POST /api/images` — sends a prompt (and optional image) to Google Gemini; returns images (or mock placeholders if running without a Google key).
- `POST /api/generate` — orchestrates the full flow: upload a product photo, choose a template and generation count (max 8). The endpoint asks OpenAI for prompts and returns images from Gemini for each.

## Getting Started

Prerequisites: Node.js 18+ (or current LTS).

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Set the following environment variables before running the app (create `.env.local`):

```bash
export OPENAI_API_KEY="your-openai-key"
export OPENAI_MODEL="gpt-5-nano-2025-08-07" # or another Responses model available to your account
export OPENAI_BASE_URL="https://api.openai.com/v1" # optional; override if using a gateway

# Google Gemini for image generation
export GOOGLE_API_KEY="your-google-api-key"
export GEMINI_IMAGE_MODEL="gemini-2.5-flash-image-preview" # or gemini-2.0-flash
# For development without a Google key, return placeholder images
# export GOOGLE_NANO_BANANA_MOCK=1

# fal.ai (Seedream 4.0 Edit)
export FAL_KEY="your-fal-api-key" # enables Seedream Edit engine
```

Build the application for production:

```bash
npm run build
```

## Using the App

1. Open the app in your browser (the terminal shows the URL, e.g., http://localhost:3000).
2. Drag & drop or choose a product image (png/jpeg/webp, ≤ 8 MB).
3. Pick a template and set the number of outputs (1–8), optionally add a description.
4. Choose Engine (Gemini or Seedream Edit), then click Generate to see prompts and results.

## Notes

- Rate limiting: simple in‑memory limits per route (e.g., `POST /api/generate` ~30 requests/5 min per client). Adjust in `lib/rateLimit.js`.
- Concurrency: generation is bounded to 3 concurrent image requests (`lib/concurrency.js`).
- Validation: server enforces image type (png/jpeg/webp) and 8 MB max; client enforces the same and shows inline errors.
- Model: set `OPENAI_MODEL` to a model available to your account.
- Images: generated via Google Gemini using `@google/generative-ai`, or via Seedream 4.0 Edit on fal.ai using `@fal-ai/client` when `engine=seedream` and `FAL_KEY` is configured. If keys are missing, the server returns placeholder SVG images for development.

## Troubleshooting

- OpenAI 400s about format: this app uses the Responses API. Ensure `OPENAI_MODEL` supports Responses; we set `text.format` to JSON.
- Gemini 400 about response types: some endpoints only return text/JSON; we omit binary response types and parse inline data when present.
- Mock mode showing: set `GOOGLE_API_KEY` and remove `GOOGLE_NANO_BANANA_MOCK`.
- Port already in use: Next auto‑selects another port; use the printed URL.
