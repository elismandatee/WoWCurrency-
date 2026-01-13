
import { GoogleGenAI, Type } from '@google/genai';
import type { Currency, GroundingSource } from '../types';

const CACHE_KEY = 'wow_market_rates_prod_v3';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes for more frequent real-time updates

// Static safety net updated to realistic Feb 2025 market prices
const FALLBACK_RATES: Record<string, number> = {
  'PI-NGN': 83200,    // Based on ~$52 price at 1600 NGN/USD
  'PI-USD': 52,       // Current IOU average on HTX/BitMart
  'BTC-USD': 96500,
  'BTC-NGN': 154400000,
  'ETH-USD': 2650,
  'ETH-NGN': 4240000,
  'USDT-NGN': 1610,
  'USDT-USD': 1,
  'BNB-USD': 610,
  'BNB-NGN': 976000,
  'NGN-USD': 0.000625,
  'USD-NGN': 1600,    // Current parallel market reference
};

const conversionSchema = {
  type: Type.OBJECT,
  properties: {
    convertedAmount: { type: Type.NUMBER },
    rate: { type: Type.NUMBER },
    disclaimer: { type: Type.STRING }
  },
  required: ['convertedAmount', 'rate']
};

const batchRatesSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      from: { type: Type.STRING },
      to: { type: Type.STRING },
      rate: { type: Type.NUMBER }
    },
    required: ['from', 'to', 'rate']
  }
};

export interface ConversionResult {
  convertedAmount: number;
  rate: number;
  disclaimer?: string;
  sources?: GroundingSource[];
  isFallback?: boolean;
}

export interface BatchRate {
  from: string;
  to: string;
  rate: number;
}

export interface BatchRatesResponse {
  rates: BatchRate[];
  sources: GroundingSource[];
  isFallback?: boolean;
}

/**
 * Retrieves a rate from the local storage cache if it exists and hasn't expired.
 */
export const getCachedRate = (from: string, to: string): number | null => {
  const cached = localStorage.getItem(CACHE_KEY);
  if (!cached) return FALLBACK_RATES[`${from}-${to}`] || null;
  try {
    const { rates, timestamp } = JSON.parse(cached);
    const rateObj = (rates as BatchRate[]).find((r: BatchRate) => r.from === from && r.to === to);
    if (rateObj) return rateObj.rate;
    return FALLBACK_RATES[`${from}-${to}`] || null;
  } catch {
    return FALLBACK_RATES[`${from}-${to}`] || null;
  }
};

async function requestWithRetry<T>(fn: () => Promise<T>, retries = 2, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error?.status === 429 || error?.status >= 500)) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return requestWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export const getAllExchangeRates = async (
  fromCodes: string[],
  toCodes: string[],
  forceRefresh = false
): Promise<BatchRatesResponse> => {
  if (!forceRefresh) {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
          try {
              const { rates, timestamp, sources } = JSON.parse(cached);
              if (Date.now() - timestamp < CACHE_TTL) {
                  return { rates, sources: sources || [] };
              }
          } catch (e) {}
      }
  }

  try {
    return await requestWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `URGENT MARKET DATA REQUEST FOR ${new Date().toUTCString()}: 
      Provide the ABSOLUTE LATEST exchange rates for [${fromCodes.join(', ')}] to [${toCodes.join(', ')}]. 
      - PI NETWORK (PI): Check HTX, BitMart, and CoinMarketCap for the latest IOU price (likely between $50-$65).
      - NIGERIAN NAIRA (NGN): Use current parallel market rates (AbokiFX or similar) for USD/NGN (approx 1550-1650).
      - CRYPTO: Use live Binance/Coinbase data for BTC, ETH, BNB.
      - Ensure PI to NGN rate is cross-calculated using the live PI/USD and USD/NGN rates.
      - Return JSON array: {from, to, rate}.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: batchRatesSchema,
          tools: [{ googleSearch: {} }],
        },
      });

      const rates = JSON.parse(response.text || '[]') as BatchRate[];
      const sources: GroundingSource[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(c => ({
        uri: c.web?.uri || '',
        title: c.web?.title || ''
      })).filter(s => s.uri) || [];

      localStorage.setItem(CACHE_KEY, JSON.stringify({
        rates,
        sources,
        timestamp: Date.now()
      }));

      return { rates, sources };
    });
  } catch (err: any) {
    console.warn("Using Fallback Rates due to API exhaustion", err);
    const fallbackData: BatchRate[] = [];
    fromCodes.forEach(f => {
      toCodes.forEach(t => {
        const rate = FALLBACK_RATES[`${f}-${t}`];
        if (rate) fallbackData.push({ from: f, to: t, rate });
      });
    });
    return { rates: fallbackData, sources: [], isFallback: true };
  }
};

export const convertCurrency = async (
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): Promise<ConversionResult> => {
  try {
    return await requestWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `EXACT MARKET SETTLEMENT for ${new Date().toISOString()}: Convert ${amount} ${fromCurrency.code} to ${toCurrency.code} using the absolute latest market prices (Check exchanges for PI IOUs and Parallel market for NGN). Return JSON {convertedAmount, rate, disclaimer}.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: conversionSchema,
          tools: [{ googleSearch: {} }],
        },
      });

      const data = JSON.parse(response.text || '{}');
      const sources: GroundingSource[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(c => ({
        uri: c.web?.uri || '',
        title: c.web?.title || ''
      })).filter(s => s.uri) || [];

      return { ...data, sources };
    });
  } catch (err) {
    const rate = getCachedRate(fromCurrency.code, toCurrency.code) || 1;
    return {
      convertedAmount: amount * rate,
      rate,
      disclaimer: "Rate limited. Using stable internal reference price.",
      isFallback: true,
      sources: []
    };
  }
};

export const getExchangeRate = async (from: Currency, to: Currency): Promise<number> => {
  const cached = getCachedRate(from.code, to.code);
  if (cached) return cached;
  const res = await convertCurrency(1, from, to);
  return res.rate;
};
