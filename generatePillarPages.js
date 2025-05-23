const fs = require('fs');
const path = require('path');
const { internalDBPool } = require('./config/db');

// Define slug names of pillar categories
const PILLAR_CATEGORY_SLUGS = [
  'players',
  'teams',
  'series',
  'world-cup-2024',
  'livescore'
];

function generateKeywords(title) {
  const lower = title.toLowerCase();
  const keywords = [lower];

  if (lower.includes(' ')) {
    const parts = lower.split(' ');
    keywords.push(parts.join(''));
    keywords.push(parts[0]);
    keywords.push(parts[1] || '');
  }

  return [...new Set(keywords.filter(Boolean))];
}

async function generatePillarPages() {
  try {
    console.log('🔍 Looking for pillar pages using category-based matching...');

    const query = `
      SELECT p.id, p.title, p.slug, c.slug AS category_slug
      FROM blog_posts p
      INNER JOIN blog_categories c ON p.blog_category_id = c.id
      WHERE c.slug IN (${PILLAR_CATEGORY_SLUGS.map(() => '?').join(', ')})
      AND p.status = 1
    `;

    const [rows] = await internalDBPool.query(query, PILLAR_CATEGORY_SLUGS);

    if (rows.length === 0) {
      console.warn('⚠️ No pillar posts found with matching categories!');
      return;
    }

    const pillarPages = rows.map(({ title, slug, category_slug }) => ({
      title,
      slug: `/${category_slug}/${slug}`, // construct the full URL path
      keywords: generateKeywords(title)
    }));

    const filePath = path.join(__dirname, 'pillar_pages_cache.json');
    fs.writeFileSync(filePath, JSON.stringify(pillarPages, null, 2));
    console.log(`✅ pillar_pages_cache.json created with ${pillarPages.length} entries.`);
  } catch (err) {
    console.error('❌ Error generating pillar pages:', err.message);
  }
}

generatePillarPages();
