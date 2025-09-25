const axios = require('axios');

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1/chat/completions";

/**
 * Generate content using DeepSeek API with improved error handling
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
      temperature: options.temperature || 0.8,
      max_tokens: options.max_tokens || 2500
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
 * Analyze news article for viral potential - IMPROVED VERSION
 */
async function analyzeNewsForViralContent(newsArticle) {
  const prompt = `You are a viral content strategist specializing in cricket and sports content. Analyze this news article and extract key viral elements:

TITLE: ${newsArticle.title}
DESCRIPTION: ${newsArticle.description}
CONTENT: ${newsArticle.content.substring(0, 2000)}...

Extract the following elements and return ONLY a valid JSON object:

{
  "keyFacts": ["fact1", "fact2", "fact3"],
  "emotionalTriggers": ["emotion1", "emotion2", "emotion3"],
  "viralAngles": ["angle1", "angle2", "angle3"],
  "targetAudience": ["audience1", "audience2", "audience3"],
  "controversyPotential": "high/medium/low",
  "inspirationLevel": "high/medium/low",
  "curiosityHooks": ["hook1", "hook2", "hook3"],
  "statistics": ["stat1", "stat2", "stat3"],
  "quotes": ["quote1", "quote2"],
  "visualElements": ["visual1", "visual2", "visual3"],
  "debatePoints": ["debate1", "debate2", "debate3"],
  "trendingKeywords": ["keyword1", "keyword2", "keyword3"]
}

Focus on elements from THIS SPECIFIC ARTICLE that can trigger strong emotional reactions, debates, shares, and engagement. Base everything on the actual content provided.`;

  try {
    const response = await generateWithDeepSeek(prompt, {
      temperature: 0.4,
      max_tokens: 1500
    });
    
    // Clean the response and try to parse JSON
    const cleanedResponse = response.trim().replace(/```json\n?|\n?```/g, '');
    
    try {
      const parsed = JSON.parse(cleanedResponse);
      console.log('✅ Successfully parsed analysis JSON');
      return parsed;
    } catch (parseError) {
      console.error('JSON parse error, generating fresh analysis...');
      // Generate a fresh analysis based on the actual article content
      return await generateFreshAnalysis(newsArticle);
    }
  } catch (error) {
    console.error('News analysis error:', error);
    return await generateFreshAnalysis(newsArticle);
  }
}

/**
 * Generate fresh analysis when JSON parsing fails
 */
async function generateFreshAnalysis(newsArticle) {
  const prompt = `Generate a fresh viral content analysis for this cricket news:

TITLE: ${newsArticle.title}
DESCRIPTION: ${newsArticle.description}
CONTENT: ${newsArticle.content.substring(0, 1000)}

Extract key facts, emotional triggers, and viral angles from THIS SPECIFIC ARTICLE. Return as JSON:

{
  "keyFacts": ["fact1", "fact2", "fact3"],
  "emotionalTriggers": ["emotion1", "emotion2"],
  "viralAngles": ["angle1", "angle2"],
  "targetAudience": ["cricket fans", "sports lovers"],
  "controversyPotential": "medium",
  "inspirationLevel": "high",
  "curiosityHooks": ["hook1", "hook2"],
  "statistics": ["stat1", "stat2"],
  "quotes": ["quote1"],
  "visualElements": ["visual1", "visual2"],
  "debatePoints": ["debate1", "debate2"],
  "trendingKeywords": ["keyword1", "keyword2"]
}`;

  try {
    const response = await generateWithDeepSeek(prompt, {
      temperature: 0.6,
      max_tokens: 1000
    });
    
    const cleanedResponse = response.trim().replace(/```json\n?|\n?```/g, '');
    return JSON.parse(cleanedResponse);
  } catch (error) {
    console.error('Fresh analysis generation failed:', error);
    // Return minimal analysis based on actual article content
    return {
      keyFacts: [newsArticle.title],
      emotionalTriggers: ["excitement", "pride"],
      viralAngles: ["breaking news", "cricket update"],
      targetAudience: ["cricket fans"],
      controversyPotential: "medium",
      inspirationLevel: "medium",
      curiosityHooks: ["What's the latest?"],
      statistics: ["Latest update"],
      quotes: [newsArticle.description],
      visualElements: ["cricket", "news"],
      debatePoints: ["Latest development"],
      trendingKeywords: ["cricket", "news"]
    };
  }
}

/**
 * Generate Instagram viral content ideas - IMPROVED VERSION
 */
async function generateInstagramContent(analysis, newsArticle) {
  const prompt = `Create 3 UNIQUE viral Instagram content ideas based on this cricket news analysis. Make each idea COMPLETELY DIFFERENT and specific to THIS ARTICLE.

NEWS: ${newsArticle.title}
DESCRIPTION: ${newsArticle.description}

ANALYSIS: ${JSON.stringify(analysis, null, 2)}

Create 3 SEPARATE Instagram content ideas:

POST 1 - REEL IDEA:
Hook (first 3 seconds): [Specific hook for THIS news]
Storyline/Structure: [Specific structure for THIS news]
Call-to-Action: [Specific CTA for THIS news]
Hashtags: [10-15 relevant hashtags for THIS news]
Best time to post: [Optimal timing]
Visual elements needed: [Specific visuals for THIS news]

POST 2 - CAROUSEL IDEA:
Slide 1 title: [Specific title for THIS news]
Slide 2-5 content: [Specific content for each slide about THIS news]
Caption structure: [Specific caption for THIS news]
Hashtags: [10-15 relevant hashtags for THIS news]
Best time to post: [Optimal timing]
Visual elements needed: [Specific visuals for THIS news]

POST 3 - STORY IDEA:
Story slides structure: [Specific structure for THIS news]
Polls/Quizzes to include: [Specific interactive elements for THIS news]
Swipe-up action: [Specific action for THIS news]
Hashtags: [10-15 relevant hashtags for THIS news]
Best time to post: [Optimal timing]
Visual elements needed: [Specific visuals for THIS news]

IMPORTANT: Base everything on THIS SPECIFIC NEWS ARTICLE. NO generic content. NO repetitive themes. Make each post unique and relevant to the actual news content.`;

  try {
    const response = await generateWithDeepSeek(prompt, {
      temperature: 0.9,
      max_tokens: 2500
    });
    return response;
  } catch (error) {
    console.error('Instagram content generation error:', error);
    return `Error generating Instagram content for: ${newsArticle.title}`;
  }
}

/**
 * Generate Facebook viral content ideas - IMPROVED VERSION
 */
async function generateFacebookContent(analysis, newsArticle) {
  const prompt = `Create 3 UNIQUE viral Facebook content ideas based on this cricket news analysis. Make each idea COMPLETELY DIFFERENT and specific to THIS ARTICLE.

NEWS: ${newsArticle.title}
DESCRIPTION: ${newsArticle.description}

ANALYSIS: ${JSON.stringify(analysis, null, 2)}

Create 3 SEPARATE Facebook content ideas:

POST 1 - VIDEO POST:
Hook/Narrative: [Specific hook for THIS news]
Visual elements: [Specific visuals for THIS news]
Caption structure: [Specific caption for THIS news]
Call-to-Action: [Specific CTA for THIS news]
Best time to post: [Optimal timing]
Engagement tactics: [Specific tactics for THIS news]

POST 2 - TEXT + IMAGE DEBATE POST:
Question-style hook: [Specific question for THIS news]
Emotional angle: [Specific emotional approach for THIS news]
Image suggestions: [Specific images for THIS news]
Caption: [Specific caption for THIS news]
Call-to-Action: [Specific CTA for THIS news]
Best time to post: [Optimal timing]

POST 3 - AWARENESS CAMPAIGN POST:
Story structure: [Specific story for THIS news]
Images needed: [Specific images for THIS news]
Emotional story caption: [Specific emotional content for THIS news]
Call-to-Action: [Specific CTA for THIS news]
Best time to post: [Optimal timing]
Sharing incentives: [Specific incentives for THIS news]

IMPORTANT: Base everything on THIS SPECIFIC NEWS ARTICLE. NO generic content. Make each post unique and relevant to the actual news content.`;

  try {
    const response = await generateWithDeepSeek(prompt, {
      temperature: 0.9,
      max_tokens: 2500
    });
    return response;
  } catch (error) {
    console.error('Facebook content generation error:', error);
    return `Error generating Facebook content for: ${newsArticle.title}`;
  }
}

/**
 * Generate X/Twitter viral content ideas - IMPROVED VERSION
 */
async function generateTwitterContent(analysis, newsArticle) {
  const prompt = `Create 3 UNIQUE viral X/Twitter content ideas based on this cricket news analysis. Make each idea COMPLETELY DIFFERENT and specific to THIS ARTICLE.

NEWS: ${newsArticle.title}
DESCRIPTION: ${newsArticle.description}

ANALYSIS: ${JSON.stringify(analysis, null, 2)}

Create 3 SEPARATE X/Twitter content ideas:

POST 1 - THREAD (5 tweets):
Tweet 1: Hook: [Specific hook for THIS news]
Tweet 2-4: Facts/Story: [Specific facts about THIS news]
Tweet 5: Call-to-Action: [Specific CTA for THIS news]
Hashtags: [Relevant hashtags for THIS news]
Best time to post: [Optimal timing]

POST 2 - POLL/OPINION POST:
Opinion-driven question: [Specific question about THIS news]
Poll options: [Specific poll options for THIS news]
Follow-up tweet: [Specific follow-up about THIS news]
Hashtags: [Relevant hashtags for THIS news]
Best time to post: [Optimal timing]

POST 3 - VISUAL + OPINION:
Bold take/opinion: [Specific opinion about THIS news]
Image suggestions: [Specific images for THIS news]
Caption: [Specific caption for THIS news]
Call-to-Action: [Specific CTA for THIS news]
Hashtags: [Relevant hashtags for THIS news]
Best time to post: [Optimal timing]

IMPORTANT: Base everything on THIS SPECIFIC NEWS ARTICLE. NO generic content. Make each post unique and relevant to the actual news content.`;

  try {
    const response = await generateWithDeepSeek(prompt, {
      temperature: 0.9,
      max_tokens: 2500
    });
    return response;
  } catch (error) {
    console.error('Twitter content generation error:', error);
    return `Error generating Twitter content for: ${newsArticle.title}`;
  }
}

/**
 * Generate YouTube viral content ideas - IMPROVED VERSION
 */
async function generateYouTubeContent(analysis, newsArticle) {
  const prompt = `Create 3 UNIQUE viral YouTube content ideas based on this cricket news analysis. Make each idea COMPLETELY DIFFERENT and specific to THIS ARTICLE.

NEWS: ${newsArticle.title}
DESCRIPTION: ${newsArticle.description}

ANALYSIS: ${JSON.stringify(analysis, null, 2)}

Create 3 SEPARATE YouTube content ideas:

POST 1 - SHORTS IDEA:
Hook (first 3 seconds): [Specific hook for THIS news]
Structure/Flow: [Specific structure for THIS news]
Visual elements: [Specific visuals for THIS news]
Call-to-Action: [Specific CTA for THIS news]
Thumbnail suggestions: [Specific thumbnails for THIS news]
Best time to post: [Optimal timing]

POST 2 - LONG-FORM IDEA:
Title: [Specific title for THIS news]
Script structure: [Specific script for THIS news]
Retention tactics: [Specific tactics for THIS news]
Visual elements: [Specific visuals for THIS news]
Call-to-Action: [Specific CTA for THIS news]
Thumbnail strategy: [Specific strategy for THIS news]
Best time to post: [Optimal timing]

POST 3 - REACTION/OPINION IDEA:
Debate/Story format: [Specific format for THIS news]
Engagement tactics: [Specific tactics for THIS news]
Visual elements: [Specific visuals for THIS news]
Call-to-Action: [Specific CTA for THIS news]
Thumbnail strategy: [Specific strategy for THIS news]
Best time to post: [Optimal timing]

IMPORTANT: Base everything on THIS SPECIFIC NEWS ARTICLE. NO generic content. Make each post unique and relevant to the actual news content.`;

  try {
    const response = await generateWithDeepSeek(prompt, {
      temperature: 0.9,
      max_tokens: 2500
    });
    return response;
  } catch (error) {
    console.error('YouTube content generation error:', error);
    return `Error generating YouTube content for: ${newsArticle.title}`;
  }
}

/**
 * Main function to generate all viral content - IMPROVED VERSION
 */
async function generateViralContent(newsArticle) {
  const startTime = Date.now();
  
  try {
    console.log(`🚀 Generating viral content for: ${newsArticle.title}`);
    console.log(`�� Article description: ${newsArticle.description.substring(0, 100)}...`);
    
    // Step 1: Analyze news for viral potential
    const analysis = await analyzeNewsForViralContent(newsArticle);
    console.log('✅ News analysis completed');
    console.log('�� Analysis keys:', Object.keys(analysis));
    
    // Step 2: Generate content for all platforms with error handling
    console.log('🎯 Generating platform content...');
    
    const [instagramContent, facebookContent, twitterContent, youtubeContent] = await Promise.all([
      generateInstagramContent(analysis, newsArticle).catch(err => {
        console.error('Instagram generation failed:', err);
        return `Instagram content generation failed for: ${newsArticle.title}`;
      }),
      generateFacebookContent(analysis, newsArticle).catch(err => {
        console.error('Facebook generation failed:', err);
        return `Facebook content generation failed for: ${newsArticle.title}`;
      }),
      generateTwitterContent(analysis, newsArticle).catch(err => {
        console.error('Twitter generation failed:', err);
        return `Twitter content generation failed for: ${newsArticle.title}`;
      }),
      generateYouTubeContent(analysis, newsArticle).catch(err => {
        console.error('YouTube generation failed:', err);
        return `YouTube content generation failed for: ${newsArticle.title}`;
      })
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
      processingTime: Date.now() - startTime,
      originalArticle: {
        title: newsArticle.title,
        description: newsArticle.description
      }
    };
    
  } catch (error) {
    console.error('Viral content generation error:', error);
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

module.exports = {
  generateViralContent,
  analyzeNewsForViralContent,
  generateInstagramContent,
  generateFacebookContent,
  generateTwitterContent,
  generateYouTubeContent
};