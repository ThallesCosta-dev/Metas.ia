import { RequestHandler } from "express";

// Mock exchange rates (in production, these would come from a real API)
// Using rates as of a specific date for consistency
const exchangeRates: Record<string, number> = {
  "USD-USD": 1,
  "USD-BRL": 5.15,
  "USD-EUR": 0.92,
  "BRL-USD": 0.194,
  "BRL-BRL": 1,
  "BRL-EUR": 0.179,
  "EUR-USD": 1.09,
  "EUR-BRL": 5.61,
  "EUR-EUR": 1,
};

export interface ConvertCurrencyRequest {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
}

export interface ConvertCurrencyResponse {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  convertedAmount: number;
  rate: number;
  timestamp: string;
}

export const handleCurrencyConversion: RequestHandler = (req, res) => {
  try {
    const { amount, fromCurrency, toCurrency } = req.query as unknown as ConvertCurrencyRequest;

    if (!amount || !fromCurrency || !toCurrency) {
      return res.status(400).json({
        error: "Missing required parameters: amount, fromCurrency, toCurrency",
      });
    }

    const rateKey = `${fromCurrency}-${toCurrency}`;
    const rate = exchangeRates[rateKey];

    if (!rate) {
      return res.status(400).json({
        error: `Unsupported currency pair: ${rateKey}`,
      });
    }

    const numAmount = parseFloat(amount as unknown as string);
    const convertedAmount = numAmount * rate;

    const response: ConvertCurrencyResponse = {
      amount: numAmount,
      fromCurrency,
      toCurrency,
      convertedAmount: Math.round(convertedAmount * 100) / 100,
      rate,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetExchangeRates: RequestHandler = (req, res) => {
  const rates = {
    base: "USD",
    rates: {
      USD: 1,
      BRL: 5.15,
      EUR: 0.92,
    },
    timestamp: new Date().toISOString(),
  };
  res.json(rates);
};
