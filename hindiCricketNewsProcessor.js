// 




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
      model: options.model || "gpt-5o", 

     
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

// ========== PROFESSIONAL HINDI CRICKET ARTICLE GENERATION ==========
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

    // Professional Hindi system prompt
    const hindiSystemPrompt = `तुम एक professional Hindi cricket journalist हो जिसे hindi.cricketAddictor.com के लिए 2-3 साल का experience है। तुम passionate, knowledgeable हो लेकिन conversational style में लिखते हो। तुम्हारा लक्ष्य है readers को engage करना और 100% human-written article deliver करना जो AI detection tools को bypass कर सके।`;

    // Professional Hindi user prompt
    const hindiUserPrompt = `
Write a professional cricket news article based on the following source text or topic.

🎯 OBJECTIVE: 
The article must sound 100% human-written — not robotic or AI-generated. It should read like it's written by a sports journalist with 2–3 years of experience at Hindi Cricket Addictor.

Article Language: HINDI

🗞️ TONE & STYLE:
- Conversational yet professional (like a passionate cricket writer)
- Add light human elements — curiosity, mild opinions, nostalgic phrases, or natural imperfections
- Avoid robotic sentence flow or perfect grammar; include minor sentence-length variations or natural human pauses
- Keep it engaging, readable, and emotionally connected to cricket fans

✍️ STRUCTURE:
1. Headline: 
   - Short, strong, and clear (avoid clickbait)
   - DON'T just translate the English headline
   - Write amazing headline using your brain based on the content body
   - Use statements from the article
   - Make it Hindi-specific and engaging

2. Intro paragraph: 
   - Hook the reader with context and tone
   - Set the scene

3. Sub-headings (<h2>):
   - Break sections with storytelling flow
   - 3-4 sub-headings
   - Natural, conversational headings

4. Body paragraphs:
   - Include facts, quotes, and emotions
   - Use a mix of short and medium sentences
   - Add 1-2 human touch lines (e.g., "याद है जब..." या "शायद यही वजह है...")
   - Use cricket terminology naturally
   - Add reactions: "यार, क्या खेल!", "अरे वाह!", "भाई साहब!"

5. Ending paragraph: 
   - A personal reflection or fan-like takeaway
   - Natural conclusion, not forced

⚙️ RULES:
- NO generic AI phrases like "निष्कर्ष में," "कुल मिलाकर," "रिपोर्ट के अनुसार"
- Avoid over-polished or repetitive structures
- Include 1-2 natural errors (for realism), but keep it subtle (e.g., missing comma, casual phrasing)
- Do NOT use overly complex words or filler fluff
- Ensure the final output is ready to publish on hindi.cricketAddictor.com
- Mix Hindi and English naturally (keep cricket terms like century, wicket, runs, over in English)

🏏 STYLE REFERENCE:
Write like articles from hindi.cricketAddictor.com → News Section
- Passionate but professional
- Fan-friendly language
- Emotional connection with readers
- Natural flow, not stiff journalism

HTML FORMAT:
- Return HTML BODY ONLY (no <html>, <head>, <body> tags)
- <h1> for main headline (Hindi - creative, not direct translation)
- <h2> for subheadings (3-4)
- <p> for paragraphs
- <strong> for player names and important stats
- <blockquote> for important quotes
- <em> for emphasis
- <ul> and <li> for lists if needed

🔍 INPUT (Source Content in English):
Title: ${input.title}
Description: ${input.description}
Content: ${input.content}

IMPORTANT:
- Don't just translate the headlines. Write the headlines using the content body, or use statements from the article, or write amazing headlines using your brain in Hindi
- Make it sound like a real Hindi cricket journalist wrote this
- Add your own creative touch while keeping facts accurate
- Write with passion and emotion that cricket fans love

Write now - pure HTML body content in professional Hindi:`;

    console.log('✍️ [Hindi Cricket OpenAI] Generating professional Hindi article...');
    
    const hindiArticleHTML = await generateHindiWithOpenAI(hindiUserPrompt, {
      systemPrompt: hindiSystemPrompt,
      temperature: 0.97,
      max_tokens: 5000,
      top_p: 0.88,
      frequency_penalty: 0.5,
      presence_penalty: 0.45
    });
    
    // Extract Hindi title from generated content
    const titleMatch = hindiArticleHTML.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const hindiTitle = titleMatch ? titleMatch[1].trim() : input.title;
    
    // Extract Hindi meta description from first paragraph
    const paraMatch = hindiArticleHTML.match(/<p[^>]*>(.*?)<\/p>/i);
    const hindiMeta = paraMatch 
      ? paraMatch[1].replace(/<[^>]+>/g, '').trim().slice(0, 160)
      : input.description;
    
    console.log('✅ [Hindi Cricket OpenAI] Professional Hindi article generated successfully');

    return {
      success: true,
      readyToPublishArticle: hindiArticleHTML,
      hindiTitle: hindiTitle,
      hindiMeta: hindiMeta,
      hindiSlug: hindiTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
      processingTime: Date.now() - startTime,
      metadata: {
        language: 'Hindi',
        style: 'Professional Cricket Journalism (hindi.cricketAddictor.com)',
        model: options.model || "gpt-5o",
        processingMethod: 'Professional Hindi Cricket Article',
        experience: '2-3 years journalist level'
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