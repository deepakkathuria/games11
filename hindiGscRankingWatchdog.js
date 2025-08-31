const fs = require('fs');
const path = require('path');
const axios = require("axios");
const cheerio = require("cheerio");
const { google } = require("googleapis");
const { pollDBPool } = require("./config/db");

const TEMP_KEY_PATH = path.join(__dirname, 'gsc_key_temp.json');
const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];
const HINDI_SITE_URL = 'https://hindi.cricketaddictor.com/';

if (process.env.GSC_CREDENTIALS_BASE64 && !fs.existsSync(TEMP_KEY_PATH)) {
  try {
    console.log('📦 Writing GSC key file...');
    const decoded = Buffer.from(process.env.GSC_CREDENTIALS_BASE64, 'base64').toString('utf-8');
    fs.writeFileSync(TEMP_KEY_PATH, decoded);
  } catch (err) {
    console.error('❌ Could not write GSC key:', err);
  }
}

const auth = new google.auth.GoogleAuth({
  keyFile: TEMP_KEY_PATH,
  scopes: SCOPES,
});

async function getHindiSearchConsolePages(startDate, endDate) {
  const authClient = await auth.getClient();
  const webmasters = google.webmasters({ version: 'v3', auth: authClient });
  const allRows = [];
  const pageSize = 500;

  for (let startRow = 0; startRow < 5000; startRow += pageSize) {
    const res = await webmasters.searchanalytics.query({
      siteUrl: HINDI_SITE_URL,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['page'],
        rowLimit: pageSize,
        startRow,
      },
    });
    if (!res.data.rows || res.data.rows.length === 0) break;
    allRows.push(...res.data.rows);
    if (res.data.rows.length < pageSize) break;
  }
  return allRows;
}

async function runHindiGscRankingWatchdog() {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const pages = await getHindiSearchConsolePages(startDate, endDate);
  console.log(`📄 Total Hindi pages fetched from GSC: ${pages.length}`);

  const alerts = [];

  for (const page of pages) {
    const url = page.keys[0];
    const position = page.position;
    const clicks = page.clicks;
    const impressions = page.impressions;

    // Check for ranking drops
    if (position > 10 && impressions > 1000) {
      alerts.push({
        url,
        alert_type: 'ranking_drop',
        message: `रैंकिंग गिरावट: Position ${position.toFixed(2)}`,
        severity: 'high',
        clicks,
        impressions,
        position
      });
    }

    // Check for traffic drops
    if (clicks < 10 && impressions > 2000) {
      alerts.push({
        url,
        alert_type: 'traffic_drop',
        message: `ट्रैफिक गिरावट: ${clicks} clicks from ${impressions} impressions`,
        severity: 'medium',
        clicks,
        impressions,
        position
      });
    }
  }

  console.log(`🚨 Hindi Ranking Watchdog: ${alerts.length} alerts found`);

  for (const alert of alerts) {
    try {
      await pollDBPool.query(
        `INSERT INTO gsc_hindi_ranking_watchdog_alerts (url, alert_type, message, severity, clicks, impressions, position) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          alert.url,
          alert.alert_type,
          alert.message,
          alert.severity,
          alert.clicks,
          alert.impressions,
          alert.position
        ]
      );
    } catch (err) {
      console.error(`❌ Failed to save alert for ${alert.url}:`, err.message);
    }
  }

  console.log(`🎉 Hindi Ranking Watchdog Finished! Alerts saved: ${alerts.length}`);
}

module.exports = { runHindiGscRankingWatchdog };