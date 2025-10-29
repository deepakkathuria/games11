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
          content: "You are an expert automobile journalist and SEO editor. Write engaging, comprehensive automobile content in English with deep knowledge of cars, automotive industry, technology, and automotive culture. Always provide detailed, accurate automotive analysis and compelling storytelling in English."
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

function buildAutomobilePrePublishPrompt({ title, description, body }) {
  return `
You are an expert automobile journalist and SEO editor. Analyze this automobile news and provide comprehensive SEO recommendations.

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
- Extract the most important point from content (car model, price, features, launch date, technology, etc.)
- Create a completely new and different headline based on that important point
- Every article's headline should be UNIQUE and SPECIFIC to its content
- Headline should clearly indicate what the article is about

📝 Examples:

If original title is: "New Car Launch: Latest Update"
Then RECOMMENDED TITLE could be:
- "Tata Sierra 2025: Price Starts at ₹13 Lakh, Launches November 25"
- "Mercedes CEO Praises Bengaluru Talent: 'Doubles My Energy'"
- "Noida's New Car Hub: 12,596 sqm Showroom Cluster on Expressway"

Advanced SEO rules for automobile news:
- Use only facts from input (no invented prices/quotes/dates/locations)
- Use simple, conversational English - what people use in daily conversation
- Avoid heavy technical jargon - use natural English that car enthusiasts speak
- Make headlines attractive and automobile-specific (include car model, price range, key features)
- Headlines must include car model, brand name, price, or main event
- Meta description should highlight main automobile story and create curiosity
- Create 5-7 H2 UNIQUE and CONTENT-SPECIFIC headings in outline
- Different H2 headings for each article based on specific content
- Don't use generic headings like "Breaking News Summary", "Car Details"
- H2 headings should highlight specific aspects of the article's main story

🧠 Important - H2 HEADINGS Creation Process:
1. First READ the full CONTENT below carefully
2. UNDERSTAND the main story points of the content
3. IDENTIFY specific details in the article (car models, prices, features, events, statements, etc.)
4. CREATE H2 headings based on those specific details
5. Each H2 heading should reflect a specific aspect of the article

❌ Wrong way: Template-based generic headings
✅ Right way: Read content and create intelligent, specific headings

H2 Heading Style Examples (create different ones for each article):

If article is about Tata Sierra launch:
  * H2: Tata Sierra 2025: What Makes It Special?
  * H2: Price Comparison: How Does It Stack Against Rivals?
  * H2: Three Powertrain Options: Petrol, Diesel, and Electric
  * H2: Modern Features: Triple Screen Setup and Premium Interiors
  * H2: Launch Timeline: Public Unveiling vs Market Availability

If article is about Mercedes CEO praising Bengaluru:
  * H2: Mercedes CEO's Bengaluru Visit: What Impressed Him Most?
  * H2: Bengaluru's Tech Talent: 400+ German Companies Already Here
  * H2: Global Recognition: How Bengaluru Became Innovation Hub
  * H2: CEO's Vision: Why Talent Matters More Than Cost
  * H2: Future Plans: Mercedes' Expansion in Indian Tech Capital

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

📍 Strategy 1: CAR MODEL FOCUS
- Source: "New Car Launch"
- Your Title: "Tata Sierra 2025: Electric Variant Priced at ₹25.9 Lakh"

📍 Strategy 2: PRICE FOCUS  
- Source: "New Car Launch"
- Your Title: "₹13-24 Lakh Range: Tata Sierra Takes on Creta and Vitara"

📍 Strategy 3: FEATURE FOCUS
- Source: "New Car Launch" 
- Your Title: "Triple Screen Setup: Tata Sierra's Premium Interior Revealed"

📍 Strategy 4: LAUNCH FOCUS
- Source: "New Car Launch"
- Your Title: "November 25 Launch: Tata Sierra's Public Unveiling on 15th"

📍 Strategy 5: COMPETITION FOCUS
- Source: "New Car Launch"
- Your Title: "Sierra vs Creta: Tata's Answer to Mid-Size SUV Segment"

🎯 FINAL CHECK - Before creating title, ask yourself:
1. Does this title mention specific car model/brand? ✅
2. Does it include key details (price/features/date)? ✅  
3. Is it completely different from source title? ✅
4. Does it reflect THIS article's specific content? ✅
5. Would car enthusiasts click on this title? ✅

If all 5 answers are YES, then create the title!
`;
}

function buildAutomobileRewriteBodyHtmlPrompt({ title, description, body, recommendations }) {
  return `
You are an expert automobile journalist. Rewrite this automobile news article into a comprehensive, engaging HTML article.

CRITICAL REQUIREMENTS:
- Write in English
- Use proper HTML structure with <h1>, <h2>, <h3>, <p>, <blockquote>, <ul>, <li> tags
- Create 5-7 H2 headings that are UNIQUE and CONTENT-SPECIFIC
- Each H2 should be about a DIFFERENT aspect of the story
- Don't use generic H2 like "Car Details", "Features Overview"
- Make it engaging and informative for car enthusiasts
- Include specific details from the original content
- Use storytelling approach with compelling narrative

🧠 PROCESS TO CREATE INTELLIGENT H2 HEADINGS:
Step 1: READ the full article content below carefully
Step 2: UNDERSTAND what the main story is about
Step 3: IDENTIFY specific details (car models, prices, features, events, statements, controversies)
Step 4: CREATE H2 headings based on those specific details
Step 5: Each H2 should be about a DIFFERENT aspect of the story

• Create 5-7 H2 headings that reflect THIS article's ACTUAL content
• DON'T use template-based generic H2 like "Breaking News Summary", "Car Details", "Feature Overview"
• Each H2 should be INTELLIGENT and show you understood the article
• Use storytelling flow with engaging, clickable H2 headings
• Examples of GOOD H2s: "Tata Sierra's Electric Variant: ₹25.9 Lakh Price Tag", "Mercedes CEO's Bengaluru Revelation: Why Talent Matters"
• Examples of BAD H2s: "Car Details", "Feature Overview" (too generic!)

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
- Make it informative for car enthusiasts
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

Create a comprehensive, engaging HTML article that car enthusiasts will love to read!
`;
}

async function processAutomobileNewsOpenAI(articleData, options = {}) {
  try {
    console.log('🚗 Starting automobile news OpenAI processing...');
    
    const { title, description, content } = articleData;
    
    // Step 1: Get SEO recommendations
    console.log('📊 Getting SEO recommendations...');
    const prePrompt = buildAutomobilePrePublishPrompt({
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
    
    // Step 2: Generate HTML article
    console.log('📝 Generating HTML article...');
    const htmlPrompt = buildAutomobileRewriteBodyHtmlPrompt({
      title,
      description,
      body: content,
      recommendations: parsedRecommendations
    });
    
    const readyArticle = await generateWithOpenAI(htmlPrompt, {
      temperature: 0.85,
      max_tokens: 3000
    });
    
    console.log('✅ HTML article generated');
    
    return {
      success: true,
      readyToPublishArticle: readyArticle,
      recommendations: parsedRecommendations
    };
    
  } catch (error) {
    console.error('❌ Automobile news processing error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  processAutomobileNewsOpenAI,
  buildAutomobilePrePublishPrompt,
  buildAutomobileRewriteBodyHtmlPrompt
};