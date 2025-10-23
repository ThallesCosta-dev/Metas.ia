import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Achievement, GameStats } from "@/hooks/useGamification";

export function useAchievementsApi() {
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

  const getAchievements = useCallback(async (): Promise<Achievement[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/achievements", {
        method: "GET",
        headers: getHeaders(),
      });

      handleError(response);
      const data = await response.json();
      return data || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch achievements";
      setError(message);
      console.error("getAchievements error:", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [getHeaders, handleError]);

  const checkAndUnlockAchievements = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/achievements/check", {
        method: "POST",
        headers: getHeaders(),
      });

      handleError(response);
      const data = await response.json();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to check achievements";
      setError(message);
      console.error("checkAndUnlockAchievements error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [getHeaders, handleError]);

  const getUserStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/statistics", {
        method: "GET",
        headers: getHeaders(),
      });

      handleError(response);
      const data = await response.json();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch statistics";
      setError(message);
      console.error("getUserStatistics error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [getHeaders, handleError]);

  const updateUserStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/statistics/update", {
        method: "POST",
        headers: getHeaders(),
      });

      handleError(response);
      const data = await response.json();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update statistics";
      setError(message);
      console.error("updateUserStatistics error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [getHeaders, handleError]);

  return {
    getAchievements,
    checkAndUnlockAchievements,
    getUserStatistics,
    updateUserStatistics,
    loading,
    error,
  };
}
