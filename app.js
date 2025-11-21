require("dotenv").config({ path: __dirname + "/../.env" });
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { getSearchConsoleQueries } = require("./gscService");
const fs = require('fs');

// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const cloudinary = require("cloudinary").v2;

const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const { pollDBPool, userDBPool,internalDBPool } = require("./config/db"); // Import database pools

const Razorpay = require("razorpay");
const crypto = require("crypto");

const multer = require("multer");


const { upload } = require("./config/multer"); // Ensure multer config is set up
const bcrypt = require("bcrypt");
const cheerio = require("cheerio");
const Parser = require("rss-parser");
const { OpenAI } = require("openai");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment-timezone");

//

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

cloudinary.config({
  cloud_name: "dqvntxciv",
  api_key: "495824874469665",
  api_secret: "4OVkfZHoFtifgAZ1ByReediZJGU",
});

const sendInvoiceEmail = require("./utils/sendInvoiceEmail");

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(cors());
app.set("trust proxy", 1); // even for cross-origin frontend/backend

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});

const cron = require("node-cron");
const sendTelegramMessage = require("./utils/sendTelegramMessage");
const { runGscDeepSeekAutomation } = require("./gscAutomation");
const {
  runGscContentRefreshAutomation,
} = require("./runGscContentRefreshAutomation");

const { runGscLowCtrFixAutomation } = require("./runGscLowCtrFixAutomation");

const { runGscRankingWatchdog } = require("./runGscRankingWatchdog");
const runDeepSeekSummaryAutomation = require("./summarizeArticle");


// Add this import at the top
const { runHindiGscDeepSeekAutomation } = require('./hindiGscAutomation');
// Add these imports at the top of your main backend file
const { runHindiGscContentRefreshAutomation } = require('./hindiGscContentRefreshAutomation');
const { runHindiGscLowCtrFixAutomation } = require('./hindiGscLowCtrFixAutomation');
const { runHindiGscRankingWatchdog } = require('./hindiGscRankingWatchdog');
const { runHindiGscContentQueryMatch } = require('./hindiGscContentQueryMatch');
// Add these imports after your existing imports
const { fetchCricketNews, filterArticles, getArticleSummary, validateArticleForProcessing } = require('./newsFetcher');
const NewsScheduler = require('./newsSheduler');
const { processManualInput } = require('./manualInputProcessor');

const { processHindiCricketNewsWithOpenAI } = require('./hindiCricketNewsProcessor');
// ⬇️ ADD THESE
// const {
//   generateWithDeepSeek,
//   buildPrePublishPrompt,
//   buildRewriteBodyHtmlPrompt,
//   parsePrePublishTextToJSON,
//   buildHtmlDocument,
//   fetchCricketStats,
//   generateExpertOpinion,
//   generateSocialMediaReactions,
// } = require("./prepublish");

// const {
//   generateWithDeepSeek,
//   buildPrePublishPrompt,
//   buildRewriteBodyHtmlPrompt,
//   parsePrePublishTextToJSON,
//   buildHtmlDocument,
//   fetchCricketStats,
//   generateExpertOpinion,
//   generateSocialMediaReactions,
//   // NEW IMPORTS
//   extractFactsFromContent,
//   calculateNgramOverlap,
//   generateEnhancedArticle,
// } = require("./prepublish");


const {
  generateWithDeepSeek,
  buildPrePublishPrompt,
  buildRewriteBodyHtmlPrompt,
  parsePrePublishTextToJSON,
  buildHtmlDocument,
  calculateNgramOverlap,
  // NEW 4-STEP PIPELINE IMPORTS
  generate4StepArticle,
  buildPrePublishingChecklistPrompt,
  buildHumanLikeRewritePrompt,
  buildSEOOptimizationPrompt,
  buildFinalFormattingPrompt,


  regenerateWithOpenAI,
  generateWithOpenAI,
  buildCricketAddictorPrompt,
} = require("./prepublish");

// Initialize news scheduler
const newsScheduler = new NewsScheduler();
newsScheduler.startScheduler(1); // Fetch every 30 minutes

// Add these imports at the top
const HindiNewsScheduler = require('./hindiNewsScheduler');
const { fetchHindiCricketNews, filterHindiArticles, getHindiArticleSummary, validateHindiArticleForProcessing } = require('./hindiNewsFetcher');
const { processHindiManualInput } = require('./hindiManualInputProcessor');
const { fetchAllNews, filterAllNewsArticles, getAllNewsArticleSummary, validateAllNewsArticleForProcessing } = require('./allNewsFetcher');
const AllNewsScheduler = require('./allNewsScheduler');
const { processAllNewsManualInput, generateEnglishHeadline, generateEnglishMetaDescription } = require('./allManualInputProcessor');
const { processAllNewsOpenAI, generateOpenAIHeadline, generateOpenAIMetaDescription } = require('./allOpenAIProcessor');

// Initialize Hindi news scheduler
const hindiNewsScheduler = new HindiNewsScheduler();
hindiNewsScheduler.startScheduler(1); // Fetch every 30 minutes

// Initialize All News scheduler
const allNewsScheduler = new AllNewsScheduler();
allNewsScheduler.startScheduler(30); //


// Add this import at the top
const { generateViralContent } = require('./viralContentGenerator');
const { fetchHindiAllNews, filterHindiAllNewsArticles, getHindiAllNewsArticleSummary, validateHindiAllNewsArticleForProcessing } = require('./hindiAllNewsFetcher');
const HindiAllNewsScheduler = require('./hindiAllNewsScheduler');
const { processHindiAllNewsManualInput, generateHindiAllNewsHeadline, generateHindiAllNewsMetaDescription } = require('./hindiAllManualInputProcessor');

// ✅ Add this initialization (around line 130-140)
// Initialize Hindi All News scheduler
const hindiAllNewsScheduler = new HindiAllNewsScheduler();
hindiAllNewsScheduler.startScheduler(30); // Fetch every 30 minutes


const PakistanNewsScheduler = require('./pakistanNewsScheduler');
const pakistanNewsScheduler = new PakistanNewsScheduler();

// Pakistan Manual Input Processor
const { processPakistanManualInput } = require('./pakistanManualInputProcessor');
const { 
  processCricketNewsOpenAI,
  processCricketNewsDeepSeek, 
  generateCricketHeadline, 
  generateCricketMetaDescription,
  buildCricketHtmlDocument
} = require('./cricketOpenAIProcessor');

const { 
  processHindiCricketNewsOpenAI, 
  generateHindiCricketHeadline, 
  generateHindiCricketMetaDescription,
  buildHindiCricketHtmlDocument
} = require('./hindiCricketOpenAIProcessor');

const {
  processHindiCricketNewsDeepSeek,
  generateHindiCricketHeadlineDeepSeek,
  generateHindiCricketMetaDescriptionDeepSeek,
  buildHindiCricketHtmlDocument: buildHindiCricketHtmlDocumentDeepSeek
} = require('./hindiCricketDeepSeekProcessor');

// Automobile News Scheduler
const AutomobileNewsScheduler = require('./automobileNewsScheduler');
const { processAutomobileNewsOpenAI } = require('./automobileOpenAIProcessor');
const automobileScheduler = new AutomobileNewsScheduler();




pakistanNewsScheduler.startScheduler(30); // Every 10 minutes

// Start Automobile News Scheduler
automobileScheduler.startScheduler(10); // Every 30 minutes




// Manual fetch automobile news
app.post('/api/automobile-openai/manual-fetch-news', async (req, res) => {
  try {
    console.log('🚗 Fetching automobile news...');
    await automobileScheduler.fetchAndStoreNews();
    res.json({ 
      success: true, 
      message: 'Automobile news fetched successfully!'
    });
  } catch (error) {
    console.error('Automobile manual fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get stored automobile news
app.get('/api/automobile-openai/stored-news', async (req, res) => {
  try {
    const { limit = 25, offset = 0 } = req.query;
    
    const [rows] = await pollDBPool.query(
      `SELECT * FROM automobile_news_openai 
       WHERE is_valid = true 
       ORDER BY published_at DESC 
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );

    const [countRows] = await pollDBPool.query(
      'SELECT COUNT(*) as total FROM automobile_news_openai WHERE is_valid = true'
    );

    res.json({
      success: true,
      news: rows,
      totalCount: countRows[0].total
    });
  } catch (error) {
    console.error('Error fetching stored automobile news:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get processed automobile news
app.get('/api/automobile-openai/processed-news', async (req, res) => {
  try {
    const { limit = 25, offset = 0 } = req.query;
    
    const [rows] = await pollDBPool.query(
      `SELECT * FROM automobile_news_openai 
       WHERE is_valid = true AND openai_processed = true 
       ORDER BY processed_at DESC 
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );

    const [countRows] = await pollDBPool.query(
      'SELECT COUNT(*) as total FROM automobile_news_openai WHERE is_valid = true AND openai_processed = true'
    );

    res.json({
      success: true,
      news: rows,
      totalCount: countRows[0].total
    });
  } catch (error) {
    console.error('Error fetching processed automobile news:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate automobile article
app.post('/api/automobile-openai/articles/:id/generate', async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pollDBPool.query(
      'SELECT * FROM automobile_news_openai WHERE id = ? AND is_valid = true',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    const article = rows[0];

    // Process with OpenAI (using same processor as Hindi cricket)
    const result = await processAutomobileNewsOpenAI(
      {
        title: article.title,
        description: article.description,
        content: article.content
      },
      {
        language: "en",
        includePrePublishingChecks: true,
        includeHumanLikeRewriting: true,
        includeGoogleOptimization: true,
        avoidAIDetection: true
      }
    );

    if (result.success) {
      await pollDBPool.query(
        `UPDATE automobile_news_openai 
         SET openai_processed = true, 
             processed_at = NOW(), 
             processed_at_iso = ?,
             openai_ready_article = ?, 
             openai_final_title = ?, 
             openai_final_meta = ?, 
             openai_final_slug = ?,
             openai_recommendations = ?
         WHERE id = ?`,
        [
          new Date().toISOString(),
          result.readyToPublishArticle,
          result.recommendations.recommendedTitle,
          result.recommendations.recommendedMeta,
          result.recommendations.recommendedSlug,
          JSON.stringify(result.recommendations),
          id
        ]
      );

      res.json({
        success: true,
        message: 'Automobile article generated successfully!'
      });
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Automobile article generation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start automobile scheduler
app.post('/api/automobile-openai/start-scheduler', async (req, res) => {
  try {
    await automobileScheduler.startScheduler(30); // 30 minutes interval
    res.json({ success: true, message: 'Automobile scheduler started successfully!' });
  } catch (error) {
    console.error('Error starting automobile scheduler:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Stop automobile scheduler
app.post('/api/automobile-openai/stop-scheduler', async (req, res) => {
  try {
    automobileScheduler.stopScheduler();
    res.json({ success: true, message: 'Automobile scheduler stopped successfully!' });
  } catch (error) {
    console.error('Error stopping automobile scheduler:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});







// ========== HINDI CRICKET NEWS APIs (Using same cricket_news table) ==========

// Get stored cricket news for Hindi processing
app.get('/api/hindi-cricket-news/stored-news', async (req, res) => {
  try {
    const { limit = 25, offset = 0 } = req.query;

    const [countResult] = await pollDBPool.query(
      'SELECT COUNT(*) as total FROM cricket_news WHERE is_valid = true'
    );
    const totalCount = countResult[0].total;

    const [rows] = await pollDBPool.query(
      `SELECT * FROM cricket_news
       WHERE is_valid = true
       ORDER BY fetched_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );

    const mapped = rows.map(n => ({
      ...n,
      published_at_iso: toIsoZ(n.published_at),
      processed_at_iso: toIsoZ(n.hindi_processed_at),
    }));

    res.json({
      success: true,
      news: mapped,
      totalCount,
      currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
    });
  } catch (error) {
    console.error('Error getting stored cricket news for Hindi:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Hindi processed cricket news
app.get('/api/hindi-cricket-news/processed-news', async (req, res) => {
  try {
    const { limit = 25, offset = 0 } = req.query;

    const [countResult] = await pollDBPool.query(
      'SELECT COUNT(*) as total FROM cricket_news WHERE hindi_processed = true'
    );
    const totalCount = countResult[0].total;

    const [rows] = await pollDBPool.query(
      `SELECT * FROM cricket_news
       WHERE hindi_processed = true
       ORDER BY hindi_processed_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );

    const mapped = rows.map(n => ({
      ...n,
      published_at_iso: toIsoZ(n.published_at),
      processed_at_iso: toIsoZ(n.hindi_processed_at),
    }));

    res.json({
      success: true,
      news: mapped,
      totalCount,
      currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
    });
  } catch (error) {
    console.error('Error getting Hindi processed cricket news:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate Hindi cricket article from cricket_news table
app.post('/api/hindi-cricket-news/articles/:id/generate', async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pollDBPool.query(
      "SELECT * FROM cricket_news WHERE id = ?",
      [id]
    );
    if (!rows.length) return res.status(404).json({ success:false, error:"Article not found" });
    const article = rows[0];

    // Process with Hindi OpenAI
    console.log(`🏏 Processing article ${id} for Hindi conversion...`);
    const result = await processHindiCricketNewsWithOpenAI({
      title: article.title,
      description: article.description,
      content: article.content
    });

    if (result.success) {
      // Build full HTML document
      const finalHtml = buildHtmlDocument({
        title: result.hindiTitle,
        metaDescription: result.hindiMeta,
        bodyHtml: result.readyToPublishArticle,
      });

      // Update same cricket_news table with Hindi columns
      await pollDBPool.query(
        `UPDATE cricket_news
           SET hindi_processed = 1,
               hindi_processed_at = NOW(),
               hindi_ready_article = ?,
               hindi_final_title = ?,
               hindi_final_meta  = ?,
               hindi_final_slug  = ?
         WHERE id = ?`,
        [finalHtml, result.hindiTitle, result.hindiMeta, result.hindiSlug, id]
      );

      return res.json({
        success: true,
        final: {
          title: result.hindiTitle,
          meta: result.hindiMeta,
          slug: result.hindiSlug,
          html: finalHtml,
        },
        metadata: result.metadata
      });
    } else {
      return res.status(500).json({ success: false, error: result.error });
    }
  } catch (err) {
    console.error("Generate Hindi cricket article error", err);
    return res.status(500).json({ success:false, error: err.message || "Generate failed" });
  }
});






























// Get current prompt configuration
app.get('/api/cricket-openai/prompt-config', async (req, res) => {
  try {
    const [rows] = await pollDBPool.query(
      "SELECT * FROM openai_prompts WHERE prompt_type = 'cricket_human_reporter' LIMIT 1"
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Prompt configuration not found' 
      });
    }
    
    res.json({
      success: true,
      config: rows[0]
    });
  } catch (error) {
    console.error('Error fetching prompt config:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update prompt configuration
app.put('/api/cricket-openai/prompt-config', async (req, res) => {
  try {
    const { 
      system_prompt, 
      user_prompt_template, 
      temperature, 
      max_tokens, 
      top_p, 
      frequency_penalty, 
      presence_penalty 
    } = req.body;
    
    await pollDBPool.query(
      `UPDATE openai_prompts 
       SET system_prompt = ?,
           user_prompt_template = ?,
           temperature = ?,
           max_tokens = ?,
           top_p = ?,
           frequency_penalty = ?,
           presence_penalty = ?
       WHERE prompt_type = 'cricket_human_reporter'`,
      [
        system_prompt, 
        user_prompt_template, 
        temperature, 
        max_tokens, 
        top_p, 
        frequency_penalty, 
        presence_penalty
      ]
    );
    
    res.json({
      success: true,
      message: 'Prompt configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating prompt config:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
























// ------------------------------------------------------HINDI ONE-------------------------------------------------


// ===========================================
// HINDI CRICKET NEWS APIs
// ===========================================

// Get stored Hindi news
app.get('/api/hindi/stored-news', async (req, res) => {
  try {
    const { limit = 25, offset = 0 } = req.query;

    const [countResult] = await pollDBPool.query(
      'SELECT COUNT(*) as total FROM hindi_cricket_news WHERE is_valid = true'
    );
    const totalCount = countResult[0].total;

    const news = await hindiNewsScheduler.getStoredNews(parseInt(limit), parseInt(offset));

    const mapped = news.map(n => ({
      ...n,
      published_at_iso: toIsoZ(n.published_at),
      processed_at_iso: toIsoZ(n.processed_at),
    }));

    res.json({
      success: true,
      news: mapped,
      totalCount,
      currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
    });
  } catch (error) {
    console.error('Error getting stored Hindi news:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get processed Hindi news
app.get('/api/hindi/processed-news', async (req, res) => {
  try {
    const { limit = 25, offset = 0 } = req.query;

    const [countResult] = await pollDBPool.query(
      'SELECT COUNT(*) as total FROM hindi_cricket_news WHERE processed = true'
    );
    const totalCount = countResult[0].total;

    const [rows] = await pollDBPool.query(
      `SELECT * FROM hindi_cricket_news
       WHERE processed = true
       ORDER BY processed_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );

    const mapped = rows.map(n => ({
      ...n,
      published_at_iso: toIsoZ(n.published_at),
      processed_at_iso: toIsoZ(n.processed_at),
    }));

    res.json({
      success: true,
      news: mapped,
      totalCount,
      currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
    });
  } catch (error) {
    console.error('Error getting processed Hindi news:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Process Hindi article
app.post('/api/hindi/process-article/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get article from database
    const [rows] = await pollDBPool.query(
      'SELECT * FROM hindi_cricket_news WHERE id = ? AND processed = false',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Hindi article not found or already processed' });
    }

    const article = rows[0];
    
    // Process with Hindi logic
    const result = await processHindiManualInput({
      title: article.title,
      description: article.description,
      content: article.content
    });

    if (result.success) {
      // Mark as processed
      await pollDBPool.query(
        'UPDATE hindi_cricket_news SET processed = true, processed_at = NOW(), ready_article = ? WHERE id = ?',
        [result.readyToPublishArticle, id]
      );
      res.json({ success: true, readyToPublishArticle: result.readyToPublishArticle });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error processing Hindi article:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Manual fetch Hindi news
app.post('/api/hindi/manual-fetch-news', async (req, res) => {
  try {
    await hindiNewsScheduler.fetchAndStoreNews();
    res.json({ success: true, message: 'Hindi news fetched and stored successfully' });
  } catch (error) {
    console.error('Error manually fetching Hindi news:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Hindi scheduler status
app.get('/api/hindi/scheduler-status', async (req, res) => {
  try {
    res.json({ 
      success: true, 
      isRunning: hindiNewsScheduler.isRunning,
      message: 'Hindi scheduler is running and fetching news every 30 minutes'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Fetch Hindi cricket news from GNews API
app.get("/api/hindi/fetch-cricket-news", async (req, res) => {
  try {
    const { 
      query = "cricket", 
      lang = "hi", 
      country = "in", 
      max = 25,
      filters = "{}"
    } = req.query;

    console.log(`📰 Fetching Hindi cricket news: ${query}`);

    const newsResult = await fetchHindiCricketNews({
      query,
      lang,
      country,
      max: parseInt(max)
    });

    if (!newsResult.success) {
      return res.status(500).json({
        success: false,
        error: newsResult.error
      });
    }

    // Apply filters if provided
    let filteredArticles = newsResult.articles;
    try {
      const filterOptions = JSON.parse(filters);
      filteredArticles = filterHindiArticles(newsResult.articles, filterOptions);
    } catch (e) {
      // Use default filters if parsing fails
      filteredArticles = filterHindiArticles(newsResult.articles);
    }

    // Add summary and validation to each article
    const processedArticles = filteredArticles.map(article => ({
      ...article,
      summary: getHindiArticleSummary(article),
      validation: validateHindiArticleForProcessing(article),
      wordCount: article.content ? article.content.split(' ').length : 0
    }));

    res.json({
      success: true,
      totalArticles: newsResult.totalArticles,
      filteredArticles: processedArticles.length,
      articles: processedArticles,
      fetchedAt: newsResult.fetchedAt
    });

  } catch (error) {
    console.error("Fetch Hindi cricket news error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch Hindi cricket news"
    });
  }
});

// Process selected Hindi article from GNews
app.post("/api/hindi/process-selected-article", async (req, res) => {
  try {
    const { article, options = {} } = req.body;

    if (!article || !article.title || !article.description || !article.content) {
      return res.status(400).json({
        success: false,
        error: "Invalid Hindi article data"
      });
    }

    const validation = validateHindiArticleForProcessing(article);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: "Hindi article validation failed",
        details: validation.errors
      });
    }

    console.log(`🚀 Processing selected Hindi article: ${article.title}`);

    // Use Hindi processing function
    const result = await processHindiManualInput(
      { 
        title: article.title, 
        description: article.description, 
        content: article.content 
      },
      {
        language: options.language || "hi",
        includePrePublishingChecks: options.includePrePublishingChecks !== false,
        includeHumanLikeRewriting: options.includeHumanLikeRewriting !== false,
        includeGoogleOptimization: options.includeGoogleOptimization !== false,
        avoidAIDetection: options.avoidAIDetection !== false
      }
    );

    res.json({
      success: true,
      readyToPublishArticle: result.readyToPublishArticle,
      originalArticle: {
        title: article.title,
        description: article.description,
        url: article.url,
        source: article.source?.name,
        publishedAt: article.publishedAt
      },
      processingTime: result.processingTime
    });

  } catch (error) {
    console.error("Process selected Hindi article error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to process selected Hindi article"
    });
  }
});

// Quick endpoint to get ready-to-publish Hindi article directly
app.post("/api/hindi/get-ready-article", async (req, res) => {
  try {
    const { title, description, content, options = {} } = req.body;

    if (!title || !description || !content) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: title, description, content"
      });
    }

    console.log(`🚀 Processing Hindi get-ready-article: ${title}`);

    // Use Hindi processing function
    const result = await processHindiManualInput(
      { title, description, content },
      {
        language: "hi",
        includePrePublishingChecks: true,
        includeHumanLikeRewriting: true,
        includeGoogleOptimization: true,
        avoidAIDetection: true
      }
    );

    if (result.success) {
      res.json({
        success: true,
        readyToPublishArticle: result.readyToPublishArticle,
        processingTime: result.processingTime
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error("Get ready Hindi article error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to process Hindi article"
    });
  }
});

// DEBUG: test GNews from server (GET only; HEAD 404 deta hai)
app.get('/api/debug-gnews', async (req, res) => {
  try {
    const key = process.env.GNEWS_API_KEY || "fe7ae24f706a3904399790443a6b2034";
    const url = `https://gnews.io/api/v4/search?q=cricket&lang=en&max=3&expand=content&apikey=${key}`;

    const https = require('https');
    const dns = require('dns');
    try { dns.setDefaultResultOrder('ipv4first'); } catch {}
    const agent = new https.Agent({ family: 4, keepAlive: true });

    const r = await axios.get(url, { timeout: 45000, httpsAgent: agent, headers: { Accept: 'application/json' } });
    res.json({
      ok: true,
      status: r.status,
      total: r.data?.totalArticles,
      sample: (r.data?.articles || []).map(a => a.title)
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message, code: e.code, status: e.response?.status });
  }
});




// ===========================================
// HINDI ALL NEWS APIs()
// ===========================================

// Get stored Hindi all news
app.get('/api/hindi-all-news/stored-news', async (req, res) => {
  try {
    const { limit = 25, offset = 0 } = req.query;

    const [countResult] = await pollDBPool.query(
      'SELECT COUNT(*) as total FROM hindi_general_news WHERE is_valid = true'
    );
    const totalCount = countResult[0].total;

    const news = await hindiAllNewsScheduler.getStoredNews(parseInt(limit), parseInt(offset));

    const mapped = news.map(n => ({
      ...n,
      published_at_iso: toIsoZ(n.published_at),
      processed_at_iso: toIsoZ(n.processed_at),
    }));

    res.json({
      success: true,
      news: mapped,
      totalCount,
      currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
    });
  } catch (error) {
    console.error('Error getting stored Hindi all news:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get processed Hindi all news
app.get('/api/hindi-all-news/processed-news', async (req, res) => {
  try {
    const { limit = 25, offset = 0 } = req.query;

    const [countResult] = await pollDBPool.query(
      'SELECT COUNT(*) as total FROM hindi_general_news WHERE processed = true'
    );
    const totalCount = countResult[0].total;

    const [rows] = await pollDBPool.query(
      `SELECT * FROM hindi_general_news
       WHERE processed = true
       ORDER BY processed_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );

    const mapped = rows.map(n => ({
      ...n,
      published_at_iso: toIsoZ(n.published_at),
      processed_at_iso: toIsoZ(n.processed_at),
    }));

    res.json({
      success: true,
      news: mapped,
      totalCount,
      currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
    });
  } catch (error) {
    console.error('Error getting processed Hindi all news:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Process Hindi all news article
app.post('/api/hindi-all-news/articles/:id/generate', async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pollDBPool.query(
      "SELECT * FROM hindi_general_news WHERE id = ?",
      [id]
    );
    if (!rows.length) return res.status(404).json({ success:false, error:"Article not found" });
    const article = rows[0];

    // Use Hindi processing for Hindi all news
    const result = await processHindiAllNewsManualInput({
      title: article.title,
      description: article.description,
      content: article.content
    });

    if (result.success) {
      // Generate Hindi title and meta
      const hindiTitle = await generateHindiAllNewsHeadline(article.title);
      const hindiMeta = await generateHindiAllNewsMetaDescription(article.description);
      const hindiSlug = hindiTitle.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]+/g, '-').replace(/^-+|-+$/g, '');

      // Create HTML document with Hindi content
      const finalHtml = buildHtmlDocument({
        title: hindiTitle,
        metaDescription: hindiMeta,
        bodyHtml: result.readyToPublishArticle,
      });

      await pollDBPool.query(
        `UPDATE hindi_general_news
           SET processed = 1,
               processed_at = NOW(),
               ready_article = ?,
               final_title = ?,
               final_meta  = ?,
               final_slug  = ?
         WHERE id = ?`,
        [finalHtml, hindiTitle, hindiMeta, hindiSlug, id]
      );

      return res.json({
        success: true,
        final: {
          title: hindiTitle,
          meta: hindiMeta,
          slug: hindiSlug,
          html: finalHtml
        }
      });
    } else {
      return res.status(500).json({ success: false, error: result.error });
    }
  } catch (err) {
    console.error("generate Hindi all news article error", err);
    return res.status(500).json({ success:false, error: err.message || "Generate failed" });
  }
});

// Manual fetch Hindi all news
app.post('/api/hindi-all-news/manual-fetch-news', async (req, res) => {
  try {
    await hindiAllNewsScheduler.fetchAndStoreNews();
    res.json({ success: true, message: 'Hindi all news fetched and stored successfully' });
  } catch (error) {
    console.error('Error manually fetching Hindi all news:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Hindi all news scheduler status
app.get('/api/hindi-all-news/scheduler-status', async (req, res) => {
  try {
    res.json({ 
      success: true, 
      isRunning: hindiAllNewsScheduler.isRunning,
      message: 'Hindi all news scheduler is running and fetching news every 30 minutes'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});





// ===========================================
// HINDI ALL NEWS APIs
// ===========================================

// Get stored Hindi all news
app.get('/api/hindi-all/stored-news', async (req, res) => {
  try {
    const { limit = 25, offset = 0 } = req.query;

    const [countResult] = await pollDBPool.query(
      'SELECT COUNT(*) as total FROM hindi_all_news WHERE is_valid = true'
    );
    const totalCount = countResult[0].total;

    const news = await hindiAllNewsScheduler.getStoredNews(parseInt(limit), parseInt(offset));

    res.json({
      success: true,
      news,
      totalCount,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    console.error('Error getting stored Hindi all news:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get processed Hindi all news
app.get('/api/hindi-all/processed-news', async (req, res) => {
  try {
    const { limit = 25, offset = 0 } = req.query;

    const [countResult] = await pollDBPool.query(
      'SELECT COUNT(*) as total FROM hindi_all_news WHERE processed = true'
    );
    const totalCount = countResult[0].total;

    const [rows] = await pollDBPool.query(
      `SELECT * FROM hindi_all_news
       WHERE processed = true
       ORDER BY processed_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );

    res.json({
       success: true,
      news: rows,
      totalCount,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    console.error('Error getting processed Hindi all news:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Process Hindi all news article
app.post('/api/hindi-all/articles/:id/generate', async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pollDBPool.query(
      "SELECT * FROM hindi_all_news WHERE id = ?",
      [id]
    );
    if (!rows.length) return res.status(404).json({ success:false, error:"Article not found" });
    const article = rows[0];

    // Use Hindi processing for Hindi all news
    const result = await processHindiAllNewsManualInput({
      title: article.title,
      description: article.description,
      content: article.content
    });

    if (result.success) {
      // Generate Hindi title and meta
      const hindiTitle = await generateHindiAllNewsHeadline(article.title);
      const hindiMeta = await generateHindiAllNewsMetaDescription(article.description);
      const hindiSlug = hindiTitle.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]+/g, '-').replace(/^-+|-+$/g, '');

      // Create HTML document with Hindi content
      const finalHtml = buildHtmlDocument({
        title: hindiTitle,
        metaDescription: hindiMeta,
        bodyHtml: result.readyToPublishArticle,
      });

      await pollDBPool.query(
        `UPDATE hindi_all_news
           SET processed = 1,
               processed_at = NOW(),
               ready_article = ?,
               final_title = ?,
               final_meta  = ?,
               final_slug  = ?
         WHERE id = ?`,
        [finalHtml, hindiTitle, hindiMeta, hindiSlug, id]
      );

      return res.json({
        success: true,
        final: {
          title: hindiTitle,
          meta: hindiMeta,
          slug: hindiSlug,
          html: finalHtml
        }
      });
    } else {
      return res.status(500).json({ success: false, error: result.error });
    }
  } catch (err) {
    console.error("generate Hindi all news article error", err);
    return res.status(500).json({ success:false, error: err.message || "Generate failed" });
  }
});

// Manual fetch Hindi all news
app.post('/api/hindi-all/manual-fetch-news', async (req, res) => {
  try {
    await hindiAllNewsScheduler.fetchAndStoreNews();
    res.json({ success: true, message: 'Hindi all news fetched and stored successfully' });
  } catch (error) {
    console.error('Error manually fetching Hindi all news:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Hindi all news scheduler status
app.get('/api/hindi-all/scheduler-status', async (req, res) => {
  try {
    res.json({ 
      success: true, 
      isRunning: hindiAllNewsScheduler.isRunning,
      message: 'Hindi all news scheduler is running and fetching news every 30 minutes'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});













// Add this import at the top with other imports


// ============= HINDI CRICKET NEWS OPENAI ENDPOINTS =============

// Get stored Hindi cricket news for OpenAI processing
app.get('/api/hindi-cricket-openai/stored-news', async (req, res) => {
  try {
    const { limit = 25, offset = 0 } = req.query;

    const [countResult] = await pollDBPool.query(
      'SELECT COUNT(*) as total FROM hindi_cricket_news WHERE is_valid = true'
    );
    const totalCount = countResult[0].total;

    const [rows] = await pollDBPool.query(
      `SELECT * FROM hindi_cricket_news
       WHERE is_valid = true
       ORDER BY fetched_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );

    const mapped = rows.map(n => ({
      ...n,
      published_at_iso: toIsoZ(n.published_at),
      processed_at_iso: toIsoZ(n.processed_at),
    }));

    res.json({
      success: true,
      news: mapped,
      totalCount,
      currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
    });
  } catch (error) {
    console.error('Error getting stored Hindi cricket news for OpenAI:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get processed Hindi cricket news for OpenAI
app.get('/api/hindi-cricket-openai/processed-news', async (req, res) => {
  try {
    const { limit = 25, offset = 0 } = req.query;

    const [countResult] = await pollDBPool.query(
      'SELECT COUNT(*) as total FROM hindi_cricket_news WHERE openai_processed = true'
    );
    const totalCount = countResult[0].total;

    const [rows] = await pollDBPool.query(
      `SELECT * FROM hindi_cricket_news
       WHERE openai_processed = true
       ORDER BY openai_processed_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );

    const mapped = rows.map(n => ({
      ...n,
      published_at_iso: toIsoZ(n.published_at),
      processed_at_iso: toIsoZ(n.openai_processed_at),
    }));

    res.json({
      success: true,
      news: mapped,
      totalCount,
      currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
    });
  } catch (error) {
    console.error('Error getting processed Hindi cricket news for OpenAI:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Process Hindi cricket news article with OpenAI
app.post('/api/hindi-cricket-openai/articles/:id/generate', async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pollDBPool.query(
      "SELECT * FROM hindi_cricket_news WHERE id = ?",
      [id]
    );
    if (!rows.length) return res.status(404).json({ success:false, error:"Article not found" });
    const article = rows[0];

    // Process with Hindi Cricket-specific OpenAI
    const result = await processHindiCricketNewsOpenAI({
      title: article.title,
      description: article.description,
      content: article.content
    });

    if (result.success) {
      // Use the recommended title and meta from the SEO analysis
      const hindiTitle = result.recommendations.recommendedTitle || await generateHindiCricketHeadline(article.title);
      const hindiMeta = result.recommendations.recommendedMeta || await generateHindiCricketMetaDescription(article.description);
      const hindiSlug = result.recommendations.recommendedSlug || hindiTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

      // Create HTML document with Hindi cricket content
      const finalHtml = buildHindiCricketHtmlDocument({
        title: hindiTitle,
        metaDescription: hindiMeta,
        bodyHtml: result.readyToPublishArticle,
      });

      await pollDBPool.query(
        `UPDATE hindi_cricket_news
           SET openai_processed = 1,
               openai_processed_at = NOW(),
               openai_ready_article = ?,
               openai_final_title = ?,
               openai_final_meta  = ?,
               openai_final_slug  = ?
         WHERE id = ?`,
        [finalHtml, hindiTitle, hindiMeta, hindiSlug, id]
      );

      return res.json({
        success: true,
        final: {
          title: hindiTitle,
          meta: hindiMeta,
          slug: hindiSlug,
          html: finalHtml,
          recommendations: result.recommendations
        }
      });
    } else {
      return res.status(500).json({ success: false, error: result.error });
    }
  } catch (err) {
    console.error("generate Hindi cricket OpenAI article error", err);
    return res.status(500).json({ success:false, error: err.message || "Generate failed" });
  }
});

// Manual fetch Hindi cricket news for OpenAI
app.post('/api/hindi-cricket-openai/manual-fetch-news', async (req, res) => {
  try {
    await hindiNewsScheduler.fetchAndStoreNews();
    res.json({ success: true, message: 'Hindi cricket news fetched and stored successfully for OpenAI processing' });
  } catch (error) {
    console.error('Error manually fetching Hindi cricket news for OpenAI:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===========================================
// HINDI CRICKET NEWS DEEPSEEK APIs
// ===========================================

// Get stored Hindi cricket news for DeepSeek processing (same hindi_cricket_news table)
app.get('/api/hindi-cricket-deepseek/stored-news', async (req, res) => {
  try {
    const { limit = 25, offset = 0 } = req.query;

    const [countResult] = await pollDBPool.query(
      'SELECT COUNT(*) as total FROM hindi_cricket_news WHERE is_valid = true'
    );
    const totalCount = countResult[0].total;

    const [rows] = await pollDBPool.query(
      `SELECT * FROM hindi_cricket_news
       WHERE is_valid = true
       ORDER BY fetched_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );

    const mapped = rows.map(n => ({
      ...n,
      published_at_iso: toIsoZ(n.published_at),
      processed_at_iso: toIsoZ(n.processed_at),
    }));

    res.json({
      success: true,
      news: mapped,
      totalCount,
      currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
    });
  } catch (error) {
    console.error('Error getting stored Hindi cricket news for DeepSeek:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get processed Hindi cricket news for DeepSeek
app.get('/api/hindi-cricket-deepseek/processed-news', async (req, res) => {
  try {
    const { limit = 25, offset = 0 } = req.query;

    const [countResult] = await pollDBPool.query(
      'SELECT COUNT(*) as total FROM hindi_cricket_news WHERE deepseek_processed = true'
    );
    const totalCount = countResult[0].total;

    const [rows] = await pollDBPool.query(
      `SELECT * FROM hindi_cricket_news
       WHERE deepseek_processed = true
       ORDER BY deepseek_processed_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );

    const mapped = rows.map(n => ({
      ...n,
      published_at_iso: toIsoZ(n.published_at),
      processed_at_iso: toIsoZ(n.deepseek_processed_at),
    }));

    res.json({
      success: true,
      news: mapped,
      totalCount,
      currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
    });
  } catch (error) {
    console.error('Error getting processed Hindi cricket news for DeepSeek:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Process Hindi cricket news article with DeepSeek
app.post('/api/hindi-cricket-deepseek/articles/:id/generate', async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pollDBPool.query(
      "SELECT * FROM hindi_cricket_news WHERE id = ?",
      [id]
    );
    if (!rows.length) return res.status(404).json({ success:false, error:"Article not found" });
    const article = rows[0];

    // Process with DeepSeek
    const result = await processHindiCricketNewsDeepSeek({
      title: article.title,
      description: article.description,
      content: article.content
    });

    if (result.success) {
      // Simple slug generation from original title
      const hindiTitle = article.title;
      const hindiMeta = article.description.substring(0, 160);
      const hindiSlug = article.title.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]+/g, '-').replace(/^-+|-+$/g, '');
      
      // HTML is already complete from DeepSeek
      const finalHtml = result.readyToPublishArticle;

      await pollDBPool.query(
        `UPDATE hindi_cricket_news
           SET deepseek_processed = 1,
               deepseek_processed_at = NOW(),
               deepseek_ready_article = ?,
               deepseek_final_title = ?,
               deepseek_final_meta  = ?,
               deepseek_final_slug  = ?
         WHERE id = ?`,
        [finalHtml, hindiTitle, hindiMeta, hindiSlug, id]
      );

      return res.json({
        success: true,
        final: {
          title: hindiTitle,
          meta: hindiMeta,
          slug: hindiSlug,
          html: finalHtml,
        }
      });
    } else {
      return res.status(500).json({ success: false, error: result.error });
    }
  } catch (err) {
    console.error("generate Hindi cricket DeepSeek article error", err);
    return res.status(500).json({ success:false, error: err.message || "Generate failed" });
  }
});

// Manual fetch Hindi cricket news for DeepSeek (same as OpenAI, uses same scheduler)
app.post('/api/hindi-cricket-deepseek/manual-fetch-news', async (req, res) => {
  try {
    await hindiNewsScheduler.fetchAndStoreNews();
    res.json({ success: true, message: 'Hindi cricket news fetched and stored successfully for DeepSeek processing' });
  } catch (error) {
    console.error('Error manually fetching Hindi cricket news for DeepSeek:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Hindi cricket news scheduler status for DeepSeek
app.get('/api/hindi-cricket-deepseek/scheduler-status', async (req, res) => {
  try {
    res.json({ 
      success: true, 
      isRunning: hindiNewsScheduler.isRunning,
      message: 'Hindi cricket news scheduler is running and fetching news every 30 minutes'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===========================================
// HINDI CRICKET NEWS COMPARISON API (Both OpenAI & DeepSeek)
// ===========================================

// Auto-migrate: Add DeepSeek columns if they don't exist
app.post('/api/hindi-cricket-deepseek/migrate-columns', async (req, res) => {
  try {
    console.log('🔄 Checking for DeepSeek columns in hindi_cricket_news table...');
    
    // Check if columns exist
    const [columns] = await pollDBPool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_NAME = 'hindi_cricket_news' 
       AND COLUMN_NAME LIKE '%deepseek%'`
    );
    
    const existingColumns = columns.map(c => c.COLUMN_NAME);
    const requiredColumns = [
      'deepseek_processed',
      'deepseek_processed_at',
      'deepseek_ready_article',
      'deepseek_final_title',
      'deepseek_final_meta',
      'deepseek_final_slug'
    ];
    
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length === 0) {
      return res.json({
        success: true,
        message: 'All DeepSeek columns already exist',
        existingColumns
      });
    }
    
    console.log('📝 Adding missing columns:', missingColumns);
    
    // Add missing columns
    const migrations = [];
    
    if (missingColumns.includes('deepseek_processed')) {
      await pollDBPool.query('ALTER TABLE hindi_cricket_news ADD COLUMN deepseek_processed BOOLEAN DEFAULT FALSE');
      migrations.push('deepseek_processed');
    }
    
    if (missingColumns.includes('deepseek_processed_at')) {
      await pollDBPool.query('ALTER TABLE hindi_cricket_news ADD COLUMN deepseek_processed_at TIMESTAMP NULL');
      migrations.push('deepseek_processed_at');
    }
    
    if (missingColumns.includes('deepseek_ready_article')) {
      await pollDBPool.query('ALTER TABLE hindi_cricket_news ADD COLUMN deepseek_ready_article LONGTEXT NULL');
      migrations.push('deepseek_ready_article');
    }
    
    if (missingColumns.includes('deepseek_final_title')) {
      await pollDBPool.query('ALTER TABLE hindi_cricket_news ADD COLUMN deepseek_final_title VARCHAR(500) NULL');
      migrations.push('deepseek_final_title');
    }
    
    if (missingColumns.includes('deepseek_final_meta')) {
      await pollDBPool.query('ALTER TABLE hindi_cricket_news ADD COLUMN deepseek_final_meta TEXT NULL');
      migrations.push('deepseek_final_meta');
    }
    
    if (missingColumns.includes('deepseek_final_slug')) {
      await pollDBPool.query('ALTER TABLE hindi_cricket_news ADD COLUMN deepseek_final_slug VARCHAR(500) NULL');
      migrations.push('deepseek_final_slug');
    }
    
    // Add indexes
    try {
      await pollDBPool.query('CREATE INDEX idx_hindi_cricket_news_deepseek_processed ON hindi_cricket_news(deepseek_processed)');
    } catch (e) {
      if (!e.message.includes('Duplicate key')) console.log('Index already exists or error:', e.message);
    }
    
    try {
      await pollDBPool.query('CREATE INDEX idx_hindi_cricket_news_deepseek_processed_at ON hindi_cricket_news(deepseek_processed_at)');
    } catch (e) {
      if (!e.message.includes('Duplicate key')) console.log('Index already exists or error:', e.message);
    }
    
    res.json({
      success: true,
      message: `Successfully added ${migrations.length} DeepSeek columns`,
      addedColumns: migrations,
      existingColumns: existingColumns.concat(migrations)
    });
  } catch (error) {
    console.error('Error migrating DeepSeek columns:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get compared Hindi cricket news (articles processed by both OpenAI and DeepSeek)
app.get('/api/hindi-cricket-compare/compared-news', async (req, res) => {
  try {
    const { limit = 25, offset = 0 } = req.query;

    const [countResult] = await pollDBPool.query(
      'SELECT COUNT(*) as total FROM hindi_cricket_news WHERE openai_processed = true AND deepseek_processed = true'
    );
    const totalCount = countResult[0].total;

    const [rows] = await pollDBPool.query(
      `SELECT * FROM hindi_cricket_news
       WHERE openai_processed = true AND deepseek_processed = true
       ORDER BY openai_processed_at DESC, deepseek_processed_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );

    const mapped = rows.map(n => ({
      ...n,
      published_at_iso: toIsoZ(n.published_at),
      openai_processed_at_iso: toIsoZ(n.openai_processed_at),
      deepseek_processed_at_iso: toIsoZ(n.deepseek_processed_at),
    }));

    res.json({
      success: true,
      news: mapped,
      totalCount,
      currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
    });
  } catch (error) {
    console.error('Error getting compared Hindi cricket news:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});



























// ------------------------------------HINDI ONE COMPLETE --------------------------------------




// ===========================================
// ALL NEWS VIRAL CONTENT GENERATOR APIs
// ===========================================

// Get stored all news for viral content generation
app.get("/api/all-viral/stored-news", async (req, res) => {
  try {
    const { limit = 25, offset = 0 } = req.query;

    const [countResult] = await pollDBPool.query(
      'SELECT COUNT(*) as total FROM general_news WHERE is_valid = true'
    );
    const totalCount = countResult[0].total;

    const [rows] = await pollDBPool.query(
      `SELECT * FROM general_news 
       WHERE is_valid = true 
       ORDER BY published_at DESC, fetched_at DESC 
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );

    const mapped = rows.map(n => ({
      ...n,
      published_at_iso: toIsoZ(n.published_at),
      processed_at_iso: toIsoZ(n.processed_at),
    }));

    res.json({
      success: true,
      news: mapped,
      totalCount,
      currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
    });
  } catch (error) {
    console.error('Error getting stored all news for viral content:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate viral content from stored all news article
app.post("/api/all-viral/generate-from-stored", async (req, res) => {
  try {
    const { articleId } = req.body;

    if (!articleId) {
      return res.status(400).json({
        success: false,
        error: "Article ID is required"
      });
    }

    // Get article from general_news database
    const [rows] = await pollDBPool.query(
      'SELECT * FROM general_news WHERE id = ? AND is_valid = true',
      [articleId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Article not found"
      });
    }

    const article = rows[0];
    
    // Convert database article to GNews format
    const gnewsArticle = {
      title: article.title,
      description: article.description,
      content: article.content,
      url: article.source_url,
      publishedAt: article.published_at,
      source: {
        name: article.source_name,
        url: article.source_url
      }
    };

    console.log(`🚀 Generating viral content for all news article: ${article.title}`);

    // Generate viral content
    const result = await generateViralContent(gnewsArticle);

    if (result.success) {
      // ✅ STORE IN DATABASE - All News Viral Content Table!
      const [insertResult] = await pollDBPool.query(
        `INSERT INTO viral_content_all_news 
         (article_id, analysis, content, processing_time, generated_at) 
         VALUES (?, ?, ?, ?, NOW())`,
        [
          articleId,
          JSON.stringify(result.analysis),
          JSON.stringify(result.content),
          result.processingTime
        ]
      );

      console.log(`�� All news viral content stored with ID: ${insertResult.insertId}`);

      res.json({
        success: true,
        analysis: result.analysis,
        content: result.content,
        processingTime: result.processingTime,
        originalArticle: gnewsArticle,
        viralContentId: insertResult.insertId
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error("Generate viral content from all news article error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate viral content"
    });
  }
});

// Get stored all news viral content history
app.get("/api/all-viral/history", async (req, res) => {
  try {
    const { limit = 25, offset = 0 } = req.query;

    const [countResult] = await pollDBPool.query(
      'SELECT COUNT(*) as total FROM viral_content_all_news'
    );
    const totalCount = countResult[0].total;

    const [rows] = await pollDBPool.query(
      `SELECT vc.*, gn.title, gn.source_name, gn.source_url, gn.published_at
       FROM viral_content_all_news vc
       JOIN general_news gn ON vc.article_id = gn.id
       ORDER BY vc.generated_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );

    const mapped = rows.map(row => ({
      ...row,
      analysis: JSON.parse(row.analysis),
      content: JSON.parse(row.content),
      generated_at_iso: toIsoZ(row.generated_at),
      published_at_iso: toIsoZ(row.published_at)
    }));

    res.json({
      success: true,
      viralContent: mapped,
      totalCount,
      currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
    });
  } catch (error) {
    console.error('Error getting all news viral content history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get specific all news viral content by ID
app.get("/api/all-viral/content/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pollDBPool.query(
      `SELECT vc.*, gn.title, gn.source_name, gn.source_url, gn.published_at, gn.description
       FROM viral_content_all_news vc
       JOIN general_news gn ON vc.article_id = gn.id
       WHERE vc.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "All news viral content not found"
      });
    }

    const row = rows[0];
    const result = {
      ...row,
      analysis: JSON.parse(row.analysis),
      content: JSON.parse(row.content),
      generated_at_iso: toIsoZ(row.generated_at),
      published_at_iso: toIsoZ(row.published_at)
    };

    res.json({
      success: true,
      viralContent: result
    });
  } catch (error) {
    console.error('Error getting all news viral content:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Manual fetch all news for viral content
app.post('/api/all-viral/manual-fetch-news', async (req, res) => {
  try {
    await allNewsScheduler.fetchAndStoreNews();
    res.json({ success: true, message: 'All news fetched and stored successfully' });
  } catch (error) {
    console.error('Error manually fetching all news for viral content:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});




// ===========================================
// VIRAL CONTENT GENERATOR APIs
// ===========================================

// Get stored news for viral content generation
app.get("/api/viral/stored-news", async (req, res) => {
  try {
    const { limit = 25, offset = 0 } = req.query;

    const [countResult] = await pollDBPool.query(
      'SELECT COUNT(*) as total FROM cricket_news WHERE is_valid = true'
    );
    const totalCount = countResult[0].total;

    const [rows] = await pollDBPool.query(
      `SELECT * FROM cricket_news 
       WHERE is_valid = true 
       ORDER BY published_at DESC, fetched_at DESC 
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );

    const mapped = rows.map(n => ({
      ...n,
      published_at_iso: toIsoZ(n.published_at),
      processed_at_iso: toIsoZ(n.processed_at),
    }));

    res.json({
      success: true,
      news: mapped,
      totalCount,
      currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
    });
  } catch (error) {
    console.error('Error getting stored news for viral content:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate viral content from stored article
// Updated endpoint in src/server.js
app.post("/api/viral/generate-from-stored", async (req, res) => {
  try {
    const { articleId } = req.body;

    if (!articleId) {
      return res.status(400).json({
        success: false,
        error: "Article ID is required"
      });
    }

    // Get article from database
    const [rows] = await pollDBPool.query(
      'SELECT * FROM cricket_news WHERE id = ? AND is_valid = true',
      [articleId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Article not found"
      });
    }

    const article = rows[0];
    
    // Convert database article to GNews format
    const gnewsArticle = {
      title: article.title,
      description: article.description,
      content: article.content,
      url: article.source_url,
      publishedAt: article.published_at,
      source: {
        name: article.source_name,
        url: article.source_url
      }
    };

    console.log(`�� Generating viral content for stored article: ${article.title}`);

    // Generate viral content
    const result = await generateViralContent(gnewsArticle);

    if (result.success) {
      // ✅ STORE IN DATABASE - NEW ADDITION!
      const [insertResult] = await pollDBPool.query(
        `INSERT INTO viral_content 
         (article_id, analysis, content, processing_time, generated_at) 
         VALUES (?, ?, ?, ?, NOW())`,
        [
          articleId,
          JSON.stringify(result.analysis),
          JSON.stringify(result.content),
          result.processingTime
        ]
      );

      console.log(`💾 Viral content stored with ID: ${insertResult.insertId}`);

      res.json({
        success: true,
        analysis: result.analysis,
        content: result.content,
        processingTime: result.processingTime,
        originalArticle: gnewsArticle,
        viralContentId: insertResult.insertId // Return the stored ID
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error("Generate viral content from stored article error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate viral content"
    });
  }
});

// Get stored viral content history
app.get("/api/viral/history", async (req, res) => {
  try {
    const { limit = 25, offset = 0 } = req.query;

    const [countResult] = await pollDBPool.query(
      'SELECT COUNT(*) as total FROM viral_content'
    );
    const totalCount = countResult[0].total;

    const [rows] = await pollDBPool.query(
      `SELECT vc.*, cn.title, cn.source_name, cn.source_url, cn.published_at
       FROM viral_content vc
       JOIN cricket_news cn ON vc.article_id = cn.id
       ORDER BY vc.generated_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );

    const mapped = rows.map(row => ({
      ...row,
      analysis: JSON.parse(row.analysis),
      content: JSON.parse(row.content),
      generated_at_iso: toIsoZ(row.generated_at),
      published_at_iso: toIsoZ(row.published_at)
    }));

    res.json({
      success: true,
      viralContent: mapped,
      totalCount,
      currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
    });
  } catch (error) {
    console.error('Error getting viral content history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get specific viral content by ID
app.get("/api/viral/content/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pollDBPool.query(
      `SELECT vc.*, cn.title, cn.source_name, cn.source_url, cn.published_at, cn.description
       FROM viral_content vc
       JOIN cricket_news cn ON vc.article_id = cn.id
       WHERE vc.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Viral content not found"
      });
    }

    const row = rows[0];
    const result = {
      ...row,
      analysis: JSON.parse(row.analysis),
      content: JSON.parse(row.content),
      generated_at_iso: toIsoZ(row.generated_at),
      published_at_iso: toIsoZ(row.published_at)
    };

    res.json({
      success: true,
      viralContent: result
    });
  } catch (error) {
    console.error('Error getting viral content:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get viral content templates
app.get("/api/viral/templates", async (req, res) => {
  try {
    const templates = {
      instagram: {
        reel: {
          structure: "Hook (3s) → Story → CTA",
          elements: ["Visual hook", "Story progression", "Strong CTA", "Trending hashtags"]
        },
        carousel: {
          structure: "Title slide → 3-5 content slides → CTA slide",
          elements: ["Eye-catching title", "Fact-based content", "Visual consistency", "Clear CTA"]
        },
        story: {
          structure: "Multiple slides with polls/quizzes",
          elements: ["Interactive polls", "Swipe-up actions", "Behind-the-scenes", "Quick facts"]
        }
      },
      facebook: {
        video: {
          structure: "Hook → Narrative → CTA",
          elements: ["Emotional hook", "Story progression", "Visual elements", "Share-worthy CTA"]
        },
        debate: {
          structure: "Question → Image → Caption → CTA",
          elements: ["Controversial question", "Supporting image", "Opinion-driven caption", "Discussion CTA"]
        },
        awareness: {
          structure: "Story → Images → Emotional CTA",
          elements: ["Personal story", "Supporting images", "Emotional connection", "Action CTA"]
        }
      },
      twitter: {
        thread: {
          structure: "Hook tweet → 3-4 fact tweets → CTA tweet",
          elements: ["Strong opening", "Fact progression", "Visual elements", "Engagement CTA"]
        },
        poll: {
          structure: "Question → Poll options → Follow-up",
          elements: ["Opinion question", "Multiple options", "Follow-up discussion", "Hashtags"]
        },
        opinion: {
          structure: "Bold take → Supporting image → CTA",
          elements: ["Controversial opinion", "Supporting visual", "Engagement CTA", "Relevant hashtags"]
        }
      },
      youtube: {
        shorts: {
          structure: "Hook (3s) → Content → CTA",
          elements: ["Visual hook", "Quick content", "Strong CTA", "Trending music"]
        },
        longform: {
          structure: "Hook → Story → Analysis → CTA",
          elements: ["Strong opening", "Story progression", "Deep analysis", "Subscription CTA"]
        },
        reaction: {
          structure: "Reaction → Analysis → Opinion → CTA",
          elements: ["Genuine reaction", "Fact analysis", "Personal opinion", "Engagement CTA"]
        }
      }
    };

    res.json({
      success: true,
      templates
    });

  } catch (error) {
    console.error("Get viral content templates error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get templates"
    });
  }
});











// -------------------------------------------------------ENGLISH ONE --------------------



// PAKISTAN ENGLISH ONE NEWS

// Pakistan Manual Input Processor

// Pakistan Stored News API
app.get('/api/pakistan-stored-news', async (req, res) => {
  try {
    const { limit = 25, offset = 0 } = req.query;

    const [countResult] = await pollDBPool.query(
      'SELECT COUNT(*) as total FROM pakistan_cricket_news WHERE is_valid = true'
    );
    const totalCount = countResult[0].total;

    const news = await pakistanNewsScheduler.getStoredNews(parseInt(limit), parseInt(offset));

    const mapped = news.map(n => ({
      ...n,
      published_at_iso: toIsoZ(n.published_at),
      processed_at_iso: toIsoZ(n.processed_at),
    }));

    res.json({
      success: true,
      news: mapped,
      totalCount,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Pakistan stored news error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Pakistan Processed News API
app.get('/api/pakistan-processed-news', async (req, res) => {
  try {
    const { limit = 25, offset = 0 } = req.query;

    const [countResult] = await pollDBPool.query(
      'SELECT COUNT(*) as total FROM pakistan_cricket_news WHERE is_valid = true AND processed = true'
    );
    const totalCount = countResult[0].total;

    const [rows] = await pollDBPool.query(
      `SELECT * FROM pakistan_cricket_news 
       WHERE is_valid = true AND processed = true 
       ORDER BY processed_at DESC 
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );

    const mapped = rows.map(n => ({
      ...n,
      published_at_iso: toIsoZ(n.published_at),
      processed_at_iso: toIsoZ(n.processed_at),
    }));

    res.json({
      success: true,
      news: mapped,
      totalCount,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Pakistan processed news error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Pakistan Manual Fetch News API
app.post('/api/pakistan-manual-fetch-news', async (req, res) => {
  try {
    await pakistanNewsScheduler.fetchAndStoreNews();
    res.json({ success: true, message: 'Pakistan news fetched successfully' });
  } catch (error) {
    console.error('Pakistan manual fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Pakistan Article Generation API
app.post('/api/pakistan-articles/:id/generate', async (req, res) => {
  try {
    const { id } = req.params;

    // Get article from database
    const [rows] = await pollDBPool.query(
      'SELECT * FROM pakistan_cricket_news WHERE id = ? AND is_valid = true',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    const article = rows[0];

    // Process with Pakistan manual input processor
    const result = await processPakistanManualInput(
      {
        title: article.title,
        description: article.description,
        content: article.content
      },
      {
        language: "en",
        includePrePublishingChecks: true,
        includeHumanLikeRewriting: true,
        includeGoogleOptimization: true,
        avoidAIDetection: true
      }
    );

    if (result.success) {
      // Update database with processed article
      await pollDBPool.query(
        `UPDATE pakistan_cricket_news 
         SET processed = true, 
             processed_at = NOW(), 
             ready_article = ?, 
             final_title = ?, 
             final_meta = ?, 
             final_slug = ?,
             prepublish_recs = ?
         WHERE id = ?`,
        [
          result.readyToPublishArticle.readyArticle,
          result.readyToPublishArticle.finalTitle,
          result.readyToPublishArticle.finalMeta,
          result.readyToPublishArticle.finalSlug,
          JSON.stringify(result.readyToPublishArticle.recommendations),
          id
        ]
      );

      res.json({
        success: true,
        message: 'Pakistan article generated successfully',
        processingTime: result.processingTime
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('Pakistan article generation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start Pakistan news scheduler








































// ENGLISH ONE 
// ===========================================
// AUTOMATED ALL NEWS APIs  ENGLISH
// ===========================================

// Get stored all news
app.get('/api/all/stored-news', async (req, res) => {
  try {
    const { limit = 25, offset = 0 } = req.query;

    const [countResult] = await pollDBPool.query(
      'SELECT COUNT(*) as total FROM general_news WHERE is_valid = true'
    );
    const totalCount = countResult[0].total;

    const news = await allNewsScheduler.getStoredNews(parseInt(limit), parseInt(offset));

    const mapped = news.map(n => ({
      ...n,
      published_at_iso: toIsoZ(n.published_at),
      processed_at_iso: toIsoZ(n.processed_at),
    }));

    res.json({
      success: true,
      news: mapped,
      totalCount,
      currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
    });
  } catch (error) {
    console.error('Error getting stored all news:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get processed all news
app.get('/api/all/processed-news', async (req, res) => {
  try {
    const { limit = 25, offset = 0 } = req.query;

    const [countResult] = await pollDBPool.query(
      'SELECT COUNT(*) as total FROM general_news WHERE processed = true'
    );
    const totalCount = countResult[0].total;

    const [rows] = await pollDBPool.query(
      `SELECT * FROM general_news
       WHERE processed = true
       ORDER BY processed_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );

    const mapped = rows.map(n => ({
      ...n,
      published_at_iso: toIsoZ(n.published_at),
      processed_at_iso: toIsoZ(n.processed_at),
    }));

    res.json({
      success: true,
      news: mapped,
      totalCount,
      currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
    });
  } catch (error) {
    console.error('Error getting processed all news:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Process all news article
app.post('/api/all/articles/:id/generate', async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pollDBPool.query(
      "SELECT * FROM general_news WHERE id = ?",
      [id]
    );
    if (!rows.length) return res.status(404).json({ success:false, error:"Article not found" });
    const article = rows[0];

    // Convert English article to Hindi
    const result = await processAllNewsManualInput({
      title: article.title,
      description: article.description,
      content: article.content
    });

    if (result.success) {
      // Generate English title and meta
      const englishTitle = await generateEnglishHeadline(article.title);
      const englishMeta = await generateEnglishMetaDescription(article.description);
      const englishSlug = englishTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

      // Create HTML document with English content
      const finalHtml = buildHtmlDocument({
        title: englishTitle,
        metaDescription: englishMeta,
        bodyHtml: result.readyToPublishArticle,
      });

      await pollDBPool.query(
        `UPDATE general_news
           SET processed = 1,
               processed_at = NOW(),
               ready_article = ?,
               final_title = ?,
               final_meta  = ?,
               final_slug  = ?
         WHERE id = ?`,
        [finalHtml, englishTitle, englishMeta, englishSlug, id]
      );

      return res.json({
        success: true,
        final: {
          title: englishTitle,
          meta: englishMeta,
          slug: englishSlug,
          html: finalHtml
        }
      });
    } else {
      return res.status(500).json({ success: false, error: result.error });
    }
  } catch (err) {
    console.error("generate all news article error", err);
    return res.status(500).json({ success:false, error: err.message || "Generate failed" });
  }
});

// Manual fetch all news
app.post('/api/all/manual-fetch-news', async (req, res) => {
  try {
    await allNewsScheduler.fetchAndStoreNews();
    res.json({ success: true, message: 'All news fetched and stored successfully' });
  } catch (error) {
    console.error('Error manually fetching all news:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all news scheduler status
app.get('/api/all/scheduler-status', async (req, res) => {
  try {
    res.json({ 
      success: true, 
      isRunning: allNewsScheduler.isRunning,
      message: 'All news scheduler is running and fetching news every 30 minutes'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});









// ============= ENGLISH CRICKET NEWS OPENAI ENDPOINTS =============
// Add this import at the top with other imports


// ============= ENGLISH CRICKET NEWS OPENAI ENDPOINTS =============

// Get stored cricket news for OpenAI processing
// app.get('/api/cricket-openai/stored-news', async (req, res) => {
//   try {
//     const { limit = 25, offset = 0 } = req.query;

//     const [countResult] = await pollDBPool.query(
//       'SELECT COUNT(*) as total FROM cricket_news WHERE is_valid = true'
//     );
//     const totalCount = countResult[0].total;

//     const [rows] = await pollDBPool.query(
//       `SELECT * FROM cricket_news
//        WHERE is_valid = true
//        ORDER BY fetched_at DESC
//        LIMIT ? OFFSET ?`,
//       [parseInt(limit), parseInt(offset)]
//     );

//     const mapped = rows.map(n => ({
//       ...n,
//       published_at_iso: toIsoZ(n.published_at),
//       processed_at_iso: toIsoZ(n.processed_at),
//     }));

//     res.json({
//       success: true,
//       news: mapped,
//       totalCount,
//       currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
//       totalPages: Math.ceil(totalCount / parseInt(limit)),
//     });
//   } catch (error) {
//     console.error('Error getting stored cricket news for OpenAI:', error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

// // Get processed cricket news for OpenAI
// app.get('/api/cricket-openai/processed-news', async (req, res) => {
//   try {
//     const { limit = 25, offset = 0 } = req.query;

//     const [countResult] = await pollDBPool.query(
//       'SELECT COUNT(*) as total FROM cricket_news WHERE openai_processed = true'
//     );
//     const totalCount = countResult[0].total;

//     const [rows] = await pollDBPool.query(
//       `SELECT * FROM cricket_news
//        WHERE openai_processed = true
//        ORDER BY openai_processed_at DESC
//        LIMIT ? OFFSET ?`,
//       [parseInt(limit), parseInt(offset)]
//     );

//     const mapped = rows.map(n => ({
//       ...n,
//       published_at_iso: toIsoZ(n.published_at),
//       processed_at_iso: toIsoZ(n.openai_processed_at),
//     }));

//     res.json({
//       success: true,
//       news: mapped,
//       totalCount,
//       currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
//       totalPages: Math.ceil(totalCount / parseInt(limit)),
//     });
//   } catch (error) {
//     console.error('Error getting processed cricket news for OpenAI:', error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

// // Process cricket news article with OpenAI (using prepublish.js style prompts)
// app.post('/api/cricket-openai/articles/:id/generate', async (req, res) => {
//   try {
//     const { id } = req.params;

//     const [rows] = await pollDBPool.query(
//       "SELECT * FROM cricket_news WHERE id = ?",
//       [id]
//     );
//     if (!rows.length) return res.status(404).json({ success:false, error:"Article not found" });
//     const article = rows[0];

//     // Process with Cricket-specific OpenAI (using prepublish.js style)
//     const result = await processCricketNewsOpenAI({
//       title: article.title,
//       description: article.description,
//       content: article.content
//     });

//     if (result.success) {
//       // Use the recommended title and meta from the SEO analysis
//       const cricketTitle = result.recommendations.recommendedTitle || await generateCricketHeadline(article.title);
//       const cricketMeta = result.recommendations.recommendedMeta || await generateCricketMetaDescription(article.description);
//       const cricketSlug = result.recommendations.recommendedSlug || cricketTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

//       // Create HTML document with cricket content
//       const finalHtml = buildCricketHtmlDocument({
//         title: cricketTitle,
//         metaDescription: cricketMeta,
//         bodyHtml: result.readyToPublishArticle,
//       });

//       await pollDBPool.query(
//         `UPDATE cricket_news
//            SET openai_processed = 1,
//                openai_processed_at = NOW(),
//                openai_ready_article = ?,
//                openai_final_title = ?,
//                openai_final_meta  = ?,
//                openai_final_slug  = ?
//          WHERE id = ?`,
//         [finalHtml, cricketTitle, cricketMeta, cricketSlug, id]
//       );

//       return res.json({
//         success: true,
//         final: {
//           title: cricketTitle,
//           meta: cricketMeta,
//           slug: cricketSlug,
//           html: finalHtml,
//           recommendations: result.recommendations
//         }
//       });
//     } else {
//       return res.status(500).json({ success: false, error: result.error });
//     }
//   } catch (err) {
//     console.error("generate cricket OpenAI article error", err);
//     return res.status(500).json({ success:false, error: err.message || "Generate failed" });
//   }
// });

// // Manual fetch cricket news for OpenAI
// app.post('/api/cricket-openai/manual-fetch-news', async (req, res) => {
//   try {
//     await newsScheduler.fetchAndStoreNews();
//     res.json({ success: true, message: 'Cricket news fetched and stored successfully for OpenAI processing' });
//   } catch (error) {
//     console.error('Error manually fetching cricket news for OpenAI:', error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

// // Get cricket news scheduler status
// app.get('/api/cricket-openai/scheduler-status', async (req, res) => {
//   try {
//     res.json({ 
//       success: true, 
//       isRunning: newsScheduler.isRunning,
//       message: 'Cricket news scheduler is running and fetching news every 30 minutes'
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// });



app.get('/api/cricket-openai/stored-news', async (req, res) => {
  try {
    const { limit = 25, offset = 0 } = req.query;

    const [countResult] = await pollDBPool.query(
      'SELECT COUNT(*) as total FROM cricket_news WHERE is_valid = true'
    );
    const totalCount = countResult[0].total;

    const [rows] = await pollDBPool.query(
      `SELECT * FROM cricket_news
       WHERE is_valid = true
       ORDER BY fetched_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );

    const mapped = rows.map(n => ({
      ...n,
      published_at_iso: toIsoZ(n.published_at),
      processed_at_iso: toIsoZ(n.processed_at),
    }));

    res.json({
      success: true,
      news: mapped,
      totalCount,
      currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
    });
  } catch (error) {
    console.error('Error getting stored cricket news for OpenAI:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get processed cricket news for OpenAI
app.get('/api/cricket-openai/processed-news', async (req, res) => {
  try {
    const { limit = 25, offset = 0 } = req.query;

    const [countResult] = await pollDBPool.query(
      'SELECT COUNT(*) as total FROM cricket_news WHERE openai_processed = true'
    );
    const totalCount = countResult[0].total;

    const [rows] = await pollDBPool.query(
      `SELECT * FROM cricket_news
       WHERE openai_processed = true
       ORDER BY openai_processed_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );

    const mapped = rows.map(n => ({
      ...n,
      published_at_iso: toIsoZ(n.published_at),
      processed_at_iso: toIsoZ(n.openai_processed_at),
    }));

    res.json({
      success: true,
      news: mapped,
      totalCount,
      currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
    });
  } catch (error) {
    console.error('Error getting processed cricket news for OpenAI:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Process cricket news article with OpenAI (Raw Human Reporter Mode)
app.post('/api/cricket-openai/articles/:id/generate', async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pollDBPool.query(
      "SELECT * FROM cricket_news WHERE id = ?",
      [id]
    );
    if (!rows.length) return res.status(404).json({ success:false, error:"Article not found" });
    const article = rows[0];

    // Process with Raw Human Reporter Mode
    const result = await processCricketNewsOpenAI({
      title: article.title,
      description: article.description,
      content: article.content
    });

    if (result.success) {
      // Simple slug generation from original title
      const cricketTitle = article.title;
      const cricketMeta = article.description.substring(0, 160);
      const cricketSlug = article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      
      // HTML is already complete from OpenAI (human-like rewrite)
      const finalHtml = result.readyToPublishArticle;

      await pollDBPool.query(
        `UPDATE cricket_news
           SET openai_processed = 1,
               openai_processed_at = NOW(),
               openai_ready_article = ?,
               openai_final_title = ?,
               openai_final_meta  = ?,
               openai_final_slug  = ?
         WHERE id = ?`,
        [finalHtml, cricketTitle, cricketMeta, cricketSlug, id]
      );

      return res.json({
        success: true,
        final: {
          title: cricketTitle,
          meta: cricketMeta,
          slug: cricketSlug,
          html: finalHtml,
        }
      });
    } else {
      return res.status(500).json({ success: false, error: result.error });
    }
  } catch (err) {
    console.error("generate cricket OpenAI article error", err);
    return res.status(500).json({ success:false, error: err.message || "Generate failed" });
  }
});

// Manual fetch cricket news for OpenAI
app.post('/api/cricket-openai/manual-fetch-news', async (req, res) => {
  try {
    await newsScheduler.fetchAndStoreNews();
    res.json({ success: true, message: 'Cricket news fetched and stored successfully for OpenAI processing' });
  } catch (error) {
    console.error('Error manually fetching cricket news for OpenAI:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get cricket news scheduler status
app.get('/api/cricket-openai/scheduler-status', async (req, res) => {
  try {
    res.json({ 
      success: true, 
      isRunning: newsScheduler.isRunning,
      message: 'Cricket news scheduler is running and fetching news every 30 minutes'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===========================================
// CRICKET NEWS DEEPSEEK APIs (Separate from OpenAI)
// ===========================================

// Get stored cricket news for DeepSeek processing (same cricket_news table)
app.get('/api/cricket-deepseek/stored-news', async (req, res) => {
  try {
    const { limit = 25, offset = 0 } = req.query;

    const [countResult] = await pollDBPool.query(
      'SELECT COUNT(*) as total FROM cricket_news WHERE is_valid = true'
    );
    const totalCount = countResult[0].total;

    const [rows] = await pollDBPool.query(
      `SELECT * FROM cricket_news
       WHERE is_valid = true
       ORDER BY fetched_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );

    const mapped = rows.map(n => ({
      ...n,
      published_at_iso: toIsoZ(n.published_at),
      processed_at_iso: toIsoZ(n.processed_at),
    }));

    res.json({
      success: true,
      news: mapped,
      totalCount,
      currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
    });
  } catch (error) {
    console.error('Error getting stored cricket news for DeepSeek:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get processed cricket news for DeepSeek
app.get('/api/cricket-deepseek/processed-news', async (req, res) => {
  try {
    const { limit = 25, offset = 0 } = req.query;

    const [countResult] = await pollDBPool.query(
      'SELECT COUNT(*) as total FROM cricket_news WHERE deepseek_processed = true'
    );
    const totalCount = countResult[0].total;

    const [rows] = await pollDBPool.query(
      `SELECT * FROM cricket_news
       WHERE deepseek_processed = true
       ORDER BY deepseek_processed_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );

    const mapped = rows.map(n => ({
      ...n,
      published_at_iso: toIsoZ(n.published_at),
      processed_at_iso: toIsoZ(n.deepseek_processed_at),
    }));

    res.json({
      success: true,
      news: mapped,
      totalCount,
      currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
    });
  } catch (error) {
    console.error('Error getting processed cricket news for DeepSeek:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Process cricket news article with DeepSeek
app.post('/api/cricket-deepseek/articles/:id/generate', async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pollDBPool.query(
      "SELECT * FROM cricket_news WHERE id = ?",
      [id]
    );
    if (!rows.length) return res.status(404).json({ success:false, error:"Article not found" });
    const article = rows[0];

    // Process with DeepSeek (Hindi)
    const result = await processHindiCricketNewsDeepSeek({
      title: article.title,
      description: article.description,
      content: article.content
    });

    if (result.success) {
      // Generate Hindi title/meta using DeepSeek helpers
      const hindiTitle = await generateHindiCricketHeadlineDeepSeek(article.title);
      const hindiMeta = await generateHindiCricketMetaDescriptionDeepSeek(article.description);
      const hindiSlug = (hindiTitle || article.title)
        .toLowerCase()
        .replace(/[^a-z0-9\u0900-\u097F]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Wrap article HTML in full document
      const finalHtml = buildHindiCricketHtmlDocumentDeepSeek({
        title: hindiTitle,
        metaDescription: hindiMeta,
        bodyHtml: result.readyToPublishArticle,
      });

      await pollDBPool.query(
        `UPDATE cricket_news
           SET deepseek_processed = 1,
               deepseek_processed_at = NOW(),
               deepseek_ready_article = ?,
               deepseek_final_title = ?,
               deepseek_final_meta  = ?,
               deepseek_final_slug  = ?
         WHERE id = ?`,
        [finalHtml, hindiTitle, hindiMeta, hindiSlug, id]
      );

      return res.json({
        success: true,
        final: {
          title: hindiTitle,
          meta: hindiMeta,
          slug: hindiSlug,
          html: finalHtml,
        },
        metadata: {
          processingTime: result.processingTime,
          model: 'DeepSeek',
          language: 'Hindi'
        }
      });
    } else {
      return res.status(500).json({ success: false, error: result.error });
    }
  } catch (err) {
    console.error("generate cricket DeepSeek article error", err);
    return res.status(500).json({ success:false, error: err.message || "Generate failed" });
  }
});

// Manual fetch cricket news for DeepSeek (same as OpenAI, uses same scheduler)
app.post('/api/cricket-deepseek/manual-fetch-news', async (req, res) => {
  try {
    await newsScheduler.fetchAndStoreNews();
    res.json({ success: true, message: 'Cricket news fetched and stored successfully for DeepSeek processing' });
  } catch (error) {
    console.error('Error manually fetching cricket news for DeepSeek:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get cricket news scheduler status for DeepSeek
app.get('/api/cricket-deepseek/scheduler-status', async (req, res) => {
  try {
    res.json({ 
      success: true, 
      isRunning: newsScheduler.isRunning,
      message: 'Cricket news scheduler is running and fetching news every 30 minutes'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===========================================
// CRICKET NEWS COMPARISON API (Both OpenAI & DeepSeek)
// ===========================================

// Auto-migrate: Add DeepSeek columns if they don't exist
app.post('/api/cricket-deepseek/migrate-columns', async (req, res) => {
  try {
    console.log('🔄 Checking for DeepSeek columns in cricket_news table...');
    
    // Check if columns exist
    const [columns] = await pollDBPool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_NAME = 'cricket_news' 
       AND COLUMN_NAME LIKE '%deepseek%'`
    );
    
    const existingColumns = columns.map(c => c.COLUMN_NAME);
    const requiredColumns = [
      'deepseek_processed',
      'deepseek_processed_at',
      'deepseek_ready_article',
      'deepseek_final_title',
      'deepseek_final_meta',
      'deepseek_final_slug'
    ];
    
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length === 0) {
      return res.json({
        success: true,
        message: 'All DeepSeek columns already exist',
        existingColumns
      });
    }
    
    console.log('📝 Adding missing columns:', missingColumns);
    
    // Add missing columns
    const migrations = [];
    
    if (missingColumns.includes('deepseek_processed')) {
      await pollDBPool.query('ALTER TABLE cricket_news ADD COLUMN deepseek_processed BOOLEAN DEFAULT FALSE');
      migrations.push('deepseek_processed');
    }
    
    if (missingColumns.includes('deepseek_processed_at')) {
      await pollDBPool.query('ALTER TABLE cricket_news ADD COLUMN deepseek_processed_at TIMESTAMP NULL');
      migrations.push('deepseek_processed_at');
    }
    
    if (missingColumns.includes('deepseek_ready_article')) {
      await pollDBPool.query('ALTER TABLE cricket_news ADD COLUMN deepseek_ready_article LONGTEXT NULL');
      migrations.push('deepseek_ready_article');
    }
    
    if (missingColumns.includes('deepseek_final_title')) {
      await pollDBPool.query('ALTER TABLE cricket_news ADD COLUMN deepseek_final_title VARCHAR(500) NULL');
      migrations.push('deepseek_final_title');
    }
    
    if (missingColumns.includes('deepseek_final_meta')) {
      await pollDBPool.query('ALTER TABLE cricket_news ADD COLUMN deepseek_final_meta TEXT NULL');
      migrations.push('deepseek_final_meta');
    }
    
    if (missingColumns.includes('deepseek_final_slug')) {
      await pollDBPool.query('ALTER TABLE cricket_news ADD COLUMN deepseek_final_slug VARCHAR(500) NULL');
      migrations.push('deepseek_final_slug');
    }
    
    // Add indexes
    try {
      await pollDBPool.query('CREATE INDEX idx_cricket_news_deepseek_processed ON cricket_news(deepseek_processed)');
    } catch (e) {
      if (!e.message.includes('Duplicate key')) console.log('Index already exists or error:', e.message);
    }
    
    try {
      await pollDBPool.query('CREATE INDEX idx_cricket_news_deepseek_processed_at ON cricket_news(deepseek_processed_at)');
    } catch (e) {
      if (!e.message.includes('Duplicate key')) console.log('Index already exists or error:', e.message);
    }
    
    res.json({
      success: true,
      message: `Successfully added ${migrations.length} DeepSeek columns`,
      addedColumns: migrations,
      existingColumns: existingColumns.concat(migrations)
    });
  } catch (error) {
    console.error('Error migrating DeepSeek columns:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get compared cricket news (articles processed by both OpenAI and DeepSeek)
app.get('/api/cricket-compare/compared-news', async (req, res) => {
  try {
    const { limit = 25, offset = 0 } = req.query;

    const [countResult] = await pollDBPool.query(
      'SELECT COUNT(*) as total FROM cricket_news WHERE openai_processed = true AND deepseek_processed = true'
    );
    const totalCount = countResult[0].total;

    const [rows] = await pollDBPool.query(
      `SELECT * FROM cricket_news
       WHERE openai_processed = true AND deepseek_processed = true
       ORDER BY openai_processed_at DESC, deepseek_processed_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );

    const mapped = rows.map(n => ({
      ...n,
      published_at_iso: toIsoZ(n.published_at),
      openai_processed_at_iso: toIsoZ(n.openai_processed_at),
      deepseek_processed_at_iso: toIsoZ(n.deepseek_processed_at),
    }));

    res.json({
      success: true,
      news: mapped,
      totalCount,
      currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
    });
  } catch (error) {
    console.error('Error getting compared cricket news:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===========================================
// CRICKET NEWS OPENAI APIs (Separate from existing)
// ===========================================

// Get processed cricket news for OpenAI (separate from existing)
app.get('/api/cricket-openai-new/processed-news', async (req, res) => {
  try {
    const { limit = 25, offset = 0 } = req.query;

    const [countResult] = await pollDBPool.query(
      'SELECT COUNT(*) as total FROM cricket_news WHERE openai_processed = true'
    );
    const totalCount = countResult[0].total;

    const [rows] = await pollDBPool.query(
      `SELECT * FROM cricket_news
       WHERE openai_processed = true
       ORDER BY openai_processed_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );

    const mapped = rows.map(n => ({
      ...n,
      published_at_iso: toIsoZ(n.published_at),
      processed_at_iso: toIsoZ(n.openai_processed_at),
    }));

    res.json({
      success: true,
      news: mapped,
      totalCount,
      currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
    });
  } catch (error) {
    console.error('Error getting processed cricket news for OpenAI:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Process cricket news article with OpenAI (separate button)
app.post('/api/cricket-openai-new/articles/:id/generate', async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pollDBPool.query(
      "SELECT * FROM cricket_news WHERE id = ?",
      [id]
    );
    if (!rows.length) return res.status(404).json({ success:false, error:"Article not found" });
    const article = rows[0];

    // Process with OpenAI
    const result = await processCricketNewsOpenAI({
      title: article.title,
      description: article.description,
      content: article.content
    });

    if (result.success) {
      // Simple slug generation from original title
      const cricketTitle = article.title;
      const cricketMeta = article.description.substring(0, 160);
      const cricketSlug = article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      
      // HTML is already complete from OpenAI
      const finalHtml = result.readyToPublishArticle;

      await pollDBPool.query(
        `UPDATE cricket_news
           SET openai_processed = 1,
               openai_processed_at = NOW(),
               openai_ready_article = ?,
               openai_final_title = ?,
               openai_final_meta  = ?,
               openai_final_slug  = ?
         WHERE id = ?`,
        [finalHtml, cricketTitle, cricketMeta, cricketSlug, id]
      );

      return res.json({
        success: true,
        final: {
          title: cricketTitle,
          meta: cricketMeta,
          slug: cricketSlug,
          html: finalHtml,
        }
      });
    } else {
      return res.status(500).json({ success: false, error: result.error });
    }
  } catch (err) {
    console.error("generate cricket OpenAI article error", err);
    return res.status(500).json({ success:false, error: err.message || "Generate failed" });
  }
});
























// ===========================================
// open ai all news english
// ===========================================

// Get stored all news for OpenAI processing (reuses same table)
app.get('/api/openai-all/stored-news', async (req, res) => {
  try {
    const { limit = 25, offset = 0 } = req.query;

    const [countResult] = await pollDBPool.query(
      'SELECT COUNT(*) as total FROM general_news WHERE is_valid = true'
    );
    const totalCount = countResult[0].total;

    const news = await allNewsScheduler.getStoredNews(parseInt(limit), parseInt(offset));

    const mapped = news.map(n => ({
      ...n,
      published_at_iso: toIsoZ(n.published_at),
      processed_at_iso: toIsoZ(n.processed_at),
    }));

    res.json({
      success: true,
      news: mapped,
      totalCount,
      currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
    });
  } catch (error) {
    console.error('Error getting stored all news for OpenAI:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get processed all news for OpenAI (reuses same table)
app.get('/api/openai-all/processed-news', async (req, res) => {
  try {
    const { limit = 25, offset = 0 } = req.query;

    const [countResult] = await pollDBPool.query(
      'SELECT COUNT(*) as total FROM general_news WHERE openai_processed = true'
    );
    const totalCount = countResult[0].total;

    const [rows] = await pollDBPool.query(
      `SELECT * FROM general_news
       WHERE openai_processed = true
       ORDER BY openai_processed_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );

    const mapped = rows.map(n => ({
      ...n,
      published_at_iso: toIsoZ(n.published_at),
      processed_at_iso: toIsoZ(n.openai_processed_at),
    }));

    res.json({
      success: true,
      news: mapped,
      totalCount,
      currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
    });
  } catch (error) {
    console.error('Error getting processed all news for OpenAI:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Process all news article with OpenAI
app.post('/api/openai-all/articles/:id/generate', async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pollDBPool.query(
      "SELECT * FROM general_news WHERE id = ?",
      [id]
    );
    if (!rows.length) return res.status(404).json({ success:false, error:"Article not found" });
    const article = rows[0];

    // Process with OpenAI
    const result = await processAllNewsOpenAI({
      title: article.title,
      description: article.description,
      content: article.content
    });

    if (result.success) {
      // Generate English title and meta with OpenAI
      const openaiTitle = await generateOpenAIHeadline(article.title);
      const openaiMeta = await generateOpenAIMetaDescription(article.description);
      const openaiSlug = openaiTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

      // Create HTML document with OpenAI content
      const finalHtml = buildHtmlDocument({
        title: openaiTitle,
        metaDescription: openaiMeta,
        bodyHtml: result.readyToPublishArticle,
      });

      await pollDBPool.query(
        `UPDATE general_news
           SET openai_processed = 1,
               openai_processed_at = NOW(),
               openai_ready_article = ?,
               openai_final_title = ?,
               openai_final_meta  = ?,
               openai_final_slug  = ?
         WHERE id = ?`,
        [finalHtml, openaiTitle, openaiMeta, openaiSlug, id]
      );

      return res.json({
        success: true,
        final: {
          title: openaiTitle,
          meta: openaiMeta,
          slug: openaiSlug,
          html: finalHtml
        }
      });
    } else {
      return res.status(500).json({ success: false, error: result.error });
    }
  } catch (err) {
    console.error("generate OpenAI all news article error", err);
    return res.status(500).json({ success:false, error: err.message || "Generate failed" });
  }
});

// Manual fetch all news for OpenAI (reuses existing functionality)
app.post('/api/openai-all/manual-fetch-news', async (req, res) => {
  try {
    await allNewsScheduler.fetchAndStoreNews();
    res.json({ success: true, message: 'All news fetched and stored successfully for OpenAI processing' });
  } catch (error) {
    console.error('Error manually fetching all news for OpenAI:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get OpenAI all news scheduler status
app.get('/api/openai-all/scheduler-status', async (req, res) => {
  try {
    res.json({ 
      success: true, 
      isRunning: allNewsScheduler.isRunning,
      message: 'All news scheduler is running and fetching news every 30 minutes (shared with DeepSeek)'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});




























// helper to force ISO Z
function toIsoZ(v) {
  if (!v) return null;
  // already a Date?
  if (v instanceof Date) return v.toISOString();
  const s = String(v).trim();
  // 'YYYY-MM-DD HH:MM:SS' -> treat as UTC, make ISO
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) {
    return s.replace(' ', 'T') + 'Z';
  }
  // already ISO-like, ensure Z
  if (s.includes('T')) return s.endsWith('Z') ? s : s + 'Z';
  return s;
}

// --------- STORED ----------
app.get('/api/stored-news', async (req, res) => {
  try {
    const { limit = 25, offset = 0 } = req.query;

    const [countResult] = await pollDBPool.query(
      'SELECT COUNT(*) as total FROM cricket_news WHERE is_valid = true'
    );
    const totalCount = countResult[0].total;

    const news = await newsScheduler.getStoredNews(parseInt(limit), parseInt(offset));

    const mapped = news.map(n => ({
      ...n,
      published_at_iso: toIsoZ(n.published_at),
      processed_at_iso: toIsoZ(n.processed_at),
    }));

    res.json({
      success: true,
      news: mapped,
      totalCount,
      currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
    });
  } catch (error) {
    console.error('Error getting stored news:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// --------- PROCESSED ----------
app.get('/api/processed-news', async (req, res) => {
  try {
    const { limit = 25, offset = 0 } = req.query;

    const [countResult] = await pollDBPool.query(
      'SELECT COUNT(*) as total FROM cricket_news WHERE processed = true'
    );
    const totalCount = countResult[0].total;

    const [rows] = await pollDBPool.query(
      `SELECT * FROM cricket_news
       WHERE processed = true
       ORDER BY processed_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );

    const mapped = rows.map(n => ({
      ...n,
      published_at_iso: toIsoZ(n.published_at),
      processed_at_iso: toIsoZ(n.processed_at),
    }));

    res.json({
      success: true,
      news: mapped,
      totalCount,
      currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
    });
  } catch (error) {
    console.error('Error getting processed news:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});




// -------------- NEW: Pre-Publish Recs + Rewrite --------------

// // ONE-CLICK GENERATE: make recs (if missing) -> write FULL HTML -> save
// app.post("/api/articles/:id/generate", async (req, res) => {
//   try {
//     const { id } = req.params;
//     console.log(`\n🚀 Starting article generation for ID: ${id}`);

//     const [rows] = await pollDBPool.query(
//       "SELECT * FROM cricket_news WHERE id = ?",
//       [id]
//     );
//     if (!rows.length) return res.status(404).json({ success:false, error:"Article not found" });
//     const article = rows[0];
//     console.log(`📰 Article found: ${article.title?.substring(0, 50)}...`);

//     // 1) ensure recommendations exist
//     let recs = null;
//     if (article.prepublish_recs) {
//       try { recs = JSON.parse(article.prepublish_recs); } catch {}
//     }
//     if (!recs || !recs.recommendedTitle) {
//       console.log('📋 Generating SEO recommendations...');
//       const prePrompt = buildPrePublishPrompt({
//         title: article.title || "",
//         description: article.description || "",
//         body: article.content || "",
//       });
//       const recText = await generateWithDeepSeek(prePrompt, { temperature: 0.2, max_tokens: 1200 });
//       recs = parsePrePublishTextToJSON(recText);
//       console.log('✅ SEO recommendations generated');

//       await pollDBPool.query(
//         "UPDATE cricket_news SET prepublish_recs = ? WHERE id = ?",
//         [JSON.stringify(recs), id]
//       );
//     } else {
//       console.log('✅ Using existing SEO recommendations');
//     }

//     // 2) generate ENHANCED BODY HTML with narrative elevation, data injection, and social reactions
//     console.log('✍️ Generating enhanced, narrative-rich cricket article with exclusive value (this may take up to 3 minutes)...');
//     const bodyPrompt = buildRewriteBodyHtmlPrompt({
//       rawTitle: article.title || "",
//       rawDescription: article.description || "",
//       rawBody: article.content || "",
//       recTitle: recs.recommendedTitle,
//       recMeta: recs.recommendedMeta,
//       recOutline: recs.outline,
//       recPrimary: recs.keywords?.primary || "",
//       recSecondary: recs.keywords?.secondary || "",
//       recTertiary: recs.keywords?.tertiary || "",
//       recLongtail: recs.keywords?.longtail || "",
//       recTrending: recs.keywords?.trending || "",
//     });
//     const bodyHtml = await generateWithDeepSeek(bodyPrompt, { temperature: 0.7, max_tokens: 5000 });
//     console.log('✅ Enhanced article body generated with narrative elevation and exclusive value');

//     // 3) wrap to full HTML doc and save
//     console.log('📦 Building final HTML document...');
//     const finalHtml = buildHtmlDocument({
//       title: recs.recommendedTitle,
//       metaDescription: recs.recommendedMeta,
//       bodyHtml,
//     });

//     await pollDBPool.query(
//       `UPDATE cricket_news
//          SET processed = 1,
//              processed_at = NOW(),
//              ready_article = ?,
//              final_title = ?,
//              final_meta  = ?,
//              final_slug  = ?
//        WHERE id = ?`,
//       [finalHtml, recs.recommendedTitle, recs.recommendedMeta, recs.recommendedSlug, id]
//     );

//     console.log(`✅ Article generation complete for ID: ${id}\n`);
//     return res.json({
//       success: true,
//       final: {
//         title: recs.recommendedTitle,
//         meta: recs.recommendedMeta,
//         slug: recs.recommendedSlug,
//         html: finalHtml
//       }
//     });
//   } catch (err) {
//     console.error("❌ Generate error:", err.message);
//     console.error("Full error:", err);
//     return res.status(500).json({ 
//       success: false, 
//       error: err.message || "Article generation failed. Please try again." 
//     });
//   }
// });


// app.post("/api/articles/:id/generate", async (req, res) => {
//   try {
//     const { id } = req.params;
//     console.log(`\n🚀 Starting article generation for ID: ${id}`);

//     const [rows] = await pollDBPool.query(
//       "SELECT * FROM cricket_news WHERE id = ?",
//       [id]
//     );
//     if (!rows.length) return res.status(404).json({ success:false, error:"Article not found" });
//     const article = rows[0];
//     console.log(`📰 Article found: ${article.title?.substring(0, 50)}...`);

//     // 1) ensure recommendations exist
//     let recs = null;
//     if (article.prepublish_recs) {
//       try { recs = JSON.parse(article.prepublish_recs); } catch {}
//     }
//     if (!recs || !recs.recommendedTitle) {
//       console.log('📋 Generating SEO recommendations...');
//       const prePrompt = buildPrePublishPrompt({
//         title: article.title || "",
//         description: article.description || "",
//         body: article.content || "",
//       });
//       const recText = await generateWithDeepSeek(prePrompt, { temperature: 0.2, max_tokens: 1200 });
//       recs = parsePrePublishTextToJSON(recText);
//       console.log('✅ SEO recommendations generated');

//       await pollDBPool.query(
//         "UPDATE cricket_news SET prepublish_recs = ? WHERE id = ?",
//         [JSON.stringify(recs), id]
//       );
//     } else {
//       console.log('✅ Using existing SEO recommendations');
//     }

//     // 2) generate ENHANCED BODY HTML with fact extraction & plagiarism check
//     console.log('✍️ Generating enhanced article with fact extraction & plagiarism detection (this may take 2-3 minutes)...');
//     const result = await generateEnhancedArticle({
//       rawTitle: article.title || "",
//       rawDescription: article.description || "",
//       rawBody: article.content || "",
//       recTitle: recs.recommendedTitle,
//       recMeta: recs.recommendedMeta,
//       recOutline: recs.outline,
//       keywords: recs.keywords,
//       useSimpleMode: false  // Set true for simpler, faster generation
//     });
    
//     const bodyHtml = result.html;
//     const plagiarismPercent = (result.plagiarismScore * 100).toFixed(2);
//     console.log(`✅ Article generated successfully!`);
//     console.log(`   📊 Plagiarism Score: ${plagiarismPercent}%`);
//     console.log(`   📝 Facts Extracted: ${result.facts.length}`);
//     console.log(`   🔄 Regenerated: ${result.wasRegenerated ? 'Yes' : 'No'}`);

//     // 3) wrap to full HTML doc and save
//     console.log('📦 Building final HTML document...');
//     const finalHtml = buildHtmlDocument({
//       title: recs.recommendedTitle,
//       metaDescription: recs.recommendedMeta,
//       bodyHtml,
//     });

//     // 4) Save to database with enhanced metadata
//     await pollDBPool.query(
//       `UPDATE cricket_news
//          SET processed = 1,
//              processed_at = NOW(),
//              ready_article = ?,
//              final_title = ?,
//              final_meta  = ?,
//              final_slug  = ?,
//              prepublish_recs = ?
//        WHERE id = ?`,
//       [
//         finalHtml, 
//         recs.recommendedTitle, 
//         recs.recommendedMeta, 
//         recs.recommendedSlug,
//         JSON.stringify({
//           ...recs,
//           plagiarismScore: plagiarismPercent + '%',
//           factsExtracted: result.facts.length,
//           wasRegenerated: result.wasRegenerated,
//           generatedAt: new Date().toISOString()
//         }),
//         id
//       ]
//     );

//     console.log(`✅ Article generation complete for ID: ${id}\n`);
//     return res.json({
//       success: true,
//       final: {
//         title: recs.recommendedTitle,
//         meta: recs.recommendedMeta,
//         slug: recs.recommendedSlug,
//         html: finalHtml
//       },
//       metadata: {
//         plagiarismScore: plagiarismPercent + '%',
//         factsExtracted: result.facts.length,
//         wasRegenerated: result.wasRegenerated,
//         facts: result.facts
//       }
//     });
//   } catch (err) {
//     console.error("❌ Generate error:", err.message);
//     console.error("Full error:", err);
//     return res.status(500).json({ 
//       success: false, 
//       error: err.message || "Article generation failed. Please try again." 
//     });
//   }
// });

// ONE-CLICK GENERATE: 4-Step Human-Like Pipeline
app.post("/api/articles/:id/generate", async (req, res) => {
  try {
    const { id } = req.params;
    const { use4Step = 'true' } = req.query; // Enable/disable 4-step pipeline
    
    console.log(`\n🚀 Starting article generation for ID: ${id}`);
    console.log(`📋 Pipeline mode: ${use4Step === 'true' ? '4-Step Human-Like' : 'Legacy'}`);

    const [rows] = await pollDBPool.query(
      "SELECT * FROM cricket_news WHERE id = ?",
      [id]
    );
    if (!rows.length) return res.status(404).json({ success:false, error:"Article not found" });
    const article = rows[0];
    console.log(`📰 Article found: ${article.title?.substring(0, 50)}...`);

    if (use4Step === 'true') {
      // ========== NEW: 4-STEP HUMAN-LIKE PIPELINE ==========
      console.log('🎯 Using 4-Step Human-Like Pipeline...\n');
      
      const result = await generate4StepArticle({
        title: article.title || "",
        description: article.description || "",
        content: article.content || ""
      });

      if (!result.success) {
        return res.status(500).json({ 
          success: false, 
          error: result.error,
          completedSteps: result.completedSteps,
          partialResults: result.partialResults
        });
      }

      // Check plagiarism
      const plagiarismScore = calculateNgramOverlap(
        result.finalOutput.article, 
        article.content, 
        4
      );
      const plagiarismPercent = (plagiarismScore * 100).toFixed(2);
      
      console.log(`\n📊 Quality Metrics:`);
      console.log(`   Plagiarism: ${plagiarismPercent}%`);
      console.log(`   Processing Time: ${(result.processingTime / 1000).toFixed(2)}s`);

      const finalHtml = buildHtmlDocument({
        title: result.finalOutput.title,
        metaDescription: result.finalOutput.metaDescription,
        bodyHtml: result.finalOutput.article,
      });

      await pollDBPool.query(
        `UPDATE cricket_news
           SET processed = 1,
               processed_at = NOW(),
               ready_article = ?,
               final_title = ?,
               final_meta  = ?,
               final_slug  = ?,
               prepublish_recs = ?
         WHERE id = ?`,
        [
          finalHtml,
          result.finalOutput.title,
          result.finalOutput.metaDescription,
          result.finalOutput.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
          JSON.stringify({
            title: result.finalOutput.title,
            meta: result.finalOutput.metaDescription,
            plagiarismScore: plagiarismPercent + '%',
            pipeline: '4-step-human-like',
            processingTime: result.processingTime,
            generatedAt: new Date().toISOString(),
            steps: {
              checklist: result.steps.step1_checklist ? 'completed' : 'failed',
              humanRewrite: result.steps.step2_humanRewritten ? 'completed' : 'failed',
              seoOptimization: result.steps.step3_seoOptimized ? 'completed' : 'failed',
              finalFormatting: result.steps.step4_finalArticle ? 'completed' : 'failed'
            }
          }),
          id
        ]
      );

      console.log(`✅ 4-Step article generation complete for ID: ${id}\n`);
      
      return res.json({
        success: true,
        pipeline: '4-step-human-like',
        final: {
          title: result.finalOutput.title,
          meta: result.finalOutput.metaDescription,
          slug: result.finalOutput.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
          html: finalHtml
        },
        metadata: {
          plagiarismScore: plagiarismPercent + '%',
          processingTime: result.processingTime,
          stepsCompleted: 4,
          steps: result.steps
        }
      });
      
    } else {
      // ========== LEGACY PIPELINE ==========
      console.log('📋 Using Legacy Pipeline...\n');
      
      // 1) ensure recommendations exist
      let recs = null;
      if (article.prepublish_recs) {
        try { recs = JSON.parse(article.prepublish_recs); } catch {}
      }
      if (!recs || !recs.recommendedTitle) {
        console.log('📋 Generating SEO recommendations...');
        const prePrompt = buildPrePublishPrompt({
          title: article.title || "",
          description: article.description || "",
          body: article.content || "",
        });
        const recText = await generateWithDeepSeek(prePrompt, { temperature: 0.2, max_tokens: 1200 });
        recs = parsePrePublishTextToJSON(recText);
        console.log('✅ SEO recommendations generated');

        await pollDBPool.query(
          "UPDATE cricket_news SET prepublish_recs = ? WHERE id = ?",
          [JSON.stringify(recs), id]
        );
      } else {
        console.log('✅ Using existing SEO recommendations');
      }

      // 2) generate ENHANCED BODY HTML
      console.log('✍️ Generating article...');
      const bodyPrompt = buildRewriteBodyHtmlPrompt({
        rawTitle: article.title || "",
        rawDescription: article.description || "",
        rawBody: article.content || "",
        recTitle: recs.recommendedTitle,
        recMeta: recs.recommendedMeta,
        recOutline: recs.outline,
        recPrimary: recs.keywords?.primary || "",
        recSecondary: recs.keywords?.secondary || "",
        recTertiary: recs.keywords?.tertiary || "",
        recLongtail: recs.keywords?.longtail || "",
        recTrending: recs.keywords?.trending || "",
      });
      const bodyHtml = await generateWithDeepSeek(bodyPrompt, { temperature: 0.7, max_tokens: 5000 });
      console.log('✅ Article body generated');

      // 3) Check plagiarism
      const plagiarismScore = calculateNgramOverlap(bodyHtml, article.content, 4);
      const plagiarismPercent = (plagiarismScore * 100).toFixed(2);
      console.log(`📊 Plagiarism: ${plagiarismPercent}%`);

      // 4) wrap to full HTML doc and save
      console.log('📦 Building final HTML document...');
      const finalHtml = buildHtmlDocument({
        title: recs.recommendedTitle,
        metaDescription: recs.recommendedMeta,
        bodyHtml,
      });

      await pollDBPool.query(
        `UPDATE cricket_news
           SET processed = 1,
               processed_at = NOW(),
               ready_article = ?,
               final_title = ?,
               final_meta  = ?,
               final_slug  = ?,
               prepublish_recs = ?
         WHERE id = ?`,
        [
          finalHtml, 
          recs.recommendedTitle, 
          recs.recommendedMeta, 
          recs.recommendedSlug,
          JSON.stringify({
            ...recs,
            plagiarismScore: plagiarismPercent + '%',
            pipeline: 'legacy',
            generatedAt: new Date().toISOString()
          }),
          id
        ]
      );

      console.log(`✅ Article generation complete for ID: ${id}\n`);
      return res.json({
        success: true,
        pipeline: 'legacy',
        final: {
          title: recs.recommendedTitle,
          meta: recs.recommendedMeta,
          slug: recs.recommendedSlug,
          html: finalHtml
        },
        metadata: {
          plagiarismScore: plagiarismPercent + '%'
        }
      });
    }

  } catch (err) {
    console.error("❌ Generate error:", err.message);
    console.error("Full error:", err);
    return res.status(500).json({ 
      success: false, 
      error: err.message || "Article generation failed. Please try again." 
    });
  }
});


// Process single article
app.post('/api/process-article/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get article from database using your existing pollDBPool
    const [rows] = await pollDBPool.query(
      'SELECT * FROM cricket_news WHERE id = ? AND processed = false',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Article not found or already processed' });
    }

    const article = rows[0];
    
    // Process with your existing logic
    const result = await processManualInput({
      title: article.title,
      description: article.description,
      content: article.content
    });

    if (result.success) {
      // Mark as processed using your existing pollDBPool
      await pollDBPool.query(
        'UPDATE cricket_news SET processed = true, processed_at = NOW(), ready_article = ? WHERE id = ?',
        [result.readyToPublishArticle, id]
      );
      res.json({ success: true, readyToPublishArticle: result.readyToPublishArticle });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error processing article:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


app.post('/api/manual-fetch-news', async (req, res) => {
  try {
    await newsScheduler.fetchAndStoreNews();
    res.json({ success: true, message: 'News fetched and stored successfully' });
  } catch (error) {
    console.error('Error manually fetching news:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get scheduler status
app.get('/api/scheduler-status', async (req, res) => {
  try {
    res.json({ 
      success: true, 
      isRunning: newsScheduler.isRunning,
      message: 'Scheduler is running and fetching news every 30 minutes'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== OPENAI GPT-4 REGENERATION ENDPOINT ==========
app.post("/api/articles/:id/regenerate-openai", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`\n🎨 Starting OpenAI GPT-4 regeneration for ID: ${id}`);

    const [rows] = await pollDBPool.query(
      "SELECT * FROM cricket_news WHERE id = ? AND processed = 1",
      [id]
    );
    
    if (!rows.length) {
      return res.status(404).json({ 
        success: false, 
        error: "Processed article not found" 
      });
    }
    
    const article = rows[0];
    console.log(`📰 Article found: ${article.title?.substring(0, 50)}...`);

    // Regenerate with OpenAI GPT-4
    const result = await regenerateWithOpenAI({
      title: article.title || "",
      description: article.description || "",
      content: article.content || ""
    });

    if (!result.success) {
      return res.status(500).json({ 
        success: false, 
        error: result.error 
      });
    }

    // Build full HTML document
    const finalHtml = buildHtmlDocument({
      title: result.title,
      metaDescription: result.metaDescription,
      bodyHtml: result.generatedArticle,
    });

    // Update database with OpenAI generated version
    await pollDBPool.query(
      `UPDATE cricket_news
         SET ready_article = ?,
             final_title = ?,
             final_meta  = ?,
             final_slug  = ?,
             prepublish_recs = ?
       WHERE id = ?`,
      [
        finalHtml,
        result.title,
        result.metaDescription,
        result.slug,
        JSON.stringify({
          title: result.title,
          meta: result.metaDescription,
          slug: result.slug,
          plagiarismScore: result.plagiarismScore,
          pipeline: 'openai-gpt4-cricket-addictor',
          model: result.model,
          style: result.style,
          processingTime: result.processingTime,
          regeneratedAt: new Date().toISOString()
        }),
        id
      ]
    );

    console.log(`✅ OpenAI regeneration complete for ID: ${id}\n`);
    
    return res.json({
      success: true,
      pipeline: 'openai-gpt4-regeneration',
      final: {
        title: result.title,
        meta: result.metaDescription,
        slug: result.slug,
        html: finalHtml
      },
      metadata: {
        plagiarismScore: result.plagiarismScore,
        processingTime: result.processingTime,
        model: result.model,
        style: result.style
      }
    });

  } catch (err) {
    console.error("❌ OpenAI regeneration error:", err.message);
    return res.status(500).json({ 
      success: false, 
      error: err.message || "OpenAI regeneration failed" 
    });
  }
});





// ===========================================
// CRICKET NEWS AUTOMATION APIs
// ===========================================

// Add this endpoint to your app.js
app.post("/api/get-ready-article", async (req, res) => {
  try {
    const { title, description, content } = req.body;

    if (!title || !description || !content) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: title, description, content"
      });
    }

    console.log(`🚀 Processing get-ready-article: ${title}`);

    // Use your existing processManualInput function
    const result = await processManualInput(
      { title, description, content },
      {
        language: "en",
        includePrePublishingChecks: true,
        includeHumanLikeRewriting: true,
        includeGoogleOptimization: true,
        avoidAIDetection: true
      }
    );

    if (result.success) {
      res.json({
        success: true,
        readyToPublishArticle: result.readyToPublishArticle,
        processingTime: result.processingTime
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error("Get ready article error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to process article"
    });
  }
});

// Fetch cricket news from GNews API
app.get("/api/fetch-cricket-news", async (req, res) => {
  try {
    const { 
      query = "cricket", 
      lang = "en", 
      country = "in", 
      max = 25,
      filters = "{}"
    } = req.query;

    console.log(`📰 Fetching cricket news: ${query}`);

    const newsResult = await fetchCricketNews({
      query,
      lang,
      country,
      max: parseInt(max)
    });

    if (!newsResult.success) {
      return res.status(500).json({
        success: false,
        error: newsResult.error
      });
    }

    // Apply filters if provided
    let filteredArticles = newsResult.articles;
    try {
      const filterOptions = JSON.parse(filters);
      filteredArticles = filterArticles(newsResult.articles, filterOptions);
    } catch (e) {
      // Use default filters if parsing fails
      filteredArticles = filterArticles(newsResult.articles);
    }

    // Add summary and validation to each article
    const processedArticles = filteredArticles.map(article => ({
      ...article,
      summary: getArticleSummary(article),
      validation: validateArticleForProcessing(article),
      wordCount: article.content ? article.content.split(' ').length : 0
    }));

    res.json({
      success: true,
      totalArticles: newsResult.totalArticles,
      filteredArticles: processedArticles.length,
      articles: processedArticles,
      fetchedAt: newsResult.fetchedAt
    });

  } catch (error) {
    console.error("Fetch cricket news error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch cricket news"
    });
  }
});

// Process selected article from GNews
app.post("/api/process-selected-article", async (req, res) => {
  try {
    const { article, options = {} } = req.body;

    if (!article || !article.title || !article.description || !article.content) {
      return res.status(400).json({
        success: false,
        error: "Invalid article data"
      });
    }

    const validation = validateArticleForProcessing(article);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: "Article validation failed",
        details: validation.errors
      });
    }

    console.log(`�� Processing selected article: ${article.title}`);

    // Use your existing processManualInput function
    const result = await processManualInput(
      { 
        title: article.title, 
        description: article.description, 
        content: article.content 
      },
      {
        language: options.language || "en",
        includePrePublishingChecks: options.includePrePublishingChecks !== false,
        includeHumanLikeRewriting: options.includeHumanLikeRewriting !== false,
        includeGoogleOptimization: options.includeGoogleOptimization !== false,
        avoidAIDetection: options.avoidAIDetection !== false
      }
    );

    res.json({
      success: true,
      readyToPublishArticle: result.readyToPublishArticle,
      originalArticle: {
        title: article.title,
        description: article.description,
        url: article.url,
        source: article.source?.name,
        publishedAt: article.publishedAt
      },
      processingTime: result.processingTime
    });

  } catch (error) {
    console.error("Process selected article error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to process selected article"
    });
  }
});


// Top of the file mein ye imports add karo


// ===========================================
// HINDI GSC BACKEND APIs - ADD TO MAIN FILE
// ===========================================


// Test APIs for Hindi automations
app.post("/api/test-hindi-content-refresh", async (req, res) => {
  try {
    await runHindiGscContentRefreshAutomation();
    res.json({ success: true, message: "Hindi content refresh automation completed" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/test-hindi-low-ctr", async (req, res) => {
  try {
    await runHindiGscLowCtrFixAutomation();
    res.json({ success: true, message: "Hindi low CTR fix automation completed" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/test-hindi-ranking-watchdog", async (req, res) => {
  try {
    await runHindiGscRankingWatchdog();
    res.json({ success: true, message: "Hindi ranking watchdog automation completed" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/test-hindi-content-query-match", async (req, res) => {
  try {
    await runHindiGscContentQueryMatch();
    res.json({ success: true, message: "Hindi content query match automation completed" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }z
});

// 1. Hindi GSC Content Refresh API
app.get("/api/gsc/hi/content-refresh", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 80;
  const offset = (page - 1) * limit;

  try {
    const [rows] = await pollDBPool.query(
      `
      SELECT id, url, keyword, old_position, new_position, old_clicks, new_clicks,
             old_impressions, new_impressions, deepseek_output,
             article_published_at, created_at
      FROM gsc_hindi_content_refresh_recommendations
      ORDER BY 
        article_published_at IS NULL,
        article_published_at DESC,
        created_at DESC
      LIMIT ? OFFSET ?
    `,
      [limit, offset]
    );

    const [countResult] = await pollDBPool.query(`
      SELECT COUNT(*) AS total FROM gsc_hindi_content_refresh_recommendations
    `);

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({ success: true, data: rows, page, totalPages });
  } catch (err) {
    console.error("❌ Hindi Content Refresh Fetch Error:", err.message);
    res.status(500).json({ success: false, error: "Failed to load data" });
  }
});

// 2. Hindi GSC Low CTR Fixes API
app.get("/api/gsc/hi/low-ctr", async (req, res) => {
  try {
    const [rows] = await pollDBPool.query(`
      SELECT * FROM gsc_hindi_low_ctr_fixes ORDER BY created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("❌ Failed to load Hindi low CTR fixes:", err.message);
    res.status(500).json({ success: false, error: "Failed to load data" });
  }
});

// 3. Hindi GSC Ranking Watchdog API
app.get("/api/gsc/hi/ranking-watchdog", async (req, res) => {
  try {
    const [rows] = await pollDBPool.query(`
      SELECT * FROM gsc_hindi_ranking_watchdog_alerts ORDER BY created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("❌ Failed to fetch Hindi watchdog data:", err.message);
    res.status(500).json({ success: false, error: "Failed to load data" });
  }
});

// 4. Hindi GSC Content Query Match API
app.get("/api/gsc/hi/content-query-match", async (req, res) => {
  try {
    const [rows] = await pollDBPool.query(`
      SELECT * FROM gsc_hindi_content_query_match ORDER BY created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("❌ Failed to load Hindi query match:", err.message);
    res.status(500).json({ success: false, error: "Failed to load data" });
  }
});

// 5. Test APIs for Hindi automations
app.post("/api/test-hindi-content-refresh", async (req, res) => {
  try {
    await runHindiGscContentRefreshAutomation();
    res.json({ success: true, message: "Hindi content refresh automation completed" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/test-hindi-low-ctr", async (req, res) => {
  try {
    await runHindiGscLowCtrFixAutomation();
    res.json({ success: true, message: "Hindi low CTR fix automation completed" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/test-hindi-ranking-watchdog", async (req, res) => {
  try {
    await runHindiGscRankingWatchdog();
    res.json({ success: true, message: "Hindi ranking watchdog automation completed" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/test-hindi-content-query-match", async (req, res) => {
  try {
    await runHindiGscContentQueryMatch();
    res.json({ success: true, message: "Hindi content query match automation completed" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

























// Hindi GSC AI Reports API
app.get("/api/gsc/hi/ai-reports", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 80;
  const offset = (page - 1) * limit;

  try {
    const [rows] = await pollDBPool.query(
      `
      SELECT 
        id, 
        url, 
        impressions, 
        clicks, 
        ctr, 
        position, 
        gsc_queries,
        deepseek_output, 
        created_at, 
        article_published_at
      FROM gsc_hindi_ai_recommendations 
      ORDER BY 
        article_published_at IS NULL,
        article_published_at DESC,
        created_at DESC
      LIMIT ? OFFSET ?
    `,
      [limit, offset]
    );

    const [countResult] = await pollDBPool.query(`
      SELECT COUNT(*) AS total FROM gsc_hindi_ai_recommendations
    `);

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({ success: true, data: rows, page, totalPages });
  } catch (err) {
    console.error("❌ Hindi GSC AI Report Fetch Error:", err.message);
    res.status(500).json({ success: false, error: "Failed to load Hindi reports" });
  }
});

// Test Hindi GSC automation
app.post("/api/test-hindi-gsc", async (req, res) => {
  try {
    await runHindiGscDeepSeekAutomation();
    res.json({ success: true, message: "Hindi GSC automation completed" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
// It connects to your Google Search Console and fetches up to 5000 pages that appeared in search results over the past week.

// It filters pages that have high impressions but low clicks and CTR (i.e., underperforming pages).

// It skips pages that were already analyzed earlier (avoids duplicates).

// For each new underperforming page, it fetches related search queries and scrapes the content, title, and meta description.

// It sends this info to DeepSeek AI, which suggests SEO improvements (keywords, meta, headings, etc.).

// Finally, it saves all suggestions to your database for later use by your SEO/content team.

//automation gec ai report


// Add this to your main backend file
app.get("/api/debug-gsc", async (req, res) => {
  try {
    const { google } = require('googleapis');
    const fs = require('fs');
    const path = require('path');
    
    const TEMP_KEY_PATH = path.join(__dirname, 'gsc_key_temp.json');
    
    // Check if key file exists and its content
    const keyFileExists = fs.existsSync(TEMP_KEY_PATH);
    let keyFileContent = null;
    let decodedCredentials = null;
    
    if (keyFileExists) {
      keyFileContent = fs.readFileSync(TEMP_KEY_PATH, 'utf8');
      try {
        decodedCredentials = JSON.parse(keyFileContent);
      } catch (e) {
        decodedCredentials = { error: "Invalid JSON" };
      }
    }
    
    // Check environment variable
    const envCredentials = process.env.GSC_CREDENTIALS_BASE64;
    
    res.json({
      keyFileExists,
      keyFileSize: keyFileExists ? fs.statSync(TEMP_KEY_PATH).size : 0,
      envCredentialsExists: !!envCredentials,
      envCredentialsLength: envCredentials ? envCredentials.length : 0,
      decodedCredentials: decodedCredentials ? {
        type: decodedCredentials.type,
        project_id: decodedCredentials.project_id,
        client_email: decodedCredentials.client_email,
        private_key_id: decodedCredentials.private_key_id
      } : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Add this endpoint
app.get("/api/gsc-sites", async (req, res) => {
  try {
    const { google } = require('googleapis');
    const fs = require('fs');
    const path = require('path');
    
    const TEMP_KEY_PATH = path.join(__dirname, 'gsc_key_temp.json');
    const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];
    
    if (!fs.existsSync(TEMP_KEY_PATH)) {
      return res.json({ error: "GSC key file not found" });
    }
    
    const auth = new google.auth.GoogleAuth({
      keyFile: TEMP_KEY_PATH,
      scopes: SCOPES,
    });

    const authClient = await auth.getClient();
    const webmasters = google.webmasters({ version: 'v3', auth: authClient });

    // List all sites
    const sites = await webmasters.sites.list();
    
    res.json({
      success: true,
      sites: sites.data.siteEntry || [],
      serviceAccountEmail: authClient.email
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error.response?.data || 'No additional details'
    });
  }
});


const vectorstore = require("./embeddings/vectorstore.json");
// const { internalDBPool } = require("./config/db");
// const axios = require("axios");
const cosineSimilarity = (a, b) => {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (normA * normB);
};

app.post("/chat", async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ answer: "❌ No question provided." });

  try {
    // Get embedding for question
    const response = await axios.post("http://localhost:11434/api/embeddings", {
      model: "nomic-embed-text",
      prompt: question,
    });

    const userEmbedding = response.data.embedding;

    // Find most relevant article
    let bestMatch = null;
    let bestScore = -Infinity;

    for (const item of vectorstore) {
      const score = cosineSimilarity(userEmbedding, item.embedding);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = item;
      }
    }

    // Fetch article content
    const [rows] = await internalDBPool.query(
      `SELECT title, content FROM blog_posts WHERE id = ? LIMIT 1`,
      [bestMatch.id]
    );

    const content = rows[0]?.content || "";

    // Send to DeepSeek for summarization
    const dsResponse = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "Answer the question based on this article:" },
          { role: "user", content: `${question}\n\nArticle: ${content}` },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.json({
      source: bestMatch.slug,
      answer: dsResponse.data.choices[0].message.content,
    });
  } catch (err) {
    console.error("❌ Chat error:", err.message);
    res.status(500).json({ answer: "❌ Internal Server Error" });
  }
});




/* =====================================================================
   POST /api/translate-url-deepseek     ->  returns Hindi article
   =================================================================== */
app.post("/api/translate-url-deepseek", async (req, res) => {
  const { url } = req.body;
  if (!url)
    return res.status(400).json({ success: false, error: "Missing URL" });

  try {
    /* 1️⃣  pull title + text ------------------------------------------------ */
    const resp = await axios.get(url, { timeout: 15000 });
    const $ = cheerio.load(resp.data);

    const title = $("title").text().trim() || "Untitled";
    let body = "";
    $("p").each((_, el) => {
      body += $(el).text() + "\n";
    });

    if (!body.trim())
      throw new Error("No article text found on page");

    // Cut down to avoid hitting token limits
    const textForModel = body.slice(0, 3500);

    /* 2️⃣  updated DeepSeek prompt ------------------------------------------ */
    const prompt = `
You are a senior Hindi content writer working for a popular cricket news website.
I will provide you with an English cricket article. Your task is to translate it into easy-to-read, engaging, and contextually accurate Hindi, suitable for Indian readers of all age groups.

Guidelines:
• Use natural Hindi, not word-for-word literal translation.
• Maintain a professional yet fan-friendly tone, like that of websites such as Cricket Addictor, Cricbuzz Hindi, or Navbharat Times.
• Keep cricket terminology and player names intact (don’t translate names or score numbers).
• Translate headlines and subheadings in a click-worthy, SEO-friendly style.
• If any English phrases or cricket-specific terms are more commonly used in English (e.g., “T20,” “No-Ball,” “Man of the Match”), retain them.
• Ensure the grammar is clean, and the article flows naturally like it was originally written in Hindi.
• Use simple Hindi like people reading and writing nowadays.
• Use tables if there is any table in the article – use the table with the same values.
• Use bullet points if required.
• Make minor improvements to ensure the content is helpful and aligns with Google’s helpful content policies.
• Format the article with clearly defined:
  - SEO Title
  - Meta Description
  - Headline
  - Article Body
  - Subheadings
  - FAQs (if relevant)

Do not change the context of the article.

--- English Article ---
Title: ${title}
Content:
${textForModel}

--- Now write the Hindi article as per the above instructions ---
`;

    /* 3️⃣  call DeepSeek --------------------------------------------------- */
    const dsRes = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1800,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const hindiArticle = dsRes.data.choices[0].message.content.trim();

    /* 4️⃣  return ---------------------------------------------------------- */
    return res.json({
      success: true,
      title: title,
      hindi: hindiArticle,
    });

  } catch (err) {
    console.error("❌ [DeepSeek Hindi] Error:", err.message);
    res.status(500).json({
      success: false,
      error: "Translation failed",
      message: err.message,
    });
  }
});

















// cron.schedule(
//   "0 9,16 * * *",
//   async () => {
//     const now = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
//     console.log(`🚀 [${now} IST] Starting scheduled GSC AI analysis...`);
//     try {
//       await runGscDeepSeekAutomation();
//       console.log("✅ GSC AI analysis complete.");

//         await runHindiGscDeepSeekAutomation();
//       console.log("✅ Hindi GSC AI analysis complete.");
//       await runGscContentRefreshAutomation();
//       console.log("✅ GSC refresh complete.");
//       await runGscTrendingKeywords();
//       console.log("✅ keyword.");

//       await runGscLowCtrFixAutomation();

//       await runGscRankingWatchdog();
//     } catch (error) {
//       console.error("❌ GSC AI automation failed:", error);
//     }
//   },
//   {
//     timezone: "Asia/Kolkata",
//   }
// );

// Update your existing cron schedule to include Hindi automations:
cron.schedule(
  "0 9,16 * * *",
  async () => {
    const now = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
    console.log(`🚀 [${now} IST] Starting scheduled GSC AI analysis...`);
    try {
      // English automations
      await runGscDeepSeekAutomation();
      console.log("✅ English GSC AI analysis complete.");
      await runGscContentRefreshAutomation();
      console.log("✅ English GSC refresh complete.");
      await runGscLowCtrFixAutomation();
      console.log("✅ English low CTR fix complete.");
      await runGscRankingWatchdog();
      console.log("✅ English ranking watchdog complete.");

      // Hindi automations
      await runHindiGscDeepSeekAutomation();
      console.log("✅ Hindi GSC AI analysis complete.");
      await runHindiGscContentRefreshAutomation();
      console.log("✅ Hindi content refresh complete.");
      await runHindiGscLowCtrFixAutomation();
      console.log("✅ Hindi low CTR fix complete.");
      await runHindiGscRankingWatchdog();
      console.log("✅ Hindi ranking watchdog complete.");
      await runHindiGscContentQueryMatch();
      console.log("✅ Hindi content query match complete.");
    } catch (error) {
      console.error("❌ GSC automation failed:", error);
    }
  },
  {
    timezone: "Asia/Kolkata",
  }
);



// ----------------------- news summary
app.get("/api/article_summaries", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10; // adjust as needed
    const offset = (page - 1) * limit;

    const [rows] = await pollDBPool.query(
      `SELECT id, url, summary_60, summary_100, summary_250, summary_900, created_at
       FROM article_summaries_simplified
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const [[{ total = 0 }]] = await pollDBPool.query(
      `SELECT COUNT(*) as total FROM article_summaries_simplified`
    );

    res.json({
      success: true,
      data: rows,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (err) {
    console.error("❌ API error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});
// -------------------------------------------------

cron.schedule("0 0 * * *", async () => {
  try {
    const query = `
      UPDATE users
      SET status = 'expired'
      WHERE status = 'trial' AND trial_end_date < NOW();
    `;
    const [result] = await pollDBPool.query(query);
    console.log(
      `Expired trials updated: ${result.affectedRows} rows affected.`
    );
  } catch (error) {
    console.error("Error updating expired trials:", error);
  }
});

// -----------------------------------------------------------------------------------gsc report from db apis---------------------
app.get("/api/gsc-ai-reports", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 80;
  const offset = (page - 1) * limit;
  
  // Sorting parameters
  const sortBy = req.query.sortBy || 'created_at';
  const sortOrder = req.query.sortOrder || 'desc';
  
  // Validate sortBy field
  const allowedSortFields = ['impressions', 'clicks', 'ctr', 'position', 'created_at'];
  const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
  const validSortOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  try {
    const [rows] = await pollDBPool.query(
      `
      SELECT 
        id, 
        url, 
        impressions, 
        clicks, 
        ctr, 
        position, 
        deepseek_output, 
        created_at, 
        article_published_at
      FROM gsc_ai_recommendations 
      ORDER BY ${validSortBy} ${validSortOrder}
      LIMIT ? OFFSET ?
    `,
      [limit, offset]
    );

    const [countResult] = await pollDBPool.query(`
      SELECT COUNT(*) AS total FROM gsc_ai_recommendations
    `);

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({ 
      success: true, 
      data: rows, 
      page, 
      totalPages,
      sortBy: validSortBy,
      sortOrder: validSortOrder.toLowerCase()
    });
  } catch (err) {
    console.error("❌ GSC AI Report Fetch Error:", err.message);
    res.status(500).json({ success: false, error: "Failed to load reports" });
  }
});

// Get service account email for GSC access
app.get("/api/gsc/service-account-email", async (req, res) => {
  try {
    const envCredentials = process.env.GSC_CREDENTIALS_BASE64;
    if (!envCredentials) {
      return res.status(400).json({ 
        success: false, 
        error: "GSC_CREDENTIALS_BASE64 not found in environment" 
      });
    }

    const decoded = Buffer.from(envCredentials, 'base64').toString('utf-8');
    const credentials = JSON.parse(decoded);
    const serviceAccountEmail = credentials.client_email;

    res.json({
      success: true,
      serviceAccountEmail,
      instructions: [
        "1. Copy the service account email above",
        "2. Go to Google Search Console: https://search.google.com/search-console",
        "3. Select property: https://cricketaddictor.com",
        "4. Click 'Settings' (gear icon) in left sidebar",
        "5. Click 'Users and permissions'",
        "6. Click 'Add user' button",
        "7. Paste the service account email",
        "8. Select permission: 'Full' or 'Restricted' (Full recommended)",
        "9. Click 'Add'",
        "10. Wait 5-10 minutes for permissions to propagate",
        "11. Then try running the automation again"
      ]
    });
  } catch (err) {
    console.error("❌ Error getting service account email:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Manual trigger endpoint to update GSC AI reports
app.post("/api/gsc-ai-reports/update", async (req, res) => {
  try {
    console.log("🚀 Manual GSC AI update triggered...");
    res.json({ 
      success: true, 
      message: "GSC AI update started. Check server logs for progress.",
      note: "This may take several minutes. Data will be updated automatically."
    });
    
    // Run in background (don't wait for it)
    runGscDeepSeekAutomation().catch(err => {
      console.error("❌ Manual GSC AI update failed:", err);
    });
  } catch (err) {
    console.error("❌ Manual trigger error:", err.message);
    res.status(500).json({ success: false, error: "Failed to trigger update" });
  }
});

app.get("/api/gsc-content-refresh", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 80;
  const offset = (page - 1) * limit;
  
  // Sorting parameters
  const sortBy = req.query.sortBy || 'created_at';
  const sortOrder = req.query.sortOrder || 'desc';
  
  // Validate sortBy field
  const allowedSortFields = ['old_position', 'new_position', 'old_clicks', 'new_clicks', 'old_impressions', 'new_impressions', 'created_at'];
  const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
  const validSortOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  try {
    const [rows] = await pollDBPool.query(
      `
      SELECT id, url, keyword, old_position, new_position, old_clicks, new_clicks,
             old_impressions, new_impressions, deepseek_output,
             article_published_at, created_at
      FROM gsc_content_refresh_recommendations
      ORDER BY ${validSortBy} ${validSortOrder}
      LIMIT ? OFFSET ?
    `,
      [limit, offset]
    );

    const [countResult] = await pollDBPool.query(`
      SELECT COUNT(*) AS total FROM gsc_content_refresh_recommendations
    `);

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({ 
      success: true, 
      data: rows, 
      page, 
      totalPages,
      sortBy: validSortBy,
      sortOrder: validSortOrder.toLowerCase()
    });
  } catch (err) {
    console.error("❌ Content Refresh Fetch Error:", err.message);
    res.status(500).json({ success: false, error: "Failed to load data" });
  }
});

app.get("/api/gsc-low-ctr", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 80;
  const offset = (page - 1) * limit;
  
  // Sorting parameters
  const sortBy = req.query.sortBy || 'created_at';
  const sortOrder = req.query.sortOrder || 'desc';
  
  // Validate sortBy field
  const allowedSortFields = ['ctr', 'position', 'created_at'];
  const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
  const validSortOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  try {
    const [rows] = await pollDBPool.query(`
      SELECT * FROM gsc_low_ctr_fixes 
      ORDER BY ${validSortBy} ${validSortOrder}
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    const [countResult] = await pollDBPool.query(`
      SELECT COUNT(*) AS total FROM gsc_low_ctr_fixes
    `);

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({ 
      success: true, 
      data: rows,
      page,
      totalPages,
      sortBy: validSortBy,
      sortOrder: validSortOrder.toLowerCase()
    });
  } catch (err) {
    console.error("❌ Failed to load low CTR fixes:", err.message);
    res.status(500).json({ success: false, error: "Failed to load data" });
  }
});

app.get("/api/gsc-trending-keywords", async (req, res) => {
  try {
    const [rows] = await pollDBPool.query(`
      SELECT 
        id, 
        keywords_json, 
        ai_output, 
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS published_date
      FROM gsc_trending_keywords
      ORDER BY created_at DESC
    `);

    // Optional: parse keywords_json for frontend
    const formattedRows = rows.map((row) => ({
      ...row,
      keywords: JSON.parse(row.keywords_json),
    }));

    res.json({ success: true, data: formattedRows });
  } catch (err) {
    console.error("❌ Failed to fetch trending keywords:", err.message);
    res.status(500).json({ success: false, error: "Failed to load data" });
  }
});

app.get("/api/gsc-ranking-watchdog", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 80;
  const offset = (page - 1) * limit;
  
  // Sorting parameters
  const sortBy = req.query.sortBy || 'created_at';
  const sortOrder = req.query.sortOrder || 'desc';
  
  // Validate sortBy field
  const allowedSortFields = ['last_week_position', 'current_position', 'created_at'];
  const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
  const validSortOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  try {
    const [rows] = await pollDBPool.query(`
      SELECT * FROM gsc_ranking_watchdog_alerts 
      ORDER BY ${validSortBy} ${validSortOrder}
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    const [countResult] = await pollDBPool.query(`
      SELECT COUNT(*) AS total FROM gsc_ranking_watchdog_alerts
    `);

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({ 
      success: true, 
      data: rows,
      page,
      totalPages,
      sortBy: validSortBy,
      sortOrder: validSortOrder.toLowerCase()
    });
  } catch (err) {
    console.error("❌ Failed to fetch watchdog data:", err.message);
    res.status(500).json({ success: false, error: "Failed to load data" });
  }
});

app.get("/api/gsc-content-query-match", async (req, res) => {
  try {
    const [rows] = await pollDBPool.query(`
      SELECT * FROM gsc_content_query_match ORDER BY created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("❌ Failed to load query match:", err.message);
    res.status(500).json({ success: false, error: "Failed to load data" });
  }
});
// -------------------------------------------------------------------------------------------------------------------------------

// -----------------------------------------------our db ----------------------------------------
// const { fetchAndProcessFeed } = require('./seoScheduler');

// fetchAndProcessFeed(); // Run once on server start

// setInterval(() => {
//   console.log('⏱️ Cron: Running every 5 minutes...');
//   fetchAndProcessFeed();
// }, 5 * 60 * 1000);

//

// 🔹 GET latest 5 reports
app.get("/api/reports-json", async (req, res) => {
  try {
    const [rows] = await pollDBPool.query(`
      SELECT id, title, url, full_gpt_text,published_date, created_at
      FROM seo_reports_json
      ORDER BY created_at DESC
      LIMIT 20
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("❌ [Fetch Reports] Error:", err.message);
    res.status(500).json({ success: false, error: "Failed to fetch reports." });
  }
});

// 🔹 GET report by URL
app.get("/api/reports-json/search", async (req, res) => {
  const { url } = req.query;
  if (!url)
    return res.status(400).json({ success: false, error: "Missing URL." });

  try {
    const [rows] = await pollDBPool.query(
      `
      SELECT id, title, url, full_gpt_text, created_at
      FROM seo_reports_json
      WHERE url LIKE ?
      ORDER BY created_at DESC
      LIMIT 1
    `,
      [`%${url}%`]
    );

    if (rows.length === 0) {
      return res.json({
        success: false,
        message: "No report found for this URL.",
      });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("❌ [Search Report] Error:", err.message);
    res.status(500).json({ success: false, error: "Failed to search report." });
  }
});

// -----------------------------------------------------------------------------------------------------

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ----------------------------------------------------gsc onsight deep seek report ---------------------------------

app.get("/api/gsc/insight-deepseek", async (req, res) => {
  const { url } = req.query;
  if (!url)
    return res.status(400).json({ success: false, error: "Missing URL" });

  try {
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const queries = await getSearchConsoleQueries(startDate, endDate);

    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const title = $("title").text();
    const meta = $('meta[name="description"]').attr("content") || "";
    let body = "";
    $("p").each((i, el) => {
      body += $(el).text() + "\n";
    });

    const prompt = `
You are an expert SEO strategist.

GSC Queries:
${queries
  .map(
    (q) =>
      `- ${q.keys[0]} | Clicks: ${q.clicks}, Impressions: ${
        q.impressions
      }, CTR: ${(q.ctr * 100).toFixed(2)}%, Position: ${q.position.toFixed(2)}`
  )
  .join("\n")}

Title: ${title}
Meta: ${meta}
Content: ${body.slice(0, 3000)}

Give:
1. Queries needing optimization
2. New keywords/topics
3. Meta title & description
4. H2/H3s
5. Intro/conclusion rewrite
6. Schema suggestions
7. Internal links
`;

    const dsRes = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 1500,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const output = dsRes.data.choices[0].message.content;

    res.json({ success: true, data: output });
  } catch (err) {
    console.error("❌ DeepSeek Insight Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});
// -----------------------------------------------------------------------------------------------------------------------------

// ---------------------------------------------------------chat gpt analysis ---------------------------------------------------

// === ROUTE: GET /api/analyze-url ===
app.get("/api/analyze-url", async (req, res) => {
  const { url } = req.query;
  if (!url)
    return res.status(400).json({ success: false, error: "Missing URL" });

  try {
    console.log(`🔍 [Analyze] Fetching URL: ${url}`);
    const articleData = await extractArticleData1(url);

    const competitors = await getSimulatedCompetitors(articleData.title);

    const seoReport = await analyzeAndSuggest(articleData, competitors);

    res.json({
      success: true,
      title: articleData.title,
      url,
      seo_report: seoReport,
    });
  } catch (error) {
    console.error("❌ [Analyze] Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to analyze URL",
      message: error.message,
    });
  }
});

async function extractArticleData1(url) {
  try {
    const res = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(res.data);

    const title = $("title").text().trim() || "No Title";
    const metaDescription =
      $('meta[name="description"]').attr("content") || "No Description";

    let content = "";
    $("p").each((_, el) => {
      content += $(el).text() + "\n";
    });

    if (!title || !content.trim()) {
      throw new Error("No valid title or article content found.");
    }

    return {
      title,
      description: metaDescription,
      body: content.slice(0, 3500), // safe limit for GPT input
    };
  } catch (err) {
    console.error("❌ [extractArticleData] Failed:", err.message);
    throw err;
  }
}

async function getSimulatedCompetitors(keyword) {
  const prompt = `
You are an SEO expert. Based on this keyword: "${keyword}", simulate the top 4 competitor article summaries that are ranking on Google.

Return like this:

1. [Title] - [URL]
   - H2s used:
   - Content Highlights:
   - Schema Used:
`;

  const res = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });

  return res.choices[0].message.content;
}

async function analyzeAndSuggest({ title, description, body }, competitors) {
  const prompt = `
You're an expert SEO content strategist and writer.

Your job is to deeply analyze a cricket article and improve its search performance by comparing it with top-ranking competitors.

---

### 🔧 Your Tasks:

1. *SEO Gap Report*  
   Identify all SEO issues in table format with columns:  
   *Section | Issue | Suggestion*  
   (e.g., Title too generic, meta missing target keyword, lacks internal links, etc.)

2. *Writing Pattern Analysis*  
   Analyze how top-ranking articles are written:
   - Use of headings and subheadings  
   - Tone (conversational, formal, stat-heavy, etc.)  
   - Structure (FAQs, lists, stats tables, expert quotes)  
   - Visual elements (tables, embedded content, etc.)

   Summarize key differences in structure between our article and competitors.

3. *Keyword Research*  
   Based on article and competitors, identify:
   - *Primary Keyword*
   - *Secondary Keywords*
   - *Long-tail opportunities*
   - *Missed keyword intents* (e.g., "Dream11 team today," "player stats," "who will win today")

   Present in markdown table:  
   *Keyword | Type | Suggested Usage*

4. *Recommended Rewrite*  
   Write a fully optimized, rewritten version of the article incorporating:
   - All SEO suggestions  
   - Target keywords  
   - Competitor-inspired structure and writing pattern  
   - Better headlines and meta

---

### 🔍 Inputs

*Article Title:*  
${title}

*Meta Description:*  
${description}

*Body:*  
${body}

*Top Ranking Competitor Summaries:*  
${competitors}

---

### 🧠 Return the following output in order:

#### 📊 SEO GAP REPORT (Markdown Table)
| Section | Issue | Suggestion |
|---------|-------|------------|

---

#### 📝 WRITING PATTERN ANALYSIS
(Paragraph format comparing structure, tone, depth, etc.)

---

#### 🔑 KEYWORD RESEARCH SUMMARY
| Keyword | Type | Suggested Usage |
|---------|------|------------------|

---

#### ✅ RECOMMENDED REWRITE
(Write the improved version of the article)
`;

  const res = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [{ role: "user", content: prompt }],
    temperature: 0,
    seed: 42,
  });

  return res.choices[0].message.content;
}

// -------------------------------------------------------------------------------------------------------------------------------

// -----------------------------deep seek analysis AUTOMATION FROM FEED/PUBLISH BOTH -----------------------------------------------------------------------------------

//new for productio issue timeout

const jobQueue = []; // 🟢 In-memory job queue

// ✅ Extract Article Content
async function extractArticleData(url) {
  try {
    const res = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(res.data);

    const title = $("title").text().trim() || "No Title";
    const metaDescription =
      $('meta[name="description"]').attr("content") || "No Description";

    let content = "";
    $("p").each((_, el) => {
      content += $(el).text() + "\n";
    });

    if (!title || !content.trim()) {
      throw new Error("No valid title or article content found.");
    }

    return {
      title,
      description: metaDescription,
      body: content.slice(0, 3500),
    };
  } catch (err) {
    console.error("❌ [extractArticleData] Failed:", err.message);
    throw err;
  }
}

// ✅ Generate Competitor Simulations with DeepSeek
async function getSimulatedCompetitorsWithDeepSeek(keyword) {
  const prompt = `
You are an SEO expert. Based on this keyword: "${keyword}", simulate the top 4 competitor article summaries that are ranking on Google.

Return like this:

1. [Title] - [URL]
   - H2s used:
   - Content Highlights:
   - Schema Used:
`;

  const dsRes = await axios.post(
    "https://api.deepseek.com/v1/chat/completions",
    {
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 800,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  return dsRes.data.choices[0].message.content;
}

// ✅ Analyze and Suggest SEO Improvement with DeepSeek automate 
async function analyzeAndSuggestWithDeepSeek(
  { title, description, body },
  competitors,
  language = "en" // "en" for English (default), "hi" for Hindi
) {
  const isHindi = language === "hi";

  const prompt = isHindi
    ? `
आप एक विशेषज्ञ SEO कंटेंट स्ट्रैटेजिस्ट और लेखक हैं।

आपका कार्य एक क्रिकेट लेख का गहन विश्लेषण करना और शीर्ष रैंकिंग वाले प्रतिस्पर्धियों से तुलना करके उसकी सर्च परफॉर्मेंस को बेहतर बनाना है।

---

### 🔧 आपके कार्य:

1. *SEO गैप रिपोर्ट*  
   सभी SEO समस्याओं को नीचे दी गई तालिका में पहचानें:  
   *अनुभाग | समस्या | सुझाव*

2. *लेखन पैटर्न विश्लेषण*

3. *कीवर्ड अनुसंधान*  
| कीवर्ड | प्रकार | उपयोग का सुझाव |

4. *अनुशंसित पुनर्लेखन*

---

### 🔍 इनपुट:

*लेख का शीर्षक:*  
${title}

*मेटा विवरण:*  
${description}

*मुख्य लेख:*  
${body}

*शीर्ष रैंकिंग वाले प्रतिस्पर्धी लेखों के सारांश:*  
${competitors}

---

### 🧠 कृपया नीचे दिए गए अनुसार आउटपुट दें:

#### 📊 SEO GAP REPORT (Markdown तालिका)
| अनुभाग | समस्या | सुझाव |
|--------|--------|--------|

---

#### 📝 लेखन पैटर्न विश्लेषण

---

#### 🔑 कीवर्ड अनुसंधान सारांश
| कीवर्ड | प्रकार | उपयोग का सुझाव |
|--------|--------|-----------------|

---

#### ✅ अनुशंसित पुनर्लेखन
`
    : `
You're an expert SEO content strategist and writer.

Your job is to deeply analyze a cricket article and improve its search performance by comparing it with top-ranking competitors.

---

### 🔧 Your Tasks:

1. *SEO Gap Report*  
   Identify all SEO issues in table format with columns:  
   *Section | Issue | Suggestion*  

2. *Writing Pattern Analysis*  

3. *Keyword Research*  
| Keyword | Type | Suggested Usage |

4. *Recommended Rewrite*

---

### 🔍 Inputs

*Article Title:*  
${title}

*Meta Description:*  
${description}

*Body:*  
${body}

*Top Ranking Competitor Summaries:*  
${competitors}

---

### 🧠 Return the following output in order:

#### 📊 SEO GAP REPORT (Markdown Table)
| Section | Issue | Suggestion |
|---------|-------|------------|

---

#### 📝 WRITING PATTERN ANALYSIS

---

#### 🔑 KEYWORD RESEARCH SUMMARY
| Keyword | Type | Suggested Usage |
|---------|------|------------------|

---

#### ✅ RECOMMENDED REWRITE
`;

  const dsRes = await axios.post(
    "https://api.deepseek.com/v1/chat/completions",
    {
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 1800,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  return dsRes.data.choices[0].message.content;
}



// ✅ API to initiate a DeepSeek job
app.post("/api/analyze-url-deepseek-job", async (req, res) => {
  const { url } = req.body;
  if (!url)
    return res.status(400).json({ success: false, error: "Missing URL" });

  try {
    const [insertResult] = await pollDBPool.query(
      `INSERT INTO seo_analysis_jobs (url, status, created_at) VALUES (?, 'queued', NOW())`,
      [url]
    );

    const jobId = insertResult.insertId;

    // ✅ FIX: include 'source' field
    jobQueue.push({
      jobId,
      url,
      source: "seo_analysis_jobs", // 🔥 Required to route the job properly
    });

    res.json({ success: true, jobId });
  } catch (err) {
    console.error("❌ [Job Queue] Insert Error:", err.message);
    res.status(500).json({ success: false, error: "Failed to queue job" });
  }
});


// ✅ API to check job status/result
app.get("/api/analyze-url-deepseek-status", async (req, res) => {
  const { jobId } = req.query;
  if (!jobId)
    return res.status(400).json({ success: false, error: "Missing jobId" });

  try {
    const [rows] = await pollDBPool.query(
      `SELECT id, status, result, error FROM seo_analysis_jobs WHERE id = ?`,
      [jobId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: "DB error" });
  }
});




// ------------------------------------------------

setInterval(async () => {
  if (jobQueue.length === 0) {
    return;
  }

  const job = jobQueue.shift();

  if (!job.source) {
    return;
  }


  try {
    let articleData;

    if (job.source === "seo_analysis_jobs") {
      articleData = await extractArticleData(job.url);
    } else if (job.source === "manual_seo_jobs") {
      if (!job.title || !job.body) {
        throw new Error("Missing title or body in manual job");
      }

      articleData = {
        title: job.title,
        description: job.description || "",
        body: job.body || "",
      };
    } else {
      // console.warn(`[service] ⚠️ Unknown job source: ${job.source}`);
      return;
    }

    // console.log(`📈 Fetching competitor data...`);
    const competitors = await getSimulatedCompetitorsWithDeepSeek(articleData.title);

    // console.log(`🧠 Running DeepSeek Analysis [lang: ${job.language || "en"}]`);
    const seoReport = await analyzeAndSuggestWithDeepSeek(
      articleData,
      competitors,
      job.language || "en"
    );

    const updateQuery =
      job.source === "seo_analysis_jobs"
        ? `UPDATE seo_analysis_jobs SET status = 'completed', result = ?, updated_at = NOW() WHERE id = ?`
        : `UPDATE manual_seo_jobs SET status = 'completed', result = ?, updated_at = NOW() WHERE id = ?`;

    await pollDBPool.query(updateQuery, [seoReport, job.jobId]);
    console.log(`✅ Job Completed: ${job.jobId}`);
  } catch (err) {
    console.error(`[service] ❌ Job Failed [${job.jobId}]`, err.message);

    const failQuery =
      job.source === "seo_analysis_jobs"
        ? `UPDATE seo_analysis_jobs SET status = 'failed', error = ?, updated_at = NOW() WHERE id = ?`
        : `UPDATE manual_seo_jobs SET status = 'failed', error = ?, updated_at = NOW() WHERE id = ?`;

    await pollDBPool.query(failQuery, [err.message || "Unknown error", job.jobId]);
  }
}, 5000);



// GET all completed reports (latest 20 or more)
app.get("/api/deepseek-reports", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 80;
  const offset = (page - 1) * limit;

  try {
    const [rows] = await pollDBPool.query(
      `
      SELECT id, url, status, created_at
      FROM seo_analysis_jobs
      WHERE status = 'completed'
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `,
      [limit, offset]
    );

    // Get total count
    const [countRows] = await pollDBPool.query(`
      SELECT COUNT(*) AS total FROM seo_analysis_jobs WHERE status = 'completed'
    `);

    const total = countRows[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({ success: true, data: rows, total, totalPages, page });
  } catch (err) {
    res.status(500).json({ success: false, error: "DB fetch error" });
  }
});

// GET report by ID
app.get("/api/deepseek-reports/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pollDBPool.query(
      `SELECT id, url, result FROM seo_analysis_jobs WHERE id = ? AND status = 'completed'`,
      [id]
    );

    if (rows.length === 0)
      return res.status(404).json({ success: false, error: "Not found" });

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: "DB fetch error" });
  }
});

app.get("/api/manual-seo-reports/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pollDBPool.query(
      `SELECT id, title, url, result FROM manual_seo_jobs WHERE id = ? AND status = 'completed'`,
      [id]
    );

    if (rows.length === 0)
      return res.status(404).json({ success: false, error: "Not found" });

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: "DB fetch error" });
  }
});

app.get("/api/manual-seo-reports", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 50;
  const offset = (page - 1) * limit;

  try {
    const [rows] = await pollDBPool.query(
      `
      SELECT id, title, url, status, created_at
      FROM manual_seo_jobs
      WHERE status = 'completed'
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `,
      [limit, offset]
    );

    const [countRows] = await pollDBPool.query(`
      SELECT COUNT(*) AS total FROM manual_seo_jobs WHERE status = 'completed'
    `);

    const total = countRows[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({ success: true, data: rows, total, totalPages, page });
  } catch (err) {
    res.status(500).json({ success: false, error: "DB fetch error" });
  }
});

app.get("/api/manual-seo-status", async (req, res) => {
  const { jobId } = req.query;
  if (!jobId)
    return res.status(400).json({ success: false, error: "Missing jobId" });

  try {
    const [rows] = await pollDBPool.query(
      `SELECT id, title, url, status, result, error FROM manual_seo_jobs WHERE id = ?`,
      [jobId]
    );

    if (rows.length === 0)
      return res.status(404).json({ success: false, error: "Job not found" });

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: "DB error" });
  }
});

app.post("/api/manual-seo-job", async (req, res) => {
  const { title, url, description, body } = req.body;

  if (!title || !body) {
    return res
      .status(400)
      .json({ success: false, error: "Title and body are required" });
  }

  try {
    const [result] = await pollDBPool.query(
      `INSERT INTO manual_seo_jobs (title, url, status, created_at)
       VALUES (?, ?, 'queued', NOW())`,
      [title, url || null]
    );

    const jobId = result.insertId;

    jobQueue.push({
      jobId,
      type: "manual",
      source: "manual_seo_jobs",
      title,
      description: description || "",
      body,
    });

    res.json({ success: true, jobId });
  } catch (err) {
    console.error("❌ Failed to insert manual job:", err.message);
    res.status(500).json({ success: false, error: "DB insert failed" });
  }
});


// === ROUTE: GET /api/feed ===
app.get("/api/feed", async (req, res) => {
  try {
    const articles = await fetchLatestArticles(
      "https://cricketaddictor.com/feed/",
      5
    );
    res.json({ success: true, articles });
  } catch (err) {
    console.error("❌ [Feed] RSS Error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch RSS feed" });
  }
});

async function fetchLatestArticles(rssUrl, limit = 5) {
  const parser = new Parser();
  const feed = await parser.parseURL(rssUrl);

  const sortedItems = feed.items
    .filter((item) => item.pubDate)
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
    .slice(0, limit);

  return sortedItems.map((item) => ({
    title: item.title,
    link: item.link,
    pubDate: item.pubDate,
  }));
}






// ---------------------------------------- JOURNALIST REWRITE MODE (English Only) -----------------------------------------
// MAIN SMART REWRITE FUNCTIONALITY
// 1. Extract article content
async function extractFullArticleData(url) {
  try {
    const res = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(res.data);

    const title = $("title").text().trim() || "Untitled";
    const metaDescription =
      $('meta[name="description"]').attr("content") || "No Description";

    let body = "";
    $("p").each((_, el) => {
      body += $(el).text() + "\n";
    });

    if (!title || !body.trim()) throw new Error("No article content found.");

    return {
      title,
      description: metaDescription,
      body: body.slice(0, 3500),
    };
  } catch (err) {
    console.error("❌ Error extracting article:", err.message);
    throw err;
  }
}



async function sendSmartJournalistPrompt(
  articleData,
  keyword = "cricket",
  customPrompt = null
) {
  let promptText;

  if (customPrompt) {
    // If they included {{body}}, just replace as before:
    if (/{{\s*body\s*}}/i.test(customPrompt)) {
      promptText = customPrompt.replace(
        /{{\s*body\s*}}/gi,
        articleData.body
      );
    } else {
      // No {{body}} placeholder?  Append the article automatically:
      promptText = `${customPrompt.trim()}

Article:
${articleData.body}`;
    }
  } else {
    // No custom prompt at all: use your original full template
    promptText = `
You're a seasoned cricket journalist writing for Cricket Addictor. Rewrite the following article with natural tone, personal commentary, and subtle analysis, as if you're reporting after watching the game live.

…

Now rewrite the following article accordingly:

${articleData.body}
`;
  }

  const response = await axios.post(
    "https://api.deepseek.com/v1/chat/completions",
    {
      model: "deepseek-chat",
      messages: [{ role: "user", content: promptText }],
      temperature: 0.7,
      max_tokens: 2000,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data.choices[0].message.content;
}

;



app.post("/api/smart-journalist-rewrite", async (req, res) => {
  const { url, keyword = "cricket" } = req.body;
  if (!url) return res.status(400).json({ success: false, error: "URL required" });

  try {
    const articleData = await extractFullArticleData(url);

    // ← NEW: load the active prompt from MySQL
    const [[active]] = await pollDBPool.query(
      "SELECT content FROM prompts WHERE is_active = 1 LIMIT 1"
    );
    const template = active?.content || null;

    const rewritten = await sendSmartJournalistPrompt(
      articleData,
      keyword,
      template
    );

    res.json({
      success: true,
      originalTitle: articleData.title,
      metaDescription: articleData.description,
      rewrittenArticle: rewritten,
    });
  } catch (err) {
    console.error("❌ Rewrite failed:", err);
    res.status(500).json({ success: false, error: "Rewrite failed" });
  }
});







// =============================== Prompt Management on app ==================

// GET active prompt
app.get("/api/prompts/active", async (req, res) => {
  try {
    const [rows] = await pollDBPool.query(
      "SELECT id, title, content FROM prompts WHERE is_active = 1 LIMIT 1"
    );
    res.json(rows[0] || null);
  } catch (err) {
    console.error("❌ GET /api/prompts/active failed", err);
    res.status(500).json({ error: "Internal error" });
  }
});

// GET all prompts (history)
app.get("/api/prompts", async (req, res) => {
  try {
    const [rows] = await pollDBPool.query(
      "SELECT id, title, is_active, created_at FROM prompts ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ GET /api/prompts failed", err);
    res.status(500).json({ error: "Internal error" });
  }
});

// POST create & optionally activate
app.post("/api/prompts", async (req, res) => {
  const { title = "Untitled", content, activate = true } = req.body;
  if (!content) return res.status(400).json({ error: "content required" });

  try {
    // Use the same pool for transactions
    await pollDBPool.query("START TRANSACTION");

    if (activate) {
      await pollDBPool.query(
        "UPDATE prompts SET is_active = 0 WHERE is_active = 1"
      );
    }

    const [result] = await pollDBPool.query(
      "INSERT INTO prompts (title, content, is_active) VALUES (?, ?, ?)",
      [title, content, activate ? 1 : 0]
    );

    await pollDBPool.query("COMMIT");
    res.json({ id: result.insertId, title, is_active: activate });
  } catch (err) {
    await pollDBPool.query("ROLLBACK");
    console.error("❌ POST /api/prompts failed", err);
    res.status(500).json({ error: "Internal error" });
  }
});

// PATCH activate an existing prompt
app.patch("/api/prompts/:id/activate", async (req, res) => {
  const { id } = req.params;
  try {
    await pollDBPool.query("START TRANSACTION");
    await pollDBPool.query(
      "UPDATE prompts SET is_active = 0 WHERE is_active = 1"
    );
    await pollDBPool.query(
      "UPDATE prompts SET is_active = 1 WHERE id = ?",
      [id]
    );
    await pollDBPool.query("COMMIT");
    res.json({ success: true });
  } catch (err) {
    await pollDBPool.query("ROLLBACK");
    console.error(`❌ PATCH /api/prompts/${id}/activate failed`, err);
    res.status(500).json({ error: "Internal error" });
  }
});






// ------------------------------------------------------------------seo analyzer ends here ----------------------------------------











// ----------------------------------------------My game 11 --------------------------------------------------------









app.post("/api/polls", async (req, res) => {
  const { title, description, match_id } = req.body;

  if (!title || !match_id) {
    return res
      .status(400)
      .json({ message: "Invalid input. Provide a title and match_id." });
  }

  try {
    // Insert poll into the database
    const insertPollQuery = `
        INSERT INTO polls (title, description, match_id, status) 
        VALUES (?, ?, ?, 'active');
      `;
    const [pollResult] = await pollDBPool.query(insertPollQuery, [
      title,
      description || null,
      match_id,
    ]);

    res.status(201).json({
      message: "Poll created successfully",
      pollId: pollResult.insertId,
    });
  } catch (error) {
    console.error("Error creating poll:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

// **Vote API**
app.post("/api/polls/:pollId/vote", async (req, res) => {
  const { pollId } = req.params;
  const { team_id, user_id } = req.body;

  if (!pollId || !team_id || !user_id) {
    return res.status(400).json({
      message: "Missing required fields: pollId, team_id, or user_id.",
    });
  }

  try {
    // Check if the user has already voted
    const checkVoteQuery = `
      SELECT * 
      FROM poll_votes 
      WHERE poll_id = ? AND user_id = ?;
    `;
    const [existingVotes] = await pollDBPool.query(checkVoteQuery, [
      pollId,
      user_id,
    ]);

    if (existingVotes.length > 0) {
      return res.status(400).json({ message: "You have already voted." });
    }

    // Insert the vote
    const insertVoteQuery = `
      INSERT INTO poll_votes (poll_id, team_id, user_id) 
      VALUES (?, ?, ?);
    `;
    await pollDBPool.query(insertVoteQuery, [pollId, team_id, user_id]);

    res.status(200).json({ message: "Vote recorded successfully." });
  } catch (error) {
    console.error("Error recording vote:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

// **Fetch Poll Results API**
app.get("/api/polls/:pollId/results", async (req, res) => {
  const { pollId } = req.params;

  try {
    // Fetch poll details
    const fetchPollQuery = `
      SELECT id, title, description, match_id, status, created_at 
      FROM polls 
      WHERE id = ?;
    `;
    const [pollRows] = await pollDBPool.query(fetchPollQuery, [pollId]);

    if (pollRows.length === 0) {
      return res.status(404).json({ message: "Poll not found." });
    }

    // Fetch vote counts for each team
    const fetchVoteCountsQuery = `
      SELECT team_id, COUNT(*) AS votes_count,
             ROUND((COUNT(*) / (SELECT COUNT(*) FROM poll_votes WHERE poll_id = ?)) * 100, 2) AS percentage
      FROM poll_votes
      WHERE poll_id = ?
      GROUP BY team_id;
    `;
    const [voteCounts] = await pollDBPool.query(fetchVoteCountsQuery, [
      pollId,
      pollId,
    ]);

    res.status(200).json({
      poll: pollRows[0],
      results: voteCounts,
    });
  } catch (error) {
    console.error("Error fetching poll results:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.get("/api/matches/:matchId/poll", async (req, res) => {
  const { matchId } = req.params;

  try {
    // Check if a poll exists for the given match_id
    const checkPollQuery = `
      SELECT id AS pollId 
      FROM polls 
      WHERE match_id = ?;
    `;
    const [rows] = await pollDBPool.query(checkPollQuery, [matchId]);

    if (rows.length > 0) {
      // Return the existing pollId
      return res.status(200).json({ pollId: rows[0].pollId });
    }

    // No poll exists, create a new poll
    const insertPollQuery = `
      INSERT INTO polls (title, description, match_id, status) 
      VALUES (?, ?, ?, 'active');
    `;
    const [pollResult] = await pollDBPool.query(insertPollQuery, [
      `Who will win match ${matchId}?`,
      "Vote for your favorite team!",
      matchId,
    ]);
    const pollId = pollResult.insertId;

    // Insert default options (Team A and Team B)
    const insertOptionsQuery = `
      INSERT INTO poll_options (poll_id, option_text, votes_count) 
      VALUES (?, ?, 0), (?, ?, 0);
    `;
    await pollDBPool.query(insertOptionsQuery, [
      pollId,
      "Team A",
      pollId,
      "Team B",
    ]);

    // Return the newly created pollId
    res.status(201).json({ pollId });
  } catch (error) {
    console.error("Error fetching or creating poll:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.post("/api/saveForm1", async (req, res) => {
  try {
    const formData = req.body;

    // First, check if the match_id already exists in the database
    const checkQuery = `SELECT * FROM match_predictions WHERE match_id = ?`;
    const [existingMatch] = await pollDBPool.query(checkQuery, [
      formData.matchId,
    ]);

    if (existingMatch.length > 0) {
      // Match ID exists, so we perform an update
      const updateQuery = `
        UPDATE match_predictions SET
          title = ?,
          summary = ?,
          preview = ?,
          pitch = ?,
          records = ?,
          winning_percentage = ?,
          pitch_behaviour = ?,
          avg_inning_score = ?,
          best_suited_to = ?,
          captain_choice = ?,
          vice_captain_choice = ?,
          dream11_combination = ?,
          playing11_teamA = ?,
          playing11_teamB = ?,
          hot_picks = ?,
          expert_advice = ?,
          teams = ?
        WHERE match_id = ?
      `;

      const updateValues = [
        formData.title,
        formData.summary,
        formData.tableOfContent.preview,
        formData.tableOfContent.pitchReport.pitch,
        formData.tableOfContent.pitchReport.records,
        formData.tableOfContent.pitchReport.winningPercentage,
        formData.tableOfContent.pitchReport.pitchBehaviour,
        formData.tableOfContent.pitchReport.avgInningScore,
        formData.tableOfContent.pitchReport.bestSuitedTo,
        formData.captainChoice,
        formData.viceCaptainChoice,
        formData.expertAdvice.dream11Combination,
        JSON.stringify(formData.playing11TeamA),
        JSON.stringify(formData.playing11TeamB),
        JSON.stringify(formData.hotPicks),
        JSON.stringify(formData.expertAdvice),
        JSON.stringify(formData.teams),
        formData.matchId,
      ];

      await pollDBPool.query(updateQuery, updateValues);
      res.status(200).json({ message: "Match data updated successfully" });
    } else {
      // Match ID does not exist, so we perform an insert
      const insertQuery = `
        INSERT INTO match_predictions (
          match_id,
          title,
          summary,
          preview,
          pitch,
          records,
          winning_percentage,
          pitch_behaviour,
          avg_inning_score,
          best_suited_to,
          captain_choice,
          vice_captain_choice,
          dream11_combination,
          playing11_teamA,
          playing11_teamB,
          hot_picks,
          expert_advice,
          teams
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const insertValues = [
        formData.matchId,
        formData.title,
        formData.summary,
        formData.tableOfContent.preview,
        formData.tableOfContent.pitchReport.pitch,
        formData.tableOfContent.pitchReport.records,
        formData.tableOfContent.pitchReport.winningPercentage,
        formData.tableOfContent.pitchReport.pitchBehaviour,
        formData.tableOfContent.pitchReport.avgInningScore,
        formData.tableOfContent.pitchReport.bestSuitedTo,
        formData.captainChoice,
        formData.viceCaptainChoice,
        formData.expertAdvice.dream11Combination,
        JSON.stringify(formData.playing11TeamA),
        JSON.stringify(formData.playing11TeamB),
        JSON.stringify(formData.hotPicks),
        JSON.stringify(formData.expertAdvice),
        JSON.stringify(formData.teams),
      ];

      const [result] = await pollDBPool.query(insertQuery, insertValues);
      res.status(201).json({
        message: "Form data saved successfully!",
        predictionId: result.insertId,
      });
    }
  } catch (error) {
    console.error("Error saving form data:", error);
    res.status(500).json({ error: "Failed to save form data" });
  }
});

app.get("/api/getMatchData/:matchId", async (req, res) => {
  const { matchId } = req.params;

  try {
    const query = `SELECT * FROM match_predictions WHERE match_id = ?`;
    const [rows] = await pollDBPool.query(query, [matchId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Match data not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Error fetching match data:", error);
    res.status(500).json({ error: "Failed to fetch match data" });
  }
});





// ---------------------------------------------------------------------------------------------------------------------------



































// -------------------------------different learning pj  dummy ecommerce apis----------------------------------------------------------------------------

// --------------------------------------------------user routes---------------------------------------------------
app.get("/user", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Unauthorized access" });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userId = decoded.id;

    const query = "SELECT * FROM users WHERE user_id = ?";
    const [rows] = await userDBPool.query(query, [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user: rows[0] });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// **Update User Info**
app.put("/user/update", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Unauthorized access" });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userId = decoded.id;

    const { name, email } = req.body;

    const query = "UPDATE users SET name=?, email=? WHERE user_id=?";
    await userDBPool.query(query, [name, email, userId]);

    res.status(200).json({ message: "User info updated successfully!" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// **Upload User Avatar**
app.post("/user/upload", upload.single("file"), async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Unauthorized access" });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userId = decoded.id;

    if (!req.file) {
      return res.status(400).json({ error: "File not found" });
    }

    const query = "UPDATE users SET avatar=? WHERE user_id=?";
    await userDBPool.query(query, [req.file.path, userId]);

    res
      .status(200)
      .json({ message: "Avatar updated successfully!", image: req.file.path });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/auth/user/basic", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userId = decoded.id;

    const query = "SELECT user_id, name, email FROM users WHERE user_id = ?";
    const [rows] = await userDBPool.query(query, [userId]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Error fetching user basic info:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// -----------------------------------------------------user routes----------------------------------------

// ---------------------------------------------review routes----------------------------------------------------

app.get("/reviews", async (req, res) => {
  try {
    const query = "SELECT * FROM customer_reviews";
    const [rows] = await userDBPool.query(query);

    if (rows.length === 0) {
      return res.status(404).json({ message: "No reviews found" });
    }

    res.status(200).json({ status: 200, reviews: rows });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// **Get Review by Product ID**
app.get("/review/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT customer_reviews.*, users.name, users.avatar 
      FROM customer_reviews 
      INNER JOIN users ON customer_reviews.user_id = users.user_id 
      WHERE customer_reviews.product_id = ?
    `;
    const [rows] = await userDBPool.query(query, [id]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No reviews found for this product" });
    }

    res.status(200).json({ status: 200, reviews: rows });
  } catch (error) {
    console.error("Error fetching review:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// **Create a New Review**
app.post("/reviews/create", async (req, res) => {
  try {
    const { product_id, rating, title, content } = req.body;
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Unauthorized access" });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userId = decoded.id;

    // Check if user has already submitted a review
    const checkQuery =
      "SELECT * FROM customer_reviews WHERE user_id = ? AND product_id = ?";
    const [existingReview] = await userDBPool.query(checkQuery, [
      userId,
      product_id,
    ]);

    if (existingReview.length > 0) {
      return res.status(400).json({
        error: "You have already submitted a review for this product",
      });
    }

    // Insert new review
    const insertQuery = `
      INSERT INTO customer_reviews (user_id, product_id, title, content, rating) 
      VALUES (?, ?, ?, ?, ?)
    `;
    await userDBPool.query(insertQuery, [
      userId,
      product_id,
      title,
      content,
      rating,
    ]);

    res.status(201).json({ message: "Review successfully submitted" });
  } catch (error) {
    console.error("Error submitting review:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// -------------------------------------------------review routes--------------------------------------------------------

// -----------------------------------------------------------oreder routes ----------------------------------------

app.get("/orders/user", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Unauthorized access: Token missing" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userId = decoded.id;

    const query = `
      SELECT 
        o.order_id, o.total_amount, o.created_at,
        oi.product_id, oi.quantity, oi.price AS item_price,
        p.name AS product_name, p.images AS product_images
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.item_id
      WHERE o.user_id = ?;
    `;

    const [rows] = await userDBPool.query(query, [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "No orders found for this user" });
    }

    // Group products under orders
    const ordersMap = {};
    rows.forEach((row) => {
      if (!ordersMap[row.order_id]) {
        ordersMap[row.order_id] = {
          order_id: row.order_id,
          total_amount: row.total_amount,
          created_at: row.created_at,
          products: [],
        };
      }

      let productImage = null;
      if (row.product_images) {
        try {
          const imagesArray = JSON.parse(row.product_images);
          productImage = Array.isArray(imagesArray)
            ? imagesArray[0]
            : row.product_images;
        } catch (err) {
          productImage = row.product_images; // Fallback to string URL if JSON parse fails
        }
      }

      ordersMap[row.order_id].products.push({
        product_id: row.product_id,
        name: row.product_name,
        image: productImage,
        quantity: row.quantity,
        price: row.item_price,
      });
    });

    const orders = Object.values(ordersMap);

    res.status(200).json({ orders });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

app.get("/orders/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    const query = `
      SELECT 
        o.order_id, o.total_amount, o.created_at,
        oi.product_id, oi.quantity, oi.price AS item_price,
        p.name AS product_name, p.images AS product_images,
        ao.full_name, ao.phone_number, ao.street_address, ao.city, ao.state, ao.postal_code, ao.country
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.item_id
      LEFT JOIN address_orders ao ON o.order_id = ao.order_id
      WHERE o.order_id = ?;
    `;

    const [rows] = await userDBPool.query(query, [orderId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const order = {
      order_id: rows[0].order_id,
      total_amount: rows[0].total_amount,
      created_at: rows[0].created_at,
      address: {
        full_name: rows[0].full_name,
        phone_number: rows[0].phone_number,
        street_address: rows[0].street_address,
        city: rows[0].city,
        state: rows[0].state,
        postal_code: rows[0].postal_code,
        country: rows[0].country,
      },
      products: rows.map((row) => {
        let productImage = null;
        if (row.product_images) {
          try {
            const imagesArray = JSON.parse(row.product_images);
            productImage = Array.isArray(imagesArray)
              ? imagesArray[0]
              : row.product_images;
          } catch (err) {
            productImage = row.product_images;
          }
        }

        return {
          product_id: row.product_id,
          name: row.product_name,
          image: productImage,
          quantity: row.quantity,
          price: row.item_price,
        };
      }),
    };

    res.status(200).json({ order });
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ error: "Failed to fetch order details" });
  }
});

app.post("/orders/create", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized access" });

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userId = decoded.id;

    const {
      total_amount,
      payment_method,
      order_status,
      transaction_id,
      products,
    } = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "Products array is required" });
    }

    // Insert into orders table
    const queryOrder = `
      INSERT INTO orders (user_id, total_amount, payment_status, payment_method, order_status, transaction_id)
      VALUES (?, ?, 'pending', ?, ?, ?)
    `;
    const [orderResult] = await userDBPool.query(queryOrder, [
      userId,
      total_amount,
      payment_method,
      order_status,
      transaction_id,
    ]);

    const orderId = orderResult.insertId;

    // Insert into order_items table
    const orderItemsQuery = `
      INSERT INTO order_items (order_id, product_id, quantity, price)
      VALUES ?
    `;

    const orderItemsData = products.map((product) => [
      orderId,
      product.product_id,
      product.quantity,
      product.price,
    ]);

    await userDBPool.query(orderItemsQuery, [orderItemsData]);

    res.status(201).json({ message: "Order created successfully", orderId });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

/**
 * Update order status
 */
app.patch("/orders/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { order_status } = req.body;

    const query = `UPDATE orders SET order_status = ? WHERE order_id = ?`;
    const [result] = await userDBPool.query(query, [order_status, orderId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ message: "Order status updated successfully" });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

/**
 * Delete order (Ensures order_items are deleted first)
 */
app.delete("/orders/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    // Delete related order items first
    const deleteOrderItemsQuery = `DELETE FROM order_items WHERE order_id = ?`;
    await userDBPool.query(deleteOrderItemsQuery, [orderId]);

    // Then delete the order
    const deleteOrderQuery = `DELETE FROM orders WHERE order_id = ?`;
    const [result] = await userDBPool.query(deleteOrderQuery, [orderId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res
      .status(200)
      .json({ message: "Order and associated items deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ error: "Failed to delete order" });
  }
});

//  ------------------------------- order address-----------------------------------------------------

app.post("/orders/:orderId/address", async (req, res) => {
  try {
    const { orderId } = req.params;
    const {
      full_name,
      phone_number,
      street_address,
      city,
      state,
      postal_code,
      country,
    } = req.body;

    // Authenticate user
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized access" });

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userId = decoded.id;

    // Check if the order exists and belongs to the user
    const [orderCheck] = await userDBPool.query(
      `SELECT user_id FROM orders WHERE order_id = ?`,
      [orderId]
    );
    if (orderCheck.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }
    if (orderCheck[0].user_id !== userId) {
      return res.status(403).json({
        error: "You do not have permission to add an address to this order",
      });
    }

    // Insert Address
    const query = `
      INSERT INTO address_orders (order_id, user_id, full_name, phone_number, street_address, city, state, postal_code, country)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await userDBPool.query(query, [
      orderId,
      userId,
      full_name,
      phone_number,
      street_address,
      city,
      state,
      postal_code,
      country,
    ]);

    res.status(201).json({ message: "Address added successfully" });
  } catch (error) {
    console.error("Error adding address:", error);
    res.status(500).json({ error: "Failed to add address" });
  }
});

/**
 * Get Address for an Order (GET /orders/:orderId/address)
 */
app.get("/orders/:orderId/address", async (req, res) => {
  try {
    const { orderId } = req.params;

    // Fetch Address
    const query = `SELECT * FROM address_orders WHERE order_id = ?`;
    const [rows] = await userDBPool.query(query, [orderId]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Address not found for this order" });
    }

    res.status(200).json({ address: rows[0] });
  } catch (error) {
    console.error("Error fetching order address:", error);
    res.status(500).json({ error: "Failed to fetch address" });
  }
});


app.patch("/orders/address/:addressId", async (req, res) => {
  try {
    const { addressId } = req.params;
    const {
      full_name,
      phone_number,
      street_address,
      city,
      state,
      postal_code,
      country,
    } = req.body;

    // Authenticate user
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized access" });

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userId = decoded.id;

    // Ensure the user owns the address before updating
    const [addressCheck] = await userDBPool.query(
      `SELECT user_id FROM address_orders WHERE address_id = ?`,
      [addressId]
    );
    if (addressCheck.length === 0) {
      return res.status(404).json({ error: "Address not found" });
    }
    if (addressCheck[0].user_id !== userId) {
      return res
        .status(403)
        .json({ error: "You do not have permission to update this address" });
    }

    // Update Address
    const query = `
      UPDATE address_orders 
      SET full_name = ?, phone_number = ?, street_address = ?, city = ?, state = ?, postal_code = ?, country = ?
      WHERE address_id = ?
    `;
    const [result] = await userDBPool.query(query, [
      full_name,
      phone_number,
      street_address,
      city,
      state,
      postal_code,
      country,
      addressId,
    ]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Address not found or unchanged" });
    }

    res.status(200).json({ message: "Address updated successfully" });
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(500).json({ error: "Failed to update address" });
  }
});

/**
 * Delete an Address (DELETE /orders/address/:addressId)
 */
app.delete("/orders/address/:addressId", async (req, res) => {
  try {
    const { addressId } = req.params;

    // Authenticate user
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized access" });

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userId = decoded.id;

    // Ensure the user owns the address before deleting
    const [addressCheck] = await userDBPool.query(
      `SELECT user_id FROM address_orders WHERE address_id = ?`,
      [addressId]
    );
    if (addressCheck.length === 0) {
      return res.status(404).json({ error: "Address not found" });
    }
    if (addressCheck[0].user_id !== userId) {
      return res
        .status(403)
        .json({ error: "You do not have permission to delete this address" });
    }

    // Delete Address
    const query = `DELETE FROM address_orders WHERE address_id = ?`;
    const [result] = await userDBPool.query(query, [addressId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Address not found" });
    }

    res.status(200).json({ message: "Address deleted successfully" });
  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(500).json({ error: "Failed to delete address" });
  }
});

// --------------------------------------------------oreder addresss -------------------------------------------

// ---------------------------------------------cart----------------------------------------------------------
app.get("/cart", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized access." });

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userId = decoded.id;

    // ✅ Fetch only active cart items
    const query = `SELECT * FROM Cart WHERE user_id = ? AND status = 'active'`;
    const [rows] = await userDBPool.query(query, [userId]);

    res.status(200).json({ cartItems: rows });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ error: "Failed to fetch cart items" });
  }
});


app.post("/cart/add", async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ error: "No items provided." });
    }

    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized access." });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userId = decoded.id;

    for (const item of items) {
      // ✅ Fetch product stock_quantity from products table
      const [productRows] = await userDBPool.query(
        "SELECT stock_quantity FROM products WHERE item_id = ?",
        [item.id]
      );

      if (productRows.length === 0) {
        return res.status(404).json({ error: `Product ${item.id} not found` });
      }

      const stockQuantity = productRows[0].stock_quantity || 1;
      const requestedQty = Number(item.quantity || item.qty || 1);

      // ✅ Check current cart quantity
      const checkQuery = `SELECT * FROM Cart WHERE user_id = ? AND id = ?`;
      const [existingItem] = await userDBPool.query(checkQuery, [userId, item.id]);

      // ✅ SET quantity to requestedQty (not ADD to existing)
      // ✅ But limit to stockQuantity if requestedQty exceeds stock
      const finalQty = Math.min(requestedQty, stockQuantity);

      if (existingItem.length < 1) {
        // ✅ New item - insert
        const insertQuery = `
          INSERT INTO Cart (user_id, id, quantity, name, price, image, status)
          VALUES (?, ?, ?, ?, ?, ?, 'active')
        `;
        await userDBPool.query(insertQuery, [
          userId,
          item.id,
          finalQty,
          item.name,
          item.price,
          item.image,
        ]);
      } else {
        // ✅ Existing item - SET quantity (not ADD)
        const updateQuery = `
          UPDATE Cart SET quantity = ?, status = 'active'
          WHERE id = ? AND user_id = ?
        `;
        await userDBPool.query(updateQuery, [finalQty, item.id, userId]);
      }

      // ✅ If requested quantity exceeds stock, return warning
      if (requestedQty > stockQuantity) {
        return res.status(200).json({
          message: "OUT OF STOCK - Maximum available quantity added",
          limited: true,
        });
      }
    }

    return res.status(200).json({
      message: "Cart updated successfully",
    });
  } catch (error) {
    console.error("Error adding items to cart:", error);
    res.status(500).json({ error: "Failed to add items to cart" });
  }
});

// app.post("/cart/add", async (req, res) => {
//   try {
//     const { items } = req.body;

//     if (!items || items.length === 0) {
//       return res.status(400).json({ error: "No items provided." });
//     }

//     const token = req.headers.authorization?.split(" ")[1];
//     if (!token) {
//       return res.status(401).json({ error: "Unauthorized access." });
//     }

//     const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
//     const userId = decoded.id;

//     for (const item of items) {
//       // ✅ Fetch product stock_quantity from products table
//       const [productRows] = await userDBPool.query(
//         "SELECT stock_quantity FROM products WHERE item_id = ?",
//         [item.id]
//       );

//       if (productRows.length === 0) {
//         return res.status(404).json({ error: `Product ${item.id} not found` });
//       }

//       const stockQuantity = productRows[0].stock_quantity || 1; // Default to 1 if null
//       const requestedQty = Number(item.quantity || item.qty || 1);

//       // ✅ Check current cart quantity
//       const checkQuery = `SELECT * FROM Cart WHERE user_id = ? AND id = ?`;
//       const [existingItem] = await userDBPool.query(checkQuery, [userId, item.id]);

//       const currentCartQty = existingItem.length > 0 ? (existingItem[0].quantity || 0) : 0;
//       const newTotalQty = currentCartQty + requestedQty;

//       // ✅ If adding would exceed stock, limit to available stock
//       if (newTotalQty > stockQuantity) {
//         const finalQty = stockQuantity;
        
//         if (existingItem.length < 1) {
//           const insertQuery = `
//             INSERT INTO Cart (user_id, id, quantity, name, price, image, status)
//             VALUES (?, ?, ?, ?, ?, ?, 'active')
//           `;
//           await userDBPool.query(insertQuery, [
//             userId,
//             item.id,
//             finalQty,
//             item.name,
//             item.price,
//             item.image,
//           ]);
//         } else {
//           const updateQuery = `
//             UPDATE Cart SET quantity = ?, status = 'active'
//             WHERE id = ? AND user_id = ?
//           `;
//           await userDBPool.query(updateQuery, [finalQty, item.id, userId]);
//         }

//         return res.status(200).json({
//           message: "OUT OF STOCK - Maximum available quantity added",
//           limited: true,
//         });
//       }

//       // ✅ Normal add/update
//       if (existingItem.length < 1) {
//         const insertQuery = `
//           INSERT INTO Cart (user_id, id, quantity, name, price, image, status)
//           VALUES (?, ?, ?, ?, ?, ?, 'active')
//         `;
//         await userDBPool.query(insertQuery, [
//           userId,
//           item.id,
//           requestedQty,
//           item.name,
//           item.price,
//           item.image,
//         ]);
//       } else {
//         const updateQuery = `
//           UPDATE Cart SET quantity = ?, status = 'active'
//           WHERE id = ? AND user_id = ?
//         `;
//         await userDBPool.query(updateQuery, [newTotalQty, item.id, userId]);
//       }
//     }

//     return res.status(200).json({
//       message: "Cart updated successfully",
//     });
//   } catch (error) {
//     console.error("Error adding items to cart:", error);
//     res.status(500).json({ error: "Failed to add items to cart" });
//   }
// });

// app.post("/cart/add", async (req, res) => {
//   try {
//     const { items } = req.body;
//     if (!items || items.length === 0) {
//       return res.status(400).json({ error: "No items provided." });
//     }

//     const token = req.headers.authorization?.split(" ")[1];
//     if (!token) return res.status(401).json({ error: "Unauthorized access." });

//     const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
//     const userId = decoded.id;

//     for (const item of items) {
//       const checkQuery = `SELECT * FROM Cart WHERE user_id = ? AND id = ?`;
//       const [existingItem] = await userDBPool.query(checkQuery, [
//         userId,
//         item.id,
//       ]);

//       if (existingItem.length < 1) {
//         // ✅ Fixed: Now inserts as `active`
//         const insertQuery = `INSERT INTO Cart (user_id, id, quantity, name, price, image, status) VALUES (?, ?, ?, ?, ?, ?, 'active')`;
//         await userDBPool.query(insertQuery, [
//           userId,
//           item.id,
//           item.quantity,
//           item.name,
//           item.price,
//           item.image,
//         ]);
//       } else {
//         // ✅ Fixed: Now updates quantity and marks as `active`
//         const updateQuery = `UPDATE Cart SET quantity = ?, status = 'active' WHERE id = ? AND user_id = ?`;
//         await userDBPool.query(updateQuery, [item.quantity, item.id, userId]);
//       }
//     }

//     res
//       .status(200)
//       .json({ message: "Cart updated successfully", cartItems: items });
//   } catch (error) {
//     console.error("Error adding items to cart:", error);
//     res.status(500).json({ error: "Failed to add items to cart" });
//   }
// });

// app.post("/cart/add", async (req, res) => {
//   try {
//     const { items } = req.body;

//     if (!items || items.length === 0) {
//       return res.status(400).json({ error: "No items provided." });
//     }

//     const token = req.headers.authorization?.split(" ")[1];
//     if (!token) {
//       return res.status(401).json({ error: "Unauthorized access." });
//     }

//     const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
//     const userId = decoded.id;

//     const MAX_PER_PRODUCT = 1; // 🔒 hard cap: one piece per product
//     let limited = false;

//     for (const item of items) {
//       const checkQuery = `SELECT * FROM Cart WHERE user_id = ? AND id = ?`;
//       const [existingItem] = await userDBPool.query(checkQuery, [userId, item.id]);

//       const requestedQty = Number(item.quantity || item.qty || 1);
//       const finalQty = Math.min(requestedQty, MAX_PER_PRODUCT);
//       if (requestedQty > MAX_PER_PRODUCT) limited = true;

//       if (existingItem.length < 1) {
//         const insertQuery = `
//           INSERT INTO Cart (user_id, id, quantity, name, price, image, status)
//           VALUES (?, ?, ?, ?, ?, ?, 'active')
//         `;
//         await userDBPool.query(insertQuery, [
//           userId,
//           item.id,
//           finalQty,
//           item.name,
//           item.price,
//           item.image,
//         ]);
//       } else {
//         const updateQuery = `
//           UPDATE Cart SET quantity = ?, status = 'active'
//           WHERE id = ? AND user_id = ?
//         `;
//         await userDBPool.query(updateQuery, [finalQty, item.id, userId]);
//       }
//     }

//     return res.status(200).json({
//       message: limited
//         ? "Cart updated. Each piece is limited to 1 per customer. For more, please contact us on Instagram or WhatsApp."
//         : "Cart updated successfully",
//     });
//   } catch (error) {
//     console.error("Error adding items to cart:", error);
//     res.status(500).json({ error: "Failed to add items to cart" });
//   }
// });

app.delete("/cart/remove/:product_id", async (req, res) => {
  try {
    const productId = req.params.product_id;

    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized access." });

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userId = decoded.id;

    const query = `DELETE FROM Cart WHERE user_id = ? AND id = ?`;
    const [result] = await userDBPool.query(query, [userId, productId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Item not found in cart." });
    }

    res.status(200).json({ message: "Item successfully removed from cart." });
  } catch (error) {
    console.error("Error removing item from cart:", error);
    res.status(500).json({ error: "Failed to remove item from cart" });
  }
});

app.delete("/cart/clear", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized access." });

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userId = decoded.id;

    // ✅ Do nothing to the database, just return success
    res.status(200).json({ message: "Cart cleared from frontend only." });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ error: "Failed to clear cart" });
  }
});


app.post("/cart/apply-promo", async (req, res) => {
  const { code, cartTotal } = req.body;

  try {
    const query = "SELECT * FROM promo_codes WHERE code = ?";
    const [promo] = await userDBPool.query(query, [code]);

    if (!promo.length)
      return res.status(400).json({ error: "Invalid promo code" });

    const promoData = promo[0];

    if (promoData.expiry_date && new Date(promoData.expiry_date) < new Date()) {
      return res.status(400).json({ error: "Promo code expired" });
    }

    // ✅ Always apply 10% discount regardless of total
    const discount = (cartTotal * promoData.discount_percent) / 100;
    const discountedTotal = cartTotal - discount;

    return res.status(200).json({
      message: "Promo applied successfully",
      discount: Math.round(discount),
      total: Math.round(discountedTotal),
      promo: code,
    });
  } catch (err) {
    console.error("Promo error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ------------------------------------------------------cart--------------------------------------------------------

// -----------------------------------------------auth route---------------------------------------------------

app.post("/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Check if the email already exists
    const checkQuery = `SELECT * FROM users WHERE email = ?`;
    const [existingUser] = await userDBPool.query(checkQuery, [email]);

    if (existingUser.length > 0) {
      return res.status(400).json({ message: "This email already exists." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user into the database
    const insertQuery = `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`;
    const [result] = await userDBPool.query(insertQuery, [
      name,
      email,
      hashedPassword,
    ]);

    // Send response in the required format
    res.status(201).json({
      message: "Your account has been successfully created!",
      result: {
        fieldCount: result.fieldCount || 0,
        affectedRows: result.affectedRows || 0,
        insertId: result.insertId || null,
        info: result.info || "",
        serverStatus: result.serverStatus || 2,
        warningStatus: result.warningStatus || 0,
      },
    });
  } catch (error) {
    console.error("Error signing up:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

app.post("/auth/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    // Get user from database
    const query = `SELECT * FROM users WHERE email = ?`;
    const [rows] = await userDBPool.query(query, [email]);

    if (rows.length < 1) {
      return res
        .status(401)
        .json({ message: "Email or password is incorrect.", status: 401 });
    }

    const user = rows[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Email or password is incorrect.", status: 401 });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { id: user.user_id },
      process.env.ACCESS_TOKEN_SECRET || "default_secret",
      { algorithm: "HS256", expiresIn: "1h" }
    );

    // ✅ Fetch user's cart after login
    const cartQuery = `SELECT * FROM Cart WHERE user_id = ?`;
    const [cartItems] = await userDBPool.query(cartQuery, [user.user_id]);

    // ✅ Return cart items in response
    res.status(200).json({
      message: "You are logged in!",
      status: 200,
      token,
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
      },
      cartItems: cartItems, // ✅ Send cart in response
    });
  } catch (error) {
    console.error("Error signing in:", error);
    res.status(500).json({ message: "Internal server error.", status: 500 });
  }
});

app.patch("/auth/change-password", async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    // Check if token is provided
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No token provided." });
    }

    // Verify user from JWT token
    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET || "default_secret"
    );
    const userId = decoded.id;

    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Both old and new passwords are required." });
    }

    // Fetch the current password from the database
    const query = `SELECT password FROM users WHERE user_id = ?`;
    const [rows] = await userDBPool.query(query, [userId]);

    if (rows.length < 1) {
      return res.status(404).json({ message: "User not found." });
    }

    const user = rows[0];

    // Compare old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect." });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    const updateQuery = `UPDATE users SET password = ? WHERE user_id = ?`;
    await userDBPool.query(updateQuery, [hashedNewPassword, userId]);

    res.status(200).json({ message: "Password updated successfully!" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// ---------------------------------------------------------authroute----------------------------------------

// --------------------------products--------------------------------------------------------------------

app.get("/products/trending", async (req, res) => {
  try {
    const [rows] = await userDBPool.query(
      `SELECT * FROM products 
       WHERE is_trendy = 1 OR is_unique = 1 
       ORDER BY item_id DESC LIMIT 8`
    );

    const formattedRows = rows.map((product) => {
      let parsedImages = [];
      try {
        parsedImages =
          typeof product.images === "string"
            ? JSON.parse(product.images)
            : product.images;
      } catch (e) {
        parsedImages = [];
      }

      return {
        ...product,
        images: parsedImages,
        avg_rating: null,
      };
    });

    res.status(200).json({
      status: 200,
      rows: formattedRows,
    });
  } catch (error) {
    console.error("❌ Trending fetch error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/products", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 16;
  const offset = (page - 1) * limit;
  const category = req.query.category;
  const subcategory = req.query.subcategory;

  try {
    let countQuery = "SELECT COUNT(*) AS count FROM products";
    let dataQuery = "SELECT * FROM products";
    const queryParams = [];
    const conditions = [];

    if (category) {
      conditions.push("category = ?");
      queryParams.push(category);
    }

    if (subcategory) {
      conditions.push("subcategory = ?");
      queryParams.push(subcategory);
    }

    if (conditions.length > 0) {
      const whereClause = " WHERE " + conditions.join(" AND ");
      countQuery += whereClause;
      dataQuery += whereClause;
    }

    dataQuery += " ORDER BY item_id DESC LIMIT ? OFFSET ?";
    queryParams.push(limit, offset);

    const [countResult] = await userDBPool.query(
      countQuery,
      queryParams.slice(0, -2)
    );
    const totalCount = countResult[0].count;
    const totalPages = Math.ceil(totalCount / limit);

    const [rows] = await userDBPool.query(dataQuery, queryParams);

    const formattedRows = rows.map((product) => {
      let parsedImages = [];

      try {
        parsedImages =
          typeof product.images === "string"
            ? JSON.parse(product.images)
            : product.images;
      } catch (e) {
        parsedImages = [];
      }

      return {
        ...product,
        images: parsedImages,
        avg_rating: null,
      };
    });

    res.status(200).json({
      status: 200,
      currentPage: page,
      totalPages,
      rows: formattedRows,
    });
  } catch (error) {
    console.error("❌ Error fetching filtered products:", error);
    res.status(500).json({ status: 500, error: "Database error" });
  }
});

app.get("/product/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const query = "SELECT * FROM products WHERE item_id = ?";
    const [rows] = await userDBPool.query(query, [id]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ status: 404, message: "Product not found" });
    }

    // Ensure the response includes rows as an array
    res.status(200).json({
      status: 200,
      rows: [rows[0]], // Wrap the object in an array to match expected structure
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ status: 500, error: "Database error" });
  }
});

app.get("/category/:category", async (req, res) => {
  try {
    const { category } = req.params;

    const query = `
      SELECT products.*, 
             AVG(customer_reviews.rating) AS avg_rating, 
             COUNT(customer_reviews.rating) AS ratings_length
      FROM products
      LEFT JOIN customer_reviews ON products.item_id = customer_reviews.product_id
      WHERE products.category = ?
      GROUP BY products.item_id
    `;

    const [rows] = await userDBPool.query(query, [category]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ status: 404, message: "No products found in this category" });
    }

    res.status(200).json({ status: 200, rows });
  } catch (error) {
    console.error("Error fetching products by category:", error);
    res.status(500).json({ status: 500, error: "Database error" });
  }
});

// ----------------------------------------------products--------------------------------------------------

// ------------------------------------admin-----------------------------------------------

app.get("/admin/products", async (req, res) => {
  try {
    let { page, limit, category, subcategory, is_trendy, is_unique } =
      req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 15;
    const offset = (page - 1) * limit;

    // ✅ Dynamic filters
    const filters = [];
    const values = [];

 if (category) {
  category = category.trim().toLowerCase();
  filters.push("LOWER(TRIM(category)) = ?");
  values.push(category);
}

if (subcategory) {
  subcategory = subcategory.trim().toLowerCase();
  filters.push("LOWER(TRIM(subcategory)) = ?");
  values.push(subcategory);
}

    if (is_trendy !== undefined) {
      filters.push("is_trendy = ?");
      values.push(is_trendy === "true" ? 1 : 0);
    }

    if (is_unique !== undefined) {
      filters.push("is_unique = ?");
      values.push(is_unique === "true" ? 1 : 0);
    }

    const whereClause =
      filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

    const query = `SELECT * FROM products ${whereClause} LIMIT ? OFFSET ?`;
    const countQuery = `SELECT COUNT(*) AS total FROM products ${whereClause}`;

    // Add pagination values
    const paginatedValues = [...values, limit, offset];

    // Run queries
    const [rows] = await userDBPool.query(query, paginatedValues);
    const [[totalCount]] = await userDBPool.query(countQuery, values);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No products found", total: 0, products: [] });
    }

    res.status(200).json({
      total: totalCount.total,
      page,
      limit,
      totalPages: Math.ceil(totalCount.total / limit),
      products: rows,
    });
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    res.status(500).json({ error: "Database error" });
  }
});

/**
 * ✅ Get Product by ID
 */
app.get("/admin/product/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const query = "SELECT * FROM products WHERE item_id = ?";
    const [rows] = await userDBPool.query(query, [productId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ product: rows[0] });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Database error" });
  }
});

/**
 * ✅ Create New Product
 */

// app.post("/admin/products", async (req, res) => {
//   try {
//     const {
//       name,
//       price,
//       slug,
//       category,
//       subcategory,
//       is_trendy = false,
//       is_unique = false,
//       new: isNew,
//       features,
//       description,
//       includes,
//       gallery,
//       category_image,
//       cart_image,
//       short_name,
//       first_image,
//       images,
//       sold_out = false, // ✅ NEW
//     } = req.body;

//     if (!name || !price || !category) {
//       return res
//         .status(400)
//         .json({ error: "Name, Price, and Category are required" });
//     }

//     const uploadedImages = Array.isArray(images)
//       ? images
//       : JSON.parse(images || "[]");

//     const query = `
//       INSERT INTO products (
//         name, price, slug, category, subcategory, is_trendy, is_unique,
//         new, features, description, images, includes, gallery,
//         category_image, cart_image, short_name, first_image, sold_out
//       )
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `;

//     await userDBPool.query(query, [
//       name,
//       price,
//       slug,
//       // category,
//       // subcategory || null,
//       category?.trim().toLowerCase(),
//       subcategory?.trim().toLowerCase() || null,
//       is_trendy,
//       is_unique,
//       isNew || 0,
//       features || null,
//       description || null,
//       JSON.stringify(uploadedImages),
//       JSON.stringify(includes) || "[]",
//       JSON.stringify(gallery) || "[]",
//       JSON.stringify(category_image) || "[]",
//       cart_image || null,
//       short_name || null,
//       first_image || null,
//       sold_out, // ✅ NEW
//     ]);

//     res.status(201).json({
//       message: "✅ Product created successfully",
//       images: uploadedImages,
//     });
//   } catch (error) {
//     console.error("❌ Error creating product:", error);
//     res.status(500).json({ error: "Database error" });
//   }
// });/

app.post("/admin/products", async (req, res) => {
  try {
    const {
      name,
      price,
      stock_quantity = 0,
      slug,
      category,
      subcategory,
      is_trendy = false,
      is_unique = false,
      new: isNew,
      features,
      description,
      includes = [],
      gallery = [],
      category_image = [],
      cart_image,
      short_name,
      first_image,
      images = [],
      sold_out = false,
    } = req.body;

    if (!name || !price || !category) {
      return res
        .status(400)
        .json({ error: "Name, Price, and Category are required" });
    }

    const uploadedImages = Array.isArray(images)
      ? images
      : JSON.parse(images || "[]");

    await userDBPool.query(
      `
        INSERT INTO products (
          name, price, stock_quantity, slug, category, subcategory,
          is_trendy, is_unique, new, features, description,
          images, includes, gallery, category_image,
          cart_image, short_name, first_image, sold_out
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        name,
        Number(price),
        Number(stock_quantity),
        slug || null,
        category?.trim().toLowerCase(),
        subcategory?.trim().toLowerCase() || null,
        is_trendy ? 1 : 0,
        is_unique ? 1 : 0,
        isNew ? 1 : 0,
        features || null,
        description || null,
        JSON.stringify(uploadedImages),
        JSON.stringify(includes) || "[]",
        JSON.stringify(gallery) || "[]",
        JSON.stringify(category_image) || "[]",
        cart_image || null,
        short_name || null,
        first_image || null,
        sold_out ? 1 : 0,
      ]
    );

    res.status(201).json({ message: "✅ Product created successfully" });
  } catch (error) {
    console.error("❌ Error creating product:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// app.put("/admin/product/:productId", async (req, res) => {
//   try {
//     const { productId } = req.params;
//     const {
//       name,
//       price,
//       slug,
//       category,
//       subcategory,
//       is_trendy = false,
//       is_unique = false,
//       new: isNew,
//       features,
//       description,
//       includes,
//       gallery,
//       category_image,
//       cart_image,
//       short_name,
//       first_image,
//       images,
//       sold_out = false, // ✅ NEW
//     } = req.body;

//     if (!name || !price || !category) {
//       return res
//         .status(400)
//         .json({ error: "❌ Name, Price, and Category are required" });
//     }

//     const selectQuery = "SELECT images FROM products WHERE item_id = ?";
//     const [existingProduct] = await userDBPool.query(selectQuery, [productId]);

//     if (existingProduct.length === 0) {
//       return res.status(404).json({ error: "❌ Product not found" });
//     }

//     let existingImages = [];
//     try {
//       existingImages = JSON.parse(existingProduct[0].images || "[]");
//     } catch (error) {
//       console.error("❌ Error parsing existing images from DB:", error);
//       existingImages = [];
//     }

//     let updatedImages = [];
//     try {
//       if (typeof images === "string") {
//         if (images.startsWith("[") && images.endsWith("]")) {
//           updatedImages = JSON.parse(images);
//         } else {
//           updatedImages = [images];
//         }
//       } else if (Array.isArray(images)) {
//         updatedImages = images;
//       }
//     } catch (error) {
//       console.error("❌ Error parsing images:", error);
//       return res.status(400).json({ error: "Invalid images format" });
//     }

//     if (updatedImages.length === 0) {
//       updatedImages = existingImages;
//     }

//     const query = `
//       UPDATE products SET 
//         name = ?, price = ?, slug = ?, category = ?, subcategory = ?, is_trendy = ?, is_unique = ?,
//         new = ?, features = ?, description = ?, 
//         images = ?, includes = ?, gallery = ?, 
//         category_image = ?, cart_image = ?, short_name = ?, first_image = ?, sold_out = ?
//       WHERE item_id = ?
//     `;

//     await userDBPool.query(query, [
//       name,
//       price,
//       slug,
//      category?.trim().toLowerCase(),
//   subcategory?.trim().toLowerCase() || null,
//       is_trendy,
//       is_unique,
//       isNew || 0,
//       features || null,
//       description || null,
//       JSON.stringify(updatedImages),
//       JSON.stringify(includes) || "[]",
//       JSON.stringify(gallery) || "[]",
//       JSON.stringify(category_image) || "[]",
//       cart_image || null,
//       short_name || null,
//       first_image || null,
//       sold_out, // ✅ NEW
//       productId,
//     ]);

//     res.status(200).json({
//       message: "✅ Product updated successfully",
//       images: updatedImages,
//     });
//   } catch (error) {
//     console.error("❌ Error updating product:", error);
//     res.status(500).json({ error: "Database error" });
//   }
// });

app.put("/admin/product/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const {
      name,
      price,
      stock_quantity = 0,
      slug,
      category,
      subcategory,
      is_trendy = false,
      is_unique = false,
      new: isNew,
      features,
      description,
      includes = [],
      gallery = [],
      category_image = [],
      cart_image,
      short_name,
      first_image,
      images = [],
      sold_out = false,
    } = req.body;

    if (!name || !price || !category) {
      return res
        .status(400)
        .json({ error: "❌ Name, Price, and Category are required" });
    }

    const [existing] = await userDBPool.query(
      "SELECT images FROM products WHERE item_id = ?",
      [productId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: "❌ Product not found" });
    }

    let updatedImages;
    if (Array.isArray(images)) updatedImages = images;
    else if (typeof images === "string" && images.trim())
      updatedImages = JSON.parse(images);
    else updatedImages = JSON.parse(existing[0].images || "[]");

    await userDBPool.query(
      `
        UPDATE products SET
          name = ?, price = ?, stock_quantity = ?, slug = ?,
          category = ?, subcategory = ?, is_trendy = ?, is_unique = ?,
          new = ?, features = ?, description = ?,
          images = ?, includes = ?, gallery = ?,
          category_image = ?, cart_image = ?, short_name = ?, first_image = ?, sold_out = ?
        WHERE item_id = ?
      `,
      [
        name,
        Number(price),
        Number(stock_quantity),
        slug || null,
        category?.trim().toLowerCase(),
        subcategory?.trim().toLowerCase() || null,
        is_trendy ? 1 : 0,
        is_unique ? 1 : 0,
        isNew ? 1 : 0,
        features || null,
        description || null,
        JSON.stringify(updatedImages),
        JSON.stringify(includes) || "[]",
        JSON.stringify(gallery) || "[]",
        JSON.stringify(category_image) || "[]",
        cart_image || null,
        short_name || null,
        first_image || null,
        sold_out ? 1 : 0,
        productId,
      ]
    );

    res.status(200).json({ message: "✅ Product updated successfully" });
  } catch (error) {
    console.error("❌ Error updating product:", error);
    res.status(500).json({ error: "Database error" });
  }
});









/**
 * ✅ Delete Product
 */

app.delete("/admin/product/:productId", async (req, res) => {
  try {
    const { productId } = req.params;

    // 1️⃣ Fetch the product to get images
    const [rows] = await userDBPool.query(
      "SELECT images FROM products WHERE item_id = ?",
      [productId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "❌ Product not found" });
    }

    let images = [];

    try {
      const rawImages = rows[0].images;
      images =
        typeof rawImages === "string" ? JSON.parse(rawImages) : rawImages;
    } catch (error) {
      console.warn("⚠️ Failed to parse images:", error);
      return res.status(400).json({ error: "Invalid image format in DB" });
    }

    // 2️⃣ Delete each image from Cloudinary
    for (const url of images) {
      const match = url.match(
        /\/upload\/(?:v\d+\/)?(.+?)\.(jpg|jpeg|png|webp|gif)/i
      );
      if (match && match[1]) {
        const publicId = match[1]; // e.g. "products/oz1ucu1l0dw3kkju8y35"
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.warn(
            "❌ Cloudinary deletion failed for:",
            publicId,
            err.message
          );
        }
      }
    }

    // 3️⃣ Delete the product from the database
    await userDBPool.query("DELETE FROM products WHERE item_id = ?", [
      productId,
    ]);

    res
      .status(200)
      .json({ message: "✅ Product and images deleted successfully" });
  } catch (error) {
    console.error("❌ Deletion Error:", error);
    res.status(500).json({ error: "Server error while deleting product" });
  }
});

app.get("/admin/categories", async (req, res) => {
  try {
    const query = "SELECT DISTINCT category, subcategory FROM products";
    const [rows] = await userDBPool.query(query);

    const result = {};

    rows.forEach(({ category, subcategory }) => {
      const normalizedCategory = category?.trim().toLowerCase();
      const normalizedSubcategory = subcategory?.trim().toLowerCase();

      if (!normalizedCategory) return;

      if (!result[normalizedCategory]) {
        result[normalizedCategory] = new Set();
      }

      if (normalizedSubcategory) {
        result[normalizedCategory].add(normalizedSubcategory);
      }
    });

    // Convert Sets to Arrays
    const formatted = {};
    for (const [cat, subs] of Object.entries(result)) {
      formatted[cat] = [...subs];
    }

    res.status(200).json({ categories: formatted });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ----------------------------------razor pay anad address oredr apis ----------------------------------------

app.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
    });

    res.json({ success: true, order });
  } catch (error) {
    console.error("Razorpay order creation failed:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to create Razorpay order" });
  }
});

app.post("/verify-payment", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData,
    } = req.body;

    const sign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (sign !== razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }

    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userId = decoded.id;

    const { products, address, total_amount } = orderData;

    // ✅ Insert order
    const [orderRes] = await userDBPool.query(
      `INSERT INTO orders (user_id, total_amount, payment_status, payment_method, order_status, transaction_id)
       VALUES (?, ?, 'success', 'razorpay', 'confirmed', ?)`,
      [userId, total_amount, razorpay_payment_id]
    );

    const orderId = orderRes.insertId;

    // ✅ Insert address
    if (address) {
      const {
        full_name,
        phone_number,
        street_address,
        city,
        state,
        postal_code,
        country,
      } = address;

      await userDBPool.query(
        `INSERT INTO address_orders (order_id, user_id, full_name, phone_number, street_address, city, state, postal_code, country)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          userId,
          full_name,
          phone_number,
          street_address,
          city,
          state,
          postal_code,
          country || "India",
        ]
      );
    }

    // ✅ Insert items
    const orderItems = products.map((item) => [
      orderId,
      item.product_id,
      item.quantity,
      item.price,
    ]);
    await userDBPool.query(
      `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?`,
      [orderItems]
    );

    // ✅ Clear cart
    await userDBPool.query(`DELETE FROM Cart WHERE user_id = ?`, [userId]);

    // ✅ Fetch order details
    const [rows] = await userDBPool.query(
      `SELECT 
        o.order_id, o.total_amount, o.created_at,
        oi.product_id, oi.quantity, oi.price AS item_price,
        p.name AS product_name, p.images AS product_images,
        ao.full_name, ao.phone_number, ao.street_address, ao.city, ao.state, ao.postal_code, ao.country
       FROM orders o
       LEFT JOIN order_items oi ON o.order_id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.item_id
       LEFT JOIN address_orders ao ON o.order_id = ao.order_id
       WHERE o.order_id = ?`,
      [orderId]
    );

    if (rows.length > 0) {
      const order = {
        order_id: rows[0].order_id,
        total_amount: rows[0].total_amount,
        created_at: rows[0].created_at,
        address: {
          full_name: rows[0].full_name,
          phone_number: rows[0].phone_number,
          street_address: rows[0].street_address,
          city: rows[0].city,
          state: rows[0].state,
          postal_code: rows[0].postal_code,
          country: rows[0].country,
        },
        products: rows.map((row) => {
          let productImage = null;
          try {
            const imagesArray = JSON.parse(row.product_images);
            productImage = Array.isArray(imagesArray)
              ? imagesArray[0]
              : row.product_images;
          } catch {
            productImage = row.product_images;
          }

          return {
            product_id: row.product_id,
            name: row.product_name,
            image: productImage,
            quantity: row.quantity,
            price: row.item_price,
          };
        }),
      };

      // ✅ Send email (optional)
      try {
        await sendInvoiceEmail(order);
      } catch (e) {
        console.error("❌ Email error:", e.message);
      }

      // ✅ Send Telegram Message
      try {
        await sendTelegramMessage(order);
      } catch (e) {
        console.error("❌ Telegram error:", e.message);
      }
    }

    res
      .status(200)
      .json({ success: true, message: "Order verified and saved", orderId });
  } catch (error) {
    console.error("Payment verification failed:", error);
    res
      .status(500)
      .json({ success: false, message: "Payment verification failed" });
  }
});

// -----------------------------------google login-----------------------------------------

app.post("/auth/google-login", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: "Google token is required." });
    }

    // ✅ Verify token from frontend
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    // ✅ Check if user already exists
    const [userRows] = await userDBPool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    let user;
    if (userRows.length > 0) {
      user = userRows[0];
    } else {
      // ✅ Create new user if not exists
      const hashedPassword = await bcrypt.hash(Date.now().toString(), 10);
      const [insertResult] = await userDBPool.query(
        "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
        [name, email, hashedPassword]
      );

      const [newUserRows] = await userDBPool.query(
        "SELECT * FROM users WHERE user_id = ?",
        [insertResult.insertId]
      );
      user = newUserRows[0];
    }

    // ✅ Create JWT token
    const authToken = jwt.sign(
      { id: user.user_id },
      process.env.ACCESS_TOKEN_SECRET || "default_secret",
      { algorithm: "HS256", expiresIn: "1h" }
    );

    return res.status(200).json({
      message: "✅ Google login successful",
      token: authToken,
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({ message: "❌ Google authentication failed." });
  }
});












// -----------------------------------------------------------------------------------------------------------------------------------------








// ----------------------------------------------------wishlist routes---------------------------------------------------

// **Get User Wishlist**
// app.get("/wishlist", async (req, res) => {
//   try {
//     const token = req.headers.authorization?.split(" ")[1];
//     if (!token) {
//       return res.status(401).json({ error: "Unauthorized access" });
//     }

//     const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
//     const userId = decoded.id;

//     const query = `
//       SELECT w.*, p.name, p.price, p.images, p.item_id as product_id
//       FROM wishlist w
//       INNER JOIN products p ON w.product_id = p.item_id
//       WHERE w.user_id = ?
//     `;

//     const [rows] = await userDBPool.query(query, [userId]);

//     const formattedItems = rows.map((item) => {
//       let images = [];
//       try {
//         images = typeof item.images === "string" ? JSON.parse(item.images) : item.images;
//       } catch (e) {
//         images = [];
//       }

//       return {
//         id: item.wishlist_id,
//         product_id: item.product_id,
//         name: item.name,
//         price: item.price,
//         image: images.length > 0 ? images[0] : null,
//       };
//     });

//     res.status(200).json({ items: formattedItems });
//   } catch (error) {
//     console.error("Error fetching wishlist:", error);
//     res.status(500).json({ error: "Database error" });
//   }
// });


// **Get User Wishlist**
app.get("/wishlist", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized access" });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userId = decoded.id;

    const query = `
      SELECT w.*, p.name, p.price, p.images, p.item_id as product_id, p.stock_quantity
      FROM wishlist w
      INNER JOIN products p ON w.product_id = p.item_id
      WHERE w.user_id = ?
    `;

    const [rows] = await userDBPool.query(query, [userId]);

    const formattedItems = rows.map((item) => {
      let images = [];
      try {
        images = typeof item.images === "string" ? JSON.parse(item.images) : item.images;
      } catch (e) {
        images = [];
      }

      return {
        id: item.wishlist_id,
        product_id: item.product_id,
        name: item.name,
        price: item.price,
        image: images.length > 0 ? images[0] : null,
        stock_quantity: item.stock_quantity || 1, // ✅ Include stock_quantity
      };
    });

    res.status(200).json({ items: formattedItems });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// **Add Item to Wishlist**
app.post("/wishlist/add", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized access" });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userId = decoded.id;

    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    // Check if item already exists in wishlist
    const checkQuery = "SELECT * FROM wishlist WHERE user_id = ? AND product_id = ?";
    const [existing] = await userDBPool.query(checkQuery, [userId, product_id]);

    if (existing.length > 0) {
      return res.status(400).json({ error: "Item already in wishlist" });
    }

    // Insert into wishlist
    const insertQuery = "INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)";
    await userDBPool.query(insertQuery, [userId, product_id]);

    res.status(201).json({ message: "Item added to wishlist successfully" });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// **Remove Item from Wishlist**
app.delete("/wishlist/remove/:product_id", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized access" });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userId = decoded.id;

    const { product_id } = req.params;

    const query = "DELETE FROM wishlist WHERE user_id = ? AND product_id = ?";
    const [result] = await userDBPool.query(query, [userId, product_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Item not found in wishlist" });
    }

    res.status(200).json({ message: "Item removed from wishlist successfully" });
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// **Clear Wishlist**
app.delete("/wishlist/clear", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized access" });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userId = decoded.id;

    const query = "DELETE FROM wishlist WHERE user_id = ?";
    await userDBPool.query(query, [userId]);

    res.status(200).json({ message: "Wishlist cleared successfully" });
  } catch (error) {
    console.error("Error clearing wishlist:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// ----------------------------------------------------wishlist routes---------------------------------------------------




