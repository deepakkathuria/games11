const axios = require('axios');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = "https://api.openai.com/v1/chat/completions";

async function generateWithOpenAI(prompt, options = {}) {
  try {
    console.log('🤖 OpenAI API call started...');
    console.log('📊 Temperature:', options.temperature ?? 0.7);
    console.log('📝 Max tokens:', options.max_tokens ?? 2000);
    
    const response = await axios.post(OPENAI_BASE_URL, {
      model: options.model || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a senior Indian cricket journalist writing for top publications like Cricbuzz, CricketAddictor, or The Hindu Sports Desk. Write with a conversational yet journalistic tone - natural, emotional, slightly opinionated, and human. Your goal is to create articles that pass all AI-detection checks while maintaining professional journalism standards."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 2000,
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 120000, // 2 minutes for longer articles
    });
    
    const content = response.data?.choices?.[0]?.message?.content || "";
    console.log('✅ OpenAI API call completed, content length:', content.length);
    return content;
  } catch (error) {
    console.error('❌ OpenAI API error:', error.message);
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout - article generation took too long. Try again.');
    }
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      throw new Error(`OpenAI API error: ${error.response.data?.error?.message || error.message}`);
    }
    throw error;
  }
}

/* ---------- CRICKET STATS & EXPERT FUNCTIONS ---------- */

async function fetchCricketStats(playerName, teamName, matchType) {
  // Enhanced cricket statistics for OpenAI processing
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
    },
    "Babar Azam": {
      career: "Consistent top-order batsman, averaging 50+ in ODIs",
      recent: "Pakistan captain, leading run-scorer in recent series",
      records: "Fastest to 2000 T20I runs"
    },
    "Kane Williamson": {
      career: "New Zealand captain, 8000+ Test runs",
      recent: "Led New Zealand to World Test Championship victory",
      records: "Highest individual score by a New Zealand batsman in World Cups"
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

    const quote = await generateWithOpenAI(expertPrompt, { 
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

    const reactions = await generateWithOpenAI(socialPrompt, { 
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

/* ---------- CRICKET-SPECIFIC PROMPTS (Based on prepublish.js) ---------- */

function buildCricketPrePublishPrompt({ title, description, body }) {
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

function buildCricketRewriteBodyHtmlPrompt({
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
🔹 Role: You are a senior Indian cricket journalist writing for a top publication like Cricbuzz, CricketAddictor, or The Hindu Sports Desk.
🔹 Goal: Rewrite or draft the following cricket article based on the provided source while ensuring the final output reads 100% human-written and passes all AI-detection and originality checks (ZeroGPT, Copyleaks, GPTZero, etc.).

Writing Instructions:

1. Voice & Tone
   - Write in a conversational yet journalistic tone — natural, emotional, slightly opinionated, and human.
   - Add subtle personal observations, small emotional cues, and sensory details like a real reporter would ("the crowd at Wankhede roared," "you could sense the shift in dressing room mood").
   - Avoid robotic neutrality — show a writer's personality but stay factual.

2. Structure
   - Create a crisp headline (humanly phrased, not keyword-stuffed).
   - Begin with a short summary paragraph that feels like a reporter on the field wrote it.
   - Then cover sections organically — no rigid labels like "Breaking News Summary" or "Statistical Analysis."
   - Flow naturally between context, quotes, reactions, and analysis.

3. Language Style
   - Use short and long sentences mixed, include commas, dashes, and pauses like humans naturally do.
   - Use varied vocabulary and synonyms (avoid repetitive phrasing like "the decision marks a new era").
   - Occasionally use transitional phrases ("That said," "Interestingly," "For fans, the news felt bittersweet.").
   - Include mild imperfections — e.g., contractions ("it's," "didn't"), emotional adjectives ("remarkable," "unexpected"), and natural flow.

4. Human Touch & Realism
   - Blend real context (recent matches, series, known public reactions, verified social media quotes).
   - Add micro-insights — comparisons with past events, known player behavior, press-conference atmosphere, or history of player performances.
   - Mention subtle sensory or emotional details when appropriate ("Rohit's calm expression contrasted with Agarkar's assertive tone").
   - If quoting, make the quote sound natural — not perfectly polished.

5. EEAT + SEO Guidelines
   - Ensure accuracy and fact-checking. Do not invent stats or fake quotes.
   - Add real player stats or verified records to support points.
   - Maintain keyword presence naturally: ${recPrimary || ""}, ${recSecondary || ""}, ${recTertiary || ""}, ${recLongtail || ""}, ${recTrending || ""} (no overstuffing).
   - Include authorial insight to demonstrate expertise and experience.

6. AI Detection Avoidance
   - Avoid templated headings like "Key Player Performances" or "Fan Reactions."
   - Use contextual transitions rather than bullet points.
   - Include emotionally intelligent phrasing and light commentary.
   - Do not make every sentence perfectly balanced — allow for rhythm changes.

7. Output Formatting
   - Keep paragraphs between 2–4 lines.
   - Italicize or quote real remarks.
   - End with a reflective closing note, not a generic summary ("How this leadership shift unfolds could define India's ODI story for the next decade.").

HTML FORMAT:
- Return HTML BODY ONLY (no <html>, no <head>, no <body> tags)
- Use: <h1>, <h2>, <h3>, <p>, <ul>, <li>, <blockquote>, <strong>, <em>
- Start with <h1>${recTitle || ""}</h1>
- Write natural flowing paragraphs with varied lengths
- Use <strong> for player names and important stats
- Use <blockquote> for expert quotes and reactions

Source Cricket Material (REWRITE COMPLETELY - DON'T COPY):
Title: ${rawTitle || ""}
Description: ${rawDescription || ""}
Body:
${rawBody || ""}

Final Requirement:
The final output should feel like it was written by a human cricket reporter sitting in the press box, observing real reactions — not like a structured AI blog. Every sentence must sound spontaneous, context-aware, and emotionally intelligent.

Start writing now - just the HTML body content, nothing else.
`.trim();
}

/* ---------- MAIN PROCESSING FUNCTION ---------- */

async function processCricketNewsOpenAI(input, options = {}) {
  const startTime = Date.now();
  
  try {
    console.log('🏏 [Cricket OpenAI] Processing cricket article:', input.title);
    console.log('📝 [Cricket OpenAI] Original content length:', input.content?.length || 0);
    console.log('📄 [Cricket OpenAI] Original content preview:', input.content?.substring(0, 200) + '...');
    
    if (!input.title || input.title.length < 10) {
      throw new Error('Title too short');
    }
    if (!input.description || input.description.length < 20) {
      throw new Error('Description too short');
    }
    if (!input.content || input.content.length < 300) {
      throw new Error('Content too short');
    }

    // 1) Generate SEO recommendations
    console.log('📋 [Cricket OpenAI] Generating SEO recommendations...');
    const prePrompt = buildCricketPrePublishPrompt({
      title: input.title || "",
      description: input.description || "",
      body: input.content || "",
    });
    const recText = await generateWithOpenAI(prePrompt, { temperature: 0.2, max_tokens: 1200 });
    const recs = parsePrePublishTextToJSON(recText);
    console.log('✅ [Cricket OpenAI] SEO recommendations generated');

    // 2) Generate enhanced cricket article
    console.log('✍️ [Cricket OpenAI] Generating enhanced cricket article...');
    const bodyPrompt = buildCricketRewriteBodyHtmlPrompt({
      rawTitle: input.title || "",
      rawDescription: input.description || "",
      rawBody: input.content || "",
      recTitle: recs.recommendedTitle,
      recMeta: recs.recommendedMeta,
      recOutline: recs.outline,
      recPrimary: recs.keywords?.primary || "",
      recSecondary: recs.keywords?.secondary || "",
      recTertiary: recs.keywords?.tertiary || "",
      recLongtail: recs.keywords?.longtail || "",
      recTrending: recs.keywords?.trending || "",
    });
    const bodyHtml = await generateWithOpenAI(bodyPrompt, { temperature: 0.85, max_tokens: 5000 });
    console.log('✅ [Cricket OpenAI] Enhanced cricket article generated');

    return {
      success: true,
      readyToPublishArticle: bodyHtml,
      recommendations: recs,
      processingTime: Date.now() - startTime
    };

  } catch (error) {
    console.error('Process cricket news OpenAI error:', error);
    return {
      success: false,
      error: error.message,
      processingTime: Date.now() - startTime
    };
  }
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

function buildCricketHtmlDocument({ title, metaDescription, bodyHtml }) {
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

async function generateCricketHeadline(title) {
  const prompt = `Create an engaging, SEO-friendly cricket headline in English for this cricket news title. Make it:
1. Catchy and cricket-focused
2. Under 60 characters if possible
3. Include cricket keywords and terminology
4. Sound like a real cricket news headline
5. Avoid clickbait but make it compelling for cricket fans

Original cricket title: ${title}

Generate a new cricket headline:`;

  try {
    const response = await generateWithOpenAI(prompt, {
      model: "gpt-4o-mini",
      temperature: 0.8,
      max_tokens: 100
    });
    return response || title;
  } catch (error) {
    console.error('Generate cricket headline error:', error);
    return title;
  }
}

async function generateCricketMetaDescription(description) {
  const prompt = `Create an engaging cricket meta description in English for this cricket news description. Make it:
1. 150-160 characters long
2. Include key cricket information and keywords
3. Compelling for cricket fans
4. Summarize the main cricket points
5. Sound natural and cricket-focused

Original cricket description: ${description}

Generate a cricket meta description:`;

  try {
    const response = await generateWithOpenAI(prompt, {
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 200
    });
    return response || description;
  } catch (error) {
    console.error('Generate cricket meta description error:', error);
    return description;
  }
}

module.exports = {
  processCricketNewsOpenAI,
  generateCricketHeadline,
  generateCricketMetaDescription,
  buildCricketHtmlDocument,
  fetchCricketStats,
  generateExpertOpinion,
  generateSocialMediaReactions,
};