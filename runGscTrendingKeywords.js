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

  const response = await webmasters.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['query'],
      rowLimit: 100,
      orderBy: [{ field: 'impressions', direction: 'descending' }],
    },
  });

  const rows = response.data.rows || [];

  // Sort for keywords with recent jumps
  return rows.slice(0, 3).map(r => r.keys[0]); // Top 3 keywords
}

async function runPromptForKeywords(keywords) {
  const prompt = `
We found a set of new trending queries in Google Search Console. Suggest high-quality blog post ideas for each keyword that are likely to rank fast.

Keywords:
- ${keywords[0]}
- ${keywords[1]}
- ${keywords[2]}

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
      max_tokens: 1500,
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

  const keywords = await getTrendingKeywords(startDate, endDate);
  if (keywords.length < 3) {
    console.log("❌ Not enough keywords found");
    return;
  }

  const ai_output = await runPromptForKeywords(keywords);

  await pollDBPool.query(`
    INSERT INTO gsc_trending_keywords (keyword_1, keyword_2, keyword_3, ai_output)
    VALUES (?, ?, ?, ?)`,
    [keywords[0], keywords[1], keywords[2], ai_output]
  );

  console.log("✅ Trending Keywords saved successfully.");
}

if (require.main === module) {
  runGscTrendingKeywords();
}
