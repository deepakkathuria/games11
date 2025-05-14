// // const { google } = require('googleapis');
// // const key = require('./gsc-private-key.json'); // Your downloaded JSON file

// // const VIEW_ID = 'https://searchconsole.googleapis.com/websites/https://cricketaddictor.com/; // Replace with your verified GSC property

// // const jwt = new google.auth.JWT(
// //   key.client_email,
// //   null,
// //   key.private_key,
// //   ['https://www.googleapis.com/auth/webmasters.readonly']
// // );

// // const searchconsole = google.searchconsole({ version: 'v1', auth: jwt });

// // async function getSearchConsoleQueries(startDate, endDate) {
// //   await jwt.authorize();

// //   const response = await searchconsole.searchanalytics.query({
// //     siteUrl: 'https://cricketaddictor.com/', // Replace with your actual domain
// //     requestBody: {
// //       startDate,
// //       endDate,
// //       dimensions: ['query'],
// //       rowLimit: 5000
// //     }
// //   });

// //   return response.data.rows || [];
// // }

// // function extractContentGaps(rows) {
// //   return rows
// //     .filter(row => {
// //       const ctr = row.clicks / (row.impressions || 1);
// //       return (
// //         row.impressions > 100 &&
// //         (row.clicks === 0 || ctr < 0.01) &&
// //         row.position > 20
// //       );
// //     })
// //     .map(row => ({
// //       keyword: row.keys[0],
// //       clicks: row.clicks,
// //       impressions: row.impressions,
// //       ctr: ((row.clicks / (row.impressions || 1)) * 100).toFixed(2),
// //       position: row.position.toFixed(1),
// //       gap_reason:
// //         row.clicks === 0
// //           ? 'No Clicks'
// //           : row.position > 30
// //           ? 'Very Low Ranking'
// //           : 'Low CTR'
// //     }));
// // }

// // module.exports = { getSearchConsoleQueries, extractContentGaps };






// // ✅ gscService.js
// const { google } = require('googleapis');
// const path = require('path');

// const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];
// const KEY_FILE = path.join(__dirname, 'gsc_key.json'); // Ensure your JSON is here


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




const { google } = require('googleapis');
const path = require('path');
const KEY_FILE = path.join(__dirname, 'gsc_key.json');

const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];
const SITE_URL = 'https://cricketaddictor.com/';

async function getSearchConsoleQueries(startDate, endDate) {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
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
