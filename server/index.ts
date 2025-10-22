import "dotenv/config";
import express from "express";
import cors from "cors";
import initializeDatabase from "./db-init";
import { authMiddleware } from "./middleware/auth";
import { handleDemo } from "./routes/demo";
import { handleCurrencyConversion, handleGetExchangeRates } from "./routes/currency";
import { handleRegister, handleLogin, handleGetProfile, handleUpdateProfile } from "./routes/auth";
import { handleGetGoals, handleGetGoal, handleCreateGoal, handleUpdateGoal, handleDeleteGoal } from "./routes/goals";
import { handleGetSubgoals, handleCreateSubgoal, handleUpdateSubgoal, handleDeleteSubgoal } from "./routes/subgoals";
import { handleGetTransactions, handleAddTransaction, handleGetCurrencyRates, handleUpdateCurrencyRate } from "./routes/transactions";
import { handleGetAchievements, handleGetUserStatistics, handleUpdateUserStatistics, handleCheckAndUnlockAchievements } from "./routes/achievements";

export async function createServer() {
  const app = express();

  // Initialize database on startup
  try {
    await initializeDatabase();
  } catch (error) {
    console.error("Failed to initialize database:", error);
    // Continue anyway, tables might already exist
  }

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  // Demo route
  app.get("/api/demo", handleDemo);

  // Auth routes (public)
  app.post("/api/auth/register", handleRegister);
  app.post("/api/auth/login", handleLogin);

  // Protected routes - require authentication
  app.get("/api/auth/profile", authMiddleware, handleGetProfile);
  app.put("/api/auth/profile", authMiddleware, handleUpdateProfile);

  // Goals routes
  app.get("/api/goals", authMiddleware, handleGetGoals);
  app.get("/api/goals/:goalId", authMiddleware, handleGetGoal);
  app.post("/api/goals", authMiddleware, handleCreateGoal);
  app.put("/api/goals/:goalId", authMiddleware, handleUpdateGoal);
  app.delete("/api/goals/:goalId", authMiddleware, handleDeleteGoal);

  // Subgoals routes
  app.get("/api/goals/:goalId/subgoals", authMiddleware, handleGetSubgoals);
  app.post("/api/goals/:goalId/subgoals", authMiddleware, handleCreateSubgoal);
  app.put("/api/goals/:goalId/subgoals/:subgoalId", authMiddleware, handleUpdateSubgoal);
  app.delete("/api/goals/:goalId/subgoals/:subgoalId", authMiddleware, handleDeleteSubgoal);

  // Financial transactions routes
  app.get("/api/goals/:goalId/transactions", authMiddleware, handleGetTransactions);
  app.post("/api/goals/:goalId/transactions", authMiddleware, handleAddTransaction);
  app.get("/api/currency/rates", handleGetCurrencyRates);
  app.put("/api/currency/rates", handleUpdateCurrencyRate);

  // Currency conversion (legacy route)
  app.get("/api/currency/convert", handleCurrencyConversion);

  // Achievements routes
  app.get("/api/achievements", authMiddleware, handleGetAchievements);
  app.post("/api/achievements/check", authMiddleware, handleCheckAndUnlockAchievements);

  // User statistics routes
  app.get("/api/statistics", authMiddleware, handleGetUserStatistics);
  app.post("/api/statistics/update", authMiddleware, handleUpdateUserStatistics);

  return app;
}
