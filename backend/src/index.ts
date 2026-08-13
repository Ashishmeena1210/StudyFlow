import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "./db/prisma.js";
import authRoutes from "./routes/authRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import goalRoutes from "./routes/goalRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";
import resourceRoutes from "./routes/resourceRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Configure CORS
const allowedOrigins = (process.env.CORS_ORIGIN || "*").split(",");
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS policy violation"));
      }
    },
    credentials: true,
  })
);

// Register API v1 Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/subjects", subjectRoutes);
app.use("/api/v1/goals", goalRoutes);
app.use("/api/v1/tasks", taskRoutes);
app.use("/api/v1/study-sessions", sessionRoutes);
app.use("/api/v1/resources", resourceRoutes);
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1/analytics", analyticsRoutes);

// Database Health Check Endpoint
app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      database: "disconnected",
      message: error instanceof Error ? error.message : "Database connection failed",
    });
  }
});

// Root App Info
app.get("/", (_req, res) => {
  res.json({
    service: "StudyFlow Backend API",
    status: "running",
    version: "v1",
    endpoints: {
      auth: "/api/v1/auth",
      subjects: "/api/v1/subjects",
      goals: "/api/v1/goals",
      tasks: "/api/v1/tasks",
      studySessions: "/api/v1/study-sessions",
      resources: "/api/v1/resources",
      ai: "/api/v1/ai",
      analytics: "/api/v1/analytics",
      health: "/health",
    },
  });
});

app.listen(PORT, () => {
  console.log(`🚀 StudyFlow Backend API running on http://localhost:${PORT}`);
  console.log(`📊 Database Health Check: http://localhost:${PORT}/health`);
});
