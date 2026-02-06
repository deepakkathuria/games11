/**
 * Thumbnail Style Lock
 * Applies breaking news thumbnail style to prompts
 * BACKGROUND ONLY - no text, no logos, no faces
 */
function applyThumbnailStyle(scenePrompt) {
  console.log("STYLELOCK_VERSION=2026-02-06-01");
  
  return `
Photorealistic sports NEWS photography (not illustration, not poster).
Cricket stadium at night under floodlights, cinematic contrast, shallow depth of field.
Must have ONE sharp foreground hero object + ONE midground silhouette action.
Background: blurred crowd + bokeh stadium lights + smoky atmosphere.

STRICT:
- No faces, no real person likeness
- No logos, no readable text/letters/numbers
- No flags, no political symbols
- No jersey numbers, no sponsor marks
- If any text appears anywhere, it must be fully blurred and unreadable

Scene:
${scenePrompt}
`.trim();
}

module.exports = { applyThumbnailStyle };
