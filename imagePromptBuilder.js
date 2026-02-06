const { applyThumbnailStyle } = require("./thumbnailStyleLock");

/**
 * Convert 3 visual story concepts into image generation prompts
 * Returns: 6 prompts (3 concepts × 2 sizes: 1024x1024 and 1024x1536)
 */
function buildImagePromptsFromStory(plan) {
  const prompts = [];
  const meta = [];

  plan.concepts.forEach((concept, idx) => {
    const conceptIndex = idx + 1;
    const scenePrompt = concept.scene_prompt || concept.prompt || "";
    const headlineOverlay = concept.headline_overlay || "";

    // 1:1 Square (1024x1024) - Best for Facebook feed
    const squarePrompt = applyThumbnailStyle(scenePrompt, headlineOverlay);
    prompts.push(squarePrompt);
    meta.push({
      conceptIndex,
      sizeLabel: "1:1",
      dimensions: "1024x1024",
      headline_overlay: headlineOverlay,
      scene_type: concept.angle || "action",
      angle: concept.angle
    });

    // 4:5 Portrait (1024x1536) - Vertical format
    const portraitPrompt = applyThumbnailStyle(
      `${scenePrompt} Vertical portrait composition, tall format.`,
      headlineOverlay
    );
    prompts.push(portraitPrompt);
    meta.push({
      conceptIndex,
      sizeLabel: "4:5",
      dimensions: "1024x1536",
      headline_overlay: headlineOverlay,
      scene_type: concept.angle || "action",
      angle: concept.angle
    });
  });

  return { prompts, meta };
}

module.exports = { buildImagePromptsFromStory };
