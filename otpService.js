// const fast2sms = require("fast-two-sms");

// // Generates an OTP of a specified length
// exports.generateOTP = (otp_length) => {
//   let digits = "0123456789";
//   let OTP = "";
//   for (let i = 0; i < otp_length; i++) {
//     OTP += digits[Math.floor(Math.random() * 10)];
//   }
//   return OTP;
// };

// // Sends an OTP to a specified mobile number
// exports.sendOtpToMobile = async ({ message, contactNumber }) => {
// console.log(contactNumber,typeof(contactNumber),"dgaksfiasdjsgakd")
//   try {
//     const response = await fast2sms.sendMessage({
//       authorization: process.env.FAST2SMS, // Securely fetching the API key from environment variables
//       message,
//       numbers: [contactNumber], // Ensure this is a valid number
//     });
//     console.log("SMS Sent Successfully:", response);
//     return response;
//   } catch (error) {
//     console.error("Error sending SMS:", error);
//     throw error; // Rethrowing the error allows for further handling upstream if necessary
//   }
// };



require('dotenv').config();
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = new twilio(accountSid, authToken);

exports.generateOTP = (otp_length) => {
  let digits = "0123456789";
  let OTP = "";
  for (let i = 0; i < otp_length; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
};

exports.sendOTP = async (message, toPhoneNumber) => {                                           
    console.log(message,toPhoneNumber)
  try {
    const messageResponse = await client.messages.create({
      body: message,
      to: toPhoneNumber, // Text this number
      from: fromPhoneNumber // From a valid Twilio number
    });

    console.log(`Message sent successfully. SID: ${messageResponse.sid}`);
    return messageResponse.sid;
  } catch (error) {
    console.error(`Failed to send OTP: ${error}`);
    throw error;
  }
};
