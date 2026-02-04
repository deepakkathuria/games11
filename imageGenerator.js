// imageGenerator.js
const axios = require("axios");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const IMAGE_API_URL = "https://api.openai.com/v1/images/generations";

const ALLOWED_SIZES = new Set(["1024x1024", "1024x1536", "1536x1024", "auto"]);

async function generateImage(prompt, { size = "1024x1024" } = {}) {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY missing");
  if (!ALLOWED_SIZES.has(size)) size = "1024x1536";

  const resp = await axios.post(
    IMAGE_API_URL,
    { model: "gpt-image-1", prompt, n: 1, size },
    {
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
      timeout: 90000
    }
  );

  const img = resp?.data?.data?.[0];
  if (!img?.url) throw new Error("No image url returned");

  return { imageUrl: img.url, revisedPrompt: img.revised_prompt || prompt };
}

async function generateMultipleImagesWithSizes(prompts, metadata = []) {
  const results = [];
  const errors = [];

  for (let i = 0; i < prompts.length; i++) {
    try {
      const meta = metadata[i] || {};
      const size = meta.dimensions || "1024x1024";

      console.log(`\n🎨 [${i + 1}/${prompts.length}] concept=${meta.conceptIndex} size=${meta.sizeLabel} (${size})`);
      console.log(`📰 overlay="${meta.headline_overlay || ""}"`);
      console.log(`📝 prompt: ${prompts[i].slice(0, 160)}...`);

      const r = await generateImage(prompts[i], { size });

      results.push({
        index: i + 1,
        conceptIndex: meta.conceptIndex,
        sizeLabel: meta.sizeLabel,
        dimensions: size,
        headline_overlay: meta.headline_overlay,
        scene_type: meta.scene_type,
        prompt: prompts[i],
        imageUrl: r.imageUrl,
        revisedPrompt: r.revisedPrompt
      });

      if (i < prompts.length - 1) await new Promise(r => setTimeout(r, 1400));
    } catch (e) {
      errors.push({ index: i + 1, error: e.message, prompt: prompts[i] });
      console.error("❌ image failed:", e.message);
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
  generateMultipleImagesWithSizes
};
