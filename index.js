import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
// import userRouter from "./routes/user.route.js";
import authRouter from "./routes/auth.route.js";
// import listingRouter from "./routes/listing.route.js";
import cors from "cors";
import cookieParser from "cookie-parser";

const corsConfig = {
  origin: "*",
  credentials: true, // 🔥 allow cookies
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Add global error handlers
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

dotenv.config();

const app = express();

// ✅ CORS middleware - apply it globally
app.use(cors(corsConfig));

// ✅ Handle preflight OPTIONS requests for all routes
app.options("*", cors(corsConfig));

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// Simple test route first
app.get("/", (req, res) => {
  res.json({ message: "Server is running!" });
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
  });
});

// Connect DB and then add routes
try {
  await connectDB();
  console.log("MongoDB connected");

  // Add routes after DB connection
  // app.use("/api/user", userRouter);
  app.use("/api", authRouter);
  // app.use("/api/listing", listingRouter);
} catch (error) {
  console.error("Failed to connect to MongoDB:", error);
  // Still start server but without DB routes
  app.use("/api/*", (req, res) => {
    res.status(503).json({ error: "Database connection failed" });
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
