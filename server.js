const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const winston = require("winston");
const path = require("path");

// Load env
dotenv.config({ path: "./.env" });

// Connect MongoDB
connectDB();

const app = express();

/* -------------------------------
   CORS – Allow All
-------------------------------- */
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* -------------------------------
   Body Middleware
-------------------------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());

/* -------------------------------
   ROOT ROUTE (FIX FOR Cannot GET /)
-------------------------------- */
app.get("/", (req, res) => {
  res.send("🚀 Backend API is Running Successfully!");
});

/* -------------------------------
   API ROUTES
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

/* -------------------------------
   Health Check
-------------------------------- */
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is running perfectly 🚀",
    time: new Date(),
  });
});

/* -------------------------------
   Error Handler
-------------------------------- */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

/* -------------------------------
   Start Server
-------------------------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
