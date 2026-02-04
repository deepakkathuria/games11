
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
 * Extract image generation prompts from STEP 4
 */
function extractImagePrompts(content) {
  const prompts = [];
  
  // Find STEP 4 section
  const step4Match = content.match(/STEP 4[:\s]*IMAGE[^]*?(?=STEP 5|$)/i);
  if (!step4Match) return prompts;
  
  const step4Content = step4Match[0];
  
  // Try to find prompts - look for "Image 1 Prompt:", "Image 2 Prompt:", etc.
  const imagePatterns = [
    // Pattern 1: "Image 1 Prompt:" or "IMAGE 1 PROMPT:"
    /(?:Image|IMAGE)\s*(?:1|2|3|one|two|three)\s*(?:Prompt|PROMPT)[:\s]*([^\n]+(?:\n(?!Image|IMAGE|STEP|Prompt|PROMPT)[^\n]+)*?)(?=(?:Image|IMAGE)\s*(?:[123]|one|two|three)|STEP|$)/gi,
    // Pattern 2: "Image 1:" or "IMAGE 1:"
    /(?:Image|IMAGE)\s*(?:1|2|3|one|two|three)[:\s]+([^\n]+(?:\n(?!Image|IMAGE|STEP|Prompt|PROMPT)[^\n]+)*?)(?=(?:Image|IMAGE)\s*(?:[123]|one|two|three)|STEP|$)/gi,
    // Pattern 3: "Prompt 1:" or "PROMPT 1:"
    /(?:Prompt|PROMPT)\s*(?:1|2|3|one|two|three)[:\s]+([^\n]+(?:\n(?!Image|IMAGE|STEP|Prompt|PROMPT)[^\n]+)*?)(?=(?:Prompt|PROMPT)\s*(?:[123]|one|two|three)|STEP|$)/gi,
    // Pattern 4: "For image 1:" or "FOR IMAGE 1:"
    /(?:For|FOR)\s*(?:image|IMAGE)\s*(?:1|2|3|one|two|three)[:\s]+([^\n]+(?:\n(?!Image|IMAGE|STEP|Prompt|PROMPT|For|FOR)[^\n]+)*?)(?=(?:For|FOR)\s*(?:image|IMAGE)|STEP|$)/gi
  ];
  
  for (const pattern of imagePatterns) {
    const matches = step4Content.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        let prompt = match[1].trim();
        // Clean up the prompt - remove common prefixes
        prompt = prompt
          .replace(/^[-•*]\s*/, '')
          .replace(/^Create\s+/i, '')
          .replace(/^Visualize\s+/i, '')
          .replace(/^Capture\s+/i, '')
          .replace(/^Generate\s+/i, '')
          .replace(/\n+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        // Remove quotes if present
        prompt = prompt.replace(/^["']|["']$/g, '');
        
        if (prompt.length > 20) { // Minimum prompt length
          prompts.push(prompt);
        }
      }
    }
  }
  
  // If no structured prompts found, try simpler pattern - look for lines after "Prompt:"
  if (prompts.length === 0) {
    // Split by lines and look for "Prompt:" followed by text
    const lines = step4Content.split(/\n/);
    let currentPrompt = '';
    let inPrompt = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if line contains "Prompt:" or "Image X Prompt:"
      if (/Prompt[:\s]/i.test(line) || /Image\s*[123]\s*Prompt/i.test(line)) {
        // Extract text after "Prompt:"
        const afterPrompt = line.split(/Prompt[:\s]+/i)[1];
        if (afterPrompt && afterPrompt.length > 20) {
          prompts.push(afterPrompt.trim());
        } else {
          inPrompt = true;
          currentPrompt = '';
        }
      } else if (inPrompt && line.length > 0 && !line.match(/^(Image|STEP|Hashtag)/i)) {
        // Continue collecting prompt text
        currentPrompt += (currentPrompt ? ' ' : '') + line;
        if (currentPrompt.length > 100) {
          prompts.push(currentPrompt.trim());
          currentPrompt = '';
          inPrompt = false;
        }
      } else if (inPrompt && line.match(/^(Image|STEP|Hashtag)/i)) {
        // End of prompt section
        if (currentPrompt.length > 20) {
          prompts.push(currentPrompt.trim());
        }
        currentPrompt = '';
        inPrompt = false;
      }
    }
    
    // Add last prompt if exists
    if (inPrompt && currentPrompt.length > 20) {
      prompts.push(currentPrompt.trim());
    }
  }
  
  // If still no prompts, try to extract any detailed descriptions
  if (prompts.length === 0) {
    // Look for sentences that seem like image prompts (contain visual descriptions)
    const sentences = step4Content.split(/[.\n]/);
    const visualKeywords = ['create', 'visualize', 'capture', 'show', 'depict', 'display', 'illustrate', 'cricket', 'player', 'stadium', 'match', 'dramatic', 'realistic'];
    
    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      if (visualKeywords.some(keyword => lowerSentence.includes(keyword)) && sentence.length > 50) {
        const cleaned = sentence.trim().replace(/^[-•*]\s*/, '');
        if (cleaned.length > 30 && prompts.length < 3) {
          prompts.push(cleaned);
        }
      }
    }
  }
  
  // Clean up prompts - remove quotes, extra spaces
  const cleanedPrompts = prompts.map(p => {
    return p
      .replace(/^["']|["']$/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }).filter(p => p.length > 20);
  
  // Limit to 3 prompts
  return cleanedPrompts.slice(0, 3);
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
    
    // Extract image prompts from STEP 4
    const imagePrompts = extractImagePrompts(cleanedResponse);
    console.log(`📸 Found ${imagePrompts.length} image prompts to generate`);
    
    if (imagePrompts.length > 0) {
      console.log('📝 Extracted prompts:');
      imagePrompts.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.substring(0, 100)}...`);
      });
    } else {
      console.log('⚠️ No image prompts found in STEP 4. Checking content...');
      const step4Match = cleanedResponse.match(/STEP 4[:\s]*IMAGE[^]*?(?=STEP 5|$)/i);
      if (step4Match) {
        console.log('📄 STEP 4 content found (first 200 chars):', step4Match[0].substring(0, 200));
      } else {
        console.log('❌ STEP 4 section not found in response');
      }
    }
    
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
