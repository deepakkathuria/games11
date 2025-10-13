// const axios = require('axios');

// const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
// const OPENAI_BASE_URL = "https://api.openai.com/v1/chat/completions";

// async function generateWithOpenAI(prompt, options = {}) {
//   try {
//     console.log('🤖 OpenAI API call started...');
//     console.log('📊 Temperature:', options.temperature ?? 0.7);
//     console.log('📝 Max tokens:', options.max_tokens ?? 2000);
    
//     const response = await axios.post(OPENAI_BASE_URL, {
//       model: options.model || "gpt-4o-mini",
//       messages: [
//         {
//           role: "system",
//           content: "You are an Indian cricket journalist writing late at night under deadline pressure. You're tired but passionate, typing fast with emotions first and grammar second. You write like a real human reporter - slightly messy, raw, honest, with natural imperfections. Your goal is to score under 10% AI likelihood on all detection tools."
//         },
//         {
//           role: "user",
//           content: prompt
//         }
//       ],
//       temperature: options.temperature ?? 0.7,
//       max_tokens: options.max_tokens ?? 2000,
//     }, {
//       headers: {
//         'Authorization': `Bearer ${OPENAI_API_KEY}`,
//         'Content-Type': 'application/json'
//       },
//       timeout: 120000, // 2 minutes for longer articles
//     });
    
//     const content = response.data?.choices?.[0]?.message?.content || "";
//     console.log('✅ OpenAI API call completed, content length:', content.length);
//     return content;
//   } catch (error) {
//     console.error('❌ OpenAI API error:', error.message);
//     if (error.code === 'ECONNABORTED') {
//       throw new Error('Request timeout - article generation took too long. Try again.');
//     }
//     if (error.response) {
//       console.error('Response status:', error.response.status);
//       console.error('Response data:', error.response.data);
//       throw new Error(`OpenAI API error: ${error.response.data?.error?.message || error.message}`);
//     }
//     throw error;
//   }
// }

// /* ---------- CRICKET STATS & EXPERT FUNCTIONS ---------- */

// async function fetchCricketStats(playerName, teamName, matchType) {
//   // Enhanced cricket statistics for OpenAI processing
//   const statsPrompts = {
//     "Virat Kohli": {
//       career: "73 centuries in international cricket, 26,000+ runs across formats",
//       recent: "Averaging 45.2 in last 10 ODIs, strike rate of 89.3",
//       records: "Fastest to 8000, 9000, 10000 ODI runs"
//     },
//     "Rohit Sharma": {
//       career: "31 ODI centuries, 3 double centuries in ODIs",
//       recent: "Captain of India since 2021, led team to Asia Cup 2023 victory",
//       records: "Highest individual score in ODIs (264 runs)"
//     },
//     "MS Dhoni": {
//       career: "10,000+ ODI runs, 350+ dismissals as wicketkeeper",
//       recent: "Retired from international cricket in 2020",
//       records: "Only captain to win all three ICC trophies"
//     },
//     "Babar Azam": {
//       career: "Consistent top-order batsman, averaging 50+ in ODIs",
//       recent: "Pakistan captain, leading run-scorer in recent series",
//       records: "Fastest to 2000 T20I runs"
//     },
//     "Kane Williamson": {
//       career: "New Zealand captain, 8000+ Test runs",
//       recent: "Led New Zealand to World Test Championship victory",
//       records: "Highest individual score by a New Zealand batsman in World Cups"
//     }
//   };

//   const playerStats = statsPrompts[playerName] || {
//     career: "Established player with significant international experience",
//     recent: "Consistent performer in recent matches",
//     records: "Multiple achievements in international cricket"
//   };

//   return playerStats;
// }

// async function generateExpertOpinion(topic, context) {
//   try {
//     const expertPrompt = `
// You are a cricket expert analyst. Provide a realistic, insightful quote about this cricket topic. Make it sound like something Harsha Bhogle, Ian Bishop, or Ravi Shastri would say.

// Topic: ${topic}
// Context: ${context}

// Return ONLY a direct quote in quotation marks. Make it:
// - 1-2 sentences max
// - Insightful and analytical
// - Use cricket terminology naturally
// - Sound like a real expert voice
// - No attribution needed (just the quote)

// Example: "The way he's playing the short ball now, you can see the confidence is back in his game."
// `;

//     const quote = await generateWithOpenAI(expertPrompt, { 
//       temperature: 0.8, 
//       max_tokens: 100 
//     });
    
//     return quote.trim().replace(/^["']|["']$/g, '');
//   } catch (error) {
//     console.error('Error generating expert opinion:', error);
//     return "The conditions look challenging but the players have adapted well to the situation.";
//   }
// }

// async function generateSocialMediaReactions(articleTitle, keyEvent) {
//   try {
//     const socialPrompt = `
// Generate 5 realistic social media reactions (X/Twitter style) to this cricket news. Make them sound like real cricket fans would write.

// Article: ${articleTitle}
// Key Event: ${keyEvent}

// Requirements:
// - 5 different reactions
// - Mix of emotions (excitement, criticism, analysis, humor, support)
// - Use casual, social media language
// - Include hashtags naturally
// - 1-2 lines each
// - Sound like real cricket fans from different perspectives
// - Include some abbreviations and emojis
// - Make them trending and realistic

// Format each reaction on a new line starting with "• "
// Example: • "Finally! Been waiting for this moment since ages 🏏 #Cricket #Victory"

// Return ONLY the 5 reactions, nothing else.
// `;

//     const reactions = await generateWithOpenAI(socialPrompt, { 
//       temperature: 0.9, 
//       max_tokens: 300 
//     });
    
//     return reactions.split('\n').filter(line => line.trim().startsWith('•')).slice(0, 5);
//   } catch (error) {
//     console.error('Error generating social reactions:', error);
//     return [
//       "• What a match! This is why we love cricket 🏏",
//       "• Finally some good news for the team! #Cricket",
//       "• Been waiting for this moment! Amazing performance 💪",
//       "• Great to see the players stepping up when it matters",
//       "• This changes everything for the series! #GameChanger"
//     ];
//   }
// }

// /* ---------- CRICKET-SPECIFIC PROMPTS (Based on prepublish.js) ---------- */

// function buildCricketPrePublishPrompt({ title, description, body }) {
//   return `
// You are an expert English cricket journalist and SEO editor. Analyze this cricket news and provide comprehensive SEO recommendations.

// Return ONLY these fields in plain text (no JSON, no markdown). Keep each on a single line except Outline which can be multiple lines.

// 1) RECOMMENDED TITLE:
// 2) RECOMMENDED META DESCRIPTION:
// 3) RECOMMENDED SLUG: (kebab-case, short)
// 4) OUTLINE: (use lines like "H2: ..." and "H3: ...")
// 5) KEYWORDS:
// - Primary: ...
// - Secondary: ...
// - Tertiary: ...
// - Long-tail: ...
// - Trending: ...

// ENHANCED SEO RULES FOR CRICKET NEWS:
// - Use ONLY facts from input (no invented scores/quotes/dates/venues)
// - Make title engaging and cricket-specific (include team names, match type, key result)
// - Meta description should highlight the main cricket story and create curiosity
// - Outline should follow enhanced cricket journalism structure:
//   * H2: Breaking News Summary (40-60 words)
//   * H2: Match/Event Details
//   * H2: Key Player Performances
//   * H2: Statistical Analysis
//   * H2: Expert Insights
//   * H2: Fan Reactions & Social Media Buzz
//   * H2: What This Means Going Forward
// - Provide 5 diverse keywords: primary (main topic), secondary (related terms), tertiary (specific details), long-tail (detailed phrases), trending (current buzzwords)
// - English output
// - Be engaging and comprehensive

// INPUT
// Title: ${title || ""}
// Description: ${description || ""}
// Body:
// ${body || ""}
// `.trim();
// }

// function buildCricketRewriteBodyHtmlPrompt({
//   rawTitle,
//   rawDescription,
//   rawBody,
//   recTitle,
//   recMeta,
//   recOutline,
//   recPrimary,
//   recSecondary,
//   recTertiary,
//   recLongtail,
//   recTrending,
// }) {
//   return `
// 🗞️ Role: You are an Indian cricket journalist writing a post-match or post-announcement story late at night. You're a bit tired but passionate, typing fast, emotions first, grammar second. You write as if you were there — half watching, half scribbling notes.

// 🧩 Goal: Rewrite or draft the given cricket article so it reads like a real human wrote it under deadline pressure — emotional, slightly messy, raw, and honest.
// It should score under 10% AI likelihood on ZeroGPT, GPTZero, Copyleaks, etc.

// Writing Rules:

// 1. Tone & Voice
//    - Write as yourself, not a formal reporter.
//    - Use first person where natural ("I remember," "I guess," "felt like everyone stopped breathing for a sec").
//    - Allow a few broken or short sentences. Some can start with "And," "But," or "So."
//    - Use contractions — can't, didn't, it's, there's.
//    - Mix proper grammar with small slips or rushed commas.
//    - If you repeat a word once or twice, keep it — humans do that when excited.

// 2. Structure
//    - Forget perfect flow. Jump topics if it feels natural — quotes, side comments, quick stats, then back to emotion.
//    - One paragraph can be 1 line, the next 6. Don't make everything uniform.
//    - Add small "thinking aloud" bits like "umm," "honestly," "to be fair," or "I mean."
//    - Don't close every section neatly — leave some thoughts hanging.

// 3. Language & Rhythm
//    - Use slang or Indian phrasing casually: "you know," "pretty sure," "kinda crazy."
//    - Occasionally drop an article ("He looked bit nervous" instead of "a bit").
//    - Miss a comma or two. Write one long run-on sentence if you feel like it.
//    - Vary rhythm wildly — one crisp quote, one rambling thought, one half sentence.
//    - Throw in emotional filler ("Man, that moment gave goosebumps").

// 4. Human Errors Allowed
//    - Minor spelling variation ("colour" vs "color", "definately" once in a while).
//    - Slight tense mismatch or double space ("He was smiling, is smiling actually").
//    - Small logical skips or repetition of idea — that's fine.
//    - One or two unfinished sentences ("That's when you just knew —").
//    - Don't over-edit typos like "its" vs "it's."

// 5. Content & EEAT
//    - Keep factual accuracy (names, stats, quotes).
//    - Insert real context or memory: "He'd said the same thing after that knock in Ahmedabad last year."
//    - Use authentic speculation or emotion: "Hard to tell if he's nervous or just soaking it in."
//    - Mention atmosphere or sensory detail — smell, sound, crowd reactions.

// 6. AI Detection Breakers
//    - Randomize sentence lengths and punctuation.
//    - Add a short paragraph that's almost a side rant.
//    - Occasionally break sentence order: "And yeah, the mic crackled mid-quote — funny moment."
//    - End casually, not philosophically. ("Anyway, that's cricket for you.")
//    - Leave one or two imperfections that feel unedited — they destroy pattern symmetry.

// HTML FORMAT:
// - Return HTML BODY ONLY (no <html>, no <head>, no <body> tags)
// - Use: <h1>, <h2>, <h3>, <p>, <ul>, <li>, <blockquote>, <strong>, <em>
// - Start with <h1>${recTitle || ""}</h1>
// - Write natural flowing paragraphs with varied lengths
// - Use <strong> for player names and important stats
// - Use <blockquote> for expert quotes and reactions

// Source Cricket Material (REWRITE COMPLETELY - DON'T COPY):
// Title: ${rawTitle || ""}
// Description: ${rawDescription || ""}
// Body:
// ${rawBody || ""}

// Keywords to include naturally: ${recPrimary || ""}, ${recSecondary || ""}, ${recTertiary || ""}, ${recLongtail || ""}, ${recTrending || ""}

// Start writing now - just the HTML body content, nothing else.
// `.trim();
// }

// /* ---------- MAIN PROCESSING FUNCTION ---------- */

// async function processCricketNewsOpenAI(input, options = {}) {
//   const startTime = Date.now();
  
//   try {
//     console.log('🏏 [Cricket OpenAI] Processing cricket article:', input.title);
//     console.log('📝 [Cricket OpenAI] Original content length:', input.content?.length || 0);
//     console.log('📄 [Cricket OpenAI] Original content preview:', input.content?.substring(0, 200) + '...');
    
//     if (!input.title || input.title.length < 10) {
//       throw new Error('Title too short');
//     }
//     if (!input.description || input.description.length < 20) {
//       throw new Error('Description too short');
//     }
//     if (!input.content || input.content.length < 300) {
//       throw new Error('Content too short');
//     }

//     // 1) Generate SEO recommendations
//     console.log('📋 [Cricket OpenAI] Generating SEO recommendations...');
//     const prePrompt = buildCricketPrePublishPrompt({
//       title: input.title || "",
//       description: input.description || "",
//       body: input.content || "",
//     });
//     const recText = await generateWithOpenAI(prePrompt, { temperature: 0.2, max_tokens: 1200 });
//     const recs = parsePrePublishTextToJSON(recText);
//     console.log('✅ [Cricket OpenAI] SEO recommendations generated');

//     // 2) Generate enhanced cricket article
//     console.log('✍️ [Cricket OpenAI] Generating enhanced cricket article...');
//     const bodyPrompt = buildCricketRewriteBodyHtmlPrompt({
//       rawTitle: input.title || "",
//       rawDescription: input.description || "",
//       rawBody: input.content || "",
//       recTitle: recs.recommendedTitle,
//       recMeta: recs.recommendedMeta,
//       recOutline: recs.outline,
//       recPrimary: recs.keywords?.primary || "",
//       recSecondary: recs.keywords?.secondary || "",
//       recTertiary: recs.keywords?.tertiary || "",
//       recLongtail: recs.keywords?.longtail || "",
//       recTrending: recs.keywords?.trending || "",
//     });
//     const bodyHtml = await generateWithOpenAI(bodyPrompt, { temperature: 0.97, max_tokens: 5000 });
//     console.log('✅ [Cricket OpenAI] Enhanced cricket article generated');

//     return {
//       success: true,
//       readyToPublishArticle: bodyHtml,
//       recommendations: recs,
//       processingTime: Date.now() - startTime
//     };

//   } catch (error) {
//     console.error('Process cricket news OpenAI error:', error);
//     return {
//       success: false,
//       error: error.message,
//       processingTime: Date.now() - startTime
//     };
//   }
// }

// /* ---------- PARSERS & HELPERS ---------- */

// function parsePrePublishTextToJSON(text = "") {
//   const get = (re) => {
//     const m = text.match(re);
//     return m ? m[1].trim() : "";
//   };

//   let recommendedTitle = get(/RECOMMENDED TITLE:\s*([^\n]+)/i);
//   let recommendedMeta  = get(/RECOMMENDED META DESCRIPTION:\s*([^\n]+)/i);
//   let recommendedSlug  = get(/RECOMMENDED SLUG:\s*([^\n]+)/i);
//   let outline          = get(/OUTLINE:\s*([\s\S]*?)(?:\n5\)|\nKEYWORDS:|$)/i);
  
//   // Parse all 5 keywords
//   let primary   = get(/Primary:\s*([^\n]+)/i);
//   let secondary = get(/Secondary:\s*([^\n]+)/i);
//   let tertiary  = get(/Tertiary:\s*([^\n]+)/i);
//   let longtail  = get(/Long-tail:\s*([^\n]+)/i);
//   let trending  = get(/Trending:\s*([^\n]+)/i);

//   // Fallbacks
//   if (!recommendedTitle) recommendedTitle = "Cricket update";
//   if (!recommendedMeta)  recommendedMeta  = "Latest cricket update.";
//   if (!recommendedSlug)  recommendedSlug  = recommendedTitle;
//   if (!outline)          outline          = "H2: Match Summary\nH3: Key Moments";
//   if (!primary)          primary          = "cricket";
//   if (!secondary)        secondary        = "sports";
//   if (!tertiary)         tertiary         = "match";
//   if (!longtail)         longtail         = "cricket news";
//   if (!trending)         trending         = "cricket updates";

//   return {
//     recommendedTitle: recommendedTitle.slice(0, 65),
//     recommendedMeta:  recommendedMeta.slice(0, 160),
//     recommendedSlug:  recommendedSlug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
//     outline,
//     keywords: { 
//       primary: primary || "", 
//       secondary: secondary || "", 
//       tertiary: tertiary || "",
//       longtail: longtail || "",
//       trending: trending || ""
//     },
//   };
// }

// function buildCricketHtmlDocument({ title, metaDescription, bodyHtml }) {
//   const safeTitle = (title || "").slice(0, 60);
//   const safeMeta  = (metaDescription || "").slice(0, 160);
//   const body      = /<(h1|p|h2|h3|ul|li|blockquote|strong|em)\b/i.test(bodyHtml || "")
//     ? bodyHtml
//     : `<h1>${safeTitle || "Cricket Update"}</h1><p>${safeMeta || ""}</p>`;

//   return [
//     "<!doctype html>",
//     '<html lang="en">',
//     "<head>",
//     '  <meta charset="utf-8" />',
//     '  <meta name="viewport" content="width=device-width, initial-scale=1" />',
//     `  <title>${safeTitle}</title>`,
//     `  <meta name="description" content="${safeMeta}" />`,
//     '  <meta name="keywords" content="cricket, sports, news, analysis, commentary" />',
//     '  <meta name="author" content="Cricket News Team" />',
//     '  <meta property="og:title" content="' + safeTitle + '" />',
//     '  <meta property="og:description" content="' + safeMeta + '" />',
//     '  <meta property="og:type" content="article" />',
//     "</head>",
//     "<body>",
//     body,
//     "</body>",
//     "</html>",
//   ].join("\n");
// }

// async function generateCricketHeadline(title) {
//   const prompt = `Create an engaging, SEO-friendly cricket headline in English for this cricket news title. Make it:
// 1. Catchy and cricket-focused
// 2. Under 60 characters if possible
// 3. Include cricket keywords and terminology
// 4. Sound like a real cricket news headline
// 5. Avoid clickbait but make it compelling for cricket fans

// Original cricket title: ${title}

// Generate a new cricket headline:`;

//   try {
//     const response = await generateWithOpenAI(prompt, {
//       model: "gpt-4o-mini",
//       temperature: 0.8,
//       max_tokens: 100
//     });
//     return response || title;
//   } catch (error) {
//     console.error('Generate cricket headline error:', error);
//     return title;
//   }
// }

// async function generateCricketMetaDescription(description) {
//   const prompt = `Create an engaging cricket meta description in English for this cricket news description. Make it:
// 1. 150-160 characters long
// 2. Include key cricket information and keywords
// 3. Compelling for cricket fans
// 4. Summarize the main cricket points
// 5. Sound natural and cricket-focused

// Original cricket description: ${description}

// Generate a cricket meta description:`;

//   try {
//     const response = await generateWithOpenAI(prompt, {
//       model: "gpt-4o-mini",
//       temperature: 0.7,
//       max_tokens: 200
//     });
//     return response || description;
//   } catch (error) {
//     console.error('Generate cricket meta description error:', error);
//     return description;
//   }
// }

// module.exports = {
//   processCricketNewsOpenAI,
//   generateCricketHeadline,
//   generateCricketMetaDescription,
//   buildCricketHtmlDocument,
//   fetchCricketStats,
//   generateExpertOpinion,
//   generateSocialMediaReactions,
// };


















// WE USED FILE PROMPT 





// const axios = require('axios');

// const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
// const OPENAI_BASE_URL = "https://api.openai.com/v1/chat/completions";

// async function generateWithOpenAI(prompt, options = {}) {
//   try {
//     console.log('🤖 OpenAI API call started...');
//     console.log('📊 Temperature:', options.temperature ?? 0.97);
//     console.log('📝 Max tokens:', options.max_tokens ?? 5000);
    
//     const response = await axios.post(OPENAI_BASE_URL, {
//       model: options.model || "gpt-4o-mini",
//       messages: [
//         {
//           role: "system",
//           content: "You are an Indian cricket journalist writing a post-match or post-announcement story late at night. You're a bit tired but passionate, typing fast, emotions first, grammar second. You write as if you were there — half watching, half scribbling notes."
//         },
//         {
//           role: "user",
//           content: prompt
//         }
//       ],
//       temperature: options.temperature ?? 0.97,
//       max_tokens: options.max_tokens ?? 5000,
//       top_p: options.top_p ?? 0.88,
//       frequency_penalty: options.frequency_penalty ?? 0.5,
//       presence_penalty: options.presence_penalty ?? 0.45,
//     }, {
//       headers: {
//         'Authorization': `Bearer ${OPENAI_API_KEY}`,
//         'Content-Type': 'application/json'
//       },
//       timeout: 120000,
//     });
    
//     const content = response.data?.choices?.[0]?.message?.content || "";
//     console.log('✅ OpenAI API call completed, content length:', content.length);
//     return content;
//   } catch (error) {
//     console.error('❌ OpenAI API error:', error.message);
//     if (error.code === 'ECONNABORTED') {
//       throw new Error('Request timeout - article generation took too long. Try again.');
//     }
//     if (error.response) {
//       console.error('Response status:', error.response.status);
//       console.error('Response data:', error.response.data);
//       throw new Error(`OpenAI API error: ${error.response.data?.error?.message || error.message}`);
//     }
//     throw error;
//   }
// }

// /* ---------- RAW HUMAN REPORTER MODE REWRITE PROMPT ---------- */

// function buildRawHumanRewritePrompt(rawTitle, rawDescription, rawBody) {
//   return `
// 🗞️ Role:
// You are an Indian cricket journalist writing a post-match or post-announcement story late at night. You're a bit tired but passionate, typing fast, emotions first, grammar second. You write as if you were there — half watching, half scribbling notes.

// 🧩 Goal:
// Rewrite or draft the given cricket article so it reads like a real human wrote it under deadline pressure — emotional, slightly messy, raw, and honest.
// It should score under 10% AI likelihood on ZeroGPT, GPTZero, Copyleaks, etc.

// ✍️ Writing Rules:

// 1. Tone & Voice
//    - Write as yourself, not a formal reporter.
//    - Use first person where natural ("I remember," "I guess," "felt like everyone stopped breathing for a sec").
//    - Allow a few broken or short sentences. Some can start with "And," "But," or "So."
//    - Use contractions — can't, didn't, it's, there's.
//    - Mix proper grammar with small slips or rushed commas.
//    - If you repeat a word once or twice, keep it — humans do that when excited.

// 2. Structure
//    - Forget perfect flow. Jump topics if it feels natural — quotes, side comments, quick stats, then back to emotion.
//    - One paragraph can be 1 line, the next 6. Don't make everything uniform.
//    - Add small "thinking aloud" bits like "umm," "honestly," "to be fair," or "I mean."
//    - Don't close every section neatly — leave some thoughts hanging.

// 3. Language & Rhythm
//    - Use slang or Indian phrasing casually: "you know," "pretty sure," "kinda crazy."
//    - Occasionally drop an article ("He looked bit nervous" instead of "a bit").
//    - Miss a comma or two. Write one long run-on sentence if you feel like it.
//    - Vary rhythm wildly — one crisp quote, one rambling thought, one half sentence.
//    - Throw in emotional filler ("Man, that moment gave goosebumps").

// 4. Human Errors Allowed
//    - Minor spelling variation ("colour" vs "color", "definately" once in a while).
//    - Slight tense mismatch or double space ("He was smiling, is smiling actually").
//    - Small logical skips or repetition of idea — that's fine.
//    - One or two unfinished sentences ("That's when you just knew —").
//    - Don't over-edit typos like "its" vs "it's."

// 5. Content & EEAT
//    - Keep factual accuracy (names, stats, quotes).
//    - Insert real context or memory: "He'd said the same thing after that knock in Ahmedabad last year."
//    - Use authentic speculation or emotion: "Hard to tell if he's nervous or just soaking it in."
//    - Mention atmosphere or sensory detail — smell, sound, crowd reactions.

// 6. AI Detection Breakers
//    - Randomize sentence lengths and punctuation.
//    - Add a short paragraph that's almost a side rant.
//    - Occasionally break sentence order: "And yeah, the mic crackled mid-quote — funny moment."
//    - End casually, not philosophically. ("Anyway, that's cricket for you.")
//    - Leave one or two imperfections that feel unedited — they destroy pattern symmetry.

// HTML FORMAT:
// - Return HTML BODY ONLY (no <html>, no <head>, no <body> tags)
// - Use: <h1>, <h2>, <h3>, <p>, <ul>, <li>, <blockquote>, <strong>, <em>
// - Start with <h1> for the main title
// - Write natural flowing paragraphs with varied lengths
// - Use <strong> for player names and important stats
// - Use <blockquote> for quotes and reactions

// Source Cricket Material (REWRITE COMPLETELY - DON'T COPY):
// Title: ${rawTitle || ""}
// Description: ${rawDescription || ""}
// Body:
// ${rawBody || ""}

// Start writing now - just the HTML body content, nothing else.
// `.trim();
// }

// /* ---------- MAIN PROCESSING FUNCTION ---------- */

// async function processCricketNewsOpenAI(input, options = {}) {
//   const startTime = Date.now();
  
//   try {
//     console.log('🏏 [Cricket OpenAI] Processing cricket article:', input.title);
//     console.log('📝 [Cricket OpenAI] Original content length:', input.content?.length || 0);
    
//     if (!input.title || input.title.length < 10) {
//       throw new Error('Title too short');
//     }
//     if (!input.description || input.description.length < 20) {
//       throw new Error('Description too short');
//     }
//     if (!input.content || input.content.length < 300) {
//       throw new Error('Content too short');
//     }

//     // Generate human-like article with Raw Human Reporter Mode
//     console.log('✍️ [Cricket OpenAI] Generating human-like cricket article...');
//     const rewritePrompt = buildRawHumanRewritePrompt(
//       input.title || "",
//       input.description || "",
//       input.content || ""
//     );
    
//     const bodyHtml = await generateWithOpenAI(rewritePrompt, { 
//       temperature: 0.97,
//       max_tokens: 5000,
//       top_p: 0.88,
//       frequency_penalty: 0.5,
//       presence_penalty: 0.45
//     });
    
//     console.log('✅ [Cricket OpenAI] Human-like cricket article generated');

//     return {
//       success: true,
//       readyToPublishArticle: bodyHtml,
//       processingTime: Date.now() - startTime
//     };

//   } catch (error) {
//     console.error('Process cricket news OpenAI error:', error);
//     return {
//       success: false,
//       error: error.message,
//       processingTime: Date.now() - startTime
//     };
//   }
// }

// module.exports = {
//   processCricketNewsOpenAI,
// };



















// EDITPR ONE 






// const axios = require('axios');
// const mysql = require('mysql2/promise');

// const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
// const OPENAI_BASE_URL = "https://api.openai.com/v1/chat/completions";

// // Database connection for fetching prompts
// const dbConfig = {
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.POLL_DB_NAME,
// };

// // Fetch prompt config from database
// async function getPromptConfig() {
//   const connection = await mysql.createConnection(dbConfig);
//   try {
//     const [rows] = await connection.query(
//       "SELECT * FROM openai_prompts WHERE prompt_type = 'cricket_human_reporter' LIMIT 1"
//     );
//     return rows[0] || null;
//   } finally {
//     await connection.end();
//   }
// }

// async function generateWithOpenAI(prompt, options = {}) {
//   try {
//     console.log('🤖 OpenAI API call started...');
//     console.log('📊 Temperature:', options.temperature ?? 0.97);
//     console.log('📝 Max tokens:', options.max_tokens ?? 5000);
    
//     const response = await axios.post(OPENAI_BASE_URL, {
//       model: options.model || "gpt-4o-mini",
//       messages: [
//         {
//           role: "system",
//           content: options.systemPrompt || "You are a helpful assistant."
//         },
//         {
//           role: "user",
//           content: prompt
//         }
//       ],
//       temperature: options.temperature ?? 0.97,
//       max_tokens: options.max_tokens ?? 5000,
//       top_p: options.top_p ?? 0.88,
//       frequency_penalty: options.frequency_penalty ?? 0.5,
//       presence_penalty: options.presence_penalty ?? 0.45,
//     }, {
//       headers: {
//         'Authorization': `Bearer ${OPENAI_API_KEY}`,
//         'Content-Type': 'application/json'
//       },
//       timeout: 120000,
//     });
    
//     const content = response.data?.choices?.[0]?.message?.content || "";
//     console.log('✅ OpenAI API call completed, content length:', content.length);
//     return content;
//   } catch (error) {
//     console.error('❌ OpenAI API error:', error.message);
//     if (error.code === 'ECONNABORTED') {
//       throw new Error('Request timeout - article generation took too long. Try again.');
//     }
//     if (error.response) {
//       console.error('Response status:', error.response.status);
//       console.error('Response data:', error.response.data);
//       throw new Error(`OpenAI API error: ${error.response.data?.error?.message || error.message}`);
//     }
//     throw error;
//   }
// }

// async function processCricketNewsOpenAI(input, options = {}) {
//   const startTime = Date.now();
  
//   try {
//     console.log('🏏 [Cricket OpenAI] Processing cricket article:', input.title);
    
//     if (!input.title || input.title.length < 10) {
//       throw new Error('Title too short');
//     }
//     if (!input.description || input.description.length < 20) {
//       throw new Error('Description too short');
//     }
//     if (!input.content || input.content.length < 300) {
//       throw new Error('Content too short');
//     }

//     // Fetch dynamic prompt from database
//     console.log('📥 [Cricket OpenAI] Fetching prompt configuration from database...');
//     const promptConfig = await getPromptConfig();
    
//     if (!promptConfig) {
//       throw new Error('Prompt configuration not found in database');
//     }
    
//     console.log('✅ [Cricket OpenAI] Prompt config loaded');

//     // Replace placeholders in user prompt template
//     const userPrompt = promptConfig.user_prompt_template
//       .replace('{{TITLE}}', input.title || "")
//       .replace('{{DESCRIPTION}}', input.description || "")
//       .replace('{{BODY}}', input.content || "");
    
//     console.log('✍️ [Cricket OpenAI] Generating article with dynamic prompt...');
    
//     const bodyHtml = await generateWithOpenAI(userPrompt, { 
//       systemPrompt: promptConfig.system_prompt,
//       temperature: promptConfig.temperature,
//       max_tokens: promptConfig.max_tokens,
//       top_p: promptConfig.top_p,
//       frequency_penalty: promptConfig.frequency_penalty,
//       presence_penalty: promptConfig.presence_penalty
//     });
    
//     console.log('✅ [Cricket OpenAI] Article generated successfully');

//     return {
//       success: true,
//       readyToPublishArticle: bodyHtml,
//       processingTime: Date.now() - startTime,
//       promptUsed: {
//         system: promptConfig.system_prompt,
//         template: promptConfig.user_prompt_template
//       }
//     };

//   } catch (error) {
//     console.error('Process cricket news OpenAI error:', error);
//     return {
//       success: false,
//       error: error.message,
//       processingTime: Date.now() - startTime
//     };
//   }
// }

// module.exports = {
//   processCricketNewsOpenAI,
// };































// 2ndone



const axios = require('axios');
const cheerio = require('cheerio');
const mysql = require('mysql2/promise');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const OPENAI_BASE_URL = "https://api.openai.com/v1/chat/completions";
const DEEPSEEK_BASE_URL = "https://api.deepseek.com/chat/completions";

// Database config for dynamic prompts
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.POLL_DB_NAME,
};

/* ---------- HELPER FUNCTIONS ---------- */

// Timeout wrapper
async function withTimeout(promise, ms = 30000) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timeoutId);
  }
}

// Sleep utility
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Retry with exponential backoff
async function retry(fn, attempts = 3, baseDelay = 500) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < attempts - 1) {
        await sleep(baseDelay * Math.pow(2, i));
      }
    }
  }
  throw lastError;
}

// Sanitize HTML/text
function sanitizeText(htmlOrText, maxLength = 4000) {
  const text = htmlOrText
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.slice(0, maxLength);
}

// Extract hostname from URL
function getHostname(url) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return 'unknown';
  }
}

// Dedupe URLs by hostname
function dedupeByHostname(urls) {
  const seen = new Set();
  const result = [];
  for (const url of urls) {
    const host = getHostname(url);
    if (!seen.has(host)) {
      seen.add(host);
      result.push(url);
    }
  }
  return result;
}

/* ---------- GOOGLE SEARCH (Simple) ---------- */

async function searchGoogle(query, maxResults = 6) {
  // Simple search - you can replace with Google CSE API if needed
  // For now, we'll use the URLs from the article if available
  // Or you can integrate Google Custom Search API here
  console.log('🔍 Search query:', query);
  
  // Placeholder - in production, use Google CSE API or SerpAPI
  return [];
}

/* ---------- WEB SCRAPING ---------- */

async function extractArticleContent(url) {
  try {
    console.log(`📄 Extracting: ${url}`);
    const response = await withTimeout(
      axios.get(url, { 
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }),
      15000
    );

    const $ = cheerio.load(response.data);
    
    // Remove unwanted elements
    $('script, style, nav, header, footer, aside, .ad, .advertisement').remove();
    
    // Extract title
    const title = $('h1').first().text().trim() || 
                  $('title').text().trim() || 
                  'No Title';
    
    // Extract main content
    let content = '';
    $('article p, .article-content p, .post-content p, main p').each((i, el) => {
      content += $(el).text() + '\n';
    });
    
    // Fallback: all paragraphs
    if (content.length < 200) {
      $('p').each((i, el) => {
        content += $(el).text() + '\n';
      });
    }

    return {
      url,
      title,
      content: sanitizeText(content, 6000),
      success: content.length > 200
    };
  } catch (error) {
    console.error(`❌ Extract failed for ${url}:`, error.message);
    return {
      url,
      title: '',
      content: '',
      success: false
    };
  }
}

async function extractMultipleSources(urls) {
  const results = await Promise.allSettled(
    urls.map(url => extractArticleContent(url))
  );
  
  return results
    .filter(r => r.status === 'fulfilled' && r.value.success)
    .map(r => r.value);
}

/* ---------- DEEPSEEK API ---------- */

async function callDeepSeekJSON(messages, model = 'deepseek-chat') {
  try {
    const response = await withTimeout(
      axios.post(DEEPSEEK_BASE_URL, {
        model,
        messages,
        temperature: 0.2,
        response_format: { type: 'json_object' }
      }, {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }),
      30000
    );

    const content = response.data?.choices?.[0]?.message?.content || '{}';
    return JSON.parse(content);
  } catch (error) {
    console.error('❌ DeepSeek API error:', error.message);
    throw new Error(`DeepSeek failed: ${error.message}`);
  }
}

/* ---------- OPENAI API ---------- */

async function callOpenAI(systemPrompt, userPrompt, options = {}) {
  try {
    console.log('🤖 OpenAI API call started...');
    console.log('📊 Temperature:', options.temperature ?? 0.97);
    
    const response = await withTimeout(
      axios.post(OPENAI_BASE_URL, {
        model: options.model || "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: options.temperature ?? 0.97,
        max_tokens: options.max_tokens ?? 5000,
        top_p: options.top_p ?? 0.88,
        frequency_penalty: options.frequency_penalty ?? 0.5,
        presence_penalty: options.presence_penalty ?? 0.45,
      }, {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }),
      120000
    );
    
    const content = response.data?.choices?.[0]?.message?.content || "";
    console.log('✅ OpenAI API call completed, content length:', content.length);
    return content;
  } catch (error) {
    console.error('❌ OpenAI API error:', error.message);
    throw error;
  }
}

/* ---------- FACT EXTRACTION PROMPT (DEEPSEEK) ---------- */

function buildFactExtractionPrompt(title, description, sources) {
  const sourcesText = sources.map((s, i) => 
    `[${i + 1}] ${s.title || 'Untitled'} — ${s.url}\nCONTENT: ${s.content.slice(0, 2000)}`
  ).join('\n\n');

  return {
    system: `You are a meticulous fact extractor for cricket journalism.
- Extract ONLY verifiable, neutral facts from the sources below
- Attach source IDs like [1], [2] to each fact
- Identify contradictions between sources as "CONFLICT: <text> [ids]"
- Focus on: scores, player stats, quotes, match details, team info
- Keep response under 1500 characters
Return STRICT JSON:
{"facts":[{"text":"...", "sources":[1,2]}], "conflicts":[{"text":"...","sources":[1,3]}]}`,

    user: `TOPIC: ${title}
DESCRIPTION: ${description}

SOURCES:
${sourcesText}

Extract facts now.`
  };
}

/* ---------- HINDI ARTICLE GENERATION PROMPT (OPENAI) ---------- */

function buildHindiArticlePrompt(title, description, factDigest, citations) {
  return {
    system: `तुम एक भारतीय क्रिकेट पत्रकार हो जो देर रात मैच के बाद की कहानी लिख रहे हो। तुम थके हुए हो लेकिन passionate हो, fast type कर रहे हो, emotions first और grammar second। तुम ऐसे लिखते हो जैसे तुम वहां मौजूद थे - आधा देखते हुए, आधा नोट्स लिखते हुए।

तुम्हारा लक्ष्य:
- Natural, human-like Hindi में लिखो
- Emotional, थोड़ा messy, raw, और honest
- AI detection tools पर <10% score करना है
- Casual language, broken sentences allowed
- "यार", "भाई", "अरे", "वाह" जैसे words naturally use करो
- English cricket terms रखो (century, wicket, runs)`,

    user: `ORIGINAL NEWS:
Title: ${title}
Description: ${description}

VERIFIED FACTS (from multiple sources):
${JSON.stringify(factDigest, null, 2)}

CITATIONS:
${citations}

INSTRUCTIONS:
1. पूरा article Hindi में लिखो (cricket terms English में रख सकते हो)
2. Natural, conversational tone - जैसे किसी दोस्त को बता रहे हो
3. Short paragraphs, varied lengths
4. Emotional reactions add करो ("यार, क्या खेल दिखाया!", "अरे वाह!")
5. कुछ sentences छोटे, कुछ लंबे run-on sentences
6. Facts accurate रखो but presentation casual
7. HTML format में return करो:
   - <h1> main title के लिए
   - <h2> subheadings के लिए (3-4)
   - <p> paragraphs के लिए
   - <strong> player names और important stats के लिए
   - <blockquote> quotes के लिए
8. End में "स्रोत:" section add करो with [1], [2] citations

HTML body content लिखो (no <html>, <head>, <body> tags):`
  };
}

/* ---------- MAIN PROCESSING FUNCTION ---------- */

async function processCricketNewsWithDeepSeek(input, options = {}) {
  const startTime = Date.now();
  const {
    useMultiSource = true,
    maxSources = 5,
    language = 'hindi' // 'hindi' or 'english'
  } = options;
  
  try {
    console.log('🏏 [DeepSeek + OpenAI] Processing:', input.title);
    
    // Validation
    if (!input.title || input.title.length < 10) {
      throw new Error('Title too short');
    }
    if (!input.description || input.description.length < 20) {
      throw new Error('Description too short');
    }
    if (!input.content || input.content.length < 300) {
      throw new Error('Content too short');
    }

    let factDigest;
    let citations = '';

    if (useMultiSource && DEEPSEEK_API_KEY) {
      console.log('📡 Multi-source fact extraction enabled');
      
      // STEP 1: Search for related articles (optional - can skip if you don't have Google CSE)
      // For now, we'll just use the original article as primary source
      const sources = [{
        url: input.url || 'original',
        title: input.title,
        content: sanitizeText(input.content, 6000),
        success: true
      }];

      console.log(`✅ Using ${sources.length} source(s)`);

      // STEP 2: Extract facts using DeepSeek
      console.log('🔬 Extracting facts with DeepSeek...');
      const factPrompt = buildFactExtractionPrompt(
        input.title,
        input.description,
        sources
      );

      factDigest = await retry(() => 
        callDeepSeekJSON([
          { role: 'system', content: factPrompt.system },
          { role: 'user', content: factPrompt.user }
        ])
      );

      console.log('✅ Facts extracted:', factDigest);

      // Build citations
      citations = sources.map((s, i) => 
        `[${i + 1}] ${s.title || 'Source'} - ${s.url}`
      ).join('\n');

    } else {
      // Fallback: Simple fact extraction without DeepSeek
      console.log('📝 Using simple mode (no DeepSeek)');
      factDigest = {
        facts: [
          { text: input.description, sources: [1] },
          { text: input.content.slice(0, 500), sources: [1] }
        ],
        conflicts: []
      };
      citations = `[1] ${input.title} - ${input.url || 'original source'}`;
    }

    // STEP 3: Generate Hindi article with OpenAI
    console.log('✍️ Generating Hindi article with OpenAI...');
    
    const articlePrompt = buildHindiArticlePrompt(
      input.title,
      input.description,
      factDigest,
      citations
    );

    const articleHTML = await retry(() =>
      callOpenAI(
        articlePrompt.system,
        articlePrompt.user,
        {
          temperature: 0.97,
          max_tokens: 5000,
          top_p: 0.88,
          frequency_penalty: 0.5,
          presence_penalty: 0.45
        }
      )
    );

    console.log('✅ Hindi article generated successfully');

    return {
      success: true,
      readyToPublishArticle: articleHTML,
      factDigest,
      processingTime: Date.now() - startTime,
      metadata: {
        sourcesUsed: useMultiSource ? 'multi-source' : 'single-source',
        language: language,
        modelCombination: 'DeepSeek + OpenAI'
      }
    };

  } catch (error) {
    console.error('❌ Processing error:', error);
    return {
      success: false,
      error: error.message,
      processingTime: Date.now() - startTime
    };
  }
}

/* ---------- SIMPLE MODE (Current OpenAI only) ---------- */

async function processCricketNewsOpenAI(input, options = {}) {
  const startTime = Date.now();
  
  try {
    console.log('🏏 [OpenAI Only] Processing:', input.title);
    
    if (!input.title || input.title.length < 10) {
      throw new Error('Title too short');
    }
    if (!input.description || input.description.length < 20) {
      throw new Error('Description too short');
    }
    if (!input.content || input.content.length < 300) {
      throw new Error('Content too short');
    }

    // Simple Hindi conversion prompt
    const userPrompt = `
ORIGINAL CRICKET NEWS (English):
Title: ${input.title}
Description: ${input.description}
Content: ${input.content}

TASK: Convert this to a natural, conversational Hindi article.

STYLE:
- Write like a passionate cricket fan telling a friend
- Use emotional expressions: "यार", "अरे", "वाह", "भाई"
- Keep cricket terms in English (century, wicket, runs, over)
- Short paragraphs, varied sentence length
- Casual, human tone - NOT formal journalism
- Add reactions and commentary

FORMAT:
- HTML only (no <html>, <head>, <body>)
- <h1> for main title (Hindi)
- <h2> for 3-4 subheadings
- <p> for paragraphs
- <strong> for player names and stats
- <blockquote> for important quotes

Write now - pure HTML body content:`;

    const systemPrompt = `तुम एक भारतीय क्रिकेट पत्रकार हो जो देर रात match report लिख रहे हो। Passionate हो, थके हुए हो, fast type कर रहे हो। Natural Hindi में लिखो with emotions.`;

    const articleHTML = await callOpenAI(systemPrompt, userPrompt, {
      temperature: 0.97,
      max_tokens: 5000,
      top_p: 0.88,
      frequency_penalty: 0.5,
      presence_penalty: 0.45
    });

    return {
      success: true,
      readyToPublishArticle: articleHTML,
      processingTime: Date.now() - startTime
    };

  } catch (error) {
    console.error('❌ Processing error:', error);
    return {
      success: false,
      error: error.message,
      processingTime: Date.now() - startTime
    };
  }
}

module.exports = {
  processCricketNewsOpenAI,          // Simple: OpenAI only (current)
  processCricketNewsWithDeepSeek,    // Advanced: DeepSeek + OpenAI
};