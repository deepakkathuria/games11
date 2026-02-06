
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
 * Extract image generation prompts from STEP 4
 */
function extractImagePrompts(content) {
  const prompts = [];
  
  // Find STEP 4 section
  const step4Match = content.match(/STEP 4[:\s]*IMAGE[^]*?(?=STEP 5|$)/i);
  if (!step4Match) return prompts;
  
  const step4Content = step4Match[0];
  
  // Try to find prompts - look for "Image 1 Prompt:", "Image 2 Prompt:", etc.
  const imagePatterns = [
    // Pattern 1: "Image 1 Prompt:" or "IMAGE 1 PROMPT:"
    /(?:Image|IMAGE)\s*(?:1|2|3|one|two|three)\s*(?:Prompt|PROMPT)[:\s]*([^\n]+(?:\n(?!Image|IMAGE|STEP|Prompt|PROMPT)[^\n]+)*?)(?=(?:Image|IMAGE)\s*(?:[123]|one|two|three)|STEP|$)/gi,
    // Pattern 2: "Image 1:" or "IMAGE 1:"
    /(?:Image|IMAGE)\s*(?:1|2|3|one|two|three)[:\s]+([^\n]+(?:\n(?!Image|IMAGE|STEP|Prompt|PROMPT)[^\n]+)*?)(?=(?:Image|IMAGE)\s*(?:[123]|one|two|three)|STEP|$)/gi,
    // Pattern 3: "Prompt 1:" or "PROMPT 1:"
    /(?:Prompt|PROMPT)\s*(?:1|2|3|one|two|three)[:\s]+([^\n]+(?:\n(?!Image|IMAGE|STEP|Prompt|PROMPT)[^\n]+)*?)(?=(?:Prompt|PROMPT)\s*(?:[123]|one|two|three)|STEP|$)/gi,
    // Pattern 4: "For image 1:" or "FOR IMAGE 1:"
    /(?:For|FOR)\s*(?:image|IMAGE)\s*(?:1|2|3|one|two|three)[:\s]+([^\n]+(?:\n(?!Image|IMAGE|STEP|Prompt|PROMPT|For|FOR)[^\n]+)*?)(?=(?:For|FOR)\s*(?:image|IMAGE)|STEP|$)/gi
  ];
  
  for (const pattern of imagePatterns) {
    const matches = step4Content.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        let prompt = match[1].trim();
        // Clean up the prompt - remove common prefixes
        prompt = prompt
          .replace(/^[-•*]\s*/, '')
          .replace(/^Create\s+/i, '')
          .replace(/^Visualize\s+/i, '')
          .replace(/^Capture\s+/i, '')
          .replace(/^Generate\s+/i, '')
          .replace(/\n+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        // Remove quotes if present
        prompt = prompt.replace(/^["']|["']$/g, '');
        
        if (prompt.length > 20) { // Minimum prompt length
          prompts.push(prompt);
        }
      }
    }
  }
  
  // If no structured prompts found, try simpler pattern - look for lines after "Prompt:"
  if (prompts.length === 0) {
    // Split by lines and look for "Prompt:" followed by text
    const lines = step4Content.split(/\n/);
    let currentPrompt = '';
    let inPrompt = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if line contains "Prompt:" or "Image X Prompt:"
      if (/Prompt[:\s]/i.test(line) || /Image\s*[123]\s*Prompt/i.test(line)) {
        // Extract text after "Prompt:"
        const afterPrompt = line.split(/Prompt[:\s]+/i)[1];
        if (afterPrompt && afterPrompt.length > 20) {
          prompts.push(afterPrompt.trim());
        } else {
          inPrompt = true;
          currentPrompt = '';
        }
      } else if (inPrompt && line.length > 0 && !line.match(/^(Image|STEP|Hashtag)/i)) {
        // Continue collecting prompt text
        currentPrompt += (currentPrompt ? ' ' : '') + line;
        if (currentPrompt.length > 100) {
          prompts.push(currentPrompt.trim());
          currentPrompt = '';
          inPrompt = false;
        }
      } else if (inPrompt && line.match(/^(Image|STEP|Hashtag)/i)) {
        // End of prompt section
        if (currentPrompt.length > 20) {
          prompts.push(currentPrompt.trim());
        }
        currentPrompt = '';
        inPrompt = false;
      }
    }
    
    // Add last prompt if exists
    if (inPrompt && currentPrompt.length > 20) {
      prompts.push(currentPrompt.trim());
    }
  }
  
  // If still no prompts, try to extract any detailed descriptions
  if (prompts.length === 0) {
    // Look for sentences that seem like image prompts (contain visual descriptions)
    const sentences = step4Content.split(/[.\n]/);
    const visualKeywords = ['create', 'visualize', 'capture', 'show', 'depict', 'display', 'illustrate', 'cricket', 'player', 'stadium', 'match', 'dramatic', 'realistic'];
    
    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      if (visualKeywords.some(keyword => lowerSentence.includes(keyword)) && sentence.length > 50) {
        const cleaned = sentence.trim().replace(/^[-•*]\s*/, '');
        if (cleaned.length > 30 && prompts.length < 3) {
          prompts.push(cleaned);
        }
      }
    }
  }
  
  // Clean up prompts - remove quotes, extra spaces
  const cleanedPrompts = prompts.map(p => {
    return p
      .replace(/^["']|["']$/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }).filter(p => p.length > 20);
  
  // Limit to 3 prompts
  return cleanedPrompts.slice(0, 3);
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

STEP 3: HASHTAGS & POSTING TIPS
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

Format your response clearly with STEP 1, STEP 2, STEP 3 sections.
Use clean text format - NO asterisks, NO markdown formatting, NO code blocks.`;

    const response = await generateWithOpenAI(prompt, {
      temperature: 0.9,
      max_tokens: 4000
    });
    
    const cleanedResponse = cleanText(response);
    
    console.log('✅ HIGH-CTR Facebook content generated with OpenAI');
    
    // Extract image prompts from STEP 4
    const imagePrompts = extractImagePrompts(cleanedResponse);
    console.log(`📸 Found ${imagePrompts.length} image prompts to generate`);
    
    if (imagePrompts.length > 0) {
      console.log('📝 Extracted prompts:');
      imagePrompts.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.substring(0, 100)}...`);
      });
    } else {
      console.log('⚠️ No image prompts found in STEP 4. Checking content...');
      const step4Match = cleanedResponse.match(/STEP 4[:\s]*IMAGE[^]*?(?=STEP 5|$)/i);
      if (step4Match) {
        console.log('📄 STEP 4 content found (first 200 chars):', step4Match[0].substring(0, 200));
      } else {
        console.log('❌ STEP 4 section not found in response');
      }
    }
    
    return {
      success: true,
      content: cleanedResponse,
      processingTime: Date.now() - startTime,
      provider: "OpenAI"
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

/**
 * Generate HIGH-CTR Facebook content TEXT ONLY (no images)
 */
async function generateHighCTRFacebookContent_TEXT_ONLY(newsArticle) {
  const startTime = Date.now();
  
  try {
    console.log(`🚀 Generating HIGH-CTR Facebook content (TEXT ONLY) with OpenAI for: ${newsArticle.title}`);
    
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

STEP 3: HASHTAGS & POSTING TIPS
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

Format your response clearly with STEP 1, STEP 2, STEP 3 sections.
Use clean text format - NO asterisks, NO markdown formatting, NO code blocks.`;

    const response = await generateWithOpenAI(prompt, {
      temperature: 0.9,
      max_tokens: 4000
    });
    
    const cleanedResponse = cleanText(response);
    
    console.log('✅ HIGH-CTR Facebook content (TEXT ONLY) generated with OpenAI');
    
    return {
      success: true,
      content: cleanedResponse,
      processingTime: Date.now() - startTime,
      provider: "OpenAI"
    };
    
  } catch (error) {
    console.error('HIGH-CTR Facebook content generation error (OpenAI):', error);
    return {
      success: false,
      error: error.message,
      processingTime: Date.now() - startTime
    };
  }
}

module.exports = {
  generateHighCTRFacebookContent,
  generateHighCTRFacebookContent_TEXT_ONLY
};
