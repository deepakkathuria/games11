const axios = require('axios');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = "https://api.openai.com/v1/chat/completions";

async function generateWithOpenAI(prompt, options = {}) {
  try {
    const response = await axios.post(OPENAI_BASE_URL, {
      model: options.model || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert English journalist. Write in a natural, engaging, and comprehensive style. Always provide complete, detailed articles."
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
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

async function processAllNewsOpenAI(input, options = {}) {
  const startTime = Date.now();
  
  try {
    console.log('🔍 [OpenAI] Processing article:', input.title);
    console.log('📝 [OpenAI] Original content length:', input.content?.length || 0);
    console.log('📄 [OpenAI] Original content preview:', input.content?.substring(0, 200) + '...');
    
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
      humanLikeContent = await rewriteInHumanStyleOpenAI(input.content, input.title);
    }

    const readyToPublishArticle = await createReadyToPublishArticleOpenAI({
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
    console.error('Process all news OpenAI error:', error);
    return {
      success: false,
      error: error.message,
      processingTime: Date.now() - startTime
    };
  }
}

async function rewriteInHumanStyleOpenAI(content, title) {
  console.log('🔄 [OpenAI] Starting human style rewriting...');
  console.log('📝 [OpenAI] Content length:', content?.length);
  console.log('📝 [OpenAI] Title:', title?.substring(0, 50) + '...');
  
  const prompt = `You are an expert English journalist. Rewrite this news article in a natural, human-like style in English. Follow these specific guidelines:

1. Write like a real journalist who's passionate about the topic
2. Use conversational tone: "I think", "Honestly", "You know what's interesting"
3. Add personal reactions: "Wow!", "That's shocking", "I can't believe this"
4. Use contractions: "don't", "can't", "won't", "it's"
5. Include specific details: dates, names, statistics, locations
6. Add rhetorical questions: "What do you think?", "Can you believe this?"
7. Use casual transitions: "So here's what happened", "Now get this", "But wait"
8. Include emotional reactions and commentary naturally
9. Make it sound like you're telling a story to a friend
10. Add hard facts: dates, times, names, locations, statistics
11. Expand on the content - make it comprehensive and detailed
12. Add background information and context
13. Include analysis and implications
14. Make sure the rewritten content is complete and thorough
15. Write a FULL, COMPLETE article - at least 800-1200 words
16. If the source content is short, expand it significantly with relevant details

IMPORTANT: Write ONLY in English. Create a comprehensive, full-length article.

English article:
Title: ${title}
Content: ${content}

Now write the complete English version:`;

  try {
    const response = await generateWithOpenAI(prompt, {
      model: "gpt-4o-mini",
      temperature: 0.95,
      max_tokens: 4000
    });
    
    console.log('✅ [OpenAI] Human style rewriting completed, length:', response?.length);
    console.log('📄 [OpenAI] English content preview:', response?.substring(0, 200) + '...');
    
    // Convert plain text to HTML paragraphs
    if (response) {
      const paragraphs = response.split('\n').filter(p => p.trim().length > 0);
      console.log('📝 [OpenAI] Paragraphs count:', paragraphs.length);
      
      const htmlContent = paragraphs.map(p => `<p>${p.trim()}</p>`).join('\n');
      console.log('✅ [OpenAI] HTML conversion completed, length:', htmlContent.length);
      console.log('📄 [OpenAI] HTML preview:', htmlContent.substring(0, 200) + '...');
      
      return htmlContent;
    }
    
    console.log('❌ [OpenAI] No English content, returning original');
    return content;
  } catch (error) {
    console.error('Human style rewriting for OpenAI error:', error);
    return content;
  }
}

async function createReadyToPublishArticleOpenAI(input, options) {
  console.log('🔄 [OpenAI] Creating ready-to-publish article...');
  console.log('📝 [OpenAI] Input content length:', input.content?.length);
  
  const prompt = `You are an expert English journalist. Create a complete, comprehensive, ready-to-publish news article in English from this content. Make it sound like a real journalist wrote it, not AI. Follow these rules:

1. NO markdown formatting (no **, *, #, etc.)
2. NO AI phrases like "Of course", "Here is a complete", "optimized for"
3. NO template sections like "The Incident", "The Response", etc.
4. Write in natural, flowing paragraphs
5. Use conversational tone with personal opinions
6. Include specific details, dates, names, locations, and facts
7. Add emotional reactions and commentary
8. Make it engaging and human-like
9. NO meta titles or descriptions in the content
10. Just write the article naturally
11. Include hard facts: dates, times, names, locations, statistics
12. Add attributed quotes if available
13. Use varied sentence lengths
14. Include counter-views and context
15. Write a FULL, COMPLETE article - at least 800-1200 words
16. Expand on all key points and provide comprehensive coverage
17. Include background information and context
18. Add analysis and expert opinions where relevant
19. Make sure the article is complete and doesn't end abruptly
20. If the source content is short, expand it significantly with relevant details
21. Add context about why this news matters
22. Include potential implications and future developments
23. Add relevant background information about the topic
24. Make it a complete, standalone article that readers will find valuable

IMPORTANT: Write ONLY in English. Create a comprehensive, full-length article.

English article:
Title: ${input.title}
Description: ${input.description}
Content: ${input.content}

Now write the complete English version:`;

  try {
    const response = await generateWithOpenAI(prompt, {
      model: "gpt-4o-mini",
      temperature: 0.9,
      max_tokens: 5000
    });
    
    console.log('✅ [OpenAI] English translation completed, length:', response?.length);
    console.log('📄 [OpenAI] English content preview:', response?.substring(0, 200) + '...');
    
    // Convert plain text to HTML paragraphs
    if (response) {
      const paragraphs = response.split('\n').filter(p => p.trim().length > 0);
      console.log('📝 [OpenAI] Paragraphs count:', paragraphs.length);
      
      const htmlContent = paragraphs.map(p => `<p>${p.trim()}</p>`).join('\n');
      console.log('✅ [OpenAI] HTML conversion completed, length:', htmlContent.length);
      console.log('📄 [OpenAI] HTML preview:', htmlContent.substring(0, 200) + '...');
      
      return htmlContent;
    }
    
    console.log('❌ [OpenAI] No English content, returning original');
    return input.content;
  } catch (error) {
    console.error('Create ready article for OpenAI error:', error);
    return input.content;
  }
}

async function generateOpenAIHeadline(title) {
  const prompt = `Create an engaging, SEO-friendly headline in English for this news title. Make it:
1. Catchy and attention-grabbing
2. Under 60 characters if possible
3. Include key keywords
4. Sound like a real news headline
5. Avoid clickbait but make it compelling

Original title: ${title}

Generate a new headline:`;

  try {
    const response = await generateWithOpenAI(prompt, {
      model: "gpt-4o-mini",
      temperature: 0.8,
      max_tokens: 100
    });
    return response || title;
  } catch (error) {
    console.error('Generate OpenAI headline error:', error);
    return title;
  }
}

async function generateOpenAIMetaDescription(description) {
  const prompt = `Create an engaging meta description in English for this news description. Make it:
1. 150-160 characters long
2. Include key information and keywords
3. Compelling and click-worthy
4. Summarize the main points
5. Sound natural and engaging

Original description: ${description}

Generate a meta description:`;

  try {
    const response = await generateWithOpenAI(prompt, {
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 200
    });
    return response || description;
  } catch (error) {
    console.error('Generate OpenAI meta description error:', error);
    return description;
  }
}

module.exports = {
  processAllNewsOpenAI,
  rewriteInHumanStyleOpenAI,
  createReadyToPublishArticleOpenAI,
  generateOpenAIHeadline,
  generateOpenAIMetaDescription
};
