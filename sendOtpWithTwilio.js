const twilio = require('twilio');
const accountSid = 'YOUR_TWILIO_ACCOUNT_SID'; // Your Account SID from www.twilio.com/console
const authToken = 'YOUR_TWILIO_AUTH_TOKEN';   // Your Auth Token from www.twilio.com/console

const client = new twilio(accountSid, authToken);

const sendOTP = async (message, toPhoneNumber) => {
  try {
    const messageResponse = await client.messages.create({
      body: message,
      to: toPhoneNumber,  // Text this number
      from: '+12345678901' // From a valid Twilio number
    });

    console.log(messageResponse.sid);
  } catch (error) {
    console.error(error);
  }
};

// Example usage
sendOTP('Your OTP is: 1234', '+19876543210');
