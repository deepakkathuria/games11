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
    JOIN matches m ON m.id = fp.match_id 
    WHERE fp.team_id IN (?, ?)
    GROUP BY p.id, fp.team_id, t.name
    ORDER BY SUM(fp.points) DESC
    LIMIT 16
      `,
      [teamId1, teamId2] // Passing hardcoded competitionId
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
      fp.player_id IN (?)
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
  const { teamId, venueId } = req.params; // Extracting parameters from the request URL

  const query = `
      SELECT 
          m.venue_id,
          COUNT(*) AS total_matches,
          SUM(CASE 
              WHEN (m.toss_winner = ? AND m.toss_decision = 1) OR 
                   (m.toss_winner != ? AND m.toss_decision = 2) THEN 1 
              ELSE 0 END) AS matches_batted_first,
          SUM(CASE 
              WHEN (m.toss_winner = ? AND m.toss_decision = 2) OR 
                   (m.toss_winner != ? AND m.toss_decision = 1) THEN 1 
              ELSE 0 END) AS matches_chased,
          SUM(CASE 
              WHEN ((m.toss_winner = ? AND m.toss_decision = 1 OR m.toss_winner != ? AND m.toss_decision = 2) AND m.winning_team_id = ?) THEN 1 
              ELSE 0 END) AS wins_batting_first,
          SUM(CASE 
              WHEN ((m.toss_winner = ? AND m.toss_decision = 2 OR m.toss_winner != ? AND m.toss_decision = 1) AND m.winning_team_id = ?) THEN 1 
              ELSE 0 END) AS wins_chasing,
          GROUP_CONCAT(m.id) AS match_ids,
          t.short_name AS team_short_name
      FROM matches m
      JOIN teams t ON m.team_1 = t.id OR m.team_2 = t.id
      WHERE (m.team_1 = ? OR m.team_2 = ?) AND m.venue_id = ?
      GROUP BY m.venue_id, t.short_name;
  `;

  // Use the dynamic parameters in the query
  const queryParams = [
    teamId,
    teamId, // for matches_batted_first conditions
    teamId,
    teamId, // for matches_chased conditions
    teamId,
    teamId,
    teamId, // for wins_batting_first conditions
    teamId,
    teamId,
    teamId, // for wins_chasing conditions
    teamId,
    teamId, // WHERE condition to filter matches involving the team
    venueId, // WHERE condition to filter matches at the specific venue
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
          GROUP_CONCAT(DISTINCT m.id ORDER BY m.id) AS match_ids,
          t.short_name AS team_short_name  
      FROM matches m
      JOIN fantasy_points_details fp ON m.id = fp.match_id
      JOIN players p ON fp.player_id = p.id
      JOIN team_players tp ON p.id = tp.player_id AND tp.team_id = ?
      JOIN teams t ON tp.team_id = t.id  
      WHERE (m.team_1 = ? OR m.team_2 = ?) 
        AND m.venue_id = ?
      GROUP BY p.id, t.short_name  
      ORDER BY total_fantasy_points DESC
      LIMIT 10;
  `;

  try {
    const [results] = await pool.query(query, [
      teamId,
      teamId,
      teamId,
      venueId,
    ]);
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
          COUNT(DISTINCT m.id) AS match_count,
          t.short_name AS team_short_name  // Added to get the team short name
      FROM matches m
      JOIN fantasy_points_details fp ON m.id = fp.match_id
      JOIN players p ON fp.player_id = p.id
      JOIN team_players tp ON tp.player_id = p.id AND tp.team_id = ?
      JOIN teams t ON tp.team_id = t.id  // Joining with teams table to get the team details
      WHERE (
          (m.toss_winner = ? AND m.toss_decision = 1 AND m.team_1 = ?) OR 
          (m.toss_winner = ? AND m.toss_decision = 2 AND m.team_2 = ?) OR
          (m.toss_winner != ? AND m.toss_decision = 2 AND m.team_1 = ?) OR
          (m.toss_winner != ? AND m.toss_decision = 1 AND m.team_2 = ?)
      )
      AND m.venue_id = ?
\      GROUP BY p.id, t.short_name  
      ORDER BY total_fantasy_points DESC
      LIMIT 10;
  `;

  try {
    const [results] = await pool.query(query, [
      teamId,
      teamId,
      teamId,
      teamId,
      teamId,
      teamId,
      teamId,
      teamId,
      venueId,
    ]);
    console.log("Query Results:", results); // Check the structure of the results here
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
          t.short_name AS team_short_name, // Added to get the team short name
          SUM(fp.points) AS total_fantasy_points,
          COUNT(DISTINCT m.id) AS match_count
      FROM matches m
      JOIN fantasy_points_details fp ON m.id = fp.match_id
      JOIN players p ON fp.player_id = p.id
      JOIN team_players tp ON p.id = tp.player_id AND tp.team_id = ?
      JOIN teams t ON tp.team_id = t.id // Joining with teams table to get the team details
      WHERE (
          (m.toss_winner = ? AND m.toss_decision = 2 AND m.team_1 = ?) OR 
          (m.toss_winner = ? AND m.toss_decision = 1 AND m.team_2 = ?) OR
          (m.toss_winner != ? AND m.toss_decision = 1 AND m.team_1 = ?) OR
          (m.toss_winner != ? AND m.toss_decision = 2 AND m.team_2 = ?)
      )
      AND m.venue_id = ?
      GROUP BY p.id, t.short_name 
      ORDER BY total_fantasy_points DESC
      LIMIT 10;
  `;

  try {
    const [results] = await pool.query(query, [
      teamId,
      teamId,
      teamId,
      teamId,
      teamId,
      teamId,
      teamId,
      teamId,
      venueId,
    ]);
    res.json(results);
  } catch (error) {
    console.error("Error fetching top players bowling first:", error);
    res.status(500).send("Failed to retrieve data");
  }
});

//avg wicket score last 5 matches
app.get("/stats/venue/:venueId", async (req, res) => {
  const { venueId } = req.params;
  const competitionId = 128471; // Static competition ID for IPL 2024

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
          WHERE m.venue_id = ?
          GROUP BY m.id
          ORDER BY m.date_start DESC
          LIMIT 5
      ) AS last_five_matches;
  `;

  try {
    const [results] = await pool.query(query, [venueId]);
    if (results.length) {
      res.json(results[0]); // Return the first result in a structured format
    } else {
      res.status(404).send("No data found");
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
    const [matches] = await pool.query(
      `
          SELECT id AS match_id, date_start, short_title, status_note
          FROM matches
          WHERE (team_1 = ? OR team_2 = ?) AND venue_id = ? 
          ORDER BY date_start DESC
          LIMIT 5
      `,
      [teamId, teamId, venueId]
    );

    const matchIds = matches.map(match => match.match_id);
    if (matchIds.length === 0) {
      return res.status(404).send("No matches found");
    }

    // Query for batting, bowling, fielding details, fantasy points, dream teams, and inning scores
    const [
      battingDetails,
      bowlingDetails,
      fieldingDetails,
      fantasyPoints,
      dreamTeams,
      inningScores,
    ] = await Promise.all([
      pool.query(
        `
          SELECT 
              b.match_id,
              p.id as player_id,
              p.first_name,
              p.last_name,
              p.short_name as player_short_name,
              p.playing_role,
              p.fantasy_player_rating as player_rating,
              b.runs,
              b.balls_faced,
              b.fours,
              b.sixes,
              b.strike_rate,
              b.how_out,
              t.id as team_id,
              t.short_name as team_short_name
          FROM match_inning_batters_test b
          JOIN players p ON b.batsman_id = p.id
          JOIN team_players tp ON p.id = tp.player_id
          JOIN teams t ON tp.team_id = t.id
          WHERE b.match_id IN (?)
        `,
        [matchIds]
      ),
      pool.query(
        `
          SELECT 
              bl.match_id,
              p.id as player_id,
              p.first_name,
              p.last_name,
              p.short_name as player_short_name,
              p.playing_role,
              p.fantasy_player_rating as player_rating,
              bl.overs,
              bl.runs_conceded,
              bl.wickets,
              bl.econ,
              t.id as team_id,
              t.short_name as team_short_name
          FROM match_inning_bowlers_test bl
          JOIN players p ON bl.bowler_id = p.id
          JOIN team_players tp ON p.id = tp.player_id
          JOIN teams t ON tp.team_id = t.id
          WHERE bl.match_id IN (?)
        `,
        [matchIds]
      ),
      pool.query(
        `
          SELECT 
              f.match_id,
              p.id as player_id,
              p.first_name,
              p.last_name,
              p.short_name as player_short_name,
              p.playing_role,
              p.fantasy_player_rating as player_rating,
              f.catches,
              f.stumping,
              f.runout_thrower,
              f.runout_catcher,
              f.runout_direct_hit,
              t.id as team_id,
              t.short_name as team_short_name
          FROM match_inning_fielders_test f
          JOIN players p ON f.fielder_id = p.id
          JOIN team_players tp ON p.id = tp.player_id
          JOIN teams t ON tp.team_id = t.id
          WHERE f.match_id IN (?)
        `,
        [matchIds]
      ),
      pool.query(
        `
          SELECT 
              fp.match_id,
              p.id as player_id,
              p.first_name,
              p.last_name,
              p.short_name as player_short_name,
              p.playing_role,
              p.fantasy_player_rating as player_rating,
              fp.points,
              t.id as team_id,
              t.short_name as team_short_name
          FROM fantasy_points_details fp
          JOIN players p ON fp.player_id = p.id
          JOIN team_players tp ON p.id = tp.player_id
          JOIN teams t ON tp.team_id = t.id
          WHERE fp.match_id IN (?)
        `,
        [matchIds]
      ),
      pool.query(
        `
          SELECT 
              dt.match_id,
              p.id as player_id,
              p.first_name,
              p.last_name,
              p.short_name as player_short_name,
              p.playing_role,
              p.fantasy_player_rating as player_rating,
              dt.role,
              dt.points,
              t.id as team_id,
              t.short_name as team_short_name
          FROM DreamTeam_test dt
          JOIN players p ON dt.player_id = p.id
          JOIN team_players tp ON p.id = tp.player_id
          JOIN teams t ON tp.team_id = t.id
          WHERE dt.match_id IN (?)
        `,
        [matchIds]
      ),
      pool.query(
        `
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
        `,
        [matchIds]
      ),
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
      dreamTeam: dreamTeams[0].filter(dt => dt.match_id === match.match_id),
    }));

    res.json(detailedMatches);
  } catch (error) {
    console.error("Error fetching match details:", error);
    res.status(500).send("Failed to retrieve data");
  }
});

app.get("/venue1/:venueId/team/:teamId/match-details", async (req, res) => {
  const { venueId, teamId } = req.params;
  const competitionId = 128471; // Assuming competition ID for IPL 2024 is 128471

  try {
      const [matches] = await pool.query(
          `
          SELECT id AS match_id, date_start, short_title, status_note
          FROM matches
          WHERE (team_1 = ? OR team_2 = ?) AND venue_id = ? 
          ORDER BY date_start DESC
          LIMIT 5
          `,
          [teamId, teamId, venueId]
      );

      const matchIds = matches.map(match => match.match_id);
      if (matchIds.length === 0) {
          return res.status(404).send("No matches found");
      }

      // Adjusted queries
      const [
          [batters],
          [bowlers],
          [fielders],
          [inningsDetails]
      ] = await Promise.all([
          pool.query(
              `SELECT b.*, p.first_name, p.last_name, p.short_name AS player_short_name
              FROM match_inning_batters_test b
              JOIN players p ON b.batsman_id = p.id
              WHERE b.match_id IN (?)`, [matchIds]
          ),
          pool.query(
              `SELECT bl.*, p.first_name, p.last_name, p.short_name AS player_short_name
              FROM match_inning_bowlers_test bl
              JOIN players p ON bl.bowler_id = p.id
              WHERE bl.match_id IN (?)`, [matchIds]
          ),
          pool.query(
              `SELECT f.*, p.first_name, p.last_name, p.short_name AS player_short_name
              FROM match_inning_fielders_test f
              JOIN players p ON f.fielder_id = p.id
              WHERE f.match_id IN (?)`, [matchIds]
          ),
          pool.query(
              `SELECT mi.*, t.name AS team_name
              FROM match_innings_test mi
              JOIN teams t ON mi.batting_team_id = t.id
              WHERE mi.match_id IN (?) ORDER BY inning_number`, [matchIds]
          )
      ]);

      const detailedMatches = matches.map(match => {
          const matchInnings = inningsDetails
              .filter(i => i.match_id === match.match_id)
              .map(inning => {
                  const inningNumber = inning.inning_number;
                  return {
                      inning_number: inningNumber,
                      name: inning.name,
                      scores: inning.scores,
                      scores_full: inning.scores_full || `${inning.scores} (${inning.max_over} ov)`,
                      team_name: inning.team_name,
                      batsmen: batters.filter(b => b.match_id === match.match_id && b.inning_number === inningNumber),
                      bowlers: bowlers.filter(b => b.match_id === match.match_id && b.inning_number === inningNumber),
                      fielders: fielders.filter(f => f.match_id === match.match_id && f.inning_number === inningNumber)
                  };
              });

          return {
              match_id: match.match_id,
              title: match.short_title,
              status_note: match.status_note,
              date_start: match.date_start,
              innings: matchInnings
          };
      });

      res.json({ status: "ok", response: detailedMatches });
  } catch (error) {
      console.error("Error fetching match details:", error);
      res.status(500).send("Failed to retrieve data");
  }
});

//DREAM TEAM VENUE
app.get("/venue/:venueId/team1/:team1Id/team2/:team2Id/match-details", async (req, res) => {
  const { venueId, team1Id, team2Id } = req.params;
  const competitionId = 128471; // Assuming competition ID for IPL 2024 is 128471

  try {
    // Fetch the last five matches for a specific venue and between two teams within a competition
    const [matches] = await pool.query(
      `
          SELECT id AS match_id, date_start, short_title, status_note
          FROM matches
          WHERE (team_1 = ? AND team_2 = ? OR team_1 = ? AND team_2 = ?) AND venue_id = ?
          ORDER BY date_start DESC
          LIMIT 5
      `,
      [team1Id, team2Id, team2Id, team1Id, venueId]
    );

    const matchIds = matches.map(match => match.match_id);
    if (matchIds.length === 0) {
      return res.status(404).send("No matches found");
    }

    // Query for batting, bowling, fielding details, fantasy points, dream teams, and inning scores
    const [
      battingDetails,
      bowlingDetails,
      fieldingDetails,
      fantasyPoints,
      dreamTeams,
      inningScores,
    ] = await Promise.all([
      pool.query(
        `
          SELECT 
              b.match_id,
              p.id as player_id,
              p.first_name,
              p.last_name,
              p.short_name as player_short_name,
              p.playing_role,
              p.fantasy_player_rating as player_rating,
              b.runs,
              b.balls_faced,
              b.fours,
              b.sixes,
              b.strike_rate,
              b.how_out,
              t.id as team_id,
              t.short_name as team_short_name
          FROM match_inning_batters_test b
          JOIN players p ON b.batsman_id = p.id
          JOIN team_players tp ON p.id = tp.player_id
          JOIN teams t ON tp.team_id = t.id
          WHERE b.match_id IN (?) AND (tp.team_id = ? OR tp.team_id = ?)
        `,
        [matchIds, team1Id, team2Id]
      ),
      pool.query(
        `
          SELECT 
              bl.match_id,
              p.id as player_id,
              p.first_name,
              p.last_name,
              p.short_name as player_short_name,
              p.playing_role,
              p.fantasy_player_rating as player_rating,
              bl.overs,
              bl.runs_conceded,
              bl.wickets,
              bl.econ,
              t.id as team_id,
              t.short_name as team_short_name
          FROM match_inning_bowlers_test bl
          JOIN players p ON bl.bowler_id = p.id
          JOIN team_players tp ON p.id = tp.player_id
          JOIN teams t ON tp.team_id = t.id
          WHERE bl.match_id IN (?) AND (tp.team_id = ? OR tp.team_id = ?)
        `,
        [matchIds, team1Id, team2Id]
      ),
      pool.query(
        `
          SELECT 
              f.match_id,
              p.id as player_id,
              p.first_name,
              p.last_name,
              p.short_name as player_short_name,
              p.playing_role,
              p.fantasy_player_rating as player_rating,
              f.catches,
              f.stumping,
              f.runout_thrower,
              f.runout_catcher,
              f.runout_direct_hit,
              t.id as team_id,
              t.short_name as team_short_name
          FROM match_inning_fielders_test f
          JOIN players p ON f.fielder_id = p.id
          JOIN team_players tp ON p.id = tp.player_id
          JOIN teams t ON tp.team_id = t.id
          WHERE f.match_id IN (?) AND (tp.team_id = ? OR tp.team_id = ?)
        `,
        [matchIds, team1Id, team2Id]
      ),
      pool.query(
        `
          SELECT 
              fp.match_id,
              p.id as player_id,
              p.first_name,
              p.last_name,
              p.short_name as player_short_name,
              p.playing_role,
              p.fantasy_player_rating as player_rating,
              fp.points,
              t.id as team_id,
              t.short_name as team_short_name
          FROM fantasy_points_details fp
          JOIN players p ON fp.player_id = p.id
          JOIN team_players tp ON p.id = tp.player_id
          JOIN teams t ON tp.team_id = t.id
          WHERE fp.match_id IN (?) AND (tp.team_id = ? OR tp.team_id = ?)
        `,
        [matchIds, team1Id, team2Id]
      ),
      pool.query(
        `
          SELECT 
              dt.match_id,
              p.id as player_id,
              p.first_name,
              p.last_name,
              p.short_name as player_short_name,
              p.playing_role,
              p.fantasy_player_rating as player_rating,
              dt.role,
              dt.points,
              t.id as team_id,
              t.short_name as team_short_name
          FROM DreamTeam_test dt
          JOIN players p ON dt.player_id = p.id
          JOIN team_players tp ON p.id = tp.player_id
          JOIN teams t ON tp.team_id = t.id
          WHERE dt.match_id IN (?) AND (tp.team_id = ? OR tp.team_id = ?)
        `,
        [matchIds, team1Id, team2Id]
      ),
      pool.query(
        `
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
          WHERE mi.match_id IN (?) AND (mi.batting_team_id = ? OR mi.batting_team_id = ?)
        `,
        [matchIds, team1Id, team2Id]
      ),
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
      dreamTeam: dreamTeams[0].filter(dt => dt.match_id === match.match_id),
    }));

    res.json(detailedMatches);
  } catch (error) {
    console.error("Error fetching match details:", error);
    res.status(500).send("Failed to retrieve data");
  }
});


//scoore card
app.get("/match/:matchId/scorecard", async (req, res) => {
  const { matchId } = req.params;
   console.log(matchId,"params")
  try {
      // Fetch match details
      const [[match]] = await pool.query(
          `
          SELECT id AS match_id, title, short_title, date_start, status_note
          FROM matches
          WHERE id = ?
          `,
          [matchId]
      );

      if (!match) {
          return res.status(404).send("Match not found");
      }

      // Fetch all related details
      const [
          [batters],
          [bowlers],
          [fielders],
          [inningsDetails]
      ] = await Promise.all([
          pool.query(
              `SELECT b.*, p.first_name, p.last_name, p.short_name AS player_short_name, t.short_name AS team_short_name
              FROM match_inning_batters_test b
              JOIN players p ON b.batsman_id = p.id
              JOIN match_innings_test mi ON mi.match_id = b.match_id AND mi.inning_number = b.inning_number
              JOIN teams t ON mi.batting_team_id = t.id
              WHERE b.match_id = ?`, [matchId]
          ),
          pool.query(
              `SELECT bl.*, p.first_name, p.last_name, p.short_name AS player_short_name, t.short_name AS team_short_name
              FROM match_inning_bowlers_test bl
              JOIN players p ON bl.bowler_id = p.id
              JOIN match_innings_test mi ON mi.match_id = bl.match_id AND mi.inning_number = bl.inning_number
              JOIN teams t ON mi.fielding_team_id = t.id
              WHERE bl.match_id = ?`, [matchId]
          ),
          pool.query(
              `SELECT f.*, p.first_name, p.last_name, p.short_name AS player_short_name, t.short_name AS team_short_name
              FROM match_inning_fielders_test f
              JOIN players p ON f.fielder_id = p.id
              JOIN match_innings_test mi ON mi.match_id = f.match_id AND mi.inning_number = f.inning_number
              JOIN teams t ON mi.fielding_team_id = t.id
              WHERE f.match_id = ?`, [matchId]
          ),
          pool.query(
              `SELECT mi.*, t.name AS team_name
              FROM match_innings_test mi
              JOIN teams t ON mi.batting_team_id = t.id
              WHERE mi.match_id = ? ORDER BY inning_number`, [matchId]
          )
      ]);

      // Structure innings with batsmen, bowlers, and fielders
      const matchInnings = inningsDetails.map(inning => {
          const inningNumber = inning.inning_number;
          return {
              inning_number: inningNumber,
              name: inning.name,
              scores: inning.scores,
              scores_full: inning.scores_full || `${inning.scores} (${inning.max_over} ov)`,
              team_name: inning.team_name,
              batsmen: batters.filter(b => b.inning_number === inningNumber),
              bowlers: bowlers.filter(b => b.inning_number === inningNumber),
              fielders: fielders.filter(f => f.inning_number === inningNumber)
          };
      });

      // Construct the final response
      const response = {
          match_id: match.match_id,
          title: match.title,
          short_title: match.short_title,
          date_start: match.date_start,
          status_note: match.status_note,
          innings: matchInnings
      };

      res.json({ status: "ok", response });
  } catch (error) {
      console.error("Error fetching scorecard details:", error);
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
        p.playing_role, 
        CONCAT(p.first_name, ' ', p.last_name) AS player_name,
        t.name AS team_name, 
        SUM(fp.points) AS total_fantasy_points,
        COUNT(DISTINCT fp.match_id) AS match_count
      FROM players p
      JOIN fantasy_points_details fp ON p.id = fp.player_id
      JOIN teams t ON fp.team_id = t.id
      JOIN matches m ON fp.match_id = m.id
      WHERE (m.team_1 = ? OR m.team_2 = ? OR m.team_1 = ? OR m.team_2 = ?) 
        AND m.venue_id = ?
      GROUP BY p.id, p.playing_role, t.name       
      ORDER BY total_fantasy_points DESC
      LIMIT 10;
    `;

    // Binding the parameters to avoid SQL injection
    const params = [teamId1, teamId2, teamId1, teamId2, venueId];

    // Execute the query
    const [players] = await pool.query(query, params);
    
    // Check if players data is found
    if (players.length === 0) {
      return res.status(404).send('No players found');
    }
    
    // Respond with the players data
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
        p.playing_role,
        t.name AS team_name,
        t.short_name AS team_short_name, 
        SUM(CASE WHEN dt.role = 'Captain' THEN 1 ELSE 0 END) AS times_captain,
        SUM(CASE WHEN dt.role = 'Vice Captain' THEN 1 ELSE 0 END) AS times_vice_captain,
        GROUP_CONCAT(DISTINCT dt.match_id ORDER BY dt.match_id) AS match_ids,
        COUNT(DISTINCT dt.match_id) AS match_count
      FROM DreamTeam_test dt
      JOIN matches m ON dt.match_id = m.id
      JOIN players p ON dt.player_id = p.id
      JOIN team_players tp ON dt.player_id = tp.player_id
      JOIN teams t ON tp.team_id = t.id
      WHERE (m.team_1 = ? OR m.team_2 = ?) AND (m.team_1 = ? OR m.team_2 = ?)
        AND m.venue_id = ?
      GROUP BY dt.player_id, p.playing_role, t.name, t.short_name
      ORDER BY times_captain DESC, times_vice_captain DESC;
    `;

    const [results] = await pool.query(query, [teamId1, teamId2, teamId1, teamId2, venueId]);
    res.json(results);
  } catch (error) {
    console.error("Error fetching frequent captains and vice captains:", error);
    res.status(500).send("Failed to retrieve data");
  }
});


app.get("/match-stats/:venueId/:teamId", async (req, res) => {
  const { venueId, teamId } = req.params;

  try {
    const query = `
      SELECT 
      COUNT(*) AS total_matches,
      SUM(CASE 
          WHEN ((m.toss_winner = ? AND m.toss_decision = 1 AND m.winning_team_id = ?) OR
                (m.toss_winner != ? AND m.toss_decision = 2 AND m.winning_team_id = ?)) THEN 1 
          ELSE 0 END) AS wins_batting_first,
      SUM(CASE 
          WHEN ((m.toss_winner = ? AND m.toss_decision = 2 AND m.winning_team_id = ?) OR
                (m.toss_winner != ? AND m.toss_decision = 1 AND m.winning_team_id = ?)) THEN 1 
          ELSE 0 END) AS wins_chasing
      FROM matches m
      WHERE (m.team_1 = ? OR m.team_2 = ?) AND m.venue_id = ?;
      `;

    const params = [
      teamId,
      teamId,
      teamId,
      teamId,
      teamId,
      teamId,
      teamId,
      teamId,
      teamId,
      teamId,
      venueId,
    ];
    const [results] = await pool.query(query, params);
    const result = results[0];

    if (result.total_matches === 0) {
      return res.status(404).send("No matches found");
    }

    res.json({
      total_matches: result.total_matches,
      wins_batting_first: result.wins_batting_first,
      wins_chasing: result.wins_chasing,
      win_percentage_batting_first:
        ((result.wins_batting_first / result.total_matches) * 100).toFixed(2) +
        "%",
      win_percentage_chasing:
        ((result.wins_chasing / result.total_matches) * 100).toFixed(2) + "%",
    });
  } catch (error) {
    console.error("Error fetching match statistics:", error);
    res.status(500).send("Failed to retrieve data");
  }
});

app.get("/venue-stats/:venueId", async (req, res) => {
  const { venueId } = req.params;

  try {
    const query = `
          SELECT 
              COUNT(*) AS total_matches,
              SUM(CASE 
                  WHEN (m.toss_decision = 1 AND m.winning_team_id = m.team_1) OR
                       (m.toss_decision = 2 AND m.winning_team_id = m.team_2) THEN 1 
                  ELSE 0 END) AS wins_batting_first,
              SUM(CASE 
                  WHEN (m.toss_decision = 2 AND m.winning_team_id = m.team_1) OR
                       (m.toss_decision = 1 AND m.winning_team_id = m.team_2) THEN 1 
                  ELSE 0 END) AS wins_chasing,
              GROUP_CONCAT(m.id) AS match_ids
          FROM matches m
          WHERE m.venue_id = ?;
      `;

    const [results] = await pool.query(query, [venueId]);
    if (results.length === 0) {
      return res.status(404).send("No matches found at the specified venue.");
    }

    const result = results[0];
    res.json({
      total_matches: result.total_matches,
      wins_batting_first: result.wins_batting_first,
      wins_chasing: result.wins_chasing,
      match_ids: result.match_ids ? result.match_ids.split(",") : [],
    });
  } catch (error) {
    console.error("Error fetching venue match statistics:", error);
    res.status(500).send("Failed to retrieve data");
  }
});

// -------emergency---------------------------------------
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
      pool.query(fieldingQuery, [playerId, teamId, teamId]),
    ]);

    // Prepare the response
    res.json({
      playerId: playerId,
      teamId: teamId,
      batting: battingStats[0],
      bowling: bowlingStats[0],
      fielding: fieldingStats[0],
    });
  } catch (error) {
    console.error("Error fetching player stats:", error);
    res.status(500).send("Failed to retrieve data");
  }
});
//emergency-----------------------------------------

// chasing preffered api

app.get("/venue-stats-last-five/:venueId", async (req, res) => {
  const { venueId } = req.params;

  try {
    const query = `
          SELECT 
              COUNT(*) AS total_matches,
              SUM(CASE 
                  WHEN (m.toss_decision = 1 AND m.winning_team_id = m.team_1) OR
                       (m.toss_decision = 2 AND m.winning_team_id = m.team_2) THEN 1 
                  ELSE 0 END) AS wins_batting_first,
              SUM(CASE 
                  WHEN (m.toss_decision = 2 AND m.winning_team_id = m.team_1) OR
                       (m.toss_decision = 1 AND m.winning_team_id = m.team_2) THEN 1 
                  ELSE 0 END) AS wins_chasing,
              GROUP_CONCAT(m.id) AS match_ids
          FROM (
            SELECT * FROM matches 
            WHERE venue_id = ? 
            ORDER BY date_start DESC
            LIMIT 5
          ) AS m;
      `;

    const [results] = await pool.query(query, [venueId]);
    if (results.length === 0) {
      return res.status(404).send("No matches found at the specified venue.");
    }

    const result = results[0];
    res.json({
      total_matches: result.total_matches,
      wins_batting_first: result.wins_batting_first,
      wins_chasing: result.wins_chasing,
      match_ids: result.match_ids ? result.match_ids.split(",") : [],
    });
  } catch (error) {
    console.error("Error fetching last five match statistics:", error);
    res.status(500).send("Failed to retrieve data");
  }
});

//toss trend last 5 matches

app.get("/venue/:venueId/stats", async (req, res) => {
  const { venueId } = req.params;
  const competitionId = 128471; // Assuming competition ID for IPL 2023 is 128471

  try {
    // Query to get various statistics
    const query = `
      SELECT 
        COUNT(*) AS total_matches,
        SUM(CASE WHEN m.toss_winner = m.winning_team_id THEN 1 ELSE 0 END) AS wins_after_winning_toss,
        SUM(CASE WHEN m.toss_winner != m.winning_team_id THEN 1 ELSE 0 END) AS wins_after_losing_toss,
        SUM(CASE WHEN m.toss_decision = 1 AND m.toss_winner = m.winning_team_id THEN 1 ELSE 0 END) AS wins_batting_first_after_winning_toss,
        SUM(CASE WHEN m.toss_decision = 2 AND m.toss_winner = m.winning_team_id THEN 1 ELSE 0 END) AS wins_bowling_first_after_winning_toss,
        SUM(CASE WHEN m.toss_decision = 1 THEN 1 ELSE 0 END) AS chose_to_bat_first,
        SUM(CASE WHEN m.toss_decision = 2 THEN 1 ELSE 0 END) AS chose_to_bowl_first,
        GROUP_CONCAT(DISTINCT m.id) AS match_ids,
        SUM(CASE WHEN (m.team_1 = m.winning_team_id AND mi.inning_number = 1) OR
                        (m.team_2 = m.winning_team_id AND mi.inning_number = 2) THEN 1 ELSE 0 END) AS wins_batting_first,
        SUM(CASE WHEN (m.team_2 = m.winning_team_id AND mi.inning_number = 1) OR
                        (m.team_1 = m.winning_team_id AND mi.inning_number = 2) THEN 1 ELSE 0 END) AS wins_chasing
      FROM matches m
      LEFT JOIN match_innings_test mi ON m.id = mi.match_id
      WHERE m.venue_id = ? 
      GROUP BY m.venue_id;
    `;

    const [results] = await pool.query(query, [venueId]);
    if (results.length === 0) {
      return res.status(404).send("No matches found");
    }

    const stats = results[0];
    stats.wins_without_toss_consideration = {
      batting_first: stats.wins_batting_first,
      chasing: stats.wins_chasing
    };

    // Remove the redundant fields to clean up the JSON response
    delete stats.wins_batting_first;
    delete stats.wins_chasing;

    res.json(stats); // Return the combined statistics as JSON
  } catch (error) {
    console.error("Error fetching venue statistics:", error);
    res.status(500).send("Failed to retrieve data");
  }
});


// matches and there top player  accoording to last 5 matches at this venue

app.get("/venue/:venueId/top-players", async (req, res) => {
  const { venueId } = req.params;

  try {
    // Fetch the last five matches at the specified venue
    const [matches] = await pool.query(
      `
          SELECT id AS match_id, status_note
          FROM matches
          WHERE venue_id = ? 
          ORDER BY date_start DESC
          LIMIT 5
      `,
      [venueId]
    );

    if (matches.length === 0) {
      return res.status(404).send("No matches found at this venue.");
    }

    // For each match, fetch the top 5 players along with their team and player short names
    const playerQueries = matches.map((match) =>
      pool.query(
        `
              SELECT 
                  p.id AS player_id,
                  p.playing_role,
                  p.short_name AS player_short_name,
                  CONCAT(p.first_name, ' ', p.last_name) AS player_name,
                  t.name AS team_name,
                  t.short_name AS team_short_name,
                  fp.points AS fantasy_points,
                  m.id AS match_id
              FROM fantasy_points_details fp
              JOIN players p ON fp.player_id = p.id
              JOIN team_players tp ON p.id = tp.player_id
              JOIN teams t ON tp.team_id = t.id
              JOIN matches m ON fp.match_id = m.id
              WHERE fp.match_id = ?
              ORDER BY fp.points DESC
              LIMIT 5
          `,
        [match.match_id]
      )
    );

    // Execute all player queries for each match
    const results = await Promise.all(playerQueries);

    // Structure the final response with match and player details
    const detailedMatches = matches.map((match, index) => ({
      match_id: match.match_id,
      status_note: match.status_note,
      top_players: results[index][0].map((player) => ({
        player_id: player.player_id,
        player_role: player.playing_role,
        player_name: player.player_name,
        player_short_name: player.player_short_name,
        team_name: player.team_name,
        team_short_name: player.team_short_name,
        fantasy_points: player.fantasy_points,
      })),
    }));

    res.json(detailedMatches);
  } catch (error) {
    console.error("Error fetching top players for venue matches:", error);
    res.status(500).send("Failed to retrieve data");
  }
});

// ---------------------------------------------CHEAT SHEET---------------------------------------

// overall  top 5 player according to fp  (last match , last 5 match, all) BETWEEN TWO TEAMS
app.get("/match-stats/teams/:teamId1/:teamId2", async (req, res) => {
  const { teamId1, teamId2 } = req.params;
  const competitionId = 128471; // Example competition ID

  try {
    // Get the IDs of the last five and all matches between the two teams.
    const [matches] = await pool.query(`
      SELECT id FROM matches
      WHERE (team_1 = ? AND team_2 = ?) OR (team_1 = ? AND team_2 = ?)
      ORDER BY date_start DESC
    `, [teamId1, teamId2, teamId2, teamId1, competitionId]);

    const matchIds = matches.map(match => match.id);
    if (matchIds.length === 0) {
      return res.status(404).send("No matches found between the specified teams.");
    }

    const lastMatchId = matchIds[0]; // ID of the most recent match
    const lastFiveMatchIds = matchIds.slice(0, 5);

    // Define a function to fetch top player stats
    const fetchTopPlayers = async (matchIdArray) => {
      return pool.query(`
        SELECT 
          p.id AS player_id,
          CONCAT(p.first_name, ' ', p.last_name) AS player_name,
          t.name AS team_name,
          SUM(fp.points) AS total_fantasy_points,
          COUNT(DISTINCT fp.match_id) AS match_count
        FROM fantasy_points_details fp
        JOIN players p ON fp.player_id = p.id
        JOIN team_players tp ON p.id = tp.player_id
        JOIN teams t ON tp.team_id = t.id
        WHERE fp.match_id IN (?)
        GROUP BY p.id, t.id
        ORDER BY total_fantasy_points DESC
        LIMIT 10
      `, [matchIdArray]);
    };

    // Fetch player stats for last match, last five matches, and all matches
    const [playersLastMatch, playersLastFiveMatches, playersAllMatches] = await Promise.all([
      fetchTopPlayers([lastMatchId]),
      fetchTopPlayers(lastFiveMatchIds),
      fetchTopPlayers(matchIds)
    ]);

    res.json({
      last_match: {
        match_id: lastMatchId,
        players: playersLastMatch[0]
      },
      last_five_matches: {
        match_ids: lastFiveMatchIds,
        players: playersLastFiveMatches[0]
      },
      all_matches: {
        match_ids: matchIds,
        players: playersAllMatches[0]
      }
    });
  } catch (error) {
    console.error("Error fetching match statistics and top players:", error);
    res.status(500).send("Failed to retrieve data");
  }
});

app.get("/match-stats/teams/:teamId1/:teamId2/:specificTeamId", async (req, res) => {
  const { teamId1, teamId2, specificTeamId } = req.params;
  const competitionId = 128471; // Example competition ID

  try {
    // Get the IDs of the last five and all matches between the two teams.
    const [matches] = await pool.query(`
      SELECT id FROM matches
      WHERE (team_1 = ? AND team_2 = ?) OR (team_1 = ? AND team_2 = ?)
      ORDER BY date_start DESC
    `, [teamId1, teamId2, teamId2, teamId1]);

    const matchIds = matches.map(match => match.id);
    if (matchIds.length === 0) {
      return res.status(404).send("No matches found between the specified teams.");
    }

    const lastMatchId = matchIds[0]; // ID of the most recent match
    const lastFiveMatchIds = matchIds.slice(0, 5);

    // Define a function to fetch top player stats
    const fetchTopPlayers = async (matchIdArray, teamId) => {
      return pool.query(`
        SELECT 
          p.id AS player_id,
          CONCAT(p.first_name, ' ', p.last_name) AS player_name,
          t.name AS team_name,
          SUM(fp.points) AS total_fantasy_points,
          COUNT(DISTINCT fp.match_id) AS match_count
        FROM fantasy_points_details fp
        JOIN players p ON fp.player_id = p.id
        JOIN team_players tp ON p.id = tp.player_id
        JOIN teams t ON tp.team_id = t.id
        WHERE fp.match_id IN (?)
        AND tp.team_id = ?
        GROUP BY p.id, t.id
        ORDER BY total_fantasy_points DESC
        LIMIT 10
      `, [matchIdArray, teamId]);
    };

    // Fetch player stats for last match, last five matches, and all matches for the specific team
    const [playersLastMatchSpecificTeam, playersLastFiveMatchesSpecificTeam, playersAllMatchesSpecificTeam] = await Promise.all([
      fetchTopPlayers([lastMatchId], specificTeamId),
      fetchTopPlayers(lastFiveMatchIds, specificTeamId),
      fetchTopPlayers(matchIds, specificTeamId)
    ]);

    res.json({
      last_match_specific_team: {
        match_id: lastMatchId,
        players: playersLastMatchSpecificTeam[0]
      },
      last_five_matches_specific_team: {
        match_ids: lastFiveMatchIds,
        players: playersLastFiveMatchesSpecificTeam[0]
      },
      all_matches_specific_team: {
        match_ids: matchIds,
        players: playersAllMatchesSpecificTeam[0]
      }
    });
  } catch (error) {
    console.error("Error fetching match statistics and top players:", error);
    res.status(500).send("Failed to retrieve data");
  }
});

app.get("/dream-team-stats/:teamId1/:teamId2", async (req, res) => {
  const { teamId1, teamId2 } = req.params;
  const competitionId = 128471; // Assuming competition ID for IPL 2023

  try {
    // Get match IDs for last match, last five matches, and all matches between the two teams.
    const getMatchIds = async (limit) => {
      const query = `
        SELECT id FROM matches
        WHERE ((team_1 = ? AND team_2 = ?) OR (team_1 = ? AND team_2 = ?))
        ORDER BY date_start DESC
        ${limit ? `LIMIT ${limit}` : ''}
      `;
      const [matches] = await pool.query(query, [teamId1, teamId2, teamId2, teamId1]);
      return matches.map(m => m.id);
    };

    // Fetch match IDs
    const lastMatchIds = await getMatchIds(1);
    const lastFiveMatchIds = await getMatchIds(5);
    const allMatchIds = await getMatchIds();

    // Helper function to get dream team occurrences
    const getDreamTeamOccurrences = async (matchIds) => {
      if (matchIds.length === 0) return [];
      const [occurrences] = await pool.query(`
        SELECT 
          dt.player_id, 
          p.first_name, 
          p.last_name, 
          COUNT(*) AS occurrences,
          COUNT(DISTINCT dt.match_id) AS match_count,
          GROUP_CONCAT(DISTINCT dt.match_id ORDER BY dt.match_id) AS match_ids,
          SUM(dt.points) AS total_points
        FROM DreamTeam_test dt
        JOIN players p ON dt.player_id = p.id
        WHERE dt.match_id IN (?)
        GROUP BY dt.player_id
        ORDER BY occurrences DESC, total_points DESC
        LIMIT 11
      `, [matchIds]);
      return occurrences;
    };

    // Get dream team occurrences for top players
    const dreamTeamStats = {
      lastMatch: await getDreamTeamOccurrences(lastMatchIds),
      lastFiveMatches: await getDreamTeamOccurrences(lastFiveMatchIds),
      overall: await getDreamTeamOccurrences(allMatchIds)
    };

    res.json({
      dream_team_stats: {
        last_match: dreamTeamStats.lastMatch,
        last_five_matches: dreamTeamStats.lastFiveMatches,
        overall: dreamTeamStats.overall
      }
    });
  } catch (error) {
    console.error("Error fetching dream team statistics:", error);
    res.status(500).send("Failed to retrieve data");
  }
});



//TEAM RANK

app.get("/team-performance/:teamId", async (req, res) => {
  const { teamId } = req.params;
  const competitionId = 128471; // Assuming a specific competition ID for context

  try {
    // Fetch the IDs of the last five and all matches for this team in the competition.
    const [matches] = await pool.query(`
      SELECT id, date_start FROM matches
      WHERE (team_1 = ? OR team_2 = ?) 
      ORDER BY date_start DESC
    `, [teamId, teamId]);

    const matchIds = matches.map(match => match.id);
    if (matchIds.length === 0) {
      return res.status(404).send("No matches found for the specified team.");
    }

    const lastMatchId = matchIds[0];
    const lastFiveMatchIds = matchIds.slice(0, 5);

    // Define a function to fetch top player stats for specific matches
    const fetchTopPlayers = async (matchIdArray) => {
      return pool.query(`
        SELECT 
          p.id AS player_id,
          CONCAT(p.first_name, ' ', p.last_name) AS player_name,
          p.short_name AS player_short_name,
          t.name AS team_name,
          t.short_name AS team_short_name,
          SUM(fp.points) AS total_fantasy_points,
          COUNT(DISTINCT fp.match_id) AS match_count
        FROM fantasy_points_details fp
        JOIN players p ON fp.player_id = p.id
        JOIN team_players tp ON p.id = tp.player_id
        JOIN teams t ON tp.team_id = t.id
        WHERE fp.match_id IN (?) AND tp.team_id = ?
        GROUP BY p.id, t.id
        ORDER BY total_fantasy_points DESC
        LIMIT 5
      `, [matchIdArray, teamId]);
    };

    // Fetch top player stats for the last match, last five matches, and all matches
    const [playersLastMatch, playersLastFiveMatches, playersAllMatches] = await Promise.all([
      fetchTopPlayers([lastMatchId]),
      fetchTopPlayers(lastFiveMatchIds),
      fetchTopPlayers(matchIds)
    ]);

    res.json({
      team_id: teamId,
      last_match: playersLastMatch[0],
      last_five_matches: playersLastFiveMatches[0],
      all_matches: playersAllMatches[0]
    });
  } catch (error) {
    console.error("Error fetching top players and team performance:", error);
    res.status(500).send("Failed to retrieve data");
  }
});




// POSITION RANK  

app.get("/top-players-by-position/:teamId/:position", async (req, res) => {
  const { teamId, position } = req.params;
  const validPositions = ['WK', 'BAT', 'AR', 'BOW'];
  const competitionId = 128471; // Assuming a specific competition ID for context

  if (!validPositions.includes(position)) {
    return res.status(400).send("Invalid position specified");
  }

  try {
    // Fetch all match IDs for this team in the competition, ordered by date.
    const [matches] = await pool.query(`
      SELECT id FROM matches
      WHERE (team_1 = ? OR team_2 = ?) 
      ORDER BY date_start DESC
    `, [teamId, teamId]);

    const matchIds = matches.map(match => match.id);
    if (matchIds.length === 0) {
      return res.status(404).send("No matches found for the specified team in the specified competition.");
    }

    const lastMatchIds = [matchIds[0]];
    const lastFiveMatchIds = matchIds.slice(0, 5);

    // Define a function to fetch top players for given match IDs
    const fetchTopPlayers = async (matchIdArray) => {
      return pool.query(`
        SELECT 
          p.id AS player_id,
          CONCAT(p.first_name, ' ', p.last_name) AS player_name,
          p.short_name AS player_short_name,
          SUM(fp.points) AS total_fantasy_points
        FROM fantasy_points_details fp
        JOIN players p ON fp.player_id = p.id
        JOIN team_players tp ON p.id = tp.player_id
        WHERE fp.match_id IN (?) AND tp.team_id = ? AND p.playing_role = ?
        GROUP BY p.id
        ORDER BY total_fantasy_points DESC
        LIMIT 5
      `, [matchIdArray, teamId, position]);
    };

    // Fetch top player stats for the last match, last five matches, and all matches
    const [playersLastMatch, playersLastFiveMatches, playersAllMatches] = await Promise.all([
      fetchTopPlayers(lastMatchIds),
      fetchTopPlayers(lastFiveMatchIds),
      fetchTopPlayers(matchIds)
    ]);

    res.json({
      team_id: teamId,
      position: position,
      last_match: playersLastMatch[0],
      last_five_matches: playersLastFiveMatches[0],
      all_matches: playersAllMatches[0]
    });
  } catch (error) {
    console.error("Error fetching top players by position:", error);
    res.status(500).send("Failed to retrieve data");
  }
});




// MOST VALUABLE PLAYER 

app.get("/most-valuable-players/:teamA/:teamB", async (req, res) => {
  const { teamA, teamB } = req.params;
  const competitionId = 128471; // Static competition ID

  try {
    // Fetch all match IDs for the specified teams in the competition, ordered by date.
    const [matches] = await pool.query(`
      SELECT id FROM matches
      WHERE (team_1 IN (?, ?) AND team_2 IN (?, ?))
      ORDER BY date_start DESC
    `, [ teamA, teamB, teamA, teamB]);

    const matchIds = matches.map(match => match.id);
    if (matchIds.length === 0) {
      return res.status(404).send("No matches found for the specified teams in this competition.");
    }

    const lastMatchIds = [matchIds[0]]; // Most recent match
    const lastFiveMatchIds = matchIds.slice(0, 5); // Last five matches

    // Function to fetch players with their total points and salary normalized points.
    const fetchValuablePlayers = async (matchIdArray, teamId = null) => {
      let query = `
        SELECT 
          p.id AS player_id,
          CONCAT(p.first_name, ' ', p.last_name) AS player_name,
          p.short_name AS player_short_name,
          MAX(t.name) AS team_name,
          MAX(t.short_name) AS team_short_name,
          SUM(fp.points) AS total_points,
          p.fantasy_player_rating,
          ROUND(SUM(fp.points) / p.fantasy_player_rating, 2) AS points_per_million
        FROM fantasy_points_details fp
        JOIN players p ON fp.player_id = p.id
        JOIN team_players tp ON p.id = tp.player_id
        JOIN teams t ON tp.team_id = t.id
        WHERE fp.match_id IN (?) 
      `;

      if (teamId) {
        query += ` AND tp.team_id = ?`;
      }

      query += `
        GROUP BY p.id, p.first_name, p.last_name, p.short_name, p.fantasy_player_rating
        ORDER BY points_per_million DESC
        LIMIT 5
      `;

      return pool.query(query, teamId ? [matchIdArray, teamId] : [matchIdArray]);
    };

    // Fetch top player stats for the last match, last five matches, and all matches
    const results = await Promise.all([
      fetchValuablePlayers(lastMatchIds),
      fetchValuablePlayers(lastFiveMatchIds),
      fetchValuablePlayers(matchIds),
      fetchValuablePlayers(lastMatchIds, teamA),
      fetchValuablePlayers(lastFiveMatchIds, teamA),
      fetchValuablePlayers(matchIds, teamA),
      fetchValuablePlayers(lastMatchIds, teamB),
      fetchValuablePlayers(lastFiveMatchIds, teamB),
      fetchValuablePlayers(matchIds, teamB)
    ]);

    res.json({
      competition_id: competitionId,
      last_match: {
        both_teams: results[0][0],
        team_a: results[3][0],
        team_b: results[6][0]
      },
      last_five_matches: {
        both_teams: results[1][0],
        team_a: results[4][0],
        team_b: results[7][0]
      },
      all_matches: {
        both_teams: results[2][0],
        team_a: results[5][0],
        team_b: results[8][0]
      }
    });
  } catch (error) {
    console.error("Error fetching the most valuable players:", error);
    res.status(500).send("Failed to retrieve data");
  }
});


app.get("/bottom-players/:teamA/:teamB", async (req, res) => {
  const { teamA, teamB } = req.params;
  const competitionId = 128471; // Static competition ID

  try {
    // Fetch all match IDs for the specified teams in the competition, ordered by date.
    const [matches] = await pool.query(`
      SELECT id FROM matches
      WHERE ((team_1 = ? AND team_2 = ?) OR (team_1 = ? AND team_2 = ?))
      ORDER BY date_start DESC
    `, [ teamA, teamB, teamB, teamA]);

    const matchIds = matches.map(match => match.id);
    if (matchIds.length === 0) {
      return res.status(404).send("No matches found for the specified teams in this competition.");
    }

    // Function to fetch bottom players based on performance relative to potential.
    const fetchBottomPlayers = async (matchIdArray, teamId = null) => {
      let query = `
        SELECT 
          p.id AS player_id,
          CONCAT(p.first_name, ' ', p.last_name) AS player_name,
          p.short_name AS player_short_name,
          t.name AS team_name,
          t.short_name AS team_short_name,
          AVG(fp.points) OVER (PARTITION BY p.id ORDER BY m.date_start ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS avg_points,
          SUM(fp.points) AS total_points,
          (SUM(fp.points) - AVG(fp.points) OVER (PARTITION BY p.id ORDER BY m.date_start ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)) AS performance_diff
        FROM fantasy_points_details fp
        JOIN players p ON fp.player_id = p.id
        JOIN team_players tp ON p.id = tp.player_id
        JOIN teams t ON tp.team_id = t.id
        JOIN matches m ON fp.match_id = m.id
        WHERE fp.match_id IN (?)
      `;

      if (teamId) {
        query += ` AND tp.team_id = ?`;
      }

      query += `
        GROUP BY p.id, t.id
        ORDER BY performance_diff ASC
        LIMIT 3
      `;

      return pool.query(query, teamId ? [matchIdArray, teamId] : [matchIdArray]);
    };

    // Fetch bottom player stats for both teams combined, and each team individually
    const [playersBothTeams, playersTeamA, playersTeamB] = await Promise.all([
      fetchBottomPlayers(matchIds),
      fetchBottomPlayers(matchIds, teamA),
      fetchBottomPlayers(matchIds, teamB)
    ]);

    res.json({
      competition_id: competitionId,
      both_teams: playersBothTeams[0],
      team_a: playersTeamA[0],
      team_b: playersTeamB[0]
    });
  } catch (error) {
    console.error("Error fetching the bottom players:", error);
    res.status(500).send("Failed to retrieve data");
  }
});







// -----------------------------------CHEATSHEET-----------------------------------------------










// ------------------------------------playground  stats-------------------------------------------------

// app.get("/api/players/stats", async (req, res) => {
//   const { statType, timeFrame, venueId, battingScenario, teamId1, teamId2 } = req.query;

//   let selectClause, joinClause = '', whereClause = 'WHERE 1=1', orderByClause = '', groupByClause = 'GROUP BY p.id, p.first_name, p.last_name, p.short_name, t.name, t.short_name';

//   switch (statType) {
//       case 'TotalFantasyPoints':
//           selectClause = 'SUM(fp.points) AS total_points, COUNT(DISTINCT fp.match_id) AS match_count';
//           orderByClause = 'ORDER BY total_points DESC';
//           break;
//       case 'DreamTeamAppearances':
//           selectClause = 'COUNT(DISTINCT dt.id) AS dream_team_appearances, COUNT(DISTINCT dt.match_id) AS match_count';
//           joinClause = ' LEFT JOIN DreamTeam_test dt ON p.id = dt.player_id AND fp.match_id = dt.match_id';
//           orderByClause = 'ORDER BY dream_team_appearances DESC';
//           break;
//       case 'WicketsTaken':
//           selectClause = 'SUM(b.wickets) AS wickets_taken, COUNT(DISTINCT b.match_id) AS match_count';
//           joinClause = ' JOIN match_inning_bowlers_test b ON p.id = b.bowler_id AND fp.match_id = b.match_id';
//           orderByClause = 'ORDER BY wickets_taken DESC';
//           break;
//       case 'RunsScored':
//           selectClause = 'SUM(fb.runs) AS total_runs, COUNT(DISTINCT fb.match_id) AS match_count';
//           joinClause = ' JOIN match_inning_batters_test fb ON p.id = fb.batsman_id AND fb.match_id = fp.match_id';
//           orderByClause = 'ORDER BY total_runs DESC';
//           break;
//       case 'StrikeRate':
//           selectClause = 'AVG(fb.strike_rate) AS average_strike_rate, COUNT(DISTINCT fb.match_id) AS match_count';
//           joinClause = ' JOIN match_inning_batters_test fb ON p.id = fb.batsman_id AND fb.match_id = fp.match_id';
//           orderByClause = 'ORDER BY average_strike_rate DESC';
//           break;
//       case 'EconomyRate':
//           selectClause = 'AVG(b.econ) AS average_economy_rate, COUNT(DISTINCT b.match_id) AS match_count';
//           joinClause = ' JOIN match_inning_bowlers_test b ON p.id = b.bowler_id AND b.match_id = fp.match_id';
//           orderByClause = 'ORDER BY average_economy_rate ASC';
//           break;
//       case 'FieldingPoints':
//           selectClause = 'SUM(f.catches * 10 + f.runout_thrower * 10 + f.runout_catcher * 10 + f.runout_direct_hit * 20 + f.stumping * 15) AS fielding_points, COUNT(DISTINCT f.match_id) AS match_count';
//           joinClause = ' JOIN match_inning_fielders_test f ON p.id = f.fielder_id AND f.match_id = fp.match_id';
//           orderByClause = 'ORDER BY fielding_points DESC';
//           break;
//       case 'AverageFantasyPoints':
//           selectClause = 'AVG(fp.points) AS avg_fantasy_points, COUNT(DISTINCT fp.match_id) AS match_count';
//           orderByClause = 'ORDER BY avg_fantasy_points DESC';
//           break;
//   }

//   if (timeFrame) {
//       const days = timeFrame === 'Last5Matches' ? 35 : timeFrame === 'Last10Matches' ? 70 : 0;
//       if (days > 0) {
//           whereClause += ` AND m.date_start >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)`;
//       }
//   }

//   if (venueId) {
//       whereClause += ` AND m.venue_id = ${venueId}`;
//   }

//   if (battingScenario) {
//       const team = battingScenario.split(' ')[0];
//       const action = battingScenario.split(' ')[1];
//       const teamIdClause = `(SELECT id FROM teams WHERE short_name = '${team}')`;
//       whereClause += ` AND ${action === 'first' ? 'm.team_1 = ' : 'm.team_2 = '} ${teamIdClause}`;
//   }

//   if (teamId1 && teamId2) {
//       whereClause += ` AND ((m.team_1 = ${teamId1} AND m.team_2 = ${teamId2}) OR (m.team_1 = ${teamId2} AND m.team_2 = ${teamId1}))`;
//   }

//   const sql = `
//       SELECT p.id, p.first_name, p.short_name, p.last_name, ${selectClause}, t.name AS team_name, t.short_name AS team_short_name
//       FROM players p
//       JOIN team_players tp ON p.id = tp.player_id
//       JOIN teams t ON tp.team_id = t.id
//       JOIN fantasy_points_details fp ON p.id = fp.player_id
//       JOIN matches m ON fp.match_id = m.id
//       ${joinClause}
//       ${whereClause}
//       ${groupByClause}
//       ${orderByClause}
//       LIMIT 100;
//   `;

//   try {
//       const [results] = await pool.query(sql);
//       res.json(results);
//   } catch (error) {
//       console.error("Error fetching player stats:", error);
//       res.status(500).send("Failed to retrieve data");
//   }
// });

app.get("/api/players/stats", async (req, res) => {
  const { statType, timeFrame, venueId, battingScenario, teamId1, teamId2 } = req.query;

  if (!teamId1 || !teamId2) {
    return res.status(400).send("Team IDs are required");
  }

  let selectClause, joinClause = '', whereClause = 'WHERE 1=1', orderByClause = '', groupByClause = 'GROUP BY p.id, p.first_name, p.last_name, p.short_name, p.playing_role, t.name, t.short_name';

  switch (statType) {
    case 'TotalFantasyPoints':
      selectClause = 'SUM(fp.points) AS total_points, COUNT(DISTINCT fp.match_id) AS match_count';
      orderByClause = 'ORDER BY total_points DESC';
      break;
    case 'DreamTeamAppearances':
      selectClause = 'COUNT(DISTINCT dt.id) AS dream_team_appearances, COUNT(DISTINCT dt.match_id) AS match_count';
      joinClause = ' LEFT JOIN DreamTeam_test dt ON p.id = dt.player_id AND fp.match_id = dt.match_id';
      orderByClause = 'ORDER BY dream_team_appearances DESC';
      break;
    case 'WicketsTaken':
      selectClause = 'SUM(b.wickets) AS wickets_taken, COUNT(DISTINCT b.match_id) AS match_count';
      joinClause = ' JOIN match_inning_bowlers_test b ON p.id = b.bowler_id AND fp.match_id = b.match_id';
      orderByClause = 'ORDER BY wickets_taken DESC';
      break;
    case 'RunsScored':
      selectClause = 'SUM(fb.runs) AS total_runs, COUNT(DISTINCT fb.match_id) AS match_count';
      joinClause = ' JOIN match_inning_batters_test fb ON p.id = fb.batsman_id AND fb.match_id = fp.match_id';
      orderByClause = 'ORDER BY total_runs DESC';
      break;
    case 'StrikeRate':
      selectClause = 'AVG(fb.strike_rate) AS average_strike_rate, COUNT(DISTINCT fb.match_id) AS match_count';
      joinClause = ' JOIN match_inning_batters_test fb ON p.id = fb.batsman_id AND fb.match_id = fp.match_id';
      orderByClause = 'ORDER BY average_strike_rate DESC';
      break;
    case 'EconomyRate':
      selectClause = 'AVG(b.econ) AS average_economy_rate, COUNT(DISTINCT b.match_id) AS match_count';
      joinClause = ' JOIN match_inning_bowlers_test b ON p.id = b.bowler_id AND b.match_id = fp.match_id';
      orderByClause = 'ORDER BY average_economy_rate ASC';
      break;
    case 'FieldingPoints':
      selectClause = 'SUM(f.catches * 10 + f.runout_thrower * 10 + f.runout_catcher * 10 + f.runout_direct_hit * 20 + f.stumping * 15) AS fielding_points, COUNT(DISTINCT f.match_id) AS match_count';
      joinClause = ' JOIN match_inning_fielders_test f ON p.id = f.fielder_id AND f.match_id = fp.match_id';
      orderByClause = 'ORDER BY fielding_points DESC';
      break;
    case 'AverageFantasyPoints':
      selectClause = 'AVG(fp.points) AS avg_fantasy_points, COUNT(DISTINCT fp.match_id) AS match_count';
      orderByClause = 'ORDER BY avg_fantasy_points DESC';
      break;
  }

  if (timeFrame) {
    const days = timeFrame === 'Last5Matches' ? 35 : timeFrame === 'Last10Matches' ? 70 : 0;
    if (days > 0) {
      whereClause += ` AND m.date_start >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)`;
    }
  }

  if (venueId) {
    whereClause += ` AND m.venue_id = ${venueId}`;
  }

  if (battingScenario) {
    const team = battingScenario.split(' ')[0];
    const action = battingScenario.split(' ')[1];
    const teamIdClause = `(SELECT id FROM teams WHERE short_name = '${team}')`;
    whereClause += ` AND ${action === 'first' ? 'm.team_1 = ' : 'm.team_2 = '} ${teamIdClause}`;
  }

  whereClause += ` AND ((m.team_1 = ${teamId1} AND m.team_2 = ${teamId2}) OR (m.team_1 = ${teamId2} AND m.team_2 = ${teamId1})) AND (tp.team_id = ${teamId1} OR tp.team_id = ${teamId2})`;

  const sql = `
    SELECT p.id, p.first_name, p.short_name, p.last_name, p.playing_role, ${selectClause}, t.name AS team_name, t.short_name AS team_short_name
    FROM players p
    JOIN team_players tp ON p.id = tp.player_id
    JOIN teams t ON tp.team_id = t.id
    JOIN fantasy_points_details fp ON p.id = fp.player_id
    JOIN matches m ON fp.match_id = m.id
    ${joinClause}
    ${whereClause}
    ${groupByClause}
    ${orderByClause}
    LIMIT 100;
  `;

  try {
    const [results] = await pool.query(sql);
    res.json(results);
  } catch (error) {
    console.error("Error fetching player stats:", error);
    res.status(500).send("Failed to retrieve data");
  }
});
















// ---------------------------------------------TEAM HEAD TO HEAD--------------------------------------

app.get('/api/match/stats', async (req, res) => {
  const { team1Id, team2Id } = req.query;
  const competitionId = 128471; // Static competition ID

  // Validate input
  if (!team1Id || !team2Id) {
      return res.status(400).json({ error: "Both team1Id and team2Id query parameters are required." });
  }

  // SQL query
  const query = `
      SELECT
          teams.name AS team_name,
          COUNT(m.id) AS total_matches,
          SUM(CASE WHEN m.winning_team_id = teams.id THEN 1 ELSE 0 END) AS total_wins,
          ROUND(AVG(CASE WHEN m.team_1 = teams.id THEN CAST(SUBSTRING_INDEX(m.team_1_score, '/', 1) AS UNSIGNED)
                   WHEN m.team_2 = teams.id THEN CAST(SUBSTRING_INDEX(m.team_2_score, '/', 1) AS UNSIGNED)
                   ELSE NULL END)) AS avg_runs,
          ROUND(MAX(CASE WHEN m.team_1 = teams.id THEN CAST(SUBSTRING_INDEX(m.team_1_score, '/', 1) AS UNSIGNED)
                   WHEN m.team_2 = teams.id THEN CAST(SUBSTRING_INDEX(m.team_2_score, '/', 1) AS UNSIGNED)
                   ELSE NULL END)) AS max_runs,
          ROUND(MIN(CASE WHEN m.team_1 = teams.id THEN CAST(SUBSTRING_INDEX(m.team_1_score, '/', 1) AS UNSIGNED)
                   WHEN m.team_2 = teams.id THEN CAST(SUBSTRING_INDEX(m.team_2_score, '/', 1) AS UNSIGNED)
                   ELSE NULL END)) AS min_runs
      FROM teams
      LEFT JOIN matches m ON (m.team_1 = teams.id OR m.team_2 = teams.id)
          AND m.status_str = 'Completed'
          AND ((m.team_1 = ? AND m.team_2 = ?) OR (m.team_1 = ? AND m.team_2 = ?))
      WHERE teams.id IN (?, ?)
      GROUP BY teams.name
      ORDER BY teams.name;
  `;

  try {
      const params = [team1Id, team2Id, team2Id, team1Id, team1Id, team2Id];
      const [results] = await pool.query(query, params);

      // Format the response
      const formattedResults = results.map(result => ({
          team_name: result.team_name,
          total_matches: parseInt(result.total_matches, 10),
          total_wins: parseInt(result.total_wins, 10),
          avg_runs: parseInt(result.avg_runs, 10),
          max_runs: parseInt(result.max_runs, 10),
          min_runs: parseInt(result.min_runs, 10)
      }));

      res.json(formattedResults);
  } catch (error) {
      console.error('Database query failed:', error);
      res.status(500).json({ error: 'Database query failed' });
  }
});



app.get('/api/match/stats/batting-first', async (req, res) => {
  const { team1Id, team2Id } = req.query;

  if (!team1Id || !team2Id) {
    return res.status(400).json({ error: "Both team1Id and team2Id query parameters are required." });
  }

  const query = `
      SELECT
          teams.id AS team_id,
          teams.name AS team_name,
          'Batted First' AS batting_order,
          COUNT(m.id) AS total_matches,
          SUM(CASE WHEN m.winning_team_id = teams.id THEN 1 ELSE 0 END) AS wins,
          ROUND(AVG(CASE WHEN teams.id = m.team_1 THEN CAST(SUBSTRING_INDEX(m.team_1_score, '/', 1) AS UNSIGNED)
                         ELSE CAST(SUBSTRING_INDEX(m.team_2_score, '/', 1) AS UNSIGNED) END), 0) AS avg_runs,
          ROUND(MAX(CASE WHEN teams.id = m.team_1 THEN CAST(SUBSTRING_INDEX(m.team_1_score, '/', 1) AS UNSIGNED)
                         ELSE CAST(SUBSTRING_INDEX(m.team_2_score, '/', 1) AS UNSIGNED) END), 0) AS max_runs,
          ROUND(MIN(CASE WHEN teams.id = m.team_1 THEN CAST(SUBSTRING_INDEX(m.team_1_score, '/', 1) AS UNSIGNED)
                         ELSE CAST(SUBSTRING_INDEX(m.team_2_score, '/', 1) AS UNSIGNED) END), 0) AS min_runs
      FROM teams
      JOIN matches m ON (m.team_1 = teams.id OR m.team_2 = teams.id)
          AND m.status_str = 'Completed'
          AND ((m.team_1 = ? AND m.team_2 = ?) OR (m.team_1 = ? AND m.team_2 = ?))
          AND (
            (m.toss_winner = teams.id AND m.toss_decision = 1) OR
            (m.toss_winner != teams.id AND m.toss_decision = 2)
          )
      WHERE teams.id IN (?, ?)
      GROUP BY teams.id, teams.name
      ORDER BY teams.name;
  `;

  try {
    const params = [team1Id, team2Id, team2Id, team1Id, team1Id, team2Id];
    const [results] = await pool.query(query, params);
    res.json(results.map(result => ({
      team_id: result.team_id,
      team_name: result.team_name,
      batting_order: result.batting_order,
      total_matches: result.total_matches,
      wins: result.wins,
      avg_runs: result.avg_runs,
      max_runs: result.max_runs,
      min_runs: result.min_runs
    })));
  } catch (error) {
    console.error('Database query failed:', error);
    res.status(500).json({ error: 'Database query failed' });
  }
});


app.get('/api/match/stats/bowling-first', async (req, res) => {
  const { team1Id, team2Id } = req.query;

  if (!team1Id || !team2Id) {
    return res.status(400).json({ error: "Both team1Id and team2Id query parameters are required." });
  }

  const query = `
      SELECT
          teams.id AS team_id,
          teams.name AS team_name,
          COUNT(m.id) AS total_matches,
          SUM(CASE WHEN m.winning_team_id = teams.id THEN 1 ELSE 0 END) AS wins,
          ROUND(AVG(CASE WHEN teams.id = m.team_2 THEN CAST(SUBSTRING_INDEX(m.team_1_score, '/', 1) AS UNSIGNED)
                         ELSE CAST(SUBSTRING_INDEX(m.team_2_score, '/', 1) AS UNSIGNED) END), 0) AS avg_runs,
          ROUND(MAX(CASE WHEN teams.id = m.team_2 THEN CAST(SUBSTRING_INDEX(m.team_1_score, '/', 1) AS UNSIGNED)
                         ELSE CAST(SUBSTRING_INDEX(m.team_2_score, '/', 1) AS UNSIGNED) END), 0) AS max_runs,
          ROUND(MIN(CASE WHEN teams.id = m.team_2 THEN CAST(SUBSTRING_INDEX(m.team_1_score, '/', 1) AS UNSIGNED)
                         ELSE CAST(SUBSTRING_INDEX(m.team_2_score, '/', 1) AS UNSIGNED) END), 0) AS min_runs
      FROM teams
      JOIN matches m ON (m.team_1 = teams.id OR m.team_2 = teams.id)
          AND m.status_str = 'Completed'
          AND ((m.team_1 = ? AND m.team_2 = ?) OR (m.team_1 = ? AND m.team_2 = ?))
          AND (
            (m.toss_winner = teams.id AND m.toss_decision = 2) OR
            (m.toss_winner != teams.id AND m.toss_decision = 1)
          )
      WHERE teams.id IN (?, ?)
      GROUP BY teams.id, teams.name
      ORDER BY teams.name;
  `;

  try {
    const params = [team1Id, team2Id, team2Id, team1Id, team1Id, team2Id];
    const [results] = await pool.query(query, params);
    res.json(results.map(result => ({
      team_id: result.team_id,
      team_name: result.team_name,
      total_matches: result.total_matches,
      wins: result.wins,
      avg_runs: result.avg_runs,
      max_runs: result.max_runs,
      min_runs: result.min_runs
    })));
  } catch (error) {
    console.error('Database query failed:', error);
    res.status(500).json({ error: 'Database query failed' });
  }
});


app.get('/api/playerstastofteam', async (req, res) => {
  const { team1, team2 } = req.query;

  // Validate query parameters
  if (!team1 || !team2) {
      return res.status(400).json({ error: 'Both team1 and team2 query parameters are required' });
  }

  try {
      const [rows] = await pool.query(`
          SELECT 
              p.first_name AS Player,
              t.name AS Team,
              MIN(m.date_start) AS FirstMatch,
              MAX(m.date_start) AS LastMatch,
              COUNT(DISTINCT m.id) AS Mat,
              COUNT(DISTINCT mi.match_id) AS Inn,
              SUM(b.runs) AS Runs,
              MAX(b.runs) AS Hs
          FROM players p
          JOIN team_players tp ON tp.player_id = p.id
          JOIN teams t ON tp.team_id = t.id
          JOIN match_inning_batters_test b ON p.id = b.batsman_id
          JOIN match_innings_test mi ON mi.match_id = b.match_id AND mi.batting_team_id = t.id
          JOIN matches m ON mi.match_id = m.id
          WHERE (m.team_1 = ? AND m.team_2 = ?) OR (m.team_1 = ? AND m.team_2 = ?)
          GROUP BY p.id, t.name
          ORDER BY Runs DESC
          LIMIT 0, 10000;
      `, [team1, team2, team2, team1]);

      res.json(rows);
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});




// ------------------------------------------------TEAM STATS-------------------------------------------------------
app.get("/api/player/stats1", async (req, res) => {
  const { teamId1, teamId2, timeFrame } = req.query;

  // Convert to integer
  const team1 = parseInt(teamId1, 10);
  const team2 = parseInt(teamId2, 10);
  const limit = timeFrame === "lastMatch" ? 1 : 5;

  // SQL to fetch match IDs
  const matchIdsSql = `
    SELECT id 
    FROM matches 
    WHERE 
      ((team_1 = ? AND team_2 = ?) OR (team_1 = ? AND team_2 = ?)) 
    ORDER BY date_start DESC 
    LIMIT ?
  `;

  try {
    const [matchIdsResults] = await pool.query(matchIdsSql, [team1, team2, team2, team1, limit]);
    const matchIds = matchIdsResults.map(row => row.id);

    if (matchIds.length === 0) {
      return res.json({ player_stats: [] });
    }

    // SQL to fetch player stats
    const playerStatsSql = `
      SELECT
          p.id AS player_id,
          CONCAT(p.first_name, ' ', p.last_name) AS player_name,
          t.name AS team_name,
          p.playing_role AS position,
          fp.rating AS salary,
          SUM(fp.points) AS fantasy_points,
          SUM(fp.runs) AS runs,
          SUM(fp.fours) AS fours,
          SUM(fp.sixes) AS sixes,
          COUNT(CASE WHEN fp.runs >= 50 AND fp.runs < 100 THEN 1 END) AS half_century,
          COUNT(CASE WHEN fp.runs >= 100 THEN 1 END) AS century,
          SUM(fp.wickets) AS wickets,
          SUM(fp.catches) AS catches,
          SUM(fp.maiden_overs) AS maiden_overs
      FROM matches m
      JOIN fantasy_points_details fp ON fp.match_id = m.id
      JOIN players p ON p.id = fp.player_id
      JOIN team_players tp ON p.id = tp.player_id
      JOIN teams t ON tp.team_id = t.id
      WHERE m.id IN (?) AND t.id IN (?, ?)
      GROUP BY p.id, p.first_name, p.last_name, t.name, p.playing_role, fp.rating
      ORDER BY fantasy_points DESC;
    `;

    const [playerStats] = await pool.query(playerStatsSql, [matchIds, team1, team2]);
    res.json({ player_stats: playerStats });
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


app.get('/competitions/:tournamentId', async (req, res) => {
  try {
      const { tournamentId } = req.params;
      const [rows] = await pool.query(
          'SELECT * FROM competitions WHERE tournament_id = ?',
          [tournamentId]
      );
      res.json(rows);
  } catch (error) {
      res.status(500).send('Server error: ' + error.message);
  }
});





// ---------------------------------------api win percentage ------------------------------------------------

app.get('/new/teams/win-percentage/:teamId1/:teamId2', async (req, res) => {
  try {
      const { teamId1, teamId2 } = req.params;
      
      const query = `
          WITH TeamMatches AS (
              SELECT 
                  m.id AS match_id,
                  m.team_1,
                  m.team_2,
                  m.winning_team_id
              FROM 
                  matches m
              WHERE 
                  (m.team_1 = ? AND m.team_2 = ?) OR (m.team_1 = ? AND m.team_2 = ?)
          ),
          TeamStats AS (
              SELECT 
                  ? AS team_id,
                  COUNT(*) AS total_matches,
                  SUM(CASE WHEN tm.winning_team_id = ? THEN 1 ELSE 0 END) AS wins
              FROM 
                  TeamMatches tm
              UNION ALL
              SELECT 
                  ? AS team_id,
                  COUNT(*) AS total_matches,
                  SUM(CASE WHEN tm.winning_team_id = ? THEN 1 ELSE 0 END) AS wins
              FROM 
                  TeamMatches tm
          )
          SELECT 
              team_id,
              total_matches,
              wins,
              (wins / total_matches) * 100 AS win_percentage
          FROM 
              TeamStats;
      `;

      const [rows] = await pool.query(query, [teamId1, teamId2, teamId2, teamId1, teamId1, teamId1, teamId2, teamId2]);
      res.json(rows);
  } catch (error) {
      res.status(500).send('Server error: ' + error.message);
  }
});

// /teams/win-percentage/:teamId1/:teamId2


app.get('/new/teams/player-stats/:teamId1/:teamId2', async (req, res) => {
  const { teamId1, teamId2 } = req.params;

  try {
      const query = `
          WITH TeamMatches AS (
              SELECT 
                  m.id AS match_id,
                  m.team_1,
                  m.team_2,
                  m.winning_team_id
              FROM 
                  matches m
              WHERE 
                  (m.team_1 = ? AND m.team_2 = ?) OR (m.team_1 = ? AND m.team_2 = ?)
          ),
          PlayerStats AS (
              SELECT 
                  ms.player_id,
                  COUNT(DISTINCT tm.match_id) AS total_matches,
                  SUM(CASE WHEN dt.player_id IS NOT NULL THEN 1 ELSE 0 END) AS dream_team_count,
                  SUM(fp.points) / COUNT(DISTINCT tm.match_id) AS points_per_match
              FROM 
                  TeamMatches tm
                  JOIN match_squads ms ON tm.match_id = ms.match_id
                  LEFT JOIN DreamTeam_test dt ON tm.match_id = dt.match_id AND ms.player_id = dt.player_id
                  LEFT JOIN fantasy_points_details fp ON tm.match_id = fp.match_id AND ms.player_id = fp.player_id
              GROUP BY 
                  ms.player_id
              ORDER BY 
                  total_matches DESC
          )
          SELECT 
              ps.player_id,
              p.first_name,
              p.last_name,
              ps.total_matches,
              ps.dream_team_count,
              (ps.dream_team_count / ps.total_matches) * 100 AS dream_team_percentage,
              ps.points_per_match
          FROM 
              PlayerStats ps
              JOIN players p ON ps.player_id = p.id;
      `;

      const [rows] = await pool.query(query,[teamId1, teamId2, teamId2, teamId1]);
      res.json(rows);
  } catch (error) {
      res.status(500).send('Server error: ' + error.message);
  }
});










// -----------------------------------------------------new design apis ---------------------------------------------------


app.get("/new/top-players-stats/:teamId1/:teamId2", async (req, res) => {
  const { teamId1, teamId2 } = req.params;

  try {
      // Fetch top players for the specified teams
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
              COUNT(DISTINCT m.id) AS matches_played, 
              SUM(fp.points) AS total_fantasy_points,
              AVG(fp.runs) AS average_runs,
              MAX(fp.runs) AS max_runs
          FROM players p
          JOIN fantasy_points_details fp ON p.id = fp.player_id
          JOIN teams t ON fp.team_id = t.id
          JOIN matches m ON m.id = fp.match_id 
          WHERE 
              ((m.team_1 = ? AND m.team_2 = ?) OR (m.team_1 = ? AND m.team_2 = ?))
          GROUP BY p.id, p.first_name, p.last_name, p.playing_role, p.short_name, t.name, t.short_name
          ORDER BY SUM(fp.points) DESC
          LIMIT 16
          `,
          [teamId1, teamId2, teamId2, teamId1]
      );

      const playerIdsArray = players.map(player => player.player_id);

      if (playerIdsArray.length === 0) {
          return res.json([]);
      }

      // Fetch detailed statistics for each top player
      const [playerStats] = await pool.query(
          `
          SELECT
              fp.player_id,
              GROUP_CONCAT(DISTINCT m.id) AS match_ids,
              COUNT(DISTINCT m.id) AS matches_played,
              SUM(fp.points) AS total_points,
              AVG(fp.rating) AS average_rating,
              SUM(b.runs) AS total_runs,
              AVG(b.runs) AS average_runs,
              MAX(b.runs) AS max_runs,
              SUM(b.balls_faced) AS total_balls_faced,
              AVG(b.balls_faced) AS average_balls_faced,
              SUM(CASE WHEN b.runs >= 100 THEN 1 ELSE 0 END) AS hundreds,
              SUM(CASE WHEN b.runs >= 50 THEN 1 ELSE 0 END) AS fifties,
              AVG(b.runs * 100.0 / NULLIF(b.balls_faced, 0)) AS strike_rate,
              SUM(bl.overs) AS total_overs_bowled,
              SUM(bl.runs_conceded) AS total_runs_conceded,
              SUM(bl.wickets) AS total_wickets,
              AVG(bl.runs_conceded / NULLIF(bl.overs, 0)) AS economy_rate,
              SUM(COALESCE(fld.catches, 0)) AS total_catches,
              SUM(COALESCE(fld.runout_thrower, 0) + COALESCE(fld.runout_catcher, 0) + COALESCE(fld.runout_direct_hit, 0)) AS total_runouts,
              SUM(COALESCE(fld.stumping, 0)) AS total_stumpings
          FROM 
              matches m
          JOIN fantasy_points_details fp ON m.id = fp.match_id
          JOIN players p ON p.id = fp.player_id
          LEFT JOIN match_inning_batters_test b ON m.id = b.match_id AND fp.player_id = b.batsman_id
          LEFT JOIN match_inning_bowlers_test bl ON m.id = bl.match_id AND fp.player_id = bl.bowler_id
          LEFT JOIN match_inning_fielders_test fld ON m.id = fld.match_id AND fp.player_id = fld.fielder_id
          LEFT JOIN DreamTeam_test dt ON m.id = dt.match_id AND p.id = dt.player_id
          WHERE
              fp.player_id IN (?) AND ((m.team_1 = ? AND m.team_2 = ?) OR (m.team_1 = ? AND m.team_2 = ?))
          GROUP BY
              fp.player_id
          ORDER BY
              total_points DESC;
          `,
          [playerIdsArray, teamId1, teamId2, teamId2, teamId1]
      );

      // Combine top players with their stats
      const topPlayersWithStats = players.map(player => {
          const stats = playerStats.find(stat => stat.player_id === player.player_id);
          return {
              ...player,
              match_ids: stats.match_ids.split(',').map(id => parseInt(id)),
              stats: {
                  matches_played: stats.matches_played,
                  total_points: stats.total_points,
                  average_rating: stats.average_rating,
                  total_runs: stats.total_runs,
                  average_runs: stats.average_runs,
                  max_runs: stats.max_runs,
                  total_balls_faced: stats.total_balls_faced,
                  average_balls_faced: stats.average_balls_faced,
                  hundreds: stats.hundreds,
                  fifties: stats.fifties,
                  strike_rate: stats.strike_rate,
                  total_overs_bowled: stats.total_overs_bowled,
                  total_runs_conceded: stats.total_runs_conceded,
                  total_wickets: stats.total_wickets,
                  economy_rate: stats.economy_rate,
                  total_catches: stats.total_catches,
                  total_runouts: stats.total_runouts,
                  total_stumpings: stats.total_stumpings,
              }
          };
      });

      res.json(topPlayersWithStats);
  } catch (error) {
      console.error("Failed to fetch player statistics:", error);
      res.status(500).send("Failed to retrieve player data");
  }
});





app.get("/player-stats/:playerId", async (req, res) => {
  const { playerId } = req.params;

  const battingQuery = `
    SELECT 
        p.id AS player_id, 
        p.first_name, 
        p.last_name,
        p.playing_role,
        p.short_name,
        COUNT(DISTINCT m.id) AS matches_played, 
        SUM(fp.points) AS total_fantasy_points,
        
        -- Batting statistics
        AVG(b.runs) AS average_runs,
        MAX(b.runs) AS max_runs,
        SUM(b.runs) AS total_runs,
        AVG(b.balls_faced) AS average_balls_faced,
        MAX(b.balls_faced) AS max_balls_faced,
        SUM(b.balls_faced) AS total_balls_faced,
        SUM(CASE WHEN b.runs >= 100 THEN 1 ELSE 0 END) AS total_hundreds,
        SUM(CASE WHEN b.runs >= 50 THEN 1 ELSE 0 END) AS total_fifties,

        -- Match IDs
        GROUP_CONCAT(DISTINCT m.id ORDER BY m.id ASC) AS match_ids
    FROM players p
    JOIN fantasy_points_details fp ON p.id = fp.player_id
    JOIN matches m ON m.id = fp.match_id 
    LEFT JOIN match_inning_batters_test b ON m.id = b.match_id AND fp.player_id = b.batsman_id
    WHERE p.id = ?
    GROUP BY p.id, p.first_name, p.last_name, p.playing_role, p.short_name;
  `;

  const bowlingQuery = `
    SELECT 
        p.id AS player_id, 
        p.first_name, 
        p.last_name,
        p.playing_role,
        p.short_name,
        COUNT(DISTINCT m.id) AS matches_played, 
        SUM(fp.points) AS total_fantasy_points,
        
        -- Bowling statistics
        AVG(bl.overs) AS average_overs_bowled,
        MAX(bl.overs) AS max_overs_bowled,
        SUM(bl.overs) AS total_overs_bowled,
        AVG(bl.runs_conceded) AS average_runs_conceded,
        MAX(bl.runs_conceded) AS max_runs_conceded,
        SUM(bl.runs_conceded) AS total_runs_conceded,
        AVG(bl.wickets) AS average_wickets,
        MAX(bl.wickets) AS max_wickets,
        SUM(bl.wickets) AS total_wickets,

        -- Match IDs
        GROUP_CONCAT(DISTINCT m.id ORDER BY m.id ASC) AS match_ids
    FROM players p
    JOIN fantasy_points_details fp ON p.id = fp.player_id
    JOIN matches m ON m.id = fp.match_id 
    LEFT JOIN match_inning_bowlers_test bl ON m.id = bl.match_id AND fp.player_id = bl.bowler_id
    WHERE p.id = ?
    GROUP BY p.id, p.first_name, p.last_name, p.playing_role, p.short_name;
  `;

  try {
    const [battingResults] = await pool.query(battingQuery, [playerId]);
    const [bowlingResults] = await pool.query(bowlingQuery, [playerId]);

    res.json({
      batting: battingResults,
      bowling: bowlingResults
    });
  } catch (error) {
    console.error("Failed to fetch player statistics:", error);
    res.status(500).send("Failed to retrieve player data");
  }
});





app.get("/player-vs-team-stats/:playerId/:teamId", async (req, res) => {
  const { playerId, teamId } = req.params;

  const battingQuery = `
    SELECT 
        p.id AS player_id, 
        p.first_name, 
        p.last_name,
        p.playing_role,
        p.short_name,
        COUNT(DISTINCT m.id) AS matches_played, 
        SUM(fp.points) AS total_fantasy_points,
        
        -- Batting statistics
        AVG(b.runs) AS average_runs,
        MAX(b.runs) AS max_runs,
        SUM(b.runs) AS total_runs,
        AVG(b.balls_faced) AS average_balls_faced,
        MAX(b.balls_faced) AS max_balls_faced,
        SUM(b.balls_faced) AS total_balls_faced,
        SUM(CASE WHEN b.runs >= 100 THEN 1 ELSE 0 END) AS total_hundreds,
        SUM(CASE WHEN b.runs >= 50 THEN 1 ELSE 0 END) AS total_fifties,

        -- Match IDs
        GROUP_CONCAT(DISTINCT m.id ORDER BY m.id ASC) AS match_ids
    FROM players p
    JOIN fantasy_points_details fp ON p.id = fp.player_id
    JOIN matches m ON m.id = fp.match_id 
    LEFT JOIN match_inning_batters_test b ON m.id = b.match_id AND fp.player_id = b.batsman_id
    WHERE p.id = ? AND (m.team_1 = ? OR m.team_2 = ?)
    GROUP BY p.id, p.first_name, p.last_name, p.playing_role, p.short_name;
  `;

  const bowlingQuery = `
    SELECT 
        p.id AS player_id, 
        p.first_name, 
        p.last_name,
        p.playing_role,
        p.short_name,
        COUNT(DISTINCT m.id) AS matches_played, 
        SUM(fp.points) AS total_fantasy_points,
        
        -- Bowling statistics
        AVG(bl.overs) AS average_overs_bowled,
        MAX(bl.overs) AS max_overs_bowled,
        SUM(bl.overs) AS total_overs_bowled,
        AVG(bl.runs_conceded) AS average_runs_conceded,
        MAX(bl.runs_conceded) AS max_runs_conceded,
        SUM(bl.runs_conceded) AS total_runs_conceded,
        AVG(bl.wickets) AS average_wickets,
        MAX(bl.wickets) AS max_wickets,
        SUM(bl.wickets) AS total_wickets,

        -- Match IDs
        GROUP_CONCAT(DISTINCT m.id ORDER BY m.id ASC) AS match_ids
    FROM players p
    JOIN fantasy_points_details fp ON p.id = fp.player_id
    JOIN matches m ON m.id = fp.match_id 
    LEFT JOIN match_inning_bowlers_test bl ON m.id = bl.match_id AND fp.player_id = bl.bowler_id
    WHERE p.id = ? AND (m.team_1 = ? OR m.team_2 = ?)
    GROUP BY p.id, p.first_name, p.last_name, p.playing_role, p.short_name;
  `;

  try {
    const [battingResults] = await pool.query(battingQuery, [playerId, teamId, teamId]);
    const [bowlingResults] = await pool.query(bowlingQuery, [playerId, teamId, teamId]);

    res.json({
      batting: battingResults,
      bowling: bowlingResults
    });
  } catch (error) {
    console.error("Failed to fetch player vs team statistics:", error);
    res.status(500).send("Failed to retrieve player vs team data");
  }
});





//lat match
app.get("/teamdata/last/:teamId1/:teamId2", async (req, res) => {
  const { teamId1, teamId2 } = req.params;

  console.log(`Received team IDs: ${teamId1}, ${teamId2}`);  // Debugging input

  const query = `
  WITH TeamMatches AS (
      SELECT 
          m.id AS match_id,
          m.team_1,
          m.team_2,
          m.winning_team_id,
          mi.batting_team_id,
          mi.scores
      FROM 
          matches m
      LEFT JOIN match_innings_test mi ON m.id = mi.match_id
      WHERE 
          (m.team_1 IN (?, ?) AND m.team_2 IN (?, ?))
      ORDER BY m.date_start DESC
      LIMIT 2
  ),
  TeamStats AS (
      SELECT 
          tm.batting_team_id AS team_id,
          COUNT(DISTINCT tm.match_id) AS total_matches,
          SUM(CASE WHEN tm.winning_team_id = tm.batting_team_id THEN 1 ELSE 0 END) AS wins,
          SUM(CASE WHEN tm.winning_team_id IS NULL THEN 1 ELSE 0 END) AS ties,
          SUM(CASE WHEN tm.winning_team_id != tm.batting_team_id AND tm.winning_team_id IS NOT NULL THEN 1 ELSE 0 END) AS losses,
          MAX(CAST(SUBSTRING_INDEX(tm.scores, '/', 1) AS UNSIGNED)) AS highest_team_total,
          AVG(CAST(SUBSTRING_INDEX(tm.scores, '/', 1) AS UNSIGNED)) AS avg_runs,
          AVG(CAST(SUBSTRING_INDEX(tm.scores, '/', -1) AS UNSIGNED)) AS avg_wickets
      FROM 
          TeamMatches tm
      GROUP BY 
          tm.batting_team_id
  )
  SELECT 
      ts.team_id,
      ts.total_matches,
      ts.wins,
      ts.losses,
      ts.ties,
      ts.highest_team_total,
      ts.avg_runs,
      ts.avg_wickets
  FROM 
      TeamStats ts;
  `;
  try {
      console.log(`Executing query with params: [${teamId1}, ${teamId2}, ${teamId1}, ${teamId2}]`);
      const [results] = await pool.query(query, [teamId1, teamId2, teamId1, teamId2]);

      console.log('Query results:', results);  // Debugging output

      if (results.length === 0) {
          console.log('No data found for the given parameters.');
          res.status(404).json({ message: "No data found" });
          return;
      }

      res.json(results);
  } catch (error) {
      console.error("Error executing the query:", error);
      res.status(500).send("Failed to retrieve data");
  }
});




// Endpoint for last 5 matches
app.get("/teamdata/last5/:teamId1/:teamId2", async (req, res) => {
  const { teamId1, teamId2 } = req.params;

  console.log(`Received team IDs: ${teamId1}, ${teamId2}, Scope: last5`);  // Debugging input

  const query = `
    WITH TeamMatches AS (
        SELECT 
            m.id AS match_id,
            m.team_1,
            m.team_2,
            m.winning_team_id,
            mi.batting_team_id,
            mi.scores
        FROM 
            matches m
        LEFT JOIN match_innings_test mi ON m.id = mi.match_id
        WHERE 
            (m.team_1 IN (?, ?) AND m.team_2 IN (?, ?))
        ORDER BY m.date_start DESC
        LIMIT 5
    ),
    TeamStats AS (
        SELECT 
            tm.batting_team_id AS team_id,
            COUNT(DISTINCT tm.match_id) AS total_matches,
            SUM(CASE WHEN tm.winning_team_id = tm.batting_team_id THEN 1 ELSE 0 END) AS wins,
            SUM(CASE WHEN tm.winning_team_id IS NULL THEN 1 ELSE 0 END) AS ties,
            SUM(CASE WHEN tm.winning_team_id != tm.batting_team_id AND tm.winning_team_id IS NOT NULL THEN 1 ELSE 0 END) AS losses,
            MAX(CAST(SUBSTRING_INDEX(tm.scores, '/', 1) AS UNSIGNED)) AS highest_team_total,
            AVG(CAST(SUBSTRING_INDEX(tm.scores, '/', 1) AS UNSIGNED)) AS avg_runs,
            AVG(CAST(SUBSTRING_INDEX(tm.scores, '/', -1) AS UNSIGNED)) AS avg_wickets
        FROM 
            TeamMatches tm
        GROUP BY 
            tm.batting_team_id
    )
    SELECT 
        ts.team_id,
        ts.total_matches,
        ts.wins,
        ts.losses,
        ts.ties,
        ts.highest_team_total,
        ts.avg_runs,
        ts.avg_wickets
    FROM 
        TeamStats ts;
  `;
  
  try {
      console.log(`Executing query with params: [${teamId1}, ${teamId2}, ${teamId1}, ${teamId2}]`);
      const [results] = await pool.query(query, [teamId1, teamId2, teamId1, teamId2]);

      console.log('Query results:', results);  // Debugging output

      if (results.length === 0) {
          console.log('No data found for the given parameters.');
          res.status(404).json({ message: "No data found" });
          return;
      }

      res.json(results);
  } catch (error) {
      console.error("Error executing the query:", error);
      res.status(500).send("Failed to retrieve data");
  }
});

// Endpoint for overall matches
app.get("/teamdata/overall/:teamId1/:teamId2", async (req, res) => {
  const { teamId1, teamId2 } = req.params;

  console.log(`Received team IDs: ${teamId1}, ${teamId2}, Scope: overall`);  // Debugging input

  const query = `
    WITH TeamMatches AS (
        SELECT 
            m.id AS match_id,
            m.team_1,
            m.team_2,
            m.winning_team_id,
            mi.batting_team_id,
            mi.scores
        FROM 
            matches m
        LEFT JOIN match_innings_test mi ON m.id = mi.match_id
        WHERE 
            (m.team_1 IN (?, ?) AND m.team_2 IN (?, ?))
    ),
    TeamStats AS (
        SELECT 
            tm.batting_team_id AS team_id,
            COUNT(DISTINCT tm.match_id) AS total_matches,
            SUM(CASE WHEN tm.winning_team_id = tm.batting_team_id THEN 1 ELSE 0 END) AS wins,
            SUM(CASE WHEN tm.winning_team_id IS NULL THEN 1 ELSE 0 END) AS ties,
            SUM(CASE WHEN tm.winning_team_id != tm.batting_team_id AND tm.winning_team_id IS NOT NULL THEN 1 ELSE 0 END) AS losses,
            MAX(CAST(SUBSTRING_INDEX(tm.scores, '/', 1) AS UNSIGNED)) AS highest_team_total,
            AVG(CAST(SUBSTRING_INDEX(tm.scores, '/', 1) AS UNSIGNED)) AS avg_runs,
            AVG(CAST(SUBSTRING_INDEX(tm.scores, '/', -1) AS UNSIGNED)) AS avg_wickets
        FROM 
            TeamMatches tm
        GROUP BY 
            tm.batting_team_id
    )
    SELECT 
        ts.team_id,
        ts.total_matches,
        ts.wins,
        ts.losses,
        ts.ties,
        ts.highest_team_total,
        ts.avg_runs,
        ts.avg_wickets
    FROM 
        TeamStats ts;
  `;
  
  try {
      console.log(`Executing query with params: [${teamId1}, ${teamId2}, ${teamId1}, ${teamId2}]`);
      const [results] = await pool.query(query, [teamId1, teamId2, teamId1, teamId2]);

      console.log('Query results:', results);  // Debugging output

      if (results.length === 0) {
          console.log('No data found for the given parameters.');
          res.status(404).json({ message: "No data found" });
          return;
      }

      res.json(results);
  } catch (error) {
      console.error("Error executing the query:", error);
      res.status(500).send("Failed to retrieve data");
  }
});



//head to head data match won playeed etc
app.get("/head-to-head/:teamId1/:teamId2", async (req, res) => {
  const { teamId1, teamId2 } = req.params;

  console.log(`Received team IDs: ${teamId1}, ${teamId2}`);  // Debugging input

  const query = `
    SELECT 
        COUNT(*) AS matches_played,
        SUM(CASE WHEN m.winning_team_id = ${teamId1} THEN 1 ELSE 0 END) AS team1_wins,
        SUM(CASE WHEN m.winning_team_id = ${teamId2} THEN 1 ELSE 0 END) AS team2_wins,
        SUM(CASE WHEN m.winning_team_id = 0 THEN 1 ELSE 0 END) AS no_results
    FROM 
        matches m
    WHERE 
        (m.team_1 = ${teamId1} AND m.team_2 = ${teamId2})
        OR (m.team_1 = ${teamId2} AND m.team_2 = ${teamId1});
  `;

  try {
    const [results] = await pool.query(query);
    res.json(results);
  } catch (error) {
    console.error("Failed to fetch head-to-head data:", error);
    res.status(500).send("Failed to retrieve data");
  }
});




//recent form last 5 match of both the team
app.get('/recent-form/:teamId', async (req, res) => {
  const { teamId } = req.params;
  const query = `
    SELECT 
        m.id AS match_id,
        m.team_1,
        m.team_2,
        m.winning_team_id,
        m.date_start,
        CASE 
            WHEN m.winning_team_id = ? THEN 'W'
            WHEN m.winning_team_id = 0 THEN 'NR'
            ELSE 'L'
        END AS result
    FROM 
        matches m
    WHERE 
        (m.team_1 = ? OR m.team_2 = ?)
        AND m.format_str = 'T20'
    ORDER BY 
        m.date_start DESC
    LIMIT 5;
  `;
  try {
    const [results] = await pool.query(query, [teamId, teamId, teamId]);
    res.json(results);
  } catch (error) {
    console.error("Failed to fetch recent form:", error);
    res.status(500).send("Failed to retrieve data");
  }
});



app.get("/recent-matches/:teamId1/:teamId2", async (req, res) => {
  const { teamId1, teamId2 } = req.params;

  console.log(`Received team IDs: ${teamId1}, ${teamId2}`);  // Debugging input

  const query = `
    SELECT 
        m.id AS match_id,
        m.team_1,
        m.team_2,
        m.winning_team_id,
        m.date_start,
        CASE 
            WHEN m.winning_team_id = ${teamId1} THEN 'W'
            WHEN m.winning_team_id = 0 THEN 'NR'
            ELSE 'L'
        END AS result_team1,
        CASE 
            WHEN m.winning_team_id = ${teamId2} THEN 'W'
            WHEN m.winning_team_id = 0 THEN 'NR'
            ELSE 'L'
        END AS result_team2,
        (SELECT mi.scores FROM match_innings_test mi WHERE mi.match_id = m.id AND mi.batting_team_id = m.team_1) AS team_1_scores,
        (SELECT mi.scores FROM match_innings_test mi WHERE mi.match_id = m.id AND mi.batting_team_id = m.team_2) AS team_2_scores
    FROM 
        matches m
    WHERE 
        (m.team_1 = ${teamId1} AND m.team_2 = ${teamId2}) OR 
        (m.team_1 = ${teamId2} AND m.team_2 = ${teamId1})
    ORDER BY 
        m.date_start DESC
    LIMIT 5;
  `;

  try {
    const [results] = await pool.query(query);
    res.json(results);
  } catch (error) {
    console.error("Failed to fetch recent matches data:", error);
    res.status(500).send("Failed to retrieve data");
  }
});











//batting order wrong thoda byut yaaa

// app.get("/teamdata/25/last5matches", async (req, res) => {
//   const teamId = 25;

//   const query = `
//       WITH Last5Matches AS (
//           SELECT 
//               m.id AS match_id,
//               m.date_start,
//               m.team_1,
//               m.team_2
//           FROM 
//               matches m
//           WHERE 
//               (m.team_1 = ? OR m.team_2 = ?)
//           ORDER BY 
//               m.date_start DESC
//           LIMIT 5
//       ),
//       TeamPlayers AS (
//           SELECT 
//               tp.player_id
//           FROM 
//               team_players tp
//           WHERE 
//               tp.team_id = ?
//       ),
//       PlayerStats AS (
//           SELECT 
//               p.id AS player_id,
//               p.first_name,
//               p.last_name,
//               p.playing_role,
//               p.short_name,
//               fp.match_id,
//               fp.points,
//               fp.runs,
//               fp.wickets
//           FROM 
//               players p
//           JOIN fantasy_points_details fp ON p.id = fp.player_id
//           WHERE 
//               fp.match_id IN (SELECT match_id FROM Last5Matches) 
//               AND fp.player_id IN (SELECT player_id FROM TeamPlayers)
//       ),
//       BattingOrder AS (
//           SELECT
//               b.match_id,
//               b.batsman_id,
//               ROW_NUMBER() OVER (PARTITION BY b.match_id ORDER BY b.position) AS batting_order
//           FROM
//               match_inning_batters_test b
//           WHERE
//               b.match_id IN (SELECT match_id FROM Last5Matches)
//               AND b.batsman_id IN (SELECT player_id FROM TeamPlayers)
//       )
//       SELECT 
//           ps.player_id,
//           ps.first_name,
//           ps.last_name,
//           ps.playing_role,
//           ps.short_name,
//           ps.match_id,
//           ps.points,
//           ps.runs,
//           ps.wickets,
//           COALESCE(bo.batting_order, 'DNB') AS batting_order,
//           lm.date_start
//       FROM 
//           PlayerStats ps
//       LEFT JOIN BattingOrder bo ON ps.match_id = bo.match_id AND ps.player_id = bo.batsman_id
//       JOIN Last5Matches lm ON ps.match_id = lm.match_id
//       ORDER BY 
//           lm.date_start DESC, bo.batting_order;
//   `;

//   try {
//       console.log(`Executing query for team ${teamId} last 5 matches`);
//       const [results] = await pool.query(query, [teamId, teamId, teamId]);

//       console.log('Query results:', results);  // Debugging output

//       if (results.length === 0) {
//           console.log('No data found for the given parameters.');
//           res.status(404).json({ message: "No data found" });
//           return;
//       }

//       res.json(results);
//   } catch (error) {
//       console.error("Error executing the query:", error);
//       res.status(500).send("Failed to retrieve data");
//   }
// });

app.get('/teams/:teamId/last5matches/battingorder', async (req, res) => {
  const { teamId } = req.params;

  const query = `
    WITH Last5Matches AS (
        SELECT 
            m.id AS match_id,
            m.date_start
        FROM 
            matches m
        WHERE 
            m.team_1 = ? OR m.team_2 = ?
        ORDER BY 
            m.date_start DESC
        LIMIT 5
    ),
    TeamPlayers AS (
        SELECT 
            tp.player_id,
            p.first_name,
            p.last_name,
            p.playing_role,
            p.short_name,
            tp.team_id,
            t.name AS team_name
        FROM 
            team_players tp
        JOIN 
            players p ON tp.player_id = p.id
        JOIN
            teams t ON tp.team_id = t.id
        WHERE 
            tp.team_id = ?
    ),
    PlayerBattingOrder AS (
        SELECT
            p.player_id,
            p.first_name,
            p.last_name,
            p.short_name,
            p.playing_role,
            p.team_id,
            p.team_name,
            b.match_id,
            ROW_NUMBER() OVER (PARTITION BY b.match_id ORDER BY b.id) AS batting_order
        FROM
            match_inning_batters_test b
        JOIN
            TeamPlayers p ON b.batsman_id = p.player_id
        WHERE
            b.match_id IN (SELECT match_id FROM Last5Matches)
    )
    SELECT 
        pbo.player_id,
        pbo.first_name,
        pbo.last_name,
        pbo.short_name,
        pbo.playing_role,
        pbo.team_id,
        pbo.team_name,
        pbo.match_id,
        pbo.batting_order
    FROM 
        PlayerBattingOrder pbo
    ORDER BY 
        pbo.player_id, pbo.match_id;
  `;

  try {
      const [results] = await pool.query(query, [teamId, teamId, teamId]);

      const players = {};

      results.forEach(row => {
          if (!players[row.player_id]) {
              players[row.player_id] = {
                  player_id: row.player_id,
                  first_name: row.first_name,
                  last_name: row.last_name,
                  short_name: row.short_name,
                  playing_role: row.playing_role,
                  team_id: row.team_id,
                  team_name: row.team_name,
                  matches: []
              };
          }
          players[row.player_id].matches.push({
              match_id: row.match_id,
              batting_order: row.batting_order
          });
      });

      res.json({ status: "ok", response: Object.values(players) });
  } catch (error) {
      console.error("Error executing the query:", error);
      res.status(500).send("Failed to retrieve data");
  }
});









// batting powrplaye

app.get('/team-top-players-stats/:teamId', async (req, res) => {
  const { teamId } = req.params;

  const query = `
    WITH Last5Matches AS (
        SELECT 
            m.id AS match_id,
            m.date_start,
            m.team_1,
            m.team_2
        FROM 
            matches m
        WHERE 
            (m.team_1 = ? OR m.team_2 = ?)
        ORDER BY 
            m.date_start DESC
        LIMIT 5
    ),
    TeamPlayers AS (
        SELECT 
            tp.player_id
        FROM 
            team_players tp
        WHERE 
            tp.team_id = ?
    ),
    PlayerStats AS (
        SELECT 
            p.id AS player_id,
            p.first_name,
            p.last_name,
            p.playing_role,
            p.short_name,
            SUM(fp.points) AS total_fantasy_points
        FROM 
            players p
        JOIN fantasy_points_details fp ON p.id = fp.player_id
        WHERE 
            fp.match_id IN (SELECT match_id FROM Last5Matches) 
            AND fp.player_id IN (SELECT player_id FROM TeamPlayers)
        GROUP BY 
            p.id, p.first_name, p.last_name, p.playing_role, p.short_name
        ORDER BY 
            total_fantasy_points DESC
        LIMIT 20
    ),
    MatchCounts AS (
        SELECT 
            b.batsman_id AS player_id,
            COUNT(DISTINCT b.match_id) AS matches_played
        FROM 
            match_inning_batters_test b
        WHERE 
            b.match_id IN (SELECT match_id FROM Last5Matches)
        GROUP BY 
            b.batsman_id
    ),
    BattingStats AS (
        SELECT
            b.batsman_id AS player_id,
            p.first_name,
            p.last_name,
            p.playing_role,
            p.short_name,
            b.match_id,
            mc.matches_played,
            SUM(b.runs) AS runs,
            SUM(b.fours) AS \`4s\`,
            SUM(b.sixes) AS \`6s\`,
            AVG(b.strike_rate) AS SR,
            SUM(fp.points) AS FPts
        FROM
            match_inning_batters_test b
        JOIN
            players p ON b.batsman_id = p.id
        JOIN
            fantasy_points_details fp ON b.batsman_id = fp.player_id AND b.match_id = fp.match_id
        JOIN
            MatchCounts mc ON b.batsman_id = mc.player_id
        WHERE
            b.match_id IN (SELECT match_id FROM Last5Matches)
            AND b.batsman_id IN (SELECT player_id FROM PlayerStats)
        GROUP BY
            b.batsman_id, p.first_name, p.last_name, p.playing_role, p.short_name, b.match_id, mc.matches_played
    )
    SELECT 
        bs.player_id,
        bs.first_name,
        bs.last_name,
        bs.playing_role,
        bs.short_name,
        bs.match_id,
        bs.matches_played,
        bs.runs,
        bs.\`4s\`,
        bs.\`6s\`,
        bs.SR,
        bs.FPts
    FROM
        BattingStats bs
    ORDER BY
        bs.match_id DESC, bs.runs DESC;
  `;

  try {
    const [results] = await pool.query(query, [teamId, teamId, teamId]);
    res.json(results);
  } catch (error) {
    console.error("Error executing query", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



//bowling death

app.get('/team-top-bowlers-stats/:teamId', async (req, res) => {
  const { teamId } = req.params;

  const query = `
    WITH Last5Matches AS (
        SELECT 
            m.id AS match_id,
            m.date_start,
            m.team_1,
            m.team_2
        FROM 
            matches m
        WHERE 
            (m.team_1 = ? OR m.team_2 = ?)
        ORDER BY 
            m.date_start DESC
        LIMIT 5
    ),
    TeamPlayers AS (
        SELECT 
            tp.player_id
        FROM 
            team_players tp
        WHERE 
            tp.team_id = ?
    ),
    PlayerStats AS (
        SELECT 
            p.id AS player_id,
            p.first_name,
            p.last_name,
            p.playing_role,
            p.short_name,
            SUM(fp.points) AS total_fantasy_points
        FROM 
            players p
        JOIN fantasy_points_details fp ON p.id = fp.player_id
        WHERE 
            fp.match_id IN (SELECT match_id FROM Last5Matches) 
            AND fp.player_id IN (SELECT player_id FROM TeamPlayers)
        GROUP BY 
            p.id, p.first_name, p.last_name, p.playing_role, p.short_name
        ORDER BY 
            total_fantasy_points DESC
        LIMIT 20
    ),
    MatchCounts AS (
        SELECT 
            b.bowler_id AS player_id,
            COUNT(DISTINCT b.match_id) AS matches_played
        FROM 
            match_inning_bowlers_test b
        WHERE 
            b.match_id IN (SELECT match_id FROM Last5Matches)
        GROUP BY 
            b.bowler_id
    ),
    BowlingStats AS (
        SELECT
            b.bowler_id AS player_id,
            p.first_name,
            p.last_name,
            p.playing_role,
            p.short_name,
            b.match_id,
            mc.matches_played,
            SUM(b.wickets) AS wickets,
            SUM(b.overs) AS overs,
            SUM(b.maidens) AS maidens,
            SUM(b.runs_conceded) AS runs_conceded,
            AVG(b.econ) AS econ,
            SUM(fp.points) AS FPts
        FROM
            match_inning_bowlers_test b
        JOIN
            players p ON b.bowler_id = p.id
        JOIN
            fantasy_points_details fp ON b.bowler_id = fp.player_id AND b.match_id = fp.match_id
        JOIN
            MatchCounts mc ON b.bowler_id = mc.player_id
        WHERE
            b.match_id IN (SELECT match_id FROM Last5Matches)
            AND b.bowler_id IN (SELECT player_id FROM PlayerStats)
        GROUP BY
            b.bowler_id, p.first_name, p.last_name, p.playing_role, p.short_name, b.match_id, mc.matches_played
    )
    SELECT 
        bs.player_id,
        bs.first_name,
        bs.last_name,
        bs.playing_role,
        bs.short_name,
        bs.match_id,
        bs.matches_played,
        bs.wickets,
        bs.overs,
        bs.maidens,
        bs.runs_conceded,
        bs.econ,
        bs.FPts
    FROM 
        BowlingStats bs
    ORDER BY 
        bs.match_id DESC, bs.wickets DESC;
  `;

  try {
    const [results] = await pool.query(query, [teamId, teamId, teamId]);
    res.json(results);
  } catch (error) {
    console.error("Error executing query", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



//key match insight
//top power play batters 3 with avg fp 
app.get('/top-powerplay-batters', async (req, res) => {
  const team1 = req.query.team1;
  const team2 = req.query.team2;

  if (!team1 || !team2) {
      return res.status(400).send('Team IDs are required');
  }

  try {
      const [rows] = await pool.query(`
          WITH Last5Matches AS (
              SELECT 
                  m.id AS match_id,
                  m.date_start,
                  m.team_1,
                  m.team_2
              FROM 
                  matches m
              WHERE 
                  (m.team_1 = ? AND m.team_2 = ?) OR (m.team_1 = ? AND m.team_2 = ?)
              ORDER BY 
                  m.date_start DESC
              LIMIT 5
          ),
          PlayerStats AS (
              SELECT
                  p.id AS player_id,
                  p.first_name,
                  p.last_name,
                  p.playing_role,
                  p.short_name,
                  SUM(fp.points) AS total_fantasy_points,
                  AVG(fp.points) AS avg_fantasy_points
              FROM
                  match_inning_batters_test b
              JOIN
                  players p ON b.batsman_id = p.id
              JOIN
                  fantasy_points_details fp ON b.batsman_id = fp.player_id AND b.match_id = fp.match_id
              WHERE
                  b.match_id IN (SELECT match_id FROM Last5Matches)
              GROUP BY
                  p.id, p.first_name, p.last_name, p.playing_role, p.short_name
          )
          SELECT 
              player_id,
              first_name,
              last_name,
              playing_role,
              short_name,
              total_fantasy_points,
              avg_fantasy_points
          FROM
              PlayerStats
          WHERE
              playing_role = 'bat'
          ORDER BY
              avg_fantasy_points DESC
          LIMIT 3;
      `, [team1, team2, team2, team1]);
      res.json(rows);
  } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
  }
});




// top powerplay bowlers 3 with avg fp 
app.get('/top-powerplay-bowlers', async (req, res) => {
  const team1 = req.query.team1;
  const team2 = req.query.team2;

  if (!team1 || !team2) {
      return res.status(400).send('Team IDs are required');
  }

  try {
      const [rows] = await pool.query(`
          WITH Last5Matches AS (
              SELECT 
                  m.id AS match_id,
                  m.date_start,
                  m.team_1,
                  m.team_2
              FROM 
                  matches m
              WHERE 
                  (m.team_1 = ? AND m.team_2 = ?) OR (m.team_1 = ? AND m.team_2 = ?)
              ORDER BY 
                  m.date_start DESC
              LIMIT 5
          ),
          BowlerStats AS (
              SELECT
                  p.id AS player_id,
                  p.first_name,
                  p.last_name,
                  p.playing_role,
                  p.short_name,
                  SUM(fp.points) AS total_fantasy_points,
                  AVG(fp.points) AS avg_fantasy_points
              FROM
                  match_inning_bowlers_test b
              JOIN
                  players p ON b.bowler_id = p.id
              JOIN
                  fantasy_points_details fp ON b.bowler_id = fp.player_id AND b.match_id = fp.match_id
              WHERE
                  b.match_id IN (SELECT match_id FROM Last5Matches)
              GROUP BY
                  p.id, p.first_name, p.last_name, p.playing_role, p.short_name
          )
          SELECT 
              player_id,
              first_name,
              last_name,
              playing_role,
              short_name,
              total_fantasy_points,
              avg_fantasy_points
          FROM
              BowlerStats
          WHERE
              playing_role = 'bowl'
          ORDER BY
              avg_fantasy_points DESC
          LIMIT 3;
      `, [team1, team2, team2, team1]);
      res.json(rows);
  } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
  }
});



//death over bolwers
app.get('/top-death-over-bowlers', async (req, res) => {
  const team1 = req.query.team1;
  const team2 = req.query.team2;

  if (!team1 || !team2) {
    return res.status(400).send('Team IDs are required');
  }

  try {
    const [rows] = await pool.query(`
      WITH Last5Matches AS (
          SELECT 
              m.id AS match_id,
              m.date_start,
              m.team_1,
              m.team_2
          FROM 
              matches m
          WHERE 
              (m.team_1 = ? AND m.team_2 = ?) OR (m.team_1 = ? AND m.team_2 = ?)
          ORDER BY 
              m.date_start DESC
          LIMIT 5
      ),
      DeathOverBowlers AS (
          SELECT
              b.bowler_id AS player_id,
              p.first_name,
              p.last_name,
              p.playing_role,
              p.short_name,
              b.match_id,
              SUM(fp.points) AS total_fantasy_points,
              AVG(fp.points) AS avg_fantasy_points
          FROM
              match_inning_bowlers_test b
          JOIN
              players p ON b.bowler_id = p.id
          JOIN
              fantasy_points_details fp ON b.bowler_id = fp.player_id AND b.match_id = fp.match_id
          WHERE
              b.match_id IN (SELECT match_id FROM Last5Matches)
          GROUP BY
              b.bowler_id, p.first_name, p.last_name, p.playing_role, p.short_name, b.match_id
      )
      SELECT 
          player_id,
          first_name,
          last_name,
          playing_role,
          short_name,
          total_fantasy_points,
          avg_fantasy_points
      FROM
          DeathOverBowlers
      WHERE
          playing_role = 'bowl'
      ORDER BY
          avg_fantasy_points DESC
      LIMIT 3;
    `, [team1, team2, team2, team1]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});



//x factor player 

app.get('/x-factor-players', async (req, res) => {
  const team1 = req.query.team1;
  const team2 = req.query.team2;

  if (!team1 || !team2) {
    return res.status(400).send('Team IDs are required');
  }

  try {
    const [rows] = await pool.query(`
      WITH Last5Matches AS (
          SELECT 
              m.id AS match_id,
              m.date_start,
              m.team_1,
              m.team_2
          FROM 
              matches m
          WHERE 
              (m.team_1 = ? AND m.team_2 = ?) OR (m.team_1 = ? AND m.team_2 = ?)
          ORDER BY 
              m.date_start DESC
          LIMIT 5
      ),
      PlayerPerformance AS (
          SELECT
              p.id AS player_id,
              p.first_name,
              p.last_name,
              p.playing_role,
              p.short_name,
              SUM(fp.points) AS total_fantasy_points,
              AVG(fp.points) AS avg_fantasy_points,
              COUNT(DISTINCT fp.match_id) AS matches_played
          FROM
              fantasy_points_details fp
          JOIN
              players p ON fp.player_id = p.id
          WHERE
              fp.match_id IN (SELECT match_id FROM Last5Matches)
          GROUP BY
              p.id, p.first_name, p.last_name, p.playing_role, p.short_name
      )
      SELECT 
          player_id,
          first_name,
          last_name,
          playing_role,
          short_name,
          total_fantasy_points,
          avg_fantasy_points,
          matches_played
      FROM
          PlayerPerformance
      WHERE
          matches_played >= 2 -- Ensure players have played at least 2 matches
      ORDER BY
          avg_fantasy_points DESC
      LIMIT 5; -- Get top 5 players with highest average fantasy points
    `, [team1, team2, team2, team1]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});


app.get("/api/players/top-form", async (req, res) => {
  const { team1, team2 } = req.query;

  if (!team1 || !team2) {
    return res.status(400).send("Team IDs are required");
  }

  try {
    const sql = `
      WITH Last3Matches AS (
          SELECT 
              m.id AS match_id,
              m.date_start,
              m.team_1,
              m.team_2
          FROM 
              matches m
          WHERE 
              (m.team_1 = ? AND m.team_2 = ?) OR (m.team_1 = ? AND m.team_2 = ?)
          ORDER BY 
              m.date_start DESC
          LIMIT 3
      ),
      PlayerStats AS (
          SELECT
              p.id AS player_id,
              p.first_name,
              p.last_name,
              p.short_name,
              p.playing_role,
              SUM(fp.points) AS total_fantasy_points,
              AVG(fp.points) AS avg_fantasy_points
          FROM
              players p
          JOIN fantasy_points_details fp ON p.id = fp.player_id
          WHERE
              fp.match_id IN (SELECT match_id FROM Last3Matches)
          GROUP BY
              p.id, p.first_name, p.last_name, p.short_name, p.playing_role
      )
      SELECT 
          player_id,
          first_name,
          last_name,
          short_name,
          playing_role,
          total_fantasy_points,
          avg_fantasy_points
      FROM
          PlayerStats
      ORDER BY
          avg_fantasy_points DESC
      LIMIT 20;
    `;

    const [results] = await pool.query(sql, [team1, team2, team2, team1]);
    res.json(results);
  } catch (error) {
    console.error("Error fetching top form players:", error);
    res.status(500).send("Failed to retrieve data");
  }
});


app.get('/api/player/batting-order', async (req, res) => {
  const team1 = req.query.team1;
  const team2 = req.query.team2;

  if (!team1 || !team2) {
      return res.status(400).send('Team IDs are required');
  }

  const query = `
      WITH LastMatch AS (
          SELECT 
              m.id AS match_id,
              m.team_1,
              m.team_2
          FROM 
              matches m
          WHERE 
              (m.team_1 = ? AND m.team_2 = ?) OR (m.team_1 = ? AND m.team_2 = ?)
          ORDER BY 
              m.date_start DESC
          LIMIT 1
      ),
      Team1BattingOrder AS (
          SELECT
              p.id AS player_id,
              p.first_name,
              p.last_name,
              p.short_name,
              p.playing_role,
              'India' AS team,
              ROW_NUMBER() OVER (ORDER BY b.id) AS batting_order
          FROM
              match_inning_batters_test b
          JOIN
              players p ON b.batsman_id = p.id
          WHERE
              b.match_id = (SELECT match_id FROM LastMatch)
              AND b.inning_number = 1
      ),
      Team2BattingOrder AS (
          SELECT
              p.id AS player_id,
              p.first_name,
              p.last_name,
              p.short_name,
              p.playing_role,
              'Pakistan' AS team,
              ROW_NUMBER() OVER (ORDER BY b.id) AS batting_order
          FROM
              match_inning_batters_test b
          JOIN
              players p ON b.batsman_id = p.id
          WHERE
              b.match_id = (SELECT match_id FROM LastMatch)
              AND b.inning_number = 2
      )
      SELECT 
          player_id,
          first_name,
          last_name,
          short_name,
          playing_role,
          batting_order,
          team
      FROM
          Team1BattingOrder
      UNION ALL
      SELECT 
          player_id,
          first_name,
          last_name,
          short_name,
          playing_role,
          batting_order,
          team
      FROM
          Team2BattingOrder
      ORDER BY
          team, batting_order;
  `;

  try {
      const [rows] = await pool.query(query, [team1, team2, team2, team1]);
      res.json(rows);
  } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
  }
});























//all player overview 
app.get('/last-match-player-stats', async (req, res) => {
  const team1 = req.query.team1;
  const team2 = req.query.team2;

  if (!team1 || !team2) {
    return res.status(400).send('Team IDs are required');
  }

  try {
    const [rows] = await pool.query(`
      WITH LastMatch AS (
          SELECT 
              m.id AS match_id,
              m.date_start,
              m.team_1,
              m.team_2
          FROM 
              matches m
          WHERE 
              (m.team_1 = ? AND m.team_2 = ?) OR (m.team_1 = ? AND m.team_2 = ?)
          ORDER BY 
              m.date_start DESC
          LIMIT 1
      ),
      PlayerStats AS (
          SELECT
              p.id AS player_id,
              p.first_name,
              p.last_name,
              p.playing_role,
              p.short_name,
              SUM(fp.points) AS total_fantasy_points,
              AVG(fp.points) AS avg_fantasy_points,
              AVG(CASE WHEN lm.team_1 = fp.team_id THEN fp.points END) AS avg_fp_bat_first,
              AVG(CASE WHEN lm.team_2 = fp.team_id THEN fp.points END) AS avg_fp_bat_second,
              COUNT(DISTINCT dt.player_id) AS in_dream_team
          FROM
              fantasy_points_details fp
          JOIN
              players p ON fp.player_id = p.id
          JOIN
              LastMatch lm ON fp.match_id = lm.match_id
          LEFT JOIN
              DreamTeam_test dt ON fp.match_id = dt.match_id AND fp.player_id = dt.player_id
          LEFT JOIN
              matches m ON fp.match_id = m.id
          GROUP BY
              p.id, p.first_name, p.last_name, p.playing_role, p.short_name
      ),
      RankedStats AS (
          SELECT
              ps.*,
              ROW_NUMBER() OVER (ORDER BY ps.total_fantasy_points DESC) AS player_rank,
              ROW_NUMBER() OVER (ORDER BY ps.total_fantasy_points ASC) AS player_bottom_rank
          FROM
              PlayerStats ps
      )
      SELECT 
          player_id,
          first_name,
          last_name,
          playing_role,
          short_name,
          total_fantasy_points,
          avg_fantasy_points,
          avg_fp_bat_first,
          avg_fp_bat_second,
          in_dream_team,
          player_rank,
          player_bottom_rank,
          (SELECT AVG(player_rank) FROM RankedStats) AS avg_position_rank,
          (SELECT AVG(player_bottom_rank) FROM RankedStats) AS avg_team_rank
      FROM
          RankedStats
      ORDER BY
          avg_fantasy_points DESC;
    `, [team1, team2, team2, team1]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// API for Last 5 Matches Player Stats
app.get('/last-5-matches-player-stats', async (req, res) => {
  const team1 = req.query.team1;
  const team2 = req.query.team2;

  if (!team1 || !team2) {
    return res.status(400).send('Team IDs are required');
  }

  try {
    const [rows] = await pool.query(`
      WITH Last5Matches AS (
          SELECT 
              m.id AS match_id,
              m.date_start,
              m.team_1,
              m.team_2
          FROM 
              matches m
          WHERE 
              (m.team_1 = ? AND m.team_2 = ?) OR (m.team_1 = ? AND m.team_2 = ?)
          ORDER BY 
              m.date_start DESC
          LIMIT 5
      ),
      PlayerStats AS (
          SELECT
              p.id AS player_id,
              p.first_name,
              p.last_name,
              p.playing_role,
              p.short_name,
              SUM(fp.points) AS total_fantasy_points,
              AVG(fp.points) AS avg_fantasy_points,
              AVG(CASE WHEN m.team_1 = fp.team_id THEN fp.points END) AS avg_fp_bat_first,
              AVG(CASE WHEN m.team_2 = fp.team_id THEN fp.points END) AS avg_fp_bat_second,
              COUNT(DISTINCT dt.player_id) AS in_dream_team
          FROM
              fantasy_points_details fp
          JOIN
              players p ON fp.player_id = p.id
          JOIN
              matches m ON fp.match_id = m.id
          LEFT JOIN
              DreamTeam_test dt ON fp.match_id = dt.match_id AND fp.player_id = dt.player_id
          WHERE
              fp.match_id IN (SELECT match_id FROM Last5Matches)
          GROUP BY
              p.id, p.first_name, p.last_name, p.playing_role, p.short_name
      ),
      RankedStats AS (
          SELECT
              ps.*,
              ROW_NUMBER() OVER (ORDER BY ps.total_fantasy_points DESC) AS player_rank,
              ROW_NUMBER() OVER (ORDER BY ps.total_fantasy_points ASC) AS player_bottom_rank
          FROM
              PlayerStats ps
      )
      SELECT 
          player_id,
          first_name,
          last_name,
          playing_role,
          short_name,
          total_fantasy_points,
          avg_fantasy_points,
          avg_fp_bat_first,
          avg_fp_bat_second,
          in_dream_team,
          player_rank,
          player_bottom_rank,
          (SELECT AVG(player_rank) FROM RankedStats) AS avg_position_rank,
          (SELECT AVG(player_bottom_rank) FROM RankedStats) AS avg_team_rank
      FROM
          RankedStats
      ORDER BY
          avg_fantasy_points DESC;
    `, [team1, team2, team2, team1]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// API for Overall Player Stats Between Two Teams
app.get('/overall-player-stats', async (req, res) => {
  const team1 = req.query.team1;
  const team2 = req.query.team2;

  if (!team1 || !team2) {
    return res.status(400).send('Team IDs are required');
  }

  try {
    const [rows] = await pool.query(`
      WITH AllMatches AS (
          SELECT 
              m.id AS match_id,
              m.date_start,
              m.team_1,
              m.team_2
          FROM 
              matches m
          WHERE 
              (m.team_1 = ? AND m.team_2 = ?) OR (m.team_1 = ? AND m.team_2 = ?)
      ),
      PlayerStats AS (
          SELECT
              p.id AS player_id,
              p.first_name,
              p.last_name,
              p.playing_role,
              p.short_name,
              SUM(fp.points) AS total_fantasy_points,
              AVG(fp.points) AS avg_fantasy_points,
              AVG(CASE WHEN m.team_1 = fp.team_id THEN fp.points END) AS avg_fp_bat_first,
              AVG(CASE WHEN m.team_2 = fp.team_id THEN fp.points END) AS avg_fp_bat_second,
              COUNT(DISTINCT dt.player_id) AS in_dream_team
          FROM
              fantasy_points_details fp
          JOIN
              players p ON fp.player_id = p.id
          JOIN
              matches m ON fp.match_id = m.id
          LEFT JOIN
              DreamTeam_test dt ON fp.match_id = dt.match_id AND fp.player_id = dt.player_id
          WHERE
              fp.match_id IN (SELECT match_id FROM AllMatches)
          GROUP BY
              p.id, p.first_name, p.last_name, p.playing_role, p.short_name
      ),
      RankedStats AS (
          SELECT
              ps.*,
              ROW_NUMBER() OVER (ORDER BY ps.total_fantasy_points DESC) AS player_rank,
              ROW_NUMBER() OVER (ORDER BY ps.total_fantasy_points ASC) AS player_bottom_rank
          FROM
              PlayerStats ps
      )
      SELECT 
          player_id,
          first_name,
          last_name,
          playing_role,
          short_name,
          total_fantasy_points,
          avg_fantasy_points,
          avg_fp_bat_first,
          avg_fp_bat_second,
          in_dream_team,
          player_rank,
          player_bottom_rank,
          (SELECT AVG(player_rank) FROM RankedStats) AS avg_position_rank,
          (SELECT AVG(player_bottom_rank) FROM RankedStats) AS avg_team_rank
      FROM
          RankedStats
      ORDER BY
          avg_fantasy_points DESC;
    `, [team1, team2, team2, team1]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});







//bowler corner 

app.get('/bowler-stats-last-match', async (req, res) => {
  const team1 = req.query.team1;
  const team2 = req.query.team2;

  if (!team1 || !team2) {
    return res.status(400).send('Team IDs are required');
  }

  try {
    const [rows] = await pool.query(`
      WITH LastMatch AS (
          SELECT 
              m.id AS match_id,
              m.date_start,
              m.team_1,
              m.team_2,
              m.venue_id
          FROM 
              matches m
          WHERE 
              (m.team_1 = ? AND m.team_2 = ?) OR (m.team_1 = ? AND m.team_2 = ?)
          ORDER BY 
              m.date_start DESC
          LIMIT 1
      ),
      BowlerStats AS (
          SELECT
              p.id AS player_id,
              p.first_name,
              p.last_name,
              p.bowling_style,
              p.playing_role,
              tp.team_id,
              t.name AS team_name,
              AVG(fp.points) AS avg_fantasy_points,
              AVG(CASE WHEN lm.team_1 = fp.team_id THEN fp.points END) AS avg_fp_bowling_first,
              AVG(CASE WHEN lm.team_2 = fp.team_id THEN fp.points END) AS avg_fp_bowling_second,
              SUM(b.wickets) AS total_wickets,
              SUM(b.overs) AS total_overs,
              AVG(CASE WHEN m.venue_id = lm.venue_id THEN fp.points END) AS avg_fp_at_venue
          FROM
              fantasy_points_details fp
          JOIN
              players p ON fp.player_id = p.id
          JOIN
              team_players tp ON p.id = tp.player_id
          JOIN
              teams t ON tp.team_id = t.id
          JOIN
              LastMatch lm ON fp.match_id = lm.match_id
          LEFT JOIN
              match_inning_bowlers_test b ON fp.player_id = b.bowler_id AND fp.match_id = b.match_id
          LEFT JOIN
              matches m ON fp.match_id = m.id
          GROUP BY
              p.id, p.first_name, p.last_name, p.bowling_style, p.playing_role, tp.team_id, t.name
      )
      SELECT 
          player_id,
          first_name,
          last_name,
          bowling_style,
          playing_role,
          team_id,
          team_name,
          avg_fantasy_points,
          avg_fp_bowling_first,
          avg_fp_bowling_second,
          total_wickets,
          total_overs,
          avg_fp_at_venue
      FROM
          BowlerStats
      ORDER BY
          avg_fantasy_points DESC;
    `, [team1, team2, team2, team1]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});





app.get('/bowler-stats-last-5-matches', async (req, res) => {
  const team1 = req.query.team1;
  const team2 = req.query.team2;

  if (!team1 || !team2) {
    return res.status(400).send('Team IDs are required');
  }

  try {
    const [rows] = await pool.query(`
      WITH Last5Matches AS (
          SELECT 
              m.id AS match_id,
              m.date_start,
              m.team_1,
              m.team_2,
              m.venue_id
          FROM 
              matches m
          WHERE 
              (m.team_1 = ? AND m.team_2 = ?) OR (m.team_1 = ? AND m.team_2 = ?)
          ORDER BY 
              m.date_start DESC
          LIMIT 5
      ),
      BowlerStats AS (
          SELECT
              p.id AS player_id,
              p.first_name,
              p.last_name,
              p.bowling_style,
              p.playing_role,
              tp.team_id,
              t.name AS team_name,
              AVG(fp.points) AS avg_fantasy_points,
              AVG(CASE WHEN lm.team_1 = fp.team_id THEN fp.points END) AS avg_fp_bowling_first,
              AVG(CASE WHEN lm.team_2 = fp.team_id THEN fp.points END) AS avg_fp_bowling_second,
              SUM(b.wickets) AS total_wickets,
              SUM(b.overs) AS total_overs,
              AVG(CASE WHEN m.venue_id = lm.venue_id THEN fp.points END) AS avg_fp_at_venue
          FROM
              fantasy_points_details fp
          JOIN
              players p ON fp.player_id = p.id
          JOIN
              team_players tp ON p.id = tp.player_id
          JOIN
              teams t ON tp.team_id = t.id
          JOIN
              Last5Matches lm ON fp.match_id = lm.match_id
          LEFT JOIN
              match_inning_bowlers_test b ON fp.player_id = b.bowler_id AND fp.match_id = b.match_id
          LEFT JOIN
              matches m ON fp.match_id = m.id
          GROUP BY
              p.id, p.first_name, p.last_name, p.bowling_style, p.playing_role, tp.team_id, t.name
      )
      SELECT 
          player_id,
          first_name,
          last_name,
          bowling_style,
          playing_role,
          team_id,
          team_name,
          avg_fantasy_points,
          avg_fp_bowling_first,
          avg_fp_bowling_second,
          total_wickets,
          total_overs,
          avg_fp_at_venue
      FROM
          BowlerStats
      ORDER BY
          avg_fantasy_points DESC;
    `, [team1, team2, team2, team1]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});




app.get('/bowler-stats-overall', async (req, res) => {
  const team1 = req.query.team1;
  const team2 = req.query.team2;

  if (!team1 || !team2) {
    return res.status(400).send('Team IDs are required');
  }

  try {
    const [rows] = await pool.query(`
      WITH AllMatches AS (
          SELECT 
              m.id AS match_id,
              m.date_start,
              m.team_1,
              m.team_2,
              m.venue_id
          FROM 
              matches m
          WHERE 
              (m.team_1 = ? AND m.team_2 = ?) OR (m.team_1 = ? AND m.team_2 = ?)
      ),
      BowlerStats AS (
          SELECT
              p.id AS player_id,
              p.first_name,
              p.last_name,
              p.bowling_style,
              p.playing_role,
              tp.team_id,
              t.name AS team_name,
              AVG(fp.points) AS avg_fantasy_points,
              AVG(CASE WHEN lm.team_1 = fp.team_id THEN fp.points END) AS avg_fp_bowling_first,
              AVG(CASE WHEN lm.team_2 = fp.team_id THEN fp.points END) AS avg_fp_bowling_second,
              SUM(b.wickets) AS total_wickets,
              SUM(b.overs) AS total_overs,
              AVG(CASE WHEN m.venue_id = lm.venue_id THEN fp.points END) AS avg_fp_at_venue
          FROM
              fantasy_points_details fp
          JOIN
              players p ON fp.player_id = p.id
          JOIN
              team_players tp ON p.id = tp.player_id
          JOIN
              teams t ON tp.team_id = t.id
          JOIN
              AllMatches lm ON fp.match_id = lm.match_id
          LEFT JOIN
              match_inning_bowlers_test b ON fp.player_id = b.bowler_id AND fp.match_id = b.match_id
          LEFT JOIN
              matches m ON fp.match_id = m.id
          GROUP BY
              p.id, p.first_name, p.last_name, p.bowling_style, p.playing_role, tp.team_id, t.name
      )
      SELECT 
          player_id,
          first_name,
          last_name,
          bowling_style,
          playing_role,
          team_id,
          team_name,
          avg_fantasy_points,
          avg_fp_bowling_first,
          avg_fp_bowling_second,
          total_wickets,
          total_overs,
          avg_fp_at_venue
      FROM
          BowlerStats
      ORDER BY
          avg_fantasy_points DESC;
    `, [team1, team2, team2, team1]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});










// pl labs
app.get('/new/team-stats', async (req, res) => {
  const team1 = req.query.team1;
  const team2 = req.query.team2;

  if (!team1 || !team2) {
    return res.status(400).send('Team IDs are required');
  }

  try {
    const query = `
      WITH Last5MatchesTeam1 AS (
          SELECT 
              m.id AS match_id,
              m.winning_team_id,
              CASE 
                  WHEN m.winning_team_id = ? THEN 'W'
                  ELSE 'L'
              END AS result
          FROM 
              matches m
          WHERE 
              m.team_1 = ? OR m.team_2 = ?
          ORDER BY 
              m.date_start DESC
          LIMIT 5
      ),
      Last5MatchesTeam2 AS (
          SELECT 
              m.id AS match_id,
              m.winning_team_id,
              CASE 
                  WHEN m.winning_team_id = ? THEN 'W'
                  ELSE 'L'
              END AS result
          FROM 
              matches m
          WHERE 
              m.team_1 = ? OR m.team_2 = ?
          ORDER BY 
              m.date_start DESC
          LIMIT 5
      )
      SELECT 
          'Team1' AS team,
          GROUP_CONCAT(result ORDER BY match_id) AS last_5_matches
      FROM Last5MatchesTeam1
      UNION ALL
      SELECT 
          'Team2' AS team,
          GROUP_CONCAT(result ORDER BY match_id) AS last_5_matches
      FROM Last5MatchesTeam2;
    `;

    const [rows] = await pool.query(query, [
      team1, team1, team1,
      team2, team2, team2
    ]);

    // Format the response
    const formattedResponse = {
      team1: rows.find(row => row.team === 'Team1')?.last_5_matches?.split(',') || [],
      team2: rows.find(row => row.team === 'Team2')?.last_5_matches?.split(',') || []
    };

    res.json(formattedResponse);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/new/matches-against-each-other', async (req, res) => {
  const team1 = req.query.team1;
  const team2 = req.query.team2;

  if (!team1 || !team2) {
    return res.status(400).send('Team IDs are required');
  }

  try {
    const query = `
      WITH MatchesAgainstEachOther AS (
          SELECT 
              m.id AS match_id,
              m.winning_team_id,
              CASE 
                  WHEN m.winning_team_id = ? THEN 'W'
                  ELSE 'L'
              END AS result_team1,
              CASE 
                  WHEN m.winning_team_id = ? THEN 'W'
                  ELSE 'L'
              END AS result_team2
          FROM 
              matches m
          WHERE 
              (m.team_1 = ? AND m.team_2 = ?) OR (m.team_1 = ? AND m.team_2 = ?)
          ORDER BY 
              m.date_start DESC
          LIMIT 5
      )
      SELECT 
          'AgainstEachOtherTeam1' AS team,
          GROUP_CONCAT(result_team1 ORDER BY match_id) AS matches_against_each_other
      FROM MatchesAgainstEachOther
      UNION ALL
      SELECT 
          'AgainstEachOtherTeam2' AS team,
          GROUP_CONCAT(result_team2 ORDER BY match_id) AS matches_against_each_other
      FROM MatchesAgainstEachOther;
    `;

    const [rows] = await pool.query(query, [
      team1, team2, team1, team2, team1, team2, team2, team1
    ]);

    // Format the response
    const formattedResponse = {
      againstEachOther: {
        team1: rows.find(row => row.team === 'AgainstEachOtherTeam1')?.matches_against_each_other?.split(',') || [],
        team2: rows.find(row => row.team === 'AgainstEachOtherTeam2')?.matches_against_each_other?.split(',') || []
      }
    };

    res.json(formattedResponse);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});


const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// comment





app.get('/new/team-stats-and-prediction', async (req, res) => {
  const team1 = req.query.team1;
  const team2 = req.query.team2;

  if (!team1 || !team2) {
    return res.status(400).send('Team IDs are required');
  }

  try {
    const teamLast5MatchesQuery = `
      WITH Last5MatchesTeam1 AS (
          SELECT 
              m.id AS match_id,
              m.date_start,
              m.team_1,
              m.team_2,
              m.winning_team_id,
              CASE 
                  WHEN m.winning_team_id = ? THEN 'W'
                  ELSE 'L'
              END AS result,
              (SELECT SUM(CAST(SUBSTRING_INDEX(scores, '/', 1) AS UNSIGNED)) FROM match_innings_test WHERE match_id = m.id AND batting_team_id = m.team_1) AS team_1_runs,
              (SELECT SUM(CAST(SUBSTRING_INDEX(scores, '/', 1) AS UNSIGNED)) FROM match_innings_test WHERE match_id = m.id AND batting_team_id = m.team_2) AS team_2_runs,
              (SELECT SUM(CAST(SUBSTRING_INDEX(scores, '/', -1) AS UNSIGNED)) FROM match_innings_test WHERE match_id = m.id AND batting_team_id = m.team_1) AS team_1_wickets,
              (SELECT SUM(CAST(SUBSTRING_INDEX(scores, '/', -1) AS UNSIGNED)) FROM match_innings_test WHERE match_id = m.id AND batting_team_id = m.team_2) AS team_2_wickets
          FROM 
              matches m
          WHERE 
              m.team_1 = ? OR m.team_2 = ?
          ORDER BY 
              m.date_start DESC
          LIMIT 5
      ),
      Last5MatchesTeam2 AS (
          SELECT 
              m.id AS match_id,
              m.date_start,
              m.team_1,
              m.team_2,
              m.winning_team_id,
              CASE 
                  WHEN m.winning_team_id = ? THEN 'W'
                  ELSE 'L'
              END AS result,
              (SELECT SUM(CAST(SUBSTRING_INDEX(scores, '/', 1) AS UNSIGNED)) FROM match_innings_test WHERE match_id = m.id AND batting_team_id = m.team_1) AS team_1_runs,
              (SELECT SUM(CAST(SUBSTRING_INDEX(scores, '/', 1) AS UNSIGNED)) FROM match_innings_test WHERE match_id = m.id AND batting_team_id = m.team_2) AS team_2_runs,
              (SELECT SUM(CAST(SUBSTRING_INDEX(scores, '/', -1) AS UNSIGNED)) FROM match_innings_test WHERE match_id = m.id AND batting_team_id = m.team_1) AS team_1_wickets,
              (SELECT SUM(CAST(SUBSTRING_INDEX(scores, '/', -1) AS UNSIGNED)) FROM match_innings_test WHERE match_id = m.id AND batting_team_id = m.team_2) AS team_2_wickets
          FROM 
              matches m
          WHERE 
              m.team_1 = ? OR m.team_2 = ?
          ORDER BY 
              m.date_start DESC
          LIMIT 5
      ),
      MatchesAgainstEachOther AS (
          SELECT 
              m.id AS match_id,
              m.date_start,
              m.winning_team_id,
              CASE 
                  WHEN m.winning_team_id = ? THEN 'W'
                  ELSE 'L'
              END AS result_team1,
              CASE 
                  WHEN m.winning_team_id = ? THEN 'W'
                  ELSE 'L'
              END AS result_team2,
              (SELECT SUM(CAST(SUBSTRING_INDEX(scores, '/', 1) AS UNSIGNED)) FROM match_innings_test WHERE match_id = m.id AND batting_team_id = ?) AS team_1_runs,
              (SELECT SUM(CAST(SUBSTRING_INDEX(scores, '/', 1) AS UNSIGNED)) FROM match_innings_test WHERE match_id = m.id AND batting_team_id = ?) AS team_2_runs,
              (SELECT SUM(CAST(SUBSTRING_INDEX(scores, '/', -1) AS UNSIGNED)) FROM match_innings_test WHERE match_id = m.id AND batting_team_id = ?) AS team_1_wickets,
              (SELECT SUM(CAST(SUBSTRING_INDEX(scores, '/', -1) AS UNSIGNED)) FROM match_innings_test WHERE match_id = m.id AND batting_team_id = ?) AS team_2_wickets
          FROM 
              matches m
          WHERE 
              (m.team_1 = ? AND m.team_2 = ?) OR (m.team_1 = ? AND m.team_2 = ?)
          ORDER BY 
              m.date_start DESC
          LIMIT 5
      )
      SELECT 
          'Team1' AS team,
          GROUP_CONCAT(result ORDER BY match_id) AS last_5_matches,
          AVG(team_1_runs) AS avg_runs,
          AVG(team_1_wickets) AS avg_wickets,
          NULL AS matches_against_each_other_team1,
          NULL AS matches_against_each_other_team2
      FROM Last5MatchesTeam1
      UNION ALL
      SELECT 
          'Team2' AS team,
          GROUP_CONCAT(result ORDER BY match_id) AS last_5_matches,
          AVG(team_2_runs) AS avg_runs,
          AVG(team_2_wickets) AS avg_wickets,
          NULL AS matches_against_each_other_team1,
          NULL AS matches_against_each_other_team2
      FROM Last5MatchesTeam2
      UNION ALL
      SELECT 
          'AgainstEachOther' AS team,
          GROUP_CONCAT(result_team1 ORDER BY match_id) AS last_5_matches,
          AVG(team_1_runs) AS avg_runs,
          AVG(team_1_wickets) AS avg_wickets,
          GROUP_CONCAT(result_team1 ORDER BY match_id) AS matches_against_each_other_team1,
          GROUP_CONCAT(result_team2 ORDER BY match_id) AS matches_against_each_other_team2
      FROM MatchesAgainstEachOther;
    `;

    const [rows] = await pool.query(teamLast5MatchesQuery, [
      team1, team1, team1,
      team2, team2, team2,
      team1, team1, team2, team2, team1, team2,
      team1, team2, team1, team2, team2, team1, team2, team1
    ]);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});




