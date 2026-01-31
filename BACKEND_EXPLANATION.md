# 📘 Facebook High-CTR Generator - Backend Complete Explanation

## 🗄️ Database Table

### **Table Name: `cricket_news`**

**Columns Used:**
- `id` - Primary key (auto increment)
- `title` - Article title
- `description` - Article description
- `content` - Full article content
- `source_name` - News source name (e.g., "ESPN Cricinfo")
- `source_url` - Original article URL
- `published_at` - Publication date
- `word_count` - Word count of content
- `is_valid` - Boolean flag (true/false) - only valid articles are shown
- `fetched_at` - When article was fetched from GNews
- `processed_at` - When article was processed (if processed)

---

## 🌐 GNews API Configuration

### **Full API URL with Token:**

```
https://gnews.io/api/v4/search?q=cricket&lang=en&max=50&expand=content&from=YYYY-MM-DD&to=YYYY-MM-DD&sortby=publishedAt&apikey=10221c352c3324d296732745fffffe4c
```

### **API Details:**
- **Base URL:** `https://gnews.io/api/v4/search`
- **API Key:** `10221c352c3324d296732745fffffe4c` (stored in `process.env.GNEWS_API_KEY`)
- **Query Parameters:**
  - `q=cricket` - Search query
  - `lang=en` - Language (English)
  - `max=50` - Maximum articles to fetch
  - `expand=content` - Get full content (not just snippet)
  - `from=YYYY-MM-DD` - Start date (7 days ago)
  - `to=YYYY-MM-DD` - End date (today)
  - `sortby=publishedAt` - Sort by publication date
  - `apikey=TOKEN` - API authentication key

### **Location in Code:**
- File: `newsSheduler.js` (Line 44-45)
- File: `newsFetcher.js` (Line 147-148)

---

## 🔄 Complete Backend Flow

### **1. Manual Fetch News Endpoint**

**Route:** `POST /api/manual-fetch-news`

**Location:** `app.js` (Line 4871-4879)

**What Happens:**
```javascript
app.post('/api/manual-fetch-news', async (req, res) => {
  await newsScheduler.fetchAndStoreNews();
  // Returns: { success: true, message: 'News fetched and stored successfully' }
});
```

**Step-by-Step:**
1. Calls `newsScheduler.fetchAndStoreNews()` from `newsSheduler.js`
2. Fetches cricket news from GNews API (last 7 days)
3. Filters articles (removes betting/gambling, checks content length > 300 words)
4. Stores new articles in `cricket_news` table
5. Skips duplicates (checks by `title` + `source_url`)

---

### **2. Get Stored News Endpoint**

**Route:** `GET /api/viral/stored-news`

**Location:** `app.js` (Line 2649-2683)

**Query Parameters:**
- `limit=25` - Articles per page (default: 25)
- `offset=0` - Pagination offset
- `sort=desc` - Sort order

**SQL Query:**
```sql
SELECT COUNT(*) as total 
FROM cricket_news 
WHERE is_valid = true

SELECT * FROM cricket_news 
WHERE is_valid = true 
ORDER BY published_at DESC, fetched_at DESC 
LIMIT ? OFFSET ?
```

**Response:**
```json
{
  "success": true,
  "news": [...articles...],
  "totalCount": 150,
  "currentPage": 1,
  "totalPages": 6
}
```

---

### **3. Generate High-CTR Facebook Content Endpoint**

**Route:** `POST /api/facebook-high-ctr/generate`

**Location:** `app.js` (Line 2851-2919)

**Request Body:**
```json
{
  "articleId": 123
}
```

**What Happens:**

#### **Step 1: Fetch Article from Database**
```sql
SELECT * FROM cricket_news 
WHERE id = ? AND is_valid = true
```

#### **Step 2: Convert to GNews Format**
```javascript
const newsArticle = {
  title: article.title,
  description: article.description,
  content: article.content,
  url: article.source_url,
  publishedAt: article.published_at,
  source: {
    name: article.source_name,
    url: article.source_url
  }
};
```

#### **Step 3: Call OpenAI API**
- **File:** `facebookHighCTRGenerator.js`
- **Function:** `generateHighCTRFacebookContent()`
- **OpenAI Endpoint:** `https://api.openai.com/v1/chat/completions`
- **Model:** `gpt-4o-mini`
- **API Key:** `process.env.OPENAI_API_KEY`

**OpenAI Prompt Structure:**
```
You are a senior social media growth editor...
STEP 1: ANALYZE THE ARTICLE
STEP 2: CREATE FACEBOOK POST COPY (5 captions)
STEP 3: CREATE IMAGE IDEAS (3 concepts)
STEP 4: IMAGE GENERATION PROMPTS (AI-ready)
STEP 5: HASHTAGS & POSTING TIPS
```

#### **Step 4: Return Response**
```json
{
  "success": true,
  "content": "STEP 1: ANALYZE...\nSTEP 2: CREATE...",
  "processingTime": 3500,
  "provider": "OpenAI",
  "originalArticle": {
    "title": "...",
    "description": "..."
  }
}
```

---

## 📊 Complete Data Flow Diagram

```
Frontend (React)
    ↓
1. POST /api/manual-fetch-news
    ↓
newsScheduler.fetchAndStoreNews()
    ↓
2. GNews API Call
    URL: https://gnews.io/api/v4/search?q=cricket&...
    ↓
3. Filter Articles
    - Content length > 300 words
    - No betting/gambling keywords
    - Published within 7 days
    ↓
4. INSERT INTO cricket_news
    (title, description, content, source_name, source_url, published_at, word_count, is_valid)
    ↓
5. GET /api/viral/stored-news
    SELECT * FROM cricket_news WHERE is_valid = true
    ↓
6. Frontend Displays Articles
    ↓
7. User Clicks "Generate HIGH-CTR"
    POST /api/facebook-high-ctr/generate
    { articleId: 123 }
    ↓
8. SELECT * FROM cricket_news WHERE id = 123
    ↓
9. Call OpenAI API
    POST https://api.openai.com/v1/chat/completions
    Model: gpt-4o-mini
    ↓
10. Return Generated Content
    {
      success: true,
      content: "STEP 1: ...",
      processingTime: 3500
    }
```

---

## 🔑 Environment Variables Required

```env
# GNews API Key
GNEWS_API_KEY=10221c352c3324d296732745fffffe4c

# OpenAI API Key
OPENAI_API_KEY=sk-...

# Database Connection (MySQL)
DB_HOST=...
DB_USER=...
DB_PASSWORD=...
DB_NAME=...
```

---

## 📝 Key Files

1. **`app.js`** - Main Express server with all API endpoints
2. **`newsSheduler.js`** - GNews fetching and database storage
3. **`facebookHighCTRGenerator.js`** - OpenAI content generation logic
4. **`config/db.js`** - Database connection pool (`pollDBPool`)

---

## 🎯 Summary

1. **GNews API** se cricket news fetch hoti hai (last 7 days)
2. **`cricket_news` table** mein store hoti hai
3. Frontend se articles list show hoti hai
4. User article select karta hai
5. **OpenAI GPT-4o-mini** se HIGH-CTR Facebook content generate hota hai
6. Content frontend pe display hota hai

**Database Table:** `cricket_news`  
**GNews API:** `https://gnews.io/api/v4/search`  
**Token:** `10221c352c3324d296732745fffffe4c`  
**OpenAI Model:** `gpt-4o-mini`
