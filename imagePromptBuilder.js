const { applyThumbnailStyle } = require("./thumbnailStyleLock");

/**
 * Convert 3 visual story concepts into image generation prompts
 * Returns: 3 prompts (1 per concept, 1:1 size only)
 * Overlay text is NOT injected into prompt - only in metadata for frontend
 */
function buildImagePromptsFromStory(plan) {
  const prompts = [];
  const meta = [];

  plan.concepts.forEach((c, idx) => {
    const conceptIndex = idx + 1;
    const scene = (c.scene || c.scene_prompt || "").trim();
    const overlay = (c.overlay || c.headline_overlay || "").trim();

    // Build prompt from scene ONLY (no overlay text in prompt)
    const finalPrompt = applyThumbnailStyle(scene);

    prompts.push(finalPrompt);
    meta.push({
      conceptIndex,
      dimensions: "1024x1024",
      sizeLabel: "1:1",
      overlay,          // ✅ frontend will use this (NOT in prompt)
      angle: c.angle || "",
      keywords: c.keywords || [],
      scene_type: c.angle || "action"
    });
  });

  return { prompts, meta };
}

module.exports = { buildImagePromptsFromStory };
