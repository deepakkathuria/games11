// const axios = require('axios');

// const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
// const DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1/chat/completions";

// async function generateWithDeepSeek(prompt, options = {}) {
//   try {
//     const response = await axios.post(DEEPSEEK_BASE_URL, {
//       model: "deepseek-chat",
//       messages: [
//         {
//           role: "user",
//           content: prompt
//         }
//       ],
//       temperature: options.temperature || 0.7,
//       max_tokens: options.max_tokens || 2000
//     }, {
//       headers: {
//         'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
//         'Content-Type': 'application/json'
//       },
//       timeout: 60000
//     });

//     return response.data.choices[0].message.content;
//   } catch (error) {
//     console.error('DeepSeek API error:', error);
//     throw error;
//   }
// }

// async function processAllNewsManualInput(input, options = {}) {
//   const startTime = Date.now();
  
//   try {
//     if (!input.title || input.title.length < 10) {
//       throw new Error('Title too short');
//     }
//     if (!input.description || input.description.length < 20) {
//       throw new Error('Description too short');
//     }
//     if (!input.content || input.content.length < 300) {
//       throw new Error('Content too short');
//     }

//     let prePublishingChecks = null;
//     if (options.includePrePublishingChecks !== false) {
//       prePublishingChecks = {
//         titleLength: input.title.length,
//         descriptionLength: input.description.length,
//         contentLength: input.content.length,
//         wordCount: input.content.split(' ').length,
//         readabilityScore: Math.round(Math.random() * 40 + 60)
//       };
//     }

//     let humanLikeContent = input.content;
//     if (options.includeHumanLikeRewriting !== false) {
//       humanLikeContent = await rewriteInHumanStyleAllNews(input.content, input.title);
//     }

//     const readyToPublishArticle = await createReadyToPublishArticleAllNews({
//       ...input,
//       content: humanLikeContent
//     }, options);

//     return {
//       success: true,
//       readyToPublishArticle,
//       prePublishingChecks,
//       processingTime: Date.now() - startTime
//     };

//   } catch (error) {
//     console.error('Process all news manual input error:', error);
//     return {
//       success: false,
//       error: error.message,
//       processingTime: Date.now() - startTime
//     };
//   }
// }

// async function rewriteInHumanStyleAllNews(content, title) {
//   const prompt = `Rewrite this news article in a natural and in hindi lanuage, human-like style. Follow these specific guidelines:

// 1. Write like a real journalist who's passionate about the topic
// 2. Use conversational tone: "I think", "Honestly", "You know what's interesting"
// 3. Add personal reactions: "Wow!", "That's shocking", "I can't believe this"
// 4. Use contractions: "don't", "can't", "won't", "it's"
// 5. Include specific details: dates, names, statistics, locations
// 6. Add rhetorical questions: "What do you think?", "Can you believe this?"
// 7. Use casual transitions: "So here's what happened", "Now get this", "But wait"
// 8. Include emotional reactions and commentary naturally
// 9. Make it sound like you're telling a story to a friend
// 10. Add hard facts: dates, times, names, locations, statistics

// Original content: ${content}

// Write it as if you're a journalist who's genuinely excited about the news and wants to share it with fellow readers. Make it engaging, human, and fact-rich.`;

//   try {
//     const response = await generateWithDeepSeek(prompt, {
//       temperature: 0.95,
//       max_tokens: 2500
//     });
//     return response || content;
//   } catch (error) {
//     console.error('Human style rewriting for all news error:', error);
//     return content;
//   }
// }

// async function createReadyToPublishArticleAllNews(input, options) {
//   const prompt = `Create a complete, ready-to-publish news article in hindi from this content. Make it sound like a real journalist wrote it, not AI. Follow these rules:

// 1. NO markdown formatting (no **, *, #, etc.)
// 2. NO AI phrases like "Of course", "Here is a complete", "optimized for"
// 3. NO template sections like "The Incident", "The Response", etc.
// 4. Write in natural, flowing paragraphs
// 5. Use conversational tone with personal opinions
// 6. Include specific details, dates, names, locations, and facts
// 7. Add emotional reactions and commentary
// 8. Make it engaging and human-like
// 9. NO meta titles or descriptions in the content
// 10. Just write the article naturally
// 11. Include hard facts: dates, times, names, locations, statistics
// 12. Add attributed quotes if available
// 13. Use varied sentence lengths
// 14. Include counter-views and context

// Title: ${input.title}
// Description: ${input.description}
// Content: ${input.content}

// Write a complete article that sounds like it was written by a real journalist who's passionate about the topic and has access to specific facts and details.`;

//   try {
//     const response = await generateWithDeepSeek(prompt, {
//       temperature: 0.9,
//       max_tokens: 3000
//     });
//     return response || input.content;
//   } catch (error) {
//     console.error('Create ready article for all news error:', error);
//     return input.content;
//   }
// }

// module.exports = {
//   processAllNewsManualInput,
//   rewriteInHumanStyleAllNews,
//   createReadyToPublishArticleAllNews
// };





const axios = require('axios');

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1/chat/completions";

async function generateWithDeepSeek(prompt, options = {}) {
  try {
    const response = await axios.post(DEEPSEEK_BASE_URL, {
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: "आप एक हिंदी पत्रकार हैं। सभी प्रतिक्रियाएं हिंदी भाषा में देवनागरी लिपि में दें। अंग्रेजी शब्दों का उपयोग न करें। केवल हिंदी में लिखें।"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 2000
    }, {
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('DeepSeek API error:', error);
    throw error;
  }
}

async function processAllNewsManualInput(input, options = {}) {
  const startTime = Date.now();
  
  try {
    if (!input.title || input.title.length < 10) {
      throw new Error('Title too short');
    }
    if (!input.description || input.description.length < 20) {
      throw new Error('Description too short');
    }
    if (!input.content || input.content.length < 300) {
      throw new Error('Content too short');
    }

    let prePublishingChecks = null;
    if (options.includePrePublishingChecks !== false) {
      prePublishingChecks = {
        titleLength: input.title.length,
        descriptionLength: input.description.length,
        contentLength: input.content.length,
        wordCount: input.content.split(' ').length,
        readabilityScore: Math.round(Math.random() * 40 + 60)
      };
    }

    let humanLikeContent = input.content;
    if (options.includeHumanLikeRewriting !== false) {
      humanLikeContent = await rewriteInHumanStyleAllNews(input.content, input.title);
    }

    const readyToPublishArticle = await createReadyToPublishArticleAllNews({
      ...input,
      content: humanLikeContent
    }, options);

    return {
      success: true,
      readyToPublishArticle,
      prePublishingChecks,
      processingTime: Date.now() - startTime
    };

  } catch (error) {
    console.error('Process all news manual input error:', error);
    return {
      success: false,
      error: error.message,
      processingTime: Date.now() - startTime
    };
  }
}

async function rewriteInHumanStyleAllNews(content, title) {
  const prompt = `आप एक हिंदी पत्रकार हैं। इस समाचार लेख को प्राकृतिक और मानवीय शैली में हिंदी में लिखें। इन निर्देशों का पालन करें:

1. एक वास्तविक पत्रकार की तरह लिखें जो इस विषय के बारे में भावुक है
2. बातचीत की शैली का उपयोग करें: "मुझे लगता है", "सच कहूं तो", "आप जानते हैं कि क्या दिलचस्प है"
3. व्यक्तिगत प्रतिक्रियाएं जोड़ें: "वाह!", "यह चौंकाने वाला है", "मैं इस पर विश्वास नहीं कर सकता"
4. संकुचन का उपयोग करें: "नहीं", "नहीं कर सकते", "नहीं होगा", "यह है"
5. विशिष्ट विवरण शामिल करें: तारीखें, नाम, आंकड़े, स्थान
6. बयानबाजी के सवाल जोड़ें: "आप क्या सोचते हैं?", "क्या आप इस पर विश्वास कर सकते हैं?"
7. आकस्मिक संक्रमण का उपयोग करें: "तो यहां क्या हुआ", "अब यह सुनें", "लेकिन रुकिए"
8. भावनात्मक प्रतिक्रियाएं और टिप्पणी स्वाभाविक रूप से शामिल करें
9. इसे ऐसे लिखें जैसे आप किसी दोस्त को कहानी सुना रहे हों
10. कठोर तथ्य जोड़ें: तारीखें, समय, नाम, स्थान, आंकड़े
11. हिंदी भाषा में प्राकृतिक वाक्य संरचना का उपयोग करें
12. भारतीय संदर्भ और उदाहरण शामिल करें जहां उपयुक्त हो

मूल सामग्री: ${content}

इसे ऐसे लिखें जैसे आप एक पत्रकार हैं जो समाचार के बारे में वास्तव में उत्साहित हैं और इसे साथी पाठकों के साथ साझा करना चाहते हैं। इसे आकर्षक, मानवीय और तथ्य-समृद्ध बनाएं।

CRITICAL: केवल हिंदी भाषा में लिखें। अंग्रेजी शब्दों का उपयोग न करें। देवनागरी लिपि का उपयोग करें।`;

  try {
    const response = await generateWithDeepSeek(prompt, {
      temperature: 0.95,
      max_tokens: 2500
    });
    return response || content;
  } catch (error) {
    console.error('Human style rewriting for all news error:', error);
    return content;
  }
}

async function createReadyToPublishArticleAllNews(input, options) {
  const prompt = `इस सामग्री से एक पूर्ण, प्रकाशन के लिए तैयार समाचार लेख हिंदी में बनाएं। इसे ऐसे लिखें जैसे कि एक वास्तविक पत्रकार ने लिखा हो, AI ने नहीं। इन नियमों का पालन करें:

1. कोई मार्कडाउन फॉर्मेटिंग नहीं (कोई **, *, #, आदि नहीं)
2. कोई AI वाक्यांश नहीं जैसे "बेशक", "यहां एक पूर्ण है", "के लिए अनुकूलित"
3. कोई टेम्प्लेट अनुभाग नहीं जैसे "घटना", "प्रतिक्रिया", आदि
4. प्राकृतिक, बहने वाले पैराग्राफ में लिखें
5. व्यक्तिगत राय के साथ बातचीत की शैली का उपयोग करें
6. विशिष्ट विवरण, तारीखें, नाम, स्थान और तथ्य शामिल करें
7. भावनात्मक प्रतिक्रियाएं और टिप्पणी जोड़ें
8. इसे आकर्षक और मानवीय बनाएं
9. सामग्री में कोई मेटा शीर्षक या विवरण नहीं
10. बस लेख को स्वाभाविक रूप से लिखें
11. कठोर तथ्य शामिल करें: तारीखें, समय, नाम, स्थान, आंकड़े
12. यदि उपलब्ध हो तो उद्धृत उद्धरण जोड़ें
13. विविध वाक्य लंबाई का उपयोग करें
14. प्रतिवाद और संदर्भ शामिल करें
15. हिंदी भाषा की प्राकृतिक संरचना का उपयोग करें
16. भारतीय पाठकों के लिए प्रासंगिक उदाहरण और संदर्भ जोड़ें

शीर्षक: ${input.title}
विवरण: ${input.description}
सामग्री: ${input.content}

एक पूर्ण लेख लिखें जो ऐसा लगे जैसे इसे एक वास्तविक पत्रकार ने लिखा है जो विषय के बारे में भावुक है और विशिष्ट तथ्यों और विवरणों तक पहुंच रखता है।

CRITICAL: केवल हिंदी भाषा में देवनागरी लिपि का उपयोग करके लिखें। कोई अंग्रेजी शब्द नहीं।`;

  try {
    const response = await generateWithDeepSeek(prompt, {
      temperature: 0.9,
      max_tokens: 3000
    });
    return response || input.content;
  } catch (error) {
    console.error('Create ready article for all news error:', error);
    return input.content;
  }
}

// Additional function for generating Hindi headlines
async function generateHindiHeadline(title, content) {
  const prompt = `इस समाचार के लिए एक आकर्षक हिंदी शीर्षक बनाएं:

मूल शीर्षक: ${title}
सामग्री: ${content.substring(0, 500)}...

निर्देश:
1. 60-80 अक्षरों में रखें
2. आकर्षक और क्लिक करने योग्य बनाएं
3. मुख्य बिंदु को उजागर करें
4. हिंदी भाषा में देवनागरी लिपि में लिखें
5. अंग्रेजी शब्दों का उपयोग न करें

CRITICAL: केवल हिंदी में शीर्षक दें।`;

  try {
    const response = await generateWithDeepSeek(prompt, {
      temperature: 0.8,
      max_tokens: 100
    });
    return response || title;
  } catch (error) {
    console.error('Generate Hindi headline error:', error);
    return title;
  }
}

// Additional function for generating Hindi meta description
async function generateHindiMetaDescription(content) {
  const prompt = `इस समाचार लेख के लिए एक SEO-अनुकूलित हिंदी मेटा विवरण बनाएं:

सामग्री: ${content.substring(0, 800)}...

निर्देश:
1. 150-160 अक्षरों में रखें
2. मुख्य बिंदुओं को संक्षेप में बताएं
3. पाठकों को आकर्षित करें
4. हिंदी भाषा में देवनागरी लिपि में लिखें
5. अंग्रेजी शब्दों का उपयोग न करें

CRITICAL: केवल हिंदी में मेटा विवरण दें।`;

  try {
    const response = await generateWithDeepSeek(prompt, {
      temperature: 0.7,
      max_tokens: 150
    });
    return response || content.substring(0, 160);
  } catch (error) {
    console.error('Generate Hindi meta description error:', error);
    return content.substring(0, 160);
  }
}

module.exports = {
  processAllNewsManualInput,
  rewriteInHumanStyleAllNews,
  createReadyToPublishArticleAllNews,
  generateHindiHeadline,
  generateHindiMetaDescription
};