import { RequestHandler } from "express";
import pool from "../db";
import { AuthRequest } from "../middleware/auth";

export const handleGetSubgoals: RequestHandler = async (req: AuthRequest, res) => {
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

    const [subgoals] = await connection.execute(
      "SELECT * FROM subgoals WHERE goal_id = ? ORDER BY position",
      [goalId]
    );

    res.json(subgoals);
  } catch (error) {
    console.error("Get subgoals error:", error);
    res.status(500).json({ error: "Failed to fetch subgoals" });
  } finally {
    connection.release();
  }
};

export const handleCreateSubgoal: RequestHandler = async (req: AuthRequest, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { goalId } = req.params;
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { title, description, due_date, target_value, depends_on_subgoal_id } = req.body;

    if (!title || !due_date) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify goal ownership
    const [goals] = await connection.execute(
      "SELECT goal_id FROM goals WHERE goal_id = ? AND user_id = ?",
      [goalId, userId]
    );

    if ((goals as any[]).length === 0) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Get max position
    const [positions] = await connection.execute(
      "SELECT MAX(position) as max_position FROM subgoals WHERE goal_id = ?",
      [goalId]
    );

    const nextPosition = ((positions as any[])[0]?.max_position || 0) + 1;

    const [result] = await connection.execute(
      `INSERT INTO subgoals 
       (goal_id, title, description, due_date, target_value, depends_on_subgoal_id, position, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'not_started')`,
      [goalId, title, description, due_date, target_value || null, depends_on_subgoal_id || null, nextPosition]
    );

    const subgoalId = (result as any).insertId;

    res.status(201).json({ subgoalId, message: "Subgoal created successfully" });
  } catch (error) {
    console.error("Create subgoal error:", error);
    res.status(500).json({ error: "Failed to create subgoal" });
  } finally {
    connection.release();
  }
};

export const handleUpdateSubgoal: RequestHandler = async (req: AuthRequest, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { goalId, subgoalId } = req.params;
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

    const { title, description, status, due_date, current_value } = req.body;

    await connection.execute(
      `UPDATE subgoals 
       SET title = COALESCE(?, title),
           description = COALESCE(?, description),
           status = COALESCE(?, status),
           due_date = COALESCE(?, due_date),
           current_value = COALESCE(?, current_value),
           completed_at = CASE WHEN ? = 'completed' THEN NOW() ELSE completed_at END
       WHERE subgoal_id = ? AND goal_id = ?`,
      [title, description, status, due_date, current_value, status, subgoalId, goalId]
    );

    res.json({ message: "Subgoal updated successfully" });
  } catch (error) {
    console.error("Update subgoal error:", error);
    res.status(500).json({ error: "Failed to update subgoal" });
  } finally {
    connection.release();
  }
};

export const handleDeleteSubgoal: RequestHandler = async (req: AuthRequest, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { goalId, subgoalId } = req.params;
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

    await connection.execute(
      "DELETE FROM subgoals WHERE subgoal_id = ? AND goal_id = ?",
      [subgoalId, goalId]
    );

    res.json({ message: "Subgoal deleted successfully" });
  } catch (error) {
    console.error("Delete subgoal error:", error);
    res.status(500).json({ error: "Failed to delete subgoal" });
  } finally {
    connection.release();
  }
};
