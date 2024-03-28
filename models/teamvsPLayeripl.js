const { DataTypes } = require('sequelize');
const sequelize = require('./your-sequelize-connection'); // Adjust this import to your sequelize connection file

const TeamvsPlayer = sequelize.define('teamvsplayeripl_2023', {
    playerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
    },
    playerName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    teamTitle: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    teamId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    // Detailed batting stats
    runs: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    ballsFaced: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    fours: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    sixes: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    howOut: {
        type: DataTypes.STRING,
        defaultValue: '',
    },
    dismissal: {
        type: DataTypes.STRING,
        defaultValue: '',
    },
    strikeRate: {
        type: DataTypes.FLOAT,
        defaultValue: 0.0,
    },
    // Bowling stats
    wickets: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    runsConceded: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    ballsBowled: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    matchesPlayed: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
}, {
    timestamps: false,
});

module.exports = { TeamvsPlayer };
