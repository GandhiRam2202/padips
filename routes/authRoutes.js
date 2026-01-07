import express from "express";
import {
  register,
  forgotPassword,
  resetPassword,
  login,
  sendEmail,
  getSyllabusBySubject,
  getAvailableYears,
} from "../controllers/authController.js";
import verifyTokenFromBody from "../middleware/verifyTokenFfromBody.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);     // Send OTP
router.post("/reset-password", resetPassword);       // Verify OTP + reset
router.post("/send-email", sendEmail);       // Verify OTP + reset
router.post("/syllabus/:subject", verifyTokenFromBody, getSyllabusBySubject);

// routes/questionRoutes.js
router.post("/years", verifyTokenFromBody, getAvailableYears);


export default router;
