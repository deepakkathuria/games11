const axios = require('axios');
const { PlayerPerformance } = require('../models/playerPerformance'); // Adjust the path according to your project structure

const getFormattedDate = (date) => date.toISOString().split('T')[0];

const fetchMatchesAndSave = async () => {
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - 1); // Set to previous day

  const formattedStartDate = getFormattedDate(startDate);
  const formattedEndDate = getFormattedDate(endDate);

  try {
    const matchResponse = await axios.get(`https://rest.entitysport.com/v2/matches?date=2024-03-01_2024-03-18&paged=1&per_page=80&token=73d62591af4b3ccb51986ff5f8af5676`);
    const matches = matchResponse.data.response.items;
    // const matchIds = matches.map(match => match.match_id);
    // const matchIds = [73795,73796,74371,64456]
    const matchIds = [64458]

    for (const match of matchIds) {
      const matchDetailResponse = await axios.get(`https://rest.entitysport.com/v2/matches/${match}/newpoint2?token=73d62591af4b3ccb51986ff5f8af5676`);
      const { teama, teamb } = matchDetailResponse.data.response.points;
      console.log(matchDetailResponse.data.response.teama.name,"vhvsahkvdkavskdvsvdk")
      

      const savePlayerPerformance = async (team,b) => {
        // Check if playing11 exists and is an array before proceeding
        if (team && Array.isArray(team.playing11)) {
          for (const player of team.playing11) {
            await PlayerPerformance.upsert({
              match_id: match,
              pid: player.pid,
              rating: player.rating,
              points: player.point,
              name: player.name,
              role:player.role,
              title: matches.title,
              teamname: b
            });
          }
        } else {
          // Log an error or handle the case where playing11 is not as expected
          console.error('Error: playing11 is not iterable or does not exist for team', team);
        }
      };

      await savePlayerPerformance(teama,matchDetailResponse.data.response.teama.name);
      await savePlayerPerformance(teamb,matchDetailResponse.data.response.teamb.name);
    }

    console.log('All match details fetched and saved.');
  } catch (error) {
    console.error('Error fetching and saving match details:', error);
  }
};

module.exports = { fetchMatchesAndSave };
