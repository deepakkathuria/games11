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
      timeout: 60000,
    }
  );
  return resp.data?.choices?.[0]?.message?.content || "";
}

/* ---------- PROMPTS ---------- */

function buildPrePublishPrompt({ title, description, body }) {
  return `
You are an SEO editor for a cricket news site.

Return ONLY these fields in plain text (no JSON, no markdown). Keep each on a single line except Outline which can be multiple lines.

1) RECOMMENDED TITLE:
2) RECOMMENDED META DESCRIPTION:
3) RECOMMENDED SLUG: (kebab-case, short)
4) OUTLINE: (use lines like "H2: ..." and "H3: ...")
5) KEYWORDS:
- Primary: ...
- Secondary: ...

RULES
- Use ONLY facts from input (no invented scores/quotes/dates).
- English output.
- Be concise.

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
You are a cricket news copy editor.

Rewrite the article as **HTML BODY ONLY** (no <html>, no <head>, no <body>).
Use only: <h1>, <h2>, <h3>, <p>, <ul>, <li>, <blockquote>, <strong>, <em>.
Follow the approved outline and keep newsroom tone. Do NOT invent facts.

Approved:
- Title: ${recTitle || ""}
- Meta: ${recMeta || ""}
- Outline:
${recOutline || ""}
- Keywords: ${recPrimary || ""}; ${recSecondary || ""}

Raw material:
Title: ${rawTitle || ""}
Description: ${rawDescription || ""}
Body:
${rawBody || ""}

OUTPUT:
Return VALID HTML for the body only. Start with <h1> and include proper <h2>/<h3> sections and <p> paragraphs. No commentary.
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
