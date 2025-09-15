import { NextResponse } from 'next/server';
import { generatePrompts } from '@/lib/generatePrompts';
import { generateImage } from '@/lib/nanoBanana';
import { rateLimit, requestKey } from '@/lib/rateLimit';
import { mapWithConcurrency } from '@/lib/concurrency';
import { generateSeedreamImage } from '@/lib/seedream';

export async function POST(request) {
  // rate limiting per client
  const key = requestKey(request, 'generate');
  const rl = rateLimit(key, 30, 5 * 60 * 1000); // 30 requests/5min
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'rate limit exceeded', retryAfterMs: rl.retryAfterMs },
      { status: 429 }
    );
  }

  const form = await request.formData();
  const template = form.get('template');
  const count = Math.min(parseInt(form.get('count') || '1', 10), 8);
  const productDescription = form.get('productDescription') || '';
  const image = form.get('image');
  const engine = (form.get('engine') || 'gemini').toString().toLowerCase();

  if (!template || !image) {
    return NextResponse.json(
      { error: 'template and image are required' },
      { status: 400 }
    );
  }

  // basic server-side validation for file
  const allowedTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);
  const maxBytes = 8 * 1024 * 1024; // 8MB
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

  const buffer = Buffer.from(await image.arrayBuffer());
  const imageBase64 = buffer.toString('base64');

  try {
    const prompts = await generatePrompts({
      template,
      count,
      productDescription,
      imageBase64,
    });

    const blobs = prompts.map(() => new Blob([buffer], { type: image.type }));
    const startedAt = Date.now();
    const useSeedream = engine === 'seedream';
    const results = await mapWithConcurrency(
      prompts,
      (prompt, i) => {
        return useSeedream
          ? generateSeedreamImage({ image: blobs[i], prompt, count: 1 })
          : generateImage({ image: blobs[i], prompt, count: 1 });
      },
      3
    );
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        event: 'generate.complete',
        promptCount: prompts.length,
        engine,
        durationMs: Date.now() - startedAt,
      })
    );

    const images = results.flatMap((r) => r.images || r);

    return NextResponse.json({ prompts, images });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
