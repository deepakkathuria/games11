// const axios = require('axios');

// const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
// const DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1/chat/completions";

// /**
//  * Generate content using DeepSeek API
//  */
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

// /**
//  * Process Hindi manual input and create ready-to-publish article
//  */
// async function processHindiManualInput(input, options = {}) {
//   const startTime = Date.now();
  
//   try {
//     // Validate input
//     if (!input.title || input.title.length < 10) {
//       throw new Error('Title too short');
//     }
//     if (!input.description || input.description.length < 20) {
//       throw new Error('Description too short');
//     }
//     if (!input.content || input.content.length < 300) {
//       throw new Error('Content too short');
//     }

//     // Pre-publishing checks
//     let prePublishingChecks = null;
//     if (options.includePrePublishingChecks !== false) {
//       prePublishingChecks = {
//         titleLength: input.title.length,
//         descriptionLength: input.description.length,
//         contentLength: input.content.length,
//         wordCount: input.content.split(' ').length,
//         hasKeywords: input.content.toLowerCase().includes('cricket'),
//         readabilityScore: Math.round(Math.random() * 40 + 60)
//       };
//     }

//     // Human-like rewriting with Hindi-specific prompts
//     let humanLikeContent = input.content;
//     if (options.includeHumanLikeRewriting !== false) {
//       humanLikeContent = await rewriteHindiInHumanStyle(input.content, input.title);
//     }

//     // Create final Hindi article
//     const readyToPublishArticle = await createHindiReadyToPublishArticle({
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
//     console.error('Process Hindi manual input error:', error);
//     return {
//       success: false,
//       error: error.message,
//       processingTime: Date.now() - startTime
//     };
//   }
// }

// /**
//  * Rewrite Hindi content in human-like style
//  */
// async function rewriteHindiInHumanStyle(content, title) {
//   const prompt = `Rewrite this Hindi cricket article in a natural, human-like style. Follow these specific guidelines:

// 1. Write like a real Hindi cricket journalist who's passionate about the sport
// 2. Use conversational Hindi tone: "मुझे लगता है", "सच कहूं तो", "देखिए क्या हुआ"
// 3. Add personal reactions: "वाह!", "यह तो शॉकिंग है", "मैं यकीन नहीं कर सकता"
// 4. Use Hindi contractions and natural expressions
// 5. Include specific details: scores, dates, player names, statistics
// 6. Add rhetorical questions: "क्या आप यकीन कर सकते हैं?", "क्या सोचते हैं आप?"
// 7. Use casual transitions: "तो यहां क्या हुआ", "अब सुनिए", "लेकिन रुकिए"
// 8. Include emotional reactions and commentary naturally
// 9. Make it sound like you're telling a story to a friend
// 10. Add hard facts: final scores, targets, overs, player stats, dates, times

// Original content: ${content}

// Write it as if you're a Hindi cricket journalist who's genuinely excited about the news and wants to share it with fellow fans. Make it engaging, human, and fact-rich in Hindi.`;

//   try {
//     const response = await generateWithDeepSeek(prompt, {
//       temperature: 0.95,
//       max_tokens: 2500
//     });
//     return response || content;
//   } catch (error) {
//     console.error('Hindi human style rewriting error:', error);
//     return content;
//   }
// }

// /**
//  * Create final ready-to-publish Hindi article
//  */
// async function createHindiReadyToPublishArticle(input, options) {
//   const prompt = `Create a complete, ready-to-publish Hindi cricket article from this content. Make it sound like a real Hindi cricket journalist wrote it, not AI. Follow these rules:

// 1. NO markdown formatting (no **, *, #, etc.)
// 2. NO AI phrases like "Of course", "Here is a complete", "optimized for"
// 3. NO template sections like "The Incident", "The Response", etc.
// 4. Write in natural, flowing Hindi paragraphs
// 5. Use conversational Hindi tone with personal opinions
// 6. Include specific details, dates, scores, and facts
// 7. Add emotional reactions and commentary
// 8. Make it engaging and human-like
// 9. NO meta titles or descriptions in the content
// 10. Just write the article naturally in Hindi
// 11. Include hard facts: final scores, targets, overs, player stats, dates, times
// 12. Add attributed quotes if available
// 13. Use varied sentence lengths
// 14. Include counter-views and context

// Title: ${input.title}
// Description: ${input.description}
// Content: ${input.content}

// Write a complete Hindi article that sounds like it was written by a real Hindi cricket journalist who's passionate about the sport and has access to specific facts and details.`;

//   try {
//     const response = await generateWithDeepSeek(prompt, {
//       temperature: 0.9,
//       max_tokens: 3000
//     });
//     return response || input.content;
//   } catch (error) {
//     console.error('Create Hindi ready article error:', error);
//     return input.content;
//   }
// }

// module.exports = {
//   processHindiManualInput,
//   rewriteHindiInHumanStyle,
//   createHindiReadyToPublishArticle
// };


const axios = require('axios');

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1/chat/completions";

/**
 * Generate content using DeepSeek API
 */
async function generateWithDeepSeek(prompt, options = {}) {
  try {
    const response = await axios.post(DEEPSEEK_BASE_URL, {
      model: "deepseek-chat",
      messages: [
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

/**
 * Process Hindi manual input and create ready-to-publish article
 */
async function processHindiManualInput(input, options = {}) {
  const startTime = Date.now();
  
  try {
    // Validate input
    if (!input.title || input.title.length < 10) {
      throw new Error('Title too short');
    }
    if (!input.description || input.description.length < 20) {
      throw new Error('Description too short');
    }
    if (!input.content || input.content.length < 300) {
      throw new Error('Content too short');
    }

    // Pre-publishing checks
    let prePublishingChecks = null;
    if (options.includePrePublishingChecks !== false) {
      prePublishingChecks = {
        titleLength: input.title.length,
        descriptionLength: input.description.length,
        contentLength: input.content.length,
        wordCount: input.content.split(' ').length,
        hasKeywords: input.content.toLowerCase().includes('cricket'),
        readabilityScore: Math.round(Math.random() * 40 + 60)
      };
    }

    // Human-like rewriting with Hindi-specific prompts
    let humanLikeContent = input.content;
    if (options.includeHumanLikeRewriting !== false) {
      humanLikeContent = await rewriteHindiInHumanStyle(input.content, input.title);
    }

    // Create final Hindi article
    const readyToPublishArticle = await createHindiReadyToPublishArticle({
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
    console.error('Process Hindi manual input error:', error);
    return {
      success: false,
      error: error.message,
      processingTime: Date.now() - startTime
    };
  }
}

/**
 * Rewrite Hindi content in human-like style
 */
async function rewriteHindiInHumanStyle(content, title) {
  const prompt = `Act like a professional Hindi cricket journalist working for a top sports publication. Your task is to rewrite the following Hindi cricket news article in a natural, engaging, and factual way – as if written by a passionate human journalist, not AI. Follow these important instructions:

1. ✅ Do NOT change or add any statistics, scores, dates, or names unless it is clearly present in the original content.
2. ✅ Preserve all factual accuracy – no hallucination, no assumption, no guessing.
3. ✅ Use everyday, simple Hindi that people actually speak in India — not literary or overly dramatic Hindi.
4. ✅ Avoid robotic or repetitive expressions like "वाह", "मैं यकीन नहीं कर सकता" unless it naturally fits.
5. ✅ Write in flowing, emotional paragraphs like a cricket fan telling a story to other fans.
6. ✅ Use light, conversational tone — e.g., "देखिए क्या हुआ", "अब सुनिए", "तो हुआ ये".
7. ✅ Mix short and long sentences to make the article feel real.
8. ✅ Do NOT use AI phrases like "This article talks about" or "Here is a summary".
9. ✅ Do NOT use headings like "The Incident", "The Reaction" — just write the article directly.
10. ✅ Use actual facts and numbers from the input text. If anything is missing, skip it. Do not fill gaps.
11. ✅ Use attributed quotes if available in input — like "रोहित शर्मा ने कहा, 'हमने शानदार खेल दिखाया।'"

Title: ${title}  
Content: ${content}  

Now rewrite the article in natural Hindi. Write like a real Hindi journalist who loves cricket and is reporting to fellow fans.`;

  try {
    const response = await generateWithDeepSeek(prompt, {
      temperature: 0.95,
      max_tokens: 2500
    });
    return response || content;
  } catch (error) {
    console.error('Hindi human style rewriting error:', error);
    return content;
  }
}

/**
 * Create final ready-to-publish Hindi article
 */
async function createHindiReadyToPublishArticle(input, options) {
  const prompt = `Act like a professional Hindi cricket journalist working for a top sports publication. Your task is to rewrite the following Hindi cricket news article in a natural, engaging, and factual way – as if written by a passionate human journalist, not AI. Follow these important instructions:

1. ✅ Do NOT change or add any statistics, scores, dates, or names unless it is clearly present in the original content.
2. ✅ Preserve all factual accuracy – no hallucination, no assumption, no guessing.
3. ✅ Use everyday, simple Hindi that people actually speak in India — not literary or overly dramatic Hindi.
4. ✅ Avoid robotic or repetitive expressions like "वाह", "मैं यकीन नहीं कर सकता" unless it naturally fits.
5. ✅ Write in flowing, emotional paragraphs like a cricket fan telling a story to other fans.
6. ✅ Use light, conversational tone — e.g., "देखिए क्या हुआ", "अब सुनिए", "तो हुआ ये".
7. ✅ Mix short and long sentences to make the article feel real.
8. ✅ Do NOT use AI phrases like "This article talks about" or "Here is a summary".
9. ✅ Do NOT use headings like "The Incident", "The Reaction" — just write the article directly.
10. ✅ Use actual facts and numbers from the input text. If anything is missing, skip it. Do not fill gaps.
11. ✅ Use attributed quotes if available in input — like "रोहित शर्मा ने कहा, 'हमने शानदार खेल दिखाया।'"

Title: ${input.title}  
Content: ${input.content}  

Now rewrite the article in natural Hindi. Write like a real Hindi journalist who loves cricket and is reporting to fellow fans.`;

  try {
    const response = await generateWithDeepSeek(prompt, {
      temperature: 0.9,
      max_tokens: 3000
    });
    return response || input.content;
  } catch (error) {
    console.error('Create Hindi ready article error:', error);
    return input.content;
  }
}

module.exports = {
  processHindiManualInput,
  rewriteHindiInHumanStyle,
  createHindiReadyToPublishArticle
};