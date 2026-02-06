/**
 * Thumbnail Style Lock
 * Applies breaking news thumbnail style to prompts
 */
function applyThumbnailStyle(prompt, overlayText) {
  return `
Breaking news cricket thumbnail,
sports journalism realism,
dramatic high contrast lighting,
cinematic stadium atmosphere,
professional sports photography,
clean composition with empty headline space,
ultra sharp, social media optimized,
NO blood, NO weapons, NO injury, NO real person likeness.

${prompt}

Headline overlay text:
"${overlayText}"
`.trim();
}

module.exports = { applyThumbnailStyle };
