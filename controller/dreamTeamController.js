// utilities/calculateDreamTeam.js
const axios = require('axios');
const { PlayerPerformance } = require('../models/playerPerformance');
const {PlayerAppearances} = require('../models/playerAppearance');


const calculateAndSaveDreamTeam = async (matchId) => {
    const topPlayers = await PlayerPerformance.findAll({
      where: { match_id: matchId },
      order: [['points', 'DESC']],
      limit: 11
    });
  
    for (const player of topPlayers) {
      const [appearance, created] = await PlayerAppearances.findOrCreate({
        where: { pid: player.pid },
        defaults: { name: player.name, appearances: 1 }
      });
  
      if (!created) {
        appearance.appearances += 1;
        await appearance.save();
      }
    }
  };

const fetchMatchesAndCalculateDreamTeams = async () => {
    try {
      // Adjust date range and token as needed
      const matchResponse = await axios.get(`https://rest.entitysport.com/v2/matches?date=2024-03-01_2024-03-18&paged=1&per_page=80&token=73d62591af4b3ccb51986ff5f8af5676`);
      const matches = matchResponse.data.response.items;
      
      // Loop through each match and calculate the dream team
      for (const match of matches) {
        await calculateAndSaveDreamTeam(match.match_id);
      }
  
      console.log('Dream teams calculated and saved for all matches.');
    } catch (error) {
      console.error('Error fetching matches or calculating dream teams:', error);
    }
  };







//   fetchMatchesAndCalculateDreamTeams();








module.exports = {fetchMatchesAndCalculateDreamTeams};
