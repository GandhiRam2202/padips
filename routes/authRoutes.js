import express from "express";
import {
  register,
  forgotPassword,
  resetPassword,
  login,
  sendEmail,
  getSyllabusBySubject,
  getAvailableYears,
  getQuestionsByYear,
  submitQuiz,
  checkQuizAttempt,
  getAvailableTest,
  getQuestionsByTest,
  submitTest,
  checkTestAttempt,
  testDataProfile,
  testLeaderboard,
} from "../controllers/authController.js";
import verifyTokenFromBody from "../middleware/verifyTokenFfromBody.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);     // Send OTP
router.post("/reset-password", resetPassword);       // Verify OTP + reset
router.post("/send-email", sendEmail);       // Verify OTP + reset
router.post("/syllabus/:subject", verifyTokenFromBody, getSyllabusBySubject);
router.post("/questions/:year", verifyTokenFromBody, getQuestionsByYear);


router.post("/quiz/submit", verifyTokenFromBody, submitQuiz);

// routes/questionRoutes.js
router.post("/years", verifyTokenFromBody, getAvailableYears);
router.post("/quiz/check", verifyTokenFromBody, checkQuizAttempt);

router.post("/test", verifyTokenFromBody, getAvailableTest);
router.post("/test/bytest", verifyTokenFromBody, getQuestionsByTest);
router.post("/test/submit", verifyTokenFromBody, submitTest);
router.post("/test/check", verifyTokenFromBody, checkTestAttempt);
router.post("/test/profile", verifyTokenFromBody, testDataProfile);
router.post("/test/leaderboard", verifyTokenFromBody, testLeaderboard);

export default router;
