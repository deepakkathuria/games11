// models/PlayerAppearances.js
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Update the path as per your project structure

const PlayerAppearances = sequelize.define('PlayerAppearances', {
  pid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true
  },
  appearances: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  // options
});

module.exports = {PlayerAppearances};
