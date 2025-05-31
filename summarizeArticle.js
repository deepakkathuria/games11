require("dotenv").config();
const axios = require("axios");
const cheerio = require("cheerio");
const cliProgress = require("cli-progress");
const { pollDBPool } = require("./config/db");

const FEED_URL = "https://cricketaddictor.com/feed";
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

async function getArticleLinksFromFeed() {
  const res = await axios.get(FEED_URL);
  const $ = cheerio.load(res.data, { xmlMode: true });

  const urls = [];
  $("item").each((_, el) => {
    let link = $(el).find("link").text().trim();
    if (!link.startsWith("http")) {
      link = $(el).find("guid").text().trim();
    }
    if (link && !link.includes("/category/")) urls.push(link);
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

Also, add contextual value wherever it’s appropriate—such as quick background facts, relevant past stats, or implications—but only if it’s verifiable and helps the user understand better.

Each section must start with these exact subheadings:

60-word version  
(A quick snapshot of the article)

100-word version  
(A bite-sized overview with one key extra detail or insight)

250-word version  
(A full summary with match context, names, and any essential stat)

600–900 word version  
(A comprehensive report using the original info + value-added insights. Keep it 100% factual and EEAT-aligned. Make it feel like it was written by a knowledgeable cricket writer. Don’t overhype.)

Additional Notes:  
- Do NOT fabricate any details.  
- Do NOT add personal opinions.  
- Do NOT use passive or corporate tone.  
- Make each version look distinctly human-written and pass AI content detectors.  
- Use brand voice consistently.

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

  await pollDBPool.query(
    `INSERT INTO article_summaries_simplified
     (url, summary_60, summary_100, summary_250, summary_900)
     VALUES (?, ?, ?, ?, ?)`,
    [url, summary_60, summary_100, summary_250, summary_900]
  );
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
    try {
      if (await alreadyExists(url)) {
        progressBar.increment();
        continue;
      }

      await processArticle(url);
      progressBar.increment();
    } catch (_) {
      progressBar.increment();
    }
  }

  progressBar.stop();

  console.log("✅ All articles processed.");
}

module.exports = main;

