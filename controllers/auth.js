import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

import users from "../models/auth.js";
import UserOTPVerification from "../models/UserOTPVerification.js";
var newOTPVerification;
let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: "vpandani99@gmail.com", pass: "kkwn iniq nliy pycj" },
});
export const signup = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existinguser = await users.findOne({ email });
    if (existinguser) {
      return res.status(404).json({ message: "User Already Exist" });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await users.create({
      name,
      email,
      password: hashedPassword,
    });
    const token = jwt.sign(
      { email: newUser.email, id: newUser._id },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );
    res.status(200).json({ result: newUser, token });
  } catch (error) {
    res.status(500).json("Something went wrong....");
  }
};
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const existinguser = await users.findOne({ email });
    if (!existinguser) {
      return res.status(404).json({ message: "User Dosen't Exist" });
    }
    const isPasswordCrt = await bcrypt.compare(password, existinguser.password);
    if (!isPasswordCrt) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }
    const token = jwt.sign(
      { email: existinguser.email, id: existinguser._id },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );
    res.status(200).json({ result: existinguser, token });
  } catch (error) {
    res.status(500).json("Something went wrong...");
  }
};

export const sendOTPVerificationEmail = async (req, res) => {
  const { _id, email } = req.body;
  UserOTPVerification.deleteMany({ _id });
  try {
    const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
    let mailOptions = {
      from: "vpandani99@gmail.com", // sender address
      to: email, // list of receivers
      subject: "Verify your Email", // Subject line
      html: `<p> Enter <b> ${otp} </b> in your app to verify your email address </p>`, // html body
    };
    const saltRounds = 10;
    const hasedOTP = await bcrypt.hash(otp, saltRounds);
    newOTPVerification = await new UserOTPVerification({
      userId: _id,
      otp: hasedOTP,
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000,
    });
    await newOTPVerification.save();
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("Error occurred:", error.message);
        return;
      }
      res.json({
        status: "Pending",
        message: "Verification otp mail sent",
        data: {
          userId: _id,
          email,
        },
      });
    });
  } catch (error) {
    console.log(error);
    res.json({
      status: "Failed",
      message: error.message,
      data: {
        userId: _id,
        email,
      },
    });
  }
};

export const verifyOTP = async (req, res) => {
  const { userId, otp } = req.body;
  const userOTPVerificationRecords = await UserOTPVerification.find({
    userId,
  });
  if (userOTPVerificationRecords.length <= 0) {
    throw new Error(
      "Account record doesn't exist or has been already verified."
    );
  } else {
    const { expiresAt } =
      userOTPVerificationRecords[userOTPVerificationRecords.length - 1];
    const hasedOTP =
      userOTPVerificationRecords[userOTPVerificationRecords.length - 1].otp;
    if (expiresAt < Date.now()) {
      UserOTPVerification.deleteMany({ userId });
      res
        .status(500)
        .json({ message: "Code has Expired. Please request Again." });
    } else {
      const validOTP = await bcrypt.compare(otp.toString(), hasedOTP);
      if (!validOTP) {
        // throw new Error("Invalid code passed. Check your inbox.");
        res
          .status(500)
          .json({ message: "Invalid code passed. Check your inbox." });
      } else {
        res
          .status(200)
          .json({ result: "OTP Verified Successfully.", userVerified: true });
      }
    }
  }
};
