# CRICKET ADDICTOR HIGH-CTR GENERATOR - COMPLETE BACKEND CODE

## 📋 TABLE OF CONTENTS
1. Database Tables (SQL)
2. Backend Endpoint (app.js)
3. Content Generation Module (facebookHighCTRGenerator.js)
4. Image Generation Module (imageGenerator.js)
5. Scheduler Module (cricketAddictorScheduler.js)
6. All Prompts Used
7. Database Insert Statements

---

## 1. DATABASE TABLES (SQL)

### Table 1: cricketaddictor_articles
```sql
CREATE TABLE IF NOT EXISTS cricketaddictor_articles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  content LONGTEXT NOT NULL,
  url VARCHAR(1000) NOT NULL UNIQUE,
  published_at DATETIME,
  word_count INT,
  is_valid BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_url (url),
  INDEX idx_published_at (published_at),
  INDEX idx_is_valid (is_valid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Table 2: facebook_high_ctr_content
```sql
CREATE TABLE IF NOT EXISTS facebook_high_ctr_content (
  id INT AUTO_INCREMENT PRIMARY KEY,
  article_id INT NOT NULL,
  article_title VARCHAR(500) NOT NULL,
  article_description TEXT,
  gnews_url VARCHAR(1000),
  source_name VARCHAR(255),
  generated_content LONGTEXT NOT NULL,
  processing_time INT,
  provider VARCHAR(50) DEFAULT 'OpenAI',
  generated_images JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_article_id (article_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 2. BACKEND ENDPOINT (app.js)

### Endpoint: POST /api/cricket-addictor/generate-high-ctr

```javascript
// Generate HIGH-CTR Facebook content from CricketAddictor article
app.post("/api/cricket-addictor/generate-high-ctr", async (req, res) => {
  try {
    const { articleId } = req.body;

    if (!articleId) {
      return res.status(400).json({
        success: false,
        error: "Article ID is required"
      });
    }

    // Get article from database
    const [rows] = await pollDBPool.query(
      'SELECT * FROM cricketaddictor_articles WHERE id = ? AND is_valid = true',
      [articleId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Article not found"
      });
    }

    const article = rows[0];
    
    // Remove HTML tags for content processing
    const textContent = article.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Convert database article to format
    const newsArticle = {
      title: article.title,
      description: article.description || textContent.substring(0, 200),
      content: textContent, // Use text content for AI
      url: article.url,
      publishedAt: article.published_at,
      source: {
        name: "Cricket Addictor",
        url: article.url
      }
    };

    console.log(`🚀 Generating HIGH-CTR Facebook content for: ${article.title}`);

    // Generate HIGH-CTR Facebook content
    const result = await generateHighCTRFacebookContent(newsArticle);

    if (result.success) {
      // Save generated content to database
      try {
        const imageUrlsJson = result.images && result.images.length > 0 
          ? JSON.stringify(result.images.map(img => ({
              imageUrl: img.imageUrl,
              prompt: img.prompt,
              revisedPrompt: img.revisedPrompt || img.prompt
            })))
          : null;

        const [insertResult] = await pollDBPool.query(
          `INSERT INTO facebook_high_ctr_content 
           (article_id, article_title, article_description, gnews_url, source_name, generated_content, processing_time, provider, generated_images) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            articleId,
            article.title,
            article.description || '',
            article.url, // CricketAddictor URL
            'Cricket Addictor',
            result.content,
            result.processingTime,
            result.provider || 'OpenAI',
            imageUrlsJson
          ]
        );
        console.log(`💾 Saved generated content to database with ID: ${insertResult.insertId}`);
        if (result.images && result.images.length > 0) {
          console.log(`🖼️ Saved ${result.images.length} generated images`);
        }
      } catch (dbError) {
        console.error('Error saving generated content to database:', dbError);
      }

      res.json({
        success: true,
        content: result.content,
        images: result.images || [],
        processingTime: result.processingTime,
        provider: result.provider || 'OpenAI',
        originalArticle: {
          title: article.title,
          description: article.description,
          source_url: article.url,
          source_name: 'Cricket Addictor'
        }
      });
    } else {
      console.error("HIGH-CTR generation failed:", result.error);
      res.status(500).json({
        success: false,
        error: result.error || "Failed to generate HIGH-CTR Facebook content"
      });
    }

  } catch (error) {
    console.error("Generate HIGH-CTR Facebook content error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate HIGH-CTR Facebook content"
    });
  }
});
```

### Database Insert Statement (Used in Endpoint)
```sql
INSERT INTO facebook_high_ctr_content 
(article_id, article_title, article_description, gnews_url, source_name, generated_content, processing_time, provider, generated_images) 
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
```

**Parameters:**
- `articleId` - Article ID from cricketaddictor_articles
- `article.title` - Article title
- `article.description || ''` - Article description
- `article.url` - CricketAddictor URL
- `'Cricket Addictor'` - Source name
- `result.content` - Generated HIGH-CTR content
- `result.processingTime` - Processing time in milliseconds
- `result.provider || 'OpenAI'` - Provider name
- `imageUrlsJson` - JSON string of generated images

---

## 3. CONTENT GENERATION MODULE (facebookHighCTRGenerator.js)

### Complete File Code:

```javascript
const axios = require('axios');
const { generateImageWithDALLE, generateMultipleImages, generateMultipleImagesWithSizes } = require('./imageGenerator');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = "https://api.openai.com/v1/chat/completions";

/**
 * Generate content using OpenAI API
 */
async function generateWithOpenAI(prompt, options = {}) {
  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }
    
    console.log('🤖 OpenAI API call started...');
    console.log('📊 Temperature:', options.temperature ?? 0.9);
    console.log('📝 Max tokens:', options.max_tokens ?? 4000);
    
    const response = await axios.post(OPENAI_BASE_URL, {
      model: options.model || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a senior social media growth editor specializing in cricket and sports content. You create high-CTR Facebook posts that achieve 10,000+ organic clicks through strategic hooks, emotional triggers, and viral content strategies."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: options.temperature || 0.9,
      max_tokens: options.max_tokens || 4000
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 120000
    });

    if (!response.data || !response.data.choices || !response.data.choices[0]) {
      throw new Error('Invalid response from OpenAI API');
    }

    const content = response.data.choices[0].message.content;
    console.log('✅ OpenAI API call completed, content length:', content.length);
    return content;
  } catch (error) {
    console.error('❌ OpenAI API error:', error.message);
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout - content generation took too long. Try again.');
    }
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      throw new Error(`OpenAI API error: ${error.response.data?.error?.message || error.message}`);
    }
    throw new Error(`OpenAI API error: ${error.message}`);
  }
}

/**
 * Clean text by removing unwanted formatting
 */
function cleanText(text) {
  if (!text) return text;
  
  return text
    .replace(/\*\*/g, '') // Remove double asterisks
    .replace(/\*/g, '') // Remove single asterisks
    .replace(/#/g, '') // Remove hash symbols
    .replace(/```/g, '') // Remove code blocks
    .replace(/`/g, '') // Remove backticks
    .replace(/\[|\]/g, '') // Remove square brackets
    .replace(/\(|\)/g, '') // Remove parentheses
    .replace(/-{2,}/g, '') // Remove multiple dashes
    .replace(/_{2,}/g, '') // Remove multiple underscores
    .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
    .trim();
}

/**
 * Category detection + prompt recipes
 */
const PROMPT_RECIPES = {
  player: {
    close_up: "Professional cricket player in action, sharp focus on face and expression, stadium lights, cinematic lighting, 8k quality, dramatic shadows",
    wide: "Cricket player batting with crowd in background, dramatic stadium setting, golden hour lighting, vibrant atmosphere"
  },
  stadium: {
    close_up: "Detailed cricket pitch with white lines, perfectly manicured grass, crowd in blurred background, professional sports photography",
    wide: "Full cricket stadium packed with enthusiastic crowd, floodlights on, vibrant atmosphere, aerial view, cinematic composition"
  },
  action: {
    close_up: "Close-up cricket ball in motion, bat connection, dust particles, high speed photography, dramatic action moment",
    wide: "Wide angle of cricket match action, fielders positioned, crowd reaction visible, dynamic composition, sports journalism style"
  },
  celebration: {
    close_up: "Celebrating cricket player, jubilant expression, teammates in background, emotional moment, professional photography",
    wide: "Team celebration on field, crowd cheering, confetti effect, championship atmosphere, wide angle composition"
  },
  match: {
    close_up: "Intense cricket match moment, players in focus, dramatic lighting, professional sports photography",
    wide: "Cricket match in progress, full field view, crowd visible, stadium atmosphere, cinematic wide shot"
  },
  default: {
    close_up: "Cricket-themed image, professional sports photography, dramatic lighting, high quality, realistic style",
    wide: "Cricket scene, wide angle composition, stadium atmosphere, professional photography, cinematic style"
  }
};

/**
 * Safety rewrite for risky words
 */
function applySafetyRewrite(prompt) {
  const riskyWords = {
    "death": "dramatic moment",
    "kill": "eliminate",
    "attack": "aggressive play",
    "wound": "injury",
    "blood": "intense action",
    "crash": "collision",
    "destroy": "overpower",
    "violence": "intense competition",
    "war": "rivalry",
    "battle": "match",
    "fight": "competition",
    "strike": "play",
    "hit": "shot",
    "beat": "defeat"
  };
  
  let safePrompt = prompt;
  for (const [word, replacement] of Object.entries(riskyWords)) {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    safePrompt = safePrompt.replace(regex, replacement);
  }
  
  return safePrompt;
}

/**
 * Build visual brief from article (LLM JSON output)
 */
async function buildVisualBrief(article) {
  try {
    console.log('📋 Building visual brief for article...');
    
    const articleContent = article.content || article.description || '';
    const contentPreview = articleContent.length > 1500 ? articleContent.substring(0, 1500) : articleContent;
    
    const briefPrompt = `Analyze this cricket article and create a visual brief in JSON format.

Article Title: ${article.title || 'No title'}
Article Content: ${contentPreview}

Return ONLY valid JSON (no markdown, no code blocks) with this structure:
{
  "category": "player|stadium|action|celebration|crowd|equipment|match",
  "mood": "intense|celebratory|dramatic|heroic|tense|joyful",
  "mainSubject": "brief description of main visual subject",
  "setting": "brief description of setting/location",
  "timeOfDay": "day|night|golden hour|sunset|dawn",
  "colors": ["primary color", "secondary color"],
  "composition": "wide angle|close-up|overhead|profile|action shot",
  "emotion": "excitement|tension|joy|determination|surprise"
}`;

    const response = await axios.post(OPENAI_BASE_URL, {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a visual content strategist. Return ONLY valid JSON, no additional text."
        },
        {
          role: "user",
          content: briefPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" }
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    if (!response.data || !response.data.choices || !response.data.choices[0]) {
      throw new Error('Invalid response from OpenAI API');
    }

    const content = response.data.choices[0].message.content;
    let brief;
    
    try {
      // Try to parse JSON (handle if wrapped in markdown)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : content;
      brief = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('❌ Failed to parse visual brief JSON:', parseError);
      // Fallback to default brief
      brief = {
        category: "match",
        mood: "dramatic",
        mainSubject: "cricket match",
        setting: "cricket stadium",
        timeOfDay: "day",
        colors: ["green", "blue"],
        composition: "wide angle",
        emotion: "excitement"
      };
    }

    console.log('✅ Visual brief generated:', JSON.stringify(brief, null, 2));
    return brief;
    
  } catch (error) {
    console.error('❌ Error building visual brief:', error.message);
    // Return default brief on error
    return {
      category: "match",
      mood: "dramatic",
      mainSubject: article.title || "cricket match",
      setting: "cricket stadium",
      timeOfDay: "day",
      colors: ["green", "blue"],
      composition: "wide angle",
      emotion: "excitement"
    };
  }
}

/**
 * Build image prompts from brief (strict STEP 4 format)
 */
function buildImagePromptsFromBrief(brief) {
  const category = brief.category || "default";
  const recipe = PROMPT_RECIPES[category] || PROMPT_RECIPES.default;
  
  // Build base prompt
  const basePrompt = `Cricket-themed image. Subject: ${brief.mainSubject || "cricket match"}. 
Setting: ${brief.setting || "cricket stadium"}. Mood: ${brief.mood || "dramatic"}. 
Time: ${brief.timeOfDay || "day"}. Colors: ${(brief.colors || ["green", "blue"]).join(", ")}.
Composition: ${brief.composition || "wide angle"}. Emotion: ${brief.emotion || "excitement"}.
Professional sports photography, high quality, realistic style, dramatic lighting.`;
  
  // Build prompts for both sizes
  const prompts = {
    "1:1": {
      size: "1024x1024",
      prompt: `${basePrompt} ${recipe.close_up}. Square composition (1:1 aspect ratio), optimized for social media feeds.`
    },
    "4:5": {
      size: "1024x1280",
      prompt: `${basePrompt} ${recipe.wide}. Portrait orientation (4:5 aspect ratio), optimized for mobile feeds and Facebook stories.`
    }
  };
  
  return prompts;
}

/**
 * Generate HIGH-CTR Facebook content (Senior's Prompt)
 */
async function generateHighCTRFacebookContent(newsArticle) {
  const startTime = Date.now();
  
  try {
    console.log(`🚀 Generating HIGH-CTR Facebook content with OpenAI for: ${newsArticle.title}`);
    
    // Validate required fields
    if (!newsArticle.title) {
      throw new Error('Article title is required');
    }
    
    if (!newsArticle.description && !newsArticle.content) {
      throw new Error('Article description or content is required');
    }
    
    // Safely get content
    const articleContent = newsArticle.content || newsArticle.description || '';
    const contentPreview = articleContent.length > 2000 ? articleContent.substring(0, 2000) : articleContent;
    
    const prompt = `You are a senior social media growth editor for a large cricket news brand.
Your goal is to generate Facebook posts that can achieve 10,000+ clicks organically.

I will give you ONE article.
Your task is to:

STEP 1: ANALYZE THE ARTICLE
- Identify the strongest CLICK TRIGGERS:
  - Shock / controversy
  - Fear / uncertainty
  - Authority action (ban, suspension, ICC decision)
  - World Cup / big event angle
  - Emotion (anger, betrayal, disbelief)
- Identify:
  - 1 main hook
  - 3 secondary hooks
  - 1 debate angle

STEP 2: CREATE FACEBOOK POST COPY
Generate:
- 5 HIGH-CTR Facebook link post captions
Each caption must:
- Start with a powerful hook in the first 8–12 words
- Use curiosity, urgency, or controversy
- Avoid revealing the full answer (force the click)
- Include a clear CTA
- End with a comment-bait question

Tone:
- Fan-first
- Breaking-news urgency
- Conversational (not robotic)
- Slightly dramatic but factual

STEP 3: CREATE IMAGE IDEAS
Suggest:
- 3 IMAGE CONCEPTS optimized for Facebook feed
For each image:
- Visual idea (what should be shown)
- Text overlay (max 6–8 words, bold & emotional)
- Emotion to trigger (shock, anger, curiosity)

STEP 4: IMAGE GENERATION PROMPTS (AI-READY)
For each image, write:
- A detailed AI image generation prompt
- Style: realistic, dramatic sports journalism
- Aspect ratio: 1:1 and 4:5
- High contrast, bold lighting, news-style composition

STEP 5: HASHTAGS & POSTING TIPS
Provide:
- 5–7 hashtags (high-reach + topical)
- Best posting time for Facebook
- First comment strategy to boost reach

IMPORTANT RULES:
- No emojis overload (max 2 per caption)
- No clickbait lies
- Focus on emotional curiosity
- Assume audience = hardcore + casual cricket fans

Now analyze the article below and execute all steps.

ARTICLE:
TITLE: ${newsArticle.title || 'No title'}
DESCRIPTION: ${newsArticle.description || 'No description'}
CONTENT: ${contentPreview}

Format your response clearly with STEP 1, STEP 2, STEP 3, STEP 4, STEP 5 sections.
Use clean text format - NO asterisks, NO markdown formatting, NO code blocks.`;

    const response = await generateWithOpenAI(prompt, {
      temperature: 0.9,
      max_tokens: 4000
    });
    
    const cleanedResponse = cleanText(response);
    
    console.log('✅ HIGH-CTR Facebook content generated with OpenAI');
    
    // Generate images using new visual brief system
    let generatedImages = [];
    try {
      console.log('🎨 Starting image generation with visual brief system...');
      
      // Build visual brief from article
      const visualBrief = await buildVisualBrief(newsArticle);
      
      // Build image prompts from brief (returns 1:1 and 4:5 sizes)
      const imagePromptsConfig = buildImagePromptsFromBrief(visualBrief);
      
      // Generate images for both sizes
      const allImagePrompts = [];
      const promptMetadata = [];
      
      for (const [sizeKey, config] of Object.entries(imagePromptsConfig)) {
        const rawExtractedPrompt = config.prompt;
        const finalPrompt = applySafetyRewrite(rawExtractedPrompt);
        
        // Log before API call
        console.log(`\n${'='.repeat(60)}`);
        console.log(`📐 SIZE: ${sizeKey} (${config.size})`);
        console.log(`${'='.repeat(60)}`);
        console.log('📋 RAW EXTRACTED PROMPT:');
        console.log(rawExtractedPrompt);
        console.log('\n🔒 SAFETY REWRITE APPLIED');
        console.log('✅ FINAL PROMPT (sent to API):');
        console.log(finalPrompt);
        console.log(`${'='.repeat(60)}\n`);
        
        allImagePrompts.push(finalPrompt);
        promptMetadata.push({
          size: sizeKey,
          dimensions: config.size,
          rawPrompt: rawExtractedPrompt,
          finalPrompt: finalPrompt
        });
      }
      
      // Generate images with new system (2 sizes per prompt concept)
      const imageResult = await generateMultipleImagesWithSizes(allImagePrompts, promptMetadata, {
        quality: "hd",
        style: "vivid"
      });
      
      if (imageResult.success && imageResult.images.length > 0) {
        generatedImages = imageResult.images;
        console.log(`✅ Generated ${imageResult.totalGenerated} images successfully`);
        if (imageResult.errors && imageResult.errors.length > 0) {
          console.log(`⚠️ ${imageResult.totalFailed} images failed to generate`);
        }
      } else {
        console.log('⚠️ Image generation failed, but continuing with text content');
        if (imageResult.errors) {
          imageResult.errors.forEach(err => {
            console.error(`  Error for image ${err.index}: ${err.error}`);
          });
        }
      }
    } catch (imageError) {
      console.error('⚠️ Image generation error (continuing without images):', imageError.message);
      console.error('Error stack:', imageError.stack);
      // Continue even if image generation fails
    }
    
    return {
      success: true,
      content: cleanedResponse,
      images: generatedImages,
      processingTime: Date.now() - startTime,
      originalArticle: {
        title: newsArticle.title,
        description: newsArticle.description
      }
    };
    
  } catch (error) {
    console.error('HIGH-CTR Facebook content generation error (OpenAI):', error);
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
  generateHighCTRFacebookContent,
  buildVisualBrief,
  buildImagePromptsFromBrief,
  applySafetyRewrite
};
```

---

## 4. IMAGE GENERATION MODULE (imageGenerator.js)

### Complete File Code:

```javascript
// imageGenerator.js
const axios = require('axios');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DALL_E_API_URL = "https://api.openai.com/v1/images/generations";

/**
 * Generate image using DALL-E API
 */
async function generateImageWithDALLE(prompt, options = {}) {
  try {
    if (!OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY is not set in environment variables');
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }

    console.log('🎨 Generating image with DALL-E...');
    console.log('📝 Prompt length:', prompt.length);
    console.log('📝 Prompt preview:', prompt.substring(0, 150) + '...');
    
    // Validate prompt length (DALL-E 3 has max 4000 characters)
    if (prompt.length > 4000) {
      console.warn('⚠️ Prompt too long, truncating to 4000 characters');
      prompt = prompt.substring(0, 4000);
    }

    // Try gpt-image-1 first, fallback to dall-e-3
    const preferredModel = options.model || "gpt-image-1";
    const fallbackModel = "dall-e-3";
    const size = options.size || "1024x1024"; // 1024x1024, 1792x1024, or 1024x1792
    const quality = options.quality || "hd"; // Use "hd" for better quality (standard or hd)
    const style = options.style || "vivid"; // Use "vivid" for more dramatic images (natural or vivid)
    
    console.log('🎨 Preferred Model:', preferredModel);
    console.log('🔄 Fallback Model:', fallbackModel);
    console.log('📐 Size:', size);
    console.log('✨ Quality:', quality);
    console.log('🎭 Style:', style);
    
    let model = preferredModel;
    let response;
    
    try {
      // Try gpt-image-1 first
      response = await axios.post(DALL_E_API_URL, {
        model: model,
        prompt: prompt,
        n: 1, // Number of images
        size: size,
        quality: quality,
        style: style
      }, {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 seconds timeout
      });
    } catch (firstError) {
      // If gpt-image-1 fails, try dall-e-3
      if (firstError.response && firstError.response.status === 400) {
        console.log(`⚠️ ${preferredModel} not available, falling back to ${fallbackModel}`);
        model = fallbackModel;
        
        response = await axios.post(DALL_E_API_URL, {
          model: model,
          prompt: prompt,
          n: 1,
          size: size,
          quality: quality,
          style: style
        }, {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        });
      } else {
        throw firstError;
      }
    }
    
    // Validate response
    if (!response || !response.data || !response.data.data || !response.data.data[0]) {
      throw new Error('Invalid response from image generation API');
    }

    const imageUrl = response.data.data[0].url;
    const revisedPrompt = response.data.data[0].revised_prompt || prompt;

    console.log('✅ Image generated successfully');
    console.log('🔗 Image URL:', imageUrl);

    return {
      success: true,
      imageUrl: imageUrl,
      revisedPrompt: revisedPrompt
    };

  } catch (error) {
    console.error('❌ DALL-E API error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      throw new Error(`DALL-E API error: ${error.response.data?.error?.message || error.message}`);
    }
    throw new Error(`DALL-E API error: ${error.message}`);
  }
}

/**
 * Generate multiple images from prompts array
 */
async function generateMultipleImages(prompts, options = {}) {
  const results = [];
  const errors = [];

  for (let i = 0; i < prompts.length; i++) {
    try {
      console.log(`\n🎨 Generating image ${i + 1}/${prompts.length}...`);
      const result = await generateImageWithDALLE(prompts[i], {
        size: options.size || "1024x1024",
        quality: options.quality || "hd", // Use HD for better quality
        style: options.style || "vivid" // Use vivid for dramatic sports images
      });
      results.push({
        index: i + 1,
        prompt: prompts[i],
        ...result
      });
      // Add delay between requests to avoid rate limiting
      if (i < prompts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      }
    } catch (error) {
      console.error(`❌ Failed to generate image ${i + 1}:`, error.message);
      errors.push({
        index: i + 1,
        prompt: prompts[i],
        error: error.message
      });
    }
  }

  return {
    success: results.length > 0,
    images: results,
    errors: errors,
    totalGenerated: results.length,
    totalFailed: errors.length
  };
}

/**
 * Generate multiple images with different sizes (1:1 and 4:5)
 */
async function generateMultipleImagesWithSizes(prompts, metadata = [], options = {}) {
  const results = [];
  const errors = [];

  for (let i = 0; i < prompts.length; i++) {
    try {
      const meta = metadata[i] || {};
      const size = meta.dimensions || options.size || "1024x1024";
      
      console.log(`\n🎨 Generating image ${i + 1}/${prompts.length}...`);
      console.log(`📐 Size: ${meta.size || 'default'} (${size})`);
      
      const result = await generateImageWithDALLE(prompts[i], {
        size: size,
        quality: options.quality || "hd",
        style: options.style || "vivid",
        model: options.model || "gpt-image-1"
      });
      
      results.push({
        index: i + 1,
        size: meta.size || 'default',
        dimensions: size,
        rawPrompt: meta.rawPrompt || prompts[i],
        finalPrompt: meta.finalPrompt || prompts[i],
        prompt: prompts[i],
        ...result
      });
      
      // Add delay between requests to avoid rate limiting
      if (i < prompts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      }
    } catch (error) {
      console.error(`❌ Failed to generate image ${i + 1}:`, error.message);
      errors.push({
        index: i + 1,
        prompt: prompts[i],
        error: error.message
      });
    }
  }

  return {
    success: results.length > 0,
    images: results,
    errors: errors,
    totalGenerated: results.length,
    totalFailed: errors.length
  };
}

module.exports = {
  generateImageWithDALLE,
  generateMultipleImages,
  generateMultipleImagesWithSizes
};
```

---

## 5. SCHEDULER MODULE (cricketAddictorScheduler.js)

### Complete File Code:

```javascript
// cricketAddictorScheduler.js
const axios = require('axios');
require('dotenv').config();
const https = require('https');
const dns = require('dns');

// Import your existing DB pool
const { pollDBPool } = require('./config/db');

// Prefer IPv4
try { dns.setDefaultResultOrder('ipv4first'); } catch {}
const ipv4Agent = new https.Agent({ family: 4, keepAlive: true });

// Retry helper
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function getWithRetry(url, opts = {}, tries = 3) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      return await axios.get(url, opts);
    } catch (e) {
      lastErr = e;
      const code = e.response?.status || e.code;
      if (
        code === 'ETIMEDOUT' || code === 'ECONNRESET' || code === 'EAI_AGAIN' ||
        (typeof code === 'number' && (code >= 500 || code === 429))
      ) {
        await sleep(800 * (i + 1));
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}

// CricketAddictor API Configuration
const CRICKET_ADDICTOR_API_URL = "https://cricketaddictor.com/api/ca-export/articles/";

class CricketAddictorScheduler {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
  }

  // Fetch articles from CricketAddictor API
  async fetchArticlesFromAPI(limit = 50) {
    try {
      console.log(`📰 Fetching latest ${limit} articles from CricketAddictor...`);
      
      const url = `${CRICKET_ADDICTOR_API_URL}?page=1&limit=${limit}`;
      
      const response = await getWithRetry(url, {
        timeout: 45000,
        httpsAgent: ipv4Agent,
        headers: { Accept: 'application/json' },
      });

      if (response.data && response.data.success && response.data.data) {
        const articles = response.data.data.filter(article => {
          // Filter valid articles
          if (!article.title || article.title.length < 10) return false;
          if (!article.content || article.content.length < 300) return false;
          if (!article.url) return false;
          
          // Remove HTML tags for word count
          const textContent = article.content.replace(/<[^>]*>/g, ' ').trim();
          if (textContent.length < 300) return false;
          
          return true;
        });
        
        console.log(`✅ Filtered ${articles.length} valid articles from ${response.data.data.length} total`);
        return articles;
      }
      return [];
    } catch (error) {
      console.error('Error fetching articles from CricketAddictor:', error);
      return [];
    }
  }

  // Store articles in database
  async storeArticlesInDB(articles) {
    if (articles.length === 0) return;

    try {
      let storedCount = 0;
      for (const article of articles) {
        // Check if article already exists
        const [existing] = await pollDBPool.query(
          'SELECT id FROM cricketaddictor_articles WHERE url = ?',
          [article.url]
        );

        if (existing.length === 0) {
          // Remove HTML tags for description and word count
          const textContent = article.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          const description = article.description || textContent.substring(0, 200);
          const wordCount = textContent.split(' ').length;

          // Parse published_at date
          let publishedDate = new Date();
          if (article.published_at) {
            publishedDate = new Date(article.published_at);
            if (isNaN(publishedDate.getTime())) {
              publishedDate = new Date();
            }
          }

          // Insert new article
          await pollDBPool.query(
            `INSERT INTO cricketaddictor_articles 
             (title, description, content, url, published_at, word_count, is_valid) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              article.title,
              description,
              article.content, // Keep HTML content
              article.url,
              publishedDate,
              wordCount,
              true
            ]
          );
          storedCount++;
          console.log(`✅ Stored: ${article.title.substring(0, 50)}...`);
        }
      }
      console.log(`💾 Total stored: ${storedCount} new articles`);
    } catch (error) {
      console.error('Error storing articles in database:', error);
      throw error;
    }
  }

  // Main function to fetch and store articles
  async fetchAndStoreArticles(limit = 50) {
    console.log('🚀 Fetching latest CricketAddictor articles...');
    const articles = await this.fetchArticlesFromAPI(limit);
    await this.storeArticlesInDB(articles);
    console.log(`✅ Fetched and stored ${articles.length} articles`);
    return articles.length;
  }

  // Get stored articles from database
  async getStoredArticles(limit = 100, offset = 0) {
    try {
      const [rows] = await pollDBPool.query(
        `SELECT * FROM cricketaddictor_articles 
         WHERE is_valid = true 
         ORDER BY published_at DESC, id DESC 
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      return rows;
    } catch (error) {
      console.error('Error getting stored articles:', error);
      return [];
    }
  }
}

module.exports = CricketAddictorScheduler;
```

---

## 6. ALL PROMPTS USED

### Prompt 1: Main HIGH-CTR Content Generation Prompt
```
You are a senior social media growth editor for a large cricket news brand.
Your goal is to generate Facebook posts that can achieve 10,000+ clicks organically.

I will give you ONE article.
Your task is to:

STEP 1: ANALYZE THE ARTICLE
- Identify the strongest CLICK TRIGGERS:
  - Shock / controversy
  - Fear / uncertainty
  - Authority action (ban, suspension, ICC decision)
  - World Cup / big event angle
  - Emotion (anger, betrayal, disbelief)
- Identify:
  - 1 main hook
  - 3 secondary hooks
  - 1 debate angle

STEP 2: CREATE FACEBOOK POST COPY
Generate:
- 5 HIGH-CTR Facebook link post captions
Each caption must:
- Start with a powerful hook in the first 8–12 words
- Use curiosity, urgency, or controversy
- Avoid revealing the full answer (force the click)
- Include a clear CTA
- End with a comment-bait question

Tone:
- Fan-first
- Breaking-news urgency
- Conversational (not robotic)
- Slightly dramatic but factual

STEP 3: CREATE IMAGE IDEAS
Suggest:
- 3 IMAGE CONCEPTS optimized for Facebook feed
For each image:
- Visual idea (what should be shown)
- Text overlay (max 6–8 words, bold & emotional)
- Emotion to trigger (shock, anger, curiosity)

STEP 4: IMAGE GENERATION PROMPTS (AI-READY)
For each image, write:
- A detailed AI image generation prompt
- Style: realistic, dramatic sports journalism
- Aspect ratio: 1:1 and 4:5
- High contrast, bold lighting, news-style composition

STEP 5: HASHTAGS & POSTING TIPS
Provide:
- 5–7 hashtags (high-reach + topical)
- Best posting time for Facebook
- First comment strategy to boost reach

IMPORTANT RULES:
- No emojis overload (max 2 per caption)
- No clickbait lies
- Focus on emotional curiosity
- Assume audience = hardcore + casual cricket fans

Now analyze the article below and execute all steps.

ARTICLE:
TITLE: {article.title}
DESCRIPTION: {article.description}
CONTENT: {article.content}

Format your response clearly with STEP 1, STEP 2, STEP 3, STEP 4, STEP 5 sections.
Use clean text format - NO asterisks, NO markdown formatting, NO code blocks.
```

### Prompt 2: Visual Brief Generation Prompt
```
Analyze this cricket article and create a visual brief in JSON format.

Article Title: {article.title}
Article Content: {article.content}

Return ONLY valid JSON (no markdown, no code blocks) with this structure:
{
  "category": "player|stadium|action|celebration|crowd|equipment|match",
  "mood": "intense|celebratory|dramatic|heroic|tense|joyful",
  "mainSubject": "brief description of main visual subject",
  "setting": "brief description of setting/location",
  "timeOfDay": "day|night|golden hour|sunset|dawn",
  "colors": ["primary color", "secondary color"],
  "composition": "wide angle|close-up|overhead|profile|action shot",
  "emotion": "excitement|tension|joy|determination|surprise"
}
```

### System Prompt for Visual Brief
```
You are a visual content strategist. Return ONLY valid JSON, no additional text.
```

### System Prompt for Main Content Generation
```
You are a senior social media growth editor specializing in cricket and sports content. You create high-CTR Facebook posts that achieve 10,000+ organic clicks through strategic hooks, emotional triggers, and viral content strategies.
```

---

## 7. DATABASE INSERT STATEMENTS

### Insert 1: Store CricketAddictor Article
```sql
INSERT INTO cricketaddictor_articles 
(title, description, content, url, published_at, word_count, is_valid) 
VALUES (?, ?, ?, ?, ?, ?, ?)
```

**Parameters:**
- `article.title` - Article title
- `description` - Article description (first 200 chars of content)
- `article.content` - Full HTML content
- `article.url` - Article URL
- `publishedDate` - Parsed published date
- `wordCount` - Word count from text content
- `true` - is_valid flag

### Insert 2: Store Generated HIGH-CTR Content
```sql
INSERT INTO facebook_high_ctr_content 
(article_id, article_title, article_description, gnews_url, source_name, generated_content, processing_time, provider, generated_images) 
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
```

**Parameters:**
- `articleId` - Article ID from cricketaddictor_articles
- `article.title` - Article title
- `article.description || ''` - Article description
- `article.url` - CricketAddictor URL
- `'Cricket Addictor'` - Source name
- `result.content` - Generated HIGH-CTR content
- `result.processingTime` - Processing time in milliseconds
- `result.provider || 'OpenAI'` - Provider name
- `imageUrlsJson` - JSON string of generated images

**Image JSON Format:**
```json
[
  {
    "imageUrl": "https://oaidalleapiprodscus.blob.core.windows.net/...",
    "prompt": "Cricket-themed image...",
    "revisedPrompt": "A detailed cricket stadium..."
  }
]
```

---

## 8. API ENDPOINTS SUMMARY

### Endpoint 1: Manual Fetch Articles
**Route:** `POST /api/cricket-addictor/manual-fetch`
**Body:** `{ "limit": 50 }`
**Function:** Fetches articles from CricketAddictor API and stores in database

### Endpoint 2: Get Stored Articles
**Route:** `GET /api/cricket-addictor/stored-articles`
**Query Params:** `limit=25&offset=0&sort=desc`
**Function:** Returns paginated list of stored articles

### Endpoint 3: Generate HIGH-CTR Content
**Route:** `POST /api/cricket-addictor/generate-high-ctr`
**Body:** `{ "articleId": 123 }`
**Function:** Generates HIGH-CTR Facebook content and images, saves to database

---

## 9. IMAGE GENERATION FLOW

1. **Article Analysis** → `buildVisualBrief()` → JSON brief with category, mood, colors, etc.
2. **Prompt Building** → `buildImagePromptsFromBrief()` → Creates prompts for 1:1 and 4:5 sizes
3. **Safety Rewrite** → `applySafetyRewrite()` → Removes risky words
4. **Image Generation** → `generateMultipleImagesWithSizes()` → Calls DALL-E API
5. **Model Fallback** → Tries `gpt-image-1` first, falls back to `dall-e-3`
6. **Database Save** → Stores image URLs in JSON format

---

## 10. ENVIRONMENT VARIABLES REQUIRED

```env
OPENAI_API_KEY=sk-...
PORT=5000
```

---

## END OF COMPLETE CODE DOCUMENT

**Note:** This is the complete backend code for CricketAddictor High-CTR Generator. All prompts, database inserts, and API endpoints are included above.
