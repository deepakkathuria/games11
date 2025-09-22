const axios = require('axios');
const https = require('https');
const dns = require('dns');

try { dns.setDefaultResultOrder('ipv4first'); } catch {}
const agent = new https.Agent({ family: 4, keepAlive: true });

const GNEWS_API_KEY = process.env.GNEWS_API_KEY || "10221c352c3324d296732745fffffe4c";
const GNEWS_BASE_URL = "https://gnews.io/api/v4/search";

/**
 * Fetch Hindi cricket news from GNews API
 */
async function fetchHindiCricketNews(options = {}) {
  try {
    const {
      query = "cricket",
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

    const response = await axios.get(url.toString(), {
      timeout: 45000,
      httpsAgent: agent,
      headers: { Accept: 'application/json' },
    });
    const data = response.data;

    return {
      success: true,
      totalArticles: data.totalArticles,
      articles: data.articles || [],
      fetchedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error("❌ Error fetching Hindi cricket news:", error);
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
function filterHindiArticles(articles, filters = {}) {
  const { 
    minContentLength = 500, 
    excludeKeywords = ["betting", "gambling", "casino"], 
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

  return filtered;
}

/**
 * Get Hindi article summary for preview
 */
function getHindiArticleSummary(article) {
  const content = article.content || article.description || "";
  const maxLength = 200;
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + "...";
}

/**
 * Validate Hindi article for processing
 */
function validateHindiArticleForProcessing(article) {
  const errors = [];
  if (!article.title || article.title.length < 10) errors.push("Title too short");
  if (!article.description || article.description.length < 20) errors.push("Description too short");
  if (!article.content || article.content.length < 300) errors.push("Content too short for processing");
  if (!article.url) errors.push("Missing article URL");

  return { isValid: errors.length === 0, errors };
}

module.exports = {
  fetchHindiCricketNews,
  filterHindiArticles,
  getHindiArticleSummary,
  validateHindiArticleForProcessing
};