const express = require("express");
const { registerOrLogin, verifyOTP } = require("../controller/authController");

const router = express.Router();

router.post("/register-or-login", registerOrLogin);
router.post("/verify-otp", verifyOTP);

module.exports = router;
