
const axios = require('axios');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = "https://api.openai.com/v1/chat/completions";

/**
 * Generate content using OpenAI API
 */
async function generateWithOpenAI(prompt, options = {}) {
  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }
    
    console.log('🤖 OpenAI API call started...');
    console.log('📊 Temperature:', options.temperature ?? 0.9);
    console.log('📝 Max tokens:', options.max_tokens ?? 4000);
    
    const response = await axios.post(OPENAI_BASE_URL, {
      model: options.model || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a senior social media growth editor specializing in cricket and sports content. You create high-CTR Facebook posts that achieve 10,000+ organic clicks through strategic hooks, emotional triggers, and viral content strategies."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: options.temperature || 0.9,
      max_tokens: options.max_tokens || 4000
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 120000
    });

    if (!response.data || !response.data.choices || !response.data.choices[0]) {
      throw new Error('Invalid response from OpenAI API');
    }

    const content = response.data.choices[0].message.content;
    console.log('✅ OpenAI API call completed, content length:', content.length);
    return content;
  } catch (error) {
    console.error('❌ OpenAI API error:', error.message);
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout - content generation took too long. Try again.');
    }
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      throw new Error(`OpenAI API error: ${error.response.data?.error?.message || error.message}`);
    }
    throw new Error(`OpenAI API error: ${error.message}`);
  }
}

/**
 * Clean text by removing unwanted formatting
 */
function cleanText(text) {
  if (!text) return text;
  
  return text
    .replace(/\*\*/g, '') // Remove double asterisks
    .replace(/\*/g, '') // Remove single asterisks
    .replace(/#/g, '') // Remove hash symbols
    .replace(/```/g, '') // Remove code blocks
    .replace(/`/g, '') // Remove backticks
    .replace(/\[|\]/g, '') // Remove square brackets
    .replace(/\(|\)/g, '') // Remove parentheses
    .replace(/-{2,}/g, '') // Remove multiple dashes
    .replace(/_{2,}/g, '') // Remove multiple underscores
    .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
    .trim();
}

/**
 * Generate HIGH-CTR Facebook content (Senior's Prompt)
 */
async function generateHighCTRFacebookContent(newsArticle) {
  const startTime = Date.now();
  
  try {
    console.log(`🚀 Generating HIGH-CTR Facebook content with OpenAI for: ${newsArticle.title}`);
    
    // Validate required fields
    if (!newsArticle.title) {
      throw new Error('Article title is required');
    }
    
    if (!newsArticle.description && !newsArticle.content) {
      throw new Error('Article description or content is required');
    }
    
    // Safely get content
    const articleContent = newsArticle.content || newsArticle.description || '';
    const contentPreview = articleContent.length > 2000 ? articleContent.substring(0, 2000) : articleContent;
    
    const prompt = `You are a senior social media growth editor for a large cricket news brand.
Your goal is to generate Facebook posts that can achieve 10,000+ clicks organically.

I will give you ONE article.
Your task is to:

STEP 1: ANALYZE THE ARTICLE
- Identify the strongest CLICK TRIGGERS:
  - Shock / controversy
  - Fear / uncertainty
  - Authority action (ban, suspension, ICC decision)
  - World Cup / big event angle
  - Emotion (anger, betrayal, disbelief)
- Identify:
  - 1 main hook
  - 3 secondary hooks
  - 1 debate angle

STEP 2: CREATE FACEBOOK POST COPY
Generate:
- 5 HIGH-CTR Facebook link post captions
Each caption must:
- Start with a powerful hook in the first 8–12 words
- Use curiosity, urgency, or controversy
- Avoid revealing the full answer (force the click)
- Include a clear CTA
- End with a comment-bait question

Tone:
- Fan-first
- Breaking-news urgency
- Conversational (not robotic)
- Slightly dramatic but factual

STEP 3: CREATE IMAGE IDEAS
Suggest:
- 3 IMAGE CONCEPTS optimized for Facebook feed
For each image:
- Visual idea (what should be shown)
- Text overlay (max 6–8 words, bold & emotional)
- Emotion to trigger (shock, anger, curiosity)

STEP 4: IMAGE GENERATION PROMPTS (AI-READY)
For each image, write:
- A detailed AI image generation prompt
- Style: realistic, dramatic sports journalism
- Aspect ratio: 1:1 and 4:5
- High contrast, bold lighting, news-style composition

STEP 5: HASHTAGS & POSTING TIPS
Provide:
- 5–7 hashtags (high-reach + topical)
- Best posting time for Facebook
- First comment strategy to boost reach

IMPORTANT RULES:
- No emojis overload (max 2 per caption)
- No clickbait lies
- Focus on emotional curiosity
- Assume audience = hardcore + casual cricket fans

Now analyze the article below and execute all steps.

ARTICLE:
TITLE: ${newsArticle.title || 'No title'}
DESCRIPTION: ${newsArticle.description || 'No description'}
CONTENT: ${contentPreview}

Format your response clearly with STEP 1, STEP 2, STEP 3, STEP 4, STEP 5 sections.
Use clean text format - NO asterisks, NO markdown formatting, NO code blocks.`;

    const response = await generateWithOpenAI(prompt, {
      temperature: 0.9,
      max_tokens: 4000
    });
    
    const cleanedResponse = cleanText(response);
    
    console.log('✅ HIGH-CTR Facebook content generated with OpenAI');
    
    return {
      success: true,
      content: cleanedResponse,
      processingTime: Date.now() - startTime,
      originalArticle: {
        title: newsArticle.title,
        description: newsArticle.description
      }
    };
    
  } catch (error) {
    console.error('HIGH-CTR Facebook content generation error (OpenAI):', error);
    return {
      success: false,
      error: error.message,
      processingTime: Date.now() - startTime,
      originalArticle: {
        title: newsArticle.title,
        description: newsArticle.description
      }
    };
  }
}

module.exports = {
  generateHighCTRFacebookContent
};
