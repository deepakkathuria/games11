const axios = require('axios');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = "https://api.openai.com/v1/chat/completions";

// ========== HINDI OPENAI API CALL ==========
async function generateHindiWithOpenAI(prompt, options = {}) {
  try {
    console.log('🤖 Hindi OpenAI API call started...');
    console.log('📊 Temperature:', options.temperature ?? 0.97);
    console.log('📝 Max tokens:', options.max_tokens ?? 5000);
    
    const response = await axios.post(OPENAI_BASE_URL, {
      model: options.model || "gpt-4o",
      messages: [
        {
          role: "system",
          content: options.systemPrompt || "You are a helpful assistant."
        },
        {
          role: "user",
          content: prompt
        }
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
      },
      timeout: 120000,
    });
    
    const content = response.data?.choices?.[0]?.message?.content || "";
    console.log('✅ Hindi OpenAI API call completed, content length:', content.length);
    return content;
  } catch (error) {
    console.error('❌ Hindi OpenAI API error:', error.message);
    throw error;
  }
}

// ========== HINDI CRICKET ARTICLE GENERATION ==========
async function processHindiCricketNewsWithOpenAI(input, options = {}) {
  const startTime = Date.now();
  
  try {
    console.log('🏏 [Hindi Cricket OpenAI] Processing:', input.title);
    
    if (!input.title || input.title.length < 10) {
      throw new Error('Title too short');
    }
    if (!input.description || input.description.length < 20) {
      throw new Error('Description too short');
    }
    if (!input.content || input.content.length < 300) {
      throw new Error('Content too short');
    }

    // Hindi system prompt
    const hindiSystemPrompt = `तुम एक भारतीय क्रिकेट पत्रकार हो जो देर रात match report लिख रहे हो। तुम passionate हो, थके हुए हो, fast type कर रहे हो। Natural Hindi में लिखो with emotions.`;

    // Hindi user prompt
    const hindiUserPrompt = `
ORIGINAL CRICKET NEWS (English):
Title: ${input.title}
Description: ${input.description}
Content: ${input.content}

TASK: Convert this to a natural, conversational Hindi article.

STYLE REQUIREMENTS:
- Write like a passionate cricket fan telling a friend
- Use emotional expressions: "यार", "अरे", "वाह", "भाई", "अब्बा"
- Keep cricket terms in English (century, wicket, runs, over, boundary)
- Short paragraphs, varied sentence length
- Casual, human tone - NOT formal journalism
- Add reactions and commentary
- Use contractions and natural speech patterns
- Mix Hindi and English naturally

FORMAT REQUIREMENTS:
- HTML only (no <html>, <head>, <body>)
- <h1> for main title (Hindi)
- <h2> for 3-4 subheadings (Hindi)
- <p> for paragraphs
- <strong> for player names and important stats
- <blockquote> for important quotes
- Use <em> for emphasis

EXAMPLE TONE:
"यार, क्या match दिखाया आज! Virat Kohli ने तो जैसे century machine चालू कर दी है। अरे वाह, ये performance देखकर तो लग रहा है कि World Cup में India का chance बहुत strong है।"

Write now - pure HTML body content in Hindi:`;

    console.log('✍️ [Hindi Cricket OpenAI] Generating Hindi article...');
    
    const hindiArticleHTML = await generateHindiWithOpenAI(hindiUserPrompt, {
      systemPrompt: hindiSystemPrompt,
      temperature: 0.97,
      max_tokens: 5000,
      top_p: 0.88,
      frequency_penalty: 0.5,
      presence_penalty: 0.45
    });
    
    // Extract Hindi title
    const titleMatch = hindiArticleHTML.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const hindiTitle = titleMatch ? titleMatch[1].trim() : input.title;
    
    // Extract Hindi meta description
    const paraMatch = hindiArticleHTML.match(/<p[^>]*>(.*?)<\/p>/i);
    const hindiMeta = paraMatch 
      ? paraMatch[1].replace(/<[^>]+>/g, '').trim().slice(0, 160)
      : input.description;
    
    console.log('✅ [Hindi Cricket OpenAI] Hindi article generated successfully');

    return {
      success: true,
      readyToPublishArticle: hindiArticleHTML,
      hindiTitle: hindiTitle,
      hindiMeta: hindiMeta,
      hindiSlug: hindiTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
      processingTime: Date.now() - startTime,
      metadata: {
        language: 'Hindi',
        style: 'Casual Cricket Journalism',
        model: 'OpenAI GPT-4o',
        processingMethod: 'Hindi OpenAI Processing'
      }
    };

  } catch (error) {
    console.error('❌ Hindi Cricket OpenAI processing error:', error);
    return {
      success: false,
      error: error.message,
      processingTime: Date.now() - startTime
    };
  }
}

module.exports = {
  processHindiCricketNewsWithOpenAI,
  generateHindiWithOpenAI
};