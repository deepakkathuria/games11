const axios = require('axios');
const xml2js = require('xml2js');

const sitemapIndexUrl = 'https://cricketaddictor.com/sitemap.xml'; 
async function fetchXml(url) {
  const res = await axios.get(url);
  return xml2js.parseStringPromise(res.data);
}

async function getAllUrls() {
  const allUrls = [];

  // Step 1: Fetch sitemap index
  const indexData = await fetchXml(sitemapIndexUrl);
  const sitemapUrls = indexData.sitemapindex.sitemap.map(s => s.loc[0]);

  console.log(`🧭 Found ${sitemapUrls.length} child sitemaps`);

  // Step 2: Loop through each child sitemap
  for (const sitemapUrl of sitemapUrls) {
    try {
      const childData = await fetchXml(sitemapUrl);
      if (childData.urlset && childData.urlset.url) {
        const urls = childData.urlset.url.map(u => u.loc[0]);
        console.log(`📄 ${sitemapUrl} → ${urls.length} URLs`);
        allUrls.push(...urls);
      }
    } catch (err) {
      console.error(`❌ Failed to fetch ${sitemapUrl}:`, err.message);
    }
  }

  // Step 3: Print all collected URLs
  console.log(`✅ Total URLs collected: ${allUrls.length}`);
  console.log(allUrls.slice(0, 10), '...'); // Show first 10 for preview

  // Optional: Save to file
  const fs = require('fs');
  fs.writeFileSync('all-urls.txt', allUrls.join('\n'), 'utf8');
  console.log('📁 Saved to all-urls.txt');
}

getAllUrls();
