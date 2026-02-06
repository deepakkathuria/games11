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
You are a sports news thumbnail art director. Analyze this cricket article and create EXACTLY 3 story-specific image concepts.

CRITICAL: Each image MUST be directly related to THIS SPECIFIC ARTICLE'S story, characters, events, or themes. NO generic cricket images.

ANALYZE THE ARTICLE FIRST:
- What is the MAIN story/event?
- Who are the key people/teams mentioned?
- What is the controversy/decision/action?
- What emotions/themes are present?

CREATE 3 DISTINCT CONCEPTS (each must reflect different aspect of THIS article):

Concept 1: PRIMARY STORY MOMENT
- Visualize the main event/action from the article
- Must reference specific story elements (team names, situation, context)
- Example: If article is about "Pakistan boycotting India match" → show boycott/protest scene, NOT generic cricket

Concept 2: KEY DECISION/AUTHORITY ANGLE  
- Show the decision-making, authority, or inside story aspect
- Reference specific organizations/people mentioned (as silhouettes/generic)
- Example: If article mentions "ICC decision" → show boardroom/decision scene related to THIS story

Concept 3: EMOTIONAL/DEBATE ANGLE
- Capture the debate, conflict, or emotional impact
- Show split-screen, contrast, or symbolic representation of THIS story's conflict
- Example: If article is about "fans divided" → show divided opinion visual related to THIS specific issue

RULES:
- Each concept MUST reference THIS article's specific story elements (team names, player names as "Player X", specific events, exact controversy)
- Include specific details from the article: team colors, stadium settings, specific situations mentioned
- Avoid real-person likeness: use "generic cricketer", "silhouette", "senior official (not identifiable)", "Player X"
- No weapons, blood, injury, gore, hate symbols
- Each prompt should be 80-120 words, VERY DETAILED, describing the EXACT scene with specific article context
- Mention specific teams, situations, controversies from THIS article

Return JSON EXACTLY in this format:
{
  "concepts": [
    { "headline_overlay": "max 6 words related to THIS story", "scene_type": "action|institutional|portrait|symbolic|split", "prompt": "80-120 words VERY DETAILED prompt with specific article context: mention exact teams, players (as generic), situations, controversies from THIS article. Describe the exact scene, setting, emotions, and story elements." },
    { "headline_overlay": "max 6 words related to THIS story", "scene_type": "action|institutional|portrait|symbolic|split", "prompt": "80-120 words VERY DETAILED prompt with specific article context: mention exact teams, players (as generic), situations, controversies from THIS article. Describe the exact scene, setting, emotions, and story elements." },
    { "headline_overlay": "max 6 words related to THIS story", "scene_type": "action|institutional|portrait|symbolic|split", "prompt": "80-120 words VERY DETAILED prompt with specific article context: mention exact teams, players (as generic), situations, controversies from THIS article. Describe the exact scene, setting, emotions, and story elements." }
  ]
}

ARTICLE TO ANALYZE:
Title: ${title}
Description: ${description}
Full Content: ${content}

Remember: Each image concept MUST be story-specific to THIS article, NOT generic cricket.
`.trim();

  const resp = await axios.post(
    OPENAI_CHAT_URL,
    {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Return ONLY valid JSON. No extra text." },
        { role: "user", content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 1800,
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
