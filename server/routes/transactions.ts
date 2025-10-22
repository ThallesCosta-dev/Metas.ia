import { RequestHandler } from "express";
import pool from "../db";
import { AuthRequest } from "../middleware/auth";

export const handleGetTransactions: RequestHandler = async (req: AuthRequest, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { goalId } = req.params;
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Verify user owns the goal
    const [goals] = await connection.execute(
      "SELECT goal_id FROM goals WHERE goal_id = ? AND user_id = ?",
      [goalId, userId]
    );

    if ((goals as any[]).length === 0) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const [transactions] = await connection.execute(
      `SELECT * FROM financial_transactions 
       WHERE goal_id = ? 
       ORDER BY transaction_date DESC`,
      [goalId]
    );

    res.json(transactions);
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  } finally {
    connection.release();
  }
};

export const handleAddTransaction: RequestHandler = async (req: AuthRequest, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { goalId } = req.params;
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { amount, currency, transaction_type, description, transaction_date } = req.body;

    if (!amount || !currency) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify goal ownership
    const [goals] = await connection.execute(
      "SELECT goal_id, current_value, currency as goal_currency FROM goals WHERE goal_id = ? AND user_id = ?",
      [goalId, userId]
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
        [currency, goal.goal_currency]
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
      ]
    );

    const transactionId = (result as any).insertId;

    // Update goal current_value
    if (transaction_type === "deposit" || transaction_type === "adjustment") {
      const newValue = goal.current_value + convertedAmount;
      await connection.execute(
        "UPDATE goals SET current_value = ? WHERE goal_id = ?",
        [newValue, goalId]
      );
    }

    res.status(201).json({ transactionId, message: "Transaction created successfully" });
  } catch (error: any) {
    console.error("Add transaction error:", error);
    res.status(500).json({ error: "Failed to add transaction" });
  } finally {
    connection.release();
  }
};

export const handleGetCurrencyRates: RequestHandler = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const [rates] = await connection.execute(
      `SELECT from_currency, to_currency, rate FROM currency_rates 
       ORDER BY from_currency, to_currency`
    );

    res.json(rates);
  } catch (error) {
    console.error("Get currency rates error:", error);
    res.status(500).json({ error: "Failed to fetch currency rates" });
  } finally {
    connection.release();
  }
};

export const handleUpdateCurrencyRate: RequestHandler = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { from_currency, to_currency, rate } = req.body;

    if (!from_currency || !to_currency || !rate) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await connection.execute(
      `INSERT INTO currency_rates (from_currency, to_currency, rate)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE rate = ?`,
      [from_currency, to_currency, rate, rate]
    );

    res.json({ message: "Currency rate updated successfully" });
  } catch (error) {
    console.error("Update currency rate error:", error);
    res.status(500).json({ error: "Failed to update currency rate" });
  } finally {
    connection.release();
  }
};
