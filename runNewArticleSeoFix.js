const fs = require('fs');
const path = require('path');
const axios = require("axios");
const cheerio = require("cheerio");
const { google } = require("googleapis");
const { pollDBPool } = require("./config/db");

const TEMP_KEY_PATH = path.join(__dirname, 'gsc_key_temp.json');
const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];
const SITE_URL = 'https://cricketaddictor.com/';

// Load service account key from base64 .env
if (process.env.GSC_CREDENTIALS_BASE64 && !fs.existsSync(TEMP_KEY_PATH)) {
  try {
    const decoded = Buffer.from(process.env.GSC_CREDENTIALS_BASE64, 'base64').toString('utf-8');
    fs.writeFileSync(TEMP_KEY_PATH, decoded);
  } catch (err) {
    console.error('❌ Failed to write GSC key:', err);
  }
}

const auth = new google.auth.GoogleAuth({
  keyFile: TEMP_KEY_PATH,
  scopes: SCOPES,
});

// Fetch pages from the last 4 days
async function getPagesLastXDays(startDate, endDate) {
  const authClient = await auth.getClient();
  const webmasters = google.webmasters({ version: 'v3', auth: authClient });

  const response = await webmasters.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['page'],
      rowLimit: 200,
    },
  });

  return response.data.rows || [];
}

async function getTopQuery(startDate, endDate, pageUrl) {
  const authClient = await auth.getClient();
  const webmasters = google.webmasters({ version: 'v3', auth: authClient });

  const response = await webmasters.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['query'],
      rowLimit: 1,
      dimensionFilterGroups: [{
        filters: [{ dimension: 'page', operator: 'equals', expression: pageUrl }]
      }],
    },
  });

  return response.data.rows?.[0]?.keys?.[0] || 'Unknown';
}

function truncate(str, max = 2000) {
  return str.length > max ? str.slice(0, max) + '...' : str;
}

async function getArticleBody(url) {
  try {
    const res = await axios.get(url);
    const $ = cheerio.load(res.data);
    let content = '';
    $('p').each((_, el) => content += $(el).text() + '\n');
    return truncate(content);
  } catch (err) {
    console.error(`❌ Failed to fetch article content from ${url}:`, err.message);
    return 'No content extracted';
  }
}

function getArticleType(url) {
  if (url.includes("fantasy")) return "Fantasy Tips";
  if (url.includes("preview")) return "Pre-Match Preview";
  if (url.includes("live")) return "Live Score Update";
  if (url.includes("report")) return "Post-Match Report";
  if (url.includes("news")) return "Player News";
  return "Cricket Update";
}

function getIntent(type) {
  switch (type) {
    case "Fantasy Tips": return "looking for fantasy team suggestions";
    case "Pre-Match Preview": return "looking for match analysis and lineup news";
    case "Post-Match Report": return "looking for match result and top performers";
    case "Player News": return "looking for player updates or injuries";
    default: return "looking for live updates or cricket insights";
  }
}

async function runNewArticleSeoFix() {
  const startDate = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];

  const pages = await getPagesLastXDays(startDate, today);
  console.log(`📦 GSC Pages from last 4 days: ${pages.length}`);

  const filtered = pages.filter(p => p.impressions > 10 && p.ctr < 0.02);
  console.log(`🎯 Articles matching relaxed filter: ${filtered.length}`);

  for (let i = 0; i < filtered.length; i++) {
    const page = filtered[i];
    const url = page.keys[0];
    const impressions = page.impressions;
    const clicks = page.clicks;
    const ctr = page.ctr;
    const position = page.position;

    console.log(`➡️ (${i + 1}/${filtered.length}) ${url}`);

    try {
      // 🛑 CHECK IF ALREADY PROCESSED
      const [existing] = await pollDBPool.query(
        `SELECT id FROM gsc_new_article_rewrites WHERE url = ? LIMIT 1`,
        [url]
      );

      if (existing.length > 0) {
        console.log(`⏩ Skipping (already processed): ${url}`);
        continue; // skip to next article
      }

      const keyword = await getTopQuery(startDate, today, url);
      const content = await getArticleBody(url);
      const articleType = getArticleType(url);
      const intent = getIntent(articleType);

      const prompt = `
You are a professional SEO strategist and editor.

Below is performance data from Google Search Console for an article published recently on CricketAddictor. The content has high visibility but low engagement. Your goal is to help this page improve its CTR, keyword targeting, and ranking.

---

🔎 Page URL: ${url}
📅 Date: ${today}
🔑 Primary Search Query: ${keyword}
📊 Performance (Last Few Days):
- Impressions: ${impressions}
- Clicks: ${clicks}
- CTR: ${(ctr * 100).toFixed(2)}%
- Avg Position: ${position.toFixed(2)}

📝 Article Type: ${articleType}
🧠 Target Audience: Indian cricket fans, fantasy players, sports news readers
🎯 Target Intent: ${intent}

---

📰 Full Article Content:
${content}

---

Based on this information, please provide:

1. *SEO-optimized Title (max 60 characters)* – catchy, keyword-rich, human-clickable  
2. *Meta Description (max 160 characters)* – compelling, relevant, includes keyword  
3. *Improved H1 & Suggested H2/H3s* – for better structure, SEO, and readability  
4. *Intro Paragraph Rewrite* – that better aligns with the user’s search intent  
5. *Conclusion Rewrite* – to improve retention and encourage internal navigation  
6. *3–5 Internal Linking Suggestions* – to related player/team/series pages (suggest anchors + target URLs)  
7. *3–5 Related Keyword Suggestions* – that should be included for improved reach  
8. *Optional*: Any issues found in tone, formatting, or keyword cannibalization

Ensure the output follows Google's Helpful Content and EEAT guidelines.
`;

      const aiRes = await axios.post(
        "https://api.deepseek.com/v1/chat/completions",
        {
          model: "deepseek-chat",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
          max_tokens: 2000,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const ai_output = aiRes.data.choices[0].message.content;

      await pollDBPool.query(`
        INSERT INTO gsc_new_article_rewrites 
        (url, keyword, impressions, clicks, ctr, position, ai_output)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [url, keyword, impressions, clicks, ctr, position, ai_output]
      );

      console.log(`✅ Saved SEO output for: ${url}`);
    } catch (err) {
      console.error(`❌ Error processing ${url}:`, err.message);
    }
  }

  console.log("🏁 Finished processing new articles.");
}

if (require.main === module) {
  runNewArticleSeoFix();
}

module.exports = { runNewArticleSeoFix };
