const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/database"); // Adjust the path to your actual database configuration

const DreamTeam = sequelize.define('DreamTeam', {
  // Assuming 'id' is an auto-incremented primary key
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  pid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Player ID'
    // Since the index already exists, we don't explicitly declare it here to avoid Sequelize trying to recreate it
  },
  appearances: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    allowNull: false,
    comment: 'Number of dream team appearances'
  },
  matches: {
    type: DataTypes.STRING(1024),
    allowNull: false,
    defaultValue: '',
    comment: 'Comma-separated list of match_ids where the player appeared in the dream team'
  },
  avgPoints: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
    comment: 'Average points per dream team appearance'
  }
}, {
  // Model tableName will be the same as the model name
  tableName: 'DreamTeam',
  timestamps: false, // Adjust based on whether you want Sequelize to automatically manage `createdAt` and `updatedAt` fields
});

module.exports = { DreamTeam };
