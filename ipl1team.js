// const axios = require('axios');
// const mysql = require('mysql2/promise');

// // Assuming you have the dotenv package installed and your .env file set up

const mysql = require("mysql2/promise");
const axios = require("axios");
require("dotenv").config();




const url = 'https://rest.entitysport.com/v2/teams/19/matches?status=2&token=73d62591af4b3ccb51986ff5f8af5676';

// Function to fetch match IDs
const fetchMatchIds = async () => {
  try {
    const response = await axios.get(url);
    const data = response.data;

    if (data.status === 'ok') {
      const matchIds = data.response.items.map(item => item.match_id);
      console.log(matchIds);
      return matchIds;
    } else {
      console.error('Error: Status not OK');
    }
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};


// insertData();
// venue  ,   match_squad,  players, matches

var team_id = 127775

// const teams = [17]

async function insertData1() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
    });

    const response = await axios.get(
    //   "https://rest.entitysport.com/v2/competitions/128414/matches?token=73d62591af4b3ccb51986ff5f8af5676&per_page=80"
    `https://rest.entitysport.com/v2/teams/${team_id}/matches?status=2&token=73d62591af4b3ccb51986ff5f8af5676&per_page=10`
    );
    const matches = response.data.response.items;
    
  

    for (const match of matches) {
        console.log(matches)
      if (match.status_str === "Completed") {
        // Enhanced Venue Insertion with additional details
        await connection.query(
          `
                INSERT INTO venues (id, name, city, country, status)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE name=VALUES(name), city=VALUES(city), country=VALUES(country), status=VALUES(status);
            `,
          [
            match.venue.venue_id,
            match.venue.name,
            match.venue.location,
            match.venue.country,
            "Active",
          ]
        );

        // Enhanced Team Insertion with logos and additional details
        await connection.query(
          `
        INSERT INTO matches (
            id,tournament_id, team_1, team_2, venue_id, format_str, match_number, status_str, result_type, win_margin, title, subtitle, 
            short_title, status_note, verified, pre_squad, odds_available, game_state, game_state_str, domestic, 
            date_start, date_end, date_start_ist, umpires, referee, equation, live, winning_team_id, commentary, wagon, 
            latest_inning_number, presquad_time, verify_time, match_dls_affected, live_inning_number, day, session,
            toss_text, toss_winner, toss_decision, pitch_condition, batting_condition, pace_bowling_condition, spine_bowling_condition, competition_id,
            team_1_score, team_2_score
        )
        VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
        ON DUPLICATE KEY UPDATE
            tournament_id=VALUES(tournament_id),team_1=VALUES(team_1), team_2=VALUES(team_2), venue_id=VALUES(venue_id), format_str=VALUES(format_str),
            match_number=VALUES(match_number), status_str=VALUES(status_str), result_type=VALUES(result_type), win_margin=VALUES(win_margin),
            title=VALUES(title), subtitle=VALUES(subtitle), short_title=VALUES(short_title), status_note=VALUES(status_note),
            verified=VALUES(verified), pre_squad=VALUES(pre_squad), odds_available=VALUES(odds_available), game_state=VALUES(game_state),
            game_state_str=VALUES(game_state_str), domestic=VALUES(domestic), date_start=VALUES(date_start), date_end=VALUES(date_end),
            date_start_ist=VALUES(date_start_ist), umpires=VALUES(umpires), referee=VALUES(referee), equation=VALUES(equation), live=VALUES(live),
            winning_team_id=VALUES(winning_team_id), commentary=VALUES(commentary), wagon=VALUES(wagon), latest_inning_number=VALUES(latest_inning_number),
            presquad_time=VALUES(presquad_time), verify_time=VALUES(verify_time), match_dls_affected=VALUES(match_dls_affected),
            live_inning_number=VALUES(live_inning_number), day=VALUES(day), session=VALUES(session), toss_text=VALUES(toss_text),
            toss_winner=VALUES(toss_winner), toss_decision=VALUES(toss_decision), pitch_condition=VALUES(pitch_condition),
            batting_condition=VALUES(batting_condition), pace_bowling_condition=VALUES(pace_bowling_condition), spine_bowling_condition=VALUES(spine_bowling_condition), competition_id=VALUES(competition_id),
            team_1_score=VALUES(team_1_score), team_2_score=VALUES(team_2_score)
        `,
          [
            match.match_id,
            tournament_id=0,
            match.teama.team_id,
            match.teamb.team_id,
            match.venue.venue_id,
            match.format_str,
            match.match_number,
            match.status_str,
            match.result_type,
            match.win_margin,
            match.title,
            match.subtitle,
            match.short_title,
            match.status_note,
            match.verified === "true" ? 1 : 0,
            match.pre_squad === "true" ? 1 : 0,
            match.odds_available === "true" ? 1 : 0,
            match.game_state,
            match.game_state_str,
            match.domestic === "1" ? 1 : 0,
            match.date_start,
            match.date_end,
            match.date_start_ist,
            match.umpires,
            match.referee,
            match.equation,
            match.live,
            match.winning_team_id,
            match.commentary === "true" ? 1 : 0,
            match.wagon === "true" ? 1 : 0,
            match.latest_inning_number,
            match.presquad_time,
            match.verify_time,
            match.match_dls_affected === "true" ? 1 : 0,
            match.live_inning_number,
            match.day,
            match.session,
            match.toss.text,
            match.toss.winner,
            match.toss.decision,
            match.pitch.pitch_condition,
            match.pitch.batting_condition,
            match.pitch.pace_bowling_condition,
            match.pitch.spine_bowling_condition,
            match.competition.cid,
            match.teama.scores,  // Score from team A
            match.teamb.scores   // Score from team B
          ]
        );

        console.log("gihihihihihii")

        // Handle Players and Match Squads more comprehensively
        const squadsResponse = await axios.get(
          `https://rest.entitysport.com/v2/competitions/${match.competition.cid}/squads?token=73d62591af4b3ccb51986ff5f8af5676`
        //   `https://rest.entitysport.com/v2/matches/${match.match_id}/squads?token=73d62591af4b3ccb51986ff5f8af5676`

        );
        const teams = squadsResponse.data.response.squads;

        // Iterate through each team and their players
        for (const team of teams) {
          for (const player of team.players) {
            await connection.query(
              `
                INSERT INTO players (
                    id, first_name, last_name, middle_name, short_name, alt_name, dob, birthplace, country,
                    primary_teams, image, image_alt, playing_role, batting_style, bowling_style, fielding_position,
                    facebook_profile, twitter_profile, instagram_profile, nationality, gender, jersey_number,
                    ipl_debut, debut_data, fantasy_player_rating, meta_title, meta_description, meta_keywords,
                    breadcrumb, heading, api_id, is_active_player, status, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    first_name=VALUES(first_name), last_name=VALUES(last_name), middle_name=VALUES(middle_name),
                    short_name=VALUES(short_name), alt_name=VALUES(alt_name), dob=VALUES(dob), birthplace=VALUES(birthplace),
                    country=VALUES(country), primary_teams=VALUES(primary_teams), image=VALUES(image), image_alt=VALUES(image_alt),
                    playing_role=VALUES(playing_role), batting_style=VALUES(batting_style), bowling_style=VALUES(bowling_style),
                    fielding_position=VALUES(fielding_position), facebook_profile=VALUES(facebook_profile),
                    twitter_profile=VALUES(twitter_profile), instagram_profile=VALUES(instagram_profile),
                    nationality=VALUES(nationality), gender=VALUES(gender), jersey_number=VALUES(jersey_number),
                    ipl_debut=VALUES(ipl_debut), debut_data=VALUES(debut_data), fantasy_player_rating=VALUES(fantasy_player_rating),
                    meta_title=VALUES(meta_title), meta_description=VALUES(meta_description), meta_keywords=VALUES(meta_keywords),
                    breadcrumb=VALUES(breadcrumb), heading=VALUES(heading), api_id=VALUES(api_id),
                    is_active_player=VALUES(is_active_player), status=VALUES(status), updated_at=NOW()
            `,
              [
                player.pid,
                player.first_name,
                player.last_name || "",
                player.middle_name || "",
                player.short_name,
                player.alt_name,
                player.birthdate ? player.birthdate : null, // Only insert date if valid, otherwise null
                player.birthplace,
                player.country,
                JSON.stringify(player.primary_team),
                player.logo_url,
                player.thumb_url,
                player.playing_role,
                player.batting_style,
                player.bowling_style,
                player.fielding_position,
                player.facebook_profile,
                player.twitter_profile,
                player.instagram_profile,
                player.nationality,
                player.gender,
                player.jersey_number || null,
                player.ipl_debut || "",
                player.debut_data || "",
                player.fantasy_player_rating || "",
                "", // meta_title
                "", // meta_description
                JSON.stringify([]), // meta_keywords
                "", // breadcrumb
                "", // heading
                "", // api_id
                1, // is_active_player
                1, // status
                new Date().toISOString().slice(0, 19).replace("T", " "),
                new Date().toISOString().slice(0, 19).replace("T", " "),
              ]
            );
          }
        }
        const teamIds = [match.teama.team_id, match.teamb.team_id];
        for (const teamId of teamIds) {
          const squadsResponse = await axios.get(
            `https://rest.entitysport.com/v2/matches/${match.match_id}/squads?token=73d62591af4b3ccb51986ff5f8af5676`
          );
          const team =
            teamId === match.teama.team_id
              ? squadsResponse.data.response.teama
              : squadsResponse.data.response.teamb;

          for (const player of team.squads) {
            await connection.execute(
              `INSERT INTO match_squads (
                    match_id, team_id, player_id, substitute, \`out\`, \`in\`, role_str, role, playing11, ordering)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                    team_id=VALUES(team_id), player_id=VALUES(player_id), substitute=VALUES(substitute), \`out\`=VALUES(\`out\`), \`in\`=VALUES(\`in\`), role_str=VALUES(role_str), role=VALUES(role), playing11=VALUES(playing11), ordering=VALUES(ordering)`,
              [
                match.match_id,
                teamId,
                player.player_id,
                player.substitute || "false",
                player.out || "false",
                player.in || "false",
                player.role_str || "",
                player.role || "",
                player.playing11 || "false",
                0, // Assuming 'ordering' is not provided and defaults to 0
              ]
            );
          }
        }

        // Additional data handling can be included here for other tables
      }
    }
    console.log("Data successfully inserted for all matches.");
  } catch (error) {
    console.error("Failed to insert data:", error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// insertData1();

// ining,battinginning, bowling inning ,fielding inning

async function insertData() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
    });

    // Fetch matches from API
    const response = await axios.get(
    //   "https://rest.entitysport.com/v2/competitions/128414/matches?token=73d62591af4b3ccb51986ff5f8af5676&per_page=80"
    `https://rest.entitysport.com/v2/teams/${team_id}/matches?status=2&token=73d62591af4b3ccb51986ff5f8af5676&per_page=10`

    );
    const matches = response.data.response.items;

    for (const match of matches) {
      if (match.status_str === "Completed") {
        // Insert data into Matches, Venues, Teams, and Players as before
        // Assume these insertions are already defined above

        // Fetch detailed scorecard for each match
        const scorecardResponse = await axios.get(
          `https://rest.entitysport.com/v2/matches/${match.match_id}/scorecard?token=73d62591af4b3ccb51986ff5f8af5676`
        );
        const innings = scorecardResponse.data.response.innings;

        for (const inning of innings) {
          // Insert Match Innings
          await connection.query(
            `
                      INSERT INTO match_innings_test (match_id, inning_number, batting_team_id, scores, scores_full)
                      VALUES (?, ?, ?, ?, ?)
                      ON DUPLICATE KEY UPDATE scores=VALUES(scores), scores_full=VALUES(scores_full);
                  `,
            [
              match.match_id,
              inning.number,
              inning.batting_team_id,
              inning.scores,
              innings.scores_full,
            ]
          );

          // Insert batters' performances
          for (const batsman of inning.batsmen) {
            console.log(batsman, "detail");
            await connection.query(
              `
      INSERT INTO match_inning_batters_test (
          match_id, inning_number, batsman_id, batting, position, role, role_str, 
          runs, balls_faced, fours, sixes, run0, run1, run2, run3, run5, 
          how_out, dismissal, strike_rate, bowler_id, first_fielder_id, second_fielder_id, 
          third_fielder_id, created_at, updated_at
      ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW()
      )
      ON DUPLICATE KEY UPDATE 
          batting=VALUES(batting), position=VALUES(position), role=VALUES(role),
          role_str=VALUES(role_str), runs=VALUES(runs), balls_faced=VALUES(balls_faced), 
          fours=VALUES(fours), sixes=VALUES(sixes), run0=VALUES(run0), run1=VALUES(run1), 
          run2=VALUES(run2), run3=VALUES(run3), run5=VALUES(run5), how_out=VALUES(how_out), 
          dismissal=VALUES(dismissal), strike_rate=VALUES(strike_rate), 
          bowler_id=VALUES(bowler_id), first_fielder_id=VALUES(first_fielder_id), 
          second_fielder_id=VALUES(second_fielder_id), third_fielder_id=VALUES(third_fielder_id), 
          updated_at=NOW();
  `,
              [
                match.match_id,
                inning.number,
                parseInt(batsman.batsman_id),
                batsman.batting === "true",
                batsman.position,
                batsman.role,
                batsman.role_str,
                parseInt(batsman.runs),
                parseInt(batsman.balls_faced),
                parseInt(batsman.fours),
                parseInt(batsman.sixes),
                parseInt(batsman.run0),
                parseInt(batsman.run1),
                parseInt(batsman.run2),
                parseInt(batsman.run3),
                parseInt(batsman.run5),
                batsman.how_out,
                batsman.dismissal,
                parseFloat(batsman.strike_rate),
                parseInt(batsman.bowler_id || 0),
                batsman.first_fielder_id
                  ? parseInt(batsman.first_fielder_id)
                  : null,
                batsman.second_fielder_id
                  ? parseInt(batsman.second_fielder_id)
                  : null,
                batsman.third_fielder_id
                  ? parseInt(batsman.third_fielder_id)
                  : null,
              ]
            );
          }

          // Insert bowlers' performances
          for (const bowler of inning.bowlers) {
            await connection.query(
              `
                  INSERT INTO match_inning_bowlers_test (
                      match_id, inning_number, bowler_id, bowling, position, overs, maidens, runs_conceded, 
                      wickets, noballs, wides, econ, run0, bowledcount, lbwcount, created_at, updated_at
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                  ON DUPLICATE KEY UPDATE 
                      bowling=VALUES(bowling), position=VALUES(position), overs=VALUES(overs), 
                      maidens=VALUES(maidens), runs_conceded=VALUES(runs_conceded), wickets=VALUES(wickets), 
                      noballs=VALUES(noballs), wides=VALUES(wides), econ=VALUES(econ), 
                      run0=VALUES(run0), bowledcount=VALUES(bowledcount), lbwcount=VALUES(lbwcount), 
                      updated_at=NOW();
                  `,
              [
                match.match_id,
                inning.number,
                bowler.bowler_id,
                bowler.bowling, // Assuming 'bowling' should be stored as a varchar
                bowler.position,
                parseFloat(bowler.overs),
                parseInt(bowler.maidens),
                parseInt(bowler.runs_conceded),
                parseInt(bowler.wickets),
                parseInt(bowler.noballs),
                parseInt(bowler.wides),
                parseFloat(bowler.econ),
                parseInt(bowler.run0),
                parseInt(bowler.bowledcount),
                parseInt(bowler.lbwcount),
              ]
            );
          }

          const fielders = Array.isArray(inning.fielder) ? inning.fielder : [];

          // Insert fielders' performances
          for (const fielder of fielders) {
            await connection.query(
              `
                          INSERT INTO match_inning_fielders_test (match_id, inning_number, fielder_id, fielder_name, catches, runout_thrower, runout_catcher, runout_direct_hit, stumping, is_substitute)
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                          ON DUPLICATE KEY UPDATE catches=VALUES(catches), runout_thrower=VALUES(runout_thrower), runout_catcher=VALUES(runout_catcher), runout_direct_hit=VALUES(runout_direct_hit), stumping=VALUES(stumping);
                      `,
              [
                match.match_id,
                inning.number,
                fielder.fielder_id,
                fielder.fielder_name,
                fielder.catches,
                fielder.runout_thrower,
                fielder.runout_catcher,
                fielder.runout_direct_hit,
                fielder.stumping,
                fielder.is_substitute,
              ]
            );
          }
        }
      }
    }

    console.log(
      "Data successfully inserted for all matches and related details."
    );
  } catch (error) {
    console.error("Failed to insert data:", error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

//data insertion in teams_player from colpetetion squads api


async function insertData3() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
    });

    const team_id = 127775; // Ensure to set the correct team_id
    const response1 = await axios.get(
      `https://rest.entitysport.com/v2/teams/${team_id}/matches?status=2&token=73d62591af4b3ccb51986ff5f8af5676&per_page=10`
    );

    const matches = response1.data.response.items;

    for (const match of matches) {
      const response = await axios.get(
        `https://rest.entitysport.com/v2/competitions/${match.competition.cid}/squads?token=73d62591af4b3ccb51986ff5f8af5676`
      );

      const teams = response.data.response.squads;

      for (const team of teams) {
        const teamId = team.team_id;

        // Check if team_id exists in teams table
        const [rows] = await connection.query('SELECT id FROM teams WHERE id = ?', [teamId]);
        if (rows.length === 0) {
          // Insert the team_id into teams table if it does not exist
          await connection.query('INSERT INTO teams (id, name) VALUES (?, ?)', [teamId, team.name]);
        }

        const players = team.players;

        for (const player of players) {
          const playerId = player.pid;

          // Insert team and player association into team_players table
          await connection.query(
            `INSERT INTO team_players (team_id, player_id) VALUES (?, ?)
             ON DUPLICATE KEY UPDATE team_id = VALUES(team_id), player_id = VALUES(player_id);`,
            [teamId, playerId]
          );
        }
      }
    }

    console.log("Data successfully inserted for all teams and players.");
  } catch (error) {
    console.error("Failed to insert data:", error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function insertFP() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
    });

    const team_id =127775; // Ensure to set the correct team_id
    const response = await axios.get(
      `https://rest.entitysport.com/v2/teams/${team_id}/matches?status=2&token=73d62591af4b3ccb51986ff5f8af5676&per_page=10`
    );

    const matches = response.data.response.items;

    for (const match of matches) {
      if (match.status_str === "Completed") {
        const matchDetailsResponse = await axios.get(
          `https://rest.entitysport.com/v2/matches/${match.match_id}/newpoint2?token=73d62591af4b3ccb51986ff5f8af5676`
        );
        const matchData = matchDetailsResponse.data.response;

        const teamAPlayers = Array.isArray(matchData.points.teama.playing11) ? matchData.points.teama.playing11 : [];
        const teamBPlayers = Array.isArray(matchData.points.teamb.playing11) ? matchData.points.teamb.playing11 : [];
        const players = [...teamAPlayers, ...teamBPlayers];

        for (const player of players) {
          const teamId = matchData.teama.team_id || matchData.teamb.team_id;

          // Log the team_id and player_id before insertion
          console.log(`Inserting data for team_id: ${teamId}, player_id: ${player.pid}`);

          // Check if team_id exists in teams table
          const [rows] = await connection.query('SELECT id FROM teams WHERE id = ?', [teamId]);
          if (rows.length === 0) {
            // Insert the team_id into teams table if it does not exist
            console.log(`team_id ${teamId} does not exist in teams table. Inserting.`);
            await connection.query('INSERT INTO teams (id, name) VALUES (?, ?)', [teamId, 'Unknown Team']);
          }

          await connection.query(
            `
              INSERT INTO fantasy_points_details (
                  match_id, 
                  player_id, 
                  team_id, 
                  points, 
                  runs, 
                  fours, 
                  sixes, 
                  catches, 
                  wickets, 
                  maiden_overs, 
                  strike_rate,
                  fifty,
                  duck,
                  run_outs,
                  stumping,
                  rating,
                  playing_role, 
                  created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
              ON DUPLICATE KEY UPDATE
                  team_id = VALUES(team_id),
                  points = VALUES(points),
                  runs = VALUES(runs),
                  fours = VALUES(fours),
                  sixes = VALUES(sixes),
                  catches = VALUES(catches),
                  wickets = VALUES(wickets),
                  maiden_overs = VALUES(maiden_overs),
                  strike_rate = VALUES(strike_rate),
                  fifty = VALUES(fifty),
                  duck = VALUES(duck),
                  run_outs = VALUES(run_outs),
                  stumping = VALUES(stumping),
                  rating = VALUES(rating),
                  playing_role = VALUES(playing_role)
              `,
            [
              matchData.match_id,
              player.pid,
              teamId,
              player.point,
              player.run,
              player.four,
              player.six,
              player.catch || 0,
              player.wkts || 0,
              player.maidenover || 0,
              player.sr || 0,
              player.fifty || 0,
              player.duck || 0,
              player.runoutcatcher + player.runoutstumping + player.runoutthrower || 0,
              player.stumping || 0,
              player.rating || null,
              player.role
            ]
          );
        }
        console.log("Data successfully inserted for all matches and related details.");
      }
    }
  } catch (error) {
    console.error("Failed to insert data:", error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// insertData3().catch(console.error);
// insertFP().catch(console.error);

// async function createDreamTeam() {
//     let connection;
//     try {
//         connection = await mysql.createConnection({
//             host: process.env.DB_HOST,
//             user: process.env.DB_USER,
//             password: process.env.DB_PASSWORD,
//             database: process.env.DB_NAME,
//             port: process.env.DB_PORT,
//         });

//         const response = await axios.get(`https://rest.entitysport.com/v2/competitions/128414/matches?token=${process.env.API_TOKEN}&per_page=80`);
//         const matches = response.data.response.items;

//         for (const match of matches) {
//             if (match.status_str === "Completed") {
//                 const [players] = await connection.execute(
//                     `SELECT player_id, points,playing_role, rating FROM fantasy_points_details WHERE match_id = ? ORDER BY points DESC`,
//                     [match.match_id]
//                 );

//                 let selectedPlayers = players.slice(0, 11);
//                 let currentRating = selectedPlayers.reduce((acc, player) => acc + player.rating, 0);

//                 while (currentRating > 100 && selectedPlayers.length > 0) {
//                     selectedPlayers.pop();
//                     currentRating = selectedPlayers.reduce((acc, player) => acc + player.rating, 0);
//                 }

//                 selectedPlayers.sort((a, b) => b.points - a.points);
//                 selectedPlayers.forEach((player, index) => {
//                     player.team_position = index + 1;
//                 });

//                 if (selectedPlayers.length === 11) {
//                     for (const player of selectedPlayers) {
//                         const role = player.team_position === 1 ? "Captain" : player.team_position === 2 ? "Vice Captain" : "Member";
//                         await connection.execute(
//                             `INSERT INTO DreamTeam_test (match_id, player_id, role, points, team_position,playing_role)
//                              VALUES (?, ?, ?, ?, ?, ?)
//                              ON DUPLICATE KEY UPDATE
//                              role = VALUES(role), points = VALUES(points), team_position = VALUES(team_position),playing_role=VALUES(playing_role)`,
//                             [match.match_id, player.player_id, role, player.points, player.team_position,player.playing_role]
//                         );
//                         await connection.execute(
//                             `INSERT INTO PlayerPerformance_test (player_id, match_id, times_in_dream_team, times_captain, times_vice_captain)
//                              VALUES (?, ?, 1, ?, ?)
//                              ON DUPLICATE KEY UPDATE
//                              times_in_dream_team = times_in_dream_team + 1,
//                              times_captain = times_captain + VALUES(times_captain),
//                              times_vice_captain = times_vice_captain + VALUES(times_vice_captain)`,
//                             [player.player_id, match.match_id, role === "Captain" ? 1 : 0, role === "Vice Captain" ? 1 : 0]
//                         );
//                     }
//                     console.log("Dream team created successfully for match:", match.match_id);
//                 } else {
//                     console.log("Insufficient players to form a Dream Team without exceeding the rating limit for match:", match.match_id);
//                 }
//             }
//         }
//     } catch (error) {
//         console.error("Failed to create dream team:", error);
//     } finally {
//         if (connection) {
//             await connection.end();
//         }
//     }
// }

async function createDreamTeam() {
  let connection;
  try {
      connection = await mysql.createConnection({
          host: process.env.DB_HOST,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
          port: process.env.DB_PORT,
      });

    //   const response = await axios.get(`https://rest.entitysport.com/v2/competitions/128414/matches?token=${process.env.API_TOKEN}&per_page=80`);
    //   const matches = response.data.response.items;
    const response = await axios.get(
        //   "https://rest.entitysport.com/v2/competitions/128414/matches?token=73d62591af4b3ccb51986ff5f8af5676&per_page=80"
        `https://rest.entitysport.com/v2/teams/${team_id}/matches?status=2&token=73d62591af4b3ccb51986ff5f8af5676&per_page=10`
    
        );
        const matches = response.data.response.items;

      for (const match of matches) {
          if (match.status_str === "Completed") {
              const [players] = await connection.execute(
                  `SELECT player_id, points, rating, players.playing_role FROM fantasy_points_details 
                   JOIN players ON players.id = fantasy_points_details.player_id
                   WHERE match_id = ? ORDER BY points DESC`,
                  [match.match_id]
              );

              let selectedPlayers = players.slice(0, 11);
              let hasWicketkeeper = selectedPlayers.some(player => player.playing_role.includes('wk'));

              if (!hasWicketkeeper) {
                  let wicketkeeper = players.find(player => player.playing_role.includes('wk'));
                  if (wicketkeeper) {
                      // Find the player with the least points to replace
                      let lowestIndex = selectedPlayers.reduce((lowest, player, index) => (player.points < selectedPlayers[lowest].points) ? index : lowest, 0);
                      selectedPlayers[lowestIndex] = wicketkeeper;
                  } else {
                      console.log("No wicketkeeper available for match:", match.match_id);
                      continue; // Skip this match if no wicketkeeper is available
                  }
              }

              selectedPlayers.sort((a, b) => b.points - a.points); // Sort by points descending

              selectedPlayers.forEach((player, index) => {
                  const role = index === 0 ? "Captain" : (index === 1 ? "Vice Captain" : "Member");
                  connection.execute(
                      `INSERT INTO DreamTeam_test (match_id, player_id, role, points, team_position, playing_role)
                       VALUES (?, ?, ?, ?, ?, ?)
                       ON DUPLICATE KEY UPDATE
                       role = VALUES(role), points = VALUES(points), team_position = VALUES(team_position), playing_role=VALUES(playing_role)`,
                      [match.match_id, player.player_id, role, player.points, index + 1, player.playing_role]
                  );

                  connection.execute(
                      `INSERT INTO PlayerPerformance_test (player_id, match_id, times_in_dream_team, times_captain, times_vice_captain)
                       VALUES (?, ?, 1, ?, ?)
                       ON DUPLICATE KEY UPDATE
                       times_in_dream_team = times_in_dream_team + 1,
                       times_captain = times_captain + VALUES(times_captain),
                       times_vice_captain = times_vice_captain + VALUES(times_vice_captain)`,
                      [player.player_id, match.match_id, role === "Captain" ? 1 : 0, role === "Vice Captain" ? 1 : 0]
                  );
              });

              console.log("Dream team created successfully for match:", match.match_id);
          }
      }
  } catch (error) {
      console.error("Failed to create dream team:", error);
  } finally {
      if (connection) {
          await connection.end();
      }
  }
}




//   insertFP()

// Call the function to start the process

async function runAllFunctions() {
  try {
    // const matchIds = await fetchMatchIds()

    // Call the first function and wait for it to complete
    await insertData1();
    console.log("Data insertion for insertData1 is complete.");

    // // Call the second function and wait for it to complete
    await insertData();
    console.log("Data insertion for insertData is complete.");

    // Call the third function and wait for it to complete
    await insertData3();
    console.log("Data insertion for insertData3 is complete.");

    // Call the fantasy points insertion function and wait for it to complete
    await insertFP();
    console.log("Fantasy points insertion is complete.");

    // // Call the function to create Dream Teams and wait for it to complete
    await createDreamTeam();
    console.log("Dream team creation is complete.");
  } catch (error) {
    console.error("Error during sequential function execution:", error);
  }
}

// insertFP()
// insertData1()
// Call the main function to start all operations
// for (teams in team_id){
    // console.log(team_id)
runAllFunctions();
// }

async function fetchAndStoreTournamentData() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
    });
    const tournamentsResponse = await axios.get(
      "https://rest.entitysport.com/v4/tournaments?token=73d62591af4b3ccb51986ff5f8af5676&per_page=80"
    );
    const tournaments = tournamentsResponse.data.response.items;

    for (const tournament of tournaments) {
      const { tournament_id, name, type } = tournament;

      await connection.execute(
        "INSERT INTO tournaments (tournament_id, name, type) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = ?, type = ?",
        [
          tournament_id || null,
          name || null,
          type || null,
          name || null,
          type || null,
        ]
      );

      const competitionsResponse = await axios.get(
        `https://rest.entitysport.com/v4/tournaments/${tournament_id}/competitions?token=73d62591af4b3ccb51986ff5f8af5676&per_page=80`
      );
      const competitions =
        competitionsResponse.data.response.items.competitions;

      for (const competition of competitions) {
        console.log("Inserting competition:", competition);
        await connection.execute(
          "INSERT INTO competitions (competition_id, tournament_id, name, season) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = ?, season = ?",
          [
            competition.cid || null,
            tournament_id || null,
            competition.title || null,
            competition.season || null,
            competition.title || null,
            competition.season || null,
          ]
        );
      }
    }
    console.log(
      "All tournaments and their competitions have been successfully fetched and stored."
    );
  } catch (error) {
    console.error("Failed to fetch or store data:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
    });
  } finally {
    if (connection) {
      console.log("Closing database connection.");
      await connection.end();
    }
  }
}



// List of tournament IDs to process
const tournamentIds = [1, 5, 6, 7, 8, 5, 10, 11, 12, 7, 14, 15, 16, 17, 18, 19, 20, 19, 22, 127775, 24, 11, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 44, 46, 47, 48, 49, 50, 51];

// Function to process each tournament
async function processTournaments() {
    for (const tournamentId of tournamentIds) {
        await processDataForTournament(tournamentId);
    }
}

async function processDataForTournament(tournamentId) {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT,
        });

        console.log(`Processing data for tournament ID: ${tournamentId}`);
        
        // Fetch competitions for the tournament
        const competitionsResponse = await axios.get(`https://rest.entitysport.com/v2/competitions/${tournamentId}/matches?token=73d62591af4b3ccb51986ff5f8af5676&per_page=80`);
        const competitions = competitionsResponse.data.response.items;
        
        // Iterate over competitions and process matches
        for (const competition of competitions) {
            // Your existing processing logic for matches
            await processMatches(competition.match_id);
        }

    } catch (error) {
        console.error("Failed to process tournament data:", error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Call the function to start processing
// processTournaments();



// async function fetchAndInsertTeams() {
//     let connection;
//     try {
//         connection = await mysql.createConnection({
//             host: process.env.DB_HOST,
//             user: process.env.DB_USER,
//             password: process.env.DB_PASSWORD,
//             database: process.env.DB_NAME,
//             port: process.env.DB_PORT,
//         });
  
//         const response = await axios.get(
//             "https://rest.entitysport.com/v2/competitions/128414/teams?token=73d62591af4b3ccb51986ff5f8af5676"
//         );
//         const teams = response.data.response.teams;
  
//         for (const team of teams) {
//             // Validate data before insertion
//             const teamId = team.team_id || team.tid;
//             const teamName = team.name || team.title;
//             const teamLogoUrl = team.logo_url || team.thumb_url;
//             const teamShortName = team.short_name || team.abbr;
  
//             if (!teamId || !teamName) {
//                 console.warn(`Skipping team due to missing data: ${JSON.stringify(team)}`);
//                 continue;
//             }
  
//             await connection.query(
//                 `INSERT INTO teams (id, name, logo_url, short_name)
//                  VALUES (?, ?, ?, ?)
//                  ON DUPLICATE KEY UPDATE name = VALUES(name), logo_url = VALUES(logo_url), short_name = VALUES(short_name);`,
//                 [teamId, teamName, teamLogoUrl, teamShortName]
//             );
//         }
  
//         console.log("Teams data successfully inserted.");
//     } catch (error) {
//         console.error("Failed to insert teams data:", error);
//     } finally {
//         if (connection) {
//             await connection.end();
//         }
//     }
//   }
  
//   fetchAndInsertTeams()
  