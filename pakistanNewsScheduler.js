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

// GNews API Configuration for Pakistan
const GNEWS_API_KEY = process.env.GNEWS_API_KEY || "fe7ae24f706a3904399790443a6b2034";
const GNEWS_BASE_URL = "https://gnews.io/api/v4/search";

class PakistanNewsScheduler {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
  }

  // Start continuous news fetching
  async startScheduler(intervalMinutes = 30) {
    if (this.isRunning) {
      console.log('Pakistan News Scheduler already running');
      return;
    }

    this.isRunning = true;
    console.log(`Starting Pakistan news scheduler - fetching every ${intervalMinutes} minutes`);

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
    console.log('Pakistan news scheduler stopped');
  }

  // Fetch news from GNews API (Pakistan specific)
  async fetchNewsFromAPI() {
    try {
      const url = new URL(GNEWS_BASE_URL);
      url.searchParams.append("q", "cricket");
      url.searchParams.append("lang", "en");
      url.searchParams.append("country", "pk"); // Pakistan filter
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
        return response.data.articles.filter(article =>
          article.content &&
          article.content.length > 300 &&
          article.title &&
          article.title.length > 10 &&
          !article.title.toLowerCase().includes('betting') &&
          !article.title.toLowerCase().includes('gambling')
        );
      }
      return [];
    } catch (error) {
      console.error('Error fetching Pakistan news from API:', error);
      return [];
    }
  }

  // Store news in database
  async storeNewsInDB(articles) {
    if (articles.length === 0) return;

    try {
      for (const article of articles) {
        // Check if article already exists
        const [existing] = await pollDBPool.query(
          'SELECT id FROM pakistan_cricket_news WHERE title = ? AND source_url = ?',
          [article.title, article.url]
        );

        if (existing.length === 0) {
          // Insert new article
          await pollDBPool.query(
            `INSERT INTO pakistan_cricket_news 
             (title, description, content, source_name, source_url, published_at, word_count, is_valid) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              article.title,
              article.description,
              article.content,
              article.source?.name || 'Unknown',
              article.url,
              new Date(article.publishedAt),
              article.content ? article.content.split(' ').length : 0,
              true
            ]
          );
          console.log(`Stored Pakistan news: ${article.title.substring(0, 50)}...`);
        }
      }
    } catch (error) {
      console.error('Error storing Pakistan news in database:', error);
    }
  }

  // Main function to fetch and store news
  async fetchAndStoreNews() {
    console.log('Fetching latest Pakistan cricket news...');
    const articles = await this.fetchNewsFromAPI();
    await this.storeNewsInDB(articles);
    console.log(`Fetched and stored ${articles.length} Pakistan articles`);
  }

  // Get stored news from database
  async getStoredNews(limit = 100, offset = 0) {
    try {
      const [rows] = await pollDBPool.query(
        `SELECT * FROM pakistan_cricket_news 
         WHERE is_valid = true 
         ORDER BY published_at DESC, fetched_at DESC 
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      return rows;
    } catch (error) {
      console.error('Error getting stored Pakistan news:', error);
      return [];
    }
  }

  // Mark article as processed
  async markAsProcessed(articleId, readyArticle) {
    try {
      await pollDBPool.query(
        'UPDATE pakistan_cricket_news SET processed = true, processed_at = NOW(), ready_article = ? WHERE id = ?',
        [readyArticle, articleId]
      );
    } catch (error) {
      console.error('Error marking Pakistan article as processed:', error);
    }
  }
}

module.exports = PakistanNewsScheduler;