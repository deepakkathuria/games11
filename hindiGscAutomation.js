const { 
  getHindiSearchConsolePages, 
  getHindiSearchConsoleQueries,
  runHindiDeepSeekAnalysis 
} = require('./hindiGscService');
const { pollDBPool } = require("./config/db");

async function runHindiGscDeepSeekAutomation() {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const pages = await getHindiSearchConsolePages(startDate, endDate);
  console.log(`📄 Total Hindi pages fetched from GSC: ${pages.length}`);

  const candidates = pages.filter(p =>
    p.impressions > 5000 && p.ctr < 0.05 && p.clicks < 300
  );

  console.log(`🧠 Hindi pages selected after filter: ${candidates.length}\n`);

  const startTime = Date.now();
  let processedCount = 0;

  for (let i = 0; i < candidates.length; i++) {
    const page = candidates[i];
    const url = page.keys[0];
    const index = i + 1;

    try {
      const [existing] = await pollDBPool.query(
        `SELECT id FROM gsc_hindi_ai_recommendations WHERE url = ? LIMIT 1`,
        [url]
      );

      if (existing.length > 0) {
        console.log(`⏩ (${index}/${candidates.length}) Skipped (already processed): ${url}`);
        continue;
      }

      const queries = await getHindiSearchConsoleQueries(startDate, endDate, url);
      if (!queries.length) {
        console.log(`⚠️  (${index}/${candidates.length}) Skipped (no GSC queries): ${url}`);
        continue;
      }

      const { deepseekOutput, publishedDate } = await runHindiDeepSeekAnalysis(
        url,
        queries,
        page.impressions,
        page.clicks,
        page.ctr,
        page.position
      );

      await pollDBPool.query(
        `INSERT INTO gsc_hindi_ai_recommendations 
        (url, impressions, clicks, ctr, position, gsc_queries, deepseek_output, article_published_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          url,
          page.impressions,
          page.clicks,
          page.ctr,
          page.position,
          JSON.stringify(queries),
          deepseekOutput,
          publishedDate ? new Date(publishedDate) : null
        ]
      );

      processedCount++;
      const elapsed = (Date.now() - startTime) / 1000;
      const avgTime = elapsed / processedCount;
      const remainingTime = ((candidates.length - index) * avgTime).toFixed(0);
      const progress = ((index / candidates.length) * 100).toFixed(1);

      console.log(`✅ (${index}/${candidates.length}) [${progress}%] Hindi Done: ${url}`);
      console.log(`   ⏱️ Estimated time left: ${remainingTime}s\n`);
    } catch (err) {
      console.error(`❌ (${index}/${candidates.length}) Hindi Failed for ${url}:`, err.message);
    }
  }

  console.log(`🎉 Hindi Finished! Total pages processed this run: ${processedCount}`);
}

// Run directly
if (require.main === module) {
  runHindiGscDeepSeekAutomation();
}

module.exports = { runHindiGscDeepSeekAutomation };