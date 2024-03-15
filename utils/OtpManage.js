// Temporary in-memory storage for OTPs
let otpStorage = {};

const storeOTP = (phoneNumber, otp) => {
    const ttl = 5 * 60 * 1000; // 5 minutes
    const expires = Date.now() + ttl;
    otpStorage[phoneNumber] = { otp, expires };
    console.log(`Stored OTP for ${phoneNumber}:`, otpStorage[phoneNumber]); // Debug log
  };

const verifyStoredOTP = (phoneNumber, otp) => {
    console.log(otp,"gaskhgdkasgkd")
  const record = otpStorage[phoneNumber];
  console.log(record,"recgdaisgik")
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
