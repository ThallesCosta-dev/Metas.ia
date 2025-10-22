import { useState, useCallback } from "react";
import { Currency } from "@shared/api";

export interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
}

export function useCurrencyConversion() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const convertCurrency = useCallback(
    async (
      amount: number,
      fromCurrency: Currency,
      toCurrency: Currency
    ): Promise<number | null> => {
      if (fromCurrency === toCurrency) {
        return amount;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/currency/convert?amount=${amount}&fromCurrency=${fromCurrency}&toCurrency=${toCurrency}`
        );

        if (!response.ok) {
          throw new Error("Failed to convert currency");
        }

        const data = await response.json();
        return data.convertedAmount;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to convert currency";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getExchangeRate = useCallback(
    async (fromCurrency: Currency, toCurrency: Currency): Promise<number | null> => {
      if (fromCurrency === toCurrency) {
        return 1;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/currency/rates");

        if (!response.ok) {
          throw new Error("Failed to fetch exchange rates");
        }

        const data = await response.json();
        const fromRate = data.rates[fromCurrency] || 1;
        const toRate = data.rates[toCurrency] || 1;
        const rate = toRate / fromRate;

        return rate;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch exchange rates";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { convertCurrency, getExchangeRate, loading, error };
}
