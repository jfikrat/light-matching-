import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generate a list of prompts using GPT-5.
 *
 * @param {Object} options
 * @param {string} options.template            photography template name
 * @param {number} [options.count=1]           number of prompts to create
 * @param {string} [options.productDescription=""] description of the product
 * @param {string} [options.imageBase64]       optional base64 product image
 * @returns {Promise<string[]>}                array of generated prompts
 */
export async function generatePrompts({
  template,
  count = 1,
  productDescription = '',
  imageBase64,
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

  if (imageBase64) {
    input[0].content.push({ type: 'input_image', image_base64: imageBase64 });
  }

  const response = await openai.responses.create({
    model: 'gpt-5',
    input,
    response_format: { type: 'json_object' },
  });

  const data = JSON.parse(response.output[0].content[0].text);
  return data.prompts || [];
}
