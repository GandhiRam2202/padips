import bcrypt from "bcryptjs";
import User from "../models/User.js";
import emailjs from "@emailjs/nodejs";
import jwt from "jsonwebtoken";
import Syllabus from "../models/Syllabus.js";
import mcq from "../models/mcq.js";
import QuizResult from "../models/QuizResult.js";
import testModel from "../models/testModel.js";
import TestSubmit from "../models/TestSubmit.js";





/* ================= LOGIN ================= */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Validate input
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // 2️⃣ Find user
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    // 3️⃣ Check user exists
    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // 4️⃣ Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // 5️⃣ Generate JWT
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      }
    );

    // 6️⃣ Send response
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
};





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




export const sendEmail = async (req, res) => {
  const { name, email, feedback } = req.body;
  
  // ✅ Validation
  if (!name || !email || !feedback) {
    return res.status(400).json({
      success: false,
      msg: "Missing fields",
    });
  }
  
  try {
    const response = await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID_2,
      {
        from_name: name,
        from_email: email,
        message: feedback, // 👈 map feedback to email template
      },
      {
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
        privateKey: process.env.EMAILJS_PRIVATE_KEY,
      }
    );
    
    return res.status(200).json({
      success: true,
      msg: "Feedback email sent successfully",
      response,
    });
  } catch (error) {
    console.error("EmailJS Error:", error);
    
    return res.status(500).json({
      success: false,
      msg: "Email sending failed",
      error: error?.text || error,
    });
  }
};

/* ================= Syllabus get  ================= */



export const getSyllabusBySubject = async (req, res) => {
  try {
    const { subject } = req.params;

    const syllabus = await Syllabus.findOne({
      subject: { $regex: `^${subject}$`, $options: "i" },
    }).lean();

    if (!syllabus) {
      return res.status(404).json({
        success: false,
        message: "Syllabus not found for this subject",
      });
    }

    return res.status(200).json({
      success: true,
      data: syllabus,
    });
  } catch (error) {
    console.error("Syllabus Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch syllabus",
    });
  }
};



// controllers/questionController.js


export const getAvailableYears = async (req, res) => {
  try {
    const years = await mcq.distinct("year");
    
    return res.status(200).json({
      success: true,
      data: years.sort((a, b) => b - a),
    });
  } catch (error) {
    console.error("Get Years Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch years",
    });
  }
};

// controllers/questionController.js

export const getQuestionsByYear = async (req, res) => {
  try {
    const { year } = req.params;

    const questions = await mcq.find({ year: Number(year) })
    

    if (!questions.length) {
      return res.status(404).json({
        success: false,
        message: "No questions found for this year",
      });
    }
    
    
    return res.status(200).json({
      success: true,
      
      data: questions,
      
      
    });
  } catch (error) {
    console.error("Question Fetch Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch questions",
    });
  }
};



export const submitQuiz = async (req, res) => {
  try {
    const { year, email, name, score } = req.body;

    if (!year || !email || !name || score === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // 🚫 Prevent re-attempt (one attempt per year)
    const alreadyAttempted = await QuizResult.findOne({ year, email });

    if (alreadyAttempted) {
      return res.status(400).json({
        success: false,
        message: "Already attempted",
      });
    }

    await QuizResult.create({
      year,
      email,
      name,
      score,
    });

    return res.status(200).json({
      success: true,
      message: "Quiz submitted successfully",
    });
  } catch (error) {
    console.error("Submit Quiz Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit quiz",
    });
  }
};





/* ✅ CHECK QUIZ ATTEMPT (IMPORTANT FIX) */
export const checkQuizAttempt = async (req, res) => {
  try {
    const { year, email } = req.body;

    const attempt = await QuizResult.findOne({ year, email });

    if (!attempt) {
      return res.status(200).json({
        success: true,
        attempted: false,
      });
    }

    return res.status(200).json({
      success: true,
      attempted: true,
      score: attempt.score,
      submittedAt: attempt.createdAt,
    });
  } catch (error) {
    console.error("Check Quiz Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to check quiz status",
    });
  }
};



// controllers/questionController.js/testcount




export const getAvailableTest = async (req, res) => {
  try {
    // ✅ Get all unique test numbers
    const tests = await testModel.distinct("test");

    return res.status(200).json({
      success: true,
      data: tests.sort((a, b) => a - b), // test 1,2,3...
    });

  } catch (error) {
    console.error("Get Tests Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch tests",
    });
  }
};

//get questions by test number 
export const getQuestionsByTest = async (req, res) => {
  try {
    const { test: testNo } = req.body; // ✅ rename body variable

    if (testNo === undefined || isNaN(Number(testNo))) {
      return res.status(400).json({
        success: false,
        message: "Valid test number is required",
      });
    }

    // ✅ USE MODEL (Test), NOT testNo
    const questions = await testModel.find({ test: Number(testNo) });

    if (!questions || questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No questions found for this test",
      });
    }

    return res.status(200).json({
      success: true,
      data: questions,
    });

  } catch (error) {
    console.error("Question Fetch By Test Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch questions by test",
    });
  }
};



//test submit



export const submitTest = async (req, res) => {
  try {
    const { test, email, name, score } = req.body;

    // ✅ Validation
    if (
      test === undefined ||
      isNaN(Number(test)) ||
      !email ||
      !name ||
      score === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing or invalid required fields",
      });
    }

    // 🚫 Prevent re-attempt (one attempt per test)
    const alreadyAttempted = await TestSubmit.findOne({
      test: Number(test),
      email,
    });

    if (alreadyAttempted) {
      return res.status(400).json({
        success: false,
        message: "Test already attempted",
      });
    }

    await TestSubmit.create({
      test: Number(test),
      email,
      name,
      score,
    });

    return res.status(200).json({
      success: true,
      message: "Test submitted successfully",
    });

  } catch (error) {
    console.error("Submit Test Error:", error);

    // ✅ Handle duplicate index error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Test already attempted",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to submit test",
    });
  }
};



// test chech attempts


export const checkTestAttempt = async (req, res) => {
  try {
    const { test, email } = req.body;

    // ✅ Validation
    if (test === undefined || isNaN(Number(test)) || !email) {
      return res.status(400).json({
        success: false,
        message: "Valid test number and email are required",
      });
    }

    const attempt = await TestSubmit.findOne({
      test: Number(test),
      email,
    });

    if (!attempt) {
      return res.status(200).json({
        success: true,
        attempted: false,
      });
    }

    return res.status(200).json({
      success: true,
      attempted: true,
      score: attempt.score,
      submittedAt: attempt.createdAt,
    });

  } catch (error) {
    console.error("Check Test Attempt Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to check test status",
    });
  }
};



/* ✅ TEST PROFILE DATA */
export const testDataProfile = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // ✅ Find ALL test attempts of the user
    const attempts = await TestSubmit.find(
      { email },
      {
        test: 1,
        score: 1,
        createdAt: 1,
        _id: 0,
      }
    ).sort({ test: 1 });

    // ✅ No attempts
    if (!attempts.length) {
      return res.status(200).json({
        success: true,
        attempted: false,
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      attempted: true,
      data: attempts,
    });

  } catch (error) {
    console.error("Test Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch test profile data",
    });
  }
};


/* 🏆 TEST LEADERBOARD */
export const testLeaderboard = async (req, res) => {
  try {
    const leaderboard = await TestSubmit.aggregate([
      {
        $group: {
          _id: "$email",          // ✅ group by user
          name: { $first: "$name" },
          totalScore: { $sum: "$score" },
          tests: { $sum: 1 },
          avgScore: { $avg: "$score" },
        },
      },
      {
        $project: {
          _id: 0,
          name: 1,
          totalScore: 1,
          tests: 1,
          avgScore: { $round: ["$avgScore", 2] },
        },
      },
      {
        $sort: { avgScore: -1 }, // 🔥 Highest avg first
      },
    ]);

    return res.status(200).json({
      success: true,
      data: leaderboard,
    });

  } catch (error) {
    console.error("Test Leaderboard Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate test leaderboard",
    });
  }
};
