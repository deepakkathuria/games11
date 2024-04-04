const axios = require("axios");
const { Sequelize } = require("sequelize"); // Import Sequelize
const { Scorecard_2011 } = require("./models/scorecard_IPL2021.js");

async function fetchAllMatchIds(baseUrl, token) {
  let matchIds = [];
  let currentPage = 1;
  let totalPages = 1;
  do {
    try {
      const response = await axios.get(
        `${baseUrl}/competitions/112657/matches/`,
        {
          params: {
            token: token,
            per_page: 80,
            page: currentPage,
          },
        }
      );
      matchIds = matchIds.concat(
        response.data.response.items.map((item) => item.match_id)
      );
      totalPages = response.data.response.total_pages;
      currentPage++;
    } catch (error) {
      console.error("Error fetching match IDs:", error);
      break; // Exit loop in case of error
    }
  } while (currentPage <= totalPages);
  return matchIds;
}

async function insertMatchData(matchData) {
  const matchId = matchData.match_id;
  const teamIds = matchData.innings.reduce((acc, inning) => {
    acc[inning.batting_team_id] = inning.fielding_team_id;
    acc[inning.fielding_team_id] = inning.batting_team_id;
    return acc;
  }, {});

  // Unified player data handling
  const handlePlayerData = async (playerId, teamId, data) => {
    const existingRecord = await Scorecard_2023.findOne({
      where: { matchId: matchId, playerId: playerId },
    });

    const oppositionTeamId = teamIds[teamId]; // Determine opposition team ID

    if (existingRecord) {
      // Update existing record
      await existingRecord.update({
        ...data,
        oppositionTeamId: oppositionTeamId, // Update with opposition team ID
      });
    } else {
      // Create a new record
      await Scorecard_2023.create({
        matchId: matchId,
        playerId: playerId,
        teamId: teamId,
        oppositionTeamId: oppositionTeamId, // Update with opposition team ID

        ...data,
      });
    }
  };

  const prepareIntegerValue = (value) => {
    // Convert to integer if it's a numeric string, otherwise return null
    return value !== "" && !isNaN(value) ? parseInt(value, 10) : null;
  };

 

  // Process innings
  for (const inning of matchData?.innings) {
    const battingTeamId = inning.batting_team_id;
    const fieldingTeamId = inning.fielding_team_id;

    // Process batsmen
    for (const batsman of inning.batsmen) {
        const firstFielderId = prepareIntegerValue(batsman.first_fielder_id);

        const secondFielderId = prepareIntegerValue(batsman.second_fielder_id);
        const thirdFielderId = prepareIntegerValue(batsman.third_fielder_id);
      await handlePlayerData(batsman.batsman_id, battingTeamId, {
        runs: batsman?.runs,
        ballsFaced: batsman?.balls_faced,
        fours: batsman?.fours,
        sixes: batsman?.sixes,
        strikeRate: batsman?.strike_rate,
        run0: batsman.run0, // Assuming 0 until data specifies otherwise
        run1: batsman.run1, // Assuming 0, adjust as per actual data
        run2: batsman.run2, // Assuming 0, adjust as per actual data
        run3: batsman.run3, // Assuming 0, adjust as per actual data
        run5: batsman.run5, // Assuming 0, adjust as per actual data
        howOut: batsman.how_out, // Assuming null, set this based on actual dismissal data
        dismissal: batsman.dismissal, // Assuming null, this should be set if detailed dismissal info is available
        bowlerId: batsman.bowler_id,
        firstFielderId: firstFielderId,
        secondFielderId: secondFielderId,
        thirdFielderId: thirdFielderId,
        role: batsman.bat,

        // For batsmen, bowling stats will be set to null or 0
        // Initialize detailed run distribution and other stats as null or 0
        oversBowled: null,
        maidensBowled: null,
        runsConceded: null,
        wicketsTaken: null,
        noBalls: null,
        wides: null,
        economyRate: null,
        bowledCount: 0,
        lbwCount: 0,
        // Fielding stats initialized, to be potentially updated
        catches: 0,
        runOuts: 0,
        runOutThrower: 0, // Assuming 0, adjust based on actual data
        runOutCatcher: 0, // Assuming 0, adjust based on actual data
        runOutDirectHit: 0, // Assuming 0, adjust based on actual data
        stumping: 0,
        isSubstitute: null,

        // Default values for boolean flags
        batting: true, // Since this loop processes batsmen
        // bowling: null, // Batsman usually do not bowl, adjust if your data says otherwise
        // Assuming null for position and role, adjust as per actual data
        // position: null,
        // Assuming bowlerId and fielderIds as null, adjust as per actual data
      });
    }

    // Process bowlers
    for (const bowler of inning.bowlers) {
      await handlePlayerData(bowler.bowler_id, fieldingTeamId, {
        // Bowler stats
        oversBowled: bowler.overs,
        maidensBowled: bowler.maidens,
        runsConceded: bowler.runs_conceded,
        wicketsTaken: bowler.wickets,
        noBalls: bowler.noballs,
        wides: bowler.wides,
        economyRate: bowler.econ,
        bowledcount: bowler.bowledcount,
        lbwcount: bowler.lbwcount,
        run0: bowler.run0,
        // Initialize batting and fieldin,g stats as null or 0
        runs: null,
        ballsFaced: null,
        fours: null,
        sixes: null,
        strikeRate: null,
        catches: 0, // Initialized, to be potentially updated
        runOuts: 0, // Initialized, to be potentially updated
        isSubstitute: null,
      });
    }

    // Process fielders
    for (const fielder of inning.fielder) {
      await handlePlayerData(fielder.fielder_id, fieldingTeamId, {
        // Only fielding stats might need to be updated
        catches: fielder.catches,
        runOuts: fielder.runout_direct_hit,
        isSubstitute: fielder.isSubstitute,
        // All other stats remain as previously set, or null if not set
      });
    }
  }
}

// Example usage:
const matchData = {
  /* your JSON data here */
};
insertMatchData(matchData)
  .then(() => {
    console.log("Data inserted successfully.");
  })
  .catch((error) => {
    console.error("Error inserting data:", error);
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
    // const matchIds = await fetchAllMatchIds(baseUrl, token);

    const matchIds = [40801]
    for (const matchId of matchIds) {
      await fetchAndProcessMatchDetails(matchId, scorecardBaseUrl, token);
    }
    console.log("All data inserted fully."); // Confirmation message after all operations
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

// Configuration
const BASE_URL = "https://rest.entitysport.com/v2";
const SCORECARD_BASE_URL = "https://rest.entitysport.com/v2";
const TOKEN = "73d62591af4b3ccb51986ff5f8af5676"; // Replace with your actual token

// Start the process
processAllMatches(BASE_URL, SCORECARD_BASE_URL, TOKEN);
