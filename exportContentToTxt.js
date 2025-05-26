const fs = require("fs");
const path = require("path");
const { internalDBPool } = require("./config/db");

async function exportContentWithSlug() {
  try {
    const [rows] = await internalDBPool.query("SELECT slug, content FROM blog_posts");

    if (!rows.length) {
      console.log("⚠️ No data found in blog_posts.");
      return;
    }

    const filePath = path.join(__dirname, "blog_content_with_slugs.txt");
    const writeStream = fs.createWriteStream(filePath, { flags: 'w', encoding: 'utf-8' });

    console.log(`📦 Exporting ${rows.length} articles...\n`);

    for (let i = 0; i < rows.length; i++) {
      const { slug, content } = rows[i];

      // Safeguard against undefined/null
      const safeSlug = typeof slug === 'string' ? slug : String(slug || '');
      const safeContent = typeof content === 'string' ? content : String(content || '');

      writeStream.write(`=== Article ${i + 1} ===\n`);
      writeStream.write(`Slug: ${safeSlug}\n`);
      writeStream.write(`Content:\n${safeContent}\n\n`);

      if ((i + 1) % 100 === 0 || i === rows.length - 1) {
        console.log(`✅ Processed ${i + 1} / ${rows.length}`);
      }
    }

    writeStream.end();
    console.log(`\n✅ Export complete! File saved at: ${filePath}`);
  } catch (err) {
    console.error("❌ Export failed:", err.message);
  } finally {
    internalDBPool.end();
  }
}

exportContentWithSlug();
