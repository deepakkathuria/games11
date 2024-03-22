const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const PlayerPerformance = sequelize.define('PlayerPerformancenew', {
    match_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    pid: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    rating: {
      type: DataTypes.STRING,
      allowNull: true
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: true
      },
      role: {
        type: DataTypes.STRING,
        allowNull: true
      },
      title: {
        type: DataTypes.STRING,
        allowNull: true
      },
      teamname: {
        type: DataTypes.STRING,
        allowNull: true
      }
  },  {
    indexes: [{
      unique: true,
      fields: ['match_id', 'pid'],
      name: 'player_performancenew_match_id_pid'
    }]
  });


module.exports = {PlayerPerformance};
