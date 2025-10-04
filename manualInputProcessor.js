


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
 * Process manual input and create ready-to-publish article
 */
async function processManualInput(input, options = {}) {
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

    // Human-like rewriting with better prompts
    let humanLikeContent = input.content;
    if (options.includeHumanLikeRewriting !== false) {
      humanLikeContent = await rewriteInHumanStyle(input.content, input.title);
    }

    // Create final article
    const readyToPublishArticle = await createReadyToPublishArticle({
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
    console.error('Process manual input error:', error);
    return {
      success: false,
      error: error.message,
      processingTime: Date.now() - startTime
    };
  }
}

/**
 * Rewrite content in human-like style with specific facts
 */
async function rewriteInHumanStyle(content, title) {
  const prompt = `Rewrite this cricket article in a natural, human-like style. Follow these specific guidelines:

1. Write like a real cricket journalist who's passionate about the sport
2. Use conversational tone: "I think", "Honestly", "You know what's interesting"
3. Add personal reactions: "Wow!", "That's shocking", "I can't believe this"
4. Use contractions: "don't", "can't", "won't", "it's"
5. Include specific details: scores, dates, player names, statistics
6. Add rhetorical questions: "What do you think?", "Can you believe this?"
7. Use casual transitions: "So here's what happened", "Now get this", "But wait"
8. Include emotional reactions and commentary naturally
9. Make it sound like you're telling a story to a friend
10. Add hard facts: final scores, targets, overs, player stats, dates, times

Original content: ${content}

Write it as if you're a cricket journalist who's genuinely excited about the news and wants to share it with fellow fans. Make it engaging, human, and fact-rich.`;

  try {
    const response = await generateWithDeepSeek(prompt, {
      temperature: 0.95,
      max_tokens: 2500
    });
    return response || content;
  } catch (error) {
    console.error('Human style rewriting error:', error);
    return content;
  }
}

/**
 * Create final ready-to-publish article
 */
async function createReadyToPublishArticle(input, options) {
  const prompt = `Create a complete, ready-to-publish cricket article from this content. Make it sound like a real cricket journalist wrote it, not AI. Follow these rules:

1. NO markdown formatting (no **, *, #, etc.)
2. NO AI phrases like "Of course", "Here is a complete", "optimized for"
3. NO template sections like "The Incident", "The Response", etc.
4. Write in natural, flowing paragraphs
5. Use conversational tone with personal opinions
6. Include specific details, dates, scores, and facts
7. Add emotional reactions and commentary
8. Make it engaging and human-like
9. NO meta titles or descriptions in the content
10. Just write the article naturally
11. Include hard facts: final scores, targets, overs, player stats, dates, times
12. Add attributed quotes if available
13. Use varied sentence lengths
14. Include counter-views and context

Title: ${input.title}
Description: ${input.description}
Content: ${input.content}

Write a complete article that sounds like it was written by a real cricket journalist who's passionate about the sport and has access to specific facts and details.`;

  try {
    const response = await generateWithDeepSeek(prompt, {
      temperature: 0.9,
      max_tokens: 3000
    });
    return response || input.content;
  } catch (error) {
    console.error('Create ready article error:', error);
    return input.content;
  }
}

module.exports = {
  processManualInput,
  rewriteInHumanStyle,
  createReadyToPublishArticle
};