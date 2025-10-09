























// const axios = require("axios");

// const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
// const DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1/chat/completions";

// async function generateWithDeepSeek(prompt, options = {}) {
//   try {
//     console.log('🤖 DeepSeek API call started...');
//     console.log('📊 Temperature:', options.temperature ?? 0.5);
//     console.log('📝 Max tokens:', options.max_tokens ?? 2000);
    
//     const resp = await axios.post(
//       DEEPSEEK_BASE_URL,
//       {
//         model: "deepseek-chat",
//         messages: [{ role: "user", content: prompt }],
//         temperature: options.temperature ?? 0.5,
//         max_tokens: options.max_tokens ?? 2000,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
//           "Content-Type": "application/json",
//         },
//         timeout: 120000,
//       }
//     );
    
//     const content = resp.data?.choices?.[0]?.message?.content || "";
//     console.log('✅ DeepSeek API call completed, content length:', content.length);
//     return content;
//   } catch (error) {
//     console.error('❌ DeepSeek API error:', error.message);
//     if (error.code === 'ECONNABORTED') {
//       throw new Error('Request timeout - article generation took too long. Try again.');
//     }
//     if (error.response) {
//       console.error('Response status:', error.response.status);
//       console.error('Response data:', error.response.data);
//       throw new Error(`DeepSeek API error: ${error.response.data?.error?.message || error.message}`);
//     }
//     throw error;
//   }
// }

// /* ==================== 4-STEP PIPELINE ==================== */

// /* ---------- STEP 1: PRE-PUBLISHING CHECKLIST ---------- */

// function buildPrePublishingChecklistPrompt(title, description, content) {
//   return `
// You are a senior editor reviewing an article before publication. Analyze this content and provide a comprehensive pre-publishing checklist:

// PRE-PUBLISHING CHECKLIST - Please evaluate each point:

// ## CONTENT QUALITY
// - Is the title compelling and click-worthy?
// - Does the description accurately summarize the content?
// - Is the content well-structured with clear paragraphs?
// - Are there any grammatical or spelling errors?
// - Is the writing style consistent throughout?
// - Does the content flow logically from start to finish?

// ## SEO REQUIREMENTS
// - Is the title optimized for search (under 60 characters)?
// - Does the meta description include target keywords?
// - Are headings (H2, H3) used effectively?
// - Is keyword density appropriate (1-2%)?
// - Are internal linking opportunities identified?
// - Is the content length appropriate for the topic?

// ## ENGAGEMENT FACTORS
// - Does the introduction hook the reader?
// - Are there compelling subheadings?
// - Is the content scannable with bullet points or lists?
// - Are there call-to-action elements?
// - Does the conclusion provide value?
// - Is the content shareable on social media?

// ## CRICKET/SPORTS SPECIFIC
// - Are player names and statistics accurate?
// - Is the cricket terminology used correctly?
// - Are match details and dates correct?
// - Is the analysis insightful and original?
// - Does it provide value to cricket fans?
// - Are there any controversial or sensitive claims?

// ## AI DETECTION AVOIDANCE
// - Does the writing sound natural and human?
// - Are there varied sentence structures?
// - Is the tone conversational and engaging?
// - Are there personal opinions or insights?
// - Is the content original and not templated?
// - Does it avoid repetitive patterns?

// ## GOOGLE FRIENDLINESS
// - Is the content helpful and informative?
// - Does it answer user questions?
// - Is the information accurate and up-to-date?
// - Does it provide unique value?
// - Is it mobile-friendly in structure?
// - Are there any thin content issues?

// For each category, provide:
// ✅ PASS - if the requirement is met
// ⚠️ NEEDS IMPROVEMENT - if minor changes needed
// ❌ FAIL - if major issues found

// Then provide specific recommendations for improvement.

// CONTENT TO REVIEW:
// Title: ${title}
// Description: ${description}
// Content:
// ${content}
// `.trim();
// }

// /* ---------- STEP 2: HUMAN-LIKE REWRITING (MOST IMPORTANT) ---------- */

// function buildHumanLikeRewritePrompt(title, description, content) {
//   return `
// You are a real cricket journalist writing for a sports website. You need to rewrite this content to sound completely natural and human-written. The goal is to make it sound like a real person wrote it, not an AI.

// CRITICAL INSTRUCTIONS - WRITE LIKE A REAL HUMAN:
// * Use natural, conversational language - like you're talking to a friend
// * Include personal reactions and emotions
// * Use informal expressions and contractions (don't, can't, won't, etc.)
// * Add your own opinions and thoughts
// * Include natural hesitations and incomplete thoughts
// * Use varied sentence structures - some short, some long, some incomplete
// * Include cricket fan perspective and passion
// * Add personal context and memories
// * Use colloquial language and slang where appropriate
// * Make it sound spontaneous, not planned

// AVOID AI PATTERNS:
// * Don't use perfect grammar all the time
// * Don't structure everything perfectly
// * Don't use formal language
// * Don't make it sound like a news report
// * Don't use repetitive sentence structures
// * Don't sound like a template

// WRITE LIKE THIS:
// - "Man, this is crazy..."
// - "I can't believe what I'm reading..."
// - "You know what's really sad about this..."
// - "As a cricket fan, this hits different..."
// - "I've been following Faf for years and..."

// Make it sound like a real cricket journalist who's genuinely shocked and writing from the heart. Include your personal reactions, use natural language, and make it sound completely human.

// CONTENT TO REWRITE:
// Title: ${title}
// Description: ${description}
// Content:
// ${content}

// Now rewrite this in a completely natural, human way. Write like you're a real cricket fan journalist sharing this story with your readers. Make it sound authentic and genuine.
// `.trim();
// }

// /* ---------- STEP 3: SEO OPTIMIZATION ---------- */

// function buildSEOOptimizationPrompt(humanRewrittenContent, originalTitle) {
//   return `
// You are an SEO expert who specializes in making content Google-friendly while keeping it completely human and natural. Optimize this rewritten content for search engines:

// GOOGLE OPTIMIZATION REQUIREMENTS:
// * Improve title for search visibility (keep under 60 characters)
// * Optimize meta description (150-160 characters)
// * Add strategic keywords naturally
// * Improve heading structure (H2, H3)
// * Ensure content answers user questions
// * Add internal linking opportunities
// * Make it mobile-friendly in structure
// * Ensure helpful content guidelines compliance

// HUMAN-LIKE OPTIMIZATION (CRITICAL):
// * Keep the natural, conversational tone
// * Don't make it sound like SEO content
// * Maintain the human personality and voice
// * Keep emotional elements and opinions
// * Preserve the storytelling aspect
// * Don't over-optimize keywords
// * Keep it engaging and readable
// * Maintain cricket fan perspective

// OPTIMIZATION TASKS:
// 1. Create an SEO-friendly title that still sounds natural
// 2. Write a compelling meta description
// 3. Add strategic subheadings (H2, H3) that sound natural
// 4. Integrate keywords naturally without stuffing
// 5. Ensure content structure is Google-friendly
// 6. Add value that answers user intent
// 7. Keep the human-like writing style intact

// Return the optimized content that is both Google-friendly AND completely human-sounding. The goal is to rank well in search while sounding like a real cricket journalist wrote it.

// ORIGINAL TITLE: ${originalTitle}

// HUMAN-WRITTEN CONTENT TO OPTIMIZE:
// ${humanRewrittenContent}

// Now optimize this for SEO while keeping the natural, human voice. Return in this format:
// OPTIMIZED TITLE: [title here]
// META DESCRIPTION: [description here]
// CONTENT: [optimized content with H2/H3 headings]
// `.trim();
// }

// /* ---------- STEP 4: FINAL FORMATTING ---------- */

// function buildFinalFormattingPrompt(seoOptimizedContent) {
//   return `
// You are a cricket news editor. Take this optimized content and create a clean, ready-to-publish article that can be directly published on a cricket news website.

// REQUIREMENTS FOR READY-TO-PUBLISH ARTICLE:
// 1. Keep the natural, human-like writing style exactly as it is
// 2. Don't make it sound more formal or professional
// 3. Maintain the conversational tone and personal reactions
// 4. Keep the informal language and contractions
// 5. Don't add any analysis sections or suggestions
// 6. Ensure proper HTML structure with headings
// 7. Include a compelling title and meta description
// 8. Make it SEO-friendly but keep it natural and human
// 9. Ready for direct copy-paste into a CMS
// 10. No extra commentary or analysis - just the article

// FORMAT:
// - Start with the title
// - Add meta description
// - Clean article content with proper headings
// - End with a strong conclusion
// - No analysis, suggestions, or extra text

// Return ONLY the ready-to-publish article content in clean HTML format:
// <h1>Title</h1>
// <p>Content with natural flow...</p>
// <h2>Natural Subheading</h2>
// <p>More content...</p>

// CONTENT TO FORMAT:
// ${seoOptimizedContent}

// Return ONLY the clean HTML article - nothing else.
// `.trim();
// }

// /* ---------- MAIN 4-STEP PIPELINE FUNCTION ---------- */

// async function generate4StepArticle({ title, description, content }) {
//   const startTime = Date.now();
//   const results = {};
  
//   try {
//     console.log('\n🚀 Starting 4-Step Article Generation Pipeline...\n');
    
//     // STEP 1: Pre-Publishing Checklist
//     console.log('📋 STEP 1/4: Running Pre-Publishing Checklist...');
//     const checklistPrompt = buildPrePublishingChecklistPrompt(title, description, content);
//     const checklistResult = await generateWithDeepSeek(checklistPrompt, {
//       temperature: 0.3,
//       max_tokens: 1500
//     });
//     results.checklist = checklistResult;
//     console.log('✅ Step 1 Complete: Quality checks done\n');
    
//     // STEP 2: Human-Like Rewriting (MOST IMPORTANT)
//     console.log('🗣️ STEP 2/4: Rewriting like a real human journalist...');
//     const humanRewritePrompt = buildHumanLikeRewritePrompt(title, description, content);
//     const humanRewritten = await generateWithDeepSeek(humanRewritePrompt, {
//       temperature: 0.9,  // High temperature for more human variation
//       max_tokens: 4000
//     });
//     results.humanRewritten = humanRewritten;
//     console.log('✅ Step 2 Complete: Human-like rewrite done\n');
    
//     // STEP 3: SEO Optimization
//     console.log('🔍 STEP 3/4: Adding SEO optimization...');
//     const seoPrompt = buildSEOOptimizationPrompt(humanRewritten, title);
//     const seoOptimized = await generateWithDeepSeek(seoPrompt, {
//       temperature: 0.6,
//       max_tokens: 4500
//     });
//     results.seoOptimized = seoOptimized;
//     console.log('✅ Step 3 Complete: SEO optimization done\n');
    
//     // STEP 4: Final Formatting
//     console.log('📰 STEP 4/4: Creating final formatted article...');
//     const finalPrompt = buildFinalFormattingPrompt(seoOptimized);
//     const finalArticle = await generateWithDeepSeek(finalPrompt, {
//       temperature: 0.4,
//       max_tokens: 5000
//     });
//     results.finalArticle = finalArticle;
//     console.log('✅ Step 4 Complete: Final article ready\n');
    
//     // Parse optimized title and meta from SEO step
//     const titleMatch = seoOptimized.match(/OPTIMIZED TITLE:\s*([^\n]+)/i);
//     const metaMatch = seoOptimized.match(/META DESCRIPTION:\s*([^\n]+)/i);
    
//     const finalTitle = titleMatch ? titleMatch[1].trim() : title;
//     const finalMeta = metaMatch ? metaMatch[1].trim() : description;
    
//     const processingTime = Date.now() - startTime;
//     console.log(`🎉 4-Step Pipeline Complete! Total time: ${(processingTime / 1000).toFixed(2)}s\n`);
    
//     return {
//       success: true,
//       steps: {
//         step1_checklist: results.checklist,
//         step2_humanRewritten: results.humanRewritten,
//         step3_seoOptimized: results.seoOptimized,
//         step4_finalArticle: results.finalArticle
//       },
//       finalOutput: {
//         title: finalTitle,
//         metaDescription: finalMeta,
//         article: results.finalArticle
//       },
//       processingTime,
//       metadata: {
//         originalTitle: title,
//         steps: 4,
//         timestamp: new Date().toISOString()
//       }
//     };
    
//   } catch (error) {
//     console.error('❌ 4-Step Pipeline Error:', error.message);
//     return {
//       success: false,
//       error: error.message,
//       completedSteps: Object.keys(results).length,
//       partialResults: results,
//       processingTime: Date.now() - startTime
//     };
//   }
// }

// /* ---------- PLAGIARISM CHECK ---------- */

// function calculateNgramOverlap(generatedText, originalText, n = 4) {
//   const createNgrams = (text, size) => {
//     const cleanText = text
//       .replace(/<[^>]+>/g, ' ')
//       .toLowerCase()
//       .replace(/[^a-z0-9\s]/g, '')
//       .replace(/\s+/g, ' ')
//       .trim();
    
//     const words = cleanText.split(' ');
//     const ngrams = new Set();
    
//     for (let i = 0; i <= words.length - size; i++) {
//       const gram = words.slice(i, i + size).join(' ');
//       if (gram.length > 0) ngrams.add(gram);
//     }
//     return ngrams;
//   };

//   const ngrams1 = createNgrams(generatedText, n);
//   const ngrams2 = createNgrams(originalText, n);
  
//   if (ngrams1.size === 0) return 0;
  
//   let overlap = 0;
//   for (const gram of ngrams1) {
//     if (ngrams2.has(gram)) overlap++;
//   }
  
//   return overlap / ngrams1.size;
// }

// /* ---------- LEGACY FUNCTIONS (Keep for backward compatibility) ---------- */

// function buildPrePublishPrompt({ title, description, body }) {
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
// - Outline should follow enhanced cricket journalism structure
// - Provide 5 diverse keywords
// - English output
// - Be engaging and comprehensive

// INPUT
// Title: ${title || ""}
// Description: ${description || ""}
// Body:
// ${body || ""}
// `.trim();
// }

// function buildRewriteBodyHtmlPrompt({
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
// You are an elite English cricket journalist writing for a premium sports publication.

// ANTI-AI DETECTION RULES:
// - Write 100% ORIGINAL content - completely rewrite in your own words
// - VARY sentence length dramatically (3-word punchy statements, then 25-word analytical sentences)
// - Use UNEXPECTED word choices and avoid predictable patterns
// - Add REAL HUMAN ELEMENTS: natural imperfections, varied pacing, emotional variance
// - Sound like professional sports journalism, not AI-generated content

// HTML FORMAT:
// - Return HTML BODY ONLY (no <html>, no <head>, no <body> tags)
// - Use: <h1>, <h2>, <h3>, <p>, <ul>, <li>, <blockquote>, <strong>, <em>
// - Start with <h1>${recTitle || ""}</h1>

// TARGET SEO KEYWORDS: ${recPrimary || ""}, ${recSecondary || ""}, ${recTertiary || ""}, ${recLongtail || ""}, ${recTrending || ""}

// Raw Material:
// Title: ${rawTitle || ""}
// Description: ${rawDescription || ""}
// Body: ${rawBody || ""}

// Write a comprehensive, engaging cricket news article (1000-1500 words).
// `.trim();
// }

// function parsePrePublishTextToJSON(text = "") {
//   const get = (re) => {
//     const m = text.match(re);
//     return m ? m[1].trim() : "";
//   };

//   let recommendedTitle = get(/RECOMMENDED TITLE:\s*([^\n]+)/i);
//   let recommendedMeta  = get(/RECOMMENDED META DESCRIPTION:\s*([^\n]+)/i);
//   let recommendedSlug  = get(/RECOMMENDED SLUG:\s*([^\n]+)/i);
//   let outline          = get(/OUTLINE:\s*([\s\S]*?)(?:\n5\)|\nKEYWORDS:|$)/i);
  
//   let primary   = get(/Primary:\s*([^\n]+)/i);
//   let secondary = get(/Secondary:\s*([^\n]+)/i);
//   let tertiary  = get(/Tertiary:\s*([^\n]+)/i);
//   let longtail  = get(/Long-tail:\s*([^\n]+)/i);
//   let trending  = get(/Trending:\s*([^\n]+)/i);

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
//       primary, secondary, tertiary, longtail, trending
//     },
//   };
// }

// function buildHtmlDocument({ title, metaDescription, bodyHtml }) {
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

// module.exports = {
//   generateWithDeepSeek,
//   buildPrePublishPrompt,
//   buildRewriteBodyHtmlPrompt,
//   parsePrePublishTextToJSON,
//   buildHtmlDocument,
//   calculateNgramOverlap,
//   // NEW 4-STEP PIPELINE
//   generate4StepArticle,
//   buildPrePublishingChecklistPrompt,
//   buildHumanLikeRewritePrompt,
//   buildSEOOptimizationPrompt,
//   buildFinalFormattingPrompt,
// };





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
        timeout: 120000,
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

/* ==================== 4-STEP PIPELINE ==================== */

/* ---------- STEP 1: PRE-PUBLISHING CHECKLIST ---------- */

function buildPrePublishingChecklistPrompt(title, description, content) {
  return `
You are a senior editor reviewing an article before publication. Analyze this content and provide a comprehensive pre-publishing checklist:

PRE-PUBLISHING CHECKLIST - Please evaluate each point:

## CONTENT QUALITY
- Is the title compelling and click-worthy?
- Does the description accurately summarize the content?
- Is the content well-structured with clear paragraphs?
- Are there any grammatical or spelling errors?
- Is the writing style consistent throughout?
- Does the content flow logically from start to finish?

## SEO REQUIREMENTS
- Is the title optimized for search (under 60 characters)?
- Does the meta description include target keywords?
- Are headings (H2, H3) used effectively?
- Is keyword density appropriate (1-2%)?
- Are internal linking opportunities identified?
- Is the content length appropriate for the topic?

## ENGAGEMENT FACTORS
- Does the introduction hook the reader?
- Are there compelling subheadings?
- Is the content scannable with bullet points or lists?
- Are there call-to-action elements?
- Does the conclusion provide value?
- Is the content shareable on social media?

## CRICKET/SPORTS SPECIFIC
- Are player names and statistics accurate?
- Is the cricket terminology used correctly?
- Are match details and dates correct?
- Is the analysis insightful and original?
- Does it provide value to cricket fans?
- Are there any controversial or sensitive claims?

## AI DETECTION AVOIDANCE
- Does the writing sound natural and human?
- Are there varied sentence structures?
- Is the tone conversational and engaging?
- Are there personal opinions or insights?
- Is the content original and not templated?
- Does it avoid repetitive patterns?

## GOOGLE FRIENDLINESS
- Is the content helpful and informative?
- Does it answer user questions?
- Is the information accurate and up-to-date?
- Does it provide unique value?
- Is it mobile-friendly in structure?
- Are there any thin content issues?

For each category, provide:
✅ PASS - if the requirement is met
⚠️ NEEDS IMPROVEMENT - if minor changes needed
❌ FAIL - if major issues found

Then provide specific recommendations for improvement.

CONTENT TO REVIEW:
Title: ${title}
Description: ${description}
Content:
${content}
`.trim();
}

/* ---------- STEP 2: HUMAN-LIKE REWRITING (MOST IMPORTANT) ---------- */

function buildHumanLikeRewritePrompt(title, description, content) {
  return `
You are a real cricket journalist writing for a sports website. You need to rewrite this content to sound completely natural and human-written. The goal is to make it sound like a real person wrote it, not an AI.

CRITICAL INSTRUCTIONS - WRITE LIKE A REAL HUMAN:
* Use natural, conversational language - like you're talking to a friend
* Include personal reactions and emotions
* Use informal expressions and contractions (don't, can't, won't, etc.)
* Add your own opinions and thoughts
* Include natural hesitations and incomplete thoughts
* Use varied sentence structures - some short, some long, some incomplete
* Include cricket fan perspective and passion
* Add personal context and memories
* Use colloquial language and slang where appropriate
* Make it sound spontaneous, not planned

AVOID AI PATTERNS:
* Don't use perfect grammar all the time
* Don't structure everything perfectly
* Don't use formal language
* Don't make it sound like a news report
* Don't use repetitive sentence structures
* Don't sound like a template

WRITE LIKE THIS:
- "Man, this is crazy..."
- "I can't believe what I'm reading..."
- "You know what's really sad about this..."
- "As a cricket fan, this hits different..."
- "I've been following Faf for years and..."

Make it sound like a real cricket journalist who's genuinely shocked and writing from the heart. Include your personal reactions, use natural language, and make it sound completely human.

CONTENT TO REWRITE:
Title: ${title}
Description: ${description}
Content:
${content}

Now rewrite this in a completely natural, human way. Write like you're a real cricket fan journalist sharing this story with your readers. Make it sound authentic and genuine.
`.trim();
}

/* ---------- STEP 3: SEO OPTIMIZATION ---------- */

function buildSEOOptimizationPrompt(humanRewrittenContent, originalTitle) {
  return `
You are an SEO expert who specializes in making content Google-friendly while keeping it completely human and natural. Optimize this rewritten content for search engines:

GOOGLE OPTIMIZATION REQUIREMENTS:
* Improve title for search visibility (keep under 60 characters)
* Optimize meta description (150-160 characters)
* Add strategic keywords naturally
* Improve heading structure (H2, H3)
* Ensure content answers user questions
* Add internal linking opportunities
* Make it mobile-friendly in structure
* Ensure helpful content guidelines compliance

HUMAN-LIKE OPTIMIZATION (CRITICAL):
* Keep the natural, conversational tone
* Don't make it sound like SEO content
* Maintain the human personality and voice
* Keep emotional elements and opinions
* Preserve the storytelling aspect
* Don't over-optimize keywords
* Keep it engaging and readable
* Maintain cricket fan perspective

OPTIMIZATION TASKS:
1. Create an SEO-friendly title that still sounds natural
2. Write a compelling meta description
3. Add strategic subheadings (H2, H3) that sound natural
4. Integrate keywords naturally without stuffing
5. Ensure content structure is Google-friendly
6. Add value that answers user intent
7. Keep the human-like writing style intact

Return the optimized content that is both Google-friendly AND completely human-sounding. The goal is to rank well in search while sounding like a real cricket journalist wrote it.

ORIGINAL TITLE: ${originalTitle}

HUMAN-WRITTEN CONTENT TO OPTIMIZE:
${humanRewrittenContent}

Now optimize this for SEO while keeping the natural, human voice. Return in this format:
OPTIMIZED TITLE: [title here]
META DESCRIPTION: [description here]
CONTENT: [optimized content with H2/H3 headings]
`.trim();
}

/* ---------- STEP 4: FINAL FORMATTING ---------- */

function buildFinalFormattingPrompt(seoOptimizedContent) {
  return `
You are a cricket news editor. Take this optimized content and create a clean, ready-to-publish article that can be directly published on a cricket news website.

REQUIREMENTS FOR READY-TO-PUBLISH ARTICLE:
1. Keep the natural, human-like writing style exactly as it is
2. Don't make it sound more formal or professional
3. Maintain the conversational tone and personal reactions
4. Keep the informal language and contractions
5. Don't add any analysis sections or suggestions
6. Ensure proper HTML structure with headings
7. Include a compelling title and meta description
8. Make it SEO-friendly but keep it natural and human
9. Ready for direct copy-paste into a CMS
10. No extra commentary or analysis - just the article

FORMAT:
- Start with the title
- Add meta description
- Clean article content with proper headings
- End with a strong conclusion
- No analysis, suggestions, or extra text

Return ONLY the ready-to-publish article content in clean HTML format:
<h1>Title</h1>
<p>Content with natural flow...</p>
<h2>Natural Subheading</h2>
<p>More content...</p>

CONTENT TO FORMAT:
${seoOptimizedContent}

Return ONLY the clean HTML article - nothing else.
`.trim();
}

/* ---------- MAIN 4-STEP PIPELINE FUNCTION ---------- */

async function generate4StepArticle({ title, description, content }) {
  const startTime = Date.now();
  const results = {};
  
  try {
    console.log('\n🚀 Starting 4-Step Article Generation Pipeline...\n');
    
    // STEP 1: Pre-Publishing Checklist
    console.log('📋 STEP 1/4: Running Pre-Publishing Checklist...');
    const checklistPrompt = buildPrePublishingChecklistPrompt(title, description, content);
    const checklistResult = await generateWithDeepSeek(checklistPrompt, {
      temperature: 0.3,
      max_tokens: 1500
    });
    results.checklist = checklistResult;
    console.log('✅ Step 1 Complete: Quality checks done\n');
    
    // STEP 2: Human-Like Rewriting (MOST IMPORTANT)
    console.log('🗣️ STEP 2/4: Rewriting like a real human journalist...');
    const humanRewritePrompt = buildHumanLikeRewritePrompt(title, description, content);
    const humanRewritten = await generateWithDeepSeek(humanRewritePrompt, {
      temperature: 0.9,  // High temperature for more human variation
      max_tokens: 4000
    });
    results.humanRewritten = humanRewritten;
    console.log('✅ Step 2 Complete: Human-like rewrite done\n');
    
    // STEP 3: SEO Optimization
    console.log('🔍 STEP 3/4: Adding SEO optimization...');
    const seoPrompt = buildSEOOptimizationPrompt(humanRewritten, title);
    const seoOptimized = await generateWithDeepSeek(seoPrompt, {
      temperature: 0.6,
      max_tokens: 4500
    });
    results.seoOptimized = seoOptimized;
    console.log('✅ Step 3 Complete: SEO optimization done\n');
    
    // STEP 4: Final Formatting
    console.log('📰 STEP 4/4: Creating final formatted article...');
    const finalPrompt = buildFinalFormattingPrompt(seoOptimized);
    const finalArticle = await generateWithDeepSeek(finalPrompt, {
      temperature: 0.4,
      max_tokens: 5000
    });
    results.finalArticle = finalArticle;
    console.log('✅ Step 4 Complete: Final article ready\n');
    
    // Parse optimized title and meta from SEO step
    const titleMatch = seoOptimized.match(/OPTIMIZED TITLE:\s*([^\n]+)/i);
    const metaMatch = seoOptimized.match(/META DESCRIPTION:\s*([^\n]+)/i);
    
    const finalTitle = titleMatch ? titleMatch[1].trim() : title;
    const finalMeta = metaMatch ? metaMatch[1].trim() : description;
    
    const processingTime = Date.now() - startTime;
    console.log(`🎉 4-Step Pipeline Complete! Total time: ${(processingTime / 1000).toFixed(2)}s\n`);
    
    return {
      success: true,
      steps: {
        step1_checklist: results.checklist,
        step2_humanRewritten: results.humanRewritten,
        step3_seoOptimized: results.seoOptimized,
        step4_finalArticle: results.finalArticle
      },
      finalOutput: {
        title: finalTitle,
        metaDescription: finalMeta,
        article: results.finalArticle
      },
      processingTime,
      metadata: {
        originalTitle: title,
        steps: 4,
        timestamp: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error('❌ 4-Step Pipeline Error:', error.message);
    return {
      success: false,
      error: error.message,
      completedSteps: Object.keys(results).length,
      partialResults: results,
      processingTime: Date.now() - startTime
    };
  }
}

/* ---------- PLAGIARISM CHECK ---------- */

function calculateNgramOverlap(generatedText, originalText, n = 4) {
  const createNgrams = (text, size) => {
    const cleanText = text
      .replace(/<[^>]+>/g, ' ')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    const words = cleanText.split(' ');
    const ngrams = new Set();
    
    for (let i = 0; i <= words.length - size; i++) {
      const gram = words.slice(i, i + size).join(' ');
      if (gram.length > 0) ngrams.add(gram);
    }
    return ngrams;
  };

  const ngrams1 = createNgrams(generatedText, n);
  const ngrams2 = createNgrams(originalText, n);
  
  if (ngrams1.size === 0) return 0;
  
  let overlap = 0;
  for (const gram of ngrams1) {
    if (ngrams2.has(gram)) overlap++;
  }
  
  return overlap / ngrams1.size;
}

/* ---------- LEGACY FUNCTIONS (Keep for backward compatibility) ---------- */

function buildPrePublishPrompt({ title, description, body }) {
  return `
You are an expert English cricket journalist and SEO editor. Analyze this cricket news and provide comprehensive SEO recommendations.

Return ONLY these fields in plain text (no JSON, no markdown). Keep each on a single line except Outline which can be multiple lines.

1) RECOMMENDED TITLE:
2) RECOMMENDED META DESCRIPTION:
3) RECOMMENDED SLUG: (kebab-case, short)
4) OUTLINE: (use lines like "H2: ..." and "H3: ...")
5) KEYWORDS:
- Primary: ...
- Secondary: ...
- Tertiary: ...
- Long-tail: ...
- Trending: ...

ENHANCED SEO RULES FOR CRICKET NEWS:
- Use ONLY facts from input (no invented scores/quotes/dates/venues)
- Make title engaging and cricket-specific (include team names, match type, key result)
- Meta description should highlight the main cricket story and create curiosity
- Outline should follow enhanced cricket journalism structure
- Provide 5 diverse keywords
- English output
- Be engaging and comprehensive

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
  recTertiary,
  recLongtail,
  recTrending,
}) {
  return `
You are an elite English cricket journalist writing for a premium sports publication.

ANTI-AI DETECTION RULES:
- Write 100% ORIGINAL content - completely rewrite in your own words
- VARY sentence length dramatically (3-word punchy statements, then 25-word analytical sentences)
- Use UNEXPECTED word choices and avoid predictable patterns
- Add REAL HUMAN ELEMENTS: natural imperfections, varied pacing, emotional variance
- Sound like professional sports journalism, not AI-generated content

HTML FORMAT:
- Return HTML BODY ONLY (no <html>, no <head>, no <body> tags)
- Use: <h1>, <h2>, <h3>, <p>, <ul>, <li>, <blockquote>, <strong>, <em>
- Start with <h1>${recTitle || ""}</h1>

TARGET SEO KEYWORDS: ${recPrimary || ""}, ${recSecondary || ""}, ${recTertiary || ""}, ${recLongtail || ""}, ${recTrending || ""}

Raw Material:
Title: ${rawTitle || ""}
Description: ${rawDescription || ""}
Body: ${rawBody || ""}

Write a comprehensive, engaging cricket news article (1000-1500 words).
`.trim();
}

function parsePrePublishTextToJSON(text = "") {
  const get = (re) => {
    const m = text.match(re);
    return m ? m[1].trim() : "";
  };

  let recommendedTitle = get(/RECOMMENDED TITLE:\s*([^\n]+)/i);
  let recommendedMeta  = get(/RECOMMENDED META DESCRIPTION:\s*([^\n]+)/i);
  let recommendedSlug  = get(/RECOMMENDED SLUG:\s*([^\n]+)/i);
  let outline          = get(/OUTLINE:\s*([\s\S]*?)(?:\n5\)|\nKEYWORDS:|$)/i);
  
  let primary   = get(/Primary:\s*([^\n]+)/i);
  let secondary = get(/Secondary:\s*([^\n]+)/i);
  let tertiary  = get(/Tertiary:\s*([^\n]+)/i);
  let longtail  = get(/Long-tail:\s*([^\n]+)/i);
  let trending  = get(/Trending:\s*([^\n]+)/i);

  if (!recommendedTitle) recommendedTitle = "Cricket update";
  if (!recommendedMeta)  recommendedMeta  = "Latest cricket update.";
  if (!recommendedSlug)  recommendedSlug  = recommendedTitle;
  if (!outline)          outline          = "H2: Match Summary\nH3: Key Moments";
  if (!primary)          primary          = "cricket";
  if (!secondary)        secondary        = "sports";
  if (!tertiary)         tertiary         = "match";
  if (!longtail)         longtail         = "cricket news";
  if (!trending)         trending         = "cricket updates";

  return {
    recommendedTitle: recommendedTitle.slice(0, 65),
    recommendedMeta:  recommendedMeta.slice(0, 160),
    recommendedSlug:  recommendedSlug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
    outline,
    keywords: { 
      primary, secondary, tertiary, longtail, trending
    },
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
    '  <meta name="keywords" content="cricket, sports, news, analysis, commentary" />',
    '  <meta name="author" content="Cricket News Team" />',
    '  <meta property="og:title" content="' + safeTitle + '" />',
    '  <meta property="og:description" content="' + safeMeta + '" />',
    '  <meta property="og:type" content="article" />',
    "</head>",
    "<body>",
    body,
    "</body>",
    "</html>",
  ].join("\n");
}

/* ==================== OPENAI GPT-4 REGENERATION ==================== */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = "https://api.openai.com/v1/chat/completions";

async function generateWithOpenAI(prompt, options = {}) {
  try {
    console.log('🤖 OpenAI GPT-4 API call started...');
    console.log('📊 Temperature:', options.temperature ?? 0.7);
    console.log('📝 Max tokens:', options.max_tokens ?? 3000);
    
    const resp = await axios.post(
      OPENAI_BASE_URL,
      {
        model: options.model || "gpt-5",  // Using GPT-4o (latest)
        messages: [
          {
            role: "system",
            content: options.systemPrompt || "You are a professional cricket journalist with 2-3 years of experience at CricketAddictor.com"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 3000,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 120000,
      }
    );
    
    const content = resp.data?.choices?.[0]?.message?.content || "";
    console.log('✅ OpenAI GPT-4 call completed, content length:', content.length);
    return content;
  } catch (error) {
    console.error('❌ OpenAI API error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      throw new Error(`OpenAI API error: ${error.response.data?.error?.message || error.message}`);
    }
    throw error;
  }
}

function buildCricketAddictorPrompt(title, description, content) {
  return `
Write a professional cricket news article based on the following source text or topic.

🎯 Objective: The article must sound 100% human-written — not robotic or AI-generated. It should read like it's written by a sports journalist with 2–3 years of experience at Cricket Addictor.

🗞️ Tone & Style:
• Conversational yet professional (like a passionate cricket writer).
• Add light human elements — curiosity, mild opinions, nostalgic phrases, or natural imperfections.
• Avoid robotic sentence flow or perfect grammar; include minor sentence-length variations or natural human pauses.
• Keep it engaging, readable, and emotionally connected to cricket fans.

✍️ Structure:
1. Headline: Short, strong, and clear (avoid clickbait).
2. Intro paragraph: Hook the reader with context and tone.
3. Sub-headings (###) to break sections (use storytelling flow).
4. Body paragraphs:
   - Include facts, quotes, and emotions.
   - Use a mix of short and medium sentences.
   - Add 1–2 human touch lines like "You can't help but smile reading this" or "It just feels like vintage Dhoni all over again."
5. Ending paragraph: A personal reflection or fan-like takeaway.

⚙️ Rules:
• No generic AI phrases like "In conclusion," "Overall," or "According to reports."
• Avoid over-polished or repetitive structures.
• Include 1–2 natural errors (for realism), but keep it subtle.
• Do not use overly complex words or filler fluff.
• Make sure the final output looks ready to publish on CricketAddictor.com.

🏏 Source Content:
Title: ${title}
Description: ${description}
Content: ${content}

✅ Output Format:
Return the article in clean HTML format with:
- <h1> for main headline
- <h2> for sub-sections
- <p> for paragraphs
- <strong> for emphasis
- 400-600 words total

Write the article now:
`.trim();
}

async function regenerateWithOpenAI({ title, description, content }) {
  const startTime = Date.now();
  
  try {
    console.log('\n🎨 Starting OpenAI GPT-4 Regeneration...\n');
    console.log('📰 Article:', title?.substring(0, 50) + '...');
    
    // Build the Cricket Addictor style prompt
    const prompt = buildCricketAddictorPrompt(title, description, content);
    
    // Generate with OpenAI GPT-4o
    const articleHTML = await generateWithOpenAI(prompt, {
      model: "gpt-4o",  // or "gpt-4-turbo" or "gpt-4"
      temperature: 0.8,  // Higher for more human variation
      max_tokens: 3000,
      systemPrompt: "You are a professional cricket journalist with 2-3 years of experience at CricketAddictor.com. Write engaging, human-like cricket news articles that sound natural and passionate."
    });
    
    // Extract title from generated content
    const titleMatch = articleHTML.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const generatedTitle = titleMatch ? titleMatch[1].trim() : title;
    
    // Generate meta description from first paragraph
    const paraMatch = articleHTML.match(/<p[^>]*>(.*?)<\/p>/i);
    const metaDescription = paraMatch 
      ? paraMatch[1].replace(/<[^>]+>/g, '').trim().slice(0, 160)
      : description;
    
    // Check plagiarism
    const plagiarismScore = calculateNgramOverlap(articleHTML, content, 4);
    const plagiarismPercent = (plagiarismScore * 100).toFixed(2);
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ OpenAI regeneration complete!`);
    console.log(`   📊 Plagiarism: ${plagiarismPercent}%`);
    console.log(`   ⏱️ Time: ${(processingTime / 1000).toFixed(2)}s\n`);
    
    return {
      success: true,
      generatedArticle: articleHTML,
      title: generatedTitle,
      metaDescription: metaDescription,
      slug: generatedTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
      plagiarismScore: plagiarismPercent + '%',
      processingTime,
      model: 'gpt-4o',
      style: 'CricketAddictor'
    };
    
  } catch (error) {
    console.error('❌ OpenAI regeneration failed:', error.message);
    return {
      success: false,
      error: error.message,
      processingTime: Date.now() - startTime
    };
  }
}

/* ==================== EXPORTS ==================== */

module.exports = {
  // DeepSeek functions
  generateWithDeepSeek,
  buildPrePublishPrompt,
  buildRewriteBodyHtmlPrompt,
  parsePrePublishTextToJSON,
  buildHtmlDocument,
  calculateNgramOverlap,
  
  // 4-Step Pipeline
  generate4StepArticle,
  buildPrePublishingChecklistPrompt,
  buildHumanLikeRewritePrompt,
  buildSEOOptimizationPrompt,
  buildFinalFormattingPrompt,
  
  // OpenAI GPT-4 Regeneration
  regenerateWithOpenAI,
  generateWithOpenAI,
  buildCricketAddictorPrompt,
};