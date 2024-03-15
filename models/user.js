const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true, // Optional for users who want to provide an email
    unique: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: true, // Optional for users who want to provide an email
    unique: true
  }
});

module.exports = User;
