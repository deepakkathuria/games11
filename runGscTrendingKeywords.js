
const fs = require('fs');
const path = require('path');
const axios = require("axios");
const { google } = require("googleapis");
const { pollDBPool } = require("./config/db");

const TEMP_KEY_PATH = path.join(__dirname, 'gsc_key_temp.json');
const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];
const SITE_URL = 'https://cricketaddictor.com/';

if (process.env.GSC_CREDENTIALS_BASE64 && !fs.existsSync(TEMP_KEY_PATH)) {
  try {
    const decoded = Buffer.from(process.env.GSC_CREDENTIALS_BASE64, 'base64').toString('utf-8');
    fs.writeFileSync(TEMP_KEY_PATH, decoded);
  } catch (err) {
    console.error('❌ Could not write GSC key:', err);
  }
}

const auth = new google.auth.GoogleAuth({
  keyFile: TEMP_KEY_PATH,
  scopes: SCOPES,
});

async function getTrendingKeywords(startDate, endDate) {
  const authClient = await auth.getClient();
  const webmasters = google.webmasters({ version: 'v3', auth: authClient });

  // CURRENT WEEK DATA
  const currentRes = await webmasters.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['query'],
      rowLimit: 500,
    },
  });

  // LAST WEEK DATA
  const previousStart = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const previousEnd = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const previousRes = await webmasters.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate: previousStart,
      endDate: previousEnd,
      dimensions: ['query'],
      rowLimit: 500,
    },
  });

  const current = currentRes.data.rows || [];
  const previous = previousRes.data.rows || [];

  const previousMap = {};
  previous.forEach(row => {
    const query = row.keys[0];
    previousMap[query] = row.impressions;
  });

  const trending = current
    .map(row => {
      const query = row.keys[0];
      const currentImpr = row.impressions;
      const prevImpr = previousMap[query] || 0;
      const change = currentImpr - prevImpr;
      return { query, currentImpr, prevImpr, change };
    })
    .filter(q => q.change > 0 && q.currentImpr > 50)
    .sort((a, b) => b.change - a.change)
    .slice(0, 80); // ✅ Fetch top 80 keywords

  return trending.map(k => k.query);
}

async function runPromptForKeywords(keywords) {
  const prompt = `
We found a set of new trending queries in Google Search Console. Suggest high-quality blog post ideas for each keyword that are likely to rank fast.

Keywords:
${keywords.map(k => `- ${k}`).join('\n')}

Output:
- Suggested article titles
- Target audience
- Unique angle for each
`;

  const res = await axios.post(
    "https://api.deepseek.com/v1/chat/completions",
    {
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 2000,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  return res.data.choices[0].message.content;
}

async function runGscTrendingKeywords() {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  console.log("⏳ Fetching trending keywords from GSC...");
  const keywords = await getTrendingKeywords(startDate, endDate);
  console.log(`✅ Found ${keywords.length} trending keywords.`);

  if (keywords.length < 3) {
    console.log("❌ Not enough trending keywords found.");
    return;
  }

  // Check for existing keywords to avoid duplicates
  const [existingRows] = await pollDBPool.query(`SELECT keywords_json FROM gsc_trending_keywords`);
  const existingKeywords = new Set();
  for (let row of existingRows) {
    try {
      const list = JSON.parse(row.keywords_json || "[]");
      list.forEach(k => existingKeywords.add(k.toLowerCase()));
    } catch (_) {}
  }

  const newKeywords = keywords.filter(k => !existingKeywords.has(k.toLowerCase()));
  if (newKeywords.length < 3) {
    console.log("❌ No new keywords to process.");
    return;
  }

  const finalKeywords = newKeywords.slice(0, 80); // Use first 80 unique
  console.log(`🆕 ${finalKeywords.length} new keywords to process.`);

  console.log("🤖 Sending keywords to DeepSeek AI...");
  const ai_output = await runPromptForKeywords(finalKeywords);

  console.log("💾 Saving to database...");
  await pollDBPool.query(`
    INSERT INTO gsc_trending_keywords (keywords_json, ai_output)
    VALUES (?, ?)`,
    [JSON.stringify(finalKeywords), ai_output]
  );

  console.log("✅ Done. Keywords and AI output saved successfully.");
}

if (require.main === module) {
  runGscTrendingKeywords();
}
