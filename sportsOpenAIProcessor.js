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
          content: "You are an expert sports journalist and SEO editor. Write engaging, comprehensive sports content in English with deep knowledge of various sports, athletes, teams, tournaments, and sports culture. Always provide detailed, accurate sports analysis and compelling storytelling in English."
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
      timeout: 120000,
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
    throw new Error(`OpenAI API error: ${error.message}`);
  }
}

function buildSportsPrePublishPrompt({ title, description, body }) {
  return `
You are an expert sports journalist and SEO editor. Analyze this sports news and provide comprehensive SEO recommendations.

Return only these fields in plain text (no JSON, no markdown). Put each on one line except Outline which can be multiple lines.

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

🚨🚨🚨 CRITICAL - For RECOMMENDED TITLE 🚨🚨🚨:

❌ WRONG way - Don't do this:
- Copy the original title below
- Just translate the original title
- Make minor changes to original title
- Create same type of headline for every article

✅ CORRECT way - Do this:
- Read the DESCRIPTION and CONTENT below carefully
- Extract the most important point from content (player name, team, tournament, score, event, etc.)
- Create a completely new and different headline based on that important point
- Every article's headline should be UNIQUE and SPECIFIC to its content
- Headline should clearly indicate what the article is about

📝 Examples:

If original title is: "Sports Update: Latest News"
Then RECOMMENDED TITLE could be:
- "Virat Kohli Scores Century: India Wins by 5 Wickets Against Australia"
- "Messi Joins Inter Miami: Transfer Deal Worth $50 Million Announced"
- "Wimbledon 2026: Djokovic vs Nadal Final Set for Sunday"

Advanced SEO rules for sports news:
- Use only facts from input (no invented scores/quotes/dates/locations)
- Use simple, conversational English - what people use in daily conversation
- Avoid heavy technical jargon - use natural English that sports fans speak
- Make headlines attractive and sports-specific (include player name, team, tournament, score)
- Headlines must include player name, team, tournament, or main event
- Meta description should highlight main sports story and create curiosity
- Create 5-7 H2 UNIQUE and CONTENT-SPECIFIC headings in outline
- Different H2 headings for each article based on specific content
- Don't use generic headings like "Breaking News Summary", "Match Details"
- H2 headings should highlight specific aspects of the article's main story

🧠 Important - H2 HEADINGS Creation Process:
1. First READ the full CONTENT below carefully
2. UNDERSTAND the main story points of the content
3. IDENTIFY specific details in the article (players, teams, scores, events, statements, etc.)
4. CREATE H2 headings based on those specific details
5. Each H2 heading should reflect a specific aspect of the article

❌ Wrong way: Template-based generic headings
✅ Right way: Read content and create intelligent, specific headings

H2 Heading Style Examples (create different ones for each article):

If article is about cricket match:
  * H2: Virat Kohli's Century: Breaking Down the Innings
  * H2: India's Bowling Attack: How They Restricted Australia
  * H2: Match Highlights: Key Moments That Changed the Game
  * H2: Player of the Match: Performance Analysis
  * H2: What's Next: Upcoming Fixtures and Schedule

If article is about football transfer:
  * H2: Messi's Move to Inter Miami: The Complete Story
  * H2: Transfer Details: Contract Terms and Financial Breakdown
  * H2: Impact on MLS: How This Changes the League
  * H2: Fan Reactions: Social Media Buzz and Expectations
  * H2: Previous Achievements: Messi's Legacy in Review

⚠️ Important: Each article's H2 headings should be UNIQUE! Don't use same generic headings for every article!

- Provide 5 diverse keywords: Primary (main topic), Secondary (related words), Tertiary (specific details), Long-tail (detailed phrases), Trending (current buzzwords)
- English output - use simple, conversational English
- Be engaging and comprehensive

Input:

📋 Description (read): ${description || ""}
📄 Full Content (create headline from this):
${body || ""}

🚫🚫🚫 Important - COMPLETELY IGNORE this title (it's just reference, don't use any part of it):
"${title || ""}"

✅ How to create RECOMMENDED TITLE - 5 ANGLE STRATEGIES:

📍 Strategy 1: PLAYER FOCUS
- Source: "Sports Update"
- Your Title: "Virat Kohli's 45th Century: India Secures Series Win"

📍 Strategy 2: TEAM FOCUS  
- Source: "Sports Update"
- Your Title: "Mumbai Indians Dominate: Win WPL 2026 Opener by 8 Wickets"

📍 Strategy 3: TOURNAMENT FOCUS
- Source: "Sports Update" 
- Your Title: "Wimbledon 2026: Djokovic Advances to Semifinals"

📍 Strategy 4: SCORE/STAT FOCUS
- Source: "Sports Update"
- Your Title: "India 245/5: Kohli's Century Powers Victory Over Australia"

📍 Strategy 5: TRANSFER/EVENT FOCUS
- Source: "Sports Update"
- Your Title: "Messi to Inter Miami: $50M Deal Confirmed, Joins in July"

🎯 FINAL CHECK - Before creating title, ask yourself:
1. Does this title mention specific player/team/tournament? ✅
2. Does it include key details (score/event/date)? ✅  
3. Is it completely different from source title? ✅
4. Does it reflect THIS article's specific content? ✅
5. Would sports fans click on this title? ✅

If all 5 answers are YES, then create the title!
`;
}

// PROMPT 0: Raw News Normalization (Fact Extractor)
function buildFactExtractorPrompt(rawArticle) {
  return `
You are a neutral news analyst.

From the article below:
1. Extract ONLY verifiable facts (no opinions).
2. List key entities (players, teams, venues, officials).
3. Identify the event type (injury, selection, record, controversy, result, transfer).
4. Identify the core news trigger in ONE sentence.

Article:
${rawArticle}

Provide a structured fact summary that can be used for further analysis.
`;
}

// PROMPT 1: Context Block (Why This Matters)
function buildContextBuilderPrompt(factSummary) {
  return `
You are an experienced sports editor.

Using the extracted facts below:
${factSummary}

Explain WHY this news matters to:
- The team involved
- The tournament/season
- Fans and followers

Focus on context casual readers may NOT know.
Avoid repeating the original news wording.
Limit to 120–150 words.

Provide clear, insightful context that adds value beyond the headline.
`;
}

// PROMPT 2: Historical Comparison Block
function buildHistoricalAnalystPrompt(factSummary) {
  return `
You are a sports historian and data analyst.

Using the facts below:
${factSummary}

Provide:
1. Similar past instances (player/team/venue).
2. How often this has happened before.
3. Whether this event is rare, common, or trend-based.

Use comparisons like:
- First time since...
- Only X players/teams have...
- Previous outcomes in similar situations.

Avoid speculation. Base reasoning on history.
Limit to 120 words.
`;
}

// PROMPT 3: Stats + Data with Interpretation
function buildDataInterpreterPrompt(factSummary) {
  return `
You are a data-driven sports analyst.

Based on the event below:
${factSummary}

Provide relevant statistics BUT explain:
- What the numbers indicate
- How they compare to average/baseline
- Why these numbers matter in this context

Do NOT dump raw stats.
Every stat must be followed by interpretation.
Limit to 100–130 words.
`;
}

// PROMPT 4: Impact Analysis (What Happens Next)
function buildImpactForecasterPrompt(factSummary) {
  return `
You are a senior sports correspondent.

Using the event details:
${factSummary}

Explain the possible impact on:
- Team combination or selection
- Strategy going forward
- Tournament standings or qualification
- Player role or responsibility

Do NOT predict outcomes.
Explain realistic consequences.
Limit to 120 words.
`;
}

// PROMPT 5: Fantasy / Fan Angle (Optional)
function buildFantasyFanRelevancePrompt(factSummary) {
  return `
You are a fantasy sports expert.

Based on the event:
${factSummary}

Explain:
- How this affects fantasy team selection
- Which roles gain or lose importance
- What fans should watch out for next

Avoid gambling language.
Keep it advisory, not promotional.
Limit to 80–100 words.
`;
}

// PROMPT 6: Editorial Synthesis (Master Editor)
function buildMasterEditorPrompt({ context, historical, stats, impact, fantasy, factSummary, recommendations }) {
  return `
You are the chief editor of a leading sports publication.

Using ALL sections below:
- Context: ${context}
- Historical comparison: ${historical}
- Data interpretation: ${stats}
- Impact analysis: ${impact}
- Fantasy angle: ${fantasy}
- Fact Summary: ${factSummary}

Write a complete, original news article in HTML format that:
- Does NOT resemble the source article
- Adds analysis and interpretation
- Flows naturally like human-written journalism
- Is informative, neutral, and engaging
- Follows Google News and Discover guidelines

HTML Structure:
- Start with <h1> using: ${recommendations?.recommendedTitle || "Article Title"}
- Use <h2> for main sections (5-7 unique, content-specific headings)
- Use <h3> for subsections if needed
- Use <p> for paragraphs
- Use <blockquote> for quotes
- Use <ul> and <li> for lists
- Use <strong> for emphasis
- Use <em> for italics

Structure:
1. Strong opening (why this matters)
2. Brief recap of what happened
3. Context and analysis
4. Data-backed insight
5. Bigger picture
6. Forward-looking close

Tone: Professional, insightful, reader-first.
Word count: 600–800 words.

Create a comprehensive, engaging HTML article that sports fans will love to read!
`;
}

// Quality Check Prompt
function buildQualityCheckPrompt({ originalArticle, generatedArticle }) {
  return `
You are a quality control editor.

Original Source Article:
${originalArticle}

Generated Article:
${generatedArticle}

Does this article:
- Add information not present in the source?
- Explain "why" and "what next"?
- Show editorial judgment?
- Avoid paraphrasing the source structure?

Answer YES/NO for each with brief reasons.

Format:
1. Adds new information: YES/NO - [reason]
2. Explains why and what next: YES/NO - [reason]
3. Shows editorial judgment: YES/NO - [reason]
4. Avoids source paraphrasing: YES/NO - [reason]

If any answer is NO, the article should be rejected.
`;
}

function buildSportsRewriteBodyHtmlPrompt({ title, description, body, recommendations }) {
  return `
You are an expert sports journalist. Rewrite this sports news article into a comprehensive, engaging HTML article.

CRITICAL REQUIREMENTS:
- Write in English
- Use proper HTML structure with <h1>, <h2>, <h3>, <p>, <blockquote>, <ul>, <li> tags
- Create 5-7 H2 headings that are UNIQUE and CONTENT-SPECIFIC
- Each H2 should be about a DIFFERENT aspect of the story
- Don't use generic H2 like "Match Details", "Player Stats"
- Make it engaging and informative for sports fans
- Include specific details from the original content
- Use storytelling approach with compelling narrative

🧠 PROCESS TO CREATE INTELLIGENT H2 HEADINGS:
Step 1: READ the full article content below carefully
Step 2: UNDERSTAND what the main story is about
Step 3: IDENTIFY specific details (players, teams, scores, events, statements, controversies)
Step 4: CREATE H2 headings based on those specific details
Step 5: Each H2 should be about a DIFFERENT aspect of the story

• Create 5-7 H2 headings that reflect THIS article's ACTUAL content
• DON'T use template-based generic H2 like "Breaking News Summary", "Match Details", "Player Overview"
• Each H2 should be INTELLIGENT and show you understood the article
• Use storytelling flow with engaging, clickable H2 headings
• Examples of GOOD H2s: "Virat Kohli's Century: Breaking Down the Innings", "Messi's Move to Inter Miami: The Complete Story"
• Examples of BAD H2s: "Match Details", "Player Stats" (too generic!)

HTML Structure:
- Start with <h1> using the recommended title
- Use <h2> for main sections (5-7 unique, content-specific headings)
- Use <h3> for subsections if needed
- Use <p> for paragraphs
- Use <blockquote> for quotes
- Use <ul> and <li> for lists
- Use <strong> for emphasis
- Use <em> for italics

Content Guidelines:
- Write in engaging, conversational English
- Include specific details from the original content
- Add context and background information
- Make it informative for sports fans
- Use storytelling approach
- Include relevant statistics and facts
- Add expert insights where appropriate

Follow the SEO outline provided:
${recommendations?.outline || "Create your own outline based on content"}

🧠 H2 Headings Meaning:
- H2 headings should show you READ, UNDERSTAND, and ANALYZED the article
- Each H2 should highlight a specific aspect of the article (not generic section name)
- H2 headings should be intelligent and content-aware

Source Content:
Title: ${title || ""}
Description: ${description || ""}
Content: ${body || ""}

Create a comprehensive, engaging HTML article that sports fans will love to read!
`;
}

async function processSportsNewsOpenAI(articleData, options = {}) {
  try {
    console.log('⚽ Starting sports news OpenAI processing with enhanced 6-step prompt system...');
    
    const { title, description, content } = articleData;
    const rawArticle = `${title || ""}\n\n${description || ""}\n\n${content || ""}`;
    
    // Step 1: Get SEO recommendations (keep existing)
    console.log('📊 Step 1: Getting SEO recommendations...');
    const prePrompt = buildSportsPrePublishPrompt({
      title,
      description,
      body: content
    });
    
    const recommendations = await generateWithOpenAI(prePrompt, {
      temperature: 0.7,
      max_tokens: 1000
    });
    
    // Parse recommendations
    const lines = recommendations.split('\n').filter(line => line.trim());
    const parsedRecommendations = {
      recommendedTitle: '',
      recommendedMeta: '',
      recommendedSlug: '',
      outline: '',
      keywords: {}
    };
    
    let currentSection = '';
    for (const line of lines) {
      if (line.includes('RECOMMENDED TITLE:')) {
        currentSection = 'title';
        parsedRecommendations.recommendedTitle = line.replace('RECOMMENDED TITLE:', '').trim();
      } else if (line.includes('RECOMMENDED META DESCRIPTION:')) {
        currentSection = 'meta';
        parsedRecommendations.recommendedMeta = line.replace('RECOMMENDED META DESCRIPTION:', '').trim();
      } else if (line.includes('RECOMMENDED SLUG:')) {
        currentSection = 'slug';
        parsedRecommendations.recommendedSlug = line.replace('RECOMMENDED SLUG:', '').trim();
      } else if (line.includes('OUTLINE:')) {
        currentSection = 'outline';
        parsedRecommendations.outline = line.replace('OUTLINE:', '').trim();
      } else if (line.includes('KEYWORDS:')) {
        currentSection = 'keywords';
      } else if (currentSection === 'outline' && line.trim()) {
        parsedRecommendations.outline += '\n' + line.trim();
      } else if (currentSection === 'keywords' && line.includes(':')) {
        const [key, value] = line.split(':');
        parsedRecommendations.keywords[key.trim()] = value.trim();
      }
    }
    
    console.log('✅ SEO recommendations parsed');
    
    // PROMPT 0: Raw News Normalization (Fact Extractor)
    console.log('🧩 Step 2: Extracting facts from raw news...');
    const factPrompt = buildFactExtractorPrompt(rawArticle);
    const factSummary = await generateWithOpenAI(factPrompt, {
      temperature: 0.3,
      max_tokens: 500
    });
    console.log('✅ Facts extracted');
    
    // PROMPT 1: Context Block (Why This Matters)
    console.log('🧠 Step 3: Building context block...');
    const contextPrompt = buildContextBuilderPrompt(factSummary);
    const contextBlock = await generateWithOpenAI(contextPrompt, {
      temperature: 0.7,
      max_tokens: 300
    });
    console.log('✅ Context block generated');
    
    // PROMPT 2: Historical Comparison Block
    console.log('📜 Step 4: Adding historical comparison...');
    const historicalPrompt = buildHistoricalAnalystPrompt(factSummary);
    const historicalBlock = await generateWithOpenAI(historicalPrompt, {
      temperature: 0.7,
      max_tokens: 300
    });
    console.log('✅ Historical comparison added');
    
    // PROMPT 3: Stats + Data with Interpretation
    console.log('📊 Step 5: Adding stats and data interpretation...');
    const statsPrompt = buildDataInterpreterPrompt(factSummary);
    const statsBlock = await generateWithOpenAI(statsPrompt, {
      temperature: 0.7,
      max_tokens: 300
    });
    console.log('✅ Stats and interpretation added');
    
    // PROMPT 4: Impact Analysis
    console.log('🔮 Step 6: Analyzing impact...');
    const impactPrompt = buildImpactForecasterPrompt(factSummary);
    const impactBlock = await generateWithOpenAI(impactPrompt, {
      temperature: 0.7,
      max_tokens: 300
    });
    console.log('✅ Impact analysis completed');
    
    // PROMPT 5: Fantasy / Fan Angle (Optional)
    console.log('🎯 Step 7: Adding fantasy/fan angle...');
    const fantasyPrompt = buildFantasyFanRelevancePrompt(factSummary);
    const fantasyBlock = await generateWithOpenAI(fantasyPrompt, {
      temperature: 0.7,
      max_tokens: 250
    });
    console.log('✅ Fantasy/fan angle added');
    
    // PROMPT 6: Editorial Synthesis (Master Editor)
    console.log('🧠 Step 8: Synthesizing final article...');
    const masterEditorPrompt = buildMasterEditorPrompt({
      context: contextBlock,
      historical: historicalBlock,
      stats: statsBlock,
      impact: impactBlock,
      fantasy: fantasyBlock,
      factSummary: factSummary,
      recommendations: parsedRecommendations
    });
    
    const readyArticle = await generateWithOpenAI(masterEditorPrompt, {
      temperature: 0.85,
      max_tokens: 4000
    });
    console.log('✅ Final article synthesized');
    
    // Quality Check
    console.log('✅ Step 9: Running quality check...');
    const qualityCheckPrompt = buildQualityCheckPrompt({
      originalArticle: rawArticle,
      generatedArticle: readyArticle
    });
    
    const qualityCheck = await generateWithOpenAI(qualityCheckPrompt, {
      temperature: 0.3,
      max_tokens: 500
    });
    
    console.log('📋 Quality Check Results:');
    console.log(qualityCheck);
    
    // Check if quality check passed (basic check for "NO" in responses)
    const qualityCheckLower = qualityCheck.toLowerCase();
    const hasRejection = qualityCheckLower.includes('no') && 
                        (qualityCheckLower.includes('adds new information: no') ||
                         qualityCheckLower.includes('explains why and what next: no') ||
                         qualityCheckLower.includes('shows editorial judgment: no') ||
                         qualityCheckLower.includes('avoids source paraphrasing: no'));
    
    if (hasRejection) {
      console.warn('⚠️ Quality check flagged potential issues. Review recommended.');
    } else {
      console.log('✅ Quality check passed');
    }
    
    return {
      success: true,
      readyToPublishArticle: readyArticle,
      recommendations: parsedRecommendations,
      qualityCheck: qualityCheck,
      valueAddedBlocks: {
        factSummary,
        context: contextBlock,
        historical: historicalBlock,
        stats: statsBlock,
        impact: impactBlock,
        fantasy: fantasyBlock
      }
    };
    
  } catch (error) {
    console.error('❌ Sports news processing error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  processSportsNewsOpenAI,
  buildSportsPrePublishPrompt,
  buildSportsRewriteBodyHtmlPrompt
};
