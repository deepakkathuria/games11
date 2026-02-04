// visualPlan.js
const axios = require("axios");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";

function safeSlice(str, n) {
  if (!str) return "";
  return str.length > n ? str.slice(0, n) : str;
}

/**
 * Create 3 story-specific thumbnail concepts for ANY cricket article
 * Returns: { concepts: [ {headline_overlay, scene_type, prompt}, ...x3 ] }
 */
async function createVisualPlan(article) {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY missing");

  const title = article.title || "";
  const description = safeSlice(article.description || "", 500);
  const content = safeSlice(article.content || "", 1800);

  const prompt = `
You are a sports news thumbnail art director.

Create EXACTLY 3 distinct image concepts for this article as VALID JSON ONLY.

Rules:
- Must be directly tied to the story (NOT generic cricket).
- Avoid real-person likeness: use silhouettes, generic cricketer, symbolic visuals, or "senior official (not identifiable)".
- No violence depiction: no weapons, blood, injury, gore, hate symbols.
- Each concept should be a different angle:
  1) Primary story moment
  2) Authority/decision/inside story vibe
  3) Debate/split-screen or symbolic contrast

Return JSON EXACTLY in this format:
{
  "concepts": [
    { "headline_overlay": "max 6 words", "scene_type": "institutional|portrait|symbolic|action|split", "prompt": "50-90 words detailed prompt" },
    { "headline_overlay": "max 6 words", "scene_type": "institutional|portrait|symbolic|action|split", "prompt": "50-90 words detailed prompt" },
    { "headline_overlay": "max 6 words", "scene_type": "institutional|portrait|symbolic|action|split", "prompt": "50-90 words detailed prompt" }
  ]
}

Article:
Title: ${title}
Description: ${description}
Content: ${content}
`.trim();

  const resp = await axios.post(
    OPENAI_CHAT_URL,
    {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Return ONLY valid JSON. No extra text." },
        { role: "user", content: prompt }
      ],
      temperature: 0.6,
      max_tokens: 900,
      response_format: { type: "json_object" }
    },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      timeout: 45000
    }
  );

  const raw = resp?.data?.choices?.[0]?.message?.content;
  if (!raw) throw new Error("No visual plan returned");

  const plan = JSON.parse(raw);
  if (!plan.concepts || plan.concepts.length !== 3) throw new Error("Visual plan invalid");

  return plan;
}

module.exports = { createVisualPlan };
