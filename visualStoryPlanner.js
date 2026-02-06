const axios = require("axios");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";

/**
 * Extract signals from article (trigger type, tournament)
 */
function extractSignals(article) {
  const t = (article.title || "") + " " + (article.description || "") + " " + (article.content || "");
  const lower = t.toLowerCase();

  const trigger =
    lower.includes("prediction") || lower.includes("who will win") ? "prediction" :
    lower.includes("injury") || lower.includes("ruled out") ? "injury" :
    lower.includes("ban") || lower.includes("suspension") || lower.includes("controversy") ? "controversy" :
    lower.includes("record") || lower.includes("milestone") ? "record" :
    "general";

  const tournament =
    lower.includes("t20 world cup") ? "T20 World Cup" :
    lower.includes("ipl") ? "IPL" :
    lower.includes("odi") ? "ODI" :
    lower.includes("test") ? "Test" :
    "Cricket";

  const venue =
    lower.includes("wankhede") ? "Wankhede Stadium, Mumbai" :
    lower.includes("eden gardens") ? "Eden Gardens, Kolkata" :
    lower.includes("narendra modi stadium") ? "Narendra Modi Stadium, Ahmedabad" :
    lower.includes("chinnaswamy") ? "M. Chinnaswamy Stadium, Bangalore" :
    lower.includes("chepauk") ? "MA Chidambaram Stadium, Chennai" :
    lower.includes("arun jaitley") ? "Arun Jaitley Stadium, Delhi" :
    "cricket stadium";

  return { trigger, tournament, venue };
}

/**
 * CHATGPT STYLE VISUAL STORY ENGINE
 * 
 * Output:
 * - 3 high CTR thumbnail concepts
 * - Symbolic & article-specific (NO real person likeness, NO logos, NO text)
 */
async function createVisualStoryPlan(article) {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY missing");

  const title = (article.title || "").slice(0, 180);
  const description = (article.description || "").slice(0, 500);
  const content = (article.content || "").slice(0, 1800);
  
  // Extract signals for better context
  const signals = extractSignals(article);

  const prompt = `
You are a senior sports news thumbnail strategist.
Create 3 DISTINCT HIGH CTR visual concepts that are SPECIFIC to this article.

CRITICAL: Each concept must be DIFFERENT:
- Concept 1: Focus on a specific moment/action from the article
- Concept 2: Focus on a different angle (controversy/emotion/impact)
- Concept 3: Focus on a symbolic/metaphorical representation

Output must be symbolic & generic (NO real player faces).
Use only silhouettes, props, stadium, scoreboard glow, crowd blur, dramatic lighting.

Signals:
Trigger: ${signals.trigger}
Tournament: ${signals.tournament}
Venue: ${signals.venue}

IMPORTANT: Read the article carefully and extract:
- Specific match situation (batting/bowling/fielding/press conference)
- Key emotions (tension/excitement/controversy/celebration)
- Unique story elements (injury/record/decision/clash)

STRICT:
- NO real person likeness or recognizable players
- NO team logos, NO jersey brands, NO sponsor marks
- NO readable text/letters/numbers inside the image (we add text later in frontend)
- No violence, no gore

Return ONLY valid JSON:
{
  "concepts":[
    {
      "angle":"specific angle from article (e.g., 'batting collapse', 'bowler celebration', 'press conference tension')",
      "overlay":"MAX 4 words (for frontend overlay only)",
      "scene_template":{
        "foreground":"ONE specific prop related to article (bat/ball/stumps/helmet/gloves/microphone/trophy/scoreboard/document/phone). Be specific based on article context.",
        "midground":"ONE specific silhouette action from article (batting shot / bowler delivery / fielding / press conference / office meeting / hospital / training ground). Must match article story location.",
        "background":"Appropriate setting based on article (stadium ONLY if match-related, otherwise: press room / office / training ground / hospital / outdoor field / indoor hall / conference room). Match the actual article context."
      },
      "mood":"one of [tense, hype, controversy, celebration, pressure, dramatic, suspenseful] - must match article emotion",
      "keywords":["extract actual team names or colors","extract venue if specific","tournament","specific emotion from article"]
    }
  ]
}

Article:
Title: ${title}
Description: ${description}
Content: ${content}

Remember: Each concept must be UNIQUE and article-specific. Don't repeat the same composition.
`.trim();

  const resp = await axios.post(
    OPENAI_CHAT_URL,
    {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Return ONLY valid JSON." },
        { role: "user", content: prompt }
      ],
      temperature: 0.85,
      max_tokens: 1200,
      response_format: { type: "json_object" }
    },
    {
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
      timeout: 45000
    }
  );

  const raw = resp?.data?.choices?.[0]?.message?.content;
  if (!raw) throw new Error("No visual plan returned");

  const plan = JSON.parse(raw);
  if (!plan.concepts || plan.concepts.length !== 3) throw new Error("Visual plan invalid");

  // Log plan for debugging
  console.log("PLAN_JSON:", JSON.stringify(plan, null, 2));

  return plan;
}

module.exports = { createVisualStoryPlan };
