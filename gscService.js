// const { google } = require('googleapis');
// const path = require('path');
// const fs = require('fs');

// // 📍 Path to your downloaded GSC service key file
// const KEY_FILE = path.join(__dirname, 'gsc_key.json'); // 🔁 Make sure this file exists

// const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];

// // ✅ Match this to your GSC property exactly:
// // If it's a domain property: use 'sc-domain:cricketaddictor.com'
// // If it's a URL-prefix property: use 'https://cricketaddictor.com/'
// const SITE_URL = 'https://cricketaddictor.com/';

// async function getSearchConsoleQueries(startDate, endDate) {
//   try {
//     const auth = new google.auth.GoogleAuth({
//       keyFile: KEY_FILE,
//       scopes: SCOPES,
//     });

//     const authClient = await auth.getClient();
//     const webmasters = google.webmasters({ version: 'v3', auth: authClient });

//     const response = await webmasters.searchanalytics.query({
//       siteUrl: SITE_URL,
//       requestBody: {
//         startDate,
//         endDate,
//         dimensions: ['query'],
//         rowLimit: 100,
//       },
//     });

//     return response.data.rows || [];
//   } catch (error) {
//     console.error('❌ Error fetching GSC queries:', error.message);
//     throw error;
//   }
// }

// module.exports = { getSearchConsoleQueries };



const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const TEMP_KEY_PATH = path.join(__dirname, 'gsc_key_temp.json');
const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];
const SITE_URL = 'https://cricketaddictor.com/';

if (process.env.GSC_CREDENTIALS_BASE64 && !fs.existsSync(TEMP_KEY_PATH)) {
  try {
    console.log('📦 Writing GSC key file...');
    const decoded = Buffer.from(process.env.GSC_CREDENTIALS_BASE64, 'base64').toString('utf-8');
    fs.writeFileSync(TEMP_KEY_PATH, decoded);
  } catch (err) {
    console.error('❌ Could not write GSC key:', err);
  }
}

async function getSearchConsoleQueries(startDate, endDate) {
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
}

module.exports = { getSearchConsoleQueries };
