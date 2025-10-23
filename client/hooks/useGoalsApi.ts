import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Goal,
  GoalStatus,
  GoalCategory,
  PriorityLevel,
  Currency,
} from "@shared/api";

export function useGoalsApi() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getHeaders = useCallback(() => {
    const token = getToken();
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, [getToken]);

  const handleError = useCallback((response: Response) => {
    if (response.status === 401) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      window.location.href = "/login";
      throw new Error("Session expired. Redirecting to login.");
    }
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
  }, []);

  const getGoals = useCallback(async (): Promise<Goal[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/goals", {
        method: "GET",
        headers: getHeaders(),
      });

      handleError(response);
      const data = await response.json();
      return data || [];
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch goals";
      setError(message);
      console.error("getGoals error:", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [getHeaders, handleError]);

  const getGoal = useCallback(
    async (goalId: number | string): Promise<Goal | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/goals/${goalId}`, {
          method: "GET",
          headers: getHeaders(),
        });

        handleError(response);
        const data = await response.json();
        return data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch goal";
        setError(message);
        console.error("getGoal error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [getHeaders, handleError],
  );

  const createGoal = useCallback(
    async (goalData: {
      title: string;
      description: string;
      category: GoalCategory;
      priority: PriorityLevel;
      start_date: string;
      due_date: string;
      is_financial: boolean;
      target_value?: number;
      currency?: Currency;
    }): Promise<{ goalId: number } | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/goals", {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(goalData),
        });

        handleError(response);
        const data = await response.json();
        return data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create goal";
        setError(message);
        console.error("createGoal error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [getHeaders, handleError],
  );

  const updateGoal = useCallback(
    async (
      goalId: number | string,
      updates: Partial<{
        title: string;
        description: string;
        category: GoalCategory;
        priority: PriorityLevel;
        status: GoalStatus;
        start_date: string;
        due_date: string;
        target_value: number;
        current_value: number;
        progress_percentage: number;
      }>,
    ): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/goals/${goalId}`, {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify(updates),
        });

        handleError(response);
        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update goal";
        setError(message);
        console.error("updateGoal error:", err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [getHeaders, handleError],
  );

  const deleteGoal = useCallback(
    async (goalId: number | string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/goals/${goalId}`, {
          method: "DELETE",
          headers: getHeaders(),
        });

        handleError(response);
        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to delete goal";
        setError(message);
        console.error("deleteGoal error:", err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [getHeaders, handleError],
  );

  return {
    getGoals,
    getGoal,
    createGoal,
    updateGoal,
    deleteGoal,
    loading,
    error,
  };
}
