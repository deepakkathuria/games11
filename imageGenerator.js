// imageGenerator.js
const axios = require("axios");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const IMAGE_API_URL = "https://api.openai.com/v1/images/generations";

// Allowed OpenAI sizes for image gen (safe set)
const ALLOWED_SIZES = new Set(["1024x1024", "1024x1536", "1536x1024", "auto"]);

/**
 * Generate image using gpt-image-1 ONLY (no fallback)
 */
async function generateImage(prompt, options = {}) {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY missing");

  let size = options.size || "1024x1024";
  if (!ALLOWED_SIZES.has(size)) {
    // force correct portrait size instead of fallback
    size = "1024x1536";
  }

  console.log("🎨 Generating image with gpt-image-1...");
  console.log("📐 Size:", size);
  console.log("📝 Prompt preview:", prompt.slice(0, 140), "...");

  const resp = await axios.post(
    IMAGE_API_URL,
    {
      model: "gpt-image-1",
      prompt,
      n: 1,
      size
      // Keep minimal. Add quality only if your account supports it reliably.
      // quality: "high"
    },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      timeout: 60000
    }
  );

  const data0 = resp?.data?.data?.[0];
  if (!data0?.url) throw new Error("No image URL returned");

  console.log('✅ Image generated successfully');
  console.log('🔗 Image URL:', data0.url);

  return {
    success: true,
    imageUrl: data0.url,
    revisedPrompt: data0.revised_prompt || prompt
  };
}

/**
 * Generate multiple images from prompts array (legacy support)
 */
async function generateMultipleImages(prompts, options = {}) {
  const results = [];
  const errors = [];

  for (let i = 0; i < prompts.length; i++) {
    try {
      console.log(`\n🎨 Generating image ${i + 1}/${prompts.length}...`);
      const result = await generateImage(prompts[i], {
        size: options.size || "1024x1024"
      });
      results.push({
        index: i + 1,
        prompt: prompts[i],
        ...result
      });
      // Add delay between requests to avoid rate limiting
      if (i < prompts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1400)); // 1.4 second delay
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

/**
 * Generate multiple images with different sizes (1:1 and 4:5 portrait)
 */
async function generateMultipleImagesWithSizes(prompts, metadata = [], options = {}) {
  const results = [];
  const errors = [];

  for (let i = 0; i < prompts.length; i++) {
    try {
      const meta = metadata[i] || {};
      const size = meta.dimensions || options.size || "1024x1024";

      console.log(`\n🎨 Generating image ${i + 1}/${prompts.length}`);
      console.log(`🧩 Concept: ${meta.conceptIndex || "?"} | ${meta.sizeLabel || "?"}`);
      console.log(`📐 Size: ${size}`);
      console.log(`📰 Overlay: ${meta.headline_overlay || ""}`);
      console.log(`🎭 Scene Type: ${meta.scene_type || ""}`);

      const res = await generateImage(prompts[i], { size });

      results.push({
        index: i + 1,
        conceptIndex: meta.conceptIndex,
        sizeLabel: meta.sizeLabel,
        dimensions: size,
        headline_overlay: meta.headline_overlay,
        scene_type: meta.scene_type,
        rawPrompt: meta.rawPrompt || prompts[i],
        finalPrompt: meta.finalPrompt || prompts[i],
        prompt: prompts[i],
        ...res
      });

      if (i < prompts.length - 1) {
        await new Promise(r => setTimeout(r, 1400));
      }
    } catch (e) {
      errors.push({ index: i + 1, prompt: prompts[i], error: e.message });
      console.error(`❌ Failed image ${i + 1}:`, e.message);
    }
  }

  return {
    success: results.length > 0,
    images: results,
    errors,
    totalGenerated: results.length,
    totalFailed: errors.length
  };
}

module.exports = {
  generateImage,
  generateMultipleImages,
  generateMultipleImagesWithSizes
};
