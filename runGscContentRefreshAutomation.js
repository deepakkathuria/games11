const fs = require('fs');
const path = require('path');
const axios = require("axios");
const { google } = require("googleapis");
const { pollDBPool } = require("./config/db");

const TEMP_KEY_PATH = path.join(__dirname, 'gsc_key_temp.json');
const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];
const SITE_URL = 'https://cricketaddictor.com/';

// Write GSC key from .env
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

async function getGSCPageData(startDate, endDate) {
  const authClient = await auth.getClient();
  const webmasters = google.webmasters({ version: 'v3', auth: authClient });

  const response = await webmasters.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['page'],
      rowLimit: 1000,
    },
  });

  return response.data.rows || [];
}

async function getSearchConsoleQueries(startDate, endDate, pageUrl) {
  const authClient = await auth.getClient();
  const webmasters = google.webmasters({ version: 'v3', auth: authClient });

  const response = await webmasters.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['query'],
      rowLimit: 1,
      dimensionFilterGroups: [
        {
          filters: [
            {
              dimension: 'page',
              operator: 'equals',
              expression: pageUrl,
            },
          ],
        },
      ],
    },
  });

  return response.data.rows?.[0]?.keys?.[0] || 'Unknown';
}

async function runContentRefreshPrompt(data) {
  const prompt = `
The following page has dropped in Google rankings over the last 30 days.

Page: ${data.url}
Primary Keyword: ${data.keyword}
Position Change: ${data.old_position.toFixed(2)} → ${data.new_position.toFixed(2)}
Impressions Change: ${data.old_impressions} → ${data.new_impressions}
Clicks Change: ${data.old_clicks} → ${data.new_clicks}

Compare it with top-ranking competitors and suggest:
1. Title or meta improvements
2. Which section should be rewritten or expanded
3. 2 new subheadings (H2s or H3s) we can add
4. Any internal links or EEAT elements we should include
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

  return dsRes.data.choices[0].message.content;
}

async function runGscContentRefreshAutomation() {
  const today = new Date();
  const currentStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const currentEnd = today.toISOString().split('T')[0];

  const pastStart = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const pastEnd = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const pastData = await getGSCPageData(pastStart, pastEnd);
  const currentData = await getGSCPageData(currentStart, currentEnd);

  const drops = [];

  for (let oldRow of pastData) {
    const url = oldRow.keys[0];
    const newRow = currentData.find(row => row.keys[0] === url);
    if (!newRow) continue;

    const posDrop = newRow.position - oldRow.position;
    if (posDrop >= 1) {
      drops.push({
        url,
        old_position: oldRow.position,
        new_position: newRow.position,
        old_clicks: oldRow.clicks,
        new_clicks: newRow.clicks,
        old_impressions: oldRow.impressions,
        new_impressions: newRow.impressions,
      });
    }
  }

  console.log(`📉 Found ${drops.length} pages with position drop`);

  for (let i = 0; i < drops.length; i++) {
    const item = drops[i];

    try {
      const keyword = await getSearchConsoleQueries(currentStart, currentEnd, item.url);
      const ai_output = await runContentRefreshPrompt({ ...item, keyword });

      await pollDBPool.query(
        `INSERT INTO gsc_content_refresh_recommendations 
        (url, keyword, old_position, new_position, old_clicks, new_clicks, old_impressions, new_impressions, deepseek_output) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.url,
          keyword,
          item.old_position,
          item.new_position,
          item.old_clicks,
          item.new_clicks,
          item.old_impressions,
          item.new_impressions,
          ai_output,
        ]
      );

      console.log(`✅ ${i + 1}/${drops.length} saved → ${item.url}`);
    } catch (err) {
      console.error(`❌ Error on ${item.url}:`, err.message);
    }
  }

  console.log("🏁 Content Refresh Analysis Complete");
}

if (require.main === module) {
  runGscContentRefreshAutomation();
}

module.exports = { runGscContentRefreshAutomation };
