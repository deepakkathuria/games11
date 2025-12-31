const axios = require('axios');
require('dotenv').config();
const https = require('https');
const dns = require('dns');

// Prefer IPv4
try { dns.setDefaultResultOrder('ipv4first'); } catch {}
const ipv4Agent = new https.Agent({ family: 4, keepAlive: true });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function getWithRetry(url, opts = {}, tries = 3) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      return await axios.get(url, opts);
    } catch (e) {
      lastErr = e;
      const code = e.response?.status || e.code;
      if (
        code === 'ETIMEDOUT' || code === 'ECONNRESET' || code === 'EAI_AGAIN' ||
        (typeof code === 'number' && (code >= 500 || code === 429))
      ) {
        await sleep(800 * (i + 1));
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}

// GNews API Configuration for Car
const GNEWS_API_KEY = process.env.GNEWS_API_KEY || "a8ee6e2ef2fedf06117bae6d6babcff1";
const GNEWS_BASE_URL = "https://gnews.io/api/v4/search";

async function testAPI() {
  console.log('🔍 Testing GNews API for Car News...\n');
  console.log('📝 API Key:', GNEWS_API_KEY.substring(0, 10) + '...');
  console.log('🔗 Base URL:', GNEWS_BASE_URL);
  
  try {
    const url = new URL(GNEWS_BASE_URL);
    url.searchParams.append("q", "car");
    url.searchParams.append("lang", "en");
    url.searchParams.append("max", "50");
    url.searchParams.append("expand", "content");
    url.searchParams.append("apikey", GNEWS_API_KEY);
    
    const fullURL = url.toString();
    console.log('\n🌐 Full URL:', fullURL.replace(GNEWS_API_KEY, 'API_KEY_HIDDEN'));
    console.log('\n⏳ Making API request...\n');
    
    const response = await getWithRetry(fullURL, {
      timeout: 45000,
      httpsAgent: ipv4Agent,
      headers: { Accept: 'application/json' },
    });
    
    console.log('✅ API Response received!');
    console.log('📊 Status:', response.status);
    console.log('📦 Response keys:', Object.keys(response.data || {}));
    
    if (response.data) {
      if (response.data.information) {
        console.log('\n📰 API Information:');
        console.log(JSON.stringify(response.data.information, null, 2));
      }
      
      if (response.data.totalArticles !== undefined) {
        console.log(`\n📈 Total Articles Available: ${response.data.totalArticles}`);
      }
      
      if (response.data.articles) {
        console.log(`\n📰 Articles Received: ${response.data.articles.length}`);
        
        if (response.data.articles.length > 0) {
          console.log('\n🔍 First Article Sample:');
          const first = response.data.articles[0];
          console.log('  Title:', first.title?.substring(0, 80) || 'N/A');
          console.log('  Content Length:', first.content?.length || 0);
          console.log('  Description:', first.description?.substring(0, 80) || 'N/A');
          console.log('  URL:', first.url || 'N/A');
          
          // Test filtering
          console.log('\n🔍 Testing Filters:');
          const filtered = response.data.articles.filter(article =>
            article.content &&
            article.content.length > 300 &&
            article.title &&
            article.title.length > 10 &&
            !article.title.toLowerCase().includes('betting') &&
            !article.title.toLowerCase().includes('gambling')
          );
          
          console.log(`  Total articles: ${response.data.articles.length}`);
          console.log(`  After filter: ${filtered.length}`);
          
          if (filtered.length === 0 && response.data.articles.length > 0) {
            console.log('\n⚠️ All articles filtered out! Checking why...\n');
            response.data.articles.slice(0, 3).forEach((article, idx) => {
              console.log(`Article ${idx + 1}:`);
              console.log(`  Title length: ${article.title?.length || 0} (need > 10)`);
              console.log(`  Content length: ${article.content?.length || 0} (need > 300)`);
              console.log(`  Has betting: ${article.title?.toLowerCase().includes('betting') || false}`);
              console.log(`  Has gambling: ${article.title?.toLowerCase().includes('gambling') || false}`);
            });
          }
        } else {
          console.log('\n⚠️ No articles in response!');
        }
      } else {
        console.log('\n❌ No articles array in response!');
        console.log('Response data:', JSON.stringify(response.data, null, 2));
      }
    }
    
  } catch (error) {
    console.error('\n❌ API Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
    if (error.code) {
      console.error('Error Code:', error.code);
    }
  }
}

testAPI();

