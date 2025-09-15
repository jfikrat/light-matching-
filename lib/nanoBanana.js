// Image generation wrapper using Google Gemini via Google AI SDK.
// Falls back to mock images when GOOGLE_API_KEY is not set (dev mode).

import { GoogleGenerativeAI } from "@google/generative-ai";

const USE_MOCK = process.env.GOOGLE_NANO_BANANA_MOCK === '1' || !process.env.GOOGLE_API_KEY;

function svgDataUrl({ title, subtitle }) {
  const esc = (s) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f0f4ff" />
      <stop offset="100%" stop-color="#e4ffe7" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#222">${esc(title)}</text>
  <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="16" fill="#555">${esc(subtitle)}</text>
  <rect x="40" y="40" width="720" height="520" rx="12" ry="12" fill="none" stroke="#ddd" stroke-width="2" />
  <text x="96%" y="96%" text-anchor="end" font-family="monospace" font-size="12" fill="#999">mock</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

async function mockGenerate({ prompt, count = 1 }) {
  const title = 'Nano Banana Mock Image';
  const images = Array.from({ length: count }, (_, i) =>
    svgDataUrl({ title, subtitle: `${prompt?.slice?.(0, 60) || 'no prompt'} • ${i + 1}` })
  );
  return { images };
}

/**
 * Call Google Nano Banana to generate images.
 *
 * @param {Object} options
 * @param {File|Blob|null} options.image      optional source image
 * @param {string} options.prompt             prompt describing desired output
 * @param {number} [options.count=1]          number of images to generate
 * @returns {Promise<object>}                 parsed JSON response from API
 */
export async function generateImage({ image, prompt, count = 1 }) {
  if (USE_MOCK) {
    console.warn('[gemini] No GOOGLE_API_KEY set; using mock images.');
    return mockGenerate({ prompt, count });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  const modelName = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.0-flash';
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  const n = Math.max(1, Math.min(8, Number(count) || 1));

  async function one(promptText, img) {
    const parts = [];
    if (promptText) parts.push({ text: String(promptText) });
    if (img) {
      const buf = Buffer.from(await img.arrayBuffer());
      const mime = img.type || 'image/png';
      parts.push({ inlineData: { data: buf.toString('base64'), mimeType: mime } });
    }

    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
      // Some Gemini endpoints only support text/json response_mime_type; omit it for flexibility.
    });

    // Try several shapes to extract image data
    const candidate = result?.response?.candidates?.[0];
    const imagePart = candidate?.content?.parts?.find?.((p) => p?.inlineData?.data) || null;
    const mimeType = imagePart?.inlineData?.mimeType || 'image/png';
    const b64 = imagePart?.inlineData?.data || null;
    if (b64) {
      return `data:${mimeType};base64,${b64}`;
    }
    // Fallback: return a placeholder explaining limitation
    return svgDataUrl({
      title: 'Gemini text response',
      subtitle: 'No image data returned by model',
    });
  }

  const images = [];
  for (let i = 0; i < n; i++) {
    images.push(await one(prompt, image));
  }
  return { images };
}
