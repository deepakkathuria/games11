// imageGenerator.js
const axios = require("axios");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const IMAGE_API_URL = "https://api.openai.com/v1/images/generations";

const ALLOWED_SIZES = new Set(["1024x1024", "1024x1536", "1536x1024", "auto"]);

async function generateImage(prompt, { size = "1024x1024" } = {}) {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY missing");
  if (!ALLOWED_SIZES.has(size)) size = "1024x1536";

  console.log(`📡 Calling OpenAI Image API with model: gpt-image-1, size: ${size}`);
  
  try {
    const resp = await axios.post(
      IMAGE_API_URL,
      { model: "gpt-image-1", prompt, n: 1, size },
      {
        headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
        timeout: 90000
      }
    );

    console.log(`📦 OpenAI API Response Status: ${resp.status}`);
    console.log(`📦 Response keys:`, Object.keys(resp.data || {}));
    
    // Check response structure
    if (resp.data?.error) {
      console.error(`❌ OpenAI API Error:`, resp.data.error);
      throw new Error(`OpenAI API Error: ${JSON.stringify(resp.data.error)}`);
    }

    // Try different response structures
    let img = null;
    if (resp.data?.data && Array.isArray(resp.data.data) && resp.data.data.length > 0) {
      img = resp.data.data[0];
    } else if (resp.data?.images && Array.isArray(resp.data.images) && resp.data.images.length > 0) {
      img = resp.data.images[0];
    } else if (resp.data?.url) {
      img = resp.data;
    }

    console.log(`📦 Image data found:`, img ? "Yes" : "No");
    console.log(`📦 Image data structure:`, img ? Object.keys(img) : "N/A");

    if (!img) {
      console.error(`❌ Unexpected response structure:`, JSON.stringify(resp.data, null, 2));
      throw new Error("No image data in response. Response structure: " + JSON.stringify(resp.data));
    }

    if (!img.url && !img.b64_json) {
      console.error(`❌ No URL or base64 in image data:`, img);
      throw new Error("No image url or base64 returned. Image data: " + JSON.stringify(img));
    }

    const imageUrl = img.url || `data:image/png;base64,${img.b64_json}`;
    console.log(`✅ Image generated successfully. URL length: ${imageUrl.length}`);

    return { 
      imageUrl: imageUrl, 
      revisedPrompt: img.revised_prompt || prompt 
    };
  } catch (error) {
    console.error(`❌ Image generation error:`, error.message);
    if (error.response) {
      console.error(`❌ Response status:`, error.response.status);
      console.error(`❌ Response data:`, error.response.data);
    }
    throw error;
  }
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
