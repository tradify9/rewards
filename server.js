const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const path = require("path");

/* -------------------------------
   Load ENV
-------------------------------- */
dotenv.config();

/* 🔍 FORENSIC DEBUG */
console.log("ENV loaded:", process.env.MONGO_URI ? "YES ✅" : "NO ❌");
console.log("RAW URI:", JSON.stringify(process.env.MONGO_URI));
console.log("URI length:", process.env.MONGO_URI?.length);

/* -------------------------------
   Connect MongoDB
-------------------------------- */
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI missing in .env");
    }
    
    const uri = process.env.MONGO_URI.trim();

    console.log("CLEAN URI:", JSON.stringify(uri));
    console.log("CLEAN length:", uri.length);

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });

    console.log("✅ MongoDB connected");

  } catch (err) {
    console.error("❌ MongoDB connection failed");
    console.error("Reason:", err.message);
    console.error("Error name:", err.name);
    process.exit(1);
  }
};

const app = express();

/* -------------------------------
   Middleware
-------------------------------- */
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());

/* -------------------------------
   ROOT ROUTE
-------------------------------- */
app.get("/", (req, res) => {
  res.send("🚀 Backend API is Running Successfully!");
});

/* -------------------------------
   API ROUTES (ALL INCLUDED)
-------------------------------- */
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/rewards", require("./routes/rewardRoutes"));
app.use("/api/withdrawals", require("./routes/withdrawalRoutes"));
app.use("/api/services", require("./routes/serviceRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/user-details", require("./routes/userDetailsRoutes"));
app.use("/api/transactions", require("./routes/transactionRoutes"));
app.use("/api/settings", require("./routes/settingsRoutes"));
app.use("/api/referrals", require("./routes/referralRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/kyc", require("./routes/kycRoutes"));
app.use("/api/home-content", require("./routes/homeContentRoutes"));

/* -------------------------------
   Health Check
-------------------------------- */
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server running 🚀",
    time: new Date(),
  });
});

/* -------------------------------
   Error Handler
-------------------------------- */
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

/* -------------------------------
   Start AFTER DB connect
-------------------------------- */
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});
