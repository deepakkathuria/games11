const axios = require('axios');
require('dotenv').config();
const https = require('https');
const dns = require('dns');

// Import your existing DB pool
const { pollDBPool } = require('./config/db');

// Prefer IPv4 (DO/App Platform pe IPv6 se ETIMEDOUT aata hai kabhi-kabhi)
try { dns.setDefaultResultOrder('ipv4first'); } catch {}
const ipv4Agent = new https.Agent({ family: 4, keepAlive: true });

// simple retry helper
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function getWithRetry(url, opts = {}, tries = 3) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      return await axios.get(url, opts);
    } catch (e) {
      lastErr = e;
      const code = e.response?.status || e.code;
      // retry only for network/5xx/429
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

// GNews API Configuration for Sports
const GNEWS_API_KEY = process.env.GNEWS_API_KEY || "10221c352c3324d296732745fffffe4c";
const GNEWS_BASE_URL = "https://gnews.io/api/v4/search";

class SportsNewsScheduler {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
  }

  // Start continuous sports news fetching
  async startScheduler(intervalMinutes = 30) {
    if (this.isRunning) {
      console.log('Sports Scheduler already running');
      return;
    }

    this.isRunning = true;
    console.log(`Starting sports news scheduler - fetching every ${intervalMinutes} minutes`);

    // Fetch immediately
    await this.fetchAndStoreNews();

    // Then fetch at intervals
    this.intervalId = setInterval(async () => {
      await this.fetchAndStoreNews();
    }, intervalMinutes * 60 * 1000);
  }

  // Stop scheduler
  stopScheduler() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Sports news scheduler stopped');
  }

  // Fetch sports news from GNews API
  async fetchNewsFromAPI() {
    try {
      const url = new URL(GNEWS_BASE_URL);
      url.searchParams.append("q", "sports");
      url.searchParams.append("lang", "en"); // English language
      url.searchParams.append("max", "50");
      url.searchParams.append("expand", "content");
      url.searchParams.append("apikey", GNEWS_API_KEY);

      const response = await getWithRetry(url.toString(), {
        timeout: 45000,
        httpsAgent: ipv4Agent,
        headers: { Accept: 'application/json' },
      });

      // GNews: { totalArticles, articles: [...] }
      if (response.data && response.data.articles) {
        return response.data.articles.filter(article => {
          // Combine description and content for better filtering
          const fullText = (article.description || '') + ' ' + (article.content || '');
          const hasEnoughContent = fullText.length > 200;
          
          return (
            (article.content || article.description) &&
            hasEnoughContent &&
            article.title &&
            article.title.length > 10 &&
            !article.title.toLowerCase().includes('betting') &&
            !article.title.toLowerCase().includes('gambling')
          );
        });
      }
      return [];
    } catch (error) {
      console.error('Error fetching sports news from API:', error);
      return [];
    }
  }

  // Store sports news in database
  async storeNewsInDB(articles) {
    if (articles.length === 0) return;

    try {
      for (const article of articles) {
        // Check if article already exists
        const [existing] = await pollDBPool.query(
          'SELECT id FROM sports_news_openai WHERE title = ? AND source_url = ?',
          [article.title, article.url]
        );

        if (existing.length === 0) {
          // Combine description and content for full text
          const fullContent = (article.description || '') + '\n\n' + (article.content || '');
          const wordCount = fullContent.trim() ? fullContent.split(/\s+/).length : 0;
          
          // Insert new article
          await pollDBPool.query(
            `INSERT INTO sports_news_openai 
             (title, description, content, source_name, source_url, published_at, published_at_iso, word_count, is_valid) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              article.title,
              article.description || '',
              fullContent.trim() || article.content || '',
              article.source?.name || 'Unknown',
              article.url,
              new Date(article.publishedAt),
              article.publishedAt,
              wordCount,
              true
            ]
          );
          console.log(`Stored Sports: ${article.title.substring(0, 50)}...`);
        }
      }
    } catch (error) {
      console.error('Error storing sports news in database:', error);
    }
  }

  // Main function to fetch and store sports news
  async fetchAndStoreNews() {
    console.log('Fetching latest sports news...');
    const articles = await this.fetchNewsFromAPI();
    await this.storeNewsInDB(articles);
    console.log(`Fetched and stored ${articles.length} sports articles`);
  }

  // Get stored sports news from database
  async getStoredNews(limit = 100, offset = 0) {
    try {
      const [rows] = await pollDBPool.query(
        `SELECT * FROM sports_news_openai 
         WHERE is_valid = true 
         ORDER BY published_at DESC, created_at DESC 
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      return rows;
    } catch (error) {
      console.error('Error getting stored sports news:', error);
      return [];
    }
  }

  // Mark sports article as processed
  async markAsProcessed(articleId, readyArticle) {
    try {
      await pollDBPool.query(
        'UPDATE sports_news_openai SET openai_processed = true, processed_at = NOW(), openai_ready_article = ? WHERE id = ?',
        [readyArticle, articleId]
      );
    } catch (error) {
      console.error('Error marking sports article as processed:', error);
    }
  }
}

module.exports = SportsNewsScheduler;
