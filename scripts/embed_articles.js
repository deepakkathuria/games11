require("dotenv").config();
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { internalDBPool } = require("../config/db");

const VECTORSTORE_PATH = path.join(__dirname, "../embeddings/vectorstore.json");

// 🧹 Clear any old vectorstore if exists
if (fs.existsSync(VECTORSTORE_PATH)) {
  fs.unlinkSync(VECTORSTORE_PATH);
  console.log("🧹 Old vectorstore.json deleted.");
}

// 📂 Make sure directory exists
fs.mkdirSync(path.dirname(VECTORSTORE_PATH), { recursive: true });

async function getArticles() {
  const [rows] = await internalDBPool.query(`
    SELECT id, title, content, slug FROM blog_posts
    WHERE status = 1
  `);

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    text: `${row.title}\n\n${row.content}`,
  }));
}

async function getOllamaEmbedding(text) {
  try {
    const response = await axios.post("http://localhost:11434/api/embeddings", {
      model: "nomic-embed-text", // Must be pulled locally in Ollama
      prompt: text,
    });
    return response.data.embedding;
  } catch (err) {
    console.error("❌ Embedding failed for text snippet:\n", text.slice(0, 100));
    if (err.response) {
      console.error("📛 Status:", err.response.status);
      console.error("📛 Data:", err.response.data);
    } else {
      console.error("❌ Error:", err.message);
    }
    return null;
  }
}

async function run() {
  const articles = await getArticles();
  const vectorstore = [];

  console.log(`📝 Total articles to embed: ${articles.length}\n`);

  let skipped = 0;
  let success = 0;

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    console.log(`🔄 Embedding [${i + 1}/${articles.length}]: ${article.slug}`);

    const embedding = await getOllamaEmbedding(article.text);

    if (embedding) {
      vectorstore.push({
        id: article.id,
        slug: article.slug,
        embedding,
      });
      success++;
    } else {
      console.warn(`⚠️ Skipped article ID ${article.id}`);
      skipped++;
    }

    // Save after every 10 embeddings or last one
    if ((i + 1) % 10 === 0 || i === articles.length - 1) {
      fs.writeFileSync(VECTORSTORE_PATH, JSON.stringify(vectorstore, null, 2));
      console.log(`💾 Progress saved (${success} embedded, ${skipped} skipped)\n`);
    }
  }

  console.log("✅ Embedding Complete!");
  console.log(`🎯 Total embedded: ${success}`);
  console.log(`⏭️ Skipped: ${skipped}`);
  console.log(`📁 File saved at: ${VECTORSTORE_PATH}`);
}

run();
