require("dotenv").config();
const express = require("express");
const sequelize = require("./config/database");
const authRoutes = require("./routes/authRoutes"); // Import the routes
const cors = require("cors"); // Import CORS

const app = express();
app.use(express.json());
app.use(cors()); // Use CORS with default settings


// Use the routes
app.use(authRoutes);

const PORT = process.env.PORT || 3000;
sequelize.sync().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
