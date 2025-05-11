




















// const axios = require('axios');
// const cheerio = require('cheerio');
// const { default: OpenAI } = require('openai');
// const Parser = require('rss-parser');
// const { pollDBPool } = require('./config/db');

// const parser = new Parser();
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// async function extractArticleData(url) {
//   const res = await axios.get(url, { timeout: 10000 });
//   const $ = cheerio.load(res.data);
//   const title = $('title').text().trim() || 'No Title';
//   const metaDescription = $('meta[name="description"]').attr('content') || 'No Description';
//   let content = '';
//   $('p').each((_, el) => { content += $(el).text() + '\n'; });
//   return {
//     title,
//     description: metaDescription,
//     body: content.slice(0, 3500)
//   };
// }

// async function getSimulatedCompetitors(keyword) {
//   const prompt = `
// You are an SEO expert. Based on this keyword: "${keyword}", simulate the top 4 competitor article summaries.
// Return each like:
// 1. [Title] - [URL]
//    - H2s used:
//    - Content Highlights:
//    - Schema Used:
//   `;
//   const res = await openai.chat.completions.create({
//     model: 'gpt-4-turbo',
//     messages: [{ role: 'user', content: prompt }],
//     temperature: 0.3,
//   });
//   return res.choices[0].message.content;
// }

// async function analyzeAndSuggest({ title, description, body }, competitors) {
//   const prompt = `
// You're an expert SEO content strategist and writer.

// Analyze the article below and return:
// 1. SEO GAP REPORT (Markdown Table: | Section | Issue | Suggestion |)
// 2. Writing Pattern Analysis (paragraph)
// 3. Keyword Table (Markdown: | Keyword | Type | Suggested Usage |)
// 4. Rewrite (Title, Meta, Body)

// ### INPUTS:
// Title: ${title}
// Meta: ${description}
// Body:
// ${body}

// Competitors:
// ${competitors}
// `;

//   const res = await openai.chat.completions.create({
//     model: 'gpt-4-turbo',
//     messages: [{ role: 'user', content: prompt }],
//     temperature: 0.3,
//   });
//   return res.choices[0].message.content;
// }

// function extractSectionsFromReport(reportText) {
//   const getSection = (start, end) => {
//     const startIdx = reportText.indexOf(start);
//     const endIdx = reportText.indexOf(end);
//     return startIdx !== -1 && endIdx !== -1
//       ? reportText.substring(startIdx + start.length, endIdx).trim()
//       : null;
//   };

//   const seo_gap_table = getSection('📊 SEO GAP REPORT', '📝 WRITING PATTERN ANALYSIS');
//   const writing_analysis = getSection('📝 WRITING PATTERN ANALYSIS', '🔑 KEYWORD RESEARCH SUMMARY');
//   const keyword_table = getSection('🔑 KEYWORD RESEARCH SUMMARY', '✅ RECOMMENDED REWRITE');

//   const rewriteBlock = reportText.split('✅ RECOMMENDED REWRITE')[1] || '';
//   const rewrite_title = rewriteBlock.match(/Title:\s*(.+)/)?.[1]?.trim() || null;
//   const rewrite_meta = rewriteBlock.match(/Meta:\s*(.+)/)?.[1]?.trim() || null;
//   const rewrite_body = rewriteBlock.split(/Body:\s*/)[1]?.trim() || null;

//   return {
//     seo_gap_table,
//     writing_analysis,
//     keyword_table,
//     rewrite_title,
//     rewrite_meta,
//     rewrite_body,
//   };
// }

// function parseKeywordTable(markdown) {
//   const lines = markdown.trim().split('\n').filter(l => l.includes('|'));
//   const rows = lines.slice(2); // skip header + divider
//   return rows.map(line => {
//     const [keyword, type, usage] = line.split('|').map(x => x.trim());
//     return { keyword, keyword_type: type, suggested_usage: usage };
//   });
// }

// async function fetchAndProcessFeed() {
//   const feed = await parser.parseURL('https://cricketaddictor.com/feed/');

//   for (const item of feed.items.slice(0, 5)) {
//     const url = item.link;

//     const [existing] = await pollDBPool.query(`SELECT id FROM seo_reports WHERE url = ?`, [url]);
//     if (existing.length > 0) {
//       console.log(`⏩ Already processed: ${url}`);
//       continue;
//     }

//     try {
//       console.log(`🔍 Processing: ${url}`);

//       const articleData = await extractArticleData(url);
//       if (!articleData?.body) {
//         console.warn('⚠️ Skipped (no content)');
//         continue;
//       }

//       const competitors = await getSimulatedCompetitors(articleData.title);
//       const fullReport = await analyzeAndSuggest(articleData, competitors);

//       const sections = extractSectionsFromReport(fullReport);
//       const keywordList = parseKeywordTable(sections.keyword_table || '');

//       console.log('🔎 Parsed Report Sections:');
//       console.log('🔹 seo_gap_table:', sections.seo_gap_table?.substring(0, 100) || 'N/A');
//       console.log('🔹 rewrite_body:', sections.rewrite_body?.substring(0, 100) || 'N/A');
//       console.log('🔹 keywords:', keywordList.length);

//       if (!sections.seo_gap_table || !sections.rewrite_body) {
//         console.warn('⚠️ Skipped: Missing seo_gap_table or rewrite_body');
//         continue;
//       }

//       const [insertResult] = await pollDBPool.query(
//         `INSERT INTO seo_reports
//         (title, url, seo_gap_table, writing_analysis, keyword_table, rewrite_title, rewrite_meta, rewrite_body, tags, full_report)
//         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//         [
//           articleData.title,
//           url,
//           sections.seo_gap_table || '',
//           sections.writing_analysis || '',
//           sections.keyword_table || '',
//           sections.rewrite_title || '',
//           sections.rewrite_meta || '',
//           sections.rewrite_body || '',
//           null,
//           fullReport || ''
//         ]
//       );

//       const reportId = insertResult.insertId;

//       if (keywordList.length > 0) {
//         for (const keyword of keywordList) {
//           await pollDBPool.query(
//             `INSERT INTO seo_keywords (report_id, keyword, keyword_type, suggested_usage)
//              VALUES (?, ?, ?, ?)`,
//             [reportId, keyword.keyword, keyword.keyword_type, keyword.suggested_usage]
//           );
//         }
//       }

//       console.log(`✅ Saved SEO report ID ${reportId} + ${keywordList.length} keywords`);
//     } catch (err) {
//       console.error(`❌ Failed for ${url}:`, err.message);
//     }
//   }
// }

// module.exports = { fetchAndProcessFeed };





// const axios = require('axios');
// const cheerio = require('cheerio');
// const { default: OpenAI } = require('openai');
// const Parser = require('rss-parser');
// const { pollDBPool } = require('./config/db');

// const parser = new Parser();
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// async function extractArticleData(url) {
//   const res = await axios.get(url, { timeout: 10000 });
//   const $ = cheerio.load(res.data);
//   const title = $('title').text().trim() || 'No Title';
//   const metaDescription = $('meta[name="description"]').attr('content') || 'No Description';
//   let content = '';
//   $('p').each((_, el) => { content += $(el).text() + '\n'; });
//   return {
//     title,
//     description: metaDescription,
//     body: content.slice(0, 3500)
//   };
// }

// async function getSimulatedCompetitors(keyword) {
//   const prompt = `
// You are an SEO expert. Based on this keyword: "${keyword}", simulate the top 4 competitor article summaries.
// Return each like:
// 1. [Title] - [URL]
//    - H2s used:
//    - Content Highlights:
//    - Schema Used:
//   `;
//   const res = await openai.chat.completions.create({
//     model: 'gpt-4-turbo',
//     messages: [{ role: 'user', content: prompt }],
//     temperature: 0.3,
//   });
//   return res.choices[0].message.content;
// }

// async function analyzeAndSuggest({ title, description, body }, competitors) {
//   const prompt = `
// You're an expert SEO content strategist and writer.

// Analyze the article below and return:
// 1. SEO GAP REPORT (Markdown Table: | Section | Issue | Suggestion |)
// 2. Writing Pattern Analysis (paragraph)
// 3. Keyword Table (Markdown: | Keyword | Type | Suggested Usage |)
// 4. Rewrite (Title, Meta, Body)

// ### INPUTS:
// Title: ${title}
// Meta: ${description}
// Body:
// ${body}

// Competitors:
// ${competitors}
// `;

//   const res = await openai.chat.completions.create({
//     model: 'gpt-4-turbo',
//     messages: [{ role: 'user', content: prompt }],
//     temperature: 0.3,
//   });
//   return res.choices[0].message.content;
// }

// function extractSectionsFromReport(reportText) {
//   const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/gi, '');

//   const findSectionIndex = (label) => {
//     const normalizedLabel = normalize(label);
//     const lines = reportText.split('\n');
//     for (let i = 0; i < lines.length; i++) {
//       if (normalize(lines[i]).includes(normalizedLabel)) {
//         return i;
//       }
//     }
//     return -1;
//   };

//   const lines = reportText.split('\n');

//   const idxGap = findSectionIndex('seo gap report');
//   const idxWrite = findSectionIndex('writing pattern analysis');
//   const idxKeyword = findSectionIndex('keyword research summary');
//   const idxRewrite = findSectionIndex('recommended rewrite');

//   const seo_gap_table = idxGap !== -1 && idxWrite !== -1
//     ? lines.slice(idxGap + 1, idxWrite).join('\n').trim()
//     : null;

//   const writing_analysis = idxWrite !== -1 && idxKeyword !== -1
//     ? lines.slice(idxWrite + 1, idxKeyword).join('\n').trim()
//     : null;

//   const keyword_table = idxKeyword !== -1 && idxRewrite !== -1
//     ? lines.slice(idxKeyword + 1, idxRewrite).join('\n').trim()
//     : null;

//   const rewrite_lines = idxRewrite !== -1
//     ? lines.slice(idxRewrite + 1).join('\n').trim()
//     : null;

//   const rewrite_title = rewrite_lines?.match(/title:\s*(.*)/i)?.[1]?.trim() || null;
//   const rewrite_meta = rewrite_lines?.match(/meta:\s*(.*)/i)?.[1]?.trim() || null;
//   const rewrite_body = rewrite_lines?.split(/body:\s*/i)?.[1]?.trim() || null;

//   return {
//     seo_gap_table,
//     writing_analysis,
//     keyword_table,
//     rewrite: {
//       title: rewrite_title,
//       meta: rewrite_meta,
//       body: rewrite_body
//     }
//   };
// }

// async function fetchAndProcessFeed() {
//   const feed = await parser.parseURL('https://cricketaddictor.com/feed/');

//   for (const item of feed.items.slice(0, 5)) {
//     const url = item.link;

//     const [existing] = await pollDBPool.query(`SELECT id FROM seo_reports_json WHERE url = ?`, [url]);
//     if (existing.length > 0) {
//       console.log(`⏩ Already processed: ${url}`);
//       continue;
//     }

//     try {
//       console.log(`🔍 Processing: ${url}`);
//       const articleData = await extractArticleData(url);
//       const competitors = await getSimulatedCompetitors(articleData.title);
//       const fullReport = await analyzeAndSuggest(articleData, competitors);
//       const structured = extractSectionsFromReport(fullReport);

//       // 🧠 Save entire structured JSON
//       const jsonToSave = JSON.stringify(structured);

//       const publishedDate = item.pubDate ? new Date(item.pubDate) : new Date();

//       await pollDBPool.query(
//         `INSERT INTO seo_reports_json (url, title, published_date, raw_json)
//          VALUES (?, ?, ?, ?)`,
//         [url, articleData.title, publishedDate, jsonToSave]
//       );

//       console.log(`✅ Saved: ${articleData.title}`);
//     } catch (err) {
//       console.error(`❌ Failed for ${url}:`, err.message);
//     }
//   }
// }

// module.exports = { fetchAndProcessFeed };











const axios = require('axios');
const cheerio = require('cheerio');
const { default: OpenAI } = require('openai');
const Parser = require('rss-parser');
const { pollDBPool } = require('./config/db');

const parser = new Parser();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function extractArticleData(url) {
  const res = await axios.get(url, { timeout: 10000 });
  const $ = cheerio.load(res.data);
  const title = $('title').text().trim() || 'No Title';
  const metaDescription = $('meta[name="description"]').attr('content') || 'No Description';
  let content = '';
  $('p').each((_, el) => { content += $(el).text() + '\n'; });
  return {
    title,
    description: metaDescription,
    body: content.slice(0, 3500)
  };
}

async function getSimulatedCompetitors(keyword) {
  const prompt = `
You are an SEO expert. Based on this keyword: "${keyword}", simulate the top 4 competitor article summaries.
Return each like:
1. [Title] - [URL]
   - H2s used:
   - Content Highlights:
   - Schema Used:
  `;
  const res = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [{ role: 'user', content: prompt }],
    // temperature: 0.3,
     temperature: 0,
    seed: 42
  });
  return res.choices[0].message.content;
}

async function analyzeAndSuggest({ title, description, body }, competitors) {
  const prompt = `
You're an expert SEO content strategist and writer.

Analyze the article below and return:
1. SEO GAP REPORT (Markdown Table: | Section | Issue | Suggestion |)
2. Writing Pattern Analysis (paragraph)
3. Keyword Table (Markdown: | Keyword | Type | Suggested Usage |)
4. Rewrite (Title, Meta, Body)

### INPUTS:
Title: ${title}
Meta: ${description}
Body:
${body}

Competitors:
${competitors}
`;
  const res = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
  });
  return res.choices[0].message.content;
}

// async function fetchAndProcessFeed() {
//   const feed = await parser.parseURL('https://cricketaddictor.com/feed/');

//   for (const item of feed.items.slice(0, 5)) {
//     const url = item.link;

//     const [existing] = await pollDBPool.query(`SELECT id FROM seo_reports_json WHERE url = ?`, [url]);
//     if (existing.length > 0) {
//       console.log(`⏩ Already processed: ${url}`);
//       continue;
//     }

//     try {
//       console.log(`🔍 Processing: ${url}`);
//       const articleData = await extractArticleData(url);
//       const competitors = await getSimulatedCompetitors(articleData.title);
//       const fullGptText = await analyzeAndSuggest(articleData, competitors);

//       const publishedDate = item.pubDate ? new Date(item.pubDate) : new Date();

//       await pollDBPool.query(
//         `INSERT INTO seo_reports_json (url, title, published_date, full_gpt_text)
//          VALUES (?, ?, ?, ?)`,
//         [url, articleData.title, publishedDate, fullGptText]
//       );

//       console.log(`✅ Saved full GPT report for: ${url}`);
//     } catch (err) {
//       console.error(`❌ Failed for ${url}:`, err.message);
//     }
//   }
// }


async function fetchAndProcessFeed() {
  const feed = await parser.parseURL('https://cricketaddictor.com/feed/');

  for (const item of feed.items) { // ⬅️ changed from .slice(0, 5)
    const url = item.link;

    const [existing] = await pollDBPool.query(`SELECT id FROM seo_reports_json WHERE url = ?`, [url]);
    if (existing.length > 0) {
      console.log(`⏩ Already processed: ${url}`);
      continue;
    }

    try {
      console.log(`🔍 Processing: ${url}`);
      const articleData = await extractArticleData(url);
      const competitors = await getSimulatedCompetitors(articleData.title);
      const fullGptText = await analyzeAndSuggest(articleData, competitors);

      const publishedDate = item.pubDate ? new Date(item.pubDate) : new Date();

      await pollDBPool.query(
        `INSERT INTO seo_reports_json (url, title, published_date, full_gpt_text)
         VALUES (?, ?, ?, ?)`,
        [url, articleData.title, publishedDate, fullGptText]
      );

      console.log(`✅ Saved full GPT report for: ${url}`);
    } catch (err) {
      console.error(`❌ Failed for ${url}:`, err.message);
    }
  }
}

module.exports = { fetchAndProcessFeed };
