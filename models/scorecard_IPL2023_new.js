const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Scorecard_2023 = sequelize.define('Scorecard_IPL2023_new', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    matchId: DataTypes.INTEGER,
    playerId: DataTypes.INTEGER,
    teamId: DataTypes.INTEGER,
    oppositionTeamId: DataTypes.INTEGER,
    runs: DataTypes.INTEGER,
    ballsFaced: DataTypes.INTEGER,
    fours: DataTypes.INTEGER,
    sixes: DataTypes.INTEGER,
    run0: DataTypes.INTEGER,
    run1: DataTypes.INTEGER,
    run2: DataTypes.INTEGER,
    run3: DataTypes.INTEGER,
    run5: DataTypes.INTEGER,
    howOut: DataTypes.STRING,
    dismissal: DataTypes.STRING,
    strikeRate: DataTypes.FLOAT,
    oversBowled: DataTypes.FLOAT,
    maidensBowled: DataTypes.INTEGER,
    runsConceded: DataTypes.INTEGER,
    wicketsTaken: DataTypes.INTEGER,
    noBalls: DataTypes.INTEGER,
    wides: DataTypes.INTEGER,
    economyRate: DataTypes.FLOAT,
    bowledCount: DataTypes.INTEGER,
    lbwCount: DataTypes.INTEGER,
    catches: DataTypes.INTEGER,
    runOuts: DataTypes.INTEGER,
    runOutThrower: DataTypes.INTEGER,
    runOutCatcher: DataTypes.INTEGER,
    runOutDirectHit: DataTypes.INTEGER,
    stumping: DataTypes.INTEGER,
    isSubstitute: DataTypes.BOOLEAN,
    batting: DataTypes.BOOLEAN,
    bowling: DataTypes.BOOLEAN,
    position: DataTypes.STRING,
    role: DataTypes.STRING,
    bowlerId: DataTypes.INTEGER,
    firstFielderId: DataTypes.INTEGER,
    secondFielderId: DataTypes.INTEGER,
    thirdFielderId: DataTypes.INTEGER,
}, { timestamps: false });

module.exports = { Scorecard_2023 }; 