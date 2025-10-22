import { useState, useEffect } from "react";
import { Goal, GoalStats } from "@shared/api";
import { v4 as uuidv4 } from "crypto";

const STORAGE_KEY = "goals";

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [stats, setStats] = useState<GoalStats>({
    totalGoals: 0,
    completedGoals: 0,
    inProgressGoals: 0,
    delayedGoals: 0,
    completionRate: 0,
    avgDaysToComplete: 0,
  });

  // Load goals from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setGoals(parsed);
        calculateStats(parsed);
      } catch (error) {
        console.error("Failed to parse stored goals:", error);
      }
    }
  }, []);

  // Calculate statistics
  const calculateStats = (goalsList: Goal[]) => {
    const completed = goalsList.filter((g) => g.status === "completed").length;
    const inProgress = goalsList.filter((g) => g.status === "in_progress").length;
    const delayed = goalsList.filter((g) => g.status === "delayed").length;
    const notStarted = goalsList.filter((g) => g.status === "not_started").length;

    const completionRate =
      goalsList.length > 0 ? Math.round((completed / goalsList.length) * 100) : 0;

    const completedGoals = goalsList.filter((g) => g.completedAt);
    const avgDaysToComplete =
      completedGoals.length > 0
        ? Math.round(
            completedGoals.reduce((sum, g) => {
              const start = new Date(g.startDate).getTime();
              const end = new Date(g.completedAt!).getTime();
              return sum + (end - start) / (1000 * 60 * 60 * 24);
            }, 0) / completedGoals.length
          )
        : 0;

    setStats({
      totalGoals: goalsList.length,
      completedGoals: completed,
      inProgressGoals: inProgress,
      delayedGoals: delayed,
      completionRate,
      avgDaysToComplete,
    });
  };

  const addGoal = (goal: Omit<Goal, "id" | "createdAt" | "updatedAt">) => {
    const newGoal: Goal = {
      ...goal,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [...goals, newGoal];
    setGoals(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    calculateStats(updated);
    return newGoal;
  };

  const updateGoal = (id: string, updates: Partial<Goal>) => {
    const updated = goals.map((g) =>
      g.id === id
        ? {
            ...g,
            ...updates,
            updatedAt: new Date().toISOString(),
          }
        : g
    );
    setGoals(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    calculateStats(updated);
  };

  const deleteGoal = (id: string) => {
    const updated = goals.filter((g) => g.id !== id);
    setGoals(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    calculateStats(updated);
  };

  return {
    goals,
    stats,
    addGoal,
    updateGoal,
    deleteGoal,
  };
}
