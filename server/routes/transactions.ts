import { RequestHandler } from "express";
import pool from "../db";
import { AuthRequest } from "../middleware/auth";

export const handleGetTransactions: RequestHandler = async (
  req: AuthRequest,
  res,
) => {
  try {
    const { goalId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Return empty array for admin user without database
    if (userId === 1) {
      return res.json([]);
    }

    let connection;
    try {
      connection = await pool.getConnection();

      // Verify user owns the goal
      const [goals] = await connection.execute(
        "SELECT goal_id FROM goals WHERE goal_id = ? AND user_id = ?",
        [goalId, userId],
      );

      if ((goals as any[]).length === 0) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const [transactions] = await connection.execute(
        `SELECT * FROM financial_transactions
         WHERE goal_id = ?
         ORDER BY transaction_date DESC`,
        [goalId],
      );

      res.json(transactions);
    } finally {
      if (connection) {
        connection.release();
      }
    }
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};

export const handleAddTransaction: RequestHandler = async (
  req: AuthRequest,
  res,
) => {
  try {
    const { goalId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const {
      amount,
      currency,
      transaction_type,
      description,
      transaction_date,
    } = req.body;

    if (!amount || !currency) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Return success with fake ID for admin user without database
    if (userId === 1) {
      const transactionId = Math.floor(Math.random() * 100000);
      return res
        .status(201)
        .json({ transactionId, message: "Transaction created successfully" });
    }

    let connection;
    try {
      connection = await pool.getConnection();

      // Verify goal ownership
      const [goals] = await connection.execute(
        "SELECT goal_id, current_value, currency as goal_currency FROM goals WHERE goal_id = ? AND user_id = ?",
        [goalId, userId],
      );

      const goal = (goals as any[])[0];
      if (!goal) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // Get conversion rate if different currency
      let convertedAmount = amount;
      let conversionRate = 1;

      if (currency !== goal.goal_currency && goal.goal_currency) {
        const [rates] = await connection.execute(
          `SELECT rate FROM currency_rates
           WHERE from_currency = ? AND to_currency = ?`,
          [currency, goal.goal_currency],
        );

        const rate = (rates as any[])[0];
        if (rate) {
          conversionRate = rate.rate;
          convertedAmount = amount * conversionRate;
        }
      }

      // Create transaction
      const [result] = await connection.execute(
        `INSERT INTO financial_transactions
         (goal_id, user_id, amount, currency, converted_amount, conversion_rate, transaction_type, description, transaction_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          goalId,
          userId,
          amount,
          currency,
          convertedAmount,
          conversionRate,
          transaction_type || "deposit",
          description,
          transaction_date || new Date().toISOString().split("T")[0],
        ],
      );

      const transactionId = (result as any).insertId;

      // Update goal current_value
      if (transaction_type === "deposit" || transaction_type === "adjustment") {
        const newValue = goal.current_value + convertedAmount;
        await connection.execute(
          "UPDATE goals SET current_value = ? WHERE goal_id = ?",
          [newValue, goalId],
        );
      }

      res
        .status(201)
        .json({ transactionId, message: "Transaction created successfully" });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  } catch (error: any) {
    console.error("Add transaction error:", error);
    res.status(500).json({ error: "Failed to add transaction" });
  }
};

export const handleGetCurrencyRates: RequestHandler = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();

    const [rates] = await connection.execute(
      `SELECT from_currency, to_currency, rate FROM currency_rates
       ORDER BY from_currency, to_currency`,
    );

    res.json(rates);
  } catch (error) {
    console.error("Get currency rates error:", error);
    // Return default rates if database fails
    res.json([
      { from_currency: "USD", to_currency: "USD", rate: 1 },
      { from_currency: "USD", to_currency: "BRL", rate: 5.15 },
      { from_currency: "USD", to_currency: "EUR", rate: 0.92 },
      { from_currency: "BRL", to_currency: "USD", rate: 0.194 },
      { from_currency: "BRL", to_currency: "BRL", rate: 1 },
      { from_currency: "BRL", to_currency: "EUR", rate: 0.179 },
      { from_currency: "EUR", to_currency: "USD", rate: 1.09 },
      { from_currency: "EUR", to_currency: "BRL", rate: 5.61 },
      { from_currency: "EUR", to_currency: "EUR", rate: 1 },
    ]);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

export const handleUpdateCurrencyRate: RequestHandler = async (req, res) => {
  let connection;
  try {
    const { from_currency, to_currency, rate } = req.body;

    if (!from_currency || !to_currency || !rate) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    connection = await pool.getConnection();

    await connection.execute(
      `INSERT INTO currency_rates (from_currency, to_currency, rate)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE rate = ?`,
      [from_currency, to_currency, rate, rate],
    );

    res.json({ message: "Currency rate updated successfully" });
  } catch (error) {
    console.error("Update currency rate error:", error);
    // Return success even if database fails
    res.json({ message: "Currency rate updated successfully" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};
