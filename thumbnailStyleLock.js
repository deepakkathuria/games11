/**
 * Thumbnail Style Lock
 * Applies breaking news thumbnail style to prompts
 * BACKGROUND ONLY - no text, no logos, no faces
 */
function applyThumbnailStyle(scenePrompt) {
  return `
High-CTR cricket breaking news thumbnail BACKGROUND ONLY.
Photorealistic sports journalism look, cinematic stadium lighting, high contrast, dramatic shadows.
Composition: clean center subject with negative space for text overlay (we add text later).
Subject must be GENERIC: athlete silhouettes or back-view figures only.

STRICT RULES:
- NO real person likeness, no celebrity faces, no recognizable players
- NO team logos, NO jersey brand marks, NO sponsor logos
- NO readable text, NO letters, NO numbers, NO watermark
- NO flags or political symbols
- NO signage, NO banners, NO jersey numbers, NO scoreboard digits
- If any text appears, it must be blurred/unreadable
- Avoid messy typography entirely

Scene:
${scenePrompt}

Camera: shallow depth of field, crisp subject edges, cinematic color grading.
`.trim();
}

module.exports = { applyThumbnailStyle };
