const { pollDBPool } = require('./config/db');
const { 
  fetchHindiAllNews, 
  filterHindiAllNewsArticles, 
  getHindiAllNewsArticleSummary, 
  validateHindiAllNewsArticleForProcessing 
} = require('./hindiAllNewsFetcher');

class HindiAllNewsScheduler {
  constructor() {
    this.isRunning = false;
    this.schedulerInterval = null;
  }

  /**
   * Start the scheduler to fetch news periodically
   */
  startScheduler(intervalMinutes = 30) {
    if (this.isRunning) {
      console.log('Hindi All News Scheduler is already running');
      return;
    }

    this.isRunning = true;
    console.log(`🚀 Starting Hindi All News Scheduler - fetching every ${intervalMinutes} minutes`);

    // Run immediately once
    this.fetchAndStoreNews();

    // Then run on schedule
    this.schedulerInterval = setInterval(() => {
      this.fetchAndStoreNews();
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Stop the scheduler
   */
  stopScheduler() {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
    this.isRunning = false;
    console.log('🛑 Hindi All News Scheduler stopped');
  }

  /**
   * Fetch news from GNews API and store in database
   */
  async fetchAndStoreNews() {
    try {
      console.log('📰 Starting Hindi All News fetch...');

      // Fetch news from GNews API
      const newsResult = await fetchHindiAllNews({
        query: "news",
        lang: "hi",
        country: "in",
        max: 25
      });

      if (!newsResult.success) {
        console.error('❌ Failed to fetch Hindi all news:', newsResult.error);
        return;
      }

      console.log(`📊 Fetched ${newsResult.articles.length} Hindi all news articles`);

      // Filter articles
      const filteredArticles = filterHindiAllNewsArticles(newsResult.articles, {
        minContentLength: 300,
        maxAge: 7
      });

      console.log(`🔍 ${filteredArticles.length} articles passed filtering`);

      let storedCount = 0;
      let skippedCount = 0;

      // Store each article in database
      for (const article of filteredArticles) {
        try {
          // Check if article already exists
          const [existing] = await pollDBPool.query(
            'SELECT id FROM hindi_general_news WHERE source_url = ?',
            [article.url]
          );

          if (existing.length > 0) {
            skippedCount++;
            continue;
          }

          // Validate article
          const validation = validateHindiAllNewsArticleForProcessing(article);
          if (!validation.isValid) {
            console.log(`⚠️ Skipping invalid article: ${validation.errors.join(', ')}`);
            skippedCount++;
            continue;
          }

          // Store in database
          await pollDBPool.query(
            `INSERT INTO hindi_general_news 
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

          storedCount++;
          console.log(`✅ Stored: ${article.title.substring(0, 50)}...`);

        } catch (error) {
          console.error(`❌ Error storing article: ${error.message}`);
          skippedCount++;
        }
      }

      console.log(`🎉 Hindi All News fetch completed: ${storedCount} stored, ${skippedCount} skipped`);

    } catch (error) {
      console.error('❌ Hindi All News fetch error:', error);
    }
  }

  /**
   * Get stored news from database
   */
  async getStoredNews(limit = 25, offset = 0) {
    try {
      const [rows] = await pollDBPool.query(
        `SELECT * FROM hindi_general_news 
         WHERE is_valid = true 
         ORDER BY published_at DESC, fetched_at DESC 
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      return rows;
    } catch (error) {
      console.error('Error getting stored Hindi all news:', error);
      return [];
    }
  }

  /**
   * Get processed news from database
   */
  async getProcessedNews(limit = 25, offset = 0) {
    try {
      const [rows] = await pollDBPool.query(
        `SELECT * FROM hindi_general_news 
         WHERE processed = true 
         ORDER BY processed_at DESC 
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      return rows;
    } catch (error) {
      console.error('Error getting processed Hindi all news:', error);
      return [];
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      nextRun: this.schedulerInterval ? 'Running on schedule' : 'Not scheduled'
    };
  }
}

module.exports = HindiAllNewsScheduler;
