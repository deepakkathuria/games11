require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
const baseUrl = 'https://www.cardekho.com/newcars';
const maxPages = 5; // You can increase this if more pages exist
const scrapedVehicles = [];

async function fetchHTML(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });
    return response.data;
  } catch (err) {
    console.error(`❌ Failed to fetch ${url}:`, err.message);
    return null;
  }
}

function extractCarLinks(html) {
  const $ = cheerio.load(html);
  const links = new Set();

  $('a').each((_, el) => {
    const href = $(el).attr('href');
    if (href && href.includes('/overview.htm')) {
      links.add(`https://www.cardekho.com${href}`);
    }
  });

  return Array.from(links);
}

async function extractWithDeepSeek(text) {
  const prompt = `
You are an AI trained to extract structured data from web content.
Extract important details about a car (like name, company, price, specifications, engine, mileage, features, etc.) in JSON format only from the following content:

${text.slice(0, 3000)}
  `;

  try {
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${deepseekApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (err) {
    console.error('❌ DeepSeek error:', err.response?.data || err.message);
    return null;
  }
}

async function scrapeCarPage(url) {
  const html = await fetchHTML(url);
  if (!html) return;

  const $ = cheerio.load(html);
  $('script, style, noscript').remove();
  const text = $('body').text().replace(/\s+/g, ' ').trim();

  const data = await extractWithDeepSeek(text);
  if (data) {
    scrapedVehicles.push({ url, data });
    console.log(`✅ Scraped: ${url}`);
  }
}

(async () => {
  const allCarLinks = new Set();

  // Loop through listing pages (pagination)
  for (let page = 1; page <= maxPages; page++) {
    const pageUrl = page === 1 ? baseUrl : `${baseUrl}/${page}`;
    console.log(`🌐 Scanning listing page: ${pageUrl}`);
    const html = await fetchHTML(pageUrl);
    if (!html) continue;

    const links = extractCarLinks(html);
    links.forEach(link => allCarLinks.add(link));
  }

  const uniqueLinks = Array.from(allCarLinks);
  console.log(`🚗 Total cars found: ${uniqueLinks.length}`);

  for (let i = 0; i < uniqueLinks.length; i++) {
    await scrapeCarPage(uniqueLinks[i]);
  }

  fs.writeFileSync('vehicles.json', JSON.stringify(scrapedVehicles, null, 2));
  console.log('💾 Saved all car data to vehicles.json');
})();
