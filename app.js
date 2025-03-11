require("dotenv").config({ path: __dirname + "/../.env" });
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const axios = require("axios");
// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const cloudinary = require("cloudinary").v2;
const { pollDBPool, userDBPool } = require("./config/db"); // Import database pools


const { upload } = require("./config/multer"); // Ensure multer config is set up
const bcrypt = require("bcrypt");


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});



const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const cron = require('node-cron');
// const pool = require('./db'); // Your database connection pool

// Schedule the job to run daily at midnight
cron.schedule('0 0 * * *', async () => {
  try {
    const query = `
      UPDATE users
      SET status = 'expired'
      WHERE status = 'trial' AND trial_end_date < NOW();
    `;
    const [result] = await pollDBPool.query(query);
    console.log(`Expired trials updated: ${result.affectedRows} rows affected.`);
  } catch (error) {
    console.error("Error updating expired trials:", error);
  }
});




// --------------------------  1. Create a Poll---------------------















app.post("/api/polls", async (req, res) => {
  const { title, description, match_id } = req.body;

  if (!title || !match_id) {
    return res.status(400).json({ message: "Invalid input. Provide a title and match_id." });
  }

  try {
    // Insert poll into the database
    const insertPollQuery = `
      INSERT INTO polls (title, description, match_id, status) 
      VALUES (?, ?, ?, 'active');
    `;
    const [pollResult] = await pollDBPool.query(insertPollQuery, [title, description || null, match_id]);

    res.status(201).json({ message: "Poll created successfully", pollId: pollResult.insertId });
  } catch (error) {
    console.error("Error creating poll:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});


// **Vote API**
app.post("/api/polls/:pollId/vote", async (req, res) => {
  const { pollId } = req.params;
  const { team_id, user_id } = req.body;

  if (!pollId || !team_id || !user_id) {
    return res.status(400).json({ message: "Missing required fields: pollId, team_id, or user_id." });
  }

  try {
    // Check if the user has already voted
    const checkVoteQuery = `
      SELECT * 
      FROM poll_votes 
      WHERE poll_id = ? AND user_id = ?;
    `;
    const [existingVotes] = await pollDBPool.query(checkVoteQuery, [pollId, user_id]);

    if (existingVotes.length > 0) {
      return res.status(400).json({ message: "You have already voted." });
    }

    // Insert the vote
    const insertVoteQuery = `
      INSERT INTO poll_votes (poll_id, team_id, user_id) 
      VALUES (?, ?, ?);
    `;
    await pollDBPool.query(insertVoteQuery, [pollId, team_id, user_id]);

    res.status(200).json({ message: "Vote recorded successfully." });
  } catch (error) {
    console.error("Error recording vote:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});


// **Fetch Poll Results API**
app.get("/api/polls/:pollId/results", async (req, res) => {
  const { pollId } = req.params;

  try {
    // Fetch poll details
    const fetchPollQuery = `
      SELECT id, title, description, match_id, status, created_at 
      FROM polls 
      WHERE id = ?;
    `;
    const [pollRows] = await pollDBPool.query(fetchPollQuery, [pollId]);

    if (pollRows.length === 0) {
      return res.status(404).json({ message: "Poll not found." });
    }

    // Fetch vote counts for each team
    const fetchVoteCountsQuery = `
      SELECT team_id, COUNT(*) AS votes_count,
             ROUND((COUNT(*) / (SELECT COUNT(*) FROM poll_votes WHERE poll_id = ?)) * 100, 2) AS percentage
      FROM poll_votes
      WHERE poll_id = ?
      GROUP BY team_id;
    `;
    const [voteCounts] = await pollDBPool.query(fetchVoteCountsQuery, [pollId, pollId]);

    res.status(200).json({
      poll: pollRows[0],
      results: voteCounts,
    });
  } catch (error) {
    console.error("Error fetching poll results:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});


app.get('/api/matches/:matchId/poll', async (req, res) => {
  const { matchId } = req.params;

  try {
    // Check if a poll exists for the given match_id
    const checkPollQuery = `
      SELECT id AS pollId 
      FROM polls 
      WHERE match_id = ?;
    `;
    const [rows] = await pollDBPool.query(checkPollQuery, [matchId]);

    if (rows.length > 0) {
      // Return the existing pollId
      return res.status(200).json({ pollId: rows[0].pollId });
    }

    // No poll exists, create a new poll
    const insertPollQuery = `
      INSERT INTO polls (title, description, match_id, status) 
      VALUES (?, ?, ?, 'active');
    `;
    const [pollResult] = await pollDBPool.query(insertPollQuery, [
      `Who will win match ${matchId}?`,
      'Vote for your favorite team!',
      matchId,
    ]);
    const pollId = pollResult.insertId;

    // Insert default options (Team A and Team B)
    const insertOptionsQuery = `
      INSERT INTO poll_options (poll_id, option_text, votes_count) 
      VALUES (?, ?, 0), (?, ?, 0);
    `;
    await pollDBPool.query(insertOptionsQuery, [pollId, 'Team A', pollId, 'Team B']);

    // Return the newly created pollId
    res.status(201).json({ pollId });
  } catch (error) {
    console.error("Error fetching or creating poll:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});



app.post("/api/saveForm1", async (req, res) => {
  try {
    const formData = req.body;

    // First, check if the match_id already exists in the database
    const checkQuery = `SELECT * FROM match_predictions WHERE match_id = ?`;
    const [existingMatch] = await pollDBPool.query(checkQuery, [formData.matchId]);

    if (existingMatch.length > 0) {
      // Match ID exists, so we perform an update
      const updateQuery = `
        UPDATE match_predictions SET
          title = ?,
          summary = ?,
          preview = ?,
          pitch = ?,
          records = ?,
          winning_percentage = ?,
          pitch_behaviour = ?,
          avg_inning_score = ?,
          best_suited_to = ?,
          captain_choice = ?,
          vice_captain_choice = ?,
          dream11_combination = ?,
          playing11_teamA = ?,
          playing11_teamB = ?,
          hot_picks = ?,
          expert_advice = ?,
          teams = ?
        WHERE match_id = ?
      `;

      const updateValues = [
        formData.title,
        formData.summary,
        formData.tableOfContent.preview,
        formData.tableOfContent.pitchReport.pitch,
        formData.tableOfContent.pitchReport.records,
        formData.tableOfContent.pitchReport.winningPercentage,
        formData.tableOfContent.pitchReport.pitchBehaviour,
        formData.tableOfContent.pitchReport.avgInningScore,
        formData.tableOfContent.pitchReport.bestSuitedTo,
        formData.captainChoice,
        formData.viceCaptainChoice,
        formData.expertAdvice.dream11Combination,
        JSON.stringify(formData.playing11TeamA),
        JSON.stringify(formData.playing11TeamB),
        JSON.stringify(formData.hotPicks),
        JSON.stringify(formData.expertAdvice),
        JSON.stringify(formData.teams),
        formData.matchId,
      ];

      await pollDBPool.query(updateQuery, updateValues);
      res.status(200).json({ message: "Match data updated successfully" });
    } else {
      // Match ID does not exist, so we perform an insert
      const insertQuery = `
        INSERT INTO match_predictions (
          match_id,
          title,
          summary,
          preview,
          pitch,
          records,
          winning_percentage,
          pitch_behaviour,
          avg_inning_score,
          best_suited_to,
          captain_choice,
          vice_captain_choice,
          dream11_combination,
          playing11_teamA,
          playing11_teamB,
          hot_picks,
          expert_advice,
          teams
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const insertValues = [
        formData.matchId,
        formData.title,
        formData.summary,
        formData.tableOfContent.preview,
        formData.tableOfContent.pitchReport.pitch,
        formData.tableOfContent.pitchReport.records,
        formData.tableOfContent.pitchReport.winningPercentage,
        formData.tableOfContent.pitchReport.pitchBehaviour,
        formData.tableOfContent.pitchReport.avgInningScore,
        formData.tableOfContent.pitchReport.bestSuitedTo,
        formData.captainChoice,
        formData.viceCaptainChoice,
        formData.expertAdvice.dream11Combination,
        JSON.stringify(formData.playing11TeamA),
        JSON.stringify(formData.playing11TeamB),
        JSON.stringify(formData.hotPicks),
        JSON.stringify(formData.expertAdvice),
        JSON.stringify(formData.teams),
      ];

      const [result] = await pollDBPool.query(insertQuery, insertValues);
      res.status(201).json({ message: "Form data saved successfully!", predictionId: result.insertId });
    }
  } catch (error) {
    console.error("Error saving form data:", error);
    res.status(500).json({ error: "Failed to save form data" });
  }
});


app.get("/api/getMatchData/:matchId", async (req, res) => {
  const { matchId } = req.params;

  try {
    const query = `SELECT * FROM match_predictions WHERE match_id = ?`;
    const [rows] = await pollDBPool.query(query, [matchId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Match data not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Error fetching match data:", error);
    res.status(500).json({ error: "Failed to fetch match data" });
  }
});












// -------------------------------different learning pj------------------------------------------------------------




// --------------------------------------------------user routes---------------------------------------------------
app.get("/user", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Unauthorized access" });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userId = decoded.id;

    const query = "SELECT * FROM users WHERE user_id = ?";
    const [rows] = await userDBPool.query(query, [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user: rows[0] });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// **Update User Info**
app.put("/user/update", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Unauthorized access" });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userId = decoded.id;

    const { name, email } = req.body;

    const query = "UPDATE users SET name=?, email=? WHERE user_id=?";
    await userDBPool.query(query, [name, email, userId]);

    res.status(200).json({ message: "User info updated successfully!" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// **Upload User Avatar**
app.post("/user/upload", upload.single("file"), async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Unauthorized access" });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userId = decoded.id;

    if (!req.file) {
      return res.status(400).json({ error: "File not found" });
    }

    const query = "UPDATE users SET avatar=? WHERE user_id=?";
    await userDBPool.query(query, [req.file.path, userId]);

    res.status(200).json({ message: "Avatar updated successfully!", image: req.file.path });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// -----------------------------------------------------user routes----------------------------------------









// -------------------------------payment routes--------------------------------------------------------
// app.post("/create-payment-intent", async (req, res) => {
//   try {
//     const { cartItems } = req.body;

//     if (!cartItems || cartItems.length === 0) {
//       return res.status(400).json({ message: "Cart items are required." });
//     }

//     const orderAmount = cartItems.reduce(
//       (accumulator, current) => accumulator + current.price * current.quantity,
//       0
//     );

//     if (orderAmount <= 0) {
//       return res.status(400).json({ message: "Invalid order amount." });
//     }

//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: orderAmount * 100, // Convert to cents
//       currency: "usd",
//       automatic_payment_methods: {
//         enabled: true,
//       },
//     });

//     res.status(200).json({
//       clientSecret: paymentIntent.client_secret,
//     });
//   } catch (error) {
//     console.error("Error creating payment intent:", error);
//     res.status(500).json({ error: "Failed to create payment intent." });
//   }
// });

// ------------------------------payment routes------------------------------------------------------------









// ---------------------------------------------review routes----------------------------------------------------

app.get("/reviews", async (req, res) => {
  try {
    const query = "SELECT * FROM customer_reviews";
    const [rows] = await userDBPool.query(query);

    if (rows.length === 0) {
      return res.status(404).json({ message: "No reviews found" });
    }

    res.status(200).json({ status: 200, reviews: rows });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// **Get Review by Product ID**
app.get("/review/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT customer_reviews.*, users.name, users.avatar 
      FROM customer_reviews 
      INNER JOIN users ON customer_reviews.user_id = users.user_id 
      WHERE customer_reviews.product_id = ?
    `;
    const [rows] = await userDBPool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "No reviews found for this product" });
    }

    res.status(200).json({ status: 200, reviews: rows });
  } catch (error) {
    console.error("Error fetching review:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// **Create a New Review**
app.post("/reviews/create", async (req, res) => {
  try {
    const { product_id, rating, title, content } = req.body;
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Unauthorized access" });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userId = decoded.id;

    // Check if user has already submitted a review
    const checkQuery = "SELECT * FROM customer_reviews WHERE user_id = ? AND product_id = ?";
    const [existingReview] = await userDBPool.query(checkQuery, [userId, product_id]);

    if (existingReview.length > 0) {
      return res.status(400).json({ error: "You have already submitted a review for this product" });
    }

    // Insert new review
    const insertQuery = `
      INSERT INTO customer_reviews (user_id, product_id, title, content, rating) 
      VALUES (?, ?, ?, ?, ?)
    `;
    await userDBPool.query(insertQuery, [userId, product_id, title, content, rating]);

    res.status(201).json({ message: "Review successfully submitted" });
  } catch (error) {
    console.error("Error submitting review:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// -------------------------------------------------review routes--------------------------------------------------------








// -----------------------------------------------------------oreder routes ----------------------------------------
app.post("/orders/create", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized access" });

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userId = decoded.id;

    const { total_amount, payment_method, order_status, transaction_id } = req.body;

    const query = `
      INSERT INTO orders (user_id, total_amount, payment_status, payment_method, order_status, transaction_id)
      VALUES (?, ?, 'pending', ?, ?, ?)
    `;
    const [result] = await userDBPool.query(query, [userId, total_amount, payment_method, order_status, transaction_id]);

    res.status(201).json({ message: "Order created successfully", orderId: result.insertId });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});


app.get("/orders/user", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized access" });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userId = decoded.id;

    const query = "SELECT * FROM orders WHERE user_id = ?";
    const [rows] = await userDBPool.query(query, [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "No orders found for this user" });
    }

    res.status(200).json({ orders: rows });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

app.get("/orders/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    const query = `SELECT * FROM orders WHERE order_id = ?`;
    const [rows] = await userDBPool.query(query, [orderId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ order: rows[0] });
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ error: "Failed to fetch order details" });
  }
});


app.patch("/orders/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { order_status } = req.body;

    const query = `UPDATE orders SET order_status = ? WHERE order_id = ?`;
    const [result] = await userDBPool.query(query, [order_status, orderId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ message: "Order status updated successfully" });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
});



app.delete("/orders/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    const query = `DELETE FROM orders WHERE order_id = ?`;
    const [result] = await userDBPool.query(query, [orderId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ error: "Failed to delete order" });
  }
});



app.post("/orders/:orderId/address", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { full_name, phone_number, street_address, city, state, postal_code, country } = req.body;

    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized access" });

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userId = decoded.id;

    const query = `
      INSERT INTO address_orders (order_id, user_id, full_name, phone_number, street_address, city, state, postal_code, country)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await userDBPool.query(query, [orderId, userId, full_name, phone_number, street_address, city, state, postal_code, country]);

    res.status(201).json({ message: "Address added successfully" });
  } catch (error) {
    console.error("Error adding address:", error);
    res.status(500).json({ error: "Failed to add address" });
  }
});



app.get("/orders/:orderId/address", async (req, res) => {
  try {
    const { orderId } = req.params;

    const query = `SELECT * FROM address_orders WHERE order_id = ?`;
    const [rows] = await userDBPool.query(query, [orderId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Address not found" });
    }

    res.status(200).json({ address: rows[0] });
  } catch (error) {
    console.error("Error fetching order address:", error);
    res.status(500).json({ error: "Failed to fetch address" });
  }
});


app.patch("/orders/address/:addressId", async (req, res) => {
  try {
    const { addressId } = req.params;
    const { full_name, phone_number, street_address, city, state, postal_code, country } = req.body;

    const query = `
      UPDATE address_orders SET full_name = ?, phone_number = ?, street_address = ?, city = ?, state = ?, postal_code = ?, country = ?
      WHERE address_id = ?
    `;
    const [result] = await userDBPool.query(query, [full_name, phone_number, street_address, city, state, postal_code, country, addressId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Address not found" });
    }

    res.status(200).json({ message: "Address updated successfully" });
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(500).json({ error: "Failed to update address" });
  }
});



app.delete("/orders/address/:addressId", async (req, res) => {
  try {
    const { addressId } = req.params;

    const query = `DELETE FROM address_orders WHERE address_id = ?`;
    const [result] = await userDBPool.query(query, [addressId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Address not found" });
    }

    res.status(200).json({ message: "Address deleted successfully" });
  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(500).json({ error: "Failed to delete address" });
  }
});



// --------------------------------------------------oreder -------------------------------------------









// ---------------------------------------------cart----------------------------------------------------------
app.get("/cart", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized access." });

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userId = decoded.id;

    const query = `SELECT * FROM Cart WHERE user_id = ?`;
    const [rows] = await userDBPool.query(query, [userId]);

    res.status(200).json({ cartItems: rows });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ error: "Failed to fetch cart items" });
  }
});


app.post("/cart/add", async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ error: "No items provided." });
    }

    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized access." });

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userId = decoded.id;

    for (const item of items) {
      const checkQuery = `SELECT * FROM Cart WHERE user_id = ? AND id = ?`;
      const [existingItem] = await userDBPool.query(checkQuery, [userId, item.id]);

      if (existingItem.length < 1) {
        // Insert new item
        const insertQuery = `INSERT INTO Cart (user_id, id, quantity, name, price, image) VALUES (?, ?, ?, ?, ?, ?)`;
        await userDBPool.query(insertQuery, [userId, item.id, item.quantity, item.name, item.price, item.image]);
      } else {
        // Update quantity
        const updateQuery = `UPDATE Cart SET quantity = ? WHERE id = ? AND user_id = ?`;
        await userDBPool.query(updateQuery, [item.quantity, item.id, userId]);
      }
    }

    res.status(200).json({ message: "Cart updated successfully", cartItems: items });
  } catch (error) {
    console.error("Error adding items to cart:", error);
    res.status(500).json({ error: "Failed to add items to cart" });
  }
});



app.delete("/cart/remove/:product_id", async (req, res) => {
  try {
    const productId = req.params.product_id;

    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized access." });

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userId = decoded.id;

    const query = `DELETE FROM Cart WHERE user_id = ? AND id = ?`;
    const [result] = await userDBPool.query(query, [userId, productId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Item not found in cart." });
    }

    res.status(200).json({ message: "Item successfully removed from cart." });
  } catch (error) {
    console.error("Error removing item from cart:", error);
    res.status(500).json({ error: "Failed to remove item from cart" });
  }
});



app.delete("/cart/clear", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized access." });

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userId = decoded.id;

    const query = `DELETE FROM Cart WHERE user_id = ?`;
    const [result] = await userDBPool.query(query, [userId]);

    res.status(200).json({ message: "Cart cleared successfully." });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ error: "Failed to clear cart" });
  }
});

// ------------------------------------------------------cart--------------------------------------------------------










// -----------------------------------------------auth route---------------------------------------------------

app.post("/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Check if the email already exists
    const checkQuery = `SELECT * FROM users WHERE email = ?`;
    const [existingUser] = await userDBPool.query(checkQuery, [email]);

    if (existingUser.length > 0) {
      return res.status(400).json({ message: "This email already exists." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user into the database
    const insertQuery = `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`;
    const [result] = await userDBPool.query(insertQuery, [name, email, hashedPassword]);

    // Send response in the required format
    res.status(201).json({
      message: "Your account has been successfully created!",
      result: {
        fieldCount: result.fieldCount || 0,
        affectedRows: result.affectedRows || 0,
        insertId: result.insertId || null,
        info: result.info || "",
        serverStatus: result.serverStatus || 2,
        warningStatus: result.warningStatus || 0,
      },
    });
  } catch (error) {
    console.error("Error signing up:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});



app.post("/auth/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    // Get user from database
    const query = `SELECT * FROM users WHERE email = ?`;
    const [rows] = await userDBPool.query(query, [email]);

    if (rows.length < 1) {
      return res.status(401).json({ message: "Email or password is incorrect.", status: 401 });
    }

    const user = rows[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Email or password is incorrect.", status: 401 });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { id: user.user_id },
      process.env.ACCESS_TOKEN_SECRET || "default_secret",
      { algorithm: "HS256", expiresIn: "1h" }
    );

    // ✅ Matching response format
    res.status(200).json({
      message: "You are logged in!",
      status: 200, // ✅ Added this to match the required response format
      token,
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {
    console.error("Error signing in:", error);
    res.status(500).json({ message: "Internal server error.", status: 500 });
  }
});

// ---------------------------------------------------------authroute----------------------------------------












// --------------------------products--------------------------------------------------------------------

app.get('/products', async (req, res) => {
  console.log("Fetching products...");

  try {
      const query = "SELECT * FROM products";
      const [rows] = await userDBPool.query(query);

      // Format response with avg_rating field and required structure
      const formattedRows = rows.map(product => ({
          ...product,
          avg_rating: null // Adding avg_rating field with null value
      }));

      res.status(200).json({
          status: 200,
          rows: formattedRows
      });

  } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ status: 500, error: "Database error" });
  }
});


app.get("/product/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const query = "SELECT * FROM products WHERE item_id = ?";
    const [rows] = await userDBPool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ status: 404, message: "Product not found" });
    }

    // Ensure the response is structured correctly
    res.status(200).json({
      status: 200,
      rows: rows[0] // Returns a single product object
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ status: 500, error: "Database error" });
  }
});


app.get("/category/:category", async (req, res) => {
  try {
    const { category } = req.params;

    const query = `
      SELECT products.*, 
             AVG(customer_reviews.rating) AS avg_rating, 
             COUNT(customer_reviews.rating) AS ratings_length
      FROM products
      LEFT JOIN customer_reviews ON products.item_id = customer_reviews.product_id
      WHERE products.category = ?
      GROUP BY products.item_id
    `;

    const [rows] = await userDBPool.query(query, [category]);

    if (rows.length === 0) {
      return res.status(404).json({ status: 404, message: "No products found in this category" });
    }

    res.status(200).json({ status: 200, rows });
  } catch (error) {
    console.error("Error fetching products by category:", error);
    res.status(500).json({ status: 500, error: "Database error" });
  }
});

// ----------------------------------------------products--------------------------------------------------





// ------------------------------------admin-----------------------------------------------


app.get("/admin/products", async (req, res) => {
  try {
    const query = "SELECT * FROM products";
    const [rows] = await userDBPool.query(query);

    if (rows.length === 0) {
      return res.status(404).json({ message: "No products found" });
    }

    res.status(200).json({ products: rows });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// **Get Product by ID**
app.get("/admin/product/:productId", async (req, res) => {
  try {
    const { productId } = req.params;

    const query = "SELECT * FROM products WHERE item_id = ?";
    const [rows] = await userDBPool.query(query, [productId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ product: rows[0] });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// **Create New Product**
app.post("/admin/products", upload.array("images"), async (req, res) => {
  try {
    const {
      name, price, slug, category, new: isNew, features, description,
      includes, gallery, category_image, cart_image, short_name, first_image
    } = req.body;

    let uploadedImages = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, { folder: "products" });
        uploadedImages.push(result.secure_url);
      }
    }

    const query = `
      INSERT INTO products (name, price, slug, category, new, features, description, images, includes, gallery, category_image, cart_image, short_name, first_image) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await userDBPool.query(query, [
      name, price, slug, category, isNew, features, description, JSON.stringify(uploadedImages),
      JSON.stringify(includes), JSON.stringify(gallery), JSON.stringify(category_image),
      cart_image, short_name, first_image
    ]);

    res.status(201).json({ message: "Product created successfully", images: uploadedImages });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// **Update Product**
app.put("/admin/product/:productId", upload.array("images"), async (req, res) => {
  try {
    const { productId } = req.params;
    const {
      name, price, slug, category, new: isNew, features, description,
      includes, gallery, category_image, cart_image, short_name, first_image
    } = req.body;

    let uploadedImages = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, { folder: "products" });
        uploadedImages.push(result.secure_url);
      }
    }

    const query = `
      UPDATE products SET 
      name = ?, price = ?, slug = ?, category = ?, new = ?, features = ?, description = ?, 
      images = ?, includes = ?, gallery = ?, category_image = ?, cart_image = ?, short_name = ?, first_image = ?
      WHERE item_id = ?
    `;

    await userDBPool.query(query, [
      name, price, slug, category, isNew, features, description, JSON.stringify(uploadedImages),
      JSON.stringify(includes), JSON.stringify(gallery), JSON.stringify(category_image),
      cart_image, short_name, first_image, productId
    ]);

    res.status(200).json({ message: "Product updated successfully", images: uploadedImages });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// **Delete Product**
app.delete("/admin/product/:productId", async (req, res) => {
  try {
    const { productId } = req.params;

    const query = "DELETE FROM products WHERE item_id = ?";
    await userDBPool.query(query, [productId]);

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Database error" });
  }
});









