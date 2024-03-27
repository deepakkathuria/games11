// saving player data  so that we can calculate dream 11 from this table using match id


const axios = require('axios');
const { PlayerPerformance } = require('../models/playerPerformance'); // Adjust the path according to your project structure

const getFormattedDate = (date) => date.toISOString().split('T')[0];

const fetchMatchesAndSave = async () => {
  let hasMorePages = true;
  let currentPage = 1;
  
  try {
    while (hasMorePages) {
      const matchResponse = await axios.get(`https://rest.entitysport.com/v2/matches?date=2024-01-01_2024-03-26&paged=${currentPage}&per_page=80&token=73d62591af4b3ccb51986ff5f8af5676`);
      const matches = matchResponse.data.response.items;
      const totalPages = matchResponse.data.response.total_pages;
      const matchIds = matches.map(match => match.match_id);

      for (const match of matchIds) {
        const matchDetailResponse = await axios.get(`https://rest.entitysport.com/v2/matches/${match}/newpoint2?token=73d62591af4b3ccb51986ff5f8af5676`);
        const { teama, teamb } = matchDetailResponse.data.response.points;

        const savePlayerPerformance = async (team, teamName) => {
          if (team && Array.isArray(team.playing11)) {
            for (const player of team.playing11) {
              await PlayerPerformance.upsert({
                match_id: match,
                pid: player.pid,
                rating: player.rating,
                points: player.point,
                name: player.name,
                role: player.role,
                title: matches.title,
                teamname: teamName
              });
            }
          } else {
            console.error('Error: playing11 is not iterable or does not exist for team', team);
          }
        };

        await savePlayerPerformance(teama, matchDetailResponse.data.response.teama.name);
        await savePlayerPerformance(teamb, matchDetailResponse.data.response.teamb.name);
      }
      
      console.log(`Page ${currentPage} processed.`);
      currentPage += 1;
      hasMorePages = currentPage <= totalPages;
    }

    console.log('All match details fetched and saved.');
  } catch (error) {
    console.error('Error fetching and saving match details:', error);
  }
};

module.exports = { fetchMatchesAndSave };
