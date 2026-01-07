import bcrypt from "bcryptjs";
import User from "../models/User.js";
import emailjs from "@emailjs/nodejs";
import jwt from "jsonwebtoken";
import Syllabus from "../models/Syllabus.js";
import mcq from "../models/mcq.js";





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

