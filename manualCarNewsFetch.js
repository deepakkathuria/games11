const CarNewsScheduler = require('./carNewsScheduler');
require('dotenv').config();

async function manualFetch() {
  console.log('🚗 Starting manual car news fetch...');
  
  try {
    const carScheduler = new CarNewsScheduler();
    
    // Fetch and store news
    await carScheduler.fetchAndStoreNews();
    
    console.log('✅ Car news fetch completed successfully!');
    console.log('📊 Check your database table: car_news_openai');
    
    // Get count of stored news
    const storedNews = await carScheduler.getStoredNews(10, 0);
    console.log(`📰 Total articles in database: ${storedNews.length} (showing first 10)`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fetching car news:', error);
    process.exit(1);
  }
}

// Run the function
manualFetch();

