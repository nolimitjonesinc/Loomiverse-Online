// Vercel Serverless Function - Proxy for OpenAI DALL-E 3 API
// Generates character portraits and story imagery

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  try {
    const { prompt, size = '1024x1024', quality = 'standard', style = 'vivid' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size,
        quality,
        style
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('DALL-E API error:', data);
      return res.status(response.status).json(data);
    }

    // Return the image URL
    return res.status(200).json({
      success: true,
      imageUrl: data.data?.[0]?.url,
      revisedPrompt: data.data?.[0]?.revised_prompt
    });
  } catch (error) {
    console.error('DALL-E API error:', error);
    return res.status(500).json({ error: 'Failed to generate image' });
  }
}
