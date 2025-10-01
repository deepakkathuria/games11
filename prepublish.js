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

WRITING STYLE (WIRE SERVICE NEWS - Ultra Strict):
1. Write like PTI/ANI news wire - FACTUAL, TIGHT, ATTRIBUTED, minimal commentary
2. DON'T USE CONVERSATIONAL TONE: No "you know?", "honestly", "I mean", "kinda", "proper"
3. AVOID INTERJECTIONS: No "Wow. Just wow.", "Proper goosebumps stuff.", "More of this please."
4. NEVER REPEAT FILLER WORDS: Each word like "proper", "honestly", "really" used ONCE max
5. WRITE TIGHT: "The tribute was emotional" NOT "It was a proper emotional moment, you know?"
6. DON'T STRUCTURE NEATLY: Real news doesn't go Tribute→Song→Moments→Players→Future neatly
7. USE 50% DIRECT QUOTES: Real journalism is quote-heavy with brief narration
8. ATTRIBUTE EVERYTHING: "Police said", "According to officials", "Sources confirmed"
9. NO SMOOTH TRANSITIONS: Jump topics abruptly like real breaking news
10. BE FACTUAL, NOT CHATTY: Report events, don't chat about feelings
11. Use SPECIFIC DATA: Names, exact times, dates, numbers - not vague "like... eight minutes?"
12. SHORT DECLARATIVE SENTENCES: "The choir performed for eight minutes." NOT "Their performance was like... eight minutes long? Yeah, eight minutes."
13. NO RHETORICAL QUESTIONS: Don't ask "Guwahati was buzzing, you know?" - just state facts
14. MINIMIZE PERSONAL COMMENTARY: Report what happened, not "Genius move" or "We need more of this"
15. UNEVEN COVERAGE: 200 words on main story, 40 on side detail - NOT all sections equal
16. NO PACKAGED CONCLUSIONS: Don't wrap up neatly - real news stops when facts end
17. QUOTE-DRIVEN: Let sources tell story through quotes, minimal narration
18. PROFESSIONAL LANGUAGE: Not "proper pros" or "kinda perfect" - use standard English
19. TIGHT TRANSITIONS: Use "Meanwhile", "Separately", "According to" - not chatty bridges
20. Sound like Reuters/AP wire copy, NOT feature article or blog post

ULTRA-STRICT ANTI-AI DETECTION RULES (ChatGPT + All Detectors):
- NO markdown formatting (no **, *, #, etc.)
- BANNED CONVERSATIONAL INTERJECTIONS (AI OVERUSES THESE):
  × "Wow. Just wow." × "you know?" × "honestly" × "really" × "I mean" × "kinda" × "proper"
  Rule: Use each MAX ONCE in entire article. AI repeats "you know?" 5+ times!
- BANNED WORD REPETITION: If you use "proper" once, NEVER use it again. Same for:
  "actually", "honestly", "really", "massive", "huge", "crazy" - AI loves repeating these
- BANNED AI TRANSITION PATTERNS:
  × "Anyway, X was great too. But for once, Y might have stolen the headlines."
  × "So here's the thing that got everyone talking..."
  × "Okay so here's the thing..."
  × "The path forward is not simple"
  × "More of this please" (ending sentences)
- DON'T STRUCTURE INTO NEAT SECTIONS: AI does: Tribute→Song→Key Moments→Players→What's Next
  Real journalism jumps around, circles back, mentions things out of order
- DON'T MAKE SMOOTH TRANSITIONS: Real news is abrupt. Start new paragraph without perfect bridge
- WRITE TIGHT, NOT CONVERSATIONAL: "It was emotional" NOT "It was a proper emotional moment"
- NO FILLER PHRASES: × "something else" × "you could feel" × "I mean everyone" × "It's huge"
- USE DIRECT QUOTES more than narration (40% quotes minimum)
- ATTRIBUTE FACTS: "According to police", "Sources said", "As reported by" - journalistic style
- Use SIMPLE ENGLISH but PROFESSIONAL tone - not chatty blog style
- Sound like PTI/ANI wire service report, NOT casual blog commentary

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

OUTPUT INSTRUCTIONS (ULTRA-STRICT - ALL AI DETECTORS):
Write a wire service style cricket news article that:
✓ Sounds like PTI/Reuters wire copy (FACTUAL, TIGHT, NOT conversational)
✓ Passes ChatGPT, GPTZero, Originality.ai, ALL AI detectors
✓ Passes plagiarism checkers (100% original)
✓ Uses simple 10th class English but PROFESSIONAL news wire tone
✓ Is 800-1200 words with UNEVEN depth (200w main story, 50w side detail)
✓ Is 50% DIRECT QUOTES with attribution, 50% brief narration
✓ ZERO repetition of filler words (each word like "proper", "honestly" used ONCE max)
✓ NO conversational tone ("you know?", "I mean", "kinda" - BANNED)
✓ NO interjections ("Wow. Just wow.", "Proper goosebumps stuff." - BANNED)
✓ NO smooth chatty transitions ("Anyway, the match was great too..." - BANNED)
✓ FACTUAL REPORTING only, minimal personal commentary
✓ ATTRIBUTE everything ("Police said", "According to", "Sources confirmed")
✓ SHORT TIGHT SENTENCES like wire copy
✓ ABRUPT topic changes (real news doesn't flow smoothly)

CRITICAL - THESE EXACT PATTERNS ChatGPT CATCHES:
❌ "Wow. Just wow." / "Proper goosebumps stuff." / "More of this please."
❌ Repeating "proper" 5+ times ("proper emotional", "proper pros", "proper meaning")
❌ Repeating "you know?" multiple times
❌ "Anyway, X was great. But for once, Y might have stolen the headlines."
❌ Neat section structure: Tribute→Song→Key Moments→Players→What's Next
❌ Conversational narrative throughout
❌ "Smooth but generic transitions"
❌ "Too perfectly packaged"

✅ WRITE LIKE WIRE SERVICE NEWS INSTEAD:
✓ Tight factual sentences: "The choir performed for eight minutes."
✓ NOT chatty: "Their performance was like... eight minutes long? Yeah, eight minutes."
✓ Quote-heavy: 50% direct quotes with attribution
✓ No filler word repetition
✓ Professional tone, not blog commentary
✓ Abrupt, fact-driven, minimal transitions

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
