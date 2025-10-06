const axios = require('axios');
const https = require('https');
const dns = require('dns');

try { dns.setDefaultResultOrder('ipv4first'); } catch {}
const agent = new https.Agent({ family: 4, keepAlive: true });

const GNEWS_API_KEY = process.env.GNEWS_API_KEY || "fe7ae24f706a3904399790443a6b2034";
const GNEWS_BASE_URL = "https://gnews.io/api/v4/search";

/**
 * Fetch Hindi news from GNews API
 */
async function fetchHindiAllNews(options = {}) {
  try {
    const {
      query = "news",
      lang = "hi", // Hindi language
      country = "in",
      max = 25,
      expand = "content"
    } = options;

    const url = new URL(GNEWS_BASE_URL);
    url.searchParams.append("q", query);
    url.searchParams.append("lang", lang);
    url.searchParams.append("country", country);
    url.searchParams.append("max", String(max));
    url.searchParams.append("expand", expand);
    url.searchParams.append("apikey", GNEWS_API_KEY);

    console.log(`📰 Fetching Hindi all news from GNews API: ${url.toString()}`);

    const response = await axios.get(url.toString(), {
      timeout: 45000,
      httpsAgent: agent,
      headers: { Accept: 'application/json' },
    });
    const data = response.data;

    console.log(`✅ Fetched ${data.articles?.length || 0} Hindi all news articles`);

    return {
      success: true,
      totalArticles: data.totalArticles,
      articles: data.articles || [],
      fetchedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error("❌ Error fetching Hindi all news:", error);
    return {
      success: false,
      error: error.message,
      articles: [],
      totalArticles: 0
    };
  }
}

/**
 * Filter Hindi articles based on criteria
 */
function filterHindiAllNewsArticles(articles, filters = {}) {
  const { 
    minContentLength = 500, 
    excludeKeywords = ["betting", "gambling", "casino", "adult", "porn"],
    includeKeywords = [],
    maxAge = 7 // days
  } = filters;

  const filtered = articles.filter(article => {
    if (article.content && article.content.length < minContentLength) return false;
    
    const content = (article.title + " " + article.description + " " + (article.content || "")).toLowerCase();
    
    if (excludeKeywords.some(k => content.includes(k.toLowerCase()))) return false;
    if (includeKeywords.length > 0 && !includeKeywords.some(k => content.includes(k.toLowerCase()))) return false;
    
    const articleDate = new Date(article.publishedAt);
    const daysDiff = (new Date() - articleDate) / (1000 * 60 * 60 * 24);
    if (daysDiff > maxAge) return false;
    
    return true;
  });

  console.log(`🔍 Filtered ${filtered.length} Hindi all news articles from ${articles.length} total`);
  return filtered;
}

/**
 * Get article summary for preview
 */
function getHindiAllNewsArticleSummary(article) {
  const content = article.content || article.description || "";
  const maxLength = 200;
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + "...";
}

/**
 * Validate article for processing
 */
function validateHindiAllNewsArticleForProcessing(article) {
  const errors = [];
  
  if (!article.title || article.title.length < 10) errors.push("Title too short");
  if (!article.description || article.description.length < 20) errors.push("Description too short");
  if (!article.content || article.content.length < 300) errors.push("Content too short for processing");
  if (!article.url) errors.push("Missing article URL");
  
  return { isValid: errors.length === 0, errors };
}

module.exports = {
  fetchHindiAllNews,
  filterHindiAllNewsArticles,
  getHindiAllNewsArticleSummary,
  validateHindiAllNewsArticleForProcessing
};
