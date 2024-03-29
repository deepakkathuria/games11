const axios = require('axios');
const { Sequelize } = require('sequelize'); // Import Sequelize
const { Scorecard_2023 } = require('./models/scorecard_IPL2023');



















async function fetchAllMatchIds(baseUrl, token) {
    let matchIds = [];
    let currentPage = 1;
    let totalPages = 1;
  
    while (currentPage <= totalPages) {
      const response = await axios.get(`${baseUrl}/competitions/127579/matches/?token=${token}&page=${currentPage}`);
      matchIds = matchIds.concat(response.data.response.items.map(item => item.match_id));
      totalPages = response.data.response.total_pages;
      currentPage++;
    }
    return matchIds;
  }
  
  // Insert match data into the database
  async function insertMatchData(matchData) {
    const matchId = matchData.match_id;
    console.log(matchId,"mmmmmmmmmmmmmaaaaaaaaaaaaaaaaaaaaatttttttttttccccccccccchhhhhhhh")

    // Loop through each innings to insert batting, bowling, and fielding performances
    matchData?.innings.forEach(async (inning) => {
        const battingTeamId = inning.batting_team_id;
        const fieldingTeamId = inning.fielding_team_id;

        // Insert batsmen performances
        inning.batsmen.forEach(async (batsman) => {
            await Scorecard_2023.create({
                matchId: matchId,
                playerId: batsman.batsman_id,
                teamId: battingTeamId,
                runs: batsman.runs,
                ballsFaced: batsman.balls_faced,
                fours: batsman.fours,
                sixes: batsman.sixes,
                strikeRate: batsman.strike_rate,
                // Bowling and fielding stats initialized to zero or null where appropriate
                oversBowled: null,
                maidensBowled: null,
                runsConceded: null,
                wicketsTaken: null,
                noBalls: null,
                wides: null,
                economyRate: null,
                catches: 0,
                runOuts: 0,
            });
        });

        // Insert bowlers performances
        inning.bowlers.forEach(async (bowler) => {
            const existingRecord = await Scorecard_2023.findOne({ where: { matchId: matchId, playerId: bowler.bowler_id } });

            if (existingRecord) {
                // Update existing record with bowling data
                await existingRecord.update({
                    oversBowled: bowler.overs,
                    maidensBowled: bowler.maidens,
                    runsConceded: bowler.runs_conceded,
                    wicketsTaken: bowler.wickets,
                    noBalls: bowler.noballs,
                    wides: bowler.wides,
                    economyRate: bowler.econ,
                });
            } else {
                // Create a new record for bowlers who did not bat
                await Scorecard_2023.create({
                    matchId: matchId,
                    playerId: bowler.bowler_id,
                    teamId: fieldingTeamId, // The bowler would be part of the fielding team
                    // Batting stats null or zero
                    runs: null,
                    ballsFaced: null,
                    fours: null,
                    sixes: null,
                    strikeRate: null,
                    // Bowling stats
                    oversBowled: bowler.overs,
                    maidensBowled: bowler.maidens,
                    runsConceded: bowler.runs_conceded,
                    wicketsTaken: bowler.wickets,
                    noBalls: bowler.noballs,
                    wides: bowler.wides,
                    economyRate: bowler.econ,
                    // Fielding stats initialized
                    catches: 0,
                    runOuts: 0,
                });
            }
        });

        // Insert fielders performances
        inning.fielder.forEach(async (fielder) => {
            const existingRecord = await Scorecard_2023.findOne({ where: { matchId: matchId, playerId: fielder.fielder_id } });

            if (existingRecord) {
                // Update existing record with fielding data
                await existingRecord.update({
                    catches: fielder.catches,
                    runOuts: fielder.runout_direct_hit
                });
            } else {
                // Create a new record for fielders who did not bat or bowl
                await Scorecard_2023.create({
                    matchId: matchId,
                    playerId: fielder.fielder_id,
                    teamId: fieldingTeamId, // Assuming the fielding team ID is available
                    // Batting and Bowling stats null or zero
                    runs: null,
                    ballsFaced: null,
                    fours: null,
                    sixes: null,
                    strikeRate: null,
                    oversBowled: null,
                    maidensBowled: null,
                    runsConceded: null,
                    wicketsTaken: null,
                    noBalls: null,
                    wides: null,
                    economyRate: null,
                    // Fielding stats
                    catches: fielder.catches,
                    runOuts: fielder.runout_direct_hit
                });
            }
        });
    });
}



// Example usage:
const matchData = { /* your JSON data here */ };
insertMatchData(matchData).then(() => {
    console.log('Data inserted successfully.');
}).catch((error) => {
    console.error('Error inserting data:', error);
});

  
  // Fetch and process the scorecard for each match
  async function fetchAndProcessMatchDetails(matchId, scorecardBaseUrl, token) {
    const url = `${scorecardBaseUrl}/matches/${matchId}/scorecard?token=${token}`;
    try {
      const response = await axios.get(url);
      const matchData = response.data.response;
      await insertMatchData(matchData);
      console.log(`Processed match ${matchId}`);
    } catch (error) {
      console.error(`Error fetching scorecard for match ID ${matchId}:`, error);
    }
  }
  
  // Main function to orchestrate the fetching and processing of all matches
  async function processAllMatches(baseUrl, scorecardBaseUrl, token) {
    try {
      const matchIds = await fetchAllMatchIds(baseUrl, token);
      console.log(matchIds.length,"mabdjgsahfahgkhdgakgkhsghkdgak")
      for (const matchId of matchIds) {
        await fetchAndProcessMatchDetails(matchId, scorecardBaseUrl, token);
      }
    } catch (error) {
      console.error('An error occurred:', error);
    }
  }
  
  // Configuration
  const BASE_URL = 'https://rest.entitysport.com/v2';
  const SCORECARD_BASE_URL = 'https://rest.entitysport.com/v2';
  const TOKEN = '73d62591af4b3ccb51986ff5f8af5676'; // Replace with your actual token
  
  // Start the process
  processAllMatches(BASE_URL, SCORECARD_BASE_URL, TOKEN);
  