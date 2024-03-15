const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { generateOTP, sendOTP } = require("../otpService");
const { storeOTP, verifyStoredOTP } = require("../utils/OtpManage");








exports.registerUser = async (req, res) => {
    const { phoneNumber} = req.body;
    const otp = generateOTP(6);
  
    try {
    //   const userExists = await User.findOne({ where: { phoneNumber } });
  
    //   if (userExists) {
    //     return res.status(400).send("User already exists. Please login.");
    //   }
  
      await sendOTP(`Your OTP is: ${otp}`, phoneNumber);
      storeOTP(phoneNumber, otp); // Store OTP for later verification
      res.status(200).send("OTP sent successfully for registration.");
    } catch (error) {
      console.error(`Failed to send OTP: ${error}`);
      res.status(500).send("Failed to send OTP.");
    }
  };
  


  exports.loginUser = async (req, res) => {
    const { phoneNumber } = req.body;
    const otp = generateOTP(6);
  
    try {
      const user = await User.findOne({ where: { phoneNumber } });
  
      if (!user) {
        return res.status(404).send("User does not exist. Please register.");
      }
  
      await sendOTP(`Your OTP is: ${otp}`, phoneNumber);
      storeOTP(phoneNumber, otp); // Store OTP for later verification
      res.status(200).send("OTP sent successfully for login.");
    } catch (error) {
      console.error(`Failed to send OTP: ${error}`);
      res.status(500).send("Failed to send OTP.");
    }
  };
  


  exports.verifyRegistrationOTP = async (req, res) => {
    const { phoneNumber, otp, email, username } = req.body;
  
    if (!verifyStoredOTP(phoneNumber, otp)) {
      return res.status(400).json({ message: "OTP is invalid or has expired." });
    }
  
    try {
    //   const userExists = await User.findOne({ where: { phoneNumber } });
    //   if (userExists) {
    //     return res.status(400).send("User already exists. Please login.");
    //   }
  
      // Proceed with registration
      const newUser = await User.create({ phoneNumber, email, username });
      const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, { expiresIn: "24h", });
  
      res.status(200).json({ message: "Registration successful. User logged in.", token });
    } catch (error) {
      console.error(`Failed to verify OTP or register user: ${error}`);
      res.status(500).send("Failed to process registration.");
    }
  };



  exports.verifyLoginOTP = async (req, res) => {
    const { phoneNumber, otp } = req.body;
  
    if (!verifyStoredOTP(phoneNumber, otp)) {
      return res.status(400).json({ message: "OTP is invalid or has expired." });
    }
  
    try {
      const user = await User.findOne({ where: { phoneNumber } });
      if (!user) {
        return res.status(404).send("User does not exist. Please register.");
      }
  
      // User exists and OTP is verified, proceed to login
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "24h", });
  
      res.status(200).json({ message: "Login successful.", token });
    } catch (error) {
      console.error(`Failed to verify OTP or login user: ${error}`);
      res.status(500).send("Failed to process login.");
    }
  };
  
  