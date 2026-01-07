import express from "express";
import {
  register,
  forgotPassword,
  resetPassword,
  login,
  sendEmail,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);     // Send OTP
router.post("/reset-password", resetPassword);       // Verify OTP + reset
router.post("/send-email", sendEmail);       // Verify OTP + reset

export default router;
