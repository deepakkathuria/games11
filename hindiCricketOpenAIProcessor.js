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

क्रिकेट समाचार के लिए उन्नत SEO नियम:
- केवल इनपुट से तथ्यों का उपयोग करें (कोई आविष्कृत स्कोर/उद्धरण/दिनांक/स्थान नहीं)
- शीर्षक को आकर्षक और क्रिकेट-विशिष्ट बनाएं (टीम नाम, मैच प्रकार, मुख्य परिणाम शामिल करें)
- मेटा विवरण मुख्य क्रिकेट कहानी को उजागर करना चाहिए और जिज्ञासा पैदा करना चाहिए
- आउटलाइन उन्नत क्रिकेट पत्रकारिता संरचना का पालन करना चाहिए:
  * H2: ब्रेकिंग न्यूज सारांश (40-60 शब्द)
  * H2: मैच/घटना विवरण
  * H2: मुख्य खिलाड़ी प्रदर्शन
  * H2: सांख्यिकीय विश्लेषण
  * H2: विशेषज्ञ अंतर्दृष्टि
  * H2: प्रशंसक प्रतिक्रिया और सोशल मीडिया बज़
  * H2: आगे क्या होगा
- 5 विविध कीवर्ड प्रदान करें: प्राथमिक (मुख्य विषय), द्वितीयक (संबंधित शब्द), तृतीयक (विशिष्ट विवरण), लॉन्ग-टेल (विस्तृत वाक्यांश), ट्रेंडिंग (वर्तमान बज़वर्ड्स)
- हिंदी आउटपुट
- आकर्षक और व्यापक बनें

इनपुट
शीर्षक: ${title || ""}
विवरण: ${description || ""}
सामग्री:
${body || ""}
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
आप एक अभिजात्य हिंदी क्रिकेट पत्रकार हैं जो एक प्रीमियम स्पोर्ट्स प्रकाशन के लिए लिख रहे हैं। आपका लक्ष्य एक आकर्षक, कथा-समृद्ध क्रिकेट लेख बनाना है जो साधारण पुनर्लेखन से आगे जाता है।

उन्नत लेखन आवश्यकताएं:

1. पुनर्लेखन और कथा को ऊंचा उठाएं:
- पर्यायवाची स्वैपिंग से आगे जाएं - बेहतर प्रवाह और प्रभाव के लिए वाक्यों और पैराग्राफों को पुनर्गठित करें
- हर्षा भोगले या जैरोड किम्बर जैसे पत्रकारों की तकनीकों का उपयोग करके आकर्षक कथा आवाज़ इंजेक्ट करें
- जहां उपयुक्त हो, कथात्मक लीड्स, बयानबाजी प्रश्नों और व्यक्तिगत अंतर्दृष्टि का उपयोग करें
- सबसे न्यूज़वर्थी कोण की पहचान करें और उसका विस्तार करें, भले ही मूल ने इसे कम आंका हो
- पाठकों को शुरुआत से अंत तक आकर्षित करने वाला कहानी चाप बनाएं

2. विशेष मूल्य के साथ बढ़ाएं:
- प्रासंगिक क्रिकेट आंकड़े और डेटा विश्लेषण जोड़ें (खिलाड़ी रिकॉर्ड, टीम प्रदर्शन, ऐतिहासिक संदर्भ)
- खिलाड़ियों, कोचों या विश्लेषकों से तार्किक, अच्छी तरह से अनुमानित उद्धरण शामिल करें
- अधिक समृद्ध पृष्ठभूमि और ऐतिहासिक संदर्भ प्रदान करें जो मूल ने छोड़ा हो सकता है
- समान अतीत की क्रिकेट घटनाओं के साथ तुलनात्मक विश्लेषण जोड़ें
- प्रदर्शन मेट्रिक्स और रुझान शामिल करें

3. संरचना और SEO को अनुकूलित करें:
- शक्तिशाली, कीवर्ड-समृद्ध शीर्षक और तीखा शुरुआती पैराग्राफ (40-60 शब्द) तैयार करें
- स्पष्ट, वर्णनात्मक उपशीर्षक (H2, H3) का उपयोग करें
- सभी 5 कीवर्ड्स को प्राकृतिक रूप से एकीकृत करें: ${recPrimary || ""}, ${recSecondary || ""}, ${recTertiary || ""}, ${recLongtail || ""}, ${recTrending || ""}
- डिजिटल पठनीयता के लिए पैराग्राफ छोटे रखें (अधिकतम 2-3 पंक्तियां)
- आंकड़े और मुख्य तथ्यों के लिए बुलेट पॉइंट्स का उपयोग करें

4. नए अनुभाग शामिल करें:
- यथार्थवादी सोशल मीडिया प्रतिक्रियाएं जोड़ें (X/Twitter, Instagram से 3-5 ट्रेंडिंग प्रतिक्रियाएं)
- विशेषज्ञ विश्लेषण और उद्धरण शामिल करें
- सांख्यिकीय संदर्भ और डेटा अंतर्दृष्टि प्रदान करें
- प्रशंसक परिप्रेक्ष्य और समुदाय प्रतिक्रियाएं जोड़ें

एंटी-एआई डिटेक्शन नियम (उन्नत):
- 100% मूल सामग्री लिखें - अपने शब्दों में पूरी तरह से पुनर्लेखन करें
- कच्ची सामग्री से कभी भी वाक्यांश या वाक्य सीधे कॉपी न करें
- वाक्य की लंबाई को नाटकीय रूप से बदलें (3-शब्द की पंची स्टेटमेंट्स, फिर 25-शब्द के विश्लेषणात्मक वाक्य)
- अप्रत्याशित शब्द विकल्पों का उपयोग करें और अनुमानित पैटर्न से बचें
- वास्तविक मानवीय तत्व जोड़ें: प्राकृतिक अपूर्णताएं, विविध गति, भावनात्मक विचरण
- विशिष्ट विवरण, दिनांक, स्कोर और कठिन तथ्य शामिल करें
- जब संभव हो, विशेषता के साथ नामित उद्धरणों का उपयोग करें
- एआई-जेनरेटेड सामग्री की तरह नहीं, बल्कि पेशेवर स्पोर्ट्स पत्रकारिता की तरह लगे

भाषा आवश्यकताएं:
- आकर्षक लेकिन सुलभ हिंदी का उपयोग करें (12वीं कक्षा स्तर)
- तकनीकी क्रिकेट शब्दों को रोजमर्रा की भाषा के साथ मिलाएं
- आकर्षक, पठनीय सामग्री बनाएं जो पेशेवर मानकों को बनाए रखे
- सक्रिय आवाज़ और गतिशील वाक्य संरचनाओं का उपयोग करें

SEO आउटलाइन का कड़ाई से पालन करें:
${recOutline || ""}

महत्वपूर्ण: आपको ऊपर दिए गए आउटलाइन से सटीक H2 और H3 शीर्षकों का पालन करना चाहिए।
- आउटलाइन में दिए गए सटीक शीर्षक पाठ का उपयोग करें
- इस आउटलाइन के अनुसार अपने लेख को संरचित करें
- आउटलाइन से कोई भी अनुभाग न छोड़ें
- आउटलाइन में नहीं है, ऐसे अतिरिक्त अनुभाग न जोड़ें

उन्नत लेखन शैली:
1. तुरंत पाठक को आकर्षित करने वाले आकर्षक लीड के साथ शुरुआत करें
2. विविध वाक्य लय का उपयोग करें: छोटी पंची स्टेटमेंट्स के साथ लंबे विश्लेषणात्मक वाक्यों को मिलाएं
3. कठिन डेटा शामिल करें: विशिष्ट आंकड़े, रिकॉर्ड्स, औसत, ऐतिहासिक तुलनाएं
4. विशेषज्ञ आवाज़ें जोड़ें: कोचों, खिलाड़ियों या विश्लेषकों से यथार्थवादी उद्धरण शामिल करें
5. कथा प्रवाह बनाएं: पूरे लेख में तनाव, उत्साह और जुड़ाव का निर्माण करें
6. भावनात्मक बुद्धिमत्ता का उपयोग करें: घटना के नाटक और महत्व को पकड़ें
7. संदर्भ प्रदान करें: ऐतिहासिक पृष्ठभूमि, निहितार्थ और व्यापक महत्व
8. प्रशंसक परिप्रेक्ष्य शामिल करें: सोशल मीडिया प्रतिक्रियाएं और समुदाय भावना
9. आगे देखने वाले विश्लेषण के साथ समाप्त करें: भविष्य के मैचों/घटनाओं के लिए इसका क्या मतलब है

HTML प्रारूप:
- केवल **HTML BODY** लौटाएं (कोई <html>, कोई <head>, कोई <body> टैग नहीं)
- उपयोग करें: <h1>, <h2>, <h3>, <p>, <ul>, <li>, <blockquote>, <strong>, <em>
- <h1>${recTitle || ""}</h1> से शुरुआत करें
- ऊपर दिए गए आउटलाइन से सटीक H2 और H3 शीर्षकों का उपयोग करें
- विविध लंबाई के प्राकृतिक प्रवाह वाले पैराग्राफ लिखें
- खिलाड़ी नामों और महत्वपूर्ण आंकड़ों के लिए <strong> का उपयोग करें
- आंकड़े और मुख्य बिंदुओं के लिए <ul><li> का उपयोग करें
- विशेषज्ञ उद्धरणों और सोशल मीडिया प्रतिक्रियाओं के लिए <blockquote> का उपयोग करें

लक्ष्य SEO कीवर्ड्स (सामग्री में प्राकृतिक रूप से उपयोग करें):
प्राथमिक: ${recPrimary || ""}
द्वितीयक: ${recSecondary || ""}
तृतीयक: ${recTertiary || ""}
लॉन्ग-टेल: ${recLongtail || ""}
ट्रेंडिंग: ${recTrending || ""}

कच्ची क्रिकेट सामग्री (पूरी तरह से पुनर्लेखन करें - कॉपी न करें):
शीर्षक: ${rawTitle || ""}
विवरण: ${rawDescription || ""}
सामग्री:
${rawBody || ""}

आउटपुट निर्देश:
एक व्यापक, आकर्षक क्रिकेट समाचार लेख लिखें जो:
✓ साधारण पुनर्लेखन से आगे कथा को ऊंचा उठाता है
✓ विशेष मूल्य शामिल करता है (आंकड़े, विशेषज्ञ राय, सोशल प्रतिक्रियाएं)
✓ प्राकृतिक, मानवीय लेखन के साथ AI डिटेक्शन टूल्स पास करता है
✓ सभी 5 कीवर्ड्स का सामग्री में प्राकृतिक रूप से उपयोग करता है
✓ दिए गए आउटलाइन संरचना का पालन करता है
✓ विविध अनुभाग गहराई के साथ 1000-1500 शब्द है
✓ यथार्थवादी सोशल मीडिया प्रतिक्रियाएं शामिल करता है
✓ विशेषज्ञ विश्लेषण और सांख्यिकीय संदर्भ प्रदान करता है
✓ पाठकों को आकर्षित करने वाला आकर्षक कहानी कहानी बनाता है
✓ पेशेवर पत्रकारिता मानकों को बनाए रखता है

अभी लिखना शुरू करें - केवल HTML बॉडी सामग्री, और कुछ नहीं।
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
    const recText = await generateWithOpenAI(prePrompt, { temperature: 0.2, max_tokens: 1200 });
    const recs = parseHindiPrePublishTextToJSON(recText);
    console.log('✅ [Hindi Cricket OpenAI] SEO recommendations generated');

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

function parseHindiPrePublishTextToJSON(text = "") {
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
  if (!recommendedTitle) recommendedTitle = "क्रिकेट अपडेट";
  if (!recommendedMeta)  recommendedMeta  = "नवीनतम क्रिकेट अपडेट।";
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
      model: "gpt-4o-mini",
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
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 200
    });
    return response || description;
  } catch (error) {
    console.error('Generate Hindi cricket meta description error:', error);
    return description;
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
};