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
  fetchMatchesAndCalculateDreamTeams,
} = require("./controller/dreamTeamController"); // Adjust the path

// Import your models here to ensure they are registered
require("./models/playerPerformance"); // Adjust the path as necessary
require("./models/dreamTeam");
require("./models/playerPerformance");

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

app.get("/api/fetch-and-calculate-dream-teams", async (req, res) => {
  console.log("API /api/fetch-and-calculate-dream-teams hit"); // Add this line
  try {
    await fetchMatchesAndCalculateDreamTeams();
    res.status(200).send("Dream teams calculated and saved for all matches.");
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).send("Error fetching matches or calculating dream teams.");
  }
});

// -------------------------------------calculate top plares on this venue-------------------------------------
const API_KEY = "73d62591af4b3ccb51986ff5f8af5676";
const BASE_URL = "https://rest.entitysport.com";

app.get("/api/player-stats", async (req, res) => {
  try {
    // Fetch the initial match details
    const matchId = req.query.matchId;
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
          "Invalid match data format: playing11 is not an array or is undefined"
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
    const { teamId1, teamId2,seriesId } = req.query;
    if (!teamId1 || !teamId2) {
      return res
        .status(400)
        .json({
          message: "Both teamId1 and teamId2 query parameters are required",
        });
    }
    

    const teams = await fetchTeams(seriesId);
    console.log(teams,"fdsjafj")
    const matches = await fetchMatches(seriesId);

    const filteredMatches = matches.filter(match => {
      const isMatch = (match.teama.team_id == teamId1 && match.teamb.team_id == teamId2) || 
                      (match.teama.team_id == teamId2 && match.teamb.team_id == teamId1);
      if (isMatch) {
          console.log(`Match found: ${match.match_id}, Teams: ${match.teama.team_id} vs ${match.teamb.team_id}`);
      }
      return isMatch;
  })
  .map(match => ({
      match_id: match.match_id,
      title: match.title,
      result: match.result,
      winner: match.winning_team_id ? teams.get(parseInt(match.winning_team_id)) : 'No winner or draw',
  }));
    res.json({ matches: filteredMatches });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching data" });
  }
});





// -----------------------dream team match id comes from frontend will show playing 11 sing entitiy-------------------------------------------------------------


app.get('/fetchDreamTeam', async (req, res) => {
  const { matchId } = req.query; // Extract matchId from query parameters

  try {
    const matchDetailUrl = `https://rest.entitysport.com/v2/matches/${matchId}/newpoint2?token=73d62591af4b3ccb51986ff5f8af5676`;
    const matchDetailResponse = await axios.get(matchDetailUrl);
    const matchDetails = matchDetailResponse.data.response;

    const { teama, teamb } = matchDetails.points;
    const dreamTeamPlayers = [];

    // Function to extract player details
    const extractPlayerDetails = (team, teamName) => {
      if (team && Array.isArray(team.playing11)) {
        for (const player of team.playing11) {
          dreamTeamPlayers.push({
            name: player.name,
            rating: player.rating,
            points: player.point,
            role: player.role,
            teamName: teamName
          });
        }
      }
    };

    extractPlayerDetails(teama, matchDetails.teama.name);
    extractPlayerDetails(teamb, matchDetails.teamb.name);

    // Sort players and designate captain and vice-captain
    dreamTeamPlayers.sort((a, b) => b.points - a.points);
    if (dreamTeamPlayers.length > 0) dreamTeamPlayers[0].designation = 'Captain';
    if (dreamTeamPlayers.length > 1) dreamTeamPlayers[1].designation = 'Vice-Captain';

    res.json({ success: true, dreamTeam: dreamTeamPlayers });
  } catch (error) {
    console.error('Error fetching dream team details:', error);
    res.status(500).json({ success: false, message: 'Error fetching dream team details' });
  }
});