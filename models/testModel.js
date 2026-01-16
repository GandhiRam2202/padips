import mongoose from "mongoose";

const testSchema = new mongoose.Schema(
  {
    test: Number,
    exam: String,
    subject: String,
    chapter: String,
    topic: String,
    question: String,
    options: [String],
    correctAnswer: Number,
    difficulty: String,
    explanation: String,
    source: String,
  },
  { timestamps: true }
);

export default mongoose.model("testModel", testSchema, "testModel");


