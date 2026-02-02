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
