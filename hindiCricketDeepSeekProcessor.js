const axios = require('axios');

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1/chat/completions";

async function callDeepSeek(systemPrompt, userPrompt, options = {}) {
  try {
    console.log('🤖 DeepSeek API call started...');
    console.log('📊 Temperature:', options.temperature ?? 0.7);
    
    const response = await axios.post(DEEPSEEK_BASE_URL, {
      model: options.model || "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 5000,
      top_p: options.top_p ?? 0.9,
      frequency_penalty: options.frequency_penalty ?? 0.3,
      presence_penalty: options.presence_penalty ?? 0.3,
    }, {
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 120000
    });
    
    const content = response.data?.choices?.[0]?.message?.content || "";
    console.log('✅ DeepSeek API call completed, content length:', content.length);
    return content;
  } catch (error) {
    console.error('❌ DeepSeek API error:', error.message);
    throw error;
  }
}

/* ---------- HINDI CRICKET NEWS DEEPSEEK PROCESSOR ---------- */

async function processHindiCricketNewsDeepSeek(input, options = {}) {
  const startTime = Date.now();
  
  try {
    console.log('🏏 [DeepSeek Only - Hindi Cricket News] Processing:', input.title);
    console.log('🌐 LANGUAGE: HINDI ONLY - English output is STRICTLY FORBIDDEN');
    
    if (!input.title || input.title.length < 10) {
      throw new Error('Title too short');
    }
    if (!input.description || input.description.length < 20) {
      throw new Error('Description too short');
    }
    if (!input.content || input.content.length < 300) {
      throw new Error('Content too short');
    }

    // Hindi cricket article rewrite prompt for DeepSeek
    const userPrompt = `
ORIGINAL CRICKET NEWS (Hindi):
Title: ${input.title}
Description: ${input.description}
Content: ${input.content}

═══════════════════════════════════════════════════════════════
⚠️ CRITICAL LANGUAGE REQUIREMENT ⚠️
═══════════════════════════════════════════════════════════════
आपको केवल हिंदी में लिखना है। 
- Do NOT use English, Urdu, or any other language
- Do NOT use English words or phrases
- Write 100% in Hindi (Devanagari script) only
- Every single word must be in Hindi
- Use simple, conversational Hindi that cricket fans use
═══════════════════════════════════════════════════════════════

TASK: Rewrite this cricket news article into a comprehensive, engaging Hindi article.

STYLE:
- Write like a professional Hindi cricket journalist
- Natural, conversational Hindi tone
- Engaging and informative
- Use active voice, short paragraphs
- Include key facts, stats, and quotes
- Add context and analysis where relevant
- LANGUAGE: Write ONLY in Hindi. Every word, sentence, and paragraph must be in Hindi.
- Use simple Hindi words that common people understand
- Use journalistic phrases: "सूत्रों के मुताबिक", "मैच के दौरान", "इस फैसले पर"

FORMAT:
- HTML only (no <html>, <head>, <body> tags)
- <h1> for main title
- <h2> for 3-5 subheadings (unique and content-specific)
- <p> for paragraphs
- <strong> for player names and important stats
- <blockquote> for important quotes
- <ul> and <li> for lists if needed

⚠️ FINAL REMINDER: Write in HINDI ONLY - NO English, NO mixed languages.
Write now - pure HTML body content in HINDI ONLY:`;

    const systemPrompt = `आप एक विशेषज्ञ हिंदी क्रिकेट पत्रकार हैं जो एक प्रमुख स्पोर्ट्स मीडिया ब्रांड के लिए लिख रहे हैं। 

CRITICAL LANGUAGE RULE: आपको केवल हिंदी में लिखना है - कभी भी अंग्रेजी, उर्दू, या किसी अन्य भाषा में नहीं। 
- अंग्रेजी शब्दों का उपयोग न करें
- देवनागरी लिपि में लिखें
- हर एक शब्द, वाक्य और पैराग्राफ हिंदी में होना चाहिए

क्रिकेट के खेल, खिलाड़ियों और क्रिकेट संस्कृति की गहरी जानकारी के साथ आकर्षक, व्यापक हिंदी क्रिकेट सामग्री लिखें। हमेशा विस्तृत, सटीक क्रिकेट विश्लेषण और सम्मोहक कहानी सुनाना प्रदान करें। 

LANGUAGE ENFORCEMENT: अगर आपको इनपुट में कोई अंग्रेजी या गैर-हिंदी टेक्स्ट दिखता है, तो उसे अनदेखा करें और अपनी प्रतिक्रिया 100% हिंदी में ही लिखें।`;

    const articleHTML = await callDeepSeek(systemPrompt, userPrompt, {
      temperature: 0.7,
      max_tokens: 5000,
      top_p: 0.9,
      frequency_penalty: 0.3,
      presence_penalty: 0.3
    });

    return {
      success: true,
      readyToPublishArticle: articleHTML,
      processingTime: Date.now() - startTime
    };

  } catch (error) {
    console.error('❌ Processing error:', error);
    return {
      success: false,
      error: error.message,
      processingTime: Date.now() - startTime
    };
  }
}

async function generateHindiCricketHeadlineDeepSeek(title) {
  const prompt = `इस क्रिकेट समाचार शीर्षक के लिए एक आकर्षक, SEO-अनुकूल क्रिकेट हेडलाइन हिंदी में बनाएं। इसे इस तरह बनाएं:
1. आकर्षक और क्रिकेट-केंद्रित
2. यदि संभव हो तो 60 वर्णों से कम
3. क्रिकेट कीवर्ड्स और शब्दावली शामिल करें
4. वास्तविक क्रिकेट समाचार हेडलाइन की तरह लगे
5. क्रिकेट प्रशंसकों के लिए आकर्षक बनाएं, क्लिकबेट से बचें
6. केवल हिंदी में - कोई अंग्रेजी शब्द नहीं

मूल क्रिकेट शीर्षक: ${title}

नया क्रिकेट हेडलाइन उत्पन्न करें (केवल हिंदी):`;

  try {
    const response = await callDeepSeek(
      "आप एक हिंदी क्रिकेट पत्रकार हैं। केवल हिंदी में लिखें।",
      prompt,
      {
        temperature: 0.8,
        max_tokens: 100
      }
    );
    return response.trim() || title;
  } catch (error) {
    console.error('Generate Hindi cricket headline error:', error);
    return title;
  }
}

async function generateHindiCricketMetaDescriptionDeepSeek(description) {
  const prompt = `इस क्रिकेट समाचार विवरण के लिए एक आकर्षक क्रिकेट मेटा विवरण हिंदी में बनाएं। इसे इस तरह बनाएं:
1. 150-160 वर्ण लंबा
2. मुख्य क्रिकेट जानकारी और कीवर्ड्स शामिल करें
3. क्रिकेट प्रशंसकों के लिए आकर्षक
4. मुख्य क्रिकेट बिंदुओं का सारांश दें
5. प्राकृतिक और क्रिकेट-केंद्रित लगे
6. केवल हिंदी में - कोई अंग्रेजी शब्द नहीं

मूल क्रिकेट विवरण: ${description}

क्रिकेट मेटा विवरण उत्पन्न करें (केवल हिंदी):`;

  try {
    const response = await callDeepSeek(
      "आप एक हिंदी क्रिकेट पत्रकार हैं। केवल हिंदी में लिखें।",
      prompt,
      {
        temperature: 0.7,
        max_tokens: 200
      }
    );
    return response.trim() || description;
  } catch (error) {
    console.error('Generate Hindi cricket meta description error:', error);
    return description;
  }
}

function buildHindiCricketHtmlDocument({ title, metaDescription, bodyHtml }) {
  const safeTitle = (title || "").slice(0, 60);
  const safeMeta  = (metaDescription || "").slice(0, 160);
  const body      = /<(h1|p|h2|h3|ul|li|blockquote|strong|em)\b/i.test(bodyHtml || "")
    ? bodyHtml
    : `<h1>${safeTitle || "क्रिकेट अपडेट"}</h1><p>${safeMeta || ""}</p>`;

  return [
    "<!doctype html>",
    '<html lang="hi">',
    "<head>",
    '  <meta charset="utf-8" />',
    '  <meta name="viewport" content="width=device-width, initial-scale=1" />',
    `  <title>${safeTitle}</title>`,
    `  <meta name="description" content="${safeMeta}" />`,
    '  <meta name="keywords" content="क्रिकेट, खेल, समाचार, विश्लेषण, टिप्पणी" />',
    '  <meta name="author" content="क्रिकेट न्यूज़ टीम" />',
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
  processHindiCricketNewsDeepSeek,
  generateHindiCricketHeadlineDeepSeek,
  generateHindiCricketMetaDescriptionDeepSeek,
  buildHindiCricketHtmlDocument,
};

