const express = require("express");
const { registerUser, loginUser, verifyRegistrationOTP, verifyLoginOTP } = require("../controller/authController");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/verify-registration-otp", verifyRegistrationOTP);
router.post("/verify-login-otp", verifyLoginOTP);
module.exports = router;
