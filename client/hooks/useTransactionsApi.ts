import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Currency } from "@shared/api";

export interface FinancialTransaction {
  transaction_id: number;
  goal_id: number;
  user_id: number;
  amount: number;
  currency: Currency;
  converted_amount: number;
  conversion_rate: number;
  transaction_type: "deposit" | "withdrawal" | "adjustment";
  description?: string;
  transaction_date: string;
  created_at: string;
}

export function useTransactionsApi() {
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

  const getTransactions = useCallback(
    async (goalId: number | string): Promise<FinancialTransaction[]> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/goals/${goalId}/transactions`, {
          method: "GET",
          headers: getHeaders(),
        });

        handleError(response);
        const data = await response.json();
        return data || [];
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch transactions";
        setError(message);
        console.error("getTransactions error:", err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [getHeaders, handleError],
  );

  const addTransaction = useCallback(
    async (
      goalId: number | string,
      transactionData: {
        amount: number;
        currency: Currency;
        transaction_type: "deposit" | "withdrawal" | "adjustment";
        description?: string;
        transaction_date?: string;
      },
    ): Promise<{ transactionId: number } | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/goals/${goalId}/transactions`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(transactionData),
        });

        handleError(response);
        const data = await response.json();
        return data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to add transaction";
        setError(message);
        console.error("addTransaction error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [getHeaders, handleError],
  );

  const getCurrencyRates = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/currency/rates", {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch currency rates";
      setError(message);
      console.error("getCurrencyRates error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    getTransactions,
    addTransaction,
    getCurrencyRates,
    loading,
    error,
  };
}
