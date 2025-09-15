import { NextResponse } from 'next/server';
import { generateImage } from '@/lib/nanoBanana';

export async function POST(request) {
  const form = await request.formData();
  const image = form.get('image');
  const prompt = form.get('prompt');
  const count = parseInt(form.get('count') || '1', 10);

  if (!prompt) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
  }

  try {
    const data = await generateImage({ image, prompt, count });
    return NextResponse.json({ images: data.images || data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
