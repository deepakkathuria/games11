/**
 * Thumbnail Style Lock
 * Applies breaking news thumbnail style to prompts
 * BACKGROUND ONLY - no text, no logos, no faces
 */
function applyThumbnailStyle(scenePrompt) {
  console.log("STYLELOCK_VERSION=2026-02-06-01");
  
  return `
Photorealistic sports NEWS photography (not illustration, not poster).
Cinematic contrast, shallow depth of field, dramatic lighting.
Must have ONE sharp foreground hero object + ONE midground silhouette action.
Background setting should match the article context (stadium/press room/office/training ground/etc).

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
