const fs = require('fs');
const path = require('path');
const axios = require("axios");
const cheerio = require("cheerio");
const { google } = require("googleapis");
const { pollDBPool } = require("./config/db");

const TEMP_KEY_PATH = path.join(__dirname, 'gsc_key_temp.json');
const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];
const HINDI_SITE_URL = 'https://hindi.cricketaddictor.com/';

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

async function getHindiSearchConsolePages(startDate, endDate) {
  const authClient = await auth.getClient();
  const webmasters = google.webmasters({ version: 'v3', auth: authClient });
  const allRows = [];
  const pageSize = 500;

  for (let startRow = 0; startRow < 5000; startRow += pageSize) {
    const res = await webmasters.searchanalytics.query({
      siteUrl: HINDI_SITE_URL,
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

async function getHindiSearchConsoleQueries(startDate, endDate, pageUrl) {
  const authClient = await auth.getClient();
  const webmasters = google.webmasters({ version: 'v3', auth: authClient });
  const response = await webmasters.searchanalytics.query({
    siteUrl: HINDI_SITE_URL,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['query'],
      rowLimit: 50,
      dimensionFilterGroups: [{
        filters: [{
          dimension: 'page',
          operator: 'equals',
          expression: pageUrl,
        }],
      }],
    },
  });
  return response.data.rows || [];
}

function truncate(str, max = 3000) {
  return str.length > max ? str.slice(0, max) + '...' : str;
}

async function runHindiDeepSeekContentRefreshAnalysis(url, gscQueries, oldPosition, newPosition, oldClicks, newClicks, oldImpressions, newImpressions) {
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);
  const title = $('title').text().trim();
  const meta = $('meta[name="description"]').attr('content') || '';
  let body = '';
  $('p').each((i, el) => (body += $(el).text() + '\n'));
  const publishedDate = $('meta[property="article:published_time"]').attr('content') || $('meta[name="publish-date"]').attr('content') || $('meta[name="date"]').attr('content') || '';

  const prompt = `
आप एक विशेषज्ञ SEO स्ट्रैटेजिस्ट हैं। यह लेख रैंकिंग में गिरावट दिखा रहा है।

GSC Queries: ${gscQueries.map(q => `- ${q.keys[0]} | Clicks: ${q.clicks}, Impressions: ${q.impressions}, CTR: ${(q.ctr * 100).toFixed(2)}%, Position: ${q.position.toFixed(2)}`).join('\n')}

Title: ${title}
Meta: ${meta}
Content: ${truncate(body)}

Position Change: ${oldPosition} → ${newPosition}
Clicks Change: ${oldClicks} → ${newClicks}
Impressions Change: ${oldImpressions} → ${newImpressions}

दें:
1. रैंकिंग गिरावट के कारण
2. कंटेंट अपडेट सुझाव
3. नए कीवर्ड्स
4. मेटा टाइटल और डिस्क्रिप्शन
5. H2/H3 सुधार
6. इंटरनल लिंक्स
7. स्कीमा सुझाव
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

  return {
    deepseekOutput: dsRes.data.choices[0].message.content,
    publishedDate,
  };
}

async function runHindiGscContentRefreshAutomation() {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const pages = await getHindiSearchConsolePages(startDate, endDate);
  console.log(`📄 Total Hindi pages fetched from GSC: ${pages.length}`);

  const candidates = pages.filter(p => 
    p.impressions > 3000 && 
    p.clicks > 50 && 
    p.position > 5
  );

  console.log(`🧠 Hindi pages selected for content refresh: ${candidates.length}\n`);

  const startTime = Date.now();
  let processedCount = 0;

  for (let i = 0; i < candidates.length; i++) {
    const page = candidates[i];
    const url = page.keys[0];
    const index = i + 1;

    try {
      const [existing] = await pollDBPool.query(
        `SELECT id FROM gsc_hindi_content_refresh_recommendations WHERE url = ? LIMIT 1`,
        [url]
      );

      if (existing.length > 0) {
        console.log(`⏩ (${index}/${candidates.length}) Skipped (already processed): ${url}`);
        continue;
      }

      const queries = await getHindiSearchConsoleQueries(startDate, endDate, url);
      if (!queries.length) {
        console.log(`⚠️ (${index}/${candidates.length}) Skipped (no GSC queries): ${url}`);
        continue;
      }

      const { deepseekOutput, publishedDate } = await runHindiDeepSeekContentRefreshAnalysis(
        url,
        queries,
        page.position,
        page.position,
        page.clicks,
        page.clicks,
        page.impressions,
        page.impressions
      );

      await pollDBPool.query(
        `INSERT INTO gsc_hindi_content_refresh_recommendations (url, keyword, old_position, new_position, old_clicks, new_clicks, old_impressions, new_impressions, deepseek_output, article_published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          url,
          queries[0]?.keys[0] || '',
          page.position,
          page.position,
          page.clicks,
          page.clicks,
          page.impressions,
          page.impressions,
          deepseekOutput,
          publishedDate ? new Date(publishedDate) : null
        ]
      );

      processedCount++;
      const elapsed = (Date.now() - startTime) / 1000;
      const avgTime = elapsed / processedCount;
      const remainingTime = ((candidates.length - index) * avgTime).toFixed(0);
      const progress = ((index / candidates.length) * 100).toFixed(1);

      console.log(`✅ (${index}/${candidates.length}) [${progress}%] Done: ${url}`);
      console.log(` ⏱️ Estimated time left: ${remainingTime}s\n`);
    } catch (err) {
      console.error(`❌ (${index}/${candidates.length}) Failed for ${url}:`, err.message);
    }
  }

  console.log(`🎉 Hindi Content Refresh Finished! Total pages processed: ${processedCount}`);
}

module.exports = { runHindiGscContentRefreshAutomation };