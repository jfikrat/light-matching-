import { NextResponse } from 'next/server';
import { generatePrompts } from '@/lib/generatePrompts';

export async function POST(request) {
  let template,
    count = 1,
    productDescription = '',
    imageBase64;

  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    template = form.get('template');
    count = parseInt(form.get('count') || '1', 10);
    productDescription = form.get('productDescription') || '';
    const image = form.get('image');
    if (image) {
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
    const prompts = await generatePrompts({
      template,
      count,
      productDescription,
      imageBase64,
    });
    return NextResponse.json({ prompts });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
