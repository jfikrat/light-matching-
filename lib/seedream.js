// Seedream 4.0 Edit on fal.ai integration
// Requires FAL_KEY in environment

import { fal } from "@fal-ai/client";

const MODEL_ID = "fal-ai/bytedance/seedream/v4/edit";
const USE_MOCK = !process.env.FAL_KEY;

function svgDataUrl({ title, subtitle }) {
  const esc = (s) => (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f8fbff" />
      <stop offset="100%" stop-color="#eff7ff" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="-apple-system,Segoe UI,Roboto,Helvetica,Arial" font-size="28" fill="#222">${esc(title)}</text>
  <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="-apple-system,Segoe UI,Roboto,Helvetica,Arial" font-size="16" fill="#555">${esc(subtitle)}</text>
  <rect x="40" y="40" width="720" height="520" rx="12" ry="12" fill="none" stroke="#ddd" stroke-width="2" />
  <text x="96%" y="96%" text-anchor="end" font-family="monospace" font-size="12" fill="#999">seedream-mock</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

async function mockGenerate({ prompt, count = 1 }) {
  const title = 'Seedream Mock Image';
  const images = Array.from({ length: Math.max(1, count) }, (_, i) =>
    svgDataUrl({ title, subtitle: `${(prompt||'no prompt').slice(0,60)} · ${i+1}` })
  );
  return { images };
}

export async function generateSeedreamImage({ image, prompt, count = 1 }) {
  if (USE_MOCK) {
    console.warn('[seedream] No FAL_KEY set; using mock images.');
    return mockGenerate({ prompt, count });
  }

  fal.config({ credentials: process.env.FAL_KEY });

  const n = Math.max(1, Math.min(8, Number(count) || 1));

  let uploadedUrl = null;
  if (image) {
    // Convert Blob -> File for fal.storage.upload
    const mime = image.type || 'image/png';
    const buf = Buffer.from(await image.arrayBuffer());
    const file = typeof File !== 'undefined'
      ? new File([buf], `upload.${mime.includes('png') ? 'png' : 'jpg'}`, { type: mime })
      : image;
    uploadedUrl = await fal.storage.upload(file);
  }

  const input = {
    prompt: String(prompt || ''),
    image_urls: uploadedUrl ? [uploadedUrl] : [],
    num_images: n,
    max_images: n,
    enable_safety_checker: true,
  };

  const result = await fal.subscribe(MODEL_ID, { input, logs: false });
  const imgs = result?.data?.images || [];
  const urls = imgs.map((i) => (typeof i === 'string' ? i : i?.url)).filter(Boolean);
  return { images: urls };
}

