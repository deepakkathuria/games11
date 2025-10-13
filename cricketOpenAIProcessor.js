const axios = require('axios');
const cheerio = require('cheerio');
const mysql = require('mysql2/promise');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const OPENAI_BASE_URL = "https://api.openai.com/v1/chat/completions";
const DEEPSEEK_BASE_URL = "https://api.deepseek.com/chat/completions";

// Database config for dynamic prompts
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.POLL_DB_NAME,
};

/* ---------- HELPER FUNCTIONS ---------- */

// Timeout wrapper
async function withTimeout(promise, ms = 30000) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timeoutId);
  }
}

// Sleep utility
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Retry with exponential backoff
async function retry(fn, attempts = 3, baseDelay = 500) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < attempts - 1) {
        await sleep(baseDelay * Math.pow(2, i));
      }
    }
  }
  throw lastError;
}

// Sanitize HTML/text
function sanitizeText(htmlOrText, maxLength = 4000) {
  const text = htmlOrText
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.slice(0, maxLength);
}

// Extract hostname from URL
function getHostname(url) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return 'unknown';
  }
}

// Dedupe URLs by hostname
function dedupeByHostname(urls) {
  const seen = new Set();
  const result = [];
  for (const url of urls) {
    const host = getHostname(url);
    if (!seen.has(host)) {
      seen.add(host);
      result.push(url);
    }
  }
  return result;
}

/* ---------- GOOGLE SEARCH (Simple) ---------- */

async function searchGoogle(query, maxResults = 6) {
  // Simple search - you can replace with Google CSE API if needed
  // For now, we'll use the URLs from the article if available
  // Or you can integrate Google Custom Search API here
  console.log('🔍 Search query:', query);
  
  // Placeholder - in production, use Google CSE API or SerpAPI
  return [];
}

/* ---------- WEB SCRAPING ---------- */

async function extractArticleContent(url) {
  try {
    console.log(`📄 Extracting: ${url}`);
    const response = await withTimeout(
      axios.get(url, { 
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }),
      15000
    );

    const $ = cheerio.load(response.data);
    
    // Remove unwanted elements
    $('script, style, nav, header, footer, aside, .ad, .advertisement').remove();
    
    // Extract title
    const title = $('h1').first().text().trim() || 
                  $('title').text().trim() || 
                  'No Title';
    
    // Extract main content
    let content = '';
    $('article p, .article-content p, .post-content p, main p').each((i, el) => {
      content += $(el).text() + '\n';
    });
    
    // Fallback: all paragraphs
    if (content.length < 200) {
      $('p').each((i, el) => {
        content += $(el).text() + '\n';
      });
    }

    return {
      url,
      title,
      content: sanitizeText(content, 6000),
      success: content.length > 200
    };
  } catch (error) {
    console.error(`❌ Extract failed for ${url}:`, error.message);
    return {
      url,
      title: '',
      content: '',
      success: false
    };
  }
}

async function extractMultipleSources(urls) {
  const results = await Promise.allSettled(
    urls.map(url => extractArticleContent(url))
  );
  
  return results
    .filter(r => r.status === 'fulfilled' && r.value.success)
    .map(r => r.value);
}

/* ---------- DEEPSEEK API ---------- */

async function callDeepSeekJSON(messages, model = 'deepseek-chat') {
  try {
    const response = await withTimeout(
      axios.post(DEEPSEEK_BASE_URL, {
        model,
        messages,
        temperature: 0.2,
        response_format: { type: 'json_object' }
      }, {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }),
      30000
    );

    const content = response.data?.choices?.[0]?.message?.content || '{}';
    return JSON.parse(content);
  } catch (error) {
    console.error('❌ DeepSeek API error:', error.message);
    throw new Error(`DeepSeek failed: ${error.message}`);
  }
}

/* ---------- OPENAI API ---------- */

async function callOpenAI(systemPrompt, userPrompt, options = {}) {
  try {
    console.log('🤖 OpenAI API call started...');
    console.log('📊 Temperature:', options.temperature ?? 0.97);
    
    const response = await withTimeout(
      axios.post(OPENAI_BASE_URL, {
        model: options.model || "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: options.temperature ?? 0.97,
        max_tokens: options.max_tokens ?? 5000,
        top_p: options.top_p ?? 0.88,
        frequency_penalty: options.frequency_penalty ?? 0.5,
        presence_penalty: options.presence_penalty ?? 0.45,
      }, {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }),
      120000
    );
    
    const content = response.data?.choices?.[0]?.message?.content || "";
    console.log('✅ OpenAI API call completed, content length:', content.length);
    return content;
  } catch (error) {
    console.error('❌ OpenAI API error:', error.message);
    throw error;
  }
}

/* ---------- FACT EXTRACTION PROMPT (DEEPSEEK) ---------- */

function buildFactExtractionPrompt(title, description, sources) {
  const sourcesText = sources.map((s, i) => 
    `[${i + 1}] ${s.title || 'Untitled'} — ${s.url}\nCONTENT: ${s.content.slice(0, 2000)}`
  ).join('\n\n');

  return {
    system: `You are a meticulous fact extractor for cricket journalism.
- Extract ONLY verifiable, neutral facts from the sources below
- Attach source IDs like [1], [2] to each fact
- Identify contradictions between sources as "CONFLICT: <text> [ids]"
- Focus on: scores, player stats, quotes, match details, team info
- Keep response under 1500 characters
Return STRICT JSON:
{"facts":[{"text":"...", "sources":[1,2]}], "conflicts":[{"text":"...","sources":[1,3]}]}`,

    user: `TOPIC: ${title}
DESCRIPTION: ${description}

SOURCES:
${sourcesText}

Extract facts now.`
  };
}

/* ---------- HINDI ARTICLE GENERATION PROMPT (OPENAI) ---------- */

function buildHindiArticlePrompt(title, description, factDigest, citations) {
  return {
    system: `तुम एक भारतीय क्रिकेट पत्रकार हो जो देर रात मैच के बाद की कहानी लिख रहे हो। तुम थके हुए हो लेकिन passionate हो, fast type कर रहे हो, emotions first और grammar second। तुम ऐसे लिखते हो जैसे तुम वहां मौजूद थे - आधा देखते हुए, आधा नोट्स लिखते हुए।

तुम्हारा लक्ष्य:
- Natural, human-like Hindi में लिखो
- Emotional, थोड़ा messy, raw, और honest
- AI detection tools पर <10% score करना है
- Casual language, broken sentences allowed
- "यार", "भाई", "अरे", "वाह" जैसे words naturally use करो
- English cricket terms रखो (century, wicket, runs)`,

    user: `ORIGINAL NEWS:
Title: ${title}
Description: ${description}

VERIFIED FACTS (from multiple sources):
${JSON.stringify(factDigest, null, 2)}

CITATIONS:
${citations}

INSTRUCTIONS:
1. पूरा article Hindi में लिखो (cricket terms English में रख सकते हो)
2. Natural, conversational tone - जैसे किसी दोस्त को बता रहे हो
3. Short paragraphs, varied lengths
4. Emotional reactions add करो ("यार, क्या खेल दिखाया!", "अरे वाह!")
5. कुछ sentences छोटे, कुछ लंबे run-on sentences
6. Facts accurate रखो but presentation casual
7. HTML format में return करो:
- <h1> main title के लिए
- <h2> subheadings के लिए (3-4)
- <p> paragraphs के लिए
- <strong> player names और important stats के लिए
- <blockquote> quotes के लिए
8. End में "स्रोत:" section add करो with [1], [2] citations

HTML body content लिखो (no <html>, <head>, <body> tags):`
  };
}

/* ---------- MAIN PROCESSING FUNCTION ---------- */

async function processCricketNewsWithDeepSeek(input, options = {}) {
  const startTime = Date.now();
  const {
    useMultiSource = true,
    maxSources = 5,
    language = 'hindi' // 'hindi' or 'english'
  } = options;
  
  try {
    console.log('🏏 [DeepSeek + OpenAI] Processing:', input.title);
    
    // Validation
    if (!input.title || input.title.length < 10) {
      throw new Error('Title too short');
    }
    if (!input.description || input.description.length < 20) {
      throw new Error('Description too short');
    }
    if (!input.content || input.content.length < 300) {
      throw new Error('Content too short');
    }

    let factDigest;
    let citations = '';

    if (useMultiSource && DEEPSEEK_API_KEY) {
      console.log('📡 Multi-source fact extraction enabled');
      
      // STEP 1: Search for related articles (optional - can skip if you don't have Google CSE)
      // For now, we'll just use the original article as primary source
      const sources = [{
        url: input.url || 'original',
        title: input.title,
        content: sanitizeText(input.content, 6000),
        success: true
      }];

      console.log(`✅ Using ${sources.length} source(s)`);

      // STEP 2: Extract facts using DeepSeek
      console.log('🔬 Extracting facts with DeepSeek...');
      const factPrompt = buildFactExtractionPrompt(
        input.title,
        input.description,
        sources
      );

      factDigest = await retry(() => 
        callDeepSeekJSON([
          { role: 'system', content: factPrompt.system },
          { role: 'user', content: factPrompt.user }
        ])
      );

      console.log('✅ Facts extracted:', factDigest);

      // Build citations
      citations = sources.map((s, i) => 
        `[${i + 1}] ${s.title || 'Source'} - ${s.url}`
      ).join('\n');

    } else {
      // Fallback: Simple fact extraction without DeepSeek
      console.log('📝 Using simple mode (no DeepSeek)');
      factDigest = {
        facts: [
          { text: input.description, sources: [1] },
          { text: input.content.slice(0, 500), sources: [1] }
        ],
        conflicts: []
      };
      citations = `[1] ${input.title} - ${input.url || 'original source'}`;
    }

    // STEP 3: Generate Hindi article with OpenAI
    console.log('✍️ Generating Hindi article with OpenAI...');
    
    const articlePrompt = buildHindiArticlePrompt(
      input.title,
      input.description,
      factDigest,
      citations
    );

    const articleHTML = await retry(() =>
      callOpenAI(
        articlePrompt.system,
        articlePrompt.user,
        {
          temperature: 0.97,
          max_tokens: 5000,
          top_p: 0.88,
          frequency_penalty: 0.5,
          presence_penalty: 0.45
        }
      )
    );

    console.log('✅ Hindi article generated successfully');

    return {
      success: true,
      readyToPublishArticle: articleHTML,
      factDigest,
      processingTime: Date.now() - startTime,
      metadata: {
        sourcesUsed: useMultiSource ? 'multi-source' : 'single-source',
        language: language,
        modelCombination: 'DeepSeek + OpenAI'
      }
    };

  } catch (error) {
    console.error('❌ Processing error:', error);
    return {
      success: false,
      error: error.message,
      processingTime: Date.now() - startTime
    };
  }
}

/* ---------- SIMPLE MODE (Current OpenAI only) ---------- */

async function processCricketNewsOpenAI(input, options = {}) {
  const startTime = Date.now();
  
  try {
    console.log('🏏 [OpenAI Only] Processing:', input.title);
    
    if (!input.title || input.title.length < 10) {
      throw new Error('Title too short');
    }
    if (!input.description || input.description.length < 20) {
      throw new Error('Description too short');
    }
    if (!input.content || input.content.length < 300) {
      throw new Error('Content too short');
    }

    // Simple Hindi conversion prompt
    const userPrompt = `
ORIGINAL CRICKET NEWS (English):
Title: ${input.title}
Description: ${input.description}
Content: ${input.content}

TASK: Convert this to a natural, conversational Hindi article.

STYLE:
- Write like a passionate cricket fan telling a friend
- Use emotional expressions: "यार", "अरे", "वाह", "भाई"
- Keep cricket terms in English (century, wicket, runs, over)
- Short paragraphs, varied sentence length
- Casual, human tone - NOT formal journalism
- Add reactions and commentary

FORMAT:
- HTML only (no <html>, <head>, <body>)
- <h1> for main title (Hindi)
- <h2> for 3-4 subheadings
- <p> for paragraphs
- <strong> for player names and stats
- <blockquote> for important quotes

Write now - pure HTML body content:`;

    const systemPrompt = `तुम एक भारतीय क्रिकेट पत्रकार हो जो देर रात match report लिख रहे हो। Passionate हो, थके हुए हो, fast type कर रहे हो। Natural Hindi में लिखो with emotions.`;

    const articleHTML = await callOpenAI(systemPrompt, userPrompt, {
      temperature: 0.97,
      max_tokens: 5000,
      top_p: 0.88,
      frequency_penalty: 0.5,
      presence_penalty: 0.45
    });

    return {
      success: true,
      readyToPublishArticle: articleHTML,
      processingTime: Date.now() - startTime
    };

  } catch (error) {
    console.error('❌ Processing error:', error);
    return {
      success: false,
      error: error.message,
      processingTime: Date.now() - startTime
    };
  }
}

module.exports = {
  processCricketNewsOpenAI,          // Simple: OpenAI only (current)
  processCricketNewsWithDeepSeek,    // Advanced: DeepSeek + OpenAI
};