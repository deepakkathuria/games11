// models/DreamTeam.js
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Your Sequelize config

const DreamTeam = sequelize.define('DreamTeam', {
  match_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  pid: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  appearances: {
    type: DataTypes.INTEGER,
    defaultValue: 1 // Start with one appearance by default
  }
}, {
  // options
});

module.exports = {DreamTeam};
