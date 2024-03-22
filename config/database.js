const { Sequelize } = require("sequelize");
const config = require("./db.config.js");
require("dotenv").config();

const sequelize = new Sequelize(config.DB, config.USER, config.PASSWORD, {
    host: config.HOST,
    dialect: config.dialect,
    port: config.PORT,
    operatorsAliases: 0,
    logging: console.log, // Enable logging
    define: {
      freezeTableName: true,
      timestamps: true,
      createdAt: "creationDate",
      updatedAt: "updateDate",
    },
    pool: config.pool,
  });
  

const checkDatabaseConnection = async () => {
  try {
    await sequelize.authenticate(); // Attempts to authenticate with the database
    console.log("Connection has been established successfully.");
    
    // Synchronize all models
    await sequelize.sync({ force: false }); // Change to { force: true } if you want to drop and re-create tables
    console.log("All models were synchronized successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

// Call the function to check the connection and sync models
checkDatabaseConnection();

module.exports = sequelize;
