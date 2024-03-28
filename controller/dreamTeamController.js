const axios = require('axios');
const { Sequelize } = require('sequelize'); // Import Sequelize
const { DreamTeam } = require('../models/dreamTeam');
const { PlayerPerformance } = require('../models/playerPerformance');




// ---------------------------------------FUNCTION TO CALCULATE DREAM TEAM APPERANCE MEANS DREAM TEAM TABLE INSERTION------------------------

const calculateDreamTeamsForAllMatches = async () => {
  try {
    // Fetch all unique match IDs
    const uniqueMatchIds = await PlayerPerformance.findAll({
      attributes: ['match_id'],
      group: 'match_id',
      raw: true,
    });

    // Calculate the dream team for each unique match ID
    for (const { match_id } of uniqueMatchIds) {
      await calculateAndSaveDreamTeam(match_id);
    }

    console.log('Dream teams calculated for all matches.');
  } catch (error) {
    console.error('Failed to calculate dream teams:', error);
  }
};


// const calculateAndSaveDreamTeam = async (matchId) => {
//   const topPlayers = await PlayerPerformance.findAll({
//     where: { match_id: matchId },
//     order: [['points', 'DESC']],
//     limit: 11
//   });

//   for (const player of topPlayers) {
//     let dreamTeamEntry = await DreamTeam.findOne({ where: { pid: player.pid } });

//     if (dreamTeamEntry) {
//       // Increment appearances by 1
//       dreamTeamEntry.appearances += 1;

//       // Ensure matchId is not already recorded, to prevent duplicates
//       const matchesArray = dreamTeamEntry.matches ? dreamTeamEntry.matches.split(',') : [];
//       if (!matchesArray.includes(matchId.toString())) {
//         matchesArray.push(matchId);
//         dreamTeamEntry.matches = matchesArray.join(',');
//       }

//       // Calculate average points
//       const totalPoints = await PlayerPerformance.findAll({
//         where: { pid: player.pid },
//         attributes: [[Sequelize.fn('SUM', Sequelize.col('points')), 'totalPoints']],
//         raw: true,
//       });
//       const avgPoints = totalPoints[0].totalPoints / dreamTeamEntry.appearances;
      
//       // Update dreamTeamEntry with new average points
//       dreamTeamEntry.avgPoints = avgPoints;

//       await dreamTeamEntry.save();
//     } else {
//       // For a new entry, calculate initial average points which is just the player's points in this match
//       const avgPoints = player.points; // Since it's their first appearance, avg points = points in this match
      
//       await DreamTeam.create({
//         pid: player.pid,
//         matches: `${matchId}`,
//         appearances: 1, // Initialize appearances to 1 since it's their first inclusion
//         avgPoints: avgPoints // Set average points for the player
//       });
//     }
//   }
// };


const calculateAndSaveDreamTeam = async (matchId) => {
  const topPlayers = await PlayerPerformance.findAll({
    where: { match_id: matchId },
    order: [['points', 'DESC']],
    limit: 11
  });

  for (let i = 0; i < topPlayers.length; i++) {
    const player = topPlayers[i];
    let dreamTeamEntry = await DreamTeam.findOne({ where: { pid: player.pid } });

    if (!dreamTeamEntry) {
      // If it's a new entry
      await DreamTeam.create({
        pid: player.pid,
        matches: `${matchId}`,
        appearances: 1,
        avgPoints: player.points, // Initial average points
        captainAppearances: i === 0 ? 1 : 0, // Captain if first in the list
        viceCaptainAppearances: i === 1 ? 1 : 0, // Vice-captain if second
      });
    } else {
      // Increment appearances
      dreamTeamEntry.appearances += 1;
      if (i === 0) dreamTeamEntry.captainAppearances += 1; // Increment captain appearances if top player
      if (i === 1) dreamTeamEntry.viceCaptainAppearances += 1; // Increment vice-captain appearances if second

      // Existing logic to update matches and calculate average points...
      const matchesArray = dreamTeamEntry.matches ? dreamTeamEntry.matches.split(',') : [];
      if (!matchesArray.includes(matchId.toString())) {
        matchesArray.push(matchId);
        dreamTeamEntry.matches = matchesArray.join(',');
      }

      const totalPoints = await PlayerPerformance.findAll({
        where: { pid: player.pid },
        attributes: [[Sequelize.fn('SUM', Sequelize.col('points')), 'totalPoints']],
        raw: true,
      });
      const avgPoints = totalPoints[0].totalPoints / dreamTeamEntry.appearances;
      dreamTeamEntry.avgPoints = avgPoints;

      await dreamTeamEntry.save();
    }
  }
};








// ----------------------------MY DB APIS FUNCTION -----------------------------------------------------------
//fetch data of player dream team appearnce using pid from dream team table which we have created 

const CalculatePlayerDreamTeamAppearance = async (req, res) => {
  try {
    const playerId = req.params.playerId; // Assuming you're getting the player ID from the URL parameter

    // Validate playerId
    if (!playerId) {
      return res.status(400).send({ message: "Player ID is required." });
    }

    const playerData = await DreamTeam.findOne({
      where: { pid: playerId }
    });

    if (!playerData) {
      return res.status(404).send({ message: "Player not found in Dream Team." });
    }

    // Send back the player's dream team data
    res.status(200).json(playerData);
  } catch (error) {
    console.error("Failed to calculate player dream team appearance:", error);
    res.status(500).send({ message: "An error occurred while processing your request." });
  }
};



module.exports = { calculateDreamTeamsForAllMatches, CalculatePlayerDreamTeamAppearance };
