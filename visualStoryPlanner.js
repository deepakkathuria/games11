const axios = require("axios");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";

/**
 * CHATGPT STYLE VISUAL STORY ENGINE
 * 
 * Output:
 * - 3 high CTR thumbnail concepts
 * - Marketing + emotional + story angle optimized
 */
async function createVisualStoryPlan(article) {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY missing");

  const title = article.title || "";
  const description = (article.description || "").slice(0, 400);
  const content = (article.content || "").slice(0, 1800);

  const prompt = `
You are a senior sports news thumbnail strategist.

Your job:
Create 3 HIGH CTR visual story concepts for cricket news thumbnails.

Focus on:
- Emotional trigger
- Controversy or tension
- Breaking news visual language
- Facebook click psychology

CRITICAL RULES:
- No real person likeness
- Use generic cricketer silhouettes or symbolic visuals
- Avoid weapons, blood, injury, hate content

Return ONLY valid JSON:

{
  "concepts": [
    {
      "angle": "emotional moment | controversy reveal | debate angle",
      "headline_overlay": "max 6 words",
      "scene_prompt": "Highly detailed 60-90 word cinematic thumbnail description"
    }
  ]
}

Article:
Title: ${title}
Description: ${description}
Content: ${content}
`.trim();

  const response = await axios.post(
    OPENAI_CHAT_URL,
    {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Return ONLY valid JSON." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 800,
      response_format: { type: "json_object" }
    },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      timeout: 40000
    }
  );

  const raw = response?.data?.choices?.[0]?.message?.content;
  if (!raw) throw new Error("No visual plan returned");

  const plan = JSON.parse(raw);

  if (!plan.concepts || plan.concepts.length !== 3)
    throw new Error("Visual plan invalid");

  return plan;
}

module.exports = { createVisualStoryPlan };
