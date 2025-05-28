const fs = require('fs');
const path = require('path');
const axios = require("axios");
const cheerio = require("cheerio");
const { google } = require("googleapis");
const { pollDBPool } = require("./config/db");

const TEMP_KEY_PATH = path.join(__dirname, 'gsc_key_temp.json');
const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];
const SITE_URL = 'https://cricketaddictor.com/';

// 🔐 Write service account key from .env
if (process.env.GSC_CREDENTIALS_BASE64 && !fs.existsSync(TEMP_KEY_PATH)) {
  try {
    console.log('📦 Writing GSC key file...');
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

async function getSearchConsolePages(startDate, endDate) {
  const authClient = await auth.getClient();
  const webmasters = google.webmasters({ version: 'v3', auth: authClient });

  const allRows = [];
  const pageSize = 500; // Max allowed per page
  for (let startRow = 0; startRow < 5000; startRow += pageSize) {
    const res = await webmasters.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['page'],
        rowLimit: pageSize,
        startRow,
      },
    });

    if (!res.data.rows || res.data.rows.length === 0) break;
    allRows.push(...res.data.rows);
    if (res.data.rows.length < pageSize) break;
  }

  return allRows;
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
      rowLimit: 50,
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

  return response.data.rows || [];
}

function truncate(str, max = 3000) {
  return str.length > max ? str.slice(0, max) + '...' : str;
}

async function runDeepSeekAnalysis(url, gscQueries, impressions, clicks, ctr, position) {
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);

  const title = $('title').text().trim();
  const meta = $('meta[name="description"]').attr('content') || '';
  let body = '';
  $('p').each((i, el) => (body += $(el).text() + '\n'));

  const prompt = `
You are an expert SEO strategist.

GSC Queries:
${gscQueries.map(q => `- ${q.keys[0]} | Clicks: ${q.clicks}, Impressions: ${q.impressions}, CTR: ${(q.ctr * 100).toFixed(2)}%, Position: ${q.position.toFixed(2)}`).join('\n')}

Title: ${title}
Meta: ${meta}
Content: ${truncate(body)}

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

  return dsRes.data.choices[0].message.content;
}

async function runGscDeepSeekAutomation() {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const pages = await getSearchConsolePages(startDate, endDate);

  console.log(`📄 Total pages fetched from GSC: ${pages.length}`);

  const candidates = pages.filter(p =>
    p.impressions > 5000 && p.ctr < 0.05 && p.clicks < 300 // You can loosen this to get more pages
  );

  console.log(`🧠 Pages selected after filter: ${candidates.length}\n`);

  const startTime = Date.now();
  let processedCount = 0;

  for (let i = 0; i < candidates.length; i++) {
    const page = candidates[i];
    const url = page.keys[0];
    const index = i + 1;

    try {
      const [existing] = await pollDBPool.query(
        `SELECT id FROM gsc_ai_recommendations WHERE url = ? LIMIT 1`,
        [url]
      );

      if (existing.length > 0) {
        console.log(`⏩ (${index}/${candidates.length}) Skipped (already processed): ${url}`);
        continue;
      }

      const queries = await getSearchConsoleQueries(startDate, endDate, url);
      if (!queries.length) {
        console.log(`⚠️  (${index}/${candidates.length}) Skipped (no GSC queries): ${url}`);
        continue;
      }

      const deepseekOutput = await runDeepSeekAnalysis(
        url,
        queries,
        page.impressions,
        page.clicks,
        page.ctr,
        page.position
      );

      await pollDBPool.query(
        `INSERT INTO gsc_ai_recommendations 
        (url, impressions, clicks, ctr, position, gsc_queries, deepseek_output) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          url,
          page.impressions,
          page.clicks,
          page.ctr,
          page.position,
          JSON.stringify(queries),
          deepseekOutput
        ]
      );

      processedCount++;
      const elapsed = (Date.now() - startTime) / 1000;
      const avgTime = elapsed / processedCount;
      const remainingTime = ((candidates.length - index) * avgTime).toFixed(0);
      const progress = ((index / candidates.length) * 100).toFixed(1);

      console.log(`✅ (${index}/${candidates.length}) [${progress}%] Done: ${url}`);
      console.log(`   ⏱️ Estimated time left: ${remainingTime}s\n`);
    } catch (err) {
      console.error(`❌ (${index}/${candidates.length}) Failed for ${url}:`, err.message);
    }
  }

  console.log(`🎉 Finished! Total pages processed this run: ${processedCount}`);
}

// Run directly
if (require.main === module) {
  runGscDeepSeekAutomation();
}

module.exports = { runGscDeepSeekAutomation };
