import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  // Optionally allow overriding base URL if using a gateway
  baseURL: process.env.OPENAI_BASE_URL || undefined,
});

/**
 * Generate a list of prompts using GPT-5.
 *
 * @param {Object} options
 * @param {string} options.template            photography template name
 * @param {number} [options.count=1]           number of prompts to create
 * @param {string} [options.productDescription=""] description of the product
 * @param {string} [options.imageBase64]       optional base64 product image (deprecated; prefer imageDataUrl)
 * @param {string} [options.imageDataUrl]      optional data URL e.g. data:image/png;base64,AAA
 * @returns {Promise<string[]>}                array of generated prompts
 */
export async function generatePrompts({
  template,
  count = 1,
  productDescription = '',
  imageBase64,
  imageDataUrl,
}) {
  if (!template) throw new Error('template is required');

  const userText = `Generate ${count} distinct prompts for ${template} photography of a product described as: ${productDescription}. Return the prompts as a JSON array under the key \"prompts\".`;

  const input = [
    {
      role: 'user',
      content: [
        { type: 'input_text', text: userText },
      ],
    },
  ];

  if (imageBase64 || imageDataUrl) {
    const image_url = imageDataUrl || `data:image/png;base64,${imageBase64}`;
    input[0].content.push({ type: 'input_image', image_url });
  }

  const model = process.env.OPENAI_MODEL || 'gpt-5';

  const response = await openai.responses.create({
    model,
    input,
    // Responses API: use text.format (object) instead of response_format
    text: { format: { type: 'json_object' } },
  });

  try {
    const textOut =
      // Preferred helper in newer Responses API versions
      (typeof response?.output_text === 'string'
        ? response.output_text
        : response?.output_text?.[0]) ??
      // Fallback: find the output_text content item
      response?.output?.[0]?.content?.find?.((c) => c?.type === 'output_text')?.text ??
      // Legacy fallback
      response?.output?.[0]?.content?.[0]?.text;
    if (!textOut) throw new Error('missing text output');
    const data = JSON.parse(textOut);
    return Array.isArray(data.prompts) ? data.prompts : [];
  } catch (err) {
    // Provide a clearer error to the caller for better UX/logging
    throw new Error(`Failed to parse prompts JSON: ${err.message}`);
  }
}
