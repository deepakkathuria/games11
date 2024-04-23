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
const mysql = require("mysql2/promise");
require("dotenv").config();

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

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

app.use(express.json());

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
      return res.status(400).send([]);
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
            pid: player.pid,
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

app.get("/match/:matchId/last-match-stats", async (req, res) => {
  try {
    const matchId = req.params.matchId;
    const playerIds = await fetchPlayerIdsFromMatch(matchId);

    // Ensure playerIds array is filtered to remove any undefined or null entries
    const filteredPlayerIds = playerIds.filter(
      (playerId) => playerId !== undefined
    );
    console.log(filteredPlayerIds);

    const playersLastMatchStatsPromises = filteredPlayerIds.map((playerId) =>
      fetchLastMatchStats(playerId)
    );
    const playersLastMatchStats = await Promise.all(
      playersLastMatchStatsPromises
    );

    // Filter out any null results
    const filteredStats = playersLastMatchStats.filter(
      (stats) => stats !== null
    );
    console.log(filteredStats, "Filtered player stats");

    // Fetch points for each player in their last matches
    const playerPointsPromises = filteredStats.map((playerStat) => {
      // Ensure we are passing an array of match IDs to fetchPlayerPointsForMatches
      if (playerStat?.lastMatchIds?.length) {
        return fetchPlayerPointsForMatches(
          playerStat.lastMatchIds,
          playerStat.playerId
        );
      } else {
        // In case there are no last match IDs, return a default structure
        return Promise.resolve({ playerId: playerStat.playerId, points: [] });
      }
    });
    const playersPoints = await Promise.all(playerPointsPromises);

    res.json(playersPoints);
  } catch (error) {
    console.error("Error fetching last match stats:", error);
    res.status(500).send("Internal Server Error");
  }
});

async function fetchPlayerIdsFromMatch(matchId) {
  const url = `https://rest.entitysport.com/v2/matches/${matchId}/squads?token=73d62591af4b3ccb51986ff5f8af5676`;
  const response = await axios.get(url);
  const data = response.data;

  let playerIds = [];
  if (data.status === "ok") {
    data.response.teama.squads.forEach((player) =>
      playerIds.push(player.player_id)
    );
    data.response.teamb.squads.forEach((player) =>
      playerIds.push(player.player_id)
    );
  }

  return playerIds;
}

async function fetchLastMatchStats(playerId) {
  const url = `https://rest.entitysport.com/v4/players/${playerId}/advancestats/?token=token=73d62591af4b3ccb51986ff5f8af5676`;
  try {
    const response = await axios.get(url);
    const data = response.data;

    if (
      data.status === "ok" &&
      data.response.last10_matches.batting.length > 0
    ) {
      return {
        playerId: playerId,
        lastMatch: data?.response?.last10_matches?.batting[0]?.match_id,
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
    console.log(
      `Invalid input - Match IDs: ${matchIds}, Player ID: ${playerId}`
    );
    return { playerId, points: [] }; // Return early with empty points array to indicate no data
  }

  // Initialize an array to hold promises for each match ID's points fetch
  const pointsPromises = matchIds.map((matchId) =>
    fetchPointsForSingleMatch(matchId, playerId)
  );

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
    console.error(
      `Error fetching points for player ${playerId} across matches:`,
      error
    );
    return { playerId, points: [] }; // Return empty points array in case of an error
  }
}

async function fetchPointsForSingleMatch(matchId, playerId) {
  const url = `https://rest.entitysport.com/v2/matches/${matchId}/newpoint2?token=73d62591af4b3ccb51986ff5f8af5676`;

  try {
    const response = await axios.get(url);
    const matchData = response.data;

    let playerPoints = [];

    ["teama", "teamb"].forEach((teamKey) => {
      const team = matchData.response.points[teamKey];
      if (team && Array.isArray(team.playing11)) {
        team.playing11.forEach((player) => {
          if (player.pid === playerId) {
            playerPoints = [player.point]; // Assuming point is a number
          }
        });
      }
    });

    return { matchId, points: playerPoints }; // Return points for this match
  } catch (error) {
    console.error(
      `Error fetching points for player ${playerId} in match ${matchId}:`,
      error
    );
    return { matchId, points: [] }; // Return empty array in case of an error
  }
}

async function fetchPlayerIdsFromMatch(matchId) {
  const url = `https://rest.entitysport.com/v2/matches/${matchId}/squads?token=73d62591af4b3ccb51986ff5f8af5676`;
  const response = await axios.get(url);
  const data = response.data;

  let playerIds = [];
  if (data.status === "ok") {
    data.response.teama.squads.forEach((player) =>
      playerIds.push(player.player_id)
    );
    data.response.teamb.squads.forEach((player) =>
      playerIds.push(player.player_id)
    );
  }

  return playerIds;
}

async function fetchLastMatchStats(playerId) {
  const url = `https://rest.entitysport.com/v4/players/${playerId}/advancestats/?token=73d62591af4b3ccb51986ff5f8af5676`;
  try {
    const response = await axios.get(url);
    const data = response.data;

    if (data.status === "ok") {
      const battingStats = data.response.last10_matches.batting;
      const bowlingStats = data.response.last10_matches.bowling;
      let matchIds = [];

      // Get the last batting match ID, if available
      if (battingStats.length > 0) {
        matchIds.push(battingStats[0].match_id);
      }

      // Get the last bowling match ID, if available and different from batting match ID
      if (
        bowlingStats.length > 0 &&
        !matchIds.includes(bowlingStats[0].match_id)
      ) {
        matchIds.push(bowlingStats[0].match_id);
      }

      return {
        playerId: playerId,
        lastMatchIds: matchIds, // This array can have one or two match IDs
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

// -------------------OVERVIEW ANS SQUADS API--------------------------------------------------

app.get("/team-matches/:teamId", async (req, res) => {
  const { teamId } = req.params;
  const competitionId = 128471; // Hardcoding the competition ID for example

  try {
    const [matches] = await pool.query(
      `
      SELECT 
          m.id, 
          m.name, 
          m.date_start, 
          m.match_number,
          m.status_note, 
          m.winning_team_id,
          CASE WHEN m.winning_team_id = ? THEN 'Win' ELSE 'Loss' END AS result,
          IF(m.team_1 = ?, t2.name, t1.name) AS opponent_name
      FROM matches m
      LEFT JOIN teams t1 ON m.team_1 = t1.id
      LEFT JOIN teams t2 ON m.team_2 = t2.id
      WHERE ? IN (m.team_1, m.team_2)
        AND m.competition_id = ?  -- Adding competition filter
      ORDER BY m.date_start DESC
      LIMIT 5
      `,
      [teamId, teamId, teamId, competitionId] // Include competitionId in the query parameters
    );

    res.json(matches);
  } catch (error) {
    console.error("Failed to fetch matches:", error);
    res.status(500).send("Failed to retrieve match data");
  }
});

app.get("/top-players/:teamId1/:teamId2", async (req, res) => {
  const { teamId1, teamId2 } = req.params;
  const competitionId = 128471; // Hardcoding the competition ID

  try {
    const [players] = await pool.query(
      `
    SELECT 
        p.id AS player_id, 
        p.first_name, 
        p.last_name,
        p.playing_role,
        p.short_name,
        t.name AS team_name,
        t.short_name AS short_team_name,
        COUNT(distinct m.id) AS matches_played, 
        SUM(fp.points) AS total_fantasy_points
    FROM players p
    JOIN fantasy_points_details fp ON p.id = fp.player_id
    JOIN teams t ON fp.team_id = t.id
    JOIN matches m ON m.id = fp.match_id AND m.competition_id = ?
    WHERE fp.team_id IN (?, ?)
    GROUP BY p.id, fp.team_id, t.name
    ORDER BY SUM(fp.points) DESC
    LIMIT 16
      `,
      [competitionId, teamId1, teamId2] // Passing hardcoded competitionId
    );
    res.json(players);
  } catch (error) {
    console.error("Failed to fetch top players:", error);
    res.status(500).send("Failed to retrieve player data");
  }
});
app.get("/player-stats/:playerIds/:scope", async (req, res) => {
  const { playerIds, scope } = req.params;
  const playerIdsArray = playerIds.split(",").map((id) => parseInt(id.trim())); // Convert to array of integers
  const competitionId = 128471; // Assuming the competition ID is always this value, modify as needed

  let limitClause = "";
  switch (scope) {
    case "last":
      limitClause = "LIMIT 1";
      break;
    case "last5":
      limitClause = "LIMIT 5";
      break;
    case "all":
      limitClause = ""; // No limit for career stats
      break;
    default:
      return res
        .status(400)
        .send("Invalid scope specified. Use 'last', 'last5', or 'all'.");
  }

  const query = `
    SELECT
      m.id AS MatchID,
      m.date_start AS MatchDate,
      p.first_name || ' ' || p.last_name AS PlayerName,
      p.playing_role,
      fp.points AS LastMatchPoints,
      fp.rating AS LastMatchRating,
      b.runs AS RunsScored,
      b.balls_faced AS BallsFaced,
      CASE WHEN b.runs >= 100 THEN 1 ELSE 0 END AS Hundreds,
      CASE WHEN b.runs >= 50 THEN 1 ELSE 0 END AS Fifties,
      (b.runs * 100.0 / NULLIF(b.balls_faced, 0)) AS StrikeRate,
      b.how_out AS Dismissal,
      bl.overs AS OversBowled,
      bl.runs_conceded AS RunsConceded,
      bl.wickets AS WicketsTaken,
      (bl.runs_conceded / NULLIF(bl.overs, 0)) AS EconomyRate,
      COALESCE(fld.catches, 0) AS Catches,
      COALESCE(fld.runout_thrower, 0) + COALESCE(fld.runout_catcher, 0) + COALESCE(fld.runout_direct_hit, 0) AS TotalRunouts,
      COALESCE(fld.stumping, 0) AS Stumpings,
      dt.team_position AS TeamPosition
    FROM 
      matches m
    JOIN fantasy_points_details fp ON m.id = fp.match_id
    JOIN players p ON p.id = fp.player_id
    LEFT JOIN match_inning_batters_test b ON m.id = b.match_id AND fp.player_id = b.batsman_id
    LEFT JOIN match_inning_bowlers_test bl ON m.id = bl.match_id AND fp.player_id = bl.bowler_id
    LEFT JOIN match_inning_fielders_test fld ON m.id = fld.match_id AND fp.player_id = fld.fielder_id
    LEFT JOIN DreamTeam_test dt ON m.id = dt.match_id AND p.id = dt.player_id
    WHERE
      fp.player_id IN (?) AND
      m.competition_id = ${competitionId}
    ORDER BY
      m.date_start DESC
    ${limitClause};
    `;

  try {
    const [results] = await pool.query(query, [playerIdsArray]);
    res.json(results);
  } catch (error) {
    console.error("Failed to fetch player statistics:", error);
    res.status(500).send("Failed to retrieve player data");
  }
});

// ----------------------VENUE AND PITCH REPORT API---------------------------------------------
app.get("/team-stats/:teamId/:venueId", async (req, res) => {
  const { teamId, venueId } = req.params;  // Extracting parameters from the request URL

  const query = `
      SELECT 
          venue_id,
          COUNT(*) AS total_matches,
          SUM(CASE 
              WHEN (toss_winner = ? AND toss_decision = 1) OR 
                   (toss_winner != ? AND toss_decision = 2) THEN 1 
              ELSE 0 END) AS matches_batted_first,
          SUM(CASE 
              WHEN (toss_winner = ? AND toss_decision = 2) OR 
                   (toss_winner != ? AND toss_decision = 1) THEN 1 
              ELSE 0 END) AS matches_chased,
          SUM(CASE 
              WHEN ((toss_winner = ? AND toss_decision = 1 OR toss_winner != ? AND toss_decision = 2) AND winning_team_id = ?) THEN 1 
              ELSE 0 END) AS wins_batting_first,
          SUM(CASE 
              WHEN ((toss_winner = ? AND toss_decision = 2 OR toss_winner != ? AND toss_decision = 1) AND winning_team_id = ?) THEN 1 
              ELSE 0 END) AS wins_chasing,
          GROUP_CONCAT(id) AS match_ids
      FROM matches
      WHERE (team_1 = ? OR team_2 = ?) AND venue_id = ?
      GROUP BY venue_id;
  `;

  // Use the dynamic parameters in the query
  const queryParams = [
      teamId, teamId,  // for matches_batted_first conditions
      teamId, teamId,  // for matches_chased conditions
      teamId, teamId, teamId,  // for wins_batting_first conditions
      teamId, teamId, teamId,  // for wins_chasing conditions
      teamId, teamId,  // WHERE condition to filter matches involving the team
      venueId  // WHERE condition to filter matches at the specific venue
  ];

  try {
      const [results] = await pool.query(query, queryParams);
      res.json(results.length > 0 ? results[0] : {});
  } catch (error) {
      console.error("Error fetching team stats:", error);
      res.status(500).send("Failed to retrieve data");
  }
});

// top player using team at particular venue overall
app.get("/top-players/:teamId/:venueId", async (req, res) => {
  const { teamId, venueId } = req.params;

  const query = `
      SELECT 
          p.id AS player_id,
          CONCAT(p.first_name, ' ', p.last_name) AS player_name,
          SUM(fp.points) AS total_fantasy_points,
          COUNT(DISTINCT m.id) AS match_count,
          GROUP_CONCAT(DISTINCT m.id ORDER BY m.id) AS match_ids
      FROM matches m
      JOIN fantasy_points_details fp ON m.id = fp.match_id
      JOIN players p ON fp.player_id = p.id
      JOIN team_players tp ON p.id = tp.player_id AND tp.team_id = ?
      WHERE (m.team_1 = ? OR m.team_2 = ?) 
        AND m.venue_id = ?
        AND m.competition_id = 128471
      GROUP BY p.id
      ORDER BY total_fantasy_points DESC
      LIMIT 10;
  `;

  try {
      const [results] = await pool.query(query, [teamId, teamId, teamId, venueId]);
      console.log("Query Results:", results); // Check the structure of the results here
      res.json(results);
  } catch (error) {
      console.error("Error fetching top players:", error);
      res.status(500).send("Failed to retrieve data");
  }
});


// top players batting first using team and venue

app.get("/top-players/batting-first/:teamId/:venueId", async (req, res) => {
  const { teamId, venueId } = req.params;

  const query = `
      SELECT 
          p.id AS player_id,
          CONCAT(p.first_name, ' ', p.last_name) AS player_name,
          SUM(fp.points) AS total_fantasy_points,
          COUNT(DISTINCT m.id) AS match_count
      FROM matches m
      JOIN fantasy_points_details fp ON m.id = fp.match_id
      JOIN players p ON fp.player_id = p.id
      JOIN team_players tp ON tp.player_id = p.id AND tp.team_id = ?
      WHERE (
          (m.toss_winner = ? AND m.toss_decision = 1 AND m.team_1 = ?) OR 
          (m.toss_winner = ? AND m.toss_decision = 2 AND m.team_2 = ?) OR
          (m.toss_winner != ? AND m.toss_decision = 2 AND m.team_1 = ?) OR
          (m.toss_winner != ? AND m.toss_decision = 1 AND m.team_2 = ?)
      )
      AND m.venue_id = ?
      AND m.competition_id = 128471  // Filter by competition ID
      GROUP BY p.id
      ORDER BY total_fantasy_points DESC
      LIMIT 10;
  `;

  try {
      const [results] = await pool.query(query, [teamId, teamId, teamId, teamId, teamId, teamId, teamId, teamId, venueId]);
      res.json(results);
  } catch (error) {
      console.error("Error fetching top players batting first:", error);
      res.status(500).send("Failed to retrieve data");
  }
});

// top player bowling first using team and venue

app.get("/top-players/bowling-first/:teamId/:venueId", async (req, res) => {
  const { teamId, venueId } = req.params;

  const query = `
      SELECT 
          p.id AS player_id,
          CONCAT(p.first_name, ' ', p.last_name) AS player_name,
          SUM(fp.points) AS total_fantasy_points,
          COUNT(DISTINCT m.id) AS match_count
      FROM matches m
      JOIN fantasy_points_details fp ON m.id = fp.match_id
      JOIN players p ON fp.player_id = p.id
      JOIN team_players tp ON tp.player_id = p.id AND tp.team_id = ?
      WHERE (
          (m.toss_winner = ? AND m.toss_decision = 2 AND m.team_1 = ?) OR 
          (m.toss_winner = ? AND m.toss_decision = 1 AND m.team_2 = ?) OR
          (m.toss_winner != ? AND m.toss_decision = 1 AND m.team_1 = ?) OR
          (m.toss_winner != ? AND m.toss_decision = 2 AND m.team_2 = ?)
      )
      AND m.venue_id = ?
      AND m.competition_id = 128471  // Filter by competition ID
      GROUP BY p.id
      ORDER BY total_fantasy_points DESC
      LIMIT 10;
  `;

  try {
      const [results] = await pool.query(query, [teamId, teamId, teamId, teamId, teamId, teamId, teamId, teamId, venueId]);
      res.json(results);
  } catch (error) {
      console.error("Error fetching top players bowling first:", error);
      res.status(500).send("Failed to retrieve data");
  }
});


app.get("/stats/venue/:venueId", async (req, res) => {
  const { venueId } = req.params;
  const competitionId = 128471;  // Static competition ID for IPL 2024

  const query = `
      SELECT
          AVG(first_innings_wickets) AS avg_wickets,
          AVG(first_innings_score) AS avg_first_innings_score,
          GROUP_CONCAT(DISTINCT last_five_matches.match_id ORDER BY last_five_matches.match_id) AS match_ids,
          COUNT(DISTINCT last_five_matches.match_id) AS match_count
      FROM (
          SELECT 
              m.id AS match_id,
              SUM(b.wickets) AS first_innings_wickets,
              CAST(SUBSTRING_INDEX(mi.scores, '/', 1) AS UNSIGNED) AS first_innings_score
          FROM matches m
          JOIN match_innings_test mi ON m.id = mi.match_id AND mi.inning_number = 1
          LEFT JOIN match_inning_bowlers_test b ON m.id = b.match_id AND b.inning_number = 1
          WHERE m.venue_id = ? AND m.competition_id = ?
          GROUP BY m.id
          ORDER BY m.date_start DESC
          LIMIT 5
      ) AS last_five_matches;
  `;

  try {
      const [results] = await pool.query(query, [venueId, competitionId]);
      if (results.length) {
          res.json(results[0]);  // Return the first result in a structured format
      } else {
          res.status(404).send('No data found');
      }
  } catch (error) {
      console.error("Error fetching average stats for venue:", error);
      res.status(500).send("Failed to retrieve data");
  }
});


app.get("/venue/:venueId/team/:teamId/match-details", async (req, res) => {
  const { venueId, teamId } = req.params;
  const competitionId = 128471; // Assuming competition ID for IPL 2024 is 128471

  try {
      // Fetch the last five matches for a specific venue and team within a competition
      const [matches] = await pool.query(`
          SELECT id AS match_id, date_start, short_title, status_note
          FROM matches
          WHERE (team_1 = ? OR team_2 = ?) AND venue_id = ? AND competition_id = ?
          ORDER BY date_start DESC
          LIMIT 5
      `, [teamId, teamId, venueId, competitionId]);

      const matchIds = matches.map(match => match.match_id);
      if (matchIds.length === 0) {
          return res.status(404).send('No matches found');
      }

      // Query for batting, bowling, fielding details, fantasy points, dream teams, and inning scores
      const [battingDetails, bowlingDetails, fieldingDetails, fantasyPoints, dreamTeams, inningScores] = await Promise.all([
          pool.query(`
              SELECT 
                  b.match_id,
                  p.id as player_id,
                  p.first_name,
                  p.last_name,
                  b.runs,
                  b.balls_faced,
                  b.fours,
                  b.sixes,
                  b.strike_rate,
                  b.how_out
              FROM match_inning_batters_test b
              JOIN players p ON b.batsman_id = p.id
              WHERE b.match_id IN (?)
          `, [matchIds]),
          pool.query(`
              SELECT 
                  bl.match_id,
                  p.id as player_id,
                  p.first_name,
                  p.last_name,
                  bl.overs,
                  bl.runs_conceded,
                  bl.wickets,
                  bl.econ
              FROM match_inning_bowlers_test bl
              JOIN players p ON bl.bowler_id = p.id
              WHERE bl.match_id IN (?)
          `, [matchIds]),
          pool.query(`
              SELECT 
                  f.match_id,
                  p.id as player_id,
                  p.first_name,
                  p.last_name,
                  f.catches,
                  f.stumping,
                  f.runout_thrower,
                  f.runout_catcher,
                  f.runout_direct_hit
              FROM match_inning_fielders_test f
              JOIN players p ON f.fielder_id = p.id
              WHERE f.match_id IN (?)
          `, [matchIds]),
          pool.query(`
              SELECT 
                  fp.match_id,
                  p.id as player_id,
                  p.first_name,
                  p.last_name,
                  fp.points
              FROM fantasy_points_details fp
              JOIN players p ON fp.player_id = p.id
              WHERE fp.match_id IN (?)
          `, [matchIds]),
          pool.query(`
              SELECT 
                  dt.match_id,
                  p.id as player_id,
                  p.first_name,
                  p.last_name,
                  dt.role,
                  dt.points
              FROM DreamTeam_test dt
              JOIN players p ON dt.player_id = p.id
              WHERE dt.match_id IN (?)
          `, [matchIds]),
          pool.query(`
              SELECT
                  mi.match_id,
                  mi.inning_number,
                  mi.scores,
                  mi.scores_full,
                  t.id AS team_id,
                  t.name AS team_name
              FROM match_innings_test mi
              JOIN matches m ON mi.match_id = m.id
              LEFT JOIN teams t ON (mi.batting_team_id = t.id)
              WHERE mi.match_id IN (?)
          `, [matchIds])
      ]);

      // Organize data by match_id
      const detailedMatches = matches.map(match => ({
          match_id: match.match_id,
          short_title: match.short_title,
          status_note: match.status_note,
          date_start: match.date_start,
          innings: inningScores[0].filter(i => i.match_id === match.match_id),
          batting: battingDetails[0].filter(b => b.match_id === match.match_id),
          bowling: bowlingDetails[0].filter(b => b.match_id === match.match_id),
          fielding: fieldingDetails[0].filter(f => f.match_id === match.match_id),
          fantasyPoints: fantasyPoints[0].filter(fp => fp.match_id === match.match_id),
          dreamTeam: dreamTeams[0].filter(dt => dt.match_id === match.match_id)
      }));

      res.json(detailedMatches);
  } catch (error) {
      console.error("Error fetching match details:", error);
      res.status(500).send("Failed to retrieve data");
  }
});

app.get("/top-players/venue/:venueId/teams/:teamId1/:teamId2", async (req, res) => {
  const { venueId, teamId1, teamId2 } = req.params;
  const competitionId = 128471; // Static competition ID for IPL 2023

  try {
      const query = `
          SELECT 
              p.id AS player_id,
              CONCAT(p.first_name, ' ', p.last_name) AS player_name,
              SUM(fp.points) AS total_fantasy_points,
              COUNT(DISTINCT fp.match_id) AS match_count,
              GROUP_CONCAT(DISTINCT m.team_1) AS team1_ids,
              GROUP_CONCAT(DISTINCT m.team_2) AS team2_ids
          FROM players p
          JOIN fantasy_points_details fp ON p.id = fp.player_id
          JOIN matches m ON fp.match_id = m.id
          WHERE (m.team_1 = ? OR m.team_2 = ? OR m.team_1 = ? OR m.team_2 = ?) 
            AND m.venue_id = ?
            AND m.competition_id = ? -- Filter by the competition ID for IPL 2023
          GROUP BY p.id
          ORDER BY total_fantasy_points DESC
          LIMIT 10;
      `;

      const [players] = await pool.query(query, [teamId1, teamId1, teamId2, teamId2, venueId, competitionId]);
      if (players.length === 0) {
          return res.status(404).send('No players found');
      }
      res.json(players);
  } catch (error) {
      console.error("Error fetching top players by fantasy points:", error);
      res.status(500).send("Failed to retrieve data");
  }
});




app.get("/frequent-leaders/venue/:venueId/teams/:teamId1/:teamId2", async (req, res) => {
  const { venueId, teamId1, teamId2 } = req.params;

  try {
      const query = `
        SELECT 
          dt.player_id,
          p.first_name,
          p.last_name,
          SUM(CASE WHEN dt.role = 'Captain' THEN 1 ELSE 0 END) AS times_captain,
          SUM(CASE WHEN dt.role = 'Vice Captain' THEN 1 ELSE 0 END) AS times_vice_captain,
          GROUP_CONCAT(DISTINCT dt.match_id ORDER BY dt.match_id) AS match_ids,
          COUNT(DISTINCT dt.match_id) AS match_count
        FROM DreamTeam_test dt
        JOIN matches m ON dt.match_id = m.id
        JOIN players p ON dt.player_id = p.id
        WHERE (m.team_1 = ? OR m.team_2 = ?) AND (m.team_1 = ? OR m.team_2 = ?)
          AND m.venue_id = ?
          AND m.competition_id = 128471
        GROUP BY dt.player_id
        ORDER BY times_captain DESC, times_vice_captain DESC;
      `;

      const [results] = await pool.query(query, [teamId1, teamId2, teamId1, teamId2, venueId]);
      res.json(results);
  } catch (error) {
      console.error("Error fetching frequent captains and vice captains:", error);
      res.status(500).send("Failed to retrieve data");
  }
});



app.get("/player-stats1/:playerId/:teamId", async (req, res) => {
  const { playerId, teamId } = req.params;

  try {
      // Batting stats query
      const battingQuery = `
          SELECT 
            b.inning_number,
            COUNT(*) AS innings_played,
            SUM(b.runs) AS total_runs,
            AVG(b.runs) AS average_runs,
            SUM(b.balls_faced) AS total_balls_faced,
            SUM(b.fours) AS total_fours,
            SUM(b.sixes) AS total_sixes,
            SUM(CASE WHEN b.runs >= 100 THEN 1 ELSE 0 END) AS centuries,
            SUM(CASE WHEN b.runs >= 50 AND b.runs < 100 THEN 1 ELSE 0 END) AS fifties
          FROM match_inning_batters_test b
          JOIN matches m ON b.match_id = m.id
          WHERE b.batsman_id = ? AND (m.team_1 = ? OR m.team_2 = ?)
          GROUP BY b.inning_number;
      `;

      // Bowling stats query
      const bowlingQuery = `
          SELECT 
            bl.inning_number,
            COUNT(*) AS innings_bowled,
            SUM(bl.overs) AS total_overs,
            SUM(bl.runs_conceded) AS total_runs_conceded,
            SUM(bl.wickets) AS total_wickets,
            AVG(bl.econ) AS average_economy
          FROM match_inning_bowlers_test bl
          JOIN matches m ON bl.match_id = m.id
          WHERE bl.bowler_id = ? AND (m.team_1 = ? OR m.team_2 = ?)
          GROUP BY bl.inning_number;
      `;

      // Fielding stats query
      const fieldingQuery = `
          SELECT 
            f.inning_number,
            SUM(f.catches) AS total_catches,
            SUM(f.stumping) AS total_stumpings,
            SUM(f.runout_thrower + f.runout_catcher + f.runout_direct_hit) AS total_runouts
          FROM match_inning_fielders_test f
          JOIN matches m ON f.match_id = m.id
          WHERE f.fielder_id = ? AND (m.team_1 = ? OR m.team_2 = ?)
          GROUP BY f.inning_number;
      `;

      // Execute queries in parallel
      const [battingStats, bowlingStats, fieldingStats] = await Promise.all([
          pool.query(battingQuery, [playerId, teamId, teamId]),
          pool.query(bowlingQuery, [playerId, teamId, teamId]),
          pool.query(fieldingQuery, [playerId, teamId, teamId])
      ]);

      // Prepare the response
      res.json({
          playerId: playerId,
          teamId: teamId,
          batting: battingStats[0],
          bowling: bowlingStats[0],
          fielding: fieldingStats[0]
      });
  } catch (error) {
      console.error("Error fetching player stats:", error);
      res.status(500).send("Failed to retrieve data");
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
