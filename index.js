import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./DataBase/db.config.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// DB
connectDB();

// Routes
app.use("/api/auth", authRoutes);

// Test
app.get("/", (req, res) => {
  res.send("Auth API running 🚀");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
