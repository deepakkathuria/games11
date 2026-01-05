const axios = require('axios');
require('dotenv').config();
const https = require('https');
const dns = require('dns');

// Import your existing DB pool
const { pollDBPool } = require('./config/db');

// Prefer IPv4
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
const GNEWS_API_KEY = process.env.GNEWS_API_KEY || "a8ee6e2ef2fedf06117bae6d6babcff1";
const GNEWS_BASE_URL = "https://gnews.io/api/v4/search";

// Brand-specific queries (Worldwide - no country filter)
const BRAND_QUERIES = {
  'Hyundai': 'Hyundai (launch OR debut OR price)',
  'Tata Motors': 'Tata Motors (launch OR debut OR price)',
  'Maruti Suzuki': 'Maruti Suzuki (launch OR debut OR price)',
  'Mahindra': 'Mahindra (launch OR debut OR price)',
  'BYD': 'BYD (launch OR debut OR price)',
  'Tesla': 'Tesla (launch OR debut OR price)',
  'Toyota': 'Toyota (launch OR debut OR price)',
  'Honda': 'Honda (launch OR debut OR price)',
  'Ford': 'Ford (launch OR debut OR price)',
  'Kia': 'Kia (launch OR debut OR price)'
};

class BrandCarNewsScheduler {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
  }

  // Start continuous brand car news fetching
  async startScheduler(intervalMinutes = 10) {
    if (this.isRunning) {
      console.log('Brand Car Scheduler already running');
      return;
    }

    this.isRunning = true;
    console.log(`Starting brand car news scheduler - fetching every ${intervalMinutes} minutes`);

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
    console.log('Brand car news scheduler stopped');
  }

  // Fetch brand car news from GNews API (Worldwide - no country filter)
  async fetchBrandNewsFromAPI(brandName, query) {
    try {
      const url = new URL(GNEWS_BASE_URL);
      url.searchParams.append("q", query);
      url.searchParams.append("lang", "en");
      // No country filter - worldwide news
      url.searchParams.append("max", "10");
      url.searchParams.append("expand", "content");
      url.searchParams.append("apikey", GNEWS_API_KEY);

      const response = await getWithRetry(url.toString(), {
        timeout: 45000,
        httpsAgent: ipv4Agent,
        headers: { Accept: 'application/json' },
      });

      if (response.data && response.data.articles) {
        return response.data.articles.filter(article => {
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
      console.error(`Error fetching ${brandName} news from API:`, error.message);
      return [];
    }
  }

  // Store brand car news in database
  async storeBrandNewsInDB(brandName, articles) {
    if (articles.length === 0) return;

    try {
      let storedCount = 0;
      for (const article of articles) {
        // Check if article already exists
        const [existing] = await pollDBPool.query(
          'SELECT id FROM brand_car_news WHERE brand_name = ? AND title = ? AND source_url = ?',
          [brandName, article.title, article.url]
        );

        if (existing.length === 0) {
          // Combine description and content for full text
          const fullContent = (article.description || '') + '\n\n' + (article.content || '');
          const wordCount = fullContent.trim() ? fullContent.split(/\s+/).length : 0;
          
          // Insert new article
          await pollDBPool.query(
            `INSERT INTO brand_car_news 
             (brand_name, title, description, content, source_name, source_url, published_at, published_at_iso, word_count, is_valid) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              brandName,
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
          storedCount++;
          console.log(`Stored ${brandName}: ${article.title.substring(0, 50)}...`);
        }
      }
      console.log(`✅ Stored ${storedCount} new ${brandName} articles`);
    } catch (error) {
      console.error(`Error storing ${brandName} news in database:`, error);
    }
  }

  // Main function to fetch and store all brand news
  async fetchAndStoreNews() {
    console.log('🚗 Fetching latest brand car news...');
    let totalFetched = 0;
    
    for (const [brandName, query] of Object.entries(BRAND_QUERIES)) {
      try {
        console.log(`\n📰 Fetching ${brandName} news...`);
        const articles = await this.fetchBrandNewsFromAPI(brandName, query);
        console.log(`   Found ${articles.length} articles`);
        await this.storeBrandNewsInDB(brandName, articles);
        totalFetched += articles.length;
        
        // Small delay between brands to avoid rate limiting
        await sleep(1000);
      } catch (error) {
        console.error(`Error processing ${brandName}:`, error.message);
      }
    }
    
    console.log(`\n✅ Fetched and stored news from all brands. Total: ${totalFetched} articles`);
  }

  // Get stored brand car news from database
  async getStoredNews(limit = 100, offset = 0, brandName = null) {
    try {
      let query = `SELECT * FROM brand_car_news 
                   WHERE is_valid = true`;
      const params = [];
      
      if (brandName) {
        query += ` AND brand_name = ?`;
        params.push(brandName);
      }
      
      query += ` ORDER BY published_at DESC, created_at DESC 
                 LIMIT ? OFFSET ?`;
      params.push(limit, offset);
      
      const [rows] = await pollDBPool.query(query, params);
      return rows;
    } catch (error) {
      console.error('Error getting stored brand car news:', error);
      return [];
    }
  }

  // Mark brand article as processed
  async markAsProcessed(articleId, readyArticle) {
    try {
      await pollDBPool.query(
        'UPDATE brand_car_news SET openai_processed = true, processed_at = NOW(), openai_ready_article = ? WHERE id = ?',
        [readyArticle, articleId]
      );
    } catch (error) {
      console.error('Error marking brand article as processed:', error);
    }
  }
}

module.exports = BrandCarNewsScheduler;

