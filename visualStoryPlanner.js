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
Create 3 HIGH CTR visual concepts that are SPECIFIC to the article.

Output must be symbolic & generic (NO real player faces).
Use only silhouettes, props, stadium, scoreboard glow, crowd blur, dramatic lighting.

Signals:
Trigger: ${signals.trigger}
Tournament: ${signals.tournament}
Venue: ${signals.venue}

STRICT:
- NO real person likeness or recognizable players
- NO team logos, NO jersey brands, NO sponsor marks
- NO readable text/letters/numbers inside the image (we add text later in frontend)
- No violence, no gore

Return ONLY valid JSON:
{
  "concepts":[
    {
      "angle":"short angle name",
      "overlay":"MAX 4 words (for frontend overlay only)",
      "scene_template":{
        "foreground":"ONE clear prop (bat/ball/stumps/helmet/gloves/microphone)",
        "midground":"ONE generic silhouette action (batting shot / bowler run-up / fielding dive / press conference pose)",
        "background":"stadium at night under floodlights, blurred crowd, smoky atmosphere, bokeh lights, no readable text"
      },
      "mood":"one of [tense, hype, controversy, celebration, pressure]",
      "keywords":["team1","team2","venue","tournament","emotion"]
    }
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
        { role: "system", content: "Return ONLY valid JSON." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 900,
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
