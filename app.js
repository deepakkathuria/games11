require("dotenv").config({ path: __dirname + "/../.env" });
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { getSearchConsoleQueries } = require('./gscService');


// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const cloudinary = require("cloudinary").v2;

const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const { pollDBPool, userDBPool } = require("./config/db"); // Import database pools


const Razorpay = require("razorpay");
const crypto = require("crypto");

const multer = require("multer");
// const upload = multer({ dest: "uploads/" });
//


const { upload } = require("./config/multer"); // Ensure multer config is set up
const bcrypt = require("bcrypt");
const cheerio = require('cheerio');
const Parser = require('rss-parser');
const { OpenAI } = require('openai');

//



const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


cloudinary.config({
  cloud_name:"dqvntxciv",
  api_key: "495824874469665",
  api_secret:"4OVkfZHoFtifgAZ1ByReediZJGU",
});



const sendInvoiceEmail = require("./utils/sendInvoiceEmail");




const app = express();
app.use(express.json());
app.use(cors());
app.set('trust proxy', 1); // even for cross-origin frontend/backend


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});

// Cloudinary Configuration
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });


const cron = require('node-cron');
const sendTelegramMessage = require("./utils/sendTelegramMessage");
// const sendInvoiceEmail = require("./utils/sendInvoiceemail");
// const pool = require('./db'); // Your database connection pool

// Schedule the job to run daily at midnight
cron.schedule('0 0 * * *', async () => {
  try {
    const query = `
      UPDATE users
      SET status = 'expired'
      WHERE status = 'trial' AND trial_end_date < NOW();
    `;
    const [result] = await pollDBPool.query(query);
    console.log(`Expired trials updated: ${result.affectedRows} rows affected.`);
  } catch (error) {
    console.error("Error updating expired trials:", error);
  }
});











// const { fetchAndProcessFeed } = require('./seoScheduler');

// fetchAndProcessFeed(); // Run once on server start

// setInterval(() => {
//   console.log('⏱️ Cron: Running every 5 minutes...');
//   fetchAndProcessFeed();
// }, 5 * 60 * 1000);


//

// 🔹 GET latest 5 reports
app.get('/api/reports-json', async (req, res) => {
  try {
    const [rows] = await pollDBPool.query(`
      SELECT id, title, url, full_gpt_text,published_date, created_at
      FROM seo_reports_json
      ORDER BY created_at DESC
      LIMIT 20
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('❌ [Fetch Reports] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch reports.' });
  }
});

// 🔹 GET report by URL
app.get('/api/reports-json/search', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ success: false, error: 'Missing URL.' });

  try {
    const [rows] = await pollDBPool.query(`
      SELECT id, title, url, full_gpt_text, created_at
      FROM seo_reports_json
      WHERE url LIKE ?
      ORDER BY created_at DESC
      LIMIT 1
    `, [`%${url}%`]);

    if (rows.length === 0) {
      return res.json({ success: false, message: 'No report found for this URL.' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('❌ [Search Report] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to search report.' });
  }
});




const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


app.get('/api/gsc/queries', async (req, res) => {
  try {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const queries = await getSearchConsoleQueries(startDate, endDate);
    res.json({ success: true, queries });
  } catch (err) {
    console.error('❌ GSC Query Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch GSC data.' });
  }
});



app.get('/api/gsc/insight-deepseek', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ success: false, error: 'Missing URL' });

  try {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const queries = await getSearchConsoleQueries(startDate, endDate);

    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const title = $('title').text();
    const meta = $('meta[name="description"]').attr('content') || '';
    let body = '';
    $('p').each((i, el) => {
      body += $(el).text() + '\n';
    });

    const prompt = `
You are an expert SEO strategist.

GSC Queries:
${queries.map(q => `- ${q.keys[0]} | Clicks: ${q.clicks}, Impressions: ${q.impressions}, CTR: ${(q.ctr * 100).toFixed(2)}%, Position: ${q.position.toFixed(2)}`).join('\n')}

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
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 1500,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const output = dsRes.data.choices[0].message.content;

    res.json({ success: true, data: output });
  } catch (err) {
    console.error('❌ DeepSeek Insight Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});





app.get('/api/gsc/insight', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ success: false, error: 'Missing URL' });

  try {
    // Dates
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Step 1: GSC queries
    const queries = await getSearchConsoleQueries(startDate, endDate, 'https://cricketaddictor.com/');

    // Step 2: Get page content
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const title = $('title').text();
    const meta = $('meta[name="description"]').attr('content') || '';
    let body = '';
    $('p').each((i, el) => {
      body += $(el).text() + '\n';
    });

    // Step 3: Format prompt
    const formattedPrompt = `
You are an expert SEO strategist and content optimization assistant.

Based on the following data from Google Search Console for the URL "${url}":

Top Queries (last 30 days):
${queries.map(q => `- ${q.keys[0]} | Clicks: ${q.clicks}, Impressions: ${q.impressions}, CTR: ${(q.ctr * 100).toFixed(2)}%, Position: ${q.position.toFixed(2)}`).join('\n')}

Page Title: ${title}
Meta Description: ${meta}
Page Content: ${body.slice(0, 3000)}

Analyze and return:
1. Top queries needing optimization
2. Suggested new keywords / topics
3. New meta title and description
4. Suggested H2s/H3s
5. Content improvements (intro/conclusion)
6. Schema suggestions
7. Internal link ideas

Use bullet points and organize output.
    `;

    // Step 4: Send to GPT
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [{ role: 'user', content: formattedPrompt }],
      temperature: 0.2,
    });

    res.json({
      success: true,
      data: completion.choices[0].message.content,
    });
  } catch (err) {
    console.error('❌ GSC Insight Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// === ROUTE: GET /api/analyze-url ===
app.get('/api/analyze-url', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ success: false, error: 'Missing URL' });

  try {
    console.log(`🔍 [Analyze] Fetching URL: ${url}`);
    const articleData = await extractArticleData(url);

    const competitors = await getSimulatedCompetitors(articleData.title);

    const seoReport = await analyzeAndSuggest(articleData, competitors);

    res.json({
      success: true,
      title: articleData.title,
      url,
      seo_report: seoReport
    });
  } catch (error) {
    console.error('❌ [Analyze] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to analyze URL', message: error.message });
  }
});


app.get('/api/analyze-url-deepseek', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ success: false, error: 'Missing URL' });

  try {
    console.log(`🔍 [DeepSeek] Fetching URL: ${url}`);

    const articleData = await extractArticleData(url);
    console.log('✅ [DeepSeek] Article Data:', articleData);

    const competitors = await getSimulatedCompetitorsWithDeepSeek(articleData.title);
    console.log('✅ [DeepSeek] Simulated Competitors fetched');

    const seoReport = await analyzeAndSuggestWithDeepSeek(articleData, competitors);
    console.log('✅ [DeepSeek] Report generated');

    res.json({
      success: true,
      title: articleData.title,
      url,
      seo_report: seoReport
    });

  } catch (error) {
    console.error('❌ [DeepSeek Analyze] Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});


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
    'https://api.deepseek.com/v1/chat/completions',
    {
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 800
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return dsRes.data.choices[0].message.content;
}

async function analyzeAndSuggestWithDeepSeek({ title, description, body }, competitors) {
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
   - *Missed keyword intents*

   Present in markdown table:  
   *Keyword | Type | Suggested Usage*

4. *Recommended Rewrite*  
   Write a fully optimized, rewritten version of the article incorporating:
   - All SEO suggestions  
   - Target keywords  
   - Competitor-inspired structure  
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

---

#### 🔑 KEYWORD RESEARCH SUMMARY
| Keyword | Type | Suggested Usage |
|---------|------|------------------|

---

#### ✅ RECOMMENDED REWRITE
`;

  const dsRes = await axios.post(
    'https://api.deepseek.com/v1/chat/completions',
    {
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 1800
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return dsRes.data.choices[0].message.content;
}



// === ROUTE: GET /api/feed ===
app.get('/api/feed', async (req, res) => {
  try {
    const articles = await fetchLatestArticles('https://cricketaddictor.com/feed/', 5);
    res.json({ success: true, articles });
  } catch (err) {
    console.error('❌ [Feed] RSS Error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch RSS feed' });
  }
});


// === HELPERS ===

// async function fetchLatestArticles(rssUrl, limit = 5) {
//   const parser = new Parser();
//   const feed = await parser.parseURL(rssUrl);
//   return feed.items.slice(0, limit).map(item => ({
//     title: item.title,
//     link: item.link
//   }));
// }

async function fetchLatestArticles(rssUrl, limit = 5) {
  const parser = new Parser();
  const feed = await parser.parseURL(rssUrl);

  const sortedItems = feed.items
    .filter(item => item.pubDate)
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
    .slice(0, limit);

  return sortedItems.map(item => ({
    title: item.title,
    link: item.link,
    pubDate: item.pubDate
  }));
}


async function extractArticleData(url) {
  try {
    const res = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(res.data);

    const title = $('title').text().trim() || 'No Title';
    const metaDescription = $('meta[name="description"]').attr('content') || 'No Description';

    let content = '';
    $('p').each((_, el) => {
      content += $(el).text() + '\n';
    });

    if (!title || !content.trim()) {
      throw new Error('No valid title or article content found.');
    }

    return {
      title,
      description: metaDescription,
      body: content.slice(0, 3500) // safe limit for GPT input
    };
  } catch (err) {
    console.error('❌ [extractArticleData] Failed:', err.message);
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
    model: 'gpt-4-turbo',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
  });

  return res.choices[0].message.content;
}

// async function analyzeAndSuggest({ title, description, body }, competitors) {
//   const prompt = `
// You're an expert SEO content strategist.

// Below is a cricket article we're analyzing. Compare it to these top-ranking competitors.

// Your tasks:
// 1. List SEO gaps in table format (Section | Issue | Suggestion)
// 2. Write a better version of the article's intro (2–3 paragraphs) that incorporates those suggestions.

// ---

// Article Title: ${title}
// Meta Description: ${description}
// Body:
// ${body}

// Top Ranking Competitor Summaries:
// ${competitors}

// Return first a markdown table of SEO GAP REPORT, then a heading: "✅ Recommended Rewrite" and write the new version.
// `;

//   const res = await openai.chat.completions.create({
//     model: 'gpt-4-turbo',
//     messages: [{ role: 'user', content: prompt }],
//     temperature: 0.3,
//   });

//   return res.choices[0].message.content;
// }

























// --------------------------  1. Create a Poll---------------------







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
    model: 'gpt-4-turbo',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0,
    seed: 42
  });

  return res.choices[0].message.content;
}











  app.post("/api/polls", async (req, res) => {
    const { title, description, match_id } = req.body;

    if (!title || !match_id) {
      return res.status(400).json({ message: "Invalid input. Provide a title and match_id." });
    }

    try {
      // Insert poll into the database
      const insertPollQuery = `
        INSERT INTO polls (title, description, match_id, status) 
        VALUES (?, ?, ?, 'active');
      `;
      const [pollResult] = await pollDBPool.query(insertPollQuery, [title, description || null, match_id]);

      res.status(201).json({ message: "Poll created successfully", pollId: pollResult.insertId });
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
    return res.status(400).json({ message: "Missing required fields: pollId, team_id, or user_id." });
  }

  try {
    // Check if the user has already voted
    const checkVoteQuery = `
      SELECT * 
      FROM poll_votes 
      WHERE poll_id = ? AND user_id = ?;
    `;
    const [existingVotes] = await pollDBPool.query(checkVoteQuery, [pollId, user_id]);

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
    const [voteCounts] = await pollDBPool.query(fetchVoteCountsQuery, [pollId, pollId]);

    res.status(200).json({
      poll: pollRows[0],
      results: voteCounts,
    });
  } catch (error) {
    console.error("Error fetching poll results:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});


app.get('/api/matches/:matchId/poll', async (req, res) => {
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
      'Vote for your favorite team!',
      matchId,
    ]);
    const pollId = pollResult.insertId;

    // Insert default options (Team A and Team B)
    const insertOptionsQuery = `
      INSERT INTO poll_options (poll_id, option_text, votes_count) 
      VALUES (?, ?, 0), (?, ?, 0);
    `;
    await pollDBPool.query(insertOptionsQuery, [pollId, 'Team A', pollId, 'Team B']);

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
    const [existingMatch] = await pollDBPool.query(checkQuery, [formData.matchId]);

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
      res.status(201).json({ message: "Form data saved successfully!", predictionId: result.insertId });
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












// -------------------------------different learning pj------------------------------------------------------------




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

    res.status(200).json({ message: "Avatar updated successfully!", image: req.file.path });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/auth/user/basic", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userId = decoded.id;

    const query = "SELECT user_id, name, email FROM users WHERE user_id = ?";
    const [rows] = await userDBPool.query(query, [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
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
      return res.status(404).json({ message: "No reviews found for this product" });
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
    const checkQuery = "SELECT * FROM customer_reviews WHERE user_id = ? AND product_id = ?";
    const [existingReview] = await userDBPool.query(checkQuery, [userId, product_id]);

    if (existingReview.length > 0) {
      return res.status(400).json({ error: "You have already submitted a review for this product" });
    }

    // Insert new review
    const insertQuery = `
      INSERT INTO customer_reviews (user_id, product_id, title, content, rating) 
      VALUES (?, ?, ?, ?, ?)
    `;
    await userDBPool.query(insertQuery, [userId, product_id, title, content, rating]);

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
      return res.status(401).json({ error: "Unauthorized access: Token missing" });
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
    rows.forEach(row => {
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
          productImage = Array.isArray(imagesArray) ? imagesArray[0] : row.product_images;
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
      products: rows.map(row => {
        let productImage = null;
        if (row.product_images) {
          try {
            const imagesArray = JSON.parse(row.product_images);
            productImage = Array.isArray(imagesArray) ? imagesArray[0] : row.product_images;
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

    const { total_amount, payment_method, order_status, transaction_id, products } = req.body;

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

    res.status(200).json({ message: "Order and associated items deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ error: "Failed to delete order" });
  }
});













//  ------------------------------- order address-----------------------------------------------------




app.post("/orders/:orderId/address", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { full_name, phone_number, street_address, city, state, postal_code, country } = req.body;

    // Authenticate user
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized access" });

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userId = decoded.id;

    // Check if the order exists and belongs to the user
    const [orderCheck] = await userDBPool.query(`SELECT user_id FROM orders WHERE order_id = ?`, [orderId]);
    if (orderCheck.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }
    if (orderCheck[0].user_id !== userId) {
      return res.status(403).json({ error: "You do not have permission to add an address to this order" });
    }

    // Insert Address
    const query = `
      INSERT INTO address_orders (order_id, user_id, full_name, phone_number, street_address, city, state, postal_code, country)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await userDBPool.query(query, [orderId, userId, full_name, phone_number, street_address, city, state, postal_code, country]);

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
      return res.status(404).json({ message: "Address not found for this order" });
    }

    res.status(200).json({ address: rows[0] });
  } catch (error) {
    console.error("Error fetching order address:", error);
    res.status(500).json({ error: "Failed to fetch address" });
  }
});

/**
 * Update an Address (PATCH /orders/:orderId/address)
 */
/**
 * Update an Address (PATCH /orders/address/:addressId)
 */
app.patch("/orders/address/:addressId", async (req, res) => {
  try {
    const { addressId } = req.params;
    const { full_name, phone_number, street_address, city, state, postal_code, country } = req.body;

    // Authenticate user
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized access" });

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userId = decoded.id;

    // Ensure the user owns the address before updating
    const [addressCheck] = await userDBPool.query(`SELECT user_id FROM address_orders WHERE address_id = ?`, [addressId]);
    if (addressCheck.length === 0) {
      return res.status(404).json({ error: "Address not found" });
    }
    if (addressCheck[0].user_id !== userId) {
      return res.status(403).json({ error: "You do not have permission to update this address" });
    }

    // Update Address
    const query = `
      UPDATE address_orders 
      SET full_name = ?, phone_number = ?, street_address = ?, city = ?, state = ?, postal_code = ?, country = ?
      WHERE address_id = ?
    `;
    const [result] = await userDBPool.query(query, [full_name, phone_number, street_address, city, state, postal_code, country, addressId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Address not found or unchanged" });
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
    const [addressCheck] = await userDBPool.query(`SELECT user_id FROM address_orders WHERE address_id = ?`, [addressId]);
    if (addressCheck.length === 0) {
      return res.status(404).json({ error: "Address not found" });
    }
    if (addressCheck[0].user_id !== userId) {
      return res.status(403).json({ error: "You do not have permission to delete this address" });
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
    if (!token) return res.status(401).json({ error: "Unauthorized access." });

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userId = decoded.id;

    for (const item of items) {
      const checkQuery = `SELECT * FROM Cart WHERE user_id = ? AND id = ?`;
      const [existingItem] = await userDBPool.query(checkQuery, [userId, item.id]);

      if (existingItem.length < 1) {
        // ✅ Fixed: Now inserts as `active`
        const insertQuery = `INSERT INTO Cart (user_id, id, quantity, name, price, image, status) VALUES (?, ?, ?, ?, ?, ?, 'active')`;
        await userDBPool.query(insertQuery, [userId, item.id, item.quantity, item.name, item.price, item.image]);
      } else {
        // ✅ Fixed: Now updates quantity and marks as `active`
        const updateQuery = `UPDATE Cart SET quantity = ?, status = 'active' WHERE id = ? AND user_id = ?`;
        await userDBPool.query(updateQuery, [item.quantity, item.id, userId]);
      }
    }

    res.status(200).json({ message: "Cart updated successfully", cartItems: items });
  } catch (error) {
    console.error("Error adding items to cart:", error);
    res.status(500).json({ error: "Failed to add items to cart" });
  }
});




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



// app.post("/cart/apply-promo", async (req, res) => {
//   const { code, cartTotal } = req.body;

//   try {
//     const query = "SELECT * FROM promo_codes WHERE code = ?";
//     const [promo] = await userDBPool.query(query, [code]);

//     if (!promo.length) return res.status(400).json({ error: "Invalid promo code" });

//     const promoData = promo[0];

//     if (promoData.expiry_date && new Date(promoData.expiry_date) < new Date()) {
//       return res.status(400).json({ error: "Promo code expired" });
//     }

//     if (cartTotal < promoData.min_cart_value) {
//       return res.status(400).json({ error: `Minimum cart value should be Rs.${promoData.min_cart_value}` });
//     }

//     let discount = (cartTotal * promoData.discount_percent) / 100;

//     if (promoData.max_discount_value && discount > promoData.max_discount_value) {
//       discount = promoData.max_discount_value;
//     }

//     const discountedTotal = cartTotal - discount;

//     return res.status(200).json({
//       message: "Promo applied successfully",
//       discount: Math.round(discount),
//       total: Math.round(discountedTotal),
//       promo: code,
//     });
//   } catch (err) {
//     console.error("Promo error:", err);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });




app.post("/cart/apply-promo", async (req, res) => {
  const { code, cartTotal } = req.body;

  try {
    const query = "SELECT * FROM promo_codes WHERE code = ?";
    const [promo] = await userDBPool.query(query, [code]);

    if (!promo.length) return res.status(400).json({ error: "Invalid promo code" });

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
    const [result] = await userDBPool.query(insertQuery, [name, email, hashedPassword]);

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
      return res.status(400).json({ message: "Email and password are required." });
    }

    // Get user from database
    const query = `SELECT * FROM users WHERE email = ?`;
    const [rows] = await userDBPool.query(query, [email]);

    if (rows.length < 1) {
      return res.status(401).json({ message: "Email or password is incorrect.", status: 401 });
    }

    const user = rows[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Email or password is incorrect.", status: 401 });
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
      return res.status(401).json({ message: "Unauthorized: No token provided." });
    }

    // Verify user from JWT token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || "default_secret");
    const userId = decoded.id;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Both old and new passwords are required." });
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






app.get('/products/trending', async (req, res) => {
  try {
    const [rows] = await userDBPool.query(
      `SELECT * FROM products 
       WHERE is_trendy = 1 OR is_unique = 1 
       ORDER BY item_id DESC LIMIT 8`
    );

    const formattedRows = rows.map((product) => {
      let parsedImages = [];
      try {
        parsedImages = typeof product.images === "string"
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



app.get('/products', async (req, res) => {
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

    const [countResult] = await userDBPool.query(countQuery, queryParams.slice(0, -2));
    const totalCount = countResult[0].count;
    const totalPages = Math.ceil(totalCount / limit);

    const [rows] = await userDBPool.query(dataQuery, queryParams);

    const formattedRows = rows.map((product) => {
      let parsedImages = [];

      try {
        parsedImages = typeof product.images === "string"
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
      return res.status(404).json({ status: 404, message: "Product not found" });
    }

    // Ensure the response includes rows as an array
    res.status(200).json({
      status: 200,
      rows: [rows[0]] // Wrap the object in an array to match expected structure
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
      return res.status(404).json({ status: 404, message: "No products found in this category" });
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
    let { page, limit, category, subcategory, is_trendy, is_unique } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 15;
    const offset = (page - 1) * limit;

    // ✅ Dynamic filters
    const filters = [];
    const values = [];

    if (category) {
      filters.push("category = ?");
      values.push(category);
    }

    if (subcategory) {
      filters.push("subcategory = ?");
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

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

    const query = `SELECT * FROM products ${whereClause} LIMIT ? OFFSET ?`;
    const countQuery = `SELECT COUNT(*) AS total FROM products ${whereClause}`;

    // Add pagination values
    const paginatedValues = [...values, limit, offset];

    // Run queries
    const [rows] = await userDBPool.query(query, paginatedValues);
    const [[totalCount]] = await userDBPool.query(countQuery, values);

    if (rows.length === 0) {
      return res.status(404).json({ message: "No products found", total: 0, products: [] });
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


app.post("/admin/products", async (req, res) => {
  try {
    const {
      name,
      price,
      slug,
      category,
      subcategory,
      is_trendy = false,
      is_unique = false,
      new: isNew,
      features,
      description,
      includes,
      gallery,
      category_image,
      cart_image,
      short_name,
      first_image,
      images,
      sold_out = false, // ✅ NEW
    } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({ error: "Name, Price, and Category are required" });
    }

    const uploadedImages = Array.isArray(images) ? images : JSON.parse(images || "[]");

    const query = `
      INSERT INTO products (
        name, price, slug, category, subcategory, is_trendy, is_unique,
        new, features, description, images, includes, gallery,
        category_image, cart_image, short_name, first_image, sold_out
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await userDBPool.query(query, [
      name,
      price,
      slug,
      category,
      subcategory || null,
      is_trendy,
      is_unique,
      isNew || 0,
      features || null,
      description || null,
      JSON.stringify(uploadedImages),
      JSON.stringify(includes) || "[]",
      JSON.stringify(gallery) || "[]",
      JSON.stringify(category_image) || "[]",
      cart_image || null,
      short_name || null,
      first_image || null,
      sold_out, // ✅ NEW
    ]);

    res.status(201).json({ message: "✅ Product created successfully", images: uploadedImages });
  } catch (error) {
    console.error("❌ Error creating product:", error);
    res.status(500).json({ error: "Database error" });
  }
});











app.put("/admin/product/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const {
      name,
      price,
      slug,
      category,
      subcategory,
      is_trendy = false,
      is_unique = false,
      new: isNew,
      features,
      description,
      includes,
      gallery,
      category_image,
      cart_image,
      short_name,
      first_image,
      images,
      sold_out = false, // ✅ NEW
    } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({ error: "❌ Name, Price, and Category are required" });
    }

    const selectQuery = "SELECT images FROM products WHERE item_id = ?";
    const [existingProduct] = await userDBPool.query(selectQuery, [productId]);

    if (existingProduct.length === 0) {
      return res.status(404).json({ error: "❌ Product not found" });
    }

    let existingImages = [];
    try {
      existingImages = JSON.parse(existingProduct[0].images || "[]");
    } catch (error) {
      console.error("❌ Error parsing existing images from DB:", error);
      existingImages = [];
    }

    let updatedImages = [];
    try {
      if (typeof images === "string") {
        if (images.startsWith("[") && images.endsWith("]")) {
          updatedImages = JSON.parse(images);
        } else {
          updatedImages = [images];
        }
      } else if (Array.isArray(images)) {
        updatedImages = images;
      }
    } catch (error) {
      console.error("❌ Error parsing images:", error);
      return res.status(400).json({ error: "Invalid images format" });
    }

    if (updatedImages.length === 0) {
      updatedImages = existingImages;
    }

    const query = `
      UPDATE products SET 
        name = ?, price = ?, slug = ?, category = ?, subcategory = ?, is_trendy = ?, is_unique = ?,
        new = ?, features = ?, description = ?, 
        images = ?, includes = ?, gallery = ?, 
        category_image = ?, cart_image = ?, short_name = ?, first_image = ?, sold_out = ?
      WHERE item_id = ?
    `;

    await userDBPool.query(query, [
      name,
      price,
      slug,
      category,
      subcategory || null,
      is_trendy,
      is_unique,
      isNew || 0,
      features || null,
      description || null,
      JSON.stringify(updatedImages),
      JSON.stringify(includes) || "[]",
      JSON.stringify(gallery) || "[]",
      JSON.stringify(category_image) || "[]",
      cart_image || null,
      short_name || null,
      first_image || null,
      sold_out, // ✅ NEW
      productId,
    ]);

    res.status(200).json({ message: "✅ Product updated successfully", images: updatedImages });
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
      images = typeof rawImages === "string" ? JSON.parse(rawImages) : rawImages;
    } catch (error) {
      console.warn("⚠️ Failed to parse images:", error);
      return res.status(400).json({ error: "Invalid image format in DB" });
    }

    // 2️⃣ Delete each image from Cloudinary
    for (const url of images) {
      const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.(jpg|jpeg|png|webp|gif)/i);
      if (match && match[1]) {
        const publicId = match[1]; // e.g. "products/oz1ucu1l0dw3kkju8y35"
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.warn("❌ Cloudinary deletion failed for:", publicId, err.message);
        }
      }
    }

    // 3️⃣ Delete the product from the database
    await userDBPool.query("DELETE FROM products WHERE item_id = ?", [productId]);

    res.status(200).json({ message: "✅ Product and images deleted successfully" });
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
      if (!category) return;
      if (!result[category]) result[category] = new Set();
      if (subcategory) result[category].add(subcategory);
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
    res.status(500).json({ success: false, message: "Failed to create Razorpay order" });
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
    res.status(500).json({ success: false, message: "Payment verification failed" });
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
    const [userRows] = await userDBPool.query("SELECT * FROM users WHERE email = ?", [email]);

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