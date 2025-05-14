

// const { google } = require('googleapis');
// const path = require('path');
// const KEY_FILE = path.join(__dirname, 'gsc_key.json');

// const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];
// const SITE_URL = 'https://cricketaddictor.com/';

// async function getSearchConsoleQueries(startDate, endDate) {
//   const auth = new google.auth.GoogleAuth({
//     keyFile: KEY_FILE,
//     scopes: SCOPES,
//   });

//   const authClient = await auth.getClient();
//   const webmasters = google.webmasters({ version: 'v3', auth: authClient });

//   const response = await webmasters.searchanalytics.query({
//     siteUrl: SITE_URL,
//     requestBody: {
//       startDate,
//       endDate,
//       dimensions: ['query'],
//       rowLimit: 100,
//     },
//   });

//   return response.data.rows || [];
// }

// module.exports = { getSearchConsoleQueries };



require("dotenv").config();


const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];
const SITE_URL = 'https://cricketaddictor.com/';
const TEMP_KEY_PATH = path.join(__dirname, 'gsc_key_temp.json');

// ✅ Decode and save base64 credentials from env to a temporary key file
if (process.env.GSC_CREDENTIALS_BASE64 && !fs.existsSync(TEMP_KEY_PATH)) {
  try {
        console.log("📦 Decoding and writing GSC credentials...");

    const decoded = Buffer.from(process.env.GSC_CREDENTIALS_BASE64, 'base64').toString('utf-8');
    fs.writeFileSync(TEMP_KEY_PATH, decoded);
    console.log('✅ GSC credentials file created.');
  } catch (err) {
    console.error('❌ Failed to decode and write GSC credentials:', err);
  }
}

async function getSearchConsoleQueries(startDate, endDate) {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: TEMP_KEY_PATH,
      scopes: SCOPES,
    });

    const authClient = await auth.getClient();
    const webmasters = google.webmasters({ version: 'v3', auth: authClient });

    const response = await webmasters.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit: 100,
      },
    });

    return response.data.rows || [];
  } catch (error) {
    console.error('❌ Error fetching GSC queries:', error.message);
    throw error;
  }
}

module.exports = { getSearchConsoleQueries };
