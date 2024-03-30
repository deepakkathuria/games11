const { Sequelize } = require('sequelize'); // Import Sequelize
const sequelize = require('../config/database');

async function getPlayerStatsAgainstOpposition(playerId, oppositionTeamId) {
    // Start building the query
    let query = '';
  
    for (let year = 2008; year <= 2023; year++) {
      // Note: This assumes all your tables are named consistently (e.g., Scorecard_2008, Scorecard_2009, etc.)
      query += `
        SELECT 
          '${year}' AS year,
          SUM(runs) AS total_runs,
          SUM(ballsFaced) AS total_balls_faced,
          SUM(fours) AS total_fours,
          SUM(sixes) AS total_sixes,
          AVG(strikeRate) AS average_strike_rate,
          SUM(oversBowled) AS total_overs_bowled,
          SUM(maidensBowled) AS total_maidens_bowled,
          SUM(runsConceded) AS total_runs_conceded,
          SUM(wicketsTaken) AS total_wickets_taken,
          SUM(noBalls) AS total_no_balls,
          SUM(wides) AS total_wides,
          AVG(economyRate) AS average_economy_rate,
          SUM(catches) AS total_catches,
          SUM(runOuts) AS total_run_outs
        FROM 
          \`Scorecard_IPL${year}\`
        WHERE 
          playerId = :playerId AND oppositionTeamId = :oppositionTeamId
      `;
      
      if (year < 2023) query += ' UNION ALL ';
    }
  
    // Execute the raw query
    try {
      const results = await sequelize.query(query, {
        replacements: { playerId, oppositionTeamId },
        type: sequelize.QueryTypes.SELECT
      });
  
      // Process results here
      console.log(results);
      return results;
    } catch (error) {
      console.error('Error fetching player stats:', error);
      throw error;
    }
  }

  module.exports = {getPlayerStatsAgainstOpposition};
