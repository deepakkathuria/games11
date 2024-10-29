const mysql = require("mysql2/promise");
const axios = require("axios");
require("dotenv").config();






// async function updatePlayerData() {
//     let connection;
//     try {
//       // Step 1: Establish connection with MySQL database
//       connection = await mysql.createConnection({
//         host: process.env.DB_HOST,
//         user: process.env.DB_USER,
//         password: process.env.DB_PASSWORD,
//         database: process.env.DB_NAME,
//         port: process.env.DB_PORT,
//       });
  
//       const players = [37, 123]; // Example player IDs
  
//       // Step 3: Iterate through each player ID and fetch data from the API
//       for (const player of players) {
//         const playerId = player;
  
//         try {
//           // Fetch player data from the API using the player ID
//           const response = await axios.get(
//             `https://rest.entitysport.com/v2/players/${playerId}?token=73d62591af4b3ccb51986ff5f8af5676`
//           );
//           const playerData = response.data.response.player;
//           console.log(playerData)
  
//           // Extract and map API fields to match your table columns
//           const {
//             title: first_name,
//             last_name = '',
//             middle_name = '',
//             short_name,
//             birthdate: dob,
//             birthplace,
//             country,
//             primary_team = [],
//             logo_url: image,
//             playing_role,
//             batting_style = '', // Ensure batting_style is directly mapped
//             bowling_style = '', // Ensure bowling_style is directly mapped
//             fielding_position,
//             facebook_profile,
//             twitter_profile,
//             instagram_profile,
//             nationality,
//             gender = null,
//             jersey_number = null,
//             debut_data,
//             fantasy_player_rating,
//           } = playerData;
  
//           // Update query with all mapped fields
//           await connection.query(
//             `UPDATE players 
//              SET 
//                first_name = ?, 
//                last_name = ?, 
//                middle_name = ?, 
//                short_name = ?, 
//                dob = ?, 
//                birthplace = ?, 
//                country = ?, 
//                primary_teams = ?, 
//                image = ?, 
//                playing_role = ?, 
//                batting_style = ?, 
//                bowling_style = ?, 
//                fielding_position = ?, 
//                facebook_profile = ?, 
//                twitter_profile = ?, 
//                instagram_profile = ?, 
//                nationality = ?, 
//                gender = ?, 
//                jersey_number = ?, 
//                debut_data = ?, 
//                fantasy_player_rating = ?, 
//                updated_at = NOW()
//              WHERE id = ?`,
//             [
//               first_name,
//               last_name,
//               middle_name,
//               short_name,
//               dob || null,
//               birthplace || null,
//               country || null,
//               JSON.stringify(primary_team) || null, // Convert array to string if needed
//               image || null,
//               playing_role || null,
//               batting_style || null,
//               bowling_style || null,
//               fielding_position || null,
//               facebook_profile || null,
//               twitter_profile || null,
//               instagram_profile || null,
//               nationality || null,
//               gender || null,
//               jersey_number || null,
//               debut_data || null,
//               fantasy_player_rating || null,
//               playerId,
//             ]
//           );
  
//           console.log(`Player ${playerId} updated successfully.`);
//         } catch (apiError) {
//           console.error(`Failed to fetch data for player ${playerId}:`, apiError);
//         }
//       }
  
//       console.log("Player data update completed.");
//     } catch (error) {
//       console.error("Error in updating player data:", error);
//     } finally {
//       if (connection) {
//         await connection.end();
//       }
//     }
//   }
  
  
  


//   updatePlayerData()




















async function updatePlayerData() {
  try {
    // Step 1: Establish connection with MySQL database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
    });

    try {
      // Step 2: Fetch all player IDs from the database
      const [players] = await connection.query(`SELECT id FROM players`);

      // Step 3: Iterate through each player ID and fetch data from the API
      for (const { id: playerId } of players) {
        console.log(playerId,"idatda")
        try {
          // Fetch player data from the API using the player ID
          const response = await axios.get(
            `https://rest.entitysport.com/v2/players/${playerId}?token=73d62591af4b3ccb51986ff5f8af5676`
          );
          const playerData = response.data.response.player;
          console.log(playerData);

          // Map the API data to match your table columns
          const {
            title: first_name,
            last_name = '',
            middle_name = '',
            short_name,
            birthdate: dob,
            birthplace,
            country,
            primary_team = [],
            logo_url: image,
            playing_role,
            batting_style = '',
            bowling_style = '',
            fielding_position,
            facebook_profile,
            twitter_profile,
            instagram_profile,
            nationality,
            gender = null,
            jersey_number = null,
            debut_data,
            fantasy_player_rating,
          } = playerData;

          // Update query with all mapped fields
          await connection.query(
            `UPDATE players 
             SET 
               first_name = ?, 
               last_name = ?, 
               middle_name = ?, 
               short_name = ?, 
               dob = ?, 
               birthplace = ?, 
               country = ?, 
               primary_teams = ?, 
               image = ?, 
               playing_role = ?, 
               batting_style = ?, 
               bowling_style = ?, 
               fielding_position = ?, 
               facebook_profile = ?, 
               twitter_profile = ?, 
               instagram_profile = ?, 
               nationality = ?, 
               gender = ?, 
               jersey_number = ?, 
               debut_data = ?, 
               fantasy_player_rating = ?, 
               updated_at = NOW()
             WHERE id = ?`,
            [
              first_name,
              last_name,
              middle_name,
              short_name,
              dob || null,
              birthplace || null,
              country || null,
              JSON.stringify(primary_team) || null, // Convert array to string if needed
              image || null,
              playing_role || null,
              batting_style || null,
              bowling_style || null,
              fielding_position || null,
              facebook_profile || null,
              twitter_profile || null,
              instagram_profile || null,
              nationality || null,
              gender || null,
              jersey_number || null,
              debut_data || null,
              fantasy_player_rating || null,
              playerId,
            ]
          );

          console.log(`Player ${playerId} updated successfully.`);
        } catch (apiError) {
          console.error(`Failed to fetch data for player ${playerId}:`, apiError);
        }
      }

      console.log("Player data update completed.");
    } finally {
      // Ensure the connection is closed after all updates
      await connection.end();
    }
  } catch (error) {
    console.error("Error in establishing database connection or updating player data:", error);
  }
}

// Execute the function to start the update
updatePlayerData();
