import mongoose from "mongoose";

const testSubmitSchema = new mongoose.Schema(
  {
    test: {
      type: Number,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

// 🚫 Prevent duplicate attempt per test per user
testSubmitSchema.index({ email: 1, test: 1 }, { unique: true });

export default mongoose.model("TestSubmit", testSubmitSchema);
