import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleCurrencyConversion, handleGetExchangeRates } from "./routes/currency";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Currency conversion routes
  app.get("/api/currency/convert", handleCurrencyConversion);
  app.get("/api/currency/rates", handleGetExchangeRates);

  return app;
}
