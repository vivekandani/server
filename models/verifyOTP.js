import mongoose from "mongoose";

const verifyOTPSchema = mongoose.Schema({
  userId: String,
  opt: String,
});

export default mongoose.model("verifyOTP", verifyOTPSchema);
