require("dotenv").config();
const axios = require("axios");
const cheerio = require("cheerio");
const cliProgress = require("cli-progress");
const { pollDBPool } = require("./config/db");

const FEED_URL = "https://cricketaddictor.com/feed";
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// Normalize URL: remove trailing slashes, trim whitespace
function normalizeUrl(url) {
  return url.trim().replace(/\/+$/, "");
}

async function getArticleLinksFromFeed() {
  const res = await axios.get(FEED_URL);
  const $ = cheerio.load(res.data, { xmlMode: true });

  const urls = [];
  $("item").each((_, el) => {
    let link = $(el).find("link").text().trim();
    if (!link.startsWith("http")) {
      link = $(el).find("guid").text().trim();
    }
    if (link && !link.includes("/category/")) {
      urls.push(normalizeUrl(link));
    }
  });

  return urls.slice(0, 10);
}

async function extractArticleData(url) {
  try {
    const res = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(res.data);
    let content = "";
    $("p").each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 20) content += text + "\n";
    });

    if (!content.trim()) throw new Error("Empty article body");

    return content.slice(0, 3500);
  } catch (err) {
    throw err;
  }
}

async function getSummariesFromDeepSeek(body) {
  const prompt = `
You are an expert cricket journalist writing for a leading sports media brand known for credible, insightful, and fan-friendly reporting.

Your job is to rewrite the following cricket article into 4 fact-based summaries that are clear, human-written, and rich in value. Your tone must be conversational, informative, and easy to read. Use active voice, short paragraphs, and avoid robotic phrasing. The summaries should demonstrate Experience, Expertise, Authority, and Trust (EEAT) as outlined by Google guidelines.

Each section must start with these exact subheadings:

60-word version  
100-word version  
250-word version  
600–900 word version  

Cricket Article:  
${body}
`;

  const res = await axios.post(
    "https://api.deepseek.com/v1/chat/completions",
    {
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 3000,
    },
    {
      headers: {
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  return res.data.choices[0].message.content;
}

function extractBlock(text, label) {
  const pattern = label.replace(/[-\s]/g, "[-\\s]*");
  const regex = new RegExp(`#*\\s*${pattern}[\\s\\S]*?(?=\\n#+\\s|$)`, "i");
  const match = text.match(regex);
  if (!match) return "";
  return match[0].replace(new RegExp(`^#*\\s*${pattern}`, "i"), "").trim();
}

function tryExtractAnyOf(text, labels) {
  for (const label of labels) {
    const block = extractBlock(text, label);
    if (block && block.trim().length > 20) return block.trim();
  }
  return "";
}

async function alreadyExists(url) {
  const [rows] = await pollDBPool.query(
    `SELECT id FROM article_summaries_simplified WHERE url = ? LIMIT 1`,
    [url]
  );
  return rows.length > 0;
}

async function processArticle(url) {
  const body = await extractArticleData(url);
  const aiResponse = await getSummariesFromDeepSeek(body);

  const summary_60 = tryExtractAnyOf(aiResponse, [
    "60-word version",
    "60 word version",
  ]);
  const summary_100 = tryExtractAnyOf(aiResponse, [
    "100-word version",
    "100 word version",
  ]);
  const summary_250 = tryExtractAnyOf(aiResponse, [
    "250-word version",
    "250 word version",
  ]);
  const summary_900 = tryExtractAnyOf(aiResponse, [
    "600–900 word version",
    "600 to 900 word version",
    "600-900 word version",
  ]);

  if (!summary_60 && !summary_100 && !summary_250) {
    throw new Error("All summaries blank (60, 100, 250 are empty)");
  }

  try {
    await pollDBPool.query(
      `INSERT INTO article_summaries_simplified
       (url, summary_60, summary_100, summary_250, summary_900)
       VALUES (?, ?, ?, ?, ?)`,
      [url, summary_60, summary_100, summary_250, summary_900]
    );
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      console.log(`⏩ Duplicate skipped: ${url}`);
    } else {
      throw err;
    }
  }
}

async function main() {
  console.log("🔄 Starting article processing...");

  const urls = await getArticleLinksFromFeed();

  const progressBar = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic
  );

  progressBar.start(urls.length, 0);

  for (const url of urls) {
    const normalizedUrl = normalizeUrl(url);
    try {
      if (await alreadyExists(normalizedUrl)) {
        progressBar.increment();
        continue;
      }

      await processArticle(normalizedUrl);
      progressBar.increment();
    } catch (err) {
      console.error(`⚠️ Error for ${normalizedUrl}: ${err.message}`);
      progressBar.increment();
    }
  }

  progressBar.stop();
  console.log("✅ All articles processed.");
}

module.exports = main;



// require("dotenv").config();
// const axios = require("axios");
// const cheerio = require("cheerio");
// const cliProgress = require("cli-progress");
// const { pollDBPool } = require("./config/db");

// const FEED_URL = "https://cricketaddictor.com/feed";
// const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// // Normalize URL: remove trailing slashes, trim whitespace
// function normalizeUrl(url) {
//   return url.trim().replace(/\/+$/, "");
// }

// async function getArticleLinksFromFeed() {
//   const res = await axios.get(FEED_URL);
//   const $ = cheerio.load(res.data, { xmlMode: true });

//   const articles = [];
//   $("item").each((_, el) => {
//     let link = $(el).find("link").text().trim();
//     let title = $(el).find("title").text().trim();
//     if (!link.startsWith("http")) {
//       link = $(el).find("guid").text().trim();
//     }

//     if (link && !link.includes("/category/")) {
//       articles.push({
//         url: normalizeUrl(link),
//         title,
//       });
//     }
//   });

//   return articles.slice(0, 10); // Process latest 10 articles
// }

// async function extractArticleData(url) {
//   try {
//     const res = await axios.get(url, { timeout: 10000 });
//     const $ = cheerio.load(res.data);
//     let content = "";
//     $("p").each((_, el) => {
//       const text = $(el).text().trim();
//       if (text.length > 20) content += text + "\n";
//     });

//     if (!content.trim()) throw new Error("Empty article body");

//     return content.slice(0, 3500); // limit to 3500 chars
//   } catch (err) {
//     throw err;
//   }
// }

// async function getSummariesFromDeepSeek(title, body) {
//   const prompt = `
// You are an expert cricket journalist working for a top publication like Cricbuzz, ESPNcricinfo, or CricketAddictor.

// You will receive a full article — this could be a Dream11 fantasy prediction, match report, news update, injury announcement, squad list, or interview.

// Your job is to:
// 1. First understand what type of article it is (don't assume it's a match report).
// 2. Then summarize the article in 4 human-style versions:
//    - 60-word version  
//    - 100-word version  
//    - 250-word version  
//    - 600–900 word version  

// Follow these rules:
// - Be factual, concise, and clear.
// - Do NOT fabricate match results or player info.
// - If it’s a Dream11 article, focus on fantasy picks and teams.
// - If it’s news, report only what’s in the article.
// - Always use a conversational tone — not robotic or passive.
// - Never skip mentioning teams or context.

// Here is the article:
// Title: ${title}

// ${body}
// `;

//   const res = await axios.post(
//     "https://api.deepseek.com/v1/chat/completions",
//     {
//       model: "deepseek-chat",
//       messages: [{ role: "user", content: prompt }],
//       temperature: 0.2,
//       max_tokens: 3000,
//     },
//     {
//       headers: {
//         Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
//         "Content-Type": "application/json",
//       },
//     }
//   );

//   return res.data.choices[0].message.content;
// }

// function extractBlock(text, label) {
//   const pattern = label.replace(/[-\s]/g, "[-\\s]*");
//   const regex = new RegExp(`#*\\s*${pattern}[\\s\\S]*?(?=\\n#+\\s|$)`, "i");
//   const match = text.match(regex);
//   if (!match) return "";
//   return match[0].replace(new RegExp(`^#*\\s*${pattern}`, "i"), "").trim();
// }

// function tryExtractAnyOf(text, labels) {
//   for (const label of labels) {
//     const block = extractBlock(text, label);
//     if (block && block.trim().length > 20) return block.trim();
//   }
//   return "";
// }

// async function alreadyExists(url) {
//   const [rows] = await pollDBPool.query(
//     `SELECT id FROM article_summaries_simplified WHERE url = ? LIMIT 1`,
//     [url]
//   );
//   return rows.length > 0;
// }

// async function processArticle(url, title) {
//   const body = await extractArticleData(url);
//   const aiResponse = await getSummariesFromDeepSeek(title, body);

//   const summary_60 = tryExtractAnyOf(aiResponse, [
//     "60-word version",
//     "60 word version",
//   ]);
//   const summary_100 = tryExtractAnyOf(aiResponse, [
//     "100-word version",
//     "100 word version",
//   ]);
//   const summary_250 = tryExtractAnyOf(aiResponse, [
//     "250-word version",
//     "250 word version",
//   ]);
//   const summary_900 = tryExtractAnyOf(aiResponse, [
//     "600–900 word version",
//     "600 to 900 word version",
//     "600-900 word version",
//   ]);

//   if (!summary_60 && !summary_100 && !summary_250) {
//     throw new Error("All summaries blank (60, 100, 250 are empty)");
//   }

//   try {
//     await pollDBPool.query(
//       `INSERT INTO article_summaries_simplified
//        (url, summary_60, summary_100, summary_250, summary_900)
//        VALUES (?, ?, ?, ?, ?)`,
//       [url, summary_60, summary_100, summary_250, summary_900]
//     );
//   } catch (err) {
//     if (err.code === "ER_DUP_ENTRY") {
//       console.log(`⏩ Duplicate skipped: ${url}`);
//     } else {
//       throw err;
//     }
//   }
// }

// async function main() {
//   console.log("🔄 Starting article processing...");

//   const articles = await getArticleLinksFromFeed();

//   const progressBar = new cliProgress.SingleBar(
//     {},
//     cliProgress.Presets.shades_classic
//   );

//   progressBar.start(articles.length, 0);

//   for (const article of articles) {
//     const normalizedUrl = normalizeUrl(article.url);
//     try {
//       if (await alreadyExists(normalizedUrl)) {
//         progressBar.increment();
//         continue;
//       }

//       await processArticle(normalizedUrl, article.title);
//       progressBar.increment();
//     } catch (err) {
//       console.error(`⚠️ Error for ${normalizedUrl}: ${err.message}`);
//       progressBar.increment();
//     }
//   }

//   progressBar.stop();
//   console.log("✅ All articles processed.");
// }





if (require.main === module) {
  main();
}






// module.exports = main;
