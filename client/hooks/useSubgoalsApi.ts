import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Subgoal, GoalStatus } from "@shared/api";

export function useSubgoalsApi() {
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
      throw new Error("Session expired");
    }
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
  }, []);

  const getSubgoals = useCallback(
    async (goalId: number | string): Promise<Subgoal[]> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/goals/${goalId}/subgoals`, {
          method: "GET",
          headers: getHeaders(),
        });

        handleError(response);
        const data = await response.json();
        return data || [];
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch subgoals";
        setError(message);
        console.error("getSubgoals error:", err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [getHeaders, handleError],
  );

  const createSubgoal = useCallback(
    async (
      goalId: number | string,
      subgoalData: {
        title: string;
        description?: string;
        due_date: string;
        target_value?: number;
        depends_on_subgoal_id?: number;
      },
    ): Promise<{ subgoalId: number } | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/goals/${goalId}/subgoals`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(subgoalData),
        });

        handleError(response);
        const data = await response.json();
        return data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create subgoal";
        setError(message);
        console.error("createSubgoal error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [getHeaders, handleError],
  );

  const updateSubgoal = useCallback(
    async (
      goalId: number | string,
      subgoalId: number | string,
      updates: Partial<{
        title: string;
        description: string;
        status: GoalStatus;
        due_date: string;
        current_value: number;
      }>,
    ): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/goals/${goalId}/subgoals/${subgoalId}`,
          {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify(updates),
          },
        );

        handleError(response);
        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update subgoal";
        setError(message);
        console.error("updateSubgoal error:", err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [getHeaders, handleError],
  );

  const deleteSubgoal = useCallback(
    async (
      goalId: number | string,
      subgoalId: number | string,
    ): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/goals/${goalId}/subgoals/${subgoalId}`,
          {
            method: "DELETE",
            headers: getHeaders(),
          },
        );

        handleError(response);
        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to delete subgoal";
        setError(message);
        console.error("deleteSubgoal error:", err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [getHeaders, handleError],
  );

  return {
    getSubgoals,
    createSubgoal,
    updateSubgoal,
    deleteSubgoal,
    loading,
    error,
  };
}
