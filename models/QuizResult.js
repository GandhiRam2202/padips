// models/QuizResult.js
import mongoose from "mongoose";

const quizResultSchema = new mongoose.Schema({
  year: Number,
  email: String,
  name: String,
  score: Number,
}, { timestamps: true });

quizResultSchema.index({ year: 1, email: 1 }, { unique: true });

export default mongoose.model("QuizResult", quizResultSchema);
