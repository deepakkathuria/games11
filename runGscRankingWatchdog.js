const fs = require('fs');
const path = require('path');
const axios = require("axios");
const { google } = require("googleapis");
const { pollDBPool } = require("./config/db");

const TEMP_KEY_PATH = path.join(__dirname, 'gsc_key_temp.json');
const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];
const SITE_URL = 'https://cricketaddictor.com/';

if (process.env.GSC_CREDENTIALS_BASE64 && !fs.existsSync(TEMP_KEY_PATH)) {
  const decoded = Buffer.from(process.env.GSC_CREDENTIALS_BASE64, 'base64').toString('utf-8');
  fs.writeFileSync(TEMP_KEY_PATH, decoded);
}

const auth = new google.auth.GoogleAuth({
  keyFile: TEMP_KEY_PATH,
  scopes: SCOPES,
});

async function getGscPages(startDate, endDate) {
  const authClient = await auth.getClient();
  const webmasters = google.webmasters({ version: 'v3', auth: authClient });

  const response = await webmasters.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['page'],
      rowLimit: 100,
    },
  });

  return response.data.rows || [];
}

async function getTopKeyword(startDate, endDate, url) {
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
              expression: url,
            },
          ],
        },
      ],
    },
  });

  return response.data.rows?.[0]?.keys?.[0] || 'Unknown';
}

async function runWatchdogPrompt({ url, keyword, lastPos, currentPos }) {
  const prompt = `
This page has dropped in position recently.

Page: ${url}
Primary Keyword: ${keyword}
Last Week Position: ${lastPos.toFixed(2)}
Current Position: ${currentPos.toFixed(2)}

Suggest 2–3 reasons for this drop based on likely SEO factors (competition, freshness, linking, EEAT) and 3 actions we should take to recover rankings.
`;

  const result = await axios.post(
    "https://api.deepseek.com/v1/chat/completions",
    {
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 1000,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  return result.data.choices[0].message.content;
}

async function runGscRankingWatchdog() {
  const today = new Date();
  const currentStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const currentEnd = today.toISOString().split('T')[0];

  const prevStart = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const prevEnd = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const currentData = await getGscPages(currentStart, currentEnd);
  const previousData = await getGscPages(prevStart, prevEnd);

  for (let prev of previousData) {
    const url = prev.keys[0];
    const current = currentData.find(r => r.keys[0] === url);
    if (!current) continue;

    const drop = current.position - prev.position;
    if (drop >= 3) {
      const keyword = await getTopKeyword(currentStart, currentEnd, url);
      const ai_output = await runWatchdogPrompt({
        url,
        keyword,
        lastPos: prev.position,
        currentPos: current.position,
      });

      await pollDBPool.query(
        `INSERT INTO gsc_ranking_watchdog_alerts 
         (url, keyword, last_week_position, current_position, ai_output) 
         VALUES (?, ?, ?, ?, ?)`,
        [url, keyword, prev.position, current.position, ai_output]
      );

      console.log(`📉 Watchdog Alert saved for ${url}`);
    }
  }

  console.log("✅ Ranking Watchdog run complete.");
}

if (require.main === module) {
  runGscRankingWatchdog();
}
