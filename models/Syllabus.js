// models/Syllabus.js
import mongoose from "mongoose";

const SyllabusSchema = new mongoose.Schema(
  {
    subject: String,
    class: [Number],
    units: [
      {
        unit_no: Number,
        unit_name: String,
        topics: [String],
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Syllabus", SyllabusSchema, "sylabus");
