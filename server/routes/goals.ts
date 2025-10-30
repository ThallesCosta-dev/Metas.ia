import { RequestHandler } from "express";
import supabase from "../supabase";
import { AuthRequest } from "../middleware/auth";

export const handleGetGoals: RequestHandler = async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { data: goals, error } = await supabase
      .from("goals")
      .select(`
        *,
        subgoals:subgoals(count),
        financial_transactions:financial_transactions(amount, transaction_type)
      `)
      .eq("user_id", userId)
      .order("due_date", { ascending: true });

    if (error) {
      console.error("Get goals error:", error);
      return res.status(500).json({ error: "Failed to fetch goals" });
    }

    res.json(goals || []);
  } catch (error) {
    console.error("Get goals error:", error);
    res.status(500).json({ error: "Failed to fetch goals" });
  }
};

export const handleGetGoal: RequestHandler = async (req: AuthRequest, res) => {
  try {
    const { goalId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { data: goal, error } = await supabase
      .from("goals")
      .select(`
        *,
        subgoals:subgoals(*),
        financial_transactions:financial_transactions(*)
      `)
      .eq("id", goalId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !goal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    res.json(goal);
  } catch (error) {
    console.error("Get goal error:", error);
    res.status(500).json({ error: "Failed to fetch goal" });
  }
};

export const handleCreateGoal: RequestHandler = async (
  req: AuthRequest,
  res,
) => {
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

    const { data: goal, error } = await supabase
      .from("goals")
      .insert({
        user_id: userId,
        title,
        description,
        category,
        priority: priority || "medium",
        start_date,
        due_date,
        is_financial: is_financial || false,
        target_value: target_value || null,
        currency: currency || null,
        status: "not_started",
      })
      .select()
      .single();

    if (error || !goal) {
      console.error("Create goal error:", error);
      return res.status(500).json({ error: "Failed to create goal" });
    }

    await supabase.from("activity_log").insert({
      user_id: userId,
      goal_id: goal.id,
      action_type: "goal_created",
      description: `Created goal: ${title}`,
    });

    res.status(201).json({ goalId: goal.id, message: "Goal created successfully" });
  } catch (error: any) {
    console.error("Create goal error:", error);
    res.status(500).json({ error: "Failed to create goal" });
  }
};

export const handleUpdateGoal: RequestHandler = async (
  req: AuthRequest,
  res,
) => {
  try {
    const { goalId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { data: existingGoal } = await supabase
      .from("goals")
      .select("id")
      .eq("id", goalId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!existingGoal) {
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

    const updates: any = { updated_at: new Date().toISOString() };
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (priority !== undefined) updates.priority = priority;
    if (status !== undefined) {
      updates.status = status;
      if (status === "completed") {
        updates.completed_at = new Date().toISOString();
      }
    }
    if (start_date !== undefined) updates.start_date = start_date;
    if (due_date !== undefined) updates.due_date = due_date;
    if (target_value !== undefined) updates.target_value = target_value;
    if (current_value !== undefined) updates.current_value = current_value;
    if (progress_percentage !== undefined) updates.progress_percentage = progress_percentage;

    const { error } = await supabase
      .from("goals")
      .update(updates)
      .eq("id", goalId);

    if (error) {
      console.error("Update goal error:", error);
      return res.status(500).json({ error: "Failed to update goal" });
    }

    await supabase.from("activity_log").insert({
      user_id: userId,
      goal_id: goalId,
      action_type: "goal_updated",
      description: `Updated goal${status ? ` to ${status}` : ""}`,
    });

    res.json({ message: "Goal updated successfully" });
  } catch (error) {
    console.error("Update goal error:", error);
    res.status(500).json({ error: "Failed to update goal" });
  }
};

export const handleDeleteGoal: RequestHandler = async (
  req: AuthRequest,
  res,
) => {
  try {
    const { goalId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { data: existingGoal } = await supabase
      .from("goals")
      .select("id")
      .eq("id", goalId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!existingGoal) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await supabase.from("activity_log").insert({
      user_id: userId,
      goal_id: goalId,
      action_type: "goal_deleted",
      description: "Deleted goal",
    });

    const { error } = await supabase
      .from("goals")
      .delete()
      .eq("id", goalId);

    if (error) {
      console.error("Delete goal error:", error);
      return res.status(500).json({ error: "Failed to delete goal" });
    }

    res.json({ message: "Goal deleted successfully" });
  } catch (error) {
    console.error("Delete goal error:", error);
    res.status(500).json({ error: "Failed to delete goal" });
  }
};
