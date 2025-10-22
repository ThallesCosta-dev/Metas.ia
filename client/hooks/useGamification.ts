import { useState, useEffect } from "react";
import { Goal } from "@shared/api";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface GameStats {
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  totalCompleted: number;
  level: number;
  achievements: Achievement[];
}

const GAMIFICATION_KEY = "gamification_stats";

const defaultAchievements: Achievement[] = [
  {
    id: "first_goal",
    name: "Goal Setter",
    description: "Create your first goal",
    icon: "🎯",
    unlocked: false,
  },
  {
    id: "first_completion",
    name: "Goal Achiever",
    description: "Complete your first goal",
    icon: "✅",
    unlocked: false,
  },
  {
    id: "five_goals",
    name: "Ambitious",
    description: "Create 5 goals",
    icon: "🚀",
    unlocked: false,
  },
  {
    id: "five_completed",
    name: "Productive",
    description: "Complete 5 goals",
    icon: "💪",
    unlocked: false,
  },
  {
    id: "financial_master",
    name: "Financial Master",
    description: "Create a financial goal and track it",
    icon: "💰",
    unlocked: false,
  },
  {
    id: "seven_day_streak",
    name: "On Fire",
    description: "Maintain a 7-day completion streak",
    icon: "🔥",
    unlocked: false,
  },
  {
    id: "thirty_day_streak",
    name: "Unstoppable",
    description: "Maintain a 30-day completion streak",
    icon: "⚡",
    unlocked: false,
  },
  {
    id: "all_categories",
    name: "Polymath",
    description: "Create goals in all categories",
    icon: "🌟",
    unlocked: false,
  },
];

export function useGamification(goals: Goal[]) {
  const [stats, setStats] = useState<GameStats>({
    totalPoints: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalCompleted: 0,
    level: 1,
    achievements: defaultAchievements,
  });

  useEffect(() => {
    const stored = localStorage.getItem(GAMIFICATION_KEY);
    if (stored) {
      try {
        setStats(JSON.parse(stored));
      } catch (error) {
        console.error("Failed to parse gamification stats:", error);
      }
    }
  }, []);

  const calculateStats = (goalsList: Goal[]) => {
    const completed = goalsList.filter((g) => g.status === "completed");
    const totalPoints = completed.length * 100 + goalsList.length * 10;
    const level = Math.floor(totalPoints / 500) + 1;

    // Calculate streaks
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split("T")[0];

      const completedOnDate = goalsList.filter((g) => {
        if (!g.completedAt) return false;
        return g.completedAt.split("T")[0] === dateStr;
      }).length > 0;

      if (completedOnDate) {
        tempStreak++;
        if (i === 0) currentStreak = tempStreak;
      } else {
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
        tempStreak = 0;
      }
    }

    // Check achievements
    const achievements = defaultAchievements.map((achievement) => {
      let shouldUnlock = false;

      if (achievement.id === "first_goal" && goalsList.length > 0) {
        shouldUnlock = true;
      } else if (achievement.id === "first_completion" && completed.length > 0) {
        shouldUnlock = true;
      } else if (achievement.id === "five_goals" && goalsList.length >= 5) {
        shouldUnlock = true;
      } else if (achievement.id === "five_completed" && completed.length >= 5) {
        shouldUnlock = true;
      } else if (
        achievement.id === "financial_master" &&
        goalsList.some((g) => g.type === "financial" && g.status === "completed")
      ) {
        shouldUnlock = true;
      } else if (achievement.id === "seven_day_streak" && currentStreak >= 7) {
        shouldUnlock = true;
      } else if (achievement.id === "thirty_day_streak" && currentStreak >= 30) {
        shouldUnlock = true;
      } else if (achievement.id === "all_categories") {
        const categories = new Set(goalsList.map((g) => g.category));
        shouldUnlock = categories.size === 8;
      }

      return {
        ...achievement,
        unlocked: achievement.unlocked || shouldUnlock,
        unlockedAt:
          achievement.unlocked && !achievement.unlockedAt
            ? achievement.unlockedAt
            : shouldUnlock && !achievement.unlocked
            ? new Date().toISOString()
            : achievement.unlockedAt,
      };
    });

    const newStats: GameStats = {
      totalPoints,
      currentStreak,
      longestStreak,
      totalCompleted: completed.length,
      level,
      achievements,
    };

    setStats(newStats);
    localStorage.setItem(GAMIFICATION_KEY, JSON.stringify(newStats));
  };

  useEffect(() => {
    calculateStats(goals);
  }, [goals]);

  return stats;
}
