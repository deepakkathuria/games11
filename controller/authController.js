const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { generateOTP, sendOTP } = require("../otpService");
const { storeOTP, verifyStoredOTP } = require("../utils/OtpManage");

exports.registerOrLogin = async (req, res) => {
  const { phoneNumber } = req.body;
  const otp = generateOTP(6);

  try {
    await sendOTP(`Your OTP is: ${otp}`, phoneNumber);
    storeOTP(phoneNumber, otp); // Store OTP for later verification
    res.status(200).send("OTP sent successfully.");
  } catch (error) {
    console.error(`Failed to send OTP: ${error}`);
    res.status(500).send("Failed to send OTP.");
  }
};

exports.verifyOTP = async (req, res) => {
    const { phoneNumber, otp, email } = req.body;
    console.log(email,"email")
  
    if (!verifyStoredOTP(phoneNumber, otp)) {
      return res.status(400).json({ message: "OTP is invalid or has expired." });
    }
  
    try {
      // First, verify the phone number by checking if the user exists or needs to be created.
      const [user, created] = await User.findOrCreate({ where: { phoneNumber } });
      
      // Check if an email was provided and handle accordingly
      if (email) {
        // Check if the email already exists in the database
        const existingUserByEmail = await User.findOne({ where: { email } });
        if (existingUserByEmail) {
          // If the email is already associated with a different account
          return res.status(409).json({ message: "Email already exists." });
        } else {
          // If the email is not associated with any account, update the current user or set it for the new user
          user.email = email;
          await user.save();
        }
      }
  
      // Generate a token for the user
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: "24h",
      });
  
      // Respond with success message and token
      res.status(200).json({ message: "OTP verified successfully. User logged in.", token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to verify OTP or login user." });
    }
  };
  