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
    lower.includes("viral") || lower.includes("breaks internet") || lower.includes("trending") || lower.includes("social media") ? "viral" :
    lower.includes("mock") || lower.includes("mockery") || lower.includes("troll") || lower.includes("funny") || lower.includes("humor") ? "humor" :
    lower.includes("prediction") || lower.includes("who will win") ? "prediction" :
    lower.includes("injury") || lower.includes("ruled out") ? "injury" :
    lower.includes("ban") || lower.includes("suspension") || lower.includes("controversy") ? "controversy" :
    lower.includes("record") || lower.includes("milestone") ? "record" :
    "general";
  
  // Extract story type
  const storyType =
    lower.includes("viral video") || lower.includes("video goes viral") || lower.includes("video breaks") ? "viral_video" :
    lower.includes("press conference") || lower.includes("press meet") ? "press_conference" :
    lower.includes("match") || lower.includes("vs") || lower.includes("versus") ? "match" :
    lower.includes("injury") || lower.includes("ruled out") ? "injury" :
    lower.includes("decision") || lower.includes("announcement") ? "decision" :
    lower.includes("training") || lower.includes("practice") ? "training" :
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

  // Extract player names (common cricket players)
  const players = [];
  const playerKeywords = [
    { name: "Rohit Sharma", keywords: ["rohit", "rohit sharma", "hitman"] },
    { name: "Suryakumar Yadav", keywords: ["surya", "suryakumar", "sky", "suryakumar yadav"] },
    { name: "Virat Kohli", keywords: ["virat", "kohli", "virat kohli", "king"] },
    { name: "Jasprit Bumrah", keywords: ["bumrah", "jasprit", "jasprit bumrah"] },
    { name: "Hardik Pandya", keywords: ["hardik", "pandya", "hardik pandya"] },
    { name: "Rishabh Pant", keywords: ["pant", "rishabh", "rishabh pant"] },
    { name: "KL Rahul", keywords: ["kl rahul", "rahul", "kl"] },
    { name: "Ravindra Jadeja", keywords: ["jadeja", "ravindra jadeja", "jaddu"] },
    { name: "MS Dhoni", keywords: ["dhoni", "ms dhoni", "mahi"] },
    { name: "Shubman Gill", keywords: ["gill", "shubman", "shubman gill"] },
    { name: "Yashasvi Jaiswal", keywords: ["yashasvi", "jaiswal", "yashasvi jaiswal"] },
    { name: "Ishan Kishan", keywords: ["ishan", "kishan", "ishan kishan"] }
  ];

  playerKeywords.forEach(({ name, keywords }) => {
    if (keywords.some(k => lower.includes(k))) {
      players.push(name);
    }
  });

  return { trigger, tournament, venue, players, storyType };
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
Create 3 COMPLETELY DIFFERENT HIGH CTR visual concepts that are SPECIFIC to this article.

FIRST: Analyze the article and identify the ACTUAL story:
- What is the main event? (viral video / match / press conference / injury / controversy / record / decision)
- What is the key emotion? (humor / controversy / tension / celebration / shock)
- What is the setting? (social media / stadium / press room / training / office)
- Who are the key people mentioned? (players, officials, teams)

CRITICAL DIVERSITY RULES - Each concept MUST be visually unique:
- Concept 1: CLOSE-UP angle - Focus on ONE specific prop/object from article (phone showing video / bat/ball/helmet/trophy/microphone). Extreme close-up, dramatic lighting on single object.
- Concept 2: WIDE-ANGLE angle - Focus on silhouette action in midground with atmospheric background. Show full body silhouette, not close-up.
- Concept 3: SYMBOLIC angle - Abstract/metaphorical representation (split screen, contrast, symbolic props like broken stumps/trophy/scoreboard). Creative composition.

MANDATORY: Each concept must have:
- DIFFERENT camera angle (close-up vs wide vs symbolic)
- DIFFERENT foreground prop (don't repeat same prop)
- DIFFERENT background setting (vary the location/atmosphere)
- DIFFERENT mood/emotion (tense vs hype vs controversy)

Output must be symbolic & generic (NO real player faces).
Use silhouettes, props, appropriate settings based on article context (stadium ONLY if match-related, otherwise press room/office/training ground/hospital/social media/etc).

Signals:
Trigger: ${signals.trigger}
Story Type: ${signals.storyType}
Tournament: ${signals.tournament}
Venue: ${signals.venue}
Players mentioned: ${signals.players.length > 0 ? signals.players.join(", ") : "None"}

IMPORTANT: Read the article CAREFULLY and extract DIFFERENT elements for each concept:
- Concept 1: Extract ONE specific moment/prop/object from article (e.g., if article is about viral video → phone/screen showing video moment, NOT generic press conference)
- Concept 2: Extract a DIFFERENT moment/action/emotion from article (e.g., if article is about mockery → laughing gesture/split screen contrast, NOT generic action)
- Concept 3: Extract a DIFFERENT symbolic/metaphorical element from article (e.g., if article is about controversy → split screen/tension, NOT generic symbol)

CRITICAL: Match the ACTUAL article story:
- If article is about "viral video" → use phone/screen/mobile device, NOT press conference
- If article is about "mockery/humor" → use laughing gesture/contrast/split screen, NOT generic cricket action
- If article is about "controversy" → use tension/split screen/contrast, NOT celebration
- If article is about "match" → use stadium/cricket props, NOT office/press room
- If article is about "injury" → use hospital/training ground, NOT stadium

DO NOT create generic concepts! Match the EXACT article context!

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
        "foreground":"For Concept 1: ONE specific prop (extreme close-up). For Concept 2: Different prop or empty. For Concept 3: Symbolic prop. Choose DIFFERENT props for each concept (bat/ball/stumps/helmet/gloves/microphone/trophy/scoreboard/document/phone). If player mentioned, use their signature prop/style. Be specific and UNIQUE per concept.",
        "midground":"For Concept 1: Minimal or empty (close-up focus). For Concept 2: Full silhouette action. For Concept 3: Symbolic/metaphorical silhouette. Choose DIFFERENT actions for each concept (batting shot / bowler delivery / fielding / press conference / office meeting / hospital / training ground). If player mentioned, use their signature pose/style. Must be DIFFERENT per concept.",
        "background":"For Concept 1: Simple/bokeh background. For Concept 2: Full atmospheric setting. For Concept 3: Contrasting/symbolic background. Vary the setting (stadium/press room/office/training ground/hospital/outdoor/indoor). If player mentioned, use their team colors subtly. MUST be DIFFERENT per concept."
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

CRITICAL: Read the article and create 3 VISUALLY DISTINCT concepts:
- Different camera angles (close-up / wide / symbolic)
- Different props (don't repeat)
- Different backgrounds (vary locations)
- Different moods (vary emotions)
- Different compositions (don't copy same structure)

If you create similar concepts, the system will reject them. Be creative and diverse!
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

  // Clean and parse JSON with error handling
  let cleanedRaw = raw.trim();
  
  // Remove markdown code blocks if present
  if (cleanedRaw.startsWith("```json")) {
    cleanedRaw = cleanedRaw.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (cleanedRaw.startsWith("```")) {
    cleanedRaw = cleanedRaw.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  
  // Try to extract JSON if there's extra text
  const jsonMatch = cleanedRaw.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleanedRaw = jsonMatch[0];
  }

  let plan;
  try {
    plan = JSON.parse(cleanedRaw);
  } catch (parseError) {
    console.error("❌ JSON Parse Error:");
    console.error("Raw response:", raw);
    console.error("Cleaned response:", cleanedRaw);
    console.error("Parse error:", parseError.message);
    console.error("Position:", parseError.message.match(/position (\d+)/)?.[1] || "unknown");
    
    // Try to fix common JSON issues
    try {
      // Fix trailing commas
      cleanedRaw = cleanedRaw.replace(/,(\s*[}\]])/g, '$1');
      // Fix missing quotes on keys
      cleanedRaw = cleanedRaw.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
      plan = JSON.parse(cleanedRaw);
      console.log("✅ JSON fixed and parsed successfully");
    } catch (fixError) {
      console.error("❌ JSON fix failed:", fixError.message);
      throw new Error(`Invalid JSON from LLM: ${parseError.message}. Raw: ${raw.substring(0, 200)}...`);
    }
  }

  if (!plan.concepts || plan.concepts.length !== 3) {
    console.error("❌ Invalid plan structure:");
    console.error("Plan:", JSON.stringify(plan, null, 2));
    throw new Error(`Visual plan invalid: expected 3 concepts, got ${plan.concepts?.length || 0}`);
  }

  // Log plan for debugging
  console.log("PLAN_JSON:", JSON.stringify(plan, null, 2));

  return plan;
}

module.exports = { createVisualStoryPlan };
