const mysql = require("mysql2/promise");
const dbConfig = require("./db.config");

// **Create MySQL Connection Pool for User Database**
const userDBPool = mysql.createPool({
  host: dbConfig.HOST,
  user: dbConfig.USER,
  password: dbConfig.PASSWORD,
  database: dbConfig.USER_DB_NAME, // User DB
  port: dbConfig.PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// **Create MySQL Connection Pool for Poll Database**
const pollDBPool = mysql.createPool({
  host: dbConfig.HOST,
  user: dbConfig.USER,
  password: dbConfig.PASSWORD,
  database: dbConfig.POLL_DB_NAME, // Poll DB
  port: dbConfig.PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const internalDBPool = mysql.createPool({
  host: dbConfig.HOST,
  user: dbConfig.USER,
  password: dbConfig.PASSWORD,
  database: dbConfig.INTERNAL_DB_NAME, // ✅ New DB
  port: dbConfig.PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// **Check Database Connection**
const checkDBConnection = async () => {
  try {
    const userConn = await userDBPool.getConnection();
    console.log("✅ MySQL UserDB connected successfully!");
    userConn.release();

    const pollConn = await pollDBPool.getConnection();
    console.log("✅ MySQL PollDB connected successfully!");
    pollConn.release();


    const internalConn = await internalDBPool.getConnection();
    console.log("✅ MySQL InternalLinks DB connected successfully!");
    internalConn.release();



  } catch (error) {
    console.error("❌ MySQL Database connection failed:", error.message);
  }
};

// **Run connection test**
checkDBConnection();

module.exports = { userDBPool, pollDBPool,internalDBPool };
