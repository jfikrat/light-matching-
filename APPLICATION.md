# Light Matching Application Overview

## Purpose
Light Matching is a Next.js web application that turns plain product photos into stylized marketing shots. Users upload a product image, pick a photography template, and receive up to eight AI‑generated variations tailored to e‑commerce and fashion contexts.

## Tech Stack
- Next.js 14 (App Router) and React 18
- OpenAI Responses API for prompt generation (configurable model)
- Google Gemini via `@google/generative-ai` for image generation
- In‑memory rate limiting and bounded concurrency on API routes

## Features
- Drag‑and‑drop file upload with live preview
- Template selector and adjustable generation count (1–8)
- Orchestrated server flow that first generates prompts, then images
- Results gallery with links for opening each image
- Basic server/client validation, structured logging

## User Workflow
1. Upload a product photo (png/jpeg/webp, ≤ 8 MB).
2. Select a photography template (e.g., studio lighting, street photography, cut‑out).
3. Set the desired output count (max 8).
4. Click Generate — the server asks OpenAI for template‑specific prompts, then calls Gemini to create images from your photo and each prompt.
5. View and download results.

## API Endpoints
| Endpoint | Description |
|---------|-------------|
| `POST /api/prompts` | Accepts `template`, optional `productDescription`, optional image, and `count`; returns prompts from OpenAI. |
| `POST /api/images` | Accepts `prompt`, optional `image`, and `count`; returns images via Google Gemini (or mock placeholders in dev). |
| `POST /api/generate` | Orchestrates the full flow; returns `{ prompts, images }`. |

## Helper Libraries
- `lib/generatePrompts.js` — Wraps the OpenAI Responses API. Uses `OPENAI_MODEL`; requests JSON output and parses `prompts`.
- `lib/nanoBanana.js` — Wrapper around Google Gemini image generation; returns data URLs. Falls back to mock placeholder images if `GOOGLE_API_KEY` is missing or mock mode is enabled.
- `lib/seedream.js` — Wrapper around fal.ai Seedream 4.0 Edit; uploads input image to fal storage, calls the model and returns hosted URLs; falls back to placeholders if `FAL_KEY` is missing.
- `lib/rateLimit.js` — Fixed‑window, per‑client limiter using request headers.
- `lib/concurrency.js` — Utility to run mappers with a concurrency cap.

## Environment Variables
- `OPENAI_API_KEY`: OpenAI key for prompt generation
- `OPENAI_MODEL`: OpenAI model, e.g. `gpt-5-nano-2025-08-07`
- `OPENAI_BASE_URL`: Optional custom OpenAI base URL
- `GOOGLE_API_KEY`: Google key for Gemini image generation
- `GEMINI_IMAGE_MODEL`: Gemini model, e.g. `gemini-2.5-flash-image-preview`
- `GOOGLE_NANO_BANANA_MOCK`: If set to `1` (or if no Google key), server returns placeholder images
- `FAL_KEY`: fal.ai API key to enable Seedream 4.0 Edit image generation

## Directory Structure
```
.
├─ app/
│  ├─ api/
│  │  ├─ prompts/     # OpenAI prompts endpoint
│  │  ├─ images/      # Gemini images endpoint
│  │  └─ generate/    # Combined orchestration
│  ├─ layout.js
│  └─ page.js         # Upload + template UI (DnD, preview)
├─ lib/
│  ├─ generatePrompts.js
│  ├─ nanoBanana.js   # Gemini wrapper + mock
│  ├─ rateLimit.js
│  └─ concurrency.js
├─ jsconfig.json      # Path alias for `@/*`
├─ next.config.js
├─ package.json
├─ README.md
└─ APPLICATION.md
```

## Development
- Install deps: `npm install`
- Start dev server: `npm run dev`
- Configure `.env.local` with keys listed above. For quick demos without a Google key, set `GOOGLE_NANO_BANANA_MOCK=1`.
- Build: `npm run build`
- Tests: `npm test` (placeholder)

## Operational Notes
- Validation: png/jpeg/webp; max size 8 MB; count clamped 1–8
- Rate limiting: per‑route limits (e.g., `/api/generate` ≈ 30 req / 5 min / client)
- Concurrency: image generation capped at 3 concurrent requests
- Logging: JSON logs for prompts/images/generate with durations

## Future Enhancements
- Expand template gallery with thumbnails and categories
- Optional authentication and per‑user history
- Persistent storage for uploads/results and shareable URLs
- Improved error surfaces and retry/backoff for external calls
