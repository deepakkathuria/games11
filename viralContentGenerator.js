// // const axios = require('axios');

// // const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
// // const DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1/chat/completions";

// // /**
// //  * Generate content using DeepSeek API
// //  */
// // async function generateWithDeepSeek(prompt, options = {}) {
// //   try {
// //     const response = await axios.post(DEEPSEEK_BASE_URL, {
// //       model: "deepseek-chat",
// //       messages: [
// //         {
// //           role: "user",
// //           content: prompt
// //         }
// //       ],
// //       temperature: options.temperature || 0.7,
// //       max_tokens: options.max_tokens || 2000
// //     }, {
// //       headers: {
// //         'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
// //         'Content-Type': 'application/json'
// //       },
// //       timeout: 60000
// //     });

// //     return response.data.choices[0].message.content;
// //   } catch (error) {
// //     console.error('DeepSeek API error:', error);
// //     throw error;
// //   }
// // }

// // /**
// //  * Analyze news article for viral potential
// //  */
// // async function analyzeNewsForViralContent(newsArticle) {
// //   const prompt = `Analyze this cricket news article and extract key elements for viral social media content:

// // Title: ${newsArticle.title}
// // Description: ${newsArticle.description}
// // Content: ${newsArticle.content}

// // Extract and return in JSON format:
// // {
// //   "keyFacts": ["fact1", "fact2", "fact3"],
// //   "emotionalTriggers": ["pride", "controversy", "inspiration", "curiosity"],
// //   "viralAngles": ["angle1", "angle2", "angle3"],
// //   "targetAudience": ["cricket fans", "women's rights", "health awareness"],
// //   "controversyPotential": "high/medium/low",
// //   "inspirationLevel": "high/medium/low",
// //   "curiosityHooks": ["hook1", "hook2", "hook3"],
// //   "statistics": ["stat1", "stat2", "stat3"],
// //   "quotes": ["quote1", "quote2"],
// //   "visualElements": ["element1", "element2", "element3"]
// // }

// // Focus on elements that can trigger strong emotional reactions, debates, shares, and engagement.`;

// //   try {
// //     const response = await generateWithDeepSeek(prompt, {
// //       temperature: 0.3,
// //       max_tokens: 1500
// //     });
    
// //     // Try to parse JSON response
// //     try {
// //       return JSON.parse(response);
// //     } catch (e) {
// //       // If not valid JSON, return structured data
// //       return {
// //         keyFacts: [newsArticle.title],
// //         emotionalTriggers: ["pride", "inspiration"],
// //         viralAngles: ["historic moment", "women's cricket"],
// //         targetAudience: ["cricket fans", "women's rights"],
// //         controversyPotential: "medium",
// //         inspirationLevel: "high",
// //         curiosityHooks: ["Why pink jerseys?", "What's the significance?"],
// //         statistics: ["First time in history"],
// //         quotes: [newsArticle.description],
// //         visualElements: ["pink jerseys", "cricket field", "team celebration"]
// //       };
// //     }
// //   } catch (error) {
// //     console.error('News analysis error:', error);
// //     return {
// //       keyFacts: [newsArticle.title],
// //       emotionalTriggers: ["pride", "inspiration"],
// //       viralAngles: ["historic moment"],
// //       targetAudience: ["cricket fans"],
// //       controversyPotential: "medium",
// //       inspirationLevel: "high",
// //       curiosityHooks: ["Why this change?"],
// //       statistics: ["Historic moment"],
// //       quotes: [newsArticle.description],
// //       visualElements: ["cricket", "team"]
// //     };
// //   }
// // }

// // /**
// //  * Generate Instagram viral content ideas
// //  */
// // async function generateInstagramContent(analysis, newsArticle) {
// //   const prompt = `Create 3 viral Instagram content ideas based on this cricket news analysis:

// // News: ${newsArticle.title}
// // Analysis: ${JSON.stringify(analysis)}

// // Create 3 different Instagram content ideas:

// // 1. REEL IDEA:
// // - Hook (first 3 seconds)
// // - Storyline/Structure
// // - Call-to-Action
// // - Hashtags (10-15 relevant)
// // - Best time to post
// // - Visual elements needed

// // 2. CAROUSEL IDEA:
// // - Slide 1 title
// // - Slide 2-5 content
// // - Caption structure
// // - Hashtags
// // - Best time to post

// // 3. STORY IDEA:
// // - Story slides structure
// // - Polls/Quizzes to include
// // - Swipe-up action
// // - Hashtags
// // - Best time to post

// // Format each idea clearly with sections. Make them emotionally engaging and designed to go viral.`;

// //   try {
// //     const response = await generateWithDeepSeek(prompt, {
// //       temperature: 0.8,
// //       max_tokens: 2000
// //     });
// //     return response;
// //   } catch (error) {
// //     console.error('Instagram content generation error:', error);
// //     return "Error generating Instagram content";
// //   }
// // }

// // /**
// //  * Generate Facebook viral content ideas
// //  */
// // async function generateFacebookContent(analysis, newsArticle) {
// //   const prompt = `Create 3 viral Facebook content ideas based on this cricket news analysis:

// // News: ${newsArticle.title}
// // Analysis: ${JSON.stringify(analysis)}

// // Create 3 different Facebook content ideas:

// // 1. VIDEO POST:
// // - Hook/Narrative
// // - Visual elements
// // - Caption structure
// // - Call-to-Action
// // - Best time to post
// // - Engagement tactics

// // 2. TEXT + IMAGE DEBATE POST:
// // - Question-style hook
// // - Emotional angle
// // - Image suggestions
// // - Caption
// // - Call-to-Action
// // - Best time to post

// // 3. AWARENESS CAMPAIGN POST:
// // - Story structure
// // - Images needed
// // - Emotional story caption
// // - Call-to-Action
// // - Best time to post
// // - Sharing incentives

// // Format each idea clearly. Make them designed to spark discussions and shares.`;

// //   try {
// //     const response = await generateWithDeepSeek(prompt, {
// //       temperature: 0.8,
// //       max_tokens: 2000
// //     });
// //     return response;
// //   } catch (error) {
// //     console.error('Facebook content generation error:', error);
// //     return "Error generating Facebook content";
// //   }
// // }

// // /**
// //  * Generate X/Twitter viral content ideas
// //  */
// // async function generateTwitterContent(analysis, newsArticle) {
// //   const prompt = `Create 3 viral X/Twitter content ideas based on this cricket news analysis:

// // News: ${newsArticle.title}
// // Analysis: ${JSON.stringify(analysis)}

// // Create 3 different X/Twitter content ideas:

// // 1. THREAD (5 tweets):
// // - Tweet 1: Hook
// // - Tweet 2-4: Facts/Story
// // - Tweet 5: Call-to-Action
// // - Hashtags for each tweet
// // - Best time to post

// // 2. POLL/OPINION POST:
// // - Opinion-driven question
// // - Poll options
// // - Follow-up tweet
// // - Hashtags
// // - Best time to post

// // 3. VISUAL + OPINION:
// // - Bold take/opinion
// // - Image suggestions
// // - Caption
// // - Call-to-Action
// // - Hashtags
// // - Best time to post

// // Format each idea clearly. Make them controversial and engaging.`;

// //   try {
// //     const response = await generateWithDeepSeek(prompt, {
// //       temperature: 0.8,
// //       max_tokens: 2000
// //     });
// //     return response;
// //   } catch (error) {
// //     console.error('Twitter content generation error:', error);
// //     return "Error generating Twitter content";
// //   }
// // }

// // /**
// //  * Generate YouTube viral content ideas
// //  */
// // async function generateYouTubeContent(analysis, newsArticle) {
// //   const prompt = `Create 3 viral YouTube content ideas based on this cricket news analysis:

// // News: ${newsArticle.title}
// // Analysis: ${JSON.stringify(analysis)}

// // Create 3 different YouTube content ideas:

// // 1. SHORTS IDEA:
// // - Hook (first 3 seconds)
// // - Structure/Flow
// // - Visual elements
// // - Call-to-Action
// // - Thumbnail suggestions
// // - Best time to post

// // 2. LONG-FORM IDEA:
// // - Title
// // - Script structure
// // - Retention tactics
// // - Visual elements
// // - Call-to-Action
// // - Thumbnail strategy
// // - Best time to post

// // 3. REACTION/OPINION IDEA:
// // - Debate/Story format
// // - Engagement tactics
// // - Visual elements
// // - Call-to-Action
// // - Thumbnail strategy
// // - Best time to post

// // Format each idea clearly. Make them designed for high retention and engagement.`;

// //   try {
// //     const response = await generateWithDeepSeek(prompt, {
// //       temperature: 0.8,
// //       max_tokens: 2000
// //     });
// //     return response;
// //   } catch (error) {
// //     console.error('YouTube content generation error:', error);
// //     return "Error generating YouTube content";
// //   }
// // }

// // /**
// //  * Main function to generate all viral content
// //  */
// // async function generateViralContent(newsArticle) {
// //   const startTime = Date.now();
  
// //   try {
// //     console.log(`🚀 Generating viral content for: ${newsArticle.title}`);
    
// //     // Step 1: Analyze news for viral potential
// //     const analysis = await analyzeNewsForViralContent(newsArticle);
// //     console.log('✅ News analysis completed');
    
// //     // Step 2: Generate content for all platforms
// //     const [instagramContent, facebookContent, twitterContent, youtubeContent] = await Promise.all([
// //       generateInstagramContent(analysis, newsArticle),
// //       generateFacebookContent(analysis, newsArticle),
// //       generateTwitterContent(analysis, newsArticle),
// //       generateYouTubeContent(analysis, newsArticle)
// //     ]);
    
// //     console.log('✅ All platform content generated');
    
// //     return {
// //       success: true,
// //       analysis,
// //       content: {
// //         instagram: instagramContent,
// //         facebook: facebookContent,
// //         twitter: twitterContent,
// //         youtube: youtubeContent
// //       },
// //       processingTime: Date.now() - startTime
// //     };
    
// //   } catch (error) {
// //     console.error('Viral content generation error:', error);
// //     return {
// //       success: false,
// //       error: error.message,
// //       processingTime: Date.now() - startTime
// //     };
// //   }
// // }

// // module.exports = {
// //   generateViralContent,
// //   analyzeNewsForViralContent,
// //   generateInstagramContent,
// //   generateFacebookContent,
// //   generateTwitterContent,
// //   generateYouTubeContent
// // };


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
//  * Analyze news article for viral potential
//  */
// async function analyzeNewsForViralContent(newsArticle) {
//   const prompt = `Analyze this cricket news article and extract key elements for viral social media content:

// Title: ${newsArticle.title}
// Description: ${newsArticle.description}
// Content: ${newsArticle.content}

// Extract and return in JSON format:
// {
//   "keyFacts": ["fact1", "fact2", "fact3"],
//   "emotionalTriggers": ["pride", "controversy", "inspiration", "curiosity"],
//   "viralAngles": ["angle1", "angle2", "angle3"],
//   "targetAudience": ["cricket fans", "women's rights", "health awareness"],
//   "controversyPotential": "high/medium/low",
//   "inspirationLevel": "high/medium/low",
//   "curiosityHooks": ["hook1", "hook2", "hook3"],
//   "statistics": ["stat1", "stat2", "stat3"],
//   "quotes": ["quote1", "quote2"],
//   "visualElements": ["element1", "element2", "element3"]
// }

// Focus on elements that can trigger strong emotional reactions, debates, shares, and engagement.`;

//   try {
//     const response = await generateWithDeepSeek(prompt, {
//       temperature: 0.3,
//       max_tokens: 1500
//     });
    
//     // Try to parse JSON response
//     try {
//       return JSON.parse(response);
//     } catch (e) {
//       // If not valid JSON, return structured data
//       return {
//         keyFacts: [newsArticle.title],
//         emotionalTriggers: ["pride", "inspiration"],
//         viralAngles: ["historic moment", "women's cricket"],
//         targetAudience: ["cricket fans", "women's rights"],
//         controversyPotential: "medium",
//         inspirationLevel: "high",
//         curiosityHooks: ["Why pink jerseys?", "What's the significance?"],
//         statistics: ["First time in history"],
//         quotes: [newsArticle.description],
//         visualElements: ["pink jerseys", "cricket field", "team celebration"]
//       };
//     }
//   } catch (error) {
//     console.error('News analysis error:', error);
//     return {
//       keyFacts: [newsArticle.title],
//       emotionalTriggers: ["pride", "inspiration"],
//       viralAngles: ["historic moment"],
//       targetAudience: ["cricket fans"],
//       controversyPotential: "medium",
//       inspirationLevel: "high",
//       curiosityHooks: ["Why this change?"],
//       statistics: ["Historic moment"],
//       quotes: [newsArticle.description],
//       visualElements: ["cricket", "team"]
//     };
//   }
// }

// /**
//  * Generate Instagram viral content ideas
//  */
// async function generateInstagramContent(analysis, newsArticle) {
//   const prompt = `Create 3 DIFFERENT viral Instagram content ideas based on this cricket news analysis. Each idea should be COMPLETELY UNIQUE with different angles, hooks, and approaches.

// News: ${newsArticle.title}
// Analysis: ${JSON.stringify(analysis)}

// Create 3 SEPARATE Instagram content ideas:

// **POST 1 - REEL IDEA:**
// - Hook (first 3 seconds): [Unique hook for this post]
// - Storyline/Structure: [Specific structure for this post]
// - Call-to-Action: [Specific CTA for this post]
// - Hashtags: [10-15 relevant hashtags - NO STAR SYMBOLS]
// - Best time to post: [Specific timing]
// - Visual elements needed: [Specific visuals for this post]

// **POST 2 - CAROUSEL IDEA:**
// - Slide 1 title: [Unique title for this post]
// - Slide 2-5 content: [Specific content for each slide]
// - Caption structure: [Specific caption approach]
// - Hashtags: [10-15 relevant hashtags - NO STAR SYMBOLS]
// - Best time to post: [Specific timing]
// - Visual elements needed: [Specific visuals for this post]

// **POST 3 - STORY IDEA:**
// - Story slides structure: [Specific structure for this post]
// - Polls/Quizzes to include: [Specific interactive elements]
// - Swipe-up action: [Specific action for this post]
// - Hashtags: [10-15 relevant hashtags - NO STAR SYMBOLS]
// - Best time to post: [Specific timing]
// - Visual elements needed: [Specific visuals for this post]

// IMPORTANT: Each post must have DIFFERENT angles, hooks, and approaches. NO repetitive content. NO star symbols in hashtags.`;

//   try {
//     const response = await generateWithDeepSeek(prompt, {
//       temperature: 0.8,
//       max_tokens: 2000
//     });
//     return response;
//   } catch (error) {
//     console.error('Instagram content generation error:', error);
//     return "Error generating Instagram content";
//   }
// }

// /**
//  * Generate Facebook viral content ideas
//  */
// async function generateFacebookContent(analysis, newsArticle) {
//   const prompt = `Create 3 DIFFERENT viral Facebook content ideas based on this cricket news analysis. Each idea should be COMPLETELY UNIQUE with different angles, hooks, and approaches.

// News: ${newsArticle.title}
// Analysis: ${JSON.stringify(analysis)}

// Create 3 SEPARATE Facebook content ideas:

// **POST 1 - VIDEO POST:**
// - Hook/Narrative: [Unique hook for this post]
// - Visual elements: [Specific visuals for this post]
// - Caption structure: [Specific caption approach]
// - Call-to-Action: [Specific CTA for this post]
// - Best time to post: [Specific timing]
// - Engagement tactics: [Specific tactics for this post]

// **POST 2 - TEXT + IMAGE DEBATE POST:**
// - Question-style hook: [Unique question for this post]
// - Emotional angle: [Specific emotional approach]
// - Image suggestions: [Specific images for this post]
// - Caption: [Specific caption content]
// - Call-to-Action: [Specific CTA for this post]
// - Best time to post: [Specific timing]

// **POST 3 - AWARENESS CAMPAIGN POST:**
// - Story structure: [Specific story approach for this post]
// - Images needed: [Specific images for this post]
// - Emotional story caption: [Specific emotional content]
// - Call-to-Action: [Specific CTA for this post]
// - Best time to post: [Specific timing]
// - Sharing incentives: [Specific incentives for this post]

// IMPORTANT: Each post must have DIFFERENT angles, hooks, and approaches. NO repetitive content. NO star symbols in hashtags.`;

//   try {
//     const response = await generateWithDeepSeek(prompt, {
//       temperature: 0.8,
//       max_tokens: 2000
//     });
//     return response;
//   } catch (error) {
//     console.error('Facebook content generation error:', error);
//     return "Error generating Facebook content";
//   }
// }

// /**
//  * Generate X/Twitter viral content ideas
//  */
// async function generateTwitterContent(analysis, newsArticle) {
//   const prompt = `Create 3 DIFFERENT viral X/Twitter content ideas based on this cricket news analysis. Each idea should be COMPLETELY UNIQUE with different angles, hooks, and approaches.

// News: ${newsArticle.title}
// Analysis: ${JSON.stringify(analysis)}

// Create 3 SEPARATE X/Twitter content ideas:

// **POST 1 - THREAD (5 tweets):**
// - Tweet 1: Hook: [Unique hook for this post]
// - Tweet 2-4: Facts/Story: [Specific facts for this post]
// - Tweet 5: Call-to-Action: [Specific CTA for this post]
// - Hashtags: [Relevant hashtags for each tweet - NO STAR SYMBOLS]
// - Best time to post: [Specific timing]

// **POST 2 - POLL/OPINION POST:**
// - Opinion-driven question: [Unique question for this post]
// - Poll options: [Specific poll options for this post]
// - Follow-up tweet: [Specific follow-up content]
// - Hashtags: [Relevant hashtags - NO STAR SYMBOLS]
// - Best time to post: [Specific timing]

// **POST 3 - VISUAL + OPINION:**
// - Bold take/opinion: [Unique opinion for this post]
// - Image suggestions: [Specific images for this post]
// - Caption: [Specific caption content]
// - Call-to-Action: [Specific CTA for this post]
// - Hashtags: [Relevant hashtags - NO STAR SYMBOLS]
// - Best time to post: [Specific timing]

// IMPORTANT: Each post must have DIFFERENT angles, hooks, and approaches. NO repetitive content. NO star symbols in hashtags.`;

//   try {
//     const response = await generateWithDeepSeek(prompt, {
//       temperature: 0.8,
//       max_tokens: 2000
//     });
//     return response;
//   } catch (error) {
//     console.error('Twitter content generation error:', error);
//     return "Error generating Twitter content";
//   }
// }

// /**
//  * Generate YouTube viral content ideas
//  */
// async function generateYouTubeContent(analysis, newsArticle) {
//   const prompt = `Create 3 DIFFERENT viral YouTube content ideas based on this cricket news analysis. Each idea should be COMPLETELY UNIQUE with different angles, hooks, and approaches.

// News: ${newsArticle.title}
// Analysis: ${JSON.stringify(analysis)}

// Create 3 SEPARATE YouTube content ideas:

// **POST 1 - SHORTS IDEA:**
// - Hook (first 3 seconds): [Unique hook for this post]
// - Structure/Flow: [Specific structure for this post]
// - Visual elements: [Specific visuals for this post]
// - Call-to-Action: [Specific CTA for this post]
// - Thumbnail suggestions: [Specific thumbnails for this post]
// - Best time to post: [Specific timing]

// **POST 2 - LONG-FORM IDEA:**
// - Title: [Unique title for this post]
// - Script structure: [Specific script approach for this post]
// - Retention tactics: [Specific tactics for this post]
// - Visual elements: [Specific visuals for this post]
// - Call-to-Action: [Specific CTA for this post]
// - Thumbnail strategy: [Specific strategy for this post]
// - Best time to post: [Specific timing]

// **POST 3 - REACTION/OPINION IDEA:**
// - Debate/Story format: [Specific format for this post]
// - Engagement tactics: [Specific tactics for this post]
// - Visual elements: [Specific visuals for this post]
// - Call-to-Action: [Specific CTA for this post]
// - Thumbnail strategy: [Specific strategy for this post]
// - Best time to post: [Specific timing]

// IMPORTANT: Each post must have DIFFERENT angles, hooks, and approaches. NO repetitive content. NO star symbols in hashtags.`;

//   try {
//     const response = await generateWithDeepSeek(prompt, {
//       temperature: 0.8,
//       max_tokens: 2000
//     });
//     return response;
//   } catch (error) {
//     console.error('YouTube content generation error:', error);
//     return "Error generating YouTube content";
//   }
// }

// /**
//  * Main function to generate all viral content
//  */
// async function generateViralContent(newsArticle) {
//   const startTime = Date.now();
  
//   try {
//     console.log(`🚀 Generating viral content for: ${newsArticle.title}`);
    
//     // Step 1: Analyze news for viral potential
//     const analysis = await analyzeNewsForViralContent(newsArticle);
//     console.log('✅ News analysis completed');
    
//     // Step 2: Generate content for all platforms
//     const [instagramContent, facebookContent, twitterContent, youtubeContent] = await Promise.all([
//       generateInstagramContent(analysis, newsArticle),
//       generateFacebookContent(analysis, newsArticle),
//       generateTwitterContent(analysis, newsArticle),
//       generateYouTubeContent(analysis, newsArticle)
//     ]);
    
//     console.log('✅ All platform content generated');
    
//     return {
//       success: true,
//       analysis,
//       content: {
//         instagram: instagramContent,
//         facebook: facebookContent,
//         twitter: twitterContent,
//         youtube: youtubeContent
//       },
//       processingTime: Date.now() - startTime
//     };
    
//   } catch (error) {
//     console.error('Viral content generation error:', error);
//     return {
//       success: false,
//       error: error.message,
//       processingTime: Date.now() - startTime
//     };
//   }
// }

// module.exports = {
//   generateViralContent,
//   analyzeNewsForViralContent,
//   generateInstagramContent,
//   generateFacebookContent,
//   generateTwitterContent,
//   generateYouTubeContent
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
 * Analyze news article for viral potential
 */
async function analyzeNewsForViralContent(newsArticle) {
  const prompt = `Analyze this cricket news article and extract key elements for viral social media content:

Title: ${newsArticle.title}
Description: ${newsArticle.description}
Content: ${newsArticle.content}

Extract and return in JSON format:
{
  "keyFacts": ["fact1", "fact2", "fact3"],
  "emotionalTriggers": ["pride", "controversy", "inspiration", "curiosity"],
  "viralAngles": ["angle1", "angle2", "angle3"],
  "targetAudience": ["cricket fans", "women's rights", "health awareness"],
  "controversyPotential": "high/medium/low",
  "inspirationLevel": "high/medium/low",
  "curiosityHooks": ["hook1", "hook2", "hook3"],
  "statistics": ["stat1", "stat2", "stat3"],
  "quotes": ["quote1", "quote2"],
  "visualElements": ["element1", "element2", "element3"]
}

Focus on elements that can trigger strong emotional reactions, debates, shares, and engagement.`;

  try {
    const response = await generateWithDeepSeek(prompt, {
      temperature: 0.3,
      max_tokens: 1500
    });
    
    // Try to parse JSON response
    try {
      return JSON.parse(response);
    } catch (e) {
      // If not valid JSON, return structured data
      return {
        keyFacts: [newsArticle.title],
        emotionalTriggers: ["pride", "inspiration"],
        viralAngles: ["historic moment", "women's cricket"],
        targetAudience: ["cricket fans", "women's rights"],
        controversyPotential: "medium",
        inspirationLevel: "high",
        curiosityHooks: ["Why pink jerseys?", "What's the significance?"],
        statistics: ["First time in history"],
        quotes: [newsArticle.description],
        visualElements: ["pink jerseys", "cricket field", "team celebration"]
      };
    }
  } catch (error) {
    console.error('News analysis error:', error);
    return {
      keyFacts: [newsArticle.title],
      emotionalTriggers: ["pride", "inspiration"],
      viralAngles: ["historic moment"],
      targetAudience: ["cricket fans"],
      controversyPotential: "medium",
      inspirationLevel: "high",
      curiosityHooks: ["Why this change?"],
      statistics: ["Historic moment"],
      quotes: [newsArticle.description],
      visualElements: ["cricket", "team"]
    };
  }
}

/**
 * Generate Instagram viral content ideas
 */
async function generateInstagramContent(analysis, newsArticle) {
  const prompt = `Create 3 DIFFERENT viral Instagram content ideas based on this cricket news analysis. Each idea should be COMPLETELY UNIQUE with different angles, hooks, and approaches.

News: ${newsArticle.title}
Analysis: ${JSON.stringify(analysis)}

Create 3 SEPARATE Instagram content ideas:

POST 1 - REEL IDEA:
Hook (first 3 seconds): [Unique hook for this post]
Storyline/Structure: [Specific structure for this post]
Call-to-Action: [Specific CTA for this post]
Hashtags: [10-15 relevant hashtags - NO STAR SYMBOLS]
Best time to post: [Specific timing]
Visual elements needed: [Specific visuals for this post]

POST 2 - CAROUSEL IDEA:
Slide 1 title: [Unique title for this post]
Slide 2-5 content: [Specific content for each slide]
Caption structure: [Specific caption approach]
Hashtags: [10-15 relevant hashtags - NO STAR SYMBOLS]
Best time to post: [Specific timing]
Visual elements needed: [Specific visuals for this post]

POST 3 - STORY IDEA:
Story slides structure: [Specific structure for this post]
Polls/Quizzes to include: [Specific interactive elements]
Swipe-up action: [Specific action for this post]
Hashtags: [10-15 relevant hashtags - NO STAR SYMBOLS]
Best time to post: [Specific timing]
Visual elements needed: [Specific visuals for this post]

IMPORTANT: Each post must have DIFFERENT angles, hooks, and approaches. NO repetitive content. NO star symbols in hashtags. NO extra formatting like asterisks or dashes.`;

  try {
    const response = await generateWithDeepSeek(prompt, {
      temperature: 0.8,
      max_tokens: 2000
    });
    return response;
  } catch (error) {
    console.error('Instagram content generation error:', error);
    return "Error generating Instagram content";
  }
}

/**
 * Generate Facebook viral content ideas
 */
async function generateFacebookContent(analysis, newsArticle) {
  const prompt = `Create 3 DIFFERENT viral Facebook content ideas based on this cricket news analysis. Each idea should be COMPLETELY UNIQUE with different angles, hooks, and approaches.

News: ${newsArticle.title}
Analysis: ${JSON.stringify(analysis)}

Create 3 SEPARATE Facebook content ideas:

POST 1 - VIDEO POST:
Hook/Narrative: [Unique hook for this post]
Visual elements: [Specific visuals for this post]
Caption structure: [Specific caption approach]
Call-to-Action: [Specific CTA for this post]
Best time to post: [Specific timing]
Engagement tactics: [Specific tactics for this post]

POST 2 - TEXT + IMAGE DEBATE POST:
Question-style hook: [Unique question for this post]
Emotional angle: [Specific emotional approach]
Image suggestions: [Specific images for this post]
Caption: [Specific caption content]
Call-to-Action: [Specific CTA for this post]
Best time to post: [Specific timing]

POST 3 - AWARENESS CAMPAIGN POST:
Story structure: [Specific story approach for this post]
Images needed: [Specific images for this post]
Emotional story caption: [Specific emotional content]
Call-to-Action: [Specific CTA for this post]
Best time to post: [Specific timing]
Sharing incentives: [Specific incentives for this post]

IMPORTANT: Each post must have DIFFERENT angles, hooks, and approaches. NO repetitive content. NO star symbols in hashtags. NO extra formatting like asterisks or dashes.`;

  try {
    const response = await generateWithDeepSeek(prompt, {
      temperature: 0.8,
      max_tokens: 2000
    });
    return response;
  } catch (error) {
    console.error('Facebook content generation error:', error);
    return "Error generating Facebook content";
  }
}

/**
 * Generate X/Twitter viral content ideas
 */
async function generateTwitterContent(analysis, newsArticle) {
  const prompt = `Create 3 DIFFERENT viral X/Twitter content ideas based on this cricket news analysis. Each idea should be COMPLETELY UNIQUE with different angles, hooks, and approaches.

News: ${newsArticle.title}
Analysis: ${JSON.stringify(analysis)}

Create 3 SEPARATE X/Twitter content ideas:

POST 1 - THREAD (5 tweets):
Tweet 1: Hook: [Unique hook for this post]
Tweet 2-4: Facts/Story: [Specific facts for this post]
Tweet 5: Call-to-Action: [Specific CTA for this post]
Hashtags: [Relevant hashtags for each tweet - NO STAR SYMBOLS]
Best time to post: [Specific timing]

POST 2 - POLL/OPINION POST:
Opinion-driven question: [Unique question for this post]
Poll options: [Specific poll options for this post]
Follow-up tweet: [Specific follow-up content]
Hashtags: [Relevant hashtags - NO STAR SYMBOLS]
Best time to post: [Specific timing]

POST 3 - VISUAL + OPINION:
Bold take/opinion: [Unique opinion for this post]
Image suggestions: [Specific images for this post]
Caption: [Specific caption content]
Call-to-Action: [Specific CTA for this post]
Hashtags: [Relevant hashtags - NO STAR SYMBOLS]
Best time to post: [Specific timing]

IMPORTANT: Each post must have DIFFERENT angles, hooks, and approaches. NO repetitive content. NO star symbols in hashtags. NO extra formatting like asterisks or dashes.`;

  try {
    const response = await generateWithDeepSeek(prompt, {
      temperature: 0.8,
      max_tokens: 2000
    });
    return response;
  } catch (error) {
    console.error('Twitter content generation error:', error);
    return "Error generating Twitter content";
  }
}

/**
 * Generate YouTube viral content ideas
 */
async function generateYouTubeContent(analysis, newsArticle) {
  const prompt = `Create 3 DIFFERENT viral YouTube content ideas based on this cricket news analysis. Each idea should be COMPLETELY UNIQUE with different angles, hooks, and approaches.

News: ${newsArticle.title}
Analysis: ${JSON.stringify(analysis)}

Create 3 SEPARATE YouTube content ideas:

POST 1 - SHORTS IDEA:
Hook (first 3 seconds): [Unique hook for this post]
Structure/Flow: [Specific structure for this post]
Visual elements: [Specific visuals for this post]
Call-to-Action: [Specific CTA for this post]
Thumbnail suggestions: [Specific thumbnails for this post]
Best time to post: [Specific timing]

POST 2 - LONG-FORM IDEA:
Title: [Unique title for this post]
Script structure: [Specific script approach for this post]
Retention tactics: [Specific tactics for this post]
Visual elements: [Specific visuals for this post]
Call-to-Action: [Specific CTA for this post]
Thumbnail strategy: [Specific strategy for this post]
Best time to post: [Specific timing]

POST 3 - REACTION/OPINION IDEA:
Debate/Story format: [Specific format for this post]
Engagement tactics: [Specific tactics for this post]
Visual elements: [Specific visuals for this post]
Call-to-Action: [Specific CTA for this post]
Thumbnail strategy: [Specific strategy for this post]
Best time to post: [Specific timing]

IMPORTANT: Each post must have DIFFERENT angles, hooks, and approaches. NO repetitive content. NO star symbols in hashtags. NO extra formatting like asterisks or dashes.`;

  try {
    const response = await generateWithDeepSeek(prompt, {
      temperature: 0.8,
      max_tokens: 2000
    });
    return response;
  } catch (error) {
    console.error('YouTube content generation error:', error);
    return "Error generating YouTube content";
  }
}

/**
 * Main function to generate all viral content
 */
async function generateViralContent(newsArticle) {
  const startTime = Date.now();
  
  try {
    console.log(`🚀 Generating viral content for: ${newsArticle.title}`);
    
    // Step 1: Analyze news for viral potential
    const analysis = await analyzeNewsForViralContent(newsArticle);
    console.log('✅ News analysis completed');
    
    // Step 2: Generate content for all platforms
    const [instagramContent, facebookContent, twitterContent, youtubeContent] = await Promise.all([
      generateInstagramContent(analysis, newsArticle),
      generateFacebookContent(analysis, newsArticle),
      generateTwitterContent(analysis, newsArticle),
      generateYouTubeContent(analysis, newsArticle)
    ]);
    
    console.log('✅ All platform content generated');
    
    return {
      success: true,
      analysis,
      content: {
        instagram: instagramContent,
        facebook: facebookContent,
        twitter: twitterContent,
        youtube: youtubeContent
      },
      processingTime: Date.now() - startTime
    };
    
  } catch (error) {
    console.error('Viral content generation error:', error);
    return {
      success: false,
      error: error.message,
      processingTime: Date.now() - startTime
    };
  }
}

module.exports = {
  generateViralContent,
  analyzeNewsForViralContent,
  generateInstagramContent,
  generateFacebookContent,
  generateTwitterContent,
  generateYouTubeContent
};