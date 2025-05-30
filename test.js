const XLSX = require('xlsx');
const path = require('path');
const os = require('os');

// Step 1: Define file path from Downloads folder
const downloadsPath = path.join(os.homedir(), 'Downloads');
const filePath = path.join(downloadsPath, 'Tournament Slug.xlsx');

// Step 2: Read Excel file
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// Step 3: Convert to JSON
const data = XLSX.utils.sheet_to_json(sheet);

// Step 4: Get slug from tournament URL
function getSlug(tournamentUrl) {
  const match = data.find(row => row.Tournament?.trim().toLowerCase() === tournamentUrl.trim().toLowerCase());
  return match ? match.Slug?.trim() : 'Slug not found';
}

// Step 5: Optional head-to-head comparison
function getHeadToHead(url1, url2) {
  const slug1 = getSlug(url1);
  const slug2 = getSlug(url2);
  return {
    tournament1: slug1,
    tournament2: slug2,
    headToHead: `${slug1} vs ${slug2}`
  };
}

// 🔄 Example usage
const t1 = 'https://cricketaddictor.com/indian-premier-league-ipl/';
const t2 = 'https://cricketaddictor.com/pakistan-super-league/';

console.log("Slug for T1:", getSlug(t1));
console.log("Slug for T2:", getSlug(t2));
console.log("Head to Head:", getHeadToHead(t1, t2));
