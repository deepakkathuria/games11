const mysql = require("mysql2/promise");
const axios = require("axios");
require("dotenv").config();

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
  
      let currentPage = 1;
      let totalPages = 1; // Initial assumption, will be updated after the first API call.
  
      do {
        // Fetch data for the current page
        const response = await axios.get(
          `https://rest.entitysport.com/v2/matches/?token=73d62591af4b3ccb51986ff5f8af5676&date=2024-10-01_2024-10-24&per_page=80&page=${currentPage}`
        );
        
        const matches = response.data.response.items;
        totalPages = response.data.response.total_pages; // Get total pages from the API response
        
        for (const match of matches) {
          const venueId = match.venue.venue_id;

          // console.log(match);
          if (!venueId) {
            console.warn(`Skipping insertion: venue_id is missing for match ${match.match_id}`);
            continue; // Skip to the next iteration if venue_id is missing
          }
          // Insert venue data
          await connection.query(
            `INSERT INTO venues (id, name, city, country, status)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE name=VALUES(name), city=VALUES(city), country=VALUES(country), status=VALUES(status);`,
            [
              match.venue.venue_id || null,  // Use null if venue_id is undefined or empty
              match.venue.name,
              match.venue.location,
              match.venue.country,
              "Active",
            ]
          );
  
          // Insert match data
          await connection.query(
            `INSERT INTO matches (
              id, tournament_id, team_1, team_2, venue_id, format_str, match_number, status_str, result_type, win_margin, title, subtitle, 
              short_title, status_note, verified, pre_squad, odds_available, game_state, game_state_str, domestic, 
              date_start, date_end, date_start_ist, umpires, referee, equation, live, winning_team_id, commentary, wagon, 
              latest_inning_number, presquad_time, verify_time, match_dls_affected, live_inning_number, day, session,
              toss_text, toss_winner, toss_decision, pitch_condition, batting_condition, pace_bowling_condition, spine_bowling_condition, competition_id,
              team_1_score, team_2_score
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
              team_1_score=VALUES(team_1_score), team_2_score=VALUES(team_2_score)`,
            [
              match.match_id || null, // Ensure match_id is not empty
              10, // tournament_id (custom value)
              match.teama.team_id,
              match.teamb.team_id,
              match.venue.venue_id,
              match.format_str,
              match.match_number,
              match.status_str,
              match.result_type || null,
              match.win_margin || null,
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
              match.presquad_time || null,
              match.verify_time || null,
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
              match.teama.scores,
              match.teamb.scores
            ]
          );
        }
  
        console.log(`Page ${currentPage} data inserted.`);
        currentPage++; // Move to the next page
  
      } while (currentPage <= totalPages); // Continue until all pages are processed
  
      console.log("All pages data successfully inserted.");
    } catch (error) {
      console.error("Failed to insert data:", error);
    } finally {
      if (connection) {
        await connection.end();
      }
    }
  }

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
  
      let currentPage = 1;
      let totalPages = 1; // Initialize with 1 to start the loop
  
      do {
        // Fetch data for the current page
        const response = await axios.get(
          `https://rest.entitysport.com/v2/matches/?token=73d62591af4b3ccb51986ff5f8af5676&date=2024-10-01_2024-10-24&per_page=80&page=${currentPage}`
        );
        
        const matches = response.data.response.items;
        totalPages = response.data.response.total_pages; // Get the total pages from the response
  
        for (const match of matches) {
          if (match.status_str === "Completed") {
            console.log("completed");
  
            // Fetch the scorecard details for the match
            const scorecardResponse = await axios.get(
              `https://rest.entitysport.com/v2/matches/${match.match_id}/scorecard?token=73d62591af4b3ccb51986ff5f8af5676`
            );
            const innings = scorecardResponse.data.response.innings;
  
            for (const inning of innings) {
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
                  inning.scores_full,
                ]
              );
  
              for (const batsman of inning.batsmen) {
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
                    !isNaN(parseInt(batsman.runs)) ? parseInt(batsman.runs) : 0,  // Check for NaN and set fallback
                    !isNaN(parseInt(batsman.balls_faced)) ? parseInt(batsman.balls_faced) : 0,  // Check for NaN and set fallback
                    !isNaN(parseInt(batsman.fours)) ? parseInt(batsman.fours) : 0,
                    !isNaN(parseInt(batsman.sixes)) ? parseInt(batsman.sixes) : 0,
                    !isNaN(parseInt(batsman.run0)) ? parseInt(batsman.run0) : 0,
                    !isNaN(parseInt(batsman.run1)) ? parseInt(batsman.run1) : 0,
                    !isNaN(parseInt(batsman.run2)) ? parseInt(batsman.run2) : 0,
                    !isNaN(parseInt(batsman.run3)) ? parseInt(batsman.run3) : 0,
                    !isNaN(parseInt(batsman.run5)) ? parseInt(batsman.run5) : 0,
                    batsman.how_out,
                    batsman.dismissal,
                    !isNaN(parseFloat(batsman.strike_rate)) ? parseFloat(batsman.strike_rate) : null,  // Check for NaN and set fallback
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
                    bowler.bowling,
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
  
        console.log(`Page ${currentPage} data inserted.`);
        currentPage++; // Move to the next page
  
      } while (currentPage <= totalPages); // Continue until all pages are processed
  
      console.log("All pages data successfully inserted.");
    } catch (error) {
      console.error("Failed to insert data:", error);
    } finally {
      if (connection) {
        await connection.end();
      }
    }
  }

// async function insertData3() {
//   let connection;
//   try {
//     connection = await mysql.createConnection({
//       host: process.env.DB_HOST,
//       user: process.env.DB_USER,
//       password: process.env.DB_PASSWORD,
//       database: process.env.DB_NAME,
//       port: process.env.DB_PORT,
//     });

//     const response = await axios.get(
//       "https://rest.entitysport.com/v2/competitions/128414/squads?token=73d62591af4b3ccb51986ff5f8af5676"
//     );

//     const teams = response.data.response.squads;

//     for (const team of teams) {
//       const teamId = team.team_id;
//       const players = team.players;

//       for (const player of players) {
//         const playerId = player.pid;

//         await connection.query(
//           `INSERT INTO team_players (team_id, player_id) VALUES (?, ?)
//            ON DUPLICATE KEY UPDATE team_id = VALUES(team_id), player_id = VALUES(player_id);`,
//           [teamId, playerId]
//         );
//       }
//     }

//     console.log("Data successfully inserted for all teams and players.");
//   } catch (error) {
//     console.error("Failed to insert data:", error);
//   } finally {
//     if (connection) {
//       await connection.end();
//     }
//   }
// }




// async function insertData3() {
//     let apiHitCount = 0;
  
//     apiHitCount++; // Increment the counter each time the function is called
//     console.log(`Players API has been hit ${apiHitCount} times`);
  
//     let connection;
//     try {
//       connection = await mysql.createConnection({
//         host: process.env.DB_HOST,
//         user: process.env.DB_USER,
//         password: process.env.DB_PASSWORD,
//         database: process.env.DB_NAME,
//         port: process.env.DB_PORT,
//       });
  
//       let currentPage = 1;
//       let totalPages = 1; // Initialize with 1 to start the loop
  
//       do {
//         // Fetch matches for the current page
//         const matchResponse = await axios.get(
//           `https://rest.entitysport.com/v2/matches/?token=73d62591af4b3ccb51986ff5f8af5676&date=2024-10-01_2024-10-24&per_page=80&page=${currentPage}`
//         );
//         const matches = matchResponse.data.response.items;
//         totalPages = matchResponse.data.response.total_pages; // Update total pages from the response
  
//         for (const match of matches) {
//           const matchId = match.match_id;
  
//           // Fetch squads for each match
//           const squadsResponse = await axios.get(
//             `https://rest.entitysport.com/v2/matches/${matchId}/squads?token=73d62591af4b3ccb51986ff5f8af5676`
//           );
  
//           const teamA = squadsResponse.data.response.teama;
//           const teamB = squadsResponse.data.response.teamb;
  
//           const teams = [teamA, teamB];
  
//           for (const team of teams) {
//             const teamId = team.team_id;
//             const players = team.squads;
  
//             for (const player of players) {
//               const playerId = player.player_id;
  
//               await connection.query(
//                 `INSERT INTO team_players (team_id, player_id) VALUES (?, ?)
//                  ON DUPLICATE KEY UPDATE team_id = VALUES(team_id), player_id = VALUES(player_id);`,
//                 [teamId, playerId]
//               );
//             }
//           }
//         }
  
//         console.log(`Page ${currentPage} data inserted.`);
//         currentPage++; // Move to the next page
  
//       } while (currentPage <= totalPages); // Continue until all pages are processed
  
//       console.log("Data successfully inserted for all matches and players.");
//     } catch (error) {
//       console.error("Failed to insert data:", error);
//     } finally {
//       if (connection) {
//         await connection.end();
//       }
//     }
//   }





  async function insertData3() {
    let apiHitCount = 0;
  
    apiHitCount++; // Increment the counter each time the function is called
    console.log(`Players API has been hit ${apiHitCount} times`);
  
    let connection;
    try {
      connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
      });
  
      let currentPage = 1;
      let totalPages = 1; // Initialize with 1 to start the loop
  
      do {
        // Fetch matches for the current page
        const matchResponse = await axios.get(
          `https://rest.entitysport.com/v2/matches/?token=73d62591af4b3ccb51986ff5f8af5676&date=2024-10-01_2024-10-24&per_page=80&page=${currentPage}`
        );
        const matches = matchResponse.data.response.items;
        totalPages = matchResponse.data.response.total_pages; // Update total pages from the response
  
        for (const match of matches) {
          const matchId = match.match_id;
  
          // Fetch squads for each match
          const squadsResponse = await axios.get(
            `https://rest.entitysport.com/v2/matches/${matchId}/squads?token=73d62591af4b3ccb51986ff5f8af5676`
          );
  
          const teamA = squadsResponse.data.response.teama;
          const teamB = squadsResponse.data.response.teamb;
  
          const teams = [teamA, teamB];
  
          for (const team of teams) {
            const teamId = team.team_id;
            const players = team.squads;
  
            for (const player of players) {
              const playerId = player.player_id;
              const firstName = player.firstname || null;
              const lastName = player.lastname || null;
              const middleName = player.middle_name || null;
              const slug = player.slug || null;
              const shortName = player.shortname || null;
              const altName = player.alt_name || null;
              const dob = player.birthdate || null;
              const birthplace = player.birthplace || null;
              const country = player.country || null;
              const primaryTeams = player.primary_teams || null;
              const image = player.image_url || null;
              const imageAlt = player.image_alt || null;
              const playingRole = player.playing_role || null;
              const battingStyle = player.batting_style || null;
              const bowlingStyle = player.bowling_style || null;
              const fieldingPosition = player.fielding_position || null;
              const nationality = player.nationality || null;
              const gender = player.gender || null;
              const jerseyNumber = player.jersey_number || null;
              const fantasyPlayerRating = player.fantasy_player_rating || null;
              const apiId = playerId;  // Use API ID directly for `api_id` field
  
              // Insert or update the player in the `players` table
              await connection.query(
                `INSERT INTO players (id, first_name, last_name, middle_name, slug, short_name, alt_name, dob, birthplace, country, primary_teams, image, image_alt, playing_role, batting_style, bowling_style, fielding_position, nationality, gender, jersey_number, fantasy_player_rating, api_id, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                 ON DUPLICATE KEY UPDATE 
                 first_name = VALUES(first_name),
                 last_name = VALUES(last_name),
                 middle_name = VALUES(middle_name),
                 slug = VALUES(slug),
                 short_name = VALUES(short_name),
                 alt_name = VALUES(alt_name),
                 dob = VALUES(dob),
                 birthplace = VALUES(birthplace),
                 country = VALUES(country),
                 primary_teams = VALUES(primary_teams),
                 image = VALUES(image),
                 image_alt = VALUES(image_alt),
                 playing_role = VALUES(playing_role),
                 batting_style = VALUES(batting_style),
                 bowling_style = VALUES(bowling_style),
                 fielding_position = VALUES(fielding_position),
                 nationality = VALUES(nationality),
                 gender = VALUES(gender),
                 jersey_number = VALUES(jersey_number),
                 fantasy_player_rating = VALUES(fantasy_player_rating),
                 updated_at = NOW();`,
                [
                  playerId,
                  firstName,
                  lastName,
                  middleName,
                  slug,
                  shortName,
                  altName,
                  dob,
                  birthplace,
                  country,
                  primaryTeams,
                  image,
                  imageAlt,
                  playingRole,
                  battingStyle,
                  bowlingStyle,
                  fieldingPosition,
                  nationality,
                  gender,
                  jerseyNumber,
                  fantasyPlayerRating,
                  apiId
                ]
              );
  
              // Now insert/update the player-team association in the `team_players` table
              await connection.query(
                `INSERT INTO team_players (team_id, player_id) VALUES (?, ?)
                 ON DUPLICATE KEY UPDATE team_id = VALUES(team_id), player_id = VALUES(player_id);`,
                [teamId, playerId]
              );
            }
          }
        }
  
        console.log(`Page ${currentPage} data inserted.`);
        currentPage++; // Move to the next page
  
      } while (currentPage <= totalPages); // Continue until all pages are processed
  
      console.log("Data successfully inserted for all matches and players.");
    } catch (error) {
      console.error("Failed to insert data:", error);
    } finally {
      if (connection) {
        await connection.end();
      }
    }
  }
  
  

  // async function insertFP() {
  //   let connection;
  //   try {
  //     connection = await mysql.createConnection({
  //       host: process.env.DB_HOST,
  //       user: process.env.DB_USER,
  //       password: process.env.DB_PASSWORD,
  //       database: process.env.DB_NAME,
  //       port: process.env.DB_PORT,
  //     });
  
  //     let currentPage = 1;
  //     let totalPages = 1; // Initialize with 1 to start the loop
  
  //     do {
  //       // Fetch matches for the current page
  //       const response = await axios.get(
  //         `https://rest.entitysport.com/v2/matches/?token=73d62591af4b3ccb51986ff5f8af5676&date=2024-10-01_2024-10-24&per_page=80&page=${currentPage}`
  //       );
  //       const matches = response.data.response.items;
  //       totalPages = response.data.response.total_pages; // Get total pages from the API response
  
  //       for (const match of matches) {
  //         if (match.status_str === "Completed") {
  //           const matchDetailsResponse = await axios.get(
  //             `https://rest.entitysport.com/v2/matches/${match.match_id}/newpoint2?token=73d62591af4b3ccb51986ff5f8af5676`
  //           );
  //           const matchData = matchDetailsResponse.data.response;
  
  //           const teamAPlayers = Array.isArray(matchData.points.teama.playing11)
  //             ? matchData.points.teama.playing11
  //             : [];
  //           const teamBPlayers = Array.isArray(matchData.points.teamb.playing11)
  //             ? matchData.points.teamb.playing11
  //             : [];
  //           const players = [...teamAPlayers, ...teamBPlayers];
  
  //           for (const player of players) {
  //             await connection.query(
  //               `
  //                 INSERT INTO fantasy_points_details (
  //                     match_id, 
  //                     player_id, 
  //                     team_id, 
  //                     points, 
  //                     runs, 
  //                     fours, 
  //                     sixes, 
  //                     catches, 
  //                     wickets, 
  //                     maiden_overs, 
  //                     strike_rate,
  //                     fifty,
  //                     duck,
  //                     run_outs,
  //                     stumping,
  //                     rating,
  //                     playing_role, 
  //                     created_at
  //                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
  //                 ON DUPLICATE KEY UPDATE
  //                     team_id = VALUES(team_id),
  //                     points = VALUES(points),
  //                     runs = VALUES(runs),
  //                     fours = VALUES(fours),
  //                     sixes = VALUES(sixes),
  //                     catches = VALUES(catches),
  //                     wickets = VALUES(wickets),
  //                     maiden_overs = VALUES(maiden_overs),
  //                     strike_rate = VALUES(strike_rate),
  //                     fifty = VALUES(fifty),
  //                     duck = VALUES(duck),
  //                     run_outs = VALUES(run_outs),
  //                     stumping = VALUES(stumping),
  //                     rating = VALUES(rating),
  //                     playing_role = VALUES(playing_role)
  //               `,
  //               [
  //                 matchData.match_id,
  //                 player.pid,
  //                 matchData.teama.team_id || matchData.teamb.team_id,
  //                 player.point,
  //                 player.run,
  //                 player.four,
  //                 player.six,
  //                 player.catch || 0,
  //                 player.wkts || 0,
  //                 player.maidenover || 0,
  //                 player.sr || 0,
  //                 player.fifty || 0,
  //                 player.duck || 0,
  //                 player.runoutcatcher + player.runoutstumping + player.runoutthrower || 0,
  //                 player.stumping || 0,
  //                 player.rating || null,
  //                 player.role
  //               ]
  //             );
  //           }
  
  //           console.log(`Fantasy points successfully inserted for match ${match.match_id}.`);
  //         }
  //       }
  
  //       console.log(`Page ${currentPage} data processed.`);
  //       currentPage++; // Move to the next page
  
  //     } while (currentPage <= totalPages); // Continue until all pages are processed
  
  //     console.log("Fantasy points insertion complete for all matches and pages.");
  //   } catch (error) {
  //     console.error("Failed to insert data:", error);
  //   } finally {
  //     if (connection) {
  //       await connection.end();
  //     }
  //   }
  // }

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
  
      let currentPage = 1;
      let totalPages = 1; // Initialize with 1 to start the loop
  
      do {
        // Fetch matches for the current page
        const response = await axios.get(
          `https://rest.entitysport.com/v2/matches/?token=73d62591af4b3ccb51986ff5f8af5676&date=2024-10-01_2024-10-24&per_page=80&page=${currentPage}`
        );
        const matches = response.data.response.items;
        totalPages = response.data.response.total_pages; // Get total pages from the API response
  
        for (const match of matches) {
          if (match.status_str === "Completed") {
            const matchDetailsResponse = await axios.get(
              `https://rest.entitysport.com/v2/matches/${match.match_id}/newpoint2?token=73d62591af4b3ccb51986ff5f8af5676`
            );
            const matchData = matchDetailsResponse.data.response;
  
            const teamAPlayers = Array.isArray(matchData.points.teama.playing11)
              ? matchData.points.teama.playing11
              : [];
            const teamBPlayers = Array.isArray(matchData.points.teamb.playing11)
              ? matchData.points.teamb.playing11
              : [];
            const players = [...teamAPlayers, ...teamBPlayers];
  
            for (const player of players) {
              const playerId = player.pid;
              const playerName = player.name || null;
              const playingRole = player.role || null;
  
              // Ensure player is inserted into `players` table before inserting fantasy points
              await connection.query(
                `INSERT INTO players (id, first_name, playing_role) 
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE 
                 first_name = VALUES(first_name), playing_role = VALUES(playing_role);`,
                [playerId, playerName, playingRole]
              );
  
              // Now insert or update the fantasy points for the player
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
                  playerId,
                  matchData.teama.team_id || matchData.teamb.team_id,
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
  
            console.log(`Fantasy points successfully inserted for match ${match.match_id}.`);
          }
        }
  
        console.log(`Page ${currentPage} data processed.`);
        currentPage++; // Move to the next page
  
      } while (currentPage <= totalPages); // Continue until all pages are processed
  
      console.log("Fantasy points insertion complete for all matches and pages.");
    } catch (error) {
      console.error("Failed to insert data:", error);
    } finally {
      if (connection) {
        await connection.end();
      }
    }
  }
  
  


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

    let currentPage = 1;
    let totalPages = 1; // Initialize with 1 to start the loop

    do {
      // Fetch matches for the current page
      const response = await axios.get(
        `https://rest.entitysport.com/v2/matches/?token=73d62591af4b3ccb51986ff5f8af5676&date=2024-10-01_2024-10-24&per_page=80&page=${currentPage}`
      );
      const matches = response.data.response.items;
      totalPages = response.data.response.total_pages; // Get total pages from the API response

      for (const match of matches) {
        console.log(match.status_str);

        if (match.status_str === "Completed") {
          const [players] = await connection.execute(
            `SELECT player_id, points, rating, players.playing_role 
             FROM fantasy_points_details 
             JOIN players ON players.id = fantasy_points_details.player_id
             WHERE match_id = ? ORDER BY points DESC`,
            [match.match_id]
          );

          let selectedPlayers = players.slice(0, 11);
          let hasWicketkeeper = selectedPlayers.some(player => player.playing_role.includes('wk'));

          // Ensure there is a wicketkeeper in the dream team
          if (!hasWicketkeeper) {
            let wicketkeeper = players.find(player => player.playing_role.includes('wk'));
            if (wicketkeeper) {
              let lowestIndex = selectedPlayers.reduce(
                (lowest, player, index) => (player.points < selectedPlayers[lowest].points ? index : lowest), 
                0
              );
              selectedPlayers[lowestIndex] = wicketkeeper;
            } else {
              console.log("No wicketkeeper available for match:", match.match_id);
              continue;
            }
          }

          // Sort selected players based on points
          selectedPlayers.sort((a, b) => b.points - a.points);

          // Insert the dream team data into the database
          selectedPlayers.forEach((player, index) => {
            const role = index === 0 ? "Captain" : (index === 1 ? "Vice Captain" : "Member");
            connection.execute(
              `INSERT INTO DreamTeam_test (match_id, player_id, role, points, team_position, playing_role)
               VALUES (?, ?, ?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE
               role = VALUES(role), points = VALUES(points), team_position = VALUES(team_position), playing_role = VALUES(playing_role)`,
              [match.match_id, player.player_id, role, player.points, index + 1, player.playing_role]
            );

            // Insert or update player performance details
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

      console.log(`Page ${currentPage} data processed.`);
      currentPage++; // Move to the next page

    } while (currentPage <= totalPages); // Continue until all pages are processed

    console.log("Dream team creation is complete for all matches and pages.");
  } catch (error) {
    console.error("Failed to create dream team:", error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}


async function runAllFunctions() {
  try {
    await insertData1();
    console.log("Data insertion for insertData1 is complete.");

    await insertData();
    console.log("Data insertion for insertData is complete.");

    await insertData3();
    console.log("Data insertion for insertData3 is complete.");

    await insertFP();
    console.log("Fantasy points insertion is complete.");

    await createDreamTeam();
    console.log("Dream team creation is complete.");
  } catch (error) {
    console.error("Error during sequential function execution:", error);
  }
}

// Call the main function to start all operations
runAllFunctions();

// insertData3()
