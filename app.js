require("dotenv").config();
const express = require("express");
const axios = require("axios");
const sequelize = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const cors = require("cors");
const {
  fetchMatchesAndSave,
} = require("./controller/playerPerformanceController"); // Adjust the path if necessary
const {
  calculateDreamTeamsForAllMatches,
  CalculatePlayerDreamTeamAppearance,
} = require("./controller/dreamTeamController");

const {
  getPlayerStatsAgainstOpposition,
} = require("./controller/teamplayeriplstatsController");

// Import your models here to ensure they are registered
require("./models/playerPerformance"); // Adjust the path as necessary
require("./models/dreamTeam");
// require("./models/scorecard_IPL2023")

const app = express();
app.use(express.json());
app.use(cors());

app.use(authRoutes);

const PORT = process.env.PORT || 3000;
sequelize

  .sync({ force: false })
  .then(() => {
    console.log("Database & tables created!");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((error) => {
    console.error("Failed to synchronize database:", error);
  });

//  ENTITY MANIPULATION AND TAKING ENTITY DATA FROM TWO THREEE API AND SHOW IT ACCODINGLY APIS

// -------------------------------------calculate top player on this venue-------------------------------------
const API_KEY = "73d62591af4b3ccb51986ff5f8af5676";
const BASE_URL = "https://rest.entitysport.com";

app.get("/api/player-stats", async (req, res) => {
  try {
    // Fetch the initial match details
    const matchId = req.query.matchId;
    console.log(matchId);
    const matchResponse = await axios.get(
      `${BASE_URL}/v2/matches/${matchId}/newpoint2?token=${API_KEY}`
    );
    const matchData = matchResponse.data.response;
    const venueId = matchData.venue.venue_id;

    // console.log(matchData.match_id,venueId,"vsavdhavskhdvsavdvas")
    // console.log(JSON.stringify(matchData, null, 2));

    if (
      !Array.isArray(matchData.points.teama.playing11) ||
      !Array.isArray(matchData.points.teamb.playing11)
    ) {
      return res
        .status(400)
        .send(
          []
        );
    }

    const playersIds = [
      ...matchData.points.teama.playing11,
      ...matchData.points.teamb.playing11,
    ].map((player) => player.pid);

    // Function to fetch last 10 matches for a player
    async function fetchLast10Matches(playerId) {
      try {
        const response = await axios.get(
          `${BASE_URL}/v4/players/${playerId}/advancestats/?token=${API_KEY}`,
          {
            headers: {
              Accept: "application/json",
              // Include any other headers required by the API
            },
          }
        );

        // Assuming both batting and bowling arrays contain match_id and you need IDs from both
        const battingMatchIds =
          response.data.response.last10_matches.batting.map(
            (match) => match.match_id
          );
        const bowlingMatchIds =
          response.data.response.last10_matches.bowling.map(
            (match) => match.match_id
          );

        // Combine both arrays, remove duplicates, and take only the last 10 unique match IDs
        const allMatchIds = [
          ...new Set([...battingMatchIds, ...bowlingMatchIds]),
        ].slice(0, 10);

        console.log(
          `Last 10 match IDs for player ID ${playerId}:`,
          allMatchIds
        );
        return allMatchIds;
      } catch (error) {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error(
            `Error fetching last 10 matches for player ${playerId}:`,
            error.response.data
          );
        } else if (error.request) {
          // The request was made but no response was received
          console.error(
            `No response received for player ${playerId}:`,
            error.request
          );
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error("Error:", error.message);
        }

        // Return an empty array or appropriate error response
        return [];
      }
    }

    // Function to fetch player details by player ID
    async function fetchPlayerDetails(playerId) {
      const playerDetailsUrl = `https://rest.entitysport.com/v2/players/${playerId}?token=ec471071441bb2ac538a0ff901abd249`;
      try {
        const response = await axios.get(playerDetailsUrl);
        return {
          playerName: response.data.response.player.first_name,
          teamName: response.data.response.player.nationality, // Adjust according to the actual response structure
        };
      } catch (error) {
        console.error(
          `Error fetching details for player ${playerId}:`,
          error.message
        );
        return { playerName: "", teamName: "" };
      }
    }

    async function fetchMatchDetailsAndCalculatePoints(
      playerId,
      matchIds,
      venueId
    ) {
      let totalPoints = 0;
      let matchesAtVenue = 0;
      let playerName = "";
      let teamName = "";

      for (let matchId of matchIds) {
        try {
          const response = await axios.get(
            `${BASE_URL}/v2/matches/${matchId}/newpoint2?token=${API_KEY}`
          );
          if (response.data.response.venue.venue_id === venueId) {
            // Attempt to find player in teamA's playing11
            const playerA = response.data.response.points.teama.playing11.find(
              (p) => p.pid === playerId
            );
            console.log(playerA, "padata");
            // Attempt to find player in teamB's playing11
            const playerB = response.data.response.points.teamb.playing11.find(
              (p) => p.pid === playerId
            );
            console.log(playerB, "pbdata");

            // Extract player points and team information
            let points = playerA?.point || playerB?.point;
            if (points) {
              totalPoints += parseInt(points, 10);
              matchesAtVenue++;
              playerName = playerA?.name || playerB?.name; // Assuming the 'name' field exists
              teamName = playerA
                ? response.data.response.teama.name
                : response.data.response.teamb.name; // Assuming 'name' field exists in team info
            }
          }
        } catch (error) {
          console.error(
            `Error fetching details for match ${matchId}:`,
            error.message
          );
        }
      }

      const averagePoints =
        matchesAtVenue > 0 ? totalPoints / matchesAtVenue : 0;
      return { playerName, teamName, averagePoints, matchesAtVenue };
    }
    //  Calculate average points for each player
    let playerStats = [];
    for (let playerId of playersIds) {
      const last10Matches = await fetchLast10Matches(playerId);
      const stats = await fetchMatchDetailsAndCalculatePoints(
        playerId,
        last10Matches,
        venueId
      );
      const { playerName, teamName } = await fetchPlayerDetails(playerId);

      playerStats.push({
        playerId,
        playerName,
        teamName,
        averagePoints: stats.averagePoints,
        matchesAtVenue: stats.matchesAtVenue,
      });
    }

    res.json(playerStats);
  } catch (error) {
    console.error("Error fetching player stats:", error);
    res.status(500).send("Internal Server Error");
  }
});

// TEAM HEAD TO HEAD WE ARE CALCULATING FROM ENTITY FIRST WE ARE FETCHING ALL MATCHIDS USING SERIES ID THEN CALCULATING TEAM STATS
// -------------------------tema head to head---------------------------------------------------------------

async function fetchTeams(seriesId) {
  const response = await axios.get(
    `https://rest.entitysport.com/v2/competitions/${seriesId}/teams/?token=73d62591af4b3ccb51986ff5f8af5676`
  );
  const teams = response.data.response.teams;
  const teamsMap = new Map(teams.map((team) => [team.tid, team.title]));
  return teamsMap;
}

async function fetchMatches(seriesId) {
  let allMatches = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await axios.get(
      `https://rest.entitysport.com/v2/competitions/${seriesId}/matches/?token=73d62591af4b3ccb51986ff5f8af5676&per_page=50&paged=${page}`
    );
    allMatches = allMatches.concat(response.data.response.items);

    if (response.data.response.items.length < 50) {
      hasMore = false; // If less than per_page items are returned, we're on the last page
    } else {
      page++; // Prepare for the next iteration/page
    }
  }

  return allMatches;
}

// Endpoint to Get Matches Between Two Teams
app.get("/api/matches", async (req, res) => {
  try {
    const { teamId1, teamId2, seriesId } = req.query;
    if (!teamId1 || !teamId2) {
      return res.status(400).json({
        message: "Both teamId1 and teamId2 query parameters are required",
      });
    }

    const teams = await fetchTeams(seriesId);
    console.log(teams, "fdsjafj");
    const matches = await fetchMatches(seriesId);

    const filteredMatches = matches
      .filter((match) => {
        const isMatch =
          (match.teama.team_id == teamId1 && match.teamb.team_id == teamId2) ||
          (match.teama.team_id == teamId2 && match.teamb.team_id == teamId1);
        if (isMatch) {
          console.log(
            `Match found: ${match.match_id}, Teams: ${match.teama.team_id} vs ${match.teamb.team_id}`
          );
        }
        return isMatch;
      })
      .map((match) => ({
        match_id: match.match_id,
        title: match.title,
        result: match.result,
        winner: match.winning_team_id
          ? teams.get(parseInt(match.winning_team_id))
          : "No winner or draw",
      }));
    res.json({ matches: filteredMatches });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching data" });
  }
});

// DREAM TEAM PAGE GAURAV GIVING MATCH ID AND THEN WE WILL BE CALCULATING DREAM 11 ACCOORDING TO RATING OF PLAYER USING ENTITY
// -----------------------dream team match id comes from frontend will show playing 11 entitiy-------------------------------------------------------------

app.get("/fetchDreamTeam", async (req, res) => {
  const { matchId } = req.query; // Extract matchId from query parameters

  try {
    const matchDetailUrl = `https://rest.entitysport.com/v2/matches/${matchId}/newpoint2?token=73d62591af4b3ccb51986ff5f8af5676`;
    const matchDetailResponse = await axios.get(matchDetailUrl);
    const matchDetails = matchDetailResponse.data.response;

    const { teama, teamb } = matchDetails.points;
    const allPlayers = [];

    // Function to extract player details
    const extractPlayerDetails = (team, teamName) => {
      if (team && Array.isArray(team.playing11)) {
        for (const player of team.playing11) {
          allPlayers.push({
            pid:player.pid,
            name: player.name,
            rating: player.rating,
            points: player.point,
            role: player.role,
            teamName: teamName,
          });
        }
      }
    };

    // Extract player details for both teams
    extractPlayerDetails(teama, matchDetails.teama.name);
    extractPlayerDetails(teamb, matchDetails.teamb.name);

    // Sort players based on points
    allPlayers.sort((a, b) => b.points - a.points);

    // Select the top 11 players
    const top11Players = allPlayers.slice(0, 11);

    // Designate captain and vice-captain for the top 11 players
    if (top11Players.length > 0) top11Players[0].designation = "Captain";
    if (top11Players.length > 1) top11Players[1].designation = "Vice-Captain";

    res.json({ success: true, dreamTeam: top11Players });
  } catch (error) {
    console.error("Error fetching dream team details:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching dream team details" });
  }
});







// app.get('/match/:matchId/last-match-stats', async (req, res) => {
//   try {
//       const matchId = req.params.matchId;
//       const playerIds = await fetchPlayerIdsFromMatch(matchId);
//       const playersLastMatchStatsPromises = playerIds.map(playerId => fetchLastMatchStats(playerId));
//       const playersLastMatchStats = await Promise.all(playersLastMatchStatsPromises);

//       console.log(playersLastMatchStats,"pstatatatatatatat")
    

//       // Filter out any null results
//       const filteredStats = playersLastMatchStats.filter(stats => stats !== null);

//       // Now fetch points for each player in their last match
//       const playerPointsPromises = filteredStats.map(playerStat =>
//           fetchPlayerPointsInMatch(playerStat.lastMatch, playerStat.playerId));
//       const playersPoints = await Promise.all(playerPointsPromises);
  

//       res.json(playersPoints);
//   } catch (error) {
//       console.error('Error fetching last match stats:', error);
//       res.status(500).send('Internal Server Error');
//   }
// });

app.get('/match/:matchId/last-match-stats', async (req, res) => {
  try {
      const matchId = req.params.matchId;
      const playerIds = await fetchPlayerIdsFromMatch(matchId);

      // Ensure playerIds array is filtered to remove any undefined or null entries
      const filteredPlayerIds = playerIds.filter(playerId => playerId !== undefined);
      console.log(filteredPlayerIds);

      const playersLastMatchStatsPromises = filteredPlayerIds.map(playerId => fetchLastMatchStats(playerId));
      const playersLastMatchStats = await Promise.all(playersLastMatchStatsPromises);
      
      // Filter out any null results
      const filteredStats = playersLastMatchStats.filter(stats => stats !== null);
      console.log(filteredStats, "Filtered player stats");

      // Fetch points for each player in their last matches
      const playerPointsPromises = filteredStats.map(playerStat => {
          // Ensure we are passing an array of match IDs to fetchPlayerPointsForMatches
          if (playerStat?.lastMatchIds?.length) {
              return fetchPlayerPointsForMatches(playerStat.lastMatchIds, playerStat.playerId);
          } else {
              // In case there are no last match IDs, return a default structure
              return Promise.resolve({ playerId: playerStat.playerId, points: [] });
          }
      });
      const playersPoints = await Promise.all(playerPointsPromises);

      res.json(playersPoints);
  } catch (error) {
      console.error('Error fetching last match stats:', error);
      res.status(500).send('Internal Server Error');
  }
});



async function fetchPlayerIdsFromMatch(matchId) {
  const url = `https://rest.entitysport.com/v2/matches/${matchId}/squads?token=73d62591af4b3ccb51986ff5f8af5676`;
  const response = await axios.get(url);
  const data = response.data;

  let playerIds = [];
  if (data.status === 'ok') {
      data.response.teama.squads.forEach(player => playerIds.push(player.player_id));
      data.response.teamb.squads.forEach(player => playerIds.push(player.player_id));
  }

  return playerIds;
}

async function fetchLastMatchStats(playerId) {
  const url = `https://rest.entitysport.com/v4/players/${playerId}/advancestats/?token=token=73d62591af4b3ccb51986ff5f8af5676`;
  try {
      const response = await axios.get(url);
      const data = response.data;

      if (data.status === 'ok' && data.response.last10_matches.batting.length > 0) {
          return {
              playerId: playerId,
              lastMatch: data?.response?.last10_matches?.batting[0]?.match_id
          };
      }
  } catch (error) {
      console.error(`Error fetching stats for player ${playerId}:`, error);
      return null; // In case of an error, return null and filter these out later
  }
}
async function fetchPlayerPointsForMatches(matchIds, playerId) {
  // Check for valid inputs
  if (!matchIds || !matchIds.length || !playerId) {
      console.log(`Invalid input - Match IDs: ${matchIds}, Player ID: ${playerId}`);
      return { playerId, points: [] }; // Return early with empty points array to indicate no data
  }

  // Initialize an array to hold promises for each match ID's points fetch
  const pointsPromises = matchIds.map(matchId => fetchPointsForSingleMatch(matchId, playerId));

  try {
      // Await all promises to resolve for points from each match
      const pointsResults = await Promise.all(pointsPromises);

      // Aggregate points from each match
      const totalPoints = pointsResults.reduce((acc, result) => {
          if (result && result.points) {
              // Assuming points is an array of numbers
              acc = acc.concat(result.points);
          }
          return acc;
      }, []);

      return { playerId, points: totalPoints };
  } catch (error) {
      console.error(`Error fetching points for player ${playerId} across matches:`, error);
      return { playerId, points: [] }; // Return empty points array in case of an error
  }
}

async function fetchPointsForSingleMatch(matchId, playerId) {
  const url = `https://rest.entitysport.com/v2/matches/${matchId}/newpoint2?token=73d62591af4b3ccb51986ff5f8af5676`;

  try {
      const response = await axios.get(url);
      const matchData = response.data;

      let playerPoints = [];

      ['teama', 'teamb'].forEach(teamKey => {
          const team = matchData.response.points[teamKey];
          if (team && Array.isArray(team.playing11)) {
              team.playing11.forEach(player => {
                  if (player.pid === playerId) {
                      playerPoints = [player.point]; // Assuming point is a number
                  }
              });
          }
      });

      return { matchId, points: playerPoints }; // Return points for this match
  } catch (error) {
      console.error(`Error fetching points for player ${playerId} in match ${matchId}:`, error);
      return { matchId, points: [] }; // Return empty array in case of an error
  }
}

async function fetchPlayerIdsFromMatch(matchId) {
  const url = `https://rest.entitysport.com/v2/matches/${matchId}/squads?token=73d62591af4b3ccb51986ff5f8af5676`;
  const response = await axios.get(url);
  const data = response.data;
  
  let playerIds = [];
  if (data.status === 'ok') {
      data.response.teama.squads.forEach(player => playerIds.push(player.player_id));
      data.response.teamb.squads.forEach(player => playerIds.push(player.player_id));
  }
  
  return playerIds;
}

async function fetchLastMatchStats(playerId) {
  const url = `https://rest.entitysport.com/v4/players/${playerId}/advancestats/?token=73d62591af4b3ccb51986ff5f8af5676`;
  try {
      const response = await axios.get(url);
      const data = response.data;
      
      if (data.status === 'ok') {
          const battingStats = data.response.last10_matches.batting;
          const bowlingStats = data.response.last10_matches.bowling;
          let matchIds = [];

          // Get the last batting match ID, if available
          if (battingStats.length > 0) {
              matchIds.push(battingStats[0].match_id);
          }

          // Get the last bowling match ID, if available and different from batting match ID
          if (bowlingStats.length > 0 && !matchIds.includes(bowlingStats[0].match_id)) {
              matchIds.push(bowlingStats[0].match_id);
          }

          return {
              playerId: playerId,
              lastMatchIds: matchIds // This array can have one or two match IDs
          };
      }
  } catch (error) {
      console.error(`Error fetching stats for player ${playerId}:`, error);
      return null; // In case of an error, return null to indicate failure
  }
}



//  MY DB APIS GAMES11

app.get(
  "/mydb/dream-team/player/:playerId",
  CalculatePlayerDreamTeamAppearance
);

app.get("/player-stats-ipl", async (req, res) => {
  try {
    const { playerId, oppositionTeamId } = req.query;

    if (!playerId || !oppositionTeamId) {
      return res
        .status(400)
        .send({ message: "Player ID and Opposition Team ID are required." });
    }

    const stats = await getPlayerStatsAgainstOpposition(
      playerId,
      oppositionTeamId
    );
    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

//  --------------------------------------------MY DB INSERTION APIS-------------------------------------------------------

// insert data api which will run locally as well to insert data  IN DREAMTEAM TABLE
// ----------------------------dream team apprance  table calculate --------------------------------------

app.get("/api/calculate-dream-teams", async (req, res) => {
  try {
    await calculateDreamTeamsForAllMatches();
    return res
      .status(200)
      .json({ message: "Dream teams calculation initiated for all matches." });
  } catch (error) {
    console.error("Error calculating dream teams:", error);
    return res.status(500).json({
      message: "Failed to calculate dream teams.",
      error: error.message,
    });
  }
});

// insert data api which will run locally as well to insert data  in PLAYERPERFOMANCE NEW TABLE
// -----------------------------------------save match with player rating ---------------------------------------------------------------
app.get("/api/fetch-matches", async (req, res) => {
  try {
    await fetchMatchesAndSave();
    res.status(200).send("Match details fetched and saved successfully.");
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).send("Error fetching and saving match details.");
  }
});
