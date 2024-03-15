// Temporary in-memory storage for OTPs
let otpStorage = {};

const storeOTP = (phoneNumber, otp) => {
  const ttl = 5 * 60 * 1000; // Time to live: 5 minutes
  const expires = Date.now() + ttl;
  otpStorage[phoneNumber] = { otp, expires };
};

const verifyStoredOTP = (phoneNumber, otp) => {
  const record = otpStorage[phoneNumber];
  if (!record) {
    return false;
  }
  const isOtpValid = record.otp === otp && Date.now() <= record.expires;
  if (isOtpValid) {
    delete otpStorage[phoneNumber]; // Clear OTP after successful verification
    return true;
  }
  return false;
};

module.exports = { storeOTP, verifyStoredOTP };
