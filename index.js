"use strict";
require("dotenv").config();

const express   = require("express");
const cors      = require("cors");
const helmet    = require("helmet");
const morgan    = require("morgan");
const rateLimit = require("express-rate-limit");
const mongoose  = require("mongoose");
const path      = require("path");

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000").split(",").map(s => s.trim());
app.use(cors({ origin: allowedOrigins, credentials: true }));

app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve locally stored uploads (fallback when S3 is not configured)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Rate limiting
app.use("/api/", rateLimit({
  windowMs: 60000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
}));

// ── MongoDB ───────────────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/fitverse")
  .then(() => console.log("✅  MongoDB connected"))
  .catch((err) => console.warn("⚠️  MongoDB connection failed:", err.message));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth",     require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/tryon",    require("./routes/tryon"));
app.use("/api/orders",   require("./routes/orders"));

app.get("/api/health", function (req, res) {
  res.json({
    status: "ok",
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    node: process.version,
    env: process.env.NODE_ENV || "development",
  });
});

// 404
app.use(function (req, res) {
  res.status(404).json({ error: "Route not found." });
});

// Global error handler
app.use(function (err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error("Unhandled error:", err.message || err);
  res.status(500).json({ error: "Internal server error." });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, function () {
  console.log("FitVerse API running on port " + PORT);
  console.log("Health check: http://localhost:" + PORT + "/api/health");
  if (!process.env.MONGO_URI)           console.log("  [warn] MONGO_URI not set");
  if (!process.env.JWT_SECRET)          console.log("  [warn] JWT_SECRET not set — using insecure default");
  if (!process.env.REPLICATE_API_TOKEN) console.log("  [warn] REPLICATE_API_TOKEN not set — try-on uses mock mode");
  if (!process.env.AWS_ACCESS_KEY)      console.log("  [warn] AWS keys not set — images saved to /uploads");
});

module.exports = app;
