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
3. Use varied sentence structures (mix short and long sentences randomly)
4. Add natural imperfections: occasional informal grammar, natural flow breaks
5. Use unexpected word choices and unique expressions
6. Include personal observations and opinions
7. Add conversational fillers: "well", "you see", "actually", "to be honest"
8. Vary paragraph lengths (some short 2-3 lines, some longer 5-6 lines)
9. Use active voice more than passive voice
10. Add natural transitions that humans use in real conversations

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

WRITING STYLE (HUMAN-LIKE):
1. Write like a real person, NOT like AI or a robot
2. Use conversational tone: "I think", "Honestly", "Look", "Listen"
3. Add natural reactions: "Wow!", "Unbelievable!", "What a game!"
4. Use lots of contractions: "don't", "can't", "won't", "it's", "that's", "I'm"
5. Include cricket facts: exact scores, overs, strike rates, venues, dates
6. Ask rhetorical questions: "Right?", "You know what I mean?", "Seriously?"
7. Use casual transitions: "Anyway", "So yeah", "But here's the thing"
8. Add personal commentary and opinions naturally
9. Sometimes start sentences with "And" or "But" (like humans do)
10. Include some intentional repetition for emphasis (humans do this)
11. Write 800-1200 words total
12. Mix formal cricket terms with casual explanations

STRICT RULES:
- NO markdown formatting (no **, *, #, etc.)
- NO AI phrases: "delve", "utilize", "comprehensive", "moreover", "furthermore", "in conclusion"
- NO robotic patterns or templates
- Use ONLY facts from raw material (NO invented scores/quotes/dates)
- Write in SIMPLE ENGLISH (10th class level)
- Make it 100% UNIQUE and ORIGINAL (pass plagiarism checkers)
- Make it sound HUMAN (pass AI detection tools)

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

OUTPUT INSTRUCTIONS:
Write a complete, engaging cricket article that:
✓ Sounds like a REAL HUMAN cricket fan wrote it
✓ Passes AI detection tools (use human writing patterns)
✓ Passes plagiarism checkers (100% original rewrite)
✓ Follows the SEO outline EXACTLY
✓ Uses simple 10th class English
✓ Includes all cricket facts accurately
✓ Is 800-1200 words long

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
