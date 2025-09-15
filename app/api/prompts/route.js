import { NextResponse } from 'next/server';
import { generatePrompts } from '@/lib/generatePrompts';
import { rateLimit, requestKey } from '@/lib/rateLimit';

export async function POST(request) {
  let template,
    count = 1,
    productDescription = '',
    imageBase64;

  // rate limit
  const key = requestKey(request, 'prompts');
  const rl = rateLimit(key, 60, 5 * 60 * 1000); // 60/5min
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'rate limit exceeded', retryAfterMs: rl.retryAfterMs },
      { status: 429 }
    );
  }

  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    template = form.get('template');
    count = parseInt(form.get('count') || '1', 10);
    productDescription = form.get('productDescription') || '';
    const image = form.get('image');
    if (image) {
      // Validate input image if provided
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
      const buffer = Buffer.from(await image.arrayBuffer());
      imageBase64 = buffer.toString('base64');
    }
  } else {
    ({ template, count = 1, productDescription = '', imageBase64 } = await request.json());
  }

  if (!template) {
    return NextResponse.json({ error: 'template is required' }, { status: 400 });
  }

  try {
    const startedAt = Date.now();
    const prompts = await generatePrompts({
      template,
      count,
      productDescription,
      imageBase64,
    });
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        event: 'prompts.complete',
        count,
        hasImage: Boolean(imageBase64),
        durationMs: Date.now() - startedAt,
      })
    );
    return NextResponse.json({ prompts });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
