import bcrypt from "bcryptjs";
import User from "../models/User.js";
import emailjs from "@emailjs/nodejs";

/* ================= REGISTER ================= */
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields required" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(409).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      success: true,
      message: "Registration successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= SEND OTP ================= */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email)
      return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User not found" });

    // 🔢 Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000; // 5 mins
    await user.save();

    // 📧 Send OTP via EmailJS
    await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID,
      {
        to_email: user.email,
        to_name: user.name || "User",
        otp: otp,
      },
      {
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
        privateKey: process.env.EMAILJS_PRIVATE_KEY,
      }
    );

    res.status(200).json({
      success: true,
      message: "OTP sent to email",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      message: "Failed to send OTP",
    });
  }
};

/* ================= VERIFY OTP & RESET ================= */
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User not found" });

    if (!user.otp || !user.otpExpiry)
      return res.status(400).json({ message: "OTP not requested" });

    if (user.otp !== otp)
      return res.status(401).json({ message: "Invalid OTP" });

    if (user.otpExpiry < Date.now())
      return res.status(401).json({ message: "OTP expired" });

    // 🔒 Update password
    user.password = await bcrypt.hash(newPassword, 10);

    // 🧹 Clear OTP
    user.otp = null;
    user.otpExpiry = null;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      message: "Failed to reset password",
    });
  }
};
