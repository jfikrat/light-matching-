import { NextResponse } from 'next/server';
import { generatePrompts } from '@/lib/generatePrompts';
import { generateImage } from '@/lib/nanoBanana';

export async function POST(request) {
  const form = await request.formData();
  const template = form.get('template');
  const count = Math.min(parseInt(form.get('count') || '1', 10), 8);
  const productDescription = form.get('productDescription') || '';
  const image = form.get('image');

  if (!template || !image) {
    return NextResponse.json(
      { error: 'template and image are required' },
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
    const results = await Promise.all(
      prompts.map((prompt, i) =>
        generateImage({ image: blobs[i], prompt, count: 1 })
      )
    );

    const images = results.flatMap((r) => r.images || r);

    return NextResponse.json({ prompts, images });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
