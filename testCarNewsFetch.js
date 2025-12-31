const CarNewsScheduler = require('./carNewsScheduler');
const { pollDBPool } = require('./config/db');
require('dotenv').config();

async function testFetch() {
  console.log('🚗 Testing Car News Fetch...\n');
  
  try {
    // Test database connection
    console.log('1️⃣ Testing database connection...');
    const [dbTest] = await pollDBPool.query('SELECT 1 as test');
    console.log('✅ Database connected:', dbTest[0].test === 1);
    
    // Check if table exists
    console.log('\n2️⃣ Checking if car_news_openai table exists...');
    const [tables] = await pollDBPool.query(
      "SHOW TABLES LIKE 'car_news_openai'"
    );
    if (tables.length === 0) {
      console.log('❌ Table car_news_openai does not exist!');
      console.log('💡 Run the SQL file: create_car_news_table.sql');
      process.exit(1);
    }
    console.log('✅ Table exists');
    
    // Check current count
    const [countRows] = await pollDBPool.query(
      'SELECT COUNT(*) as total FROM car_news_openai WHERE is_valid = true'
    );
    console.log(`📊 Current articles in database: ${countRows[0].total}`);
    
    // Test API connection
    console.log('\n3️⃣ Testing GNews API...');
    const carScheduler = new CarNewsScheduler();
    const articles = await carScheduler.fetchNewsFromAPI();
    console.log(`✅ Fetched ${articles.length} articles from GNews API`);
    
    if (articles.length === 0) {
      console.log('⚠️ No articles fetched. Check API key and network connection.');
      process.exit(1);
    }
    
    // Show first article title
    if (articles.length > 0) {
      console.log(`\n📰 Sample article: ${articles[0].title.substring(0, 60)}...`);
    }
    
    // Store in database
    console.log('\n4️⃣ Storing articles in database...');
    await carScheduler.storeNewsInDB(articles);
    
    // Check new count
    const [newCountRows] = await pollDBPool.query(
      'SELECT COUNT(*) as total FROM car_news_openai WHERE is_valid = true'
    );
    const newCount = newCountRows[0].total;
    const added = newCount - countRows[0].total;
    
    console.log(`\n✅ Success!`);
    console.log(`📊 Total articles now: ${newCount}`);
    console.log(`➕ New articles added: ${added}`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testFetch();

