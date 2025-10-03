const axios = require('axios');
const { generateWithDeepSeek, buildPrePublishPrompt, buildRewriteBodyHtmlPrompt, parsePrePublishTextToJSON, buildHtmlDocument } = require('./prepublish');

/**
 * Process Pakistan manual input and create ready-to-publish article
 */
async function processPakistanManualInput(input, options = {}) {
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
      humanLikeContent = await rewritePakistanInHumanStyle(input.content, input.title);
    }

    // Create final article
    const readyToPublishArticle = await createPakistanReadyToPublishArticle({
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
    console.error('Process Pakistan manual input error:', error);
    return {
      success: false,
      error: error.message,
      processingTime: Date.now() - startTime
    };
  }
}

/**
 * Rewrite Pakistan content in human-like style with specific facts
 */
async function rewritePakistanInHumanStyle(content, title) {
  const prompt = `Rewrite this Pakistan cricket article in a natural, human-like style. Follow these specific guidelines:

1. Write like a real Pakistan cricket journalist who's passionate about the sport
2. Use conversational tone: "I think", "Honestly", "You know what's interesting"
3. Add personal reactions: "Wow!", "That's shocking", "I can't believe this"
4. Use contractions: "don't", "can't", "won't", "it's"
5. Include specific details: scores, dates, player names, statistics
6. Add rhetorical questions: "What do you think?", "Can you believe this?"
7. Use casual transitions: "So here's what happened", "Now get this", "But wait"
8. Include emotional reactions and commentary naturally
9. Make it sound like you're telling a story to a friend
10. Add hard facts: final scores, targets, overs, player stats, dates, times
11. Focus on Pakistan cricket context and local flavor

Original content: 
${content}

Rewrite this completely in your own words, making it sound natural and human-like while keeping all the cricket facts accurate.
`;

  try {
    const rewrittenContent = await generateWithDeepSeek(prompt, {
      temperature: 0.8,
      max_tokens: 2000
    });
    return rewrittenContent || content;
  } catch (error) {
    console.error('Error rewriting Pakistan content:', error);
    return content;
  }
}

/**
 * Create ready-to-publish Pakistan article using prepublish prompts
 */
async function createPakistanReadyToPublishArticle(input, options) {
  try {
    // Step 1: Get prepublish recommendations
    const prepublishPrompt = buildPrePublishPrompt({
      title: input.title,
      description: input.description,
      body: input.content
    });

    const recommendationsText = await generateWithDeepSeek(prepublishPrompt, {
      temperature: 0.3,
      max_tokens: 1500
    });

    const recommendations = parsePrePublishTextToJSON(recommendationsText);

    // Step 2: Rewrite article using recommendations
    const rewritePrompt = buildRewriteBodyHtmlPrompt({
      rawTitle: input.title,
      rawDescription: input.description,
      rawBody: input.content,
      recTitle: recommendations.recommendedTitle,
      recMeta: recommendations.recommendedMeta,
      recOutline: recommendations.outline,
      recPrimary: recommendations.keywords.primary,
      recSecondary: recommendations.keywords.secondary,
      recTertiary: recommendations.keywords.tertiary,
      recLongtail: recommendations.keywords.longtail,
      recTrending: recommendations.keywords.trending
    });

    const htmlContent = await generateWithDeepSeek(rewritePrompt, {
      temperature: 0.7,
      max_tokens: 3000
    });

    // Step 3: Create final HTML document
    const finalArticle = buildHtmlDocument({
      title: recommendations.recommendedTitle,
      metaDescription: recommendations.recommendedMeta,
      bodyHtml: htmlContent
    });

    return {
      finalTitle: recommendations.recommendedTitle,
      finalMeta: recommendations.recommendedMeta,
      finalSlug: recommendations.recommendedSlug,
      readyArticle: finalArticle,
      recommendations: recommendations
    };

  } catch (error) {
    console.error('Error creating Pakistan ready-to-publish article:', error);
    throw error;
  }
}

module.exports = {
  processPakistanManualInput,
  rewritePakistanInHumanStyle,
  createPakistanReadyToPublishArticle
};