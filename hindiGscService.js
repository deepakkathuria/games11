const fs = require('fs');
const path = require('path');
const axios = require("axios");
const cheerio = require("cheerio");
const { google } = require("googleapis");
const { pollDBPool } = require("./config/db");

const TEMP_KEY_PATH = path.join(__dirname, 'gsc_key_temp.json');
const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];
const HINDI_SITE_URL = 'https://hindi.cricketaddictor.com/';

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

async function runHindiDeepSeekAnalysis(url, gscQueries, impressions, clicks, ctr, position) {
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);

  const title = $('title').text().trim();
  const meta = $('meta[name="description"]').attr('content') || '';
  let body = '';
  $('p').each((i, el) => (body += $(el).text() + '\n'));

  const publishedDate =
    $('meta[property="article:published_time"]').attr('content') ||
    $('meta[name="publish-date"]').attr('content') ||
    $('meta[name="date"]').attr('content') ||
    '';

  const prompt = `
आप एक विशेषज्ञ SEO रणनीतिकार हैं।

हिंदी GSC क्वेरीज़:
${gscQueries.map(q => `- ${q.keys[0]} | क्लिक्स: ${q.clicks}, इम्प्रेशन्स: ${q.impressions}, CTR: ${(q.ctr * 100).toFixed(2)}%, पोजीशन: ${q.position.toFixed(2)}`).join('\n')}

शीर्षक: ${title}
मेटा: ${meta}
सामग्री: ${truncate(body)}

कृपया निम्नलिखित दें:
1. ऑप्टिमाइज़ेशन की आवश्यकता वाले क्वेरीज़
2. नए कीवर्ड्स/विषय
3. मेटा शीर्षक और विवरण
4. H2/H3s
5. इंट्रो/कन्क्लूजन रीराइट
6. स्कीमा सुझाव
7. इंटरनल लिंक्स

हिंदी में विस्तृत सुझाव दें।
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

module.exports = { 
  getHindiSearchConsolePages, 
  getHindiSearchConsoleQueries,
  runHindiDeepSeekAnalysis 
};