const axios = require('axios');
const cheerio = require('cheerio');
const { default: OpenAI } = require('openai');
const Parser = require('rss-parser');
const pollDBPool = require('./db'); // Your MySQL connection pool

const parser = new Parser();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function extractArticleData(url) {
  try {
    const res = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(res.data);

    const title = $('title').text().trim() || 'No Title';
    const description = $('meta[name="description"]').attr('content') || 'No Description';

    let content = '';
    $('p').each((_, el) => {
      content += $(el).text() + '\n';
    });

    return {
      title,
      description,
      body: content.slice(0, 3500)
    };
  } catch (err) {
    console.error(`❌ Failed to extract article: ${url}`, err.message);
    return null;
  }
}

async function getSimulatedCompetitors(keyword) {
  const prompt = `
You are an SEO expert. Based on this keyword: "${keyword}", simulate the top 4 competitor article summaries.
Format each like:
1. [Title] - [URL]
   - H2s used:
   - Content Highlights:
   - Schema Used:
  `;

  const res = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
  });

  return res.choices[0].message.content;
}

async function analyzeAndSuggest({ title, description, body }, competitors) {
  const prompt = `
You're an expert SEO content strategist.

Below is a cricket article we're analyzing. Compare it to these top-ranking competitors.

Your tasks:
1. List SEO gaps in table format (Section | Issue | Suggestion)
2. Write a better version of the article's intro (2–3 paragraphs) that incorporates those suggestions.

---

Article Title: ${title}
Meta Description: ${description}
Body:
${body}

Top Ranking Competitor Summaries:
${competitors}

Return first a markdown table of SEO GAP REPORT, then a heading: "✅ Recommended Rewrite" and write the new version.
`;

  const res = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
  });

  return res.choices[0].message.content;
}

async function checkAndProcessArticles() {
  const rssUrl = 'https://cricketaddictor.com/feed/';

  try {
    const feed = await parser.parseURL(rssUrl);

    for (const item of feed.items.slice(0, 5)) {
      const articleUrl = item.link;

      // Skip if already processed
      const [existing] = await pollDBPool.query(
        'SELECT id FROM seo_reports WHERE url = ?',
        [articleUrl]
      );
      if (existing.length > 0) {
        console.log(`🔁 Already exists: ${articleUrl}`);
        continue;
      }

      console.log(`🧠 Processing: ${articleUrl}`);
      const articleData = await extractArticleData(articleUrl);
      if (!articleData) continue;

      const competitors = await getSimulatedCompetitors(articleData.title);
      const seoReport = await analyzeAndSuggest(articleData, competitors);

      // Parse SEO report
      const lowerText = seoReport.toLowerCase();
      const gapStart = lowerText.indexOf('seo gap report');
      const rewriteStart = lowerText.indexOf('✅ recommended rewrite'.toLowerCase());

      const tableText =
        gapStart !== -1 && rewriteStart !== -1
          ? seoReport.substring(gapStart + 15, rewriteStart).trim()
          : null;

      const rewriteText =
        rewriteStart !== -1
          ? seoReport.substring(rewriteStart + 26).trim()
          : null;

      // Insert into DB
      const insertQuery = `
        INSERT INTO seo_reports (title, url, seo_report, table_text, rewrite_text)
        VALUES (?, ?, ?, ?, ?)
      `;

      await pollDBPool.query(insertQuery, [
        articleData.title,
        articleUrl,
        seoReport,
        tableText,
        rewriteText
      ]);

      console.log(`✅ Saved SEO report for: ${articleUrl}`);
    }
  } catch (err) {
    console.error('❌ Scheduler Error:', err.message);
  }
}

module.exports = { checkAndProcessArticles };
