




// newsSheduler.js
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

// GNews API Configuration
const GNEWS_API_KEY = process.env.GNEWS_API_KEY || "10221c352c3324d296732745fffffe4c";
const GNEWS_BASE_URL = "https://gnews.io/api/v4/search";

class NewsScheduler {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
  }

  // Start continuous news fetching
  async startScheduler(intervalMinutes = 30) {
    if (this.isRunning) {
      console.log('Scheduler already running');
      return;
    }

    this.isRunning = true;
    console.log(`Starting news scheduler - fetching every ${intervalMinutes} minutes`);

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
    console.log('News scheduler stopped');
  }

  // Fetch news from GNews API
  async fetchNewsFromAPI() {
    try {
      // Get current date and 7 days ago for fresh news
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      const fromDate = sevenDaysAgo.toISOString().split('T')[0]; // YYYY-MM-DD
      const toDate = today.toISOString().split('T')[0];
      
      console.log(`📰 Fetching cricket news from ${fromDate} to ${toDate} using API key: ${GNEWS_API_KEY.substring(0, 8)}...`);
      
      const url = new URL(GNEWS_BASE_URL);
      url.searchParams.append("q", "cricket");
      url.searchParams.append("lang", "en");
      url.searchParams.append("max", "50");
      url.searchParams.append("expand", "content");
      url.searchParams.append("from", fromDate);
      url.searchParams.append("to", toDate);
      url.searchParams.append("sortby", "publishedAt"); // Sort by latest first
      url.searchParams.append("apikey", GNEWS_API_KEY);

      const response = await getWithRetry(url.toString(), {
        timeout: 45000,
        httpsAgent: ipv4Agent,
        headers: { Accept: 'application/json' },
      });

      // GNews: { totalArticles, articles: [...] }
      if (response.data && response.data.articles) {
        const filtered = response.data.articles.filter(article => {
          // Check content quality
          if (!article.content || article.content.length < 300) return false;
          if (!article.title || article.title.length < 10) return false;
          if (article.title.toLowerCase().includes('betting')) return false;
          if (article.title.toLowerCase().includes('gambling')) return false;
          
          // Check if article is recent (within last 7 days)
          if (article.publishedAt) {
            const articleDate = new Date(article.publishedAt);
            const daysDiff = (today.getTime() - articleDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysDiff > 7) {
              console.log(`⏭️ Skipping old article: ${article.title.substring(0, 50)} (${Math.floor(daysDiff)} days old)`);
              return false;
            }
          }
          
          return true;
        });
        
        console.log(`✅ Filtered ${filtered.length} fresh articles from ${response.data.articles.length} total`);
        return filtered;
      }
      return [];
    } catch (error) {
      console.error('Error fetching news from API:', error);
      return [];
    }
  }

  // Store news in database using your existing pollDBPool
  async storeNewsInDB(articles) {
    if (articles.length === 0) return;

    try {
      for (const article of articles) {
        // Check if article already exists
        const [existing] = await pollDBPool.query(
          'SELECT id FROM cricket_news WHERE title = ? AND source_url = ?',
          [article.title, article.url]
        );

        if (existing.length === 0) {
          // Insert new article
          await pollDBPool.query(
            `INSERT INTO cricket_news 
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
          console.log(`Stored: ${article.title.substring(0, 50)}...`);
        }
      }
    } catch (error) {
      console.error('Error storing news in database:', error);
    }
  }

  // Main function to fetch and store news
  async fetchAndStoreNews() {
    console.log('Fetching latest cricket news...');
    const articles = await this.fetchNewsFromAPI();
    await this.storeNewsInDB(articles);
    console.log(`Fetched and stored ${articles.length} articles`);
  }

  // Get stored news from database using your existing pollDBPool
  async getStoredNews(limit = 100, offset = 0) {
    try {
      const [rows] = await pollDBPool.query(
        `SELECT * FROM cricket_news 
         WHERE is_valid = true 
         ORDER BY published_at DESC, fetched_at DESC 
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      return rows;
    } catch (error) {
      console.error('Error getting stored news:', error);
      return [];
    }
  }

  // Mark article as processed using your existing pollDBPool
  async markAsProcessed(articleId, readyArticle) {
    try {
      await pollDBPool.query(
        'UPDATE cricket_news SET processed = true, processed_at = NOW(), ready_article = ? WHERE id = ?',
        [readyArticle, articleId]
      );
    } catch (error) {
      console.error('Error marking article as processed:', error);
    }
  }
}

module.exports = NewsScheduler;
