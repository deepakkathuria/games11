const fs = require('fs');
const path = require('path');
const axios = require("axios");
const cheerio = require("cheerio");
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

async function getPages(startDate, endDate) {
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

async function getTitleAndMeta(url) {
  const res = await axios.get(url);
  const $ = cheerio.load(res.data);
  const title = $('title').text().trim();
  const meta = $('meta[name="description"]').attr('content') || '';
  return { title, meta };
}

async function runLowCtrPrompt({ keyword, url, title, meta }) {
  const prompt = `
You are a click-through rate optimization expert. This page is ranking in the top 10 but has a CTR below 1.5%.

Keyword: ${keyword}
Page: ${url}
Current Title: “${title}”
Current Meta Description: “${meta}”

Suggest 3 alternate meta titles and descriptions using emotional or curiosity triggers that can boost CTR, while maintaining accuracy and keyword relevance.
`;

  const result = await axios.post(
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

  return result.data.choices[0].message.content;
}

async function runGscLowCtrFixAutomation() {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const pages = await getPages(startDate, endDate);
  const candidates = pages.filter(p => p.position < 10 && p.ctr < 0.015);

  console.log(`🎯 Found ${candidates.length} low CTR pages`);

  for (let i = 0; i < candidates.length; i++) {
    const page = candidates[i];
    const url = page.keys[0];

    try {
      // Check if URL already exists
      const [existing] = await pollDBPool.query(
        `SELECT id, created_at FROM gsc_low_ctr_fixes WHERE url = ? LIMIT 1`,
        [url]
      );

      const keyword = await getTopQuery(startDate, endDate, url);
      const { title, meta } = await getTitleAndMeta(url);
      const output = await runLowCtrPrompt({ keyword, url, title, meta });

      if (existing.length > 0) {
        // Check if data is older than 7 days, then update
        const existingDate = new Date(existing[0].created_at);
        const daysSinceUpdate = (Date.now() - existingDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceUpdate < 7) {
          console.log(`⏩ ${i + 1}/${candidates.length} Skipped (recently updated ${daysSinceUpdate.toFixed(1)} days ago): ${url}`);
          continue;
        }

        // Update existing record
        await pollDBPool.query(`
          UPDATE gsc_low_ctr_fixes 
          SET keyword = ?, title = ?, meta_description = ?, ctr = ?, position = ?, ai_output = ?, created_at = NOW()
          WHERE url = ?`,
          [keyword, title, meta, page.ctr, page.position, output, url]
        );
        console.log(`🔄 ${i + 1}/${candidates.length} Updated (was ${daysSinceUpdate.toFixed(1)} days old): ${url}`);
      } else {
        // Insert new record
        await pollDBPool.query(`
          INSERT INTO gsc_low_ctr_fixes 
          (url, keyword, title, meta_description, ctr, position, ai_output) 
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [url, keyword, title, meta, page.ctr, page.position, output]
        );
        console.log(`✅ ${i + 1}/${candidates.length} New record added → ${url}`);
      }
    } catch (err) {
      console.error(`❌ Error on ${url}:`, err.message);
    }
  }

  console.log('🏁 Low CTR Fix automation complete');
}

if (require.main === module) {
  runGscLowCtrFixAutomation();
}

module.exports = { runGscLowCtrFixAutomation };
