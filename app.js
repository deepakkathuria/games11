require("dotenv").config();
const express = require("express");
const sequelize = require("./config/database");
const authRoutes = require("./routes/authRoutes"); // Import the routes

const app = express();
app.use(express.json());

// Use the routes
app.use(authRoutes);

const PORT = process.env.PORT || 3000;
sequelize.sync().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
