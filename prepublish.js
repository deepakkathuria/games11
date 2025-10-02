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

/* ---------- ENHANCED DATA & STATS FUNCTIONS ---------- */

async function fetchCricketStats(playerName, teamName, matchType) {
  // This function simulates fetching cricket statistics
  // In a real implementation, you would integrate with ESPNcricinfo API or similar
  const statsPrompts = {
    "Virat Kohli": {
      career: "73 centuries in international cricket, 26,000+ runs across formats",
      recent: "Averaging 45.2 in last 10 ODIs, strike rate of 89.3",
      records: "Fastest to 8000, 9000, 10000 ODI runs"
    },
    "Rohit Sharma": {
      career: "31 ODI centuries, 3 double centuries in ODIs",
      recent: "Captain of India since 2021, led team to Asia Cup 2023 victory",
      records: "Highest individual score in ODIs (264 runs)"
    },
    "MS Dhoni": {
      career: "10,000+ ODI runs, 350+ dismissals as wicketkeeper",
      recent: "Retired from international cricket in 2020",
      records: "Only captain to win all three ICC trophies"
    }
  };

  const playerStats = statsPrompts[playerName] || {
    career: "Established player with significant international experience",
    recent: "Consistent performer in recent matches",
    records: "Multiple achievements in international cricket"
  };

  return playerStats;
}

async function generateExpertOpinion(topic, context) {
  try {
    const expertPrompt = `
You are a cricket expert analyst. Provide a realistic, insightful quote about this cricket topic. Make it sound like something Harsha Bhogle, Ian Bishop, or Ravi Shastri would say.

Topic: ${topic}
Context: ${context}

Return ONLY a direct quote in quotation marks. Make it:
- 1-2 sentences max
- Insightful and analytical
- Use cricket terminology naturally
- Sound like a real expert voice
- No attribution needed (just the quote)

Example: "The way he's playing the short ball now, you can see the confidence is back in his game."
`;

    const quote = await generateWithDeepSeek(expertPrompt, { 
      temperature: 0.8, 
      max_tokens: 100 
    });
    
    return quote.trim().replace(/^["']|["']$/g, '');
  } catch (error) {
    console.error('Error generating expert opinion:', error);
    return "The conditions look challenging but the players have adapted well to the situation.";
  }
}

async function generateSocialMediaReactions(articleTitle, keyEvent) {
  try {
    const socialPrompt = `
Generate 5 realistic social media reactions (X/Twitter style) to this cricket news. Make them sound like real cricket fans would write.

Article: ${articleTitle}
Key Event: ${keyEvent}

Requirements:
- 5 different reactions
- Mix of emotions (excitement, criticism, analysis, humor, support)
- Use casual, social media language
- Include hashtags naturally
- 1-2 lines each
- Sound like real cricket fans from different perspectives
- Include some abbreviations and emojis
- Make them trending and realistic

Format each reaction on a new line starting with "• "
Example: • "Finally! Been waiting for this moment since ages 🏏 #Cricket #Victory"

Return ONLY the 5 reactions, nothing else.
`;

    const reactions = await generateWithDeepSeek(socialPrompt, { 
      temperature: 0.9, 
      max_tokens: 300 
    });
    
    return reactions.split('\n').filter(line => line.trim().startsWith('•')).slice(0, 5);
  } catch (error) {
    console.error('Error generating social reactions:', error);
    return [
      "• What a match! This is why we love cricket 🏏",
      "• Finally some good news for the team! #Cricket",
      "• Been waiting for this moment! Amazing performance 💪",
      "• Great to see the players stepping up when it matters",
      "• This changes everything for the series! #GameChanger"
    ];
  }
}

/* ---------- ENHANCED PROMPTS ---------- */

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
- Outline should follow enhanced cricket journalism structure:
  * H2: Breaking News Summary (40-60 words)
  * H2: Match/Event Details
  * H2: Key Player Performances
  * H2: Statistical Analysis
  * H2: Expert Insights
  * H2: Fan Reactions & Social Media Buzz
  * H2: What This Means Going Forward
- Provide 5 diverse keywords: primary (main topic), secondary (related terms), tertiary (specific details), long-tail (detailed phrases), trending (current buzzwords)
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
You are an elite English cricket journalist writing for a premium sports publication. Your goal is to create a compelling, narrative-rich article that goes beyond simple rewriting.

ENHANCED WRITING REQUIREMENTS:

1. REPHRASE & ELEVATE THE NARRATIVE:
- Go beyond synonym swapping - restructure sentences and paragraphs for better flow and impact
- Inject compelling narrative voice using techniques from journalists like Harsha Bhogle or Jarrod Kimber
- Use anecdotal leads, rhetorical questions, and personal insight where appropriate
- Identify and expand on the most newsworthy angle, even if original underplayed it
- Create a story arc that engages readers from start to finish

2. ENHANCE WITH EXCLUSIVE VALUE:
- Add relevant statistics and data analysis (player records, team performance, historical context)
- Include logical, well-inferred quotes from players, coaches, or analysts
- Provide richer background and historical context that original may have omitted
- Add comparative analysis with similar past events
- Include performance metrics and trends

3. OPTIMIZE STRUCTURE & SEO:
- Craft powerful, keyword-rich headline and crisp opening paragraph (40-60 words)
- Use clear, descriptive subheadings (H2, H3)
- Integrate all 5 keywords naturally: ${recPrimary || ""}, ${recSecondary || ""}, ${recTertiary || ""}, ${recLongtail || ""}, ${recTrending || ""}
- Keep paragraphs short (2-3 lines max) for digital readability
- Use bullet points for statistics and key facts

4. INCORPORATE NEW SECTIONS:
- Add realistic social media reactions (3-5 trending reactions from X/Twitter, Instagram)
- Include expert analysis and quotes
- Provide statistical context and data insights
- Add fan perspective and community reactions

ANTI-AI DETECTION RULES (ENHANCED):
- Write 100% ORIGINAL content - completely rewrite in your own words
- NEVER copy phrases or sentences from raw material directly
- VARY sentence length dramatically (3-word punchy statements, then 25-word analytical sentences)
- Use UNEXPECTED word choices and avoid predictable patterns
- Add REAL HUMAN ELEMENTS: natural imperfections, varied pacing, emotional variance
- Include specific details, dates, scores, and hard facts
- Use NAMED QUOTES with attribution when possible
- Sound like professional sports journalism, not AI-generated content

LANGUAGE REQUIREMENTS:
- Use engaging but accessible English (12th grade level)
- Mix technical cricket terms with everyday language
- Create compelling, readable content that maintains professional standards
- Use active voice and dynamic sentence structures

STRICTLY FOLLOW THE SEO OUTLINE:
${recOutline || ""}

IMPORTANT: You MUST follow the exact H2 and H3 headings from the outline above.
- Use the EXACT heading text provided in the outline
- Structure your article according to this outline
- Don't skip any sections from the outline
- Don't add extra sections not in the outline

ENHANCED WRITING STYLE:
1. START with a compelling lead that hooks the reader immediately
2. Use VARIED SENTENCE RHYTHM: Mix short punchy statements with longer analytical sentences
3. INCLUDE HARD DATA: Specific statistics, records, averages, historical comparisons
4. ADD EXPERT VOICES: Include realistic quotes from coaches, players, or analysts
5. CREATE NARRATIVE FLOW: Build tension, excitement, and engagement throughout
6. USE EMOTIONAL INTELLIGENCE: Capture the drama and significance of the event
7. PROVIDE CONTEXT: Historical background, implications, and broader significance
8. INCLUDE FAN PERSPECTIVE: Social media reactions and community sentiment
9. END with forward-looking analysis: What this means for future matches/events

HTML FORMAT:
- Return **HTML BODY ONLY** (no <html>, no <head>, no <body> tags)
- Use: <h1>, <h2>, <h3>, <p>, <ul>, <li>, <blockquote>, <strong>, <em>
- Start with <h1>${recTitle || ""}</h1>
- Use EXACT H2 and H3 headings from the outline above
- Write natural flowing paragraphs with varied lengths
- Use <strong> for player names and important stats
- Use <ul><li> for statistics and key points
- Use <blockquote> for expert quotes and social media reactions

TARGET SEO KEYWORDS (use naturally throughout content):
Primary: ${recPrimary || ""}
Secondary: ${recSecondary || ""}
Tertiary: ${recTertiary || ""}
Long-tail: ${recLongtail || ""}
Trending: ${recTrending || ""}

Raw Cricket Material (REWRITE COMPLETELY - DON'T COPY):
Title: ${rawTitle || ""}
Description: ${rawDescription || ""}
Body:
${rawBody || ""}

OUTPUT INSTRUCTIONS:
Write a comprehensive, engaging cricket news article that:
✓ Elevates the narrative beyond simple rewriting
✓ Includes exclusive value (stats, expert opinions, social reactions)
✓ Passes AI detection tools with natural, human-like writing
✓ Uses all 5 keywords naturally throughout the content
✓ Follows the exact outline structure provided
✓ Is 1000-1500 words with varied section depths
✓ Includes realistic social media reactions
✓ Provides expert analysis and statistical context
✓ Creates compelling storytelling that engages readers
✓ Maintains professional journalism standards

Start writing now - just the HTML body content, nothing else.
`.trim();
}

/* ---------- ENHANCED PARSERS & HELPERS ---------- */

function parsePrePublishTextToJSON(text = "") {
  const get = (re) => {
    const m = text.match(re);
    return m ? m[1].trim() : "";
  };

  let recommendedTitle = get(/RECOMMENDED TITLE:\s*([^\n]+)/i);
  let recommendedMeta  = get(/RECOMMENDED META DESCRIPTION:\s*([^\n]+)/i);
  let recommendedSlug  = get(/RECOMMENDED SLUG:\s*([^\n]+)/i);
  let outline          = get(/OUTLINE:\s*([\s\S]*?)(?:\n5\)|\nKEYWORDS:|$)/i);
  
  // Parse all 5 keywords
  let primary   = get(/Primary:\s*([^\n]+)/i);
  let secondary = get(/Secondary:\s*([^\n]+)/i);
  let tertiary  = get(/Tertiary:\s*([^\n]+)/i);
  let longtail  = get(/Long-tail:\s*([^\n]+)/i);
  let trending  = get(/Trending:\s*([^\n]+)/i);

  // Fallbacks
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
      primary: primary || "", 
      secondary: secondary || "", 
      tertiary: tertiary || "",
      longtail: longtail || "",
      trending: trending || ""
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
  fetchCricketStats,
  generateExpertOpinion,
  generateSocialMediaReactions,
};