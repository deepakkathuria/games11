// // server/prepublish.js
// const axios = require('axios');

// const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
// const DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1/chat/completions";

// async function generateWithDeepSeek(prompt, options = {}) {
//   const resp = await axios.post(
//     DEEPSEEK_BASE_URL,
//     {
//       model: "deepseek-chat",
//       messages: [{ role: "user", content: prompt }],
//       temperature: options.temperature ?? 0.7,
//       max_tokens: options.max_tokens ?? 2000,
//     },
//     {
//       headers: {
//         Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
//         "Content-Type": "application/json",
//       },
//       timeout: 60000,
//     }
//   );
//   return resp.data.choices?.[0]?.message?.content || "";
// }

// // ---------- PROMPTS ----------
// function buildPrePublishPrompt({ title, description, body }) {
//   return `
// You are an SEO editor for a cricket news site. 
// First produce pre-publish recommendations ONLY (no article body yet).

// HARD RULES
// - Use ONLY facts from the input. Do NOT invent scores, quotes, dates, venues.
// - Return clean, concise recommendations.
// - English output.
// - No markdown headings like ##; use plain labels.

// INPUT
// Title: ${title || ""}
// Description: ${description || ""}
// Body:
// ${body || ""}

// TASKS (return in this order, exact labels):

// 1) RECOMMENDED TITLE:
// 2) RECOMMENDED META DESCRIPTION:
// 3) RECOMMENDED SLUG:
// 4) OUTLINE:
// - H2: ...
// - H3: ...
// 5) KEYWORDS:
// - Primary: ...
// - Secondary: ...
// 6) FACTS CHECKLIST:
// - final score: present/absent
// - target: present/absent
// - overs: present/absent
// - top scorers: present/absent
// - wickets: present/absent
// - venue: present/absent
// - date: present/absent
// - toss: present/absent
// - result: present/absent
// 7) QUALITY FLAGS:
// - ...
// 8) VERDICT: OK / REVIEW / BLOCK + one-line reason
// `.trim();
// }

// function buildRewriteToSpecPrompt({
//   rawTitle, rawDescription, rawBody,
//   recTitle, recMeta, recSlug, recOutline, recPrimary, recSecondary
// }) {
//   return `
// You are a cricket news copy editor. 
// Rewrite the article EXACTLY following the approved pre-publish recommendations.

// HARD RULES
// - Do NOT invent facts. Use only what exists in the raw content.
// - If a fact is missing, omit it naturally (do not guess).
// - Output format: plain text paragraphs (no markdown lists, no ###).
// - Keep newsroom tone: clear lede, tight pacing, factual with light color.

// INPUTS
// A) RAW MATERIAL
// Title: ${rawTitle || ""}
// Description: ${rawDescription || ""}
// Body:
// ${rawBody || ""}

// B) APPROVED RECOMMENDATIONS
// - Title: ${recTitle || ""}
// - Meta: ${recMeta || ""}
// - Slug: ${recSlug || ""}
// - Outline:
// ${recOutline || ""}
// - Keywords:
//   Primary: ${recPrimary || ""}
//   Secondary: ${recSecondary || ""}

// OUTPUT (in this exact order)
// 1) FINAL TITLE: ${recTitle || ""}
// 2) FINAL META DESCRIPTION: ${recMeta || ""}
// 3) FINAL SLUG: ${recSlug || ""}
// 4) BODY:
// {Rewrite the article into 5–9 paragraphs. 
// Insert H2/H3 headings as plain lines preceding paragraphs, e.g.,
// H2: Match Summary
// H3: Key Moments
// Make sure headings match the recommended outline wording.
// Do not add facts that are not in RAW MATERIAL.}
// `.trim();
// }

// // ---------- PARSER ----------
// function parsePrePublishTextToJSON(text) {
//   const get = (regex) => (text.match(regex) || [])[1]?.trim() || "";

//   const recommendedTitle = get(/RECOMMENDED TITLE:\s*([\s\S]*?)(?:\n[A-Z0-9\)]|$)/i);
//   const recommendedMeta  = get(/RECOMMENDED META DESCRIPTION:\s*([\s\S]*?)(?:\n[A-Z0-9\)]|$)/i);
//   const recommendedSlug  = get(/RECOMMENDED SLUG:\s*([\s\S]*?)(?:\n[A-Z0-9\)]|$)/i);
//   const outline          = get(/OUTLINE:\s*([\s\S]*?)(?:\n5\)|\nKEYWORDS:|\n[A-Z]|$)/i);
//   const primary          = get(/Primary:\s*([^\n]+)/i);
//   const secondary        = get(/Secondary:\s*([^\n]+)/i);
//   const factsChecklist   = get(/FACTS CHECKLIST:\s*([\s\S]*?)(?:\n7\)|\nQUALITY FLAGS:|\n[A-Z]|$)/i);
//   const qualityFlags     = get(/QUALITY FLAGS:\s*([\s\S]*?)(?:\n8\)|\nVERDICT:|\n[A-Z]|$)/i);
//   const verdict          = get(/VERDICT:\s*([^\n]+)/i);

//   return {
//     recommendedTitle,
//     recommendedMeta,
//     recommendedSlug: (recommendedSlug || "").toLowerCase().replace(/\s+/g, '-'),
//     outline,
//     keywords: {
//       primary,
//       secondary
//     },
//     factsChecklist,
//     qualityFlags,
//     verdict
//   };
// }

// module.exports = {
//   generateWithDeepSeek,
//   buildPrePublishPrompt,
//   buildRewriteToSpecPrompt,
//   parsePrePublishTextToJSON,
// };
// server/prepublish.js
const axios = require("axios");

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1/chat/completions";

async function generateWithDeepSeek(prompt, options = {}) {
  try {
    console.log('🤖 DeepSeek API call started...');
    console.log('📊 Temperature:', options.temperature ?? 0.5);
    console.log('📝 Max tokens:', options.max_tokens ?? 2000);
    
    const resp = await axios.post(
      DEEPSEEK_BASE_URL,
      {
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: options.temperature ?? 0.5,
        max_tokens: options.max_tokens ?? 2000,
      },
      {
        headers: {
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 120000, // Increased to 120 seconds (2 minutes) for longer articles
      }
    );
    
    const content = resp.data?.choices?.[0]?.message?.content || "";
    console.log('✅ DeepSeek API call completed, content length:', content.length);
    return content;
  } catch (error) {
    console.error('❌ DeepSeek API error:', error.message);
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout - article generation took too long. Try again.');
    }
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      throw new Error(`DeepSeek API error: ${error.response.data?.error?.message || error.message}`);
    }
    throw error;
  }
}

/* ---------- PROMPTS ---------- */

function buildPrePublishPrompt({ title, description, body }) {
  return `
You are an English cricket journalist and SEO editor. Analyze this cricket news and provide SEO recommendations.

Return ONLY these fields in plain text (no JSON, no markdown). Keep each on a single line except Outline which can be multiple lines.

1) RECOMMENDED TITLE:
2) RECOMMENDED META DESCRIPTION:
3) RECOMMENDED SLUG: (kebab-case, short)
4) OUTLINE: (use lines like "H2: ..." and "H3: ...")
5) KEYWORDS:
- Primary: ...
- Secondary: ...

RULES FOR CRICKET NEWS:
- Use ONLY facts from input (no invented scores/quotes/dates/venues).
- Make title engaging and cricket-specific (include team names, match type, key result)
- Meta description should highlight the main cricket story
- Outline should follow cricket journalism structure (Match Summary, Key Moments, Player Performances, What's Next)
- English output.
- Be concise but engaging.

INPUT
Title: ${title || ""}
Description: ${description || ""}
Body:
${body || ""}
`.trim();
}

function buildRewriteBodyHtmlPrompt({
  rawTitle,
  rawDescription,
  rawBody,
  recTitle,
  recMeta,
  recOutline,
  recPrimary,
  recSecondary,
}) {
  return `
You are an English cricket journalist writing an original article. Your goal is to create unique, human-sounding content that passes plagiarism checks and AI detection tools.

CRITICAL: ANTI-AI DETECTION & ANTI-PLAGIARISM RULES:
1. Write 100% ORIGINAL content - completely rewrite in your own words
2. NEVER copy phrases or sentences from the raw material directly
3. AVOID REPETITIVE PHRASING - Don't repeat same sentence patterns
4. VARY YOUR TONE - Mix excited, casual, serious, surprised tones randomly
5. ADD IMPERFECTIONS: Minor grammar quirks, incomplete thoughts, sudden topic shifts
6. Use UNEXPECTED word choices - Don't be predictable or smooth
7. BREAK PERFECT STRUCTURE - Not every paragraph needs smooth transitions
8. Add REAL HUMAN MESS: "wait what?", "hang on", "you know", "like I said"
9. DON'T be overly balanced - Take a side, show bias, be opinionated
10. Include TYPOS or informal spellings occasionally: "gonna", "wanna", "coz"
11. AVOID smooth AI flow - Make it a bit rough, like natural speech
12. Mix paragraph lengths WILDLY (some 1 line, some 8 lines)
13. Don't explain everything perfectly - humans skip details sometimes
14. Add EMOTIONAL variance - not same calm tone throughout

LANGUAGE REQUIREMENTS:
- Use SIMPLE ENGLISH only (10th class/grade 10 level)
- Avoid complex vocabulary and difficult words
- Use short, easy-to-understand sentences
- Write like you're explaining cricket to a friend in 10th standard
- NO fancy or sophisticated words

STRICTLY FOLLOW THE SEO OUTLINE:
${recOutline || ""}

IMPORTANT: You MUST follow the exact H2 and H3 headings from the outline above.
- Use the EXACT heading text provided in the outline
- Structure your article according to this outline
- Don't skip any sections from the outline
- Don't add extra sections not in the outline

WRITING STYLE (REAL JOURNALISM - ChatGPT-Proof):
1. Write like a cricket reporter on DEADLINE - sharp, factual, some rough edges
2. DON'T STRUCTURE NEATLY: AI does Topic A→B→C→D. You mix topics, circle back, be messy
3. USE LOTS OF QUOTES: Real journalism = 40% quotes, 60% narration. Include attributed statements
4. NEVER REPEAT SIMILAR PHRASES: Used "serious questions"? Don't use "point of serious discussion"
5. BREAK BALANCED COVERAGE: Spend 200 words on one angle, 30 on another - NOT equal weight
6. MAKE ABRUPT TOPIC CHANGES: Don't always smoothly transition - sometimes just start new point
7. AVOID AI TRANSITION CLICHÉS: No "So where does X go?", "The path forward", "At the end of day"
8. BE OPINIONATED IN PLACES: Balanced tone = AI. Have some edge, take subtle stance
9. VARY PACING WILDLY: Fast brief paragraph, then slow detailed one, then fast again - NOT even
10. Use DIRECT LANGUAGE: "Pakistan lost badly" not "Pakistan faced defeat in challenging circumstances"
11. Include SPECIFIC DETAILS: Scores, names, dates, venues - not vague generalities
12. DON'T POLISH TOO MUCH: Real deadline writing has minor rough spots - AI is too smooth
13. QUOTE-HEAVY SECTIONS: Some paragraphs should be mostly quotes with brief context
14. UNEVEN DEPTH: Detail one incident heavily, mention another in passing - NOT systematic coverage
15. NO FORMULAIC PATTERNS: AI loves pattern. Break it - some sections long, some tiny
16. Use SHORT PUNCHY SENTENCES mixed with longer analytical ones - NOT uniform length
17. Include NUMBERS and STATS: Real sports writing is data-heavy
18. ATTRIBUTE EVERYTHING: "Sources said", "According to reports", "X told reporters" - be journalistic
19. DON'T COVER ALL ANGLES: Real reporters miss things, focus on some aspects, brief on others
20. Sound URGENT and FACTUAL like breaking news, NOT polished essay

STRICT ANTI-AI DETECTION RULES (ChatGPT-Proof):
- NO markdown formatting (no **, *, #, etc.)
- NEVER REPEAT SIMILAR PHRASES: AI loves "serious questions", "point of serious discussion", 
  "tough request", "critical step" - if you use one phrase, don't use similar ones!
- BANNED AI TRANSITION FILLERS: "So where does X go from here?", "The path forward is not simple",
  "At the end of the day", "Moving forward", "Going forward" - these are AI favorites!
- DON'T OVER-STRUCTURE: AI neatly divides sections (topic A → topic B → topic C). 
  Be MESSY - jump between topics, mention something, come back to it later
- AVOID BALANCED TONE: AI gives equal weight to every angle. BE UNBALANCED - spend 
  250 words on one point, 40 words on another
- DON'T MAKE SMOOTH TRANSITIONS: AI uses perfect bridges between paragraphs. Sometimes 
  just START new topic abruptly without transition
- VARY PACING: Some paragraphs fast/brief, some slow/detailed - NOT even pacing throughout
- USE DIRECT QUOTES: Real journalism has lots of quotes. Include attributed statements
- DON'T GIVE EQUAL COVERAGE: AI covers Person A (100w), Person B (100w), Event C (100w) evenly.
  Be random: Person A (200w), Person B (30w), skip Event C or mention briefly
- BANNED REPETITIVE WORDS: If you use "serious" once, don't use it again. Same with 
  "critical", "crucial", "important", "significant" - AI repeats these!
- Use SIMPLE ENGLISH (10th class level) but with SHARP, OPINIONATED edge
- Use ONLY facts from raw material (NO invented scores/quotes/dates)
- Sound like a REAL cricket reporter writing under deadline, NOT polished AI essay
- Be UNEVEN, SHARP, QUOTE-HEAVY like actual sports journalism

HTML FORMAT:
- Return **HTML BODY ONLY** (no <html>, no <head>, no <body> tags)
- Use: <h1>, <h2>, <h3>, <p>, <ul>, <li>, <blockquote>, <strong>, <em>
- Start with <h1>${recTitle || ""}</h1>
- Use EXACT H2 and H3 headings from the outline above
- Write natural flowing paragraphs
- Use <strong> for player names and important stats
- Use <ul><li> only for listing multiple stats

TARGET SEO KEYWORDS (use naturally in content):
Primary: ${recPrimary || ""}
Secondary: ${recSecondary || ""}

Raw Cricket Material (REWRITE COMPLETELY - DON'T COPY):
Title: ${rawTitle || ""}
Description: ${rawDescription || ""}
Body:
${rawBody || ""}

OUTPUT INSTRUCTIONS (ChatGPT-PROOF):
Write a deadline-style cricket news article that:
✓ Sounds like a REAL REPORTER wrote it under time pressure (NOT polished AI)
✓ Passes ChatGPT detector, GPTZero, Originality.ai (all AI detection tools)
✓ Passes plagiarism checkers (100% original rewrite)
✓ Follows SEO outline but MESSILY - jump topics, come back to them, uneven depth
✓ Uses simple 10th class English but SHARP, direct news language
✓ Is 800-1200 words with UNEVEN pacing (fast→slow→fast, NOT uniform)
✓ Includes LOTS OF QUOTES (40% quoted content, 60% narration)
✓ NEVER repeats similar phrases (no "serious questions" + "point of serious discussion")
✓ NO AI transition clichés ("So where does X go?", "The path forward is not simple")
✓ Gives UNBALANCED coverage (250 words here, 40 words there - NOT equal)
✓ Makes ABRUPT topic changes (don't always transition smoothly)
✓ Includes SPECIFIC data (scores, stats, dates, venues)
✓ Uses ATTRIBUTION ("sources said", "according to", "X told reporters")
✓ Has minor ROUGH EDGES (real deadline writing isn't AI-polished)

CRITICAL - AVOID THESE AI PATTERNS:
❌ Neatly structured sections (Topic A→B→C→D evenly covered)
❌ Balanced tone giving equal weight to everything
❌ Phrase repetition ("serious", "critical", "important" used multiple times)
❌ Smooth generic transitions between all paragraphs
❌ Polished formulaic writing

✅ WRITE LIKE THIS INSTEAD:
✓ Messy structure - jump topics, circle back
✓ Unbalanced - deep dive one point, brief mention another
✓ Each phrase used ONCE only
✓ Abrupt changes, not always smooth
✓ Rough, urgent, quote-heavy like real breaking news

Start writing now - just the HTML body content, nothing else.
`.trim();
}

/* ---------- PARSERS & HELPERS ---------- */

function parsePrePublishTextToJSON(text = "") {
  const get = (re) => {
    const m = text.match(re);
    return m ? m[1].trim() : "";
  };

  let recommendedTitle = get(/RECOMMENDED TITLE:\s*([^\n]+)/i);
  let recommendedMeta  = get(/RECOMMENDED META DESCRIPTION:\s*([^\n]+)/i);
  let recommendedSlug  = get(/RECOMMENDED SLUG:\s*([^\n]+)/i);
  let outline          = get(/OUTLINE:\s*([\s\S]*?)(?:\n5\)|\nKEYWORDS:|$)/i);
  let primary          = get(/Primary:\s*([^\n]+)/i);
  let secondary        = get(/Secondary:\s*([^\n]+)/i);

  if (!recommendedTitle) recommendedTitle = "Cricket update";
  if (!recommendedMeta)  recommendedMeta  = "Latest cricket update.";
  if (!recommendedSlug)  recommendedSlug  = recommendedTitle;
  if (!outline)          outline          = "H2: Match Summary\nH3: Key Moments";

  return {
    recommendedTitle: recommendedTitle.slice(0, 65),
    recommendedMeta:  recommendedMeta.slice(0, 160),
    recommendedSlug:  recommendedSlug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
    outline,
    keywords: { primary: primary || "", secondary: secondary || "" },
  };
}

function buildHtmlDocument({ title, metaDescription, bodyHtml }) {
  const safeTitle = (title || "").slice(0, 60);
  const safeMeta  = (metaDescription || "").slice(0, 160);
  const body      = /<(h1|p|h2|h3|ul|li|blockquote|strong|em)\b/i.test(bodyHtml || "")
    ? bodyHtml
    : `<h1>${safeTitle || "Cricket Update"}</h1><p>${safeMeta || ""}</p>`;

  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '  <meta charset="utf-8" />',
    '  <meta name="viewport" content="width=device-width, initial-scale=1" />',
    `  <title>${safeTitle}</title>`,
    `  <meta name="description" content="${safeMeta}" />`,
    "</head>",
    "<body>",
    body,
    "</body>",
    "</html>",
  ].join("\n");
}

module.exports = {
  generateWithDeepSeek,
  buildPrePublishPrompt,
  buildRewriteBodyHtmlPrompt,
  parsePrePublishTextToJSON,
  buildHtmlDocument,
};
