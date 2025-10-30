import { RequestHandler } from "express";
import supabase from "../supabase";
import { AuthRequest } from "../middleware/auth";

export const handleGetAchievements: RequestHandler = async (
  req: AuthRequest,
  res,
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Return default achievements for admin user without database
    if (userId === 1) {
      const defaultAchievements = [
        {
          achievement_id: 1,
          code: "first_goal",
          name: "Primeira Meta",
          description: "Criou sua primeira meta",
          icon: "🎯",
          points: 10,
          category: "beginner",
          unlocked: 0,
          unlocked_at: null,
        },
        {
          achievement_id: 2,
          code: "goal_master",
          name: "Mestre das Metas",
          description: "Completou 10 metas",
          icon: "👑",
          points: 100,
          category: "completion",
          unlocked: 0,
          unlocked_at: null,
        },
        {
          achievement_id: 3,
          code: "streak_7",
          name: "Semana Produtiva",
          description: "Manteve 7 dias de sequência",
          icon: "🔥",
          points: 50,
          category: "consistency",
          unlocked: 0,
          unlocked_at: null,
        },
        {
          achievement_id: 4,
          code: "financial_saver",
          name: "Poupador",
          description: "Economizou R$ 1000",
          icon: "💰",
          points: 75,
          category: "financial",
          unlocked: 0,
          unlocked_at: null,
        },
        {
          achievement_id: 5,
          code: "speed_demon",
          name: "Velocista",
          description: "Completou uma meta antes do prazo",
          icon: "⚡",
          points: 25,
          category: "efficiency",
          unlocked: 0,
          unlocked_at: null,
        },
        {
          achievement_id: 6,
          code: "ambitious",
          name: "Ambicioso",
          description: "Criou 5 metas",
          icon: "🚀",
          points: 30,
          category: "beginner",
          unlocked: 0,
          unlocked_at: null,
        },
        {
          achievement_id: 7,
          code: "polymath",
          name: "Polímata",
          description: "Criou metas em todas as categorias",
          icon: "🌟",
          points: 80,
          category: "completion",
          unlocked: 0,
          unlocked_at: null,
        },
        {
          achievement_id: 8,
          code: "unstoppable",
          name: "Imparável",
          description: "Manteve 30 dias de sequência",
          icon: "⚡⚡",
          points: 150,
          category: "consistency",
          unlocked: 0,
          unlocked_at: null,
        },
      ];
      return res.json(defaultAchievements);
    }

    let connection;
    try {
      connection = await pool.getConnection();

      // Get all achievements with unlock status for this user
      const [achievements] = await connection.execute(
        `SELECT
          a.achievement_id,
          a.code,
          a.name,
          a.description,
          a.icon,
          a.points,
          a.category,
          CASE WHEN ua.user_achievement_id IS NOT NULL THEN 1 ELSE 0 END as unlocked,
          ua.unlocked_at
        FROM achievements a
        LEFT JOIN user_achievements ua ON a.achievement_id = ua.achievement_id AND ua.user_id = ?
        ORDER BY a.category, a.name`,
        [userId],
      );

      res.json(achievements);
    } finally {
      if (connection) {
        connection.release();
      }
    }
  } catch (error) {
    console.error("Get achievements error:", error);
    res.status(500).json({ error: "Failed to fetch achievements" });
  }
};

export const handleGetUserStatistics: RequestHandler = async (
  req: AuthRequest,
  res,
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Return default stats for admin user without database
    if (userId === 1) {
      return res.json({
        stat_id: 1,
        user_id: 1,
        total_goals: 0,
        completed_goals: 0,
        total_points: 0,
        current_streak: 0,
        longest_streak: 0,
        total_saved_amount: 0,
        last_calculated_at: new Date().toISOString(),
      });
    }

    let connection;
    try {
      connection = await pool.getConnection();

      const [stats] = await connection.execute(
        `SELECT * FROM user_statistics WHERE user_id = ?`,
        [userId],
      );

      const statRecord = (stats as any[])[0];
      if (!statRecord) {
        // Create default stats if not exists
        await connection.execute(
          "INSERT INTO user_statistics (user_id) VALUES (?)",
          [userId],
        );

        const [newStats] = await connection.execute(
          "SELECT * FROM user_statistics WHERE user_id = ?",
          [userId],
        );

        return res.json((newStats as any[])[0]);
      }

      res.json(statRecord);
    } finally {
      if (connection) {
        connection.release();
      }
    }
  } catch (error) {
    console.error("Get user statistics error:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
};

export const handleUpdateUserStatistics: RequestHandler = async (
  req: AuthRequest,
  res,
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Return success for admin user without database
    if (userId === 1) {
      return res.json({ message: "Statistics updated successfully" });
    }

    let connection;
    try {
      connection = await pool.getConnection();

      // Recalculate statistics from data
      const [goals] = await connection.execute(
        "SELECT COUNT(*) as total, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed FROM goals WHERE user_id = ?",
        [userId],
      );

      const goalStats = (goals as any[])[0];
      const totalGoals = goalStats.total || 0;
      const completedGoals = goalStats.completed || 0;

      const [achievements] = await connection.execute(
        "SELECT COUNT(*) * 10 as total_points FROM user_achievements WHERE user_id = ?",
        [userId],
      );

      const achievementStats = (achievements as any[])[0];
      const totalPoints = achievementStats.total_points || 0;

      const [transactions] = await connection.execute(
        "SELECT COALESCE(SUM(amount), 0) as total FROM financial_transactions WHERE user_id = ? AND transaction_type = 'deposit'",
        [userId],
      );

      const transactionStats = (transactions as any[])[0];
      const totalSaved = transactionStats.total || 0;

      // Update stats
      await connection.execute(
        `UPDATE user_statistics
         SET total_goals = ?,
             completed_goals = ?,
             total_points = ?,
             total_saved_amount = ?
         WHERE user_id = ?`,
        [totalGoals, completedGoals, totalPoints, totalSaved, userId],
      );

      res.json({ message: "Statistics updated successfully" });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  } catch (error) {
    console.error("Update user statistics error:", error);
    res.status(500).json({ error: "Failed to update statistics" });
  }
};

export const handleCheckAndUnlockAchievements: RequestHandler = async (
  req: AuthRequest,
  res,
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Return success for admin user without database
    if (userId === 1) {
      return res.json({
        unlockedAchievements: [],
        message: "Unlocked 0 new achievements",
      });
    }

    let connection;
    try {
      connection = await pool.getConnection();

      // Check for achievement conditions
      const [goals] = await connection.execute(
        "SELECT COUNT(*) as total FROM goals WHERE user_id = ?",
        [userId],
      );

      const [completedGoals] = await connection.execute(
        "SELECT COUNT(*) as total FROM goals WHERE user_id = ? AND status = 'completed'",
        [userId],
      );

      const [financialGoals] = await connection.execute(
        "SELECT COUNT(*) as total FROM goals WHERE user_id = ? AND is_financial = 1 AND status = 'completed'",
        [userId],
      );

      const totalGoals = (goals as any[])[0].total;
      const completedCount = (completedGoals as any[])[0].total;
      const financialCount = (financialGoals as any[])[0].total;

      const achievementsToCheck = [
        { code: "first_goal", condition: totalGoals >= 1 },
        { code: "goal_master", condition: completedCount >= 10 },
        { code: "financial_saver", condition: financialCount >= 1 },
        { code: "ambitious", condition: totalGoals >= 5 },
      ];

      const unlockedAchievements = [];

      for (const achievement of achievementsToCheck) {
        if (achievement.condition) {
          // Check if already unlocked
          const [existing] = await connection.execute(
            `SELECT user_achievement_id FROM user_achievements
             WHERE user_id = ? AND achievement_id = (SELECT achievement_id FROM achievements WHERE code = ?)`,
            [userId, achievement.code],
          );

          if ((existing as any[]).length === 0) {
            // Unlock achievement
            const [achievementData] = await connection.execute(
              "SELECT achievement_id FROM achievements WHERE code = ?",
              [achievement.code],
            );

            const achievementId = (achievementData as any[])[0]?.achievement_id;
            if (achievementId) {
              await connection.execute(
                "INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)",
                [userId, achievementId],
              );

              unlockedAchievements.push(achievement.code);
            }
          }
        }
      }

      res.json({
        unlockedAchievements,
        message: `Unlocked ${unlockedAchievements.length} new achievements`,
      });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  } catch (error) {
    console.error("Check achievements error:", error);
    res.status(500).json({ error: "Failed to check achievements" });
  }
};
