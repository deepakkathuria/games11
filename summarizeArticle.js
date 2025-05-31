require("dotenv").config();
const axios = require("axios");
const cheerio = require("cheerio");
const cliProgress = require("cli-progress");
const { pollDBPool } = require("./config/db");

const FEED_URL = "https://cricketaddictor.com/feed";
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// Fetch article URLs from RSS feed
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

// Extract article content (limit 3500 chars)
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
    console.error(`❌ Failed to extract article content from ${url}:`, err.message);
    throw err;
  }
}

// Call DeepSeek to get all summaries with explicit headings
async function getSummariesFromDeepSeek(body) {
  const prompt = `
Rewrite this cricket article into 4 strictly fact-based summaries.

Use these exact headings before each summary section:

### 60-word version

### 100-word version

### 250-word version

### 600–900 word version

Each summary must be factual, neutral, and contain only information in the article.
No blank or placeholder text allowed.

Article:
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

// Extract text under markdown heading, flexible on spaces/dashes
function extractBlock(text, label) {
  const pattern = label.replace(/[-\s]/g, "[-\\s]*"); // allow dashes/spaces flexibly
  const regex = new RegExp(`#*\\s*${pattern}[\\s\\S]*?(?=\\n#+\\s|$)`, "i");
  const match = text.match(regex);
  if (!match) return "";
  return match[0].replace(new RegExp(`^#*\\s*${pattern}`, "i"), "").trim();
}

// Try multiple labels until one returns non-empty summary
function tryExtractAnyOf(text, labels) {
  for (const label of labels) {
    const block = extractBlock(text, label);
    if (block && block.trim().length > 20) return block.trim();
  }
  return "";
}

// Check if article already processed
async function alreadyExists(url) {
  const [rows] = await pollDBPool.query(
    `SELECT id FROM article_summaries_simplified WHERE url = ? LIMIT 1`,
    [url]
  );
  return rows.length > 0;
}

// Process single article: extract, summarize, save
async function processArticle(url) {
  const body = await extractArticleData(url);
  const aiResponse = await getSummariesFromDeepSeek(body);

  console.log(`\n🧠 Full DeepSeek response for ${url}:\n${aiResponse}\n`);

  const summary_60 = tryExtractAnyOf(aiResponse, [
    "60-word version",
    "60 word version",
    "60-word summary",
    "60 word summary",
  ]);
  const summary_100 = tryExtractAnyOf(aiResponse, [
    "100-word version",
    "100 word version",
    "100-word summary",
    "100 word summary",
  ]);
  const summary_250 = tryExtractAnyOf(aiResponse, [
    "250-word version",
    "250 word version",
    "250-word summary",
    "250 word summary",
  ]);
  const summary_900 = tryExtractAnyOf(aiResponse, [
    "600–900 word version",
    "600 to 900 word version",
    "600-900 word version",
    "600–900 word summary",
    "600 to 900 word summary",
    "600-900 word summary",
  ]);

  console.log("---- Extracted Summaries ----");
  console.log("60-word summary:\n", summary_60 || "[EMPTY]");
  console.log("100-word summary:\n", summary_100 || "[EMPTY]");
  console.log("250-word summary:\n", summary_250 || "[EMPTY]");
  console.log("900-word summary:\n", summary_900 || "[EMPTY]");

  if (!summary_60 && !summary_100 && !summary_250) {
    throw new Error("All summaries blank (60, 100, 250 are empty)");
  }
  if (!summary_900) {
    console.warn(`⚠️ Warning: 600–900 word summary missing for URL: ${url}`);
  }

  await pollDBPool.query(
    `INSERT INTO article_summaries_simplified
     (url, summary_60, summary_100, summary_250, summary_900)
     VALUES (?, ?, ?, ?, ?)`,
    [url, summary_60, summary_100, summary_250, summary_900]
  );

  console.log(`✅ Saved summaries for ${url}`);
}

// Main loop with progress bar
async function main() {
  console.log("⏳ Fetching article feed...");
  const urls = await getArticleLinksFromFeed();
  console.log(`🔗 Found ${urls.length} articles.\n`);

  const progressBar = new cliProgress.SingleBar(
    { format: "📊 {bar} | {value}/{total} Articles | {status}" },
    cliProgress.Presets.shades_classic
  );

  let processed = 0;
  let skipped = 0;
  let failed = 0;

  progressBar.start(urls.length, 0, { status: "Starting..." });

  for (const url of urls) {
    try {
      if (await alreadyExists(url)) {
        skipped++;
        progressBar.increment(1, { status: "⏭️ Skipped" });
        continue;
      }

      await processArticle(url);
      processed++;
      progressBar.increment(1, { status: "✅ Saved" });
    } catch (err) {
      failed++;
      progressBar.increment(1, { status: "❌ Failed" });
      console.error(`❌ Error processing ${url}:\n`, err?.stack || err.message || err);
    }
  }

  progressBar.stop();

  console.log("\n📌 Summary:");
  console.log(`✅ Processed: ${processed}`);
  console.log(`⏭️ Skipped:   ${skipped}`);
  console.log(`❌ Failed:    ${failed}`);
  console.log("🏁 Done.");
}

if (require.main === module) {
  main();
}
c