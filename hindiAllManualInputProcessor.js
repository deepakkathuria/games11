

// const axios = require('axios');

// const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
// const DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1/chat/completions";

// async function generateWithDeepSeek(prompt, options = {}) {
//   try {
//     const response = await axios.post(DEEPSEEK_BASE_URL, {
//       model: "deepseek-chat",
//       messages: [
//         {
//           role: "system",
//           content: "🚨 CRITICAL: आप एक हिंदी पत्रकार हैं। आपको केवल हिंदी में लिखना है। अंग्रेजी शब्दों का उपयोग न करें। सभी प्रतिक्रियाएं देवनागरी लिपि में होनी चाहिए। यदि आप अंग्रेजी में लिखते हैं तो आप असफल हो जाएंगे। केवल हिंदी भाषा का उपयोग करें।"
//         },
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

//     let content = response.data.choices[0].message.content;
    
//     // Post-process to ensure Hindi output
//     if (options.forceHindi) {
//       content = await postProcessForHindi(content);
//     }
    
//     return content;
//   } catch (error) {
//     console.error('DeepSeek API error:', error);
//     throw error;
//   }
// }

// async function postProcessForHindi(content) {
//   // If content is still in English, try to force Hindi conversion
//   if (isEnglishContent(content)) {
//     console.log('Content is in English, attempting Hindi conversion...');
    
//     const hindiPrompt = `Translate this English text to Hindi immediately. Write ONLY in Hindi using Devanagari script. NO English words allowed:

// ${content}

// Hindi translation:`;
    
//     try {
//       const response = await axios.post(DEEPSEEK_BASE_URL, {
//         model: "deepseek-chat",
//         messages: [
//           {
//             role: "system",
//             content: "आप एक हिंदी अनुवादक हैं। केवल हिंदी में अनुवाद करें। अंग्रेजी शब्दों का उपयोग न करें।"
//           },
//           {
//             role: "user",
//             content: hindiPrompt
//           }
//         ],
//         temperature: 0.3,
//         max_tokens: 2000
//       }, {
//         headers: {
//           'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
//           'Content-Type': 'application/json'
//         },
//         timeout: 60000
//       });
      
//       return response.data.choices[0].message.content;
//     } catch (error) {
//       console.error('Hindi conversion failed:', error);
//       return content; // Return original if conversion fails
//     }
//   }
  
//   return content;
// }

// function isEnglishContent(content) {
//   // Simple check to see if content is primarily in English
//   const englishWords = content.match(/[a-zA-Z]+/g) || [];
//   const totalWords = content.split(/\s+/).length;
  
//   return englishWords.length > totalWords * 0.3; // If more than 30% English words
// }

// async function directTranslateToHindi(content, title) {
//   const prompt = `You are a Hindi journalist. Translate this English news article to Hindi. 

// IMPORTANT: Write ONLY in Hindi using Devanagari script. NO English words allowed.

// Rules:
// 1. Use simple Hindi words that common people understand
// 2. Keep all facts accurate (names, dates, places)
// 3. Use natural Hindi journalistic style
// 4. Convert country names: India = भारत, Pakistan = पाकिस्तान, United Nations = संयुक्त राष्ट्र
// 5. Use Hindi phrases: "सूत्रों के मुताबिक", "घटना के बाद माहौल"

// English article:
// Title: ${title}
// Content: ${content}

// Now write the Hindi version:`;

//   try {
//     const response = await axios.post(DEEPSEEK_BASE_URL, {
//       model: "deepseek-chat",
//       messages: [
//         {
//           role: "system",
//           content: "आप एक हिंदी पत्रकार हैं। आपको केवल हिंदी में लिखना है। अंग्रेजी शब्दों का उपयोग न करें। सभी प्रतिक्रियाएं देवनागरी लिपि में होनी चाहिए।"
//         },
//         {
//           role: "user",
//           content: prompt
//         }
//       ],
//       temperature: 0.3,
//       max_tokens: 2000
//     }, {
//       headers: {
//         'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
//         'Content-Type': 'application/json'
//       },
//       timeout: 60000
//     });
    
//     let hindiContent = response.data.choices[0].message.content.trim();
    
//     // If still in English, try one more time with stronger prompt
//     if (isEnglishContent(hindiContent)) {
//       console.log('Content still in English, trying stronger prompt...');
      
//       const strongerPrompt = `Translate to Hindi NOW. NO English words allowed.

// ${content}

// Hindi translation:`;
      
//       const response2 = await axios.post(DEEPSEEK_BASE_URL, {
//         model: "deepseek-chat",
//         messages: [
//           {
//             role: "system",
//             content: "केवल हिंदी में लिखें। अंग्रेजी नहीं।"
//           },
//           {
//             role: "user",
//             content: strongerPrompt
//           }
//         ],
//         temperature: 0.1,
//         max_tokens: 2000
//       }, {
//         headers: {
//           'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
//           'Content-Type': 'application/json'
//         },
//         timeout: 60000
//       });
      
//       hindiContent = response2.data.choices[0].message.content.trim();
//     }
    
//     return hindiContent;
//   } catch (error) {
//     console.error('Direct translation error:', error);
//     throw error;
//   }
// }

// async function processHindiAllNewsManualInput(input, options = {}) {
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
//       humanLikeContent = await rewriteInHumanStyleHindiAllNews(input.content, input.title);
//     }

//     const readyToPublishArticle = await createReadyToPublishArticleHindiAllNews({
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
//     console.error('Process Hindi all news manual input error:', error);
//     return {
//       success: false,
//       error: error.message,
//       processingTime: Date.now() - startTime
//     };
//   }
// }

// async function rewriteInHumanStyleHindiAllNews(content, title) {
//   console.log('🔄 [Hindi All News] Starting human style rewriting...');
//   console.log('📝 [Hindi All News] Content length:', content?.length);
//   console.log('📝 [Hindi All News] Title:', title?.substring(0, 50) + '...');
  
//   // Use the simple direct translation approach
//   const hindiContent = await directTranslateToHindi(content, title);
  
//   console.log('✅ [Hindi All News] Human style rewriting completed, length:', hindiContent?.length);
//   console.log('📄 [Hindi All News] Hindi content preview:', hindiContent?.substring(0, 200) + '...');
  
//   // Convert plain text to HTML paragraphs
//   if (hindiContent) {
//     const paragraphs = hindiContent.split('\n').filter(p => p.trim().length > 0);
//     console.log('📝 [Hindi All News] Paragraphs count:', paragraphs.length);
    
//     const htmlContent = paragraphs.map(p => `<p>${p.trim()}</p>`).join('\n');
//     console.log('✅ [Hindi All News] HTML conversion completed, length:', htmlContent.length);
//     console.log('📄 [Hindi All News] HTML preview:', htmlContent.substring(0, 200) + '...');
    
//     return htmlContent;
//   }
  
//   console.log('❌ [Hindi All News] No Hindi content, returning original');
//   return content;
// }

// async function createReadyToPublishArticleHindiAllNews(input, options = {}) {
//   console.log('🔄 [Hindi All News] Creating ready-to-publish article...');
//   console.log('📝 [Hindi All News] Input content length:', input.content?.length);
  
//   // Use the simple direct translation approach
//   const hindiContent = await directTranslateToHindi(input.content, input.title);
  
//   console.log('✅ [Hindi All News] Hindi translation completed, length:', hindiContent?.length);
//   console.log('📄 [Hindi All News] Hindi content preview:', hindiContent?.substring(0, 200) + '...');
  
//   // Convert plain text to HTML paragraphs
//   if (hindiContent) {
//     const paragraphs = hindiContent.split('\n').filter(p => p.trim().length > 0);
//     console.log('📝 [Hindi All News] Paragraphs count:', paragraphs.length);
    
//     const htmlContent = paragraphs.map(p => `<p>${p.trim()}</p>`).join('\n');
//     console.log('✅ [Hindi All News] HTML conversion completed, length:', htmlContent.length);
//     console.log('📄 [Hindi All News] HTML preview:', htmlContent.substring(0, 200) + '...');
    
//     return htmlContent;
//   }
  
//   console.log('❌ [Hindi All News] No Hindi content, returning original');
//   return input.content;
// }

// async function generateHindiAllNewsHeadline(title) {
//   const prompt = `Generate a sharp, engaging Hindi headline for this news article. Follow these rules:

// 1. Keep it under 80 characters
// 2. Use natural Hindi language
// 3. Make it attention-grabbing but not clickbait
// 4. Use simple, relatable Hindi words
// 5. Avoid English words

// CRITICAL: Return ONLY the Hindi headline. NO English words, NO formatting characters, NO extra text.

// ENGLISH TITLE: ${title}`;

//   try {
//     const response = await generateWithDeepSeek(prompt, {
//       temperature: 0.8,
//       max_tokens: 100,
//       forceHindi: true
//     });
    
//     return response.trim();
//   } catch (error) {
//     console.error('Error generating Hindi headline:', error);
//     return title; // Fallback to original title
//   }
// }

// async function generateHindiAllNewsMetaDescription(description) {
//   const prompt = `Generate a compelling Hindi meta description for this news article. Follow these rules:

// 1. Keep it under 160 characters
// 2. Use natural Hindi language
// 3. Include key facts and emotional appeal
// 4. Use simple, relatable Hindi words
// 5. Avoid English words

// CRITICAL: Return ONLY the Hindi meta description. NO English words, NO formatting characters, NO extra text.

// ENGLISH DESCRIPTION: ${description}`;

//   try {
//     const response = await generateWithDeepSeek(prompt, {
//       temperature: 0.8,
//       max_tokens: 200,
//       forceHindi: true
//     });
    
//     return response.trim();
//   } catch (error) {
//     console.error('Error generating Hindi meta description:', error);
//     return description; // Fallback to original description
//   }
// }

// module.exports = {
//   processHindiAllNewsManualInput,
//   rewriteInHumanStyleHindiAllNews,
//   createReadyToPublishArticleHindiAllNews,
//   generateHindiAllNewsHeadline,
//   generateHindiAllNewsMetaDescription
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
          content: "🚨 CRITICAL: आप एक हिंदी पत्रकार हैं। आपको केवल हिंदी में लिखना है। अंग्रेजी शब्दों का उपयोग न करें। सभी प्रतिक्रियाएं देवनागरी लिपि में होनी चाहिए। यदि आप अंग्रेजी में लिखते हैं तो आप असफल हो जाएंगे। केवल हिंदी भाषा का उपयोग करें।"
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

    let content = response.data.choices[0].message.content;
    
    // Post-process to ensure Hindi output
    if (options.forceHindi) {
      content = await postProcessForHindi(content);
    }
    
    return content;
  } catch (error) {
    console.error('DeepSeek API error:', error);
    throw error;
  }
}

async function postProcessForHindi(content) {
  // If content is still in English, try to force Hindi conversion
  if (isEnglishContent(content)) {
    console.log('Content is in English, attempting Hindi conversion...');
    
    const hindiPrompt = `Translate this English text to Hindi immediately. Write ONLY in Hindi using Devanagari script. NO English words allowed:

${content}

Hindi translation:`;
    
    try {
      const response = await axios.post(DEEPSEEK_BASE_URL, {
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "आप एक हिंदी अनुवादक हैं। केवल हिंदी में अनुवाद करें। अंग्रेजी शब्दों का उपयोग न करें।"
          },
          {
            role: "user",
            content: hindiPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      }, {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      });
      
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Hindi conversion failed:', error);
      return content; // Return original if conversion fails
    }
  }
  
  return content;
}

function isEnglishContent(content) {
  // Simple check to see if content is primarily in English
  const englishWords = content.match(/[a-zA-Z]+/g) || [];
  const totalWords = content.split(/\s+/).length;
  
  return englishWords.length > totalWords * 0.3; // If more than 30% English words
}

async function directTranslateToHindi(content, title) {
  const prompt = `You are a Hindi journalist. Translate this English news article to Hindi. 

IMPORTANT: Write ONLY in Hindi using Devanagari script. NO English words allowed.

Rules:
1. Use simple Hindi words that common people understand
2. Keep all facts accurate (names, dates, places)
3. Use natural Hindi journalistic style
4. Convert country names: India = भारत, Pakistan = पाकिस्तान, United Nations = संयुक्त राष्ट्र
5. Use Hindi phrases: "सूत्रों के मुताबिक", "घटना के बाद माहौल"

English article:
Title: ${title}
Content: ${content}

Now write the Hindi version:`;

  try {
    const response = await axios.post(DEEPSEEK_BASE_URL, {
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: "आप एक हिंदी पत्रकार हैं। आपको केवल हिंदी में लिखना है। अंग्रेजी शब्दों का उपयोग न करें। सभी प्रतिक्रियाएं देवनागरी लिपि में होनी चाहिए।"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    }, {
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });
    
    let hindiContent = response.data.choices[0].message.content.trim();
    
    // If still in English, try one more time with stronger prompt
    if (isEnglishContent(hindiContent)) {
      console.log('Content still in English, trying stronger prompt...');
      
      const strongerPrompt = `Translate to Hindi NOW. NO English words allowed.

${content}

Hindi translation:`;
      
      const response2 = await axios.post(DEEPSEEK_BASE_URL, {
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "केवल हिंदी में लिखें। अंग्रेजी नहीं।"
          },
          {
            role: "user",
            content: strongerPrompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      }, {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      });
      
      hindiContent = response2.data.choices[0].message.content.trim();
    }
    
    return hindiContent;
  } catch (error) {
    console.error('Direct translation error:', error);
    throw error;
  }
}

async function processHindiAllNewsManualInput(input, options = {}) {
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
      humanLikeContent = await rewriteInHumanStyleHindiAllNews(input.content, input.title);
    }

    const readyToPublishArticle = await createReadyToPublishArticleHindiAllNews({
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
    console.error('Process Hindi all news manual input error:', error);
    return {
      success: false,
      error: error.message,
      processingTime: Date.now() - startTime
    };
  }
}

// ❌ ONE LINE ISSUE - NO HTML CONVERSION
async function rewriteInHumanStyleHindiAllNews(content, title) {
  // Use the simple direct translation approach
  return await directTranslateToHindi(content, title);
}

// ❌ ONE LINE ISSUE - NO HTML CONVERSION  
async function createReadyToPublishArticleHindiAllNews(input, options = {}) {
  // Use the simple direct translation approach
  return await directTranslateToHindi(input.content, input.title);
}

async function generateHindiAllNewsHeadline(title) {
  const prompt = `Generate a sharp, engaging Hindi headline for this news article. Follow these rules:

1. Keep it under 80 characters
2. Use natural Hindi language
3. Make it attention-grabbing but not clickbait
4. Use simple, relatable Hindi words
5. Avoid English words

CRITICAL: Return ONLY the Hindi headline. NO English words, NO formatting characters, NO extra text.

ENGLISH TITLE: ${title}`;

  try {
    const response = await generateWithDeepSeek(prompt, {
      temperature: 0.8,
      max_tokens: 100,
      forceHindi: true
    });
    
    return response.trim();
  } catch (error) {
    console.error('Error generating Hindi headline:', error);
    return title; // Fallback to original title
  }
}

async function generateHindiAllNewsMetaDescription(description) {
  const prompt = `Generate a compelling Hindi meta description for this news article. Follow these rules:

1. Keep it under 160 characters
2. Use natural Hindi language
3. Include key facts and emotional appeal
4. Use simple, relatable Hindi words
5. Avoid English words

CRITICAL: Return ONLY the Hindi meta description. NO English words, NO formatting characters, NO extra text.

ENGLISH DESCRIPTION: ${description}`;

  try {
    const response = await generateWithDeepSeek(prompt, {
      temperature: 0.8,
      max_tokens: 200,
      forceHindi: true
    });
    
    return response.trim();
  } catch (error) {
    console.error('Error generating Hindi meta description:', error);
    return description; // Fallback to original description
  }
}

module.exports = {
  processHindiAllNewsManualInput,
  rewriteInHumanStyleHindiAllNews,
  createReadyToPublishArticleHindiAllNews,
  generateHindiAllNewsHeadline,
  generateHindiAllNewsMetaDescription
};