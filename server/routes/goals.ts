import { RequestHandler } from "express";
import pool from "../db";
import { AuthRequest } from "../middleware/auth";

export const handleGetGoals: RequestHandler = async (req: AuthRequest, res) => {
  const connection = await pool.getConnection();
  
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const [goals] = await connection.execute(
      `SELECT 
        g.*,
        COUNT(DISTINCT s.subgoal_id) AS total_subgoals,
        COUNT(DISTINCT CASE WHEN s.status = 'completed' THEN s.subgoal_id END) AS completed_subgoals,
        COALESCE(SUM(DISTINCT ft.amount), 0) AS total_contributed
      FROM goals g
      LEFT JOIN subgoals s ON g.goal_id = s.goal_id
      LEFT JOIN financial_transactions ft ON g.goal_id = ft.goal_id AND ft.transaction_type = 'deposit'
      WHERE g.user_id = ?
      GROUP BY g.goal_id
      ORDER BY g.due_date ASC`,
      [userId]
    );

    res.json(goals);
  } catch (error) {
    console.error("Get goals error:", error);
    res.status(500).json({ error: "Failed to fetch goals" });
  } finally {
    connection.release();
  }
};

export const handleGetGoal: RequestHandler = async (req: AuthRequest, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { goalId } = req.params;
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const [goals] = await connection.execute(
      "SELECT * FROM goals WHERE goal_id = ? AND user_id = ?",
      [goalId, userId]
    );

    const goal = (goals as any[])[0];
    if (!goal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    const [subgoals] = await connection.execute(
      "SELECT * FROM subgoals WHERE goal_id = ? ORDER BY position",
      [goalId]
    );

    const [transactions] = await connection.execute(
      "SELECT * FROM financial_transactions WHERE goal_id = ? ORDER BY transaction_date DESC",
      [goalId]
    );

    res.json({ ...goal, subgoals, transactions });
  } catch (error) {
    console.error("Get goal error:", error);
    res.status(500).json({ error: "Failed to fetch goal" });
  } finally {
    connection.release();
  }
};

export const handleCreateGoal: RequestHandler = async (req: AuthRequest, res) => {
  const connection = await pool.getConnection();
  
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const {
      title,
      description,
      category,
      priority,
      start_date,
      due_date,
      is_financial,
      target_value,
      currency,
    } = req.body;

    if (!title || !start_date || !due_date) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const [result] = await connection.execute(
      `INSERT INTO goals 
       (user_id, title, description, category, priority, start_date, due_date, is_financial, target_value, currency, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'not_started')`,
      [
        userId,
        title,
        description,
        category,
        priority || "medium",
        start_date,
        due_date,
        is_financial ? 1 : 0,
        target_value || null,
        currency || null,
      ]
    );

    const goalId = (result as any).insertId;

    // Log activity
    await connection.execute(
      `INSERT INTO activity_log (user_id, goal_id, action_type, description)
       VALUES (?, ?, 'goal_created', ?)`,
      [userId, goalId, `Created goal: ${title}`]
    );

    res.status(201).json({ goalId, message: "Goal created successfully" });
  } catch (error: any) {
    console.error("Create goal error:", error);
    res.status(500).json({ error: "Failed to create goal" });
  } finally {
    connection.release();
  }
};

export const handleUpdateGoal: RequestHandler = async (req: AuthRequest, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { goalId } = req.params;
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Verify goal ownership
    const [goals] = await connection.execute(
      "SELECT goal_id FROM goals WHERE goal_id = ? AND user_id = ?",
      [goalId, userId]
    );

    if ((goals as any[]).length === 0) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const {
      title,
      description,
      category,
      priority,
      status,
      start_date,
      due_date,
      target_value,
      current_value,
      progress_percentage,
    } = req.body;

    await connection.execute(
      `UPDATE goals 
       SET title = COALESCE(?, title),
           description = COALESCE(?, description),
           category = COALESCE(?, category),
           priority = COALESCE(?, priority),
           status = COALESCE(?, status),
           start_date = COALESCE(?, start_date),
           due_date = COALESCE(?, due_date),
           target_value = COALESCE(?, target_value),
           current_value = COALESCE(?, current_value),
           progress_percentage = COALESCE(?, progress_percentage),
           completed_at = CASE WHEN ? = 'completed' THEN NOW() ELSE completed_at END
       WHERE goal_id = ?`,
      [
        title,
        description,
        category,
        priority,
        status,
        start_date,
        due_date,
        target_value,
        current_value,
        progress_percentage,
        status,
        goalId,
      ]
    );

    // Log activity
    await connection.execute(
      `INSERT INTO activity_log (user_id, goal_id, action_type, description)
       VALUES (?, ?, 'goal_updated', ?)`,
      [userId, goalId, `Updated goal${status ? ` to ${status}` : ""}`]
    );

    res.json({ message: "Goal updated successfully" });
  } catch (error) {
    console.error("Update goal error:", error);
    res.status(500).json({ error: "Failed to update goal" });
  } finally {
    connection.release();
  }
};

export const handleDeleteGoal: RequestHandler = async (req: AuthRequest, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { goalId } = req.params;
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Verify goal ownership
    const [goals] = await connection.execute(
      "SELECT goal_id FROM goals WHERE goal_id = ? AND user_id = ?",
      [goalId, userId]
    );

    if ((goals as any[]).length === 0) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await connection.execute("DELETE FROM goals WHERE goal_id = ?", [goalId]);

    // Log activity
    await connection.execute(
      `INSERT INTO activity_log (user_id, goal_id, action_type, description)
       VALUES (?, ?, 'goal_deleted', ?)`,
      [userId, goalId, "Deleted goal"]
    );

    res.json({ message: "Goal deleted successfully" });
  } catch (error) {
    console.error("Delete goal error:", error);
    res.status(500).json({ error: "Failed to delete goal" });
  } finally {
    connection.release();
  }
};
