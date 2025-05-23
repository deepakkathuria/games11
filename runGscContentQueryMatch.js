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
  const decoded = Buffer.from(process.env.GSC_CREDENTIALS_BASE64, 'base64').toString('utf-8');
  fs.writeFileSync(TEMP_KEY_PATH, decoded);
}

const auth = new google.auth.GoogleAuth({
  keyFile: TEMP_KEY_PATH,
  scopes: SCOPES,
});

async function getGscQueryData(startDate, endDate) {
  const authClient = await auth.getClient();
  const webmasters = google.webmasters({ version: 'v3', auth: authClient });

  const response = await webmasters.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['query', 'page'],
      rowLimit: 200,
    },
  });

  return response.data.rows || [];
}

async function getArticleContent(url) {
  const res = await axios.get(url);
  const $ = cheerio.load(res.data);
  let body = '';
  $('p').each((_, el) => {
    body += $(el).text() + '\n';
  });
  return body;
}

async function runQueryMatchPrompt({ url, content, queries }) {
  const prompt = `
Help us optimize this article for additional relevant keywords.

Article URL: ${url}
Article Content Summary:
${content.slice(0, 2000)}

New Queries (not well covered in content):
- ${queries[0]}
- ${queries[1]}
- ${queries[2]}

For each query, suggest:
1. The best section where it can be added
2. Whether it needs a new H2 or can be merged
3. A sample sentence/paragraph we can insert
`;

  const res = await axios.post(
    "https://api.deepseek.com/v1/chat/completions",
    {
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
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

async function runGscContentQueryMatch() {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const data = await getGscQueryData(startDate, endDate);

  const grouped = {};

  for (const row of data) {
    const page = row.keys[1];
    const query = row.keys[0];
    if (!grouped[page]) grouped[page] = [];
    grouped[page].push(query);
  }

  for (const [url, queries] of Object.entries(grouped)) {
    if (queries.length < 3) continue;

    const selectedQueries = queries.slice(0, 3);
    const content = await getArticleContent(url);
    const ai_output = await runQueryMatchPrompt({ url, content, queries: selectedQueries });

    await pollDBPool.query(`
      INSERT INTO gsc_content_query_match (url, keyword_1, keyword_2, keyword_3, ai_output)
      VALUES (?, ?, ?, ?, ?)`,
      [url, selectedQueries[0], selectedQueries[1], selectedQueries[2], ai_output]
    );

    console.log(`✅ Saved query match output for: ${url}`);
  }

  console.log("🏁 Content-to-query matching complete.");
}

if (require.main === module) {
  runGscContentQueryMatch();
}
