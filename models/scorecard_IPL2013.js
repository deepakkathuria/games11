const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Scorecard_2013 = sequelize.define('Scorecard_IPL2013', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    matchId: Sequelize.INTEGER,
    playerId: Sequelize.INTEGER,
    teamId: Sequelize.INTEGER,
    oppositionTeamId: Sequelize.INTEGER,
    runs: Sequelize.INTEGER,
    ballsFaced: Sequelize.INTEGER,
    fours: Sequelize.INTEGER,
    sixes: Sequelize.INTEGER,
    strikeRate: Sequelize.FLOAT,
    oversBowled: Sequelize.FLOAT,
    maidensBowled: Sequelize.INTEGER,
    runsConceded: Sequelize.INTEGER,
    wicketsTaken: Sequelize.INTEGER,
    noBalls: Sequelize.INTEGER,
    wides: Sequelize.INTEGER,
    economyRate: Sequelize.FLOAT,
    catches: Sequelize.INTEGER,
    runOuts: Sequelize.INTEGER,
   
    // Additional attributes as needed
}, { timestamps: false });


module.exports = {Scorecard_2013};
