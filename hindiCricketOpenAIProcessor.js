const axios = require('axios');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = "https://api.openai.com/v1/chat/completions";

async function generateWithOpenAI(prompt, options = {}) {
  try {
    console.log('🤖 OpenAI API call started...');
    console.log('📊 Temperature:', options.temperature ?? 0.7);
    console.log('📝 Max tokens:', options.max_tokens ?? 2000);
    
    // MODEL OPTIONS:
    // "gpt-4o-mini" - Faster, cheaper, but may not follow complex instructions perfectly
    // "gpt-4" or "gpt-4-turbo" - Better instruction following, more creative, but more expensive
    // Change below if headlines are still too similar to source
    const response = await axios.post(OPENAI_BASE_URL, {
      model: options.model || "gpt-5.2-pro",
      messages: [
        {
          role: "system",
          content: "You are an expert Hindi cricket journalist and SEO editor. Write engaging, comprehensive cricket content in Hindi with deep knowledge of the game, players, statistics, and cricket culture. Always provide detailed, accurate cricket analysis and compelling storytelling in Hindi."
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

/* ---------- HINDI CRICKET STATS & EXPERT FUNCTIONS ---------- */

async function fetchHindiCricketStats(playerName, teamName, matchType) {
  // Enhanced Hindi cricket statistics for OpenAI processing
  const statsPrompts = {
    "विराट कोहली": {
      career: "अंतर्राष्ट्रीय क्रिकेट में 73 शतक, सभी प्रारूपों में 26,000+ रन",
      recent: "पिछले 10 ODI में औसत 45.2, स्ट्राइक रेट 89.3",
      records: "8000, 9000, 10000 ODI रन तक सबसे तेज पहुंचने वाले"
    },
    "रोहित शर्मा": {
      career: "31 ODI शतक, ODI में 3 दोहरे शतक",
      recent: "2021 से भारत के कप्तान, एशिया कप 2023 में विजय दिलाई",
      records: "ODI में सर्वोच्च व्यक्तिगत स्कोर (264 रन)"
    },
    "एमएस धोनी": {
      career: "10,000+ ODI रन, विकेटकीपर के रूप में 350+ डिसमिसल",
      recent: "2020 में अंतर्राष्ट्रीय क्रिकेट से रिटायरमेंट",
      records: "सभी तीन ICC ट्रॉफी जीतने वाले एकमात्र कप्तान"
    },
    "बाबर आजम": {
      career: "लगातार टॉप-ऑर्डर बल्लेबाज, ODI में 50+ औसत",
      recent: "पाकिस्तान कप्तान, हाल की सीरीज में सबसे ज्यादा रन बनाने वाले",
      records: "2000 T20I रन तक सबसे तेज पहुंचने वाले"
    },
    "केन विलियमसन": {
      career: "न्यूजीलैंड कप्तान, 8000+ टेस्ट रन",
      recent: "न्यूजीलैंड को वर्ल्ड टेस्ट चैंपियनशिप में विजय दिलाई",
      records: "वर्ल्ड कप में न्यूजीलैंड बल्लेबाज का सर्वोच्च व्यक्तिगत स्कोर"
    }
  };

  const playerStats = statsPrompts[playerName] || {
    career: "स्थापित खिलाड़ी जिसके पास महत्वपूर्ण अंतर्राष्ट्रीय अनुभव है",
    recent: "हाल के मैचों में लगातार प्रदर्शन",
    records: "अंतर्राष्ट्रीय क्रिकेट में कई उपलब्धियां"
  };

  return playerStats;
}

async function generateHindiExpertOpinion(topic, context) {
  try {
    const expertPrompt = `
आप एक क्रिकेट विशेषज्ञ विश्लेषक हैं। इस क्रिकेट विषय के बारे में एक यथार्थवादी, अंतर्दृष्टिपूर्ण उद्धरण दें। इसे ऐसा बनाएं जैसे हर्षा भोगले, इयान बिशप, या रवि शास्त्री कहते हों।

विषय: ${topic}
संदर्भ: ${context}

केवल उद्धरण चिह्नों में प्रत्यक्ष उद्धरण लौटाएं। इसे इस तरह बनाएं:
- अधिकतम 1-2 वाक्य
- अंतर्दृष्टिपूर्ण और विश्लेषणात्मक
- क्रिकेट शब्दावली का प्राकृतिक उपयोग
- वास्तविक विशेषज्ञ आवाज की तरह लगे
- कोई विशेषता की आवश्यकता नहीं (केवल उद्धरण)

उदाहरण: "जिस तरह से वह अब शॉर्ट बॉल खेल रहे हैं, आप देख सकते हैं कि उनके खेल में आत्मविश्वास वापस आ गया है।"
`;

    const quote = await generateWithOpenAI(expertPrompt, { 
      temperature: 0.8, 
      max_tokens: 100 
    });
    
    return quote.trim().replace(/^["']|["']$/g, '');
  } catch (error) {
    console.error('Error generating Hindi expert opinion:', error);
    return "स्थितियां चुनौतीपूर्ण लग रही हैं लेकिन खिलाड़ियों ने स्थिति के अनुकूल खुद को ढाल लिया है।";
  }
}

async function generateHindiSocialMediaReactions(articleTitle, keyEvent) {
  try {
    const socialPrompt = `
इस क्रिकेट समाचार के लिए 5 यथार्थवादी सोशल मीडिया प्रतिक्रियाएं (X/Twitter शैली) उत्पन्न करें। उन्हें ऐसा बनाएं जैसे वास्तविक क्रिकेट प्रशंसक लिखते हों।

लेख: ${articleTitle}
मुख्य घटना: ${keyEvent}

आवश्यकताएं:
- 5 अलग-अलग प्रतिक्रियाएं
- भावनाओं का मिश्रण (उत्साह, आलोचना, विश्लेषण, हास्य, समर्थन)
- आकस्मिक, सोशल मीडिया भाषा का उपयोग
- हैशटैग का प्राकृतिक उपयोग
- प्रत्येक में 1-2 पंक्तियां
- विभिन्न दृष्टिकोणों से वास्तविक क्रिकेट प्रशंसकों की तरह लगे
- कुछ संक्षिप्ताक्षर और इमोजी शामिल करें
- उन्हें ट्रेंडिंग और यथार्थवादी बनाएं

प्रत्येक प्रतिक्रिया को "• " से शुरू करते हुए नई पंक्ति पर प्रारूपित करें
उदाहरण: • "आखिरकार! सदियों से इस पल का इंतजार कर रहे थे 🏏 #क्रिकेट #जीत"

केवल 5 प्रतिक्रियाएं लौटाएं, और कुछ नहीं।
`;

    const reactions = await generateWithOpenAI(socialPrompt, { 
      temperature: 0.9, 
      max_tokens: 300 
    });
    
    return reactions.split('\n').filter(line => line.trim().startsWith('•')).slice(0, 5);
  } catch (error) {
    console.error('Error generating Hindi social reactions:', error);
    return [
      "• क्या मैच था! इसीलिए हम क्रिकेट से प्यार करते हैं 🏏",
      "• आखिरकार टीम के लिए कुछ अच्छी खबर! #क्रिकेट",
      "• इस पल का इंतजार कर रहे थे! शानदार प्रदर्शन 💪",
      "• खिलाड़ियों को मायने के समय आगे आते देखना बहुत अच्छा लगा",
      "• यह सीरीज के लिए सब कुछ बदल देता है! #गेमचेंजर"
    ];
  }
}

/* ---------- HINDI CRICKET-SPECIFIC PROMPTS ---------- */

function buildHindiCricketPrePublishPrompt({ title, description, body }) {
  return `
आप एक विशेषज्ञ हिंदी क्रिकेट पत्रकार और SEO संपादक हैं। इस क्रिकेट समाचार का विश्लेषण करें और व्यापक SEO सिफारिशें प्रदान करें।

केवल इन फील्ड्स को सादे पाठ में लौटाएं (कोई JSON नहीं, कोई markdown नहीं)। प्रत्येक को एक पंक्ति पर रखें Outline को छोड़कर जो कई पंक्तियों में हो सकता है।

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

🚨🚨🚨 अत्यंत महत्वपूर्ण - RECOMMENDED TITLE के लिए 🚨🚨🚨:

❌ गलत तरीका - ये बिल्कुल न करें:
- नीचे दिए गए मूल शीर्षक को कॉपी करना
- मूल शीर्षक का सिर्फ अनुवाद करना
- मूल शीर्षक में सिर्फ छोटे बदलाव करना
- एक ही तरह का हेडलाइन हर आर्टिकल के लिए बनाना

✅ सही तरीका - यह जरूर करें:
- नीचे दी गई DESCRIPTION और CONTENT को ध्यान से पढ़ें
- Content में से सबसे महत्वपूर्ण बात निकालें (खिलाड़ी का नाम, स्कोर, मैच का नतीजा, खास बयान, विवाद, etc.)
- उस महत्वपूर्ण बात के आधार पर एक बिल्कुल नया और अलग हेडलाइन बनाएं
- हर आर्टिकल का हेडलाइन उसकी content के हिसाब से UNIQUE और SPECIFIC होना चाहिए
- हेडलाइन से ही पता चलना चाहिए कि आर्टिकल किस बारे में है

📝 उदाहरण:

अगर मूल शीर्षक है: "India vs Pakistan: Latest cricket update"
तो RECOMMENDED TITLE हो सकता है:
- "रोहित शर्मा का शतक, भारत ने पाकिस्तान को 7 विकेट से हराया"
- "बुमराह के 5 विकेट ने पाकिस्तान को 180 पर रोका"
- "कोहली का धमाकेदार अर्धशतक, भारत को मिली 5 विकेट से जीत"

क्रिकेट समाचार के लिए उन्नत SEO नियम:
- केवल इनपुट से तथ्यों का उपयोग करें (कोई आविष्कृत स्कोर/उद्धरण/दिनांक/स्थान नहीं)
- सरल और बोलचाल की हिंदी का उपयोग करें - जो भारत में रोजमर्रा की बातचीत में इस्तेमाल होती है
- भारी संस्कृत शब्दों से बचें - क्रिकेट फैंस द्वारा बोली जाने वाली प्राकृतिक हिंदी का उपयोग करें
- शीर्षक को आकर्षक और क्रिकेट-विशिष्ट बनाएं (टीम नाम, मैच प्रकार, मुख्य परिणाम शामिल करें)
- हेडलाइन में खिलाड़ी का नाम, टीम का नाम, स्कोर, या मुख्य घटना जरूर शामिल करें
- मेटा विवरण मुख्य क्रिकेट कहानी को उजागर करना चाहिए और जिज्ञासा पैदा करना चाहिए
- आउटलाइन में 5-7 H2 UNIQUE और CONTENT-SPECIFIC headings बनाएं
- हर article के लिए DIFFERENT H2 headings चाहिए जो उस specific content के बारे में हों
- Generic headings जैसे "ब्रेकिंग न्यूज सारांश", "मैच विवरण" का use न करें
- H2 headings article की main story के specific aspects को highlight करें

🧠 महत्वपूर्ण - H2 HEADINGS बनाने का PROCESS:
1. पहले नीचे दी गई पूरी CONTENT को ध्यान से READ करें
2. Content की main story points को UNDERSTAND करें
3. Article में कौन से specific details हैं उन्हें identify करें (खिलाड़ी के नाम, स्कोर, घटनाएं, बयान, आदि)
4. उन specific details के आधार पर H2 headings CREATE करें
5. हर H2 heading article के एक specific aspect को reflect करना चाहिए

❌ गलत तरीका: Template-based generic headings
✅ सही तरीका: Content को पढ़कर intelligent, specific headings बनाना

H2 Heading Style Examples (हर article के लिए अलग बनाएं):

अगर article सरफराज के selection के बारे में है:
  * H2: पंत की वापसी ने क्यों बदली सरफराज की किस्मत?
  * H2: इंडिया ए में नहीं मिली जगह: क्या है असली वजह?
  * H2: साई सुदर्शन को क्यों मिली प्राथमिकता?
  * H2: बल्लेबाजी क्रम में सरफराज के लिए कहां है जगह?
  * H2: घरेलू क्रिकेट में शानदार, फिर भी क्यों नहीं मिला मौका?

अगर article Rohit-Kohli के performance के बारे में है:
  * H2: पर्थ में क्या हुआ कोहली-रोहित के साथ?
  * H2: मैकग्रॉ का विश्लेषण: पिच थी असली चुनौती
  * H2: 8 महीने का ब्रेक: क्या यही थी कमजोरी?
  * H2: स्टार्क और हेजलवुड की घातक गेंदबाजी
  * H2: एडिलेड में क्या बदलेगी रणनीति?

⚠️ महत्वपूर्ण: हर article के H2 headings UNIQUE होने चाहिए! Same generic headings हर article में use न करें!
- 5 विविध कीवर्ड प्रदान करें: प्राथमिक (मुख्य विषय), द्वितीयक (संबंधित शब्द), तृतीयक (विशिष्ट विवरण), लॉन्ग-टेल (विस्तृत वाक्यांश), ट्रेंडिंग (वर्तमान बज़वर्ड्स)
- हिंदी आउटपुट - सरल, बोलचाल की हिंदी का उपयोग करें
- आकर्षक और व्यापक बनें

इनपुट:

📋 विवरण (पढ़ें): ${description || ""}
📄 पूरी सामग्री (यहाँ से headline बनाएं):
${body || ""}

🚫🚫🚫 महत्वपूर्ण - इस शीर्षक को COMPLETELY IGNORE करें (यह सिर्फ reference है, इसका कोई भी हिस्सा use मत करें):
"${title || ""}"

✅ कैसे RECOMMENDED TITLE बनाएं - 5 ANGLE STRATEGIES:

📍 Strategy 1: PLAYER/PERSON FOCUS
- Source: "भारत में होगा फाइनल"
- Your Title: "हरमनप्रीत कौर को घरेलू मैदान पर खिताब जीतने का मौका"

📍 Strategy 2: VENUE/LOCATION FOCUS  
- Source: "भारत में होगा फाइनल"
- Your Title: "गुवाहटी और नवी मुंबई में होंगे वर्ल्ड कप के बड़े मुकाबले"

📍 Strategy 3: CONSEQUENCE/IMPACT FOCUS
- Source: "सरफराज को नहीं मिली जगह"
- Your Title: "पाटीदार की धमाकेदार फॉर्म ने सरफराज को किया बाहर"

📍 Strategy 4: CONTROVERSY/CONFLICT FOCUS
- Source: "भारत में होगा फाइनल"  
- Your Title: "श्रीलंका को झटका: सभी नॉकआउट मैच अब भारत में"

📍 Strategy 5: QUESTION/CURIOSITY FOCUS
- Source: "सरफराज को नहीं मिली जगह"
- Your Title: "क्या नंबर 3 पर बल्लेबाजी बचा सकती है सरफराज का करियर?"

⚠️ MANDATORY RULES:
1. आपका title इन 5 में से 1 strategy follow करे
2. Source से COMPLETELY अलग angle हो
3. Source headline जो बात कह रहा है, वो बात आपके headline में PRIMARY focus नहीं होनी चाहिए
4. Content में से एक SECONDARY या DIFFERENT बात ढूंढें और उसे headline बनाएं
5. अगर source में specific PLAYERS का नाम है, तो try करें कि उन्हीं players को primary focus न बनाएं - other players, team, venue, or expert's comment पर focus करें

Example:
❌ Wrong: Source कहता है "रोहित का खराब रिकॉर्ड" → You say "रोहित का निराशाजनक रिकॉर्ड" (SAME!)
✅ Right: Source कहता है "रोहित का खराब रिकॉर्ड" → You say "विराट कोहली पर दबाव बढ़ा" (DIFFERENT player!)
✅ Right: Source कहता है "रोहित का खराब रिकॉर्ड" → You say "एडिलेड की पिच रोहित के लिए चुनौती" (VENUE focus!)
✅ Right: Source कहता है "मैकग्रॉ ने बताया कोहली-रोहित फेल" → You say "पर्थ की तेज पिच: मैकग्रॉ का विश्लेषण" (PITCH + expert focus!)

खोजें: एक नया, fresh perspective जो source ने directly नहीं कहा!

🚫 AVOID REPEATING KEY WORDS FROM SOURCE:
- अगर source में "खराब रिकॉर्ड" है, तो आपके title में "निराशाजनक रिकॉर्ड" नहीं होना चाहिए (वही बात है!)
- अगर source में "भारत में फाइनल" है, तो आपके title में फिर से "भारत में फाइनल" नहीं (same!)
- अगर source में "क्या संजू RCB जाएंगे?" है, तो आपके title में "क्या संजू RCB जॉइन करेंगे?" नहीं (same question!)
- Key words को avoid करें और completely नई angle की vocabulary use करें

🚫 CRITICAL: अगर source QUESTION format में है ("क्या...", "कब...", "क्यों..."), तो आपका title STATEMENT format में होना चाहिए!
Example:
❌ Source: "क्या संजू RCB जाएंगे?" → Your Title: "क्या संजू RCB जॉइन करेंगे?" (SAME!)
✅ Source: "क्या संजू RCB जाएंगे?" → Your Title: "गैब्रियल के साथ तस्वीर ने खोले संजू के RR छोड़ने के संकेत" (STATEMENT!)

Better: Source की main theme से हटकर content का दूसरा interesting point highlight करें!
`.trim();
}

function buildHindiCricketRewriteBodyHtmlPrompt({
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
Write a professional cricket news article based on the following source text or topic.

🎯 Objective: 
The article must sound 100% human-written — not robotic or AI-generated. It should read like it's written by a sports journalist with 2–3 years of experience at Hindi Cricket Addictor.

Article Language - Hindi

🗞️ Tone & Style:
• Conversational yet professional (like a passionate cricket writer).
• Use simple Hindi that is used in everyday talking in India - avoid complex Sanskrit words.
• Write in natural, spoken Hindi style that Indian cricket fans use.
• Add light human elements — curiosity, mild opinions, nostalgic phrases, or natural imperfections.
• Avoid robotic sentence flow or perfect grammar; include minor sentence-length variations or natural human pauses.
• Keep it engaging, readable, and emotionally connected to cricket fans.

✍️ Structure:
1. Headline (H1): 
   🚨 CRITICAL - DO NOT COPY THE SOURCE HEADLINE 🚨
   • You MUST create a COMPLETELY NEW and DIFFERENT headline
   • The source headline below is just for reference - DO NOT use it as-is
   • Read the full content and create a fresh headline based on what the article is actually about
   • Include SPECIFIC details: player names, scores, match results, or key events from the content
   • Make it UNIQUE to THIS article - every article needs a different headline
   • DO NOT use generic headlines like "क्रिकेट अपडेट" or "क्रिकेट समाचार"
   • Examples of good unique headlines:
     - "मोहसिन नकवी का बड़ा बयान: एशिया कप ट्रॉफी के लिए भारत को करना होगा यह काम"
     - "सूर्यकुमार यादव की कप्तानी में भारत ने जीता एशिया कप, लेकिन ट्रॉफी अभी भी दूर"
     - "एशिया कप विवाद: बीसीसीआई और एसीसी के बीच ट्रॉफी को लेकर बढ़ा तनाव"
2. Intro paragraph: Hook the reader with context and tone.
3. Sub-headings (H2) - MUST BE UNIQUE & CONTENT-SPECIFIC:
   
   🧠 PROCESS TO CREATE INTELLIGENT H2 HEADINGS:
   Step 1: READ the full article content below carefully
   Step 2: UNDERSTAND what the main story is about
   Step 3: IDENTIFY specific details (player names, scores, events, statements, controversies)
   Step 4: CREATE H2 headings based on those specific details
   Step 5: Each H2 should be about a DIFFERENT aspect of the story
   
   • Create 5-7 H2 headings that reflect THIS article's ACTUAL content
   • DON'T use template-based generic H2 like "ब्रेकिंग न्यूज सारांश", "मैच विवरण", "खिलाड़ी प्रदर्शन"
   • Each H2 should be INTELLIGENT and show you understood the article
   • Use storytelling flow with engaging, clickable H2 headings
   • Examples of GOOD H2s: "पंत की वापसी ने क्यों बदली सरफराज की किस्मत?", "मैकग्रॉ का विश्लेषण: पिच थी असली चुनौती"
   • Examples of BAD H2s: "मैच विवरण", "खिलाड़ी प्रदर्शन" (too generic!)
4. Body paragraphs:
   • Include facts, quotes, and emotions.
   • Use a mix of short and medium sentences.
   • Add 1–2 human touch lines
5. Ending paragraph: A personal reflection or fan-like takeaway.

⚙️ Rules:
• No generic AI phrases like "In conclusion," "Overall," or "According to reports."
• Avoid over-polished or repetitive structures.
• Include 1–2 natural errors (for realism), but keep it subtle.
• Do not use overly complex words or filler fluff.
• Ensure the final output is ready to publish on hindi.cricketAddictor.com.

🏏 Example Style Reference:
Articles from hindi.cricketAddictor.com → News Section Reference

SEO आउटलाइन का कड़ाई से पालन करें:
${recOutline || ""}

महत्वपूर्ण: आपको ऊपर दिए गए आउटलाइन से H2 और H3 शीर्षकों का उपयोग करना चाहिए।
- आउटलाइन में दिए गए H2/H3 headings इस specific article के लिए बनाए गए हैं - उन्हें use करें
- इस आउटलाइन के अनुसार अपने लेख को संरचित करें
- H2 headings CONTENT-SPECIFIC और UNIQUE होने चाहिए (generic titles जैसे "मैच विवरण", "खिलाड़ी प्रदर्शन" avoid करें)
- हर article के H2 headings अलग-अलग होने चाहिए based on उस article की specific story

🧠 H2 Headings का मतलब:
- H2 headings से पता चलना चाहिए कि आपने article को READ, UNDERSTAND, और ANALYZE किया है
- हर H2 article के एक specific aspect को highlight करे (न कि generic section name)
- H2 headings intelligent और content-aware होने चाहिए

HTML Format:
- Return HTML BODY ONLY (no <html>, <head>, <body> tags)
- Use: <h1>, <h2>, <h3>, <p>, <ul>, <li>, <blockquote>, <strong>, <em>
- Start with <h1>${recTitle || ""}</h1> (यह हेडलाइन नीचे दी गई content के अनुसार यूनिक होनी चाहिए)
- DO NOT copy the English source headline directly - create a NEW unique Hindi headline
- Use exact H2 and H3 headings from the outline above
- Write paragraphs with natural flow and varied length
- Use <strong> for player names and important stats
- Use <ul><li> for stats and key points
- Use <blockquote> for expert quotes and social media reactions

Target SEO Keywords (use naturally in content):
Primary: ${recPrimary || ""}
Secondary: ${recSecondary || ""}
Tertiary: ${recTertiary || ""}
Long-tail: ${recLongtail || ""}
Trending: ${recTrending || ""}

🔍 Input - Read CAREFULLY and extract the MAIN news to create headline:

📋 Description: ${rawDescription || ""}

📄 Full Article Content (CREATE headline from THIS):
${rawBody || ""}

🚫🚫🚫 IGNORE THIS GOOGLE NEWS HEADLINE (Do NOT use any words from this):
"${rawTitle || ""}"

🎯 HOW TO CREATE YOUR UNIQUE H1 HEADLINE - USE ONE OF THESE 5 ANGLES:

📍 ANGLE 1: PLAYER/PERSON FOCUS (किसी खिलाड़ी या व्यक्ति पर focus)
Example: "हरमनप्रीत कौर को घरेलू मैदान पर खिताब जीतने का सुनहरा मौका"

📍 ANGLE 2: VENUE/LOCATION FOCUS (जगह/स्थान पर focus)
Example: "गुवाहटी के बरसापारा स्टेडियम में पहली बार वर्ल्ड कप सेमीफाइनल"

📍 ANGLE 3: CONSEQUENCE/IMPACT FOCUS (परिणाम/प्रभाव पर focus)
Example: "पाटीदार के तीन शतकों ने सरफराज की इंडिया ए में जगह खत्म की"

📍 ANGLE 4: CONTROVERSY/CONFLICT FOCUS (विवाद/टकराव पर focus)
Example: "पाकिस्तान की हार से श्रीलंका को मिला झटका: सभी मैच अब भारत में"

📍 ANGLE 5: QUESTION/FUTURE FOCUS (सवाल/भविष्य पर focus)
Example: "क्या भारतीय टीम घरेलू मैदान पर जीत पाएगी वर्ल्ड कप?"

Real Examples:
❌ Source: "सरफराज खान को क्यों नहीं मिली इंडिया ए टीम में जगह?"
✅ H1 (Angle 3): "पाटीदार की धमाकेदार फॉर्म ने सरफराज को किया बाहर"
✅ H1 (Angle 2): "बेंगलुरु सेंटर में स्वास्थ्य लाभ ले रहे सरफराज चूके चयन से"
✅ H1 (Angle 5): "नंबर 3 पर बल्लेबाजी ही बचा सकती है सरफराज का करियर"

❌ Source: "अब भारत में ही आयोजित होंगे वर्ल्ड कप के सेमीफाइनल और फाइनल"
✅ H1 (Angle 4): "पाकिस्तान की हार ने बदली मेजबानी: सभी नॉकआउट मैच भारत में"
✅ H1 (Angle 1): "हरमनप्रीत की टीम को घर पर खिताब जीतने का मौका"
✅ H1 (Angle 2): "नवी मुंबई में 2 नवंबर को बनेगी नई वर्ल्ड चैंपियन"

⚠️ CRITICAL RULES FOR H1:
1. Pick ONE of the 5 angle strategies above
2. Make H1 COMPLETELY DIFFERENT from the ignored source
3. DON'T repeat the PRIMARY point from source - find a SECONDARY angle
4. If source says "X का खराब रिकॉर्ड", DON'T say "X का निराशाजनक रिकॉर्ड" - that's SAME!
5. Instead talk about: consequences, other players, venue challenges, future questions, stats breakdown

Real Example:
❌ Source: "रोहित का एडिलेड में खराब रिकॉर्ड" → H1: "रोहित का एडिलेड में निराशाजनक रिकॉर्ड" (WRONG - repeating "रिकॉर्ड"!)
✅ Source: "रोहित का एडिलेड में खराब रिकॉर्ड" → H1: "विराट कोहली और गिल पर भारी दबाव: रोहित की फॉर्म चिंता" (RIGHT - talks about OTHER players!)
✅ Source: "रोहित का एडिलेड में खराब रिकॉर्ड" → H1: "एडिलेड की पिच और गेंदबाजी: रोहित के लिए सबसे बड़ी चुनौती" (RIGHT - talks about VENUE!)
✅ Source: "रोहित का एडिलेड में खराब रिकॉर्ड" → H1: "12 मैच में सिर्फ 287 रन: क्या रोहित बदल पाएंगे किस्मत?" (RIGHT - stats + question angle!)

🚫 AVOID source's key words: अगर source "खराब रिकॉर्ड" कहता है, don't use "रिकॉर्ड", "खराब", "निराशाजनक" etc. - use DIFFERENT vocabulary!

🚫 QUESTION FORMAT RULE: अगर source QUESTION में है, तो H1 STATEMENT में बनाएं!
❌ Source: "क्या संजू RCB जाएंगे?" → H1: "क्या संजू RCB में खेलेंगे?" (WRONG - same question!)
✅ Source: "क्या संजू RCB जाएंगे?" → H1: "राजस्थान रॉयल्स को झटका: संजू की टीम बदलने की तैयारी" (RIGHT - statement!)
✅ Source: "क्या संजू RCB जाएंगे?" → H1: "गैब्रियल के साथ वायरल तस्वीर ने बढ़ाई संजू के RR छोड़ने की अटकलें" (RIGHT - statement!)

✅ Output:
A 600–800 word news article written in the style of a young cricket journalist, following all the above rules.

IMPORTANT - EVERY ARTICLE MUST HAVE A UNIQUE HEADLINE:
- STOP! READ the source content above CAREFULLY before writing the headline
- Create a BRAND NEW, UNIQUE, SPECIFIC headline for THIS article ONLY
- DO NOT use generic titles like "क्रिकेट अपडेट", "मैच समाचार", "क्रिकेट न्यूज़"
- Include SPECIFIC DETAILS from the content: player names, team names, scores, match type, or key events
- Every article is DIFFERENT - so every headline MUST BE DIFFERENT
- Use simple, conversational Hindi that is used in everyday talking in India
- Avoid heavy Sanskrit words - use the Hindi that cricket fans naturally speak
- Make it sound like a real Hindi cricket journalist wrote this
- Target word count: 600-800 words (MINIMUM 600 words required)

🚨 FINAL CHECK BEFORE WRITING H1 - Answer these questions:

Q1: What is the PRIMARY point source headline is making?
Q2: Am I repeating that SAME primary point? (If YES - STOP and change!)
Q3: Did I pick one of the 5 ANGLE strategies?
Q4: Is my H1 about a SECONDARY/DIFFERENT aspect of the story?
Q5: If I read source + my H1, do they feel like DIFFERENT stories?

Examples:
Source: "रोहित का खराब रिकॉर्ड"
- Primary point: Rohit's bad record ❌ DON'T repeat this!
- Secondary angles: Other players pressure ✅, venue challenges ✅, team impact ✅

Source: "भारत में होगा फाइनल"  
- Primary point: Final in India ❌ DON'T repeat this!
- Secondary angles: Player opportunity ✅, Pakistan impact ✅, Sri Lanka loss ✅

If you're repeating the PRIMARY point - REJECT and find a SECONDARY angle!

🛑 STOP AND CHECK RULE - Before writing H1, ask yourself:
1. Is source asking a QUESTION? → Then DON'T ask the same question! Make a STATEMENT instead!
2. Is source about "X will join Y"? → Then DON'T talk about "X joining Y"! Talk about consequences, other players, or venue!
3. Is source about "bad record/performance"? → Then DON'T talk about "record/performance"! Talk about pitch, bowlers, team impact, or other players!
4. Does source mention specific PLAYERS prominently? → Try NOT to make them the PRIMARY focus! Talk about other players, team, venue, or coach's comments!
5. Am I using ANY of the same key words from source? → STOP! Change them!
6. Would both headlines feel SIMILAR to a reader? → STOP! Pick completely different angle!

Example:
❌ Source: "मैकग्रॉ ने बताया क्यों फेल हुए कोहली-रोहित" → H1: "क्या कोहली-रोहित दिखा पाएंगे जादू?" (STILL about Kohli-Rohit performance!)
✅ Source: "मैकग्रॉ ने बताया क्यों फेल हुए कोहली-रोहित" → H1: "पर्थ की तेज पिच और उछाल: मैकग्रॉ का विश्लेषण" (About PITCH!)
✅ Source: "मैकग्रॉ ने बताया क्यों फेल हुए कोहली-रोहित" → H1: "शुभमन गिल और संजू पर दबाव: सीनियर्स की फॉर्म चिंता का विषय" (About OTHER players!)

REPEAT: DON'T say the SAME THING in different words - say a DIFFERENT THING!

Write now - pure HTML body content in professional Hindi:
`.trim();
}

/* ---------- MAIN PROCESSING FUNCTION ---------- */

async function processHindiCricketNewsOpenAI(input, options = {}) {
  const startTime = Date.now();
  
  try {
    console.log('🏏 [Hindi Cricket OpenAI] Processing Hindi cricket article:', input.title);
    console.log('📝 [Hindi Cricket OpenAI] Original content length:', input.content?.length || 0);
    console.log('📄 [Hindi Cricket OpenAI] Original content preview:', input.content?.substring(0, 200) + '...');
    
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
    console.log('📋 [Hindi Cricket OpenAI] Generating SEO recommendations...');
    const prePrompt = buildHindiCricketPrePublishPrompt({
      title: input.title || "",
      description: input.description || "",
      body: input.content || "",
    });
    const recText = await generateWithOpenAI(prePrompt, { temperature: 0.85, max_tokens: 1200 });
    const recs = parseHindiPrePublishTextToJSON(recText, input.title);
    console.log('✅ [Hindi Cricket OpenAI] SEO recommendations generated');
    console.log('📰 [Hindi Cricket OpenAI] Generated Title:', recs.recommendedTitle);

    // 2) Generate enhanced Hindi cricket article
    console.log('✍️ [Hindi Cricket OpenAI] Generating enhanced Hindi cricket article...');
    const bodyPrompt = buildHindiCricketRewriteBodyHtmlPrompt({
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
    const bodyHtml = await generateWithOpenAI(bodyPrompt, { temperature: 0.7, max_tokens: 5000 });
    console.log('✅ [Hindi Cricket OpenAI] Enhanced Hindi cricket article generated');

    return {
      success: true,
      readyToPublishArticle: bodyHtml,
      recommendations: recs,
      processingTime: Date.now() - startTime
    };

  } catch (error) {
    console.error('Process Hindi cricket news OpenAI error:', error);
    return {
      success: false,
      error: error.message,
      processingTime: Date.now() - startTime
    };
  }
}

/* ---------- PARSERS & HELPERS ---------- */

function parseHindiPrePublishTextToJSON(text = "", originalTitle = "") {
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

  // Fallbacks - Use original title if available
  if (!recommendedTitle) recommendedTitle = originalTitle || "क्रिकेट अपडेट";
  if (!recommendedMeta)  recommendedMeta  = originalTitle ? `${originalTitle.slice(0, 140)} के बारे में जानें।` : "नवीनतम क्रिकेट अपडेट।";
  if (!recommendedSlug)  recommendedSlug  = recommendedTitle;
  if (!outline)          outline          = "H2: मैच सारांश\nH3: मुख्य क्षण";
  if (!primary)          primary          = "क्रिकेट";
  if (!secondary)        secondary        = "खेल";
  if (!tertiary)         tertiary         = "मैच";
  if (!longtail)         longtail         = "क्रिकेट समाचार";
  if (!trending)         trending         = "क्रिकेट अपडेट";

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

async function generateHindiCricketHeadline(title) {
  const prompt = `इस क्रिकेट समाचार शीर्षक के लिए एक आकर्षक, SEO-अनुकूल क्रिकेट हेडलाइन हिंदी में बनाएं। इसे इस तरह बनाएं:
1. आकर्षक और क्रिकेट-केंद्रित
2. यदि संभव हो तो 60 वर्णों से कम
3. क्रिकेट कीवर्ड्स और शब्दावली शामिल करें
4. वास्तविक क्रिकेट समाचार हेडलाइन की तरह लगे
5. क्रिकेट प्रशंसकों के लिए आकर्षक बनाएं, क्लिकबेट से बचें

मूल क्रिकेट शीर्षक: ${title}

नया क्रिकेट हेडलाइन उत्पन्न करें:`;

  try {
    const response = await generateWithOpenAI(prompt, {
      model: "gpt-5.2-pro",
      temperature: 0.8,
      max_tokens: 100
    });
    return response || title;
  } catch (error) {
    console.error('Generate Hindi cricket headline error:', error);
    return title;
  }
}

async function generateHindiCricketMetaDescription(description) {
  const prompt = `इस क्रिकेट समाचार विवरण के लिए एक आकर्षक क्रिकेट मेटा विवरण हिंदी में बनाएं। इसे इस तरह बनाएं:
1. 150-160 वर्ण लंबा
2. मुख्य क्रिकेट जानकारी और कीवर्ड्स शामिल करें
3. क्रिकेट प्रशंसकों के लिए आकर्षक
4. मुख्य क्रिकेट बिंदुओं का सारांश दें
5. प्राकृतिक और क्रिकेट-केंद्रित लगे

मूल क्रिकेट विवरण: ${description}

क्रिकेट मेटा विवरण उत्पन्न करें:`;

  try {
    const response = await generateWithOpenAI(prompt, {
      model: "gpt-5.2-pro",
      temperature: 0.7,
      max_tokens: 200
    });
    return response || description;
  } catch (error) {
    console.error('Generate Hindi cricket meta description error:', error);
    return description;
  }
}

/* ---------- HINDI TO ENGLISH CONVERSION FUNCTION ---------- */
async function convertHindiArticleToEnglish(hindiTitle, hindiMeta, hindiHtml) {
  try {
    console.log('🔄 Converting Hindi article to English...');
    
    // Extract text content from HTML (remove HTML tags for translation)
    const textContent = hindiHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Convert title
    const titlePrompt = `Translate this Hindi cricket news headline to English. Keep it engaging and SEO-friendly. Return only the English translation, nothing else.

Hindi Title: ${hindiTitle}

English Title:`;
    
    const englishTitle = await generateWithOpenAI(titlePrompt, {
      model: "gpt-5.2-pro",
      temperature: 0.7,
      max_tokens: 100
    });
    
    // Convert meta description
    const metaPrompt = `Translate this Hindi cricket news meta description to English. Keep it 150-160 characters, SEO-friendly, and engaging. Return only the English translation, nothing else.

Hindi Meta: ${hindiMeta}

English Meta:`;
    
    const englishMeta = await generateWithOpenAI(metaPrompt, {
      model: "gpt-5.2-pro",
      temperature: 0.7,
      max_tokens: 200
    });
    
    // Convert full article HTML
    const articlePrompt = `Translate this complete Hindi cricket news article to English. Maintain the same HTML structure, formatting, and style. Keep all HTML tags intact. Translate only the text content inside the tags. Return the complete HTML document with English content.

Hindi Article HTML:
${hindiHtml}

English Article HTML:`;
    
    const englishHtml = await generateWithOpenAI(articlePrompt, {
      model: "gpt-5.2-pro",
      temperature: 0.7,
      max_tokens: 5000
    });
    
    // Generate English slug
    const englishSlug = englishTitle.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    console.log('✅ Hindi article converted to English successfully');
    
    return {
      success: true,
      englishTitle: englishTitle.trim(),
      englishMeta: englishMeta.trim(),
      englishHtml: englishHtml.trim(),
      englishSlug: englishSlug
    };
  } catch (error) {
    console.error('❌ Error converting Hindi article to English:', error);
    return {
      success: false,
      error: error.message || 'Conversion failed'
    };
  }
}

module.exports = {
  processHindiCricketNewsOpenAI,
  generateHindiCricketHeadline,
  generateHindiCricketMetaDescription,
  buildHindiCricketHtmlDocument,
  fetchHindiCricketStats,
  generateHindiExpertOpinion,
  generateHindiSocialMediaReactions,
  convertHindiArticleToEnglish,
};