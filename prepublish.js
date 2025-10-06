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
//         timeout: 120000, // Increased to 120 seconds (2 minutes) for longer articles
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

// /* ---------- ENHANCED DATA & STATS FUNCTIONS ---------- */

// async function fetchCricketStats(playerName, teamName, matchType) {
//   // This function simulates fetching cricket statistics
//   // In a real implementation, you would integrate with ESPNcricinfo API or similar
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

//     const quote = await generateWithDeepSeek(expertPrompt, { 
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

//     const reactions = await generateWithDeepSeek(socialPrompt, { 
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

// /* ---------- ENHANCED PROMPTS ---------- */

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
// You are an elite English cricket journalist writing for a premium sports publication. Your goal is to create a compelling, narrative-rich article that goes beyond simple rewriting.

// ENHANCED WRITING REQUIREMENTS:

// 1. REPHRASE & ELEVATE THE NARRATIVE:
// - Go beyond synonym swapping - restructure sentences and paragraphs for better flow and impact
// - Inject compelling narrative voice using techniques from journalists like Harsha Bhogle or Jarrod Kimber
// - Use anecdotal leads, rhetorical questions, and personal insight where appropriate
// - Identify and expand on the most newsworthy angle, even if original underplayed it
// - Create a story arc that engages readers from start to finish

// 2. ENHANCE WITH EXCLUSIVE VALUE:
// - Add relevant statistics and data analysis (player records, team performance, historical context)
// - Include logical, well-inferred quotes from players, coaches, or analysts
// - Provide richer background and historical context that original may have omitted
// - Add comparative analysis with similar past events
// - Include performance metrics and trends

// 3. OPTIMIZE STRUCTURE & SEO:
// - Craft powerful, keyword-rich headline and crisp opening paragraph (40-60 words)
// - Use clear, descriptive subheadings (H2, H3)
// - Integrate all 5 keywords naturally: ${recPrimary || ""}, ${recSecondary || ""}, ${recTertiary || ""}, ${recLongtail || ""}, ${recTrending || ""}
// - Keep paragraphs short (2-3 lines max) for digital readability
// - Use bullet points for statistics and key facts

// 4. INCORPORATE NEW SECTIONS:
// - Add realistic social media reactions (3-5 trending reactions from X/Twitter, Instagram)
// - Include expert analysis and quotes
// - Provide statistical context and data insights
// - Add fan perspective and community reactions

// ANTI-AI DETECTION RULES (ENHANCED):
// - Write 100% ORIGINAL content - completely rewrite in your own words
// - NEVER copy phrases or sentences from raw material directly
// - VARY sentence length dramatically (3-word punchy statements, then 25-word analytical sentences)
// - Use UNEXPECTED word choices and avoid predictable patterns
// - Add REAL HUMAN ELEMENTS: natural imperfections, varied pacing, emotional variance
// - Include specific details, dates, scores, and hard facts
// - Use NAMED QUOTES with attribution when possible
// - Sound like professional sports journalism, not AI-generated content

// LANGUAGE REQUIREMENTS:
// - Use engaging but accessible English (12th grade level)
// - Mix technical cricket terms with everyday language
// - Create compelling, readable content that maintains professional standards
// - Use active voice and dynamic sentence structures

// STRICTLY FOLLOW THE SEO OUTLINE:
// ${recOutline || ""}

// IMPORTANT: You MUST follow the exact H2 and H3 headings from the outline above.
// - Use the EXACT heading text provided in the outline
// - Structure your article according to this outline
// - Don't skip any sections from the outline
// - Don't add extra sections not in the outline

// ENHANCED WRITING STYLE:
// 1. START with a compelling lead that hooks the reader immediately
// 2. Use VARIED SENTENCE RHYTHM: Mix short punchy statements with longer analytical sentences
// 3. INCLUDE HARD DATA: Specific statistics, records, averages, historical comparisons
// 4. ADD EXPERT VOICES: Include realistic quotes from coaches, players, or analysts
// 5. CREATE NARRATIVE FLOW: Build tension, excitement, and engagement throughout
// 6. USE EMOTIONAL INTELLIGENCE: Capture the drama and significance of the event
// 7. PROVIDE CONTEXT: Historical background, implications, and broader significance
// 8. INCLUDE FAN PERSPECTIVE: Social media reactions and community sentiment
// 9. END with forward-looking analysis: What this means for future matches/events

// HTML FORMAT:
// - Return **HTML BODY ONLY** (no <html>, no <head>, no <body> tags)
// - Use: <h1>, <h2>, <h3>, <p>, <ul>, <li>, <blockquote>, <strong>, <em>
// - Start with <h1>${recTitle || ""}</h1>
// - Use EXACT H2 and H3 headings from the outline above
// - Write natural flowing paragraphs with varied lengths
// - Use <strong> for player names and important stats
// - Use <ul><li> for statistics and key points
// - Use <blockquote> for expert quotes and social media reactions

// TARGET SEO KEYWORDS (use naturally throughout content):
// Primary: ${recPrimary || ""}
// Secondary: ${recSecondary || ""}
// Tertiary: ${recTertiary || ""}
// Long-tail: ${recLongtail || ""}
// Trending: ${recTrending || ""}

// Raw Cricket Material (REWRITE COMPLETELY - DON'T COPY):
// Title: ${rawTitle || ""}
// Description: ${rawDescription || ""}
// Body:
// ${rawBody || ""}

// OUTPUT INSTRUCTIONS:
// Write a comprehensive, engaging cricket news article that:
// ✓ Elevates the narrative beyond simple rewriting
// ✓ Includes exclusive value (stats, expert opinions, social reactions)
// ✓ Passes AI detection tools with natural, human-like writing
// ✓ Uses all 5 keywords naturally throughout the content
// ✓ Follows the exact outline structure provided
// ✓ Is 1000-1500 words with varied section depths
// ✓ Includes realistic social media reactions
// ✓ Provides expert analysis and statistical context
// ✓ Creates compelling storytelling that engages readers
// ✓ Maintains professional journalism standards

// Start writing now - just the HTML body content, nothing else.
// `.trim();
// }

// /* ---------- ENHANCED PARSERS & HELPERS ---------- */

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
//   fetchCricketStats,
//   generateExpertOpinion,
//   generateSocialMediaReactions,
// };







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

// /* ---------- NEW: FACT EXTRACTION WITH JSON MODE ---------- */

// async function extractFactsFromContent(title, description, content) {
//   const factPrompt = `
// You are a meticulous cricket fact extractor for a newsroom.
// Extract ONLY verifiable, neutral facts from the content below.

// Return STRICT JSON with this exact structure:
// {
//   "facts": [
//     {"text": "Virat Kohli scored 112 runs off 85 balls", "category": "stat"},
//     {"text": "Match played at Eden Gardens on October 6, 2025", "category": "date"},
//     {"text": "Rohit Sharma said 'We need to focus on our bowling'", "category": "quote"}
//   ]
// }

// RULES:
// - Extract stats: scores, runs, wickets, averages, records
// - Extract quotes: direct statements from players/coaches
// - Extract dates: when events happened
// - Extract names: players, teams, venues
// - NO opinions or analysis
// - Keep under 1200 characters total
// - Return valid JSON only

// CONTENT:
// Title: ${title}
// Description: ${description}
// Body: ${content.slice(0, 3000)}
// `;

//   try {
//     console.log('🔍 Extracting facts with JSON mode...');
//     const resp = await axios.post(
//       DEEPSEEK_BASE_URL,
//       {
//         model: "deepseek-chat",
//         messages: [{ role: "user", content: factPrompt }],
//         temperature: 0.2,
//         max_tokens: 800,
//         response_format: { type: 'json_object' }
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
//           "Content-Type": "application/json",
//         },
//         timeout: 30000,
//       }
//     );
    
//     const factText = resp.data?.choices?.[0]?.message?.content || '{"facts":[]}';
//     const factData = JSON.parse(factText);
//     console.log(`✅ Extracted ${factData.facts?.length || 0} facts`);
//     return factData;
//   } catch (error) {
//     console.error('❌ Fact extraction failed:', error.message);
//     return { facts: [] };
//   }
// }

// /* ---------- NEW: PLAGIARISM CHECK WITH N-GRAM OVERLAP ---------- */

// function calculateNgramOverlap(generatedText, originalText, n = 4) {
//   const createNgrams = (text, size) => {
//     // Remove HTML tags and normalize
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

// /* ---------- ENHANCED DATA & STATS FUNCTIONS ---------- */

// async function fetchCricketStats(playerName, teamName, matchType) {
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

//     const quote = await generateWithDeepSeek(expertPrompt, { 
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

//     const reactions = await generateWithDeepSeek(socialPrompt, { 
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

// /* ---------- ENHANCED PROMPTS ---------- */

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

// /* ---------- NEW: ENHANCED REWRITE WITH FACT INJECTION ---------- */

// function buildEnhancedRewritePrompt(rawTitle, rawDescription, rawBody, facts, keywords) {
//   const factsList = facts?.facts?.length > 0 
//     ? facts.facts.map(f => `- ${f.text} [${f.category}]`).join('\n') 
//     : 'No structured facts extracted - extract from content below';
  
//   return `
// 🏏 ROLE: You are an Indian cricket journalist writing under deadline pressure. Write like a REAL HUMAN, NOT AI.

// 🎯 GOAL: Create an original, engaging cricket article that passes ALL AI detection tools (ZeroGPT, GPTZero, Copyleaks).

// ⚠️ CRITICAL ANTI-AI DETECTION RULES:

// 1. HUMAN WRITING PATTERNS:
//    - Use first person occasionally: "I think", "I noticed", "Honestly"
//    - Mix sentence lengths WILDLY: 3 words. Then ramble with a 25-word sentence, commas everywhere, thoughts spilling out.
//    - Short paragraphs, then long ones, then one-liners
//    - Use contractions: can't, won't, it's, there's, didn't
//    - Add filler: "you know", "I mean", "basically", "pretty much", "sort of"

// 2. EMOTIONAL & CASUAL:
//    - React naturally: "Man,", "Wait,", "So yeah,", "Honestly,", "Look,"
//    - Allow minor "errors": missing articles, comma splices, casual grammar
//    - Use cricket slang: "ton", "duck", "smashed it", "belted", "cracking knock"
//    - Sound excited or surprised when appropriate
//    - End casually: "Anyway, that's cricket for you." or "We'll see how this goes."

// 3. STRUCTURE VARIETY:
//    - Don't make everything uniform
//    - One paragraph = 1 line, next = 6 lines, next = 2 lines
//    - Jump topics if natural: quote, side comment, stat, back to emotion
//    - Add "thinking aloud": "umm", "honestly", "to be fair", "I guess"
//    - Leave some thoughts hanging: "That's when you just knew —"

// 4. FORBIDDEN AI PHRASES (NEVER USE):
//    ❌ "delve", "tapestry", "landscape", "realm", "navigating"
//    ❌ "in conclusion", "it's worth noting", "notably", "arguably"
//    ❌ "comprehensive", "multifaceted", "pivotal", "underscores"
//    ❌ Perfect transitions everywhere

// 5. REQUIRED HUMAN ELEMENTS:
//    ✅ Specific dates, times, scores, names
//    ✅ Repeat a word if excited (humans do this)
//    ✅ Mix proper grammar with rushed commas
//    ✅ One or two run-on sentences
//    ✅ Vary rhythm: crisp quote, rambling thought, half sentence

// 📊 EXTRACTED FACTS (use these naturally):
// ${factsList}

// 🎯 TARGET KEYWORDS (sprinkle naturally):
// - ${keywords?.primary || 'cricket'}
// - ${keywords?.secondary || 'sports'}
// - ${keywords?.tertiary || 'match'}

// 📝 STRUCTURE (3-5 sections with <h2>):
// 1. Hook opening (1-2 punchy lines)
// 2. What happened (use facts)
// 3. Key players/moments
// 4. What this means
// 5. Quick wrap-up

// 🎨 HTML FORMAT:
// - Start: <h1>${rawTitle}</h1>
// - Use <h2> for sections
// - Short <p> paragraphs (2-4 lines each)
// - <strong> for names and scores
// - <blockquote> for any quotes
// - 600-900 words total

// 📰 ORIGINAL CONTENT (REWRITE COMPLETELY):
// Title: ${rawTitle}
// Description: ${rawDescription}
// Body: ${rawBody.slice(0, 4000)}

// ⚡ START WRITING NOW - Just HTML, nothing else:
// `;
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
// You are an elite English cricket journalist writing for a premium sports publication. Your goal is to create a compelling, narrative-rich article that goes beyond simple rewriting.

// ENHANCED WRITING REQUIREMENTS:

// 1. REPHRASE & ELEVATE THE NARRATIVE:
// - Go beyond synonym swapping - restructure sentences and paragraphs for better flow and impact
// - Inject compelling narrative voice using techniques from journalists like Harsha Bhogle or Jarrod Kimber
// - Use anecdotal leads, rhetorical questions, and personal insight where appropriate
// - Identify and expand on the most newsworthy angle, even if original underplayed it
// - Create a story arc that engages readers from start to finish

// 2. ENHANCE WITH EXCLUSIVE VALUE:
// - Add relevant statistics and data analysis (player records, team performance, historical context)
// - Include logical, well-inferred quotes from players, coaches, or analysts
// - Provide richer background and historical context that original may have omitted
// - Add comparative analysis with similar past events
// - Include performance metrics and trends

// 3. OPTIMIZE STRUCTURE & SEO:
// - Craft powerful, keyword-rich headline and crisp opening paragraph (40-60 words)
// - Use clear, descriptive subheadings (H2, H3)
// - Integrate all 5 keywords naturally: ${recPrimary || ""}, ${recSecondary || ""}, ${recTertiary || ""}, ${recLongtail || ""}, ${recTrending || ""}
// - Keep paragraphs short (2-3 lines max) for digital readability
// - Use bullet points for statistics and key facts

// 4. INCORPORATE NEW SECTIONS:
// - Add realistic social media reactions (3-5 trending reactions from X/Twitter, Instagram)
// - Include expert analysis and quotes
// - Provide statistical context and data insights
// - Add fan perspective and community reactions

// ANTI-AI DETECTION RULES (ENHANCED):
// - Write 100% ORIGINAL content - completely rewrite in your own words
// - NEVER copy phrases or sentences from raw material directly
// - VARY sentence length dramatically (3-word punchy statements, then 25-word analytical sentences)
// - Use UNEXPECTED word choices and avoid predictable patterns
// - Add REAL HUMAN ELEMENTS: natural imperfections, varied pacing, emotional variance
// - Include specific details, dates, scores, and hard facts
// - Use NAMED QUOTES with attribution when possible
// - Sound like professional sports journalism, not AI-generated content

// LANGUAGE REQUIREMENTS:
// - Use engaging but accessible English (12th grade level)
// - Mix technical cricket terms with everyday language
// - Create compelling, readable content that maintains professional standards
// - Use active voice and dynamic sentence structures

// STRICTLY FOLLOW THE SEO OUTLINE:
// ${recOutline || ""}

// IMPORTANT: You MUST follow the exact H2 and H3 headings from the outline above.
// - Use the EXACT heading text provided in the outline
// - Structure your article according to this outline
// - Don't skip any sections from the outline
// - Don't add extra sections not in the outline

// ENHANCED WRITING STYLE:
// 1. START with a compelling lead that hooks the reader immediately
// 2. Use VARIED SENTENCE RHYTHM: Mix short punchy statements with longer analytical sentences
// 3. INCLUDE HARD DATA: Specific statistics, records, averages, historical comparisons
// 4. ADD EXPERT VOICES: Include realistic quotes from coaches, players, or analysts
// 5. CREATE NARRATIVE FLOW: Build tension, excitement, and engagement throughout
// 6. USE EMOTIONAL INTELLIGENCE: Capture the drama and significance of the event
// 7. PROVIDE CONTEXT: Historical background, implications, and broader significance
// 8. INCLUDE FAN PERSPECTIVE: Social media reactions and community sentiment
// 9. END with forward-looking analysis: What this means for future matches/events

// HTML FORMAT:
// - Return **HTML BODY ONLY** (no <html>, no <head>, no <body> tags)
// - Use: <h1>, <h2>, <h3>, <p>, <ul>, <li>, <blockquote>, <strong>, <em>
// - Start with <h1>${recTitle || ""}</h1>
// - Use EXACT H2 and H3 headings from the outline above
// - Write natural flowing paragraphs with varied lengths
// - Use <strong> for player names and important stats
// - Use <ul><li> for statistics and key points
// - Use <blockquote> for expert quotes and social media reactions

// TARGET SEO KEYWORDS (use naturally throughout content):
// Primary: ${recPrimary || ""}
// Secondary: ${recSecondary || ""}
// Tertiary: ${recTertiary || ""}
// Long-tail: ${recLongtail || ""}
// Trending: ${recTrending || ""}

// Raw Cricket Material (REWRITE COMPLETELY - DON'T COPY):
// Title: ${rawTitle || ""}
// Description: ${rawDescription || ""}
// Body:
// ${rawBody || ""}

// OUTPUT INSTRUCTIONS:
// Write a comprehensive, engaging cricket news article that:
// ✓ Elevates the narrative beyond simple rewriting
// ✓ Includes exclusive value (stats, expert opinions, social reactions)
// ✓ Passes AI detection tools with natural, human-like writing
// ✓ Uses all 5 keywords naturally throughout the content
// ✓ Follows the exact outline structure provided
// ✓ Is 1000-1500 words with varied section depths
// ✓ Includes realistic social media reactions
// ✓ Provides expert analysis and statistical context
// ✓ Creates compelling storytelling that engages readers
// ✓ Maintains professional journalism standards

// Start writing now - just the HTML body content, nothing else.
// `.trim();
// }

// /* ---------- NEW: ENHANCED GENERATION WITH FACT EXTRACTION & PLAGIARISM CHECK ---------- */

// async function generateEnhancedArticle({
//   rawTitle,
//   rawDescription,
//   rawBody,
//   recTitle,
//   recMeta,
//   recOutline,
//   keywords,
//   useSimpleMode = false
// }) {
//   try {
//     // Step 1: Extract facts with JSON mode
//     console.log('🔍 Step 1/3: Extracting facts...');
//     const facts = await extractFactsFromContent(rawTitle, rawDescription, rawBody);
    
//     // Step 2: Generate article
//     console.log('✍️ Step 2/3: Generating article...');
//     const prompt = useSimpleMode 
//       ? buildEnhancedRewritePrompt(rawTitle, rawDescription, rawBody, facts, keywords)
//       : buildRewriteBodyHtmlPrompt({
//           rawTitle, rawDescription, rawBody, recTitle, recMeta, recOutline,
//           recPrimary: keywords?.primary,
//           recSecondary: keywords?.secondary,
//           recTertiary: keywords?.tertiary,
//           recLongtail: keywords?.longtail,
//           recTrending: keywords?.trending,
//         });
    
//     const bodyHtml = await generateWithDeepSeek(prompt, { 
//       temperature: 0.75, 
//       max_tokens: 5000 
//     });
    
//     // Step 3: Plagiarism check
//     console.log('🔍 Step 3/3: Plagiarism check...');
//     const overlapScore = calculateNgramOverlap(bodyHtml, rawBody, 4);
//     const overlapPercent = (overlapScore * 100).toFixed(2);
    
//     console.log(`📊 Plagiarism: ${overlapPercent}% 4-gram overlap with source`);
    
//     // If plagiarism too high, regenerate
//     if (overlapScore > 0.20) {
//       console.warn('⚠️ HIGH OVERLAP DETECTED - Regenerating with more variation...');
      
//       const rewritePrompt = `
// URGENT: The following article has ${overlapPercent}% overlap with source material. 
// Rewrite it COMPLETELY with maximum variation while keeping the same facts and structure.

// RULES:
// - Change every sentence structure
// - Use completely different word choices
// - Vary paragraph lengths dramatically
// - Add more human elements: emotions, reactions, casual language
// - Keep all facts and statistics accurate
// - Make it sound like a different person wrote it
// - Increase natural imperfections

// ARTICLE TO REWRITE:
// ${bodyHtml}

// Rewrite now with MAXIMUM variation:
// `;
      
//       const rewrittenHtml = await generateWithDeepSeek(rewritePrompt, { 
//         temperature: 0.9, 
//         max_tokens: 5000 
//       });
      
//       const newOverlap = calculateNgramOverlap(rewrittenHtml, rawBody, 4);
//       console.log(`✅ After rewrite: ${(newOverlap * 100).toFixed(2)}% overlap`);
      
//       return {
//         html: rewrittenHtml,
//         plagiarismScore: newOverlap,
//         facts: facts.facts || [],
//         wasRegenerated: true
//       };
//     }
    
//     return {
//       html: bodyHtml,
//       plagiarismScore: overlapScore,
//       facts: facts.facts || [],
//       wasRegenerated: false
//     };
    
//   } catch (error) {
//     console.error('❌ Enhanced generation failed:', error.message);
//     throw error;
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
//       primary: primary || "", 
//       secondary: secondary || "", 
//       tertiary: tertiary || "",
//       longtail: longtail || "",
//       trending: trending || ""
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
//   fetchCricketStats,
//   generateExpertOpinion,
//   generateSocialMediaReactions,
//   // NEW EXPORTS
//   extractFactsFromContent,
//   calculateNgramOverlap,
//   generateEnhancedArticle,
//   buildEnhancedRewritePrompt,
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

module.exports = {
  generateWithDeepSeek,
  buildPrePublishPrompt,
  buildRewriteBodyHtmlPrompt,
  parsePrePublishTextToJSON,
  buildHtmlDocument,
  calculateNgramOverlap,
  // NEW 4-STEP PIPELINE
  generate4StepArticle,
  buildPrePublishingChecklistPrompt,
  buildHumanLikeRewritePrompt,
  buildSEOOptimizationPrompt,
  buildFinalFormattingPrompt,
};