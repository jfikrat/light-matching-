// Lightweight wrapper for Google Nano Banana image generation.
// The API is expected to accept multipart form data with an optional
// source image, a text prompt and a count of desired outputs.

const API_URL =
  process.env.GOOGLE_NANO_BANANA_ENDPOINT ||
  'https://image.googleapis.com/v1beta/projects/demo/locations/us-central1/models/nanobanana:generate';

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
  const form = new FormData();

  form.append('prompt', prompt);
  form.append('n', String(count));
  if (image) {
    form.append('image', image);
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GOOGLE_NANO_BANANA_API_KEY}`,
    },
    body: form,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Nano Banana API error ${response.status}: ${text}`);
  }

  return response.json();
}
