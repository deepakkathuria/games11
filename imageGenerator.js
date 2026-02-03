// imageGenerator.js
const axios = require('axios');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DALL_E_API_URL = "https://api.openai.com/v1/images/generations";

/**
 * Generate image using DALL-E API
 */
async function generateImageWithDALLE(prompt, options = {}) {
  try {
    if (!OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY is not set in environment variables');
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }

    console.log('🎨 Generating image with DALL-E...');
    console.log('📝 Prompt length:', prompt.length);
    console.log('📝 Prompt preview:', prompt.substring(0, 150) + '...');
    
    // Validate prompt length (DALL-E 3 has max 4000 characters)
    if (prompt.length > 4000) {
      console.warn('⚠️ Prompt too long, truncating to 4000 characters');
      prompt = prompt.substring(0, 4000);
    }

    const response = await axios.post(DALL_E_API_URL, {
      model: options.model || "dall-e-3",
      prompt: prompt,
      n: 1, // Number of images
      size: options.size || "1024x1024", // 1024x1024, 1792x1024, or 1024x1792
      quality: options.quality || "standard", // standard or hd
      style: options.style || "natural" // natural or vivid
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60 seconds timeout
    });

    if (!response.data || !response.data.data || !response.data.data[0]) {
      throw new Error('Invalid response from DALL-E API');
    }

    const imageUrl = response.data.data[0].url;
    const revisedPrompt = response.data.data[0].revised_prompt || prompt;

    console.log('✅ Image generated successfully');
    console.log('🔗 Image URL:', imageUrl);

    return {
      success: true,
      imageUrl: imageUrl,
      revisedPrompt: revisedPrompt
    };

  } catch (error) {
    console.error('❌ DALL-E API error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      throw new Error(`DALL-E API error: ${error.response.data?.error?.message || error.message}`);
    }
    throw new Error(`DALL-E API error: ${error.message}`);
  }
}

/**
 * Generate multiple images from prompts array
 */
async function generateMultipleImages(prompts, options = {}) {
  const results = [];
  const errors = [];

  for (let i = 0; i < prompts.length; i++) {
    try {
      console.log(`\n🎨 Generating image ${i + 1}/${prompts.length}...`);
      const result = await generateImageWithDALLE(prompts[i], {
        size: options.size || "1024x1024",
        quality: options.quality || "standard",
        style: options.style || "natural"
      });
      results.push({
        index: i + 1,
        prompt: prompts[i],
        ...result
      });
      // Add delay between requests to avoid rate limiting
      if (i < prompts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      }
    } catch (error) {
      console.error(`❌ Failed to generate image ${i + 1}:`, error.message);
      errors.push({
        index: i + 1,
        prompt: prompts[i],
        error: error.message
      });
    }
  }

  return {
    success: results.length > 0,
    images: results,
    errors: errors,
    totalGenerated: results.length,
    totalFailed: errors.length
  };
}

module.exports = {
  generateImageWithDALLE,
  generateMultipleImages
};
