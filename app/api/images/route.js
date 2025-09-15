import { NextResponse } from 'next/server';
import { generateImage } from '@/lib/nanoBanana';
import { generateSeedreamImage } from '@/lib/seedream';
import { rateLimit, requestKey } from '@/lib/rateLimit';

export async function POST(request) {
  // rate limit
  const key = requestKey(request, 'images');
  const rl = rateLimit(key, 60, 5 * 60 * 1000); // 60/5min
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'rate limit exceeded', retryAfterMs: rl.retryAfterMs },
      { status: 429 }
    );
  }

  const form = await request.formData();
  const image = form.get('image');
  const prompt = form.get('prompt');
  const count = parseInt(form.get('count') || '1', 10);
  const engine = (form.get('engine') || 'gemini').toString().toLowerCase();

  if (!prompt) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
  }

  try {
    if (image) {
      const allowedTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);
      const maxBytes = 8 * 1024 * 1024;
      if (!allowedTypes.has(image.type)) {
        return NextResponse.json(
          { error: `unsupported image type: ${image.type}` },
          { status: 400 }
        );
      }
      if (image.size > maxBytes) {
        return NextResponse.json(
          { error: `image too large: ${(image.size / (1024 * 1024)).toFixed(2)}MB` },
          { status: 400 }
        );
      }
    }
    if (engine === 'seedream' && !image) {
      return NextResponse.json({ error: 'image is required for Seedream engine' }, { status: 400 });
    }
    const startedAt = Date.now();
    const data = engine === 'seedream'
      ? await generateSeedreamImage({ image, prompt, count })
      : await generateImage({ image, prompt, count });
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        event: 'images.complete',
        count,
        engine,
        durationMs: Date.now() - startedAt,
      })
    );
    return NextResponse.json({ images: data.images || data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
