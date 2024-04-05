import express from "express";
import {
  login,
  signup,
  sendOTPVerificationEmail,
} from "../controllers/auth.js";
import { verifyOTP } from "../controllers/auth.js";
import { getAllUsers, updateProfile } from "../controllers/Users.js";
import { subscriptionPayment, webhook } from "../controllers/Payment.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/OTPVerificationEmail", auth, sendOTPVerificationEmail);
router.post("/verifyOTP", auth, verifyOTP);

router.get("/getAllUsers", getAllUsers);
router.patch("/update/:id", auth, updateProfile);

router.post("/subscription", subscriptionPayment);
router.post("/webhook", webhook);

export default router;
