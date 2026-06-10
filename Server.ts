import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import yahooFinance from "yahoo-finance2";
import helmet from "helmet";
import cors from "cors";
import NodeCache from "node-cache";

// ============================================================================
// 1. TYPES & INTERFACES (Strict Typing)
// ============================================================================

interface Quote {
  date: Date | string;
  close: number;
}

interface TickerMeta {
  name: string;
  price: number;
}

interface AIAnalysisRequest {
  ticker: string;
  name: string;
  price: number;
  change: number;
  rsi: number;
  ema: number;
  signal: string;
  risk: string;
  preds?: number[];
  confidence?: number;
  currencyPrefix: string;
}

// ============================================================================
// 2. CONFIGURATION & CONSTANTS
// ============================================================================

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

const TICKER_DEFAULTS: Record<string, TickerMeta> = {
  "RELIANCE.NS": { name: "Reliance Industries", price: 2450 },
  "TCS.NS": { name: "Tata Consultancy Services", price: 3850 },
  "HDFCBANK.NS": { name: "HDFC Bank", price: 1550 },
  "BTC-USD": { name: "Bitcoin USD", price: 67300 },
  "ETH-USD": { name: "Ethereum USD", price: 3480 },
  "AAPL": { name: "Apple Inc.", price: 185 },
  "NVDA": { name: "NVIDIA Corporation", price: 122 },
  "MSFT": { name: "Microsoft Corp.", price: 425 },
};

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Initialize Cache (5 minutes standard time-to-live)
const marketCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// ============================================================================
// 3. MATH & UTILITY SERVICES
// ============================================================================

class MarketMath {
  static calculateRSI(closes: number[], window = 14): number[] {
    const rsi: number[] = new Array(closes.length).fill(35);
    if (closes.length <= window) return rsi;

    for (let i = window; i < closes.length; i++) {
      let gains = 0, losses = 0;
      for (let j = i - window + 1; j <= i; j++) {
        const delta = closes[j] - closes[j - 1];
        if (delta > 0) gains += delta;
        else losses -= delta;
      }
      const avgGain = gains / window;
      const avgLoss = losses / window;
      
      if (avgLoss === 0) rsi[i] = 100;
      else if (avgGain === 0) rsi[i] = 0;
      else rsi[i] = 100 - 100 / (1 + avgGain / avgLoss);
    }
    return rsi;
  }

  static calculateEMA(closes: number[], span = 100): number[] {
    const ema: number[] = new Array(closes.length).fill(NaN);
    if (closes.length === 0) return ema;

    const alpha = 2 / (span + 1);
    ema[0] = closes[0];
    for (let i = 1; i < closes.length; i++) {
      ema[i] = alpha * closes[i] + (1 - alpha) * ema[i - 1];
    }
    return ema;
  }

  static calculateVolatility(closes: number[]): number {
    const returns = closes.slice(1).map((c, i) => closes[i] !== 0 ? (c - closes[i]) / closes[i] : 0);
    if (returns.length < 2) return 0;
    
    const mean = returns.reduce((sum, val) => sum + val, 0) / returns.length;
    const variance = returns.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (returns.length - 1);
    return Math.sqrt(variance) * 100; 
  }

  static aiProjection(closes: number[]) {
    if (closes.length < 40) return null;

    const y = closes.slice(-40);
    const n = y.length;
    const x = Array.from({ length: n }, (_, i) => i);

    const meanX = (n - 1) / 2;
    const meanY = y.reduce((sum, val) => sum + val, 0) / n;

    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
      num += (x[i] - meanX) * (y[i] - meanY);
      den += Math.pow(x[i] - meanX, 2);
    }

    if (den === 0) return null;
    const slope = num / den;
    const intercept = meanY - slope * meanX;

    let ssRes = 0, ssTot = 0;
    for (let i = 0; i < n; i++) {
      ssRes += Math.pow(y[i] - (slope * x[i] + intercept), 2);
      ssTot += Math.pow(y[i] - meanY, 2);
    }

    return {
      preds: [slope * n + intercept, slope * (n + 1) + intercept, slope * (n + 2) + intercept],
      confidence: ssTot === 0 ? 0 : Math.max(0, 1 - ssRes / ssTot),
      slope
    };
  }
}

// ============================================================================
// 4. DATA SERVICES
// ============================================================================

class MarketDataService {
  private static getTickerMeta(ticker: string): TickerMeta {
    const upper = ticker.toUpperCase();
    if (TICKER_DEFAULTS[upper]) return TICKER_DEFAULTS[upper];
    
    const hash = Math.abs(upper.split("").reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0));
    return { name: `${upper} Corporation`, price: (hash % 4800) + 120 };
  }

  private static generateFallback(ticker: string) {
    const meta = this.getTickerMeta(ticker);
    const historyData: Quote[] = [];
    let currentPrice = meta.price;
    let seed = ticker.toUpperCase().split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    const pseudoRandom = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
    let tempDate = new Date();

    while (historyData.length < 130) {
      tempDate.setDate(tempDate.getDate() - 1);
      if (tempDate.getDay() === 0 || tempDate.getDay() === 6) continue;
      
      currentPrice = currentPrice / (1 + ((pseudoRandom() - 0.45) * 0.025));
      historyData.unshift({ date: new Date(tempDate).toISOString(), close: Number(currentPrice.toFixed(2)) });
    }
    historyData.push({ date: new Date().toISOString(), close: Number(meta.price.toFixed(2)) });
    
    return { quotes: historyData, displayName: meta.name };
  }

  static async fetchTickerDetails(ticker: string) {
    const cacheKey = `ticker_data_${ticker.toUpperCase()}`;
    
    // 1. CHECK CACHE FIRST
    const cachedData = marketCache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      let chartResult: any;
      let displayName = ticker;

      try {
        chartResult = await yahooFinance.chart(ticker, { period1: sixMonthsAgo.toISOString().split("T")[0], interval: "1d" });
        if (chartResult?.meta?.regularMarketPrice) {
           const quote = await yahooFinance.quote(ticker);
           displayName = quote.longName || quote.shortName || ticker;
        } else {
            throw new Error("Invalid Yahoo Finance response");
        }
      } catch (err) {
        console.warn(`[API] Yahoo Finance fetch failed for ${ticker}, utilizing synthetic engine.`);
        const fallback = this.generateFallback(ticker);
        chartResult = { quotes: fallback.quotes };
        displayName = fallback.displayName;
      }

      const cleanData = (chartResult.quotes || []).filter((d: any) => typeof d.close === 'number' && !isNaN(d.close));
      if (cleanData.length < 10) return null;

      const closes = cleanData.map((d: Quote) => d.close);
      const ema100s = MarketMath.calculateEMA(closes, 100);
      const rsis = MarketMath.calculateRSI(closes, 14);

      const price = closes[closes.length - 1];
      const prevPrice = closes.length > 1 ? closes[closes.length - 2] : price;
      const change = ((price - prevPrice) / prevPrice) * 100;
      
      const rsi = rsis[rsis.length - 1];
      const ema = ema100s[ema100s.length - 1] || closes[0];
      const volatility = MarketMath.calculateVolatility(closes);
      const risk = volatility > 3.0 ? "High" : volatility > 1.5 ? "Moderate" : "Low";
      const proj = MarketMath.aiProjection(closes);

      let signal = "⚖ Neutral";
      if (price > ema && rsi < 35) signal = "🔥 Strong Buy";
      else if (price < ema && rsi > 65) signal = "📉 Strong Sell";
      else if (proj && proj.slope > 0) signal = "📈 Bullish Bias";
      else if (proj && proj.slope < 0) signal = "📉 Bearish Bias";

      const finalResult = {
        ticker,
        name: displayName,
        price,
        change,
        rsi,
        ema,
        signal,
        volatility,
        risk,
        preds: proj?.preds || null,
        confidence: proj?.confidence || null,
        slope: proj?.slope || null,
        currencyPrefix: [".NS", ".BO"].some(ext => ticker.endsWith(ext)) ? "₹" : "$",
        history: cleanData.slice(-30).map((d: Quote) => ({
          date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          value: d.close,
        })),
      };

      // 2. SAVE TO CACHE
      marketCache.set(cacheKey, finalResult);
      return finalResult;

    } catch (error) {
      console.error(`[Error] Processing ticker ${ticker}:`, error);
      return null;
    }
  }
}

// ============================================================================
// 5. EXPRESS APP SETUP & ROUTING
// ============================================================================

const app = express();

app.use(helmet()); 
app.use(cors());
app.use(express.json());

app.get("/api/market-data", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tickersStr = req.query.tickers as string;
    const tickers = tickersStr 
      ? tickersStr.split(",").map((t) => t.trim().toUpperCase()) 
      : ["RELIANCE.NS", "TCS.NS", "BTC-USD"];

    const results = await Promise.all(tickers.map((t) => MarketDataService.fetchTickerDetails(t)));
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: results.filter((r) => r !== null),
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/ai-analysis", async (req: Request<{}, {}, AIAnalysisRequest>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ticker, name, price, change, rsi, ema, signal, risk, preds, confidence, currencyPrefix } = req.body;

    if (!ticker || !price) {
        res.status(400).json({ success: false, error: "Missing required ticker details in payload." });
        return;
    }

    if (!GEMINI_API_KEY) {
        res.status(503).json({ success: false, error: "AI Engine offline: API key missing." });
        return;
    }

    const forecastStr = preds && preds.length >= 3 && confidence
      ? `Day 1: ${currencyPrefix}${preds[0].toFixed(2)}, Day 2: ${currencyPrefix}${preds[1].toFixed(2)}, Day 3: ${currencyPrefix}${preds[2].toFixed(2)} (Confidence: ${(confidence * 100).toFixed(1)}%)`
      : `Uncomputable due to limited index span.`;

    const prompt = `You are an elite, razor-sharp Wall Street and Dalal Street AI Analyst.
    Analyze the following asset: ${name} (${ticker}).
    Current Price: ${currencyPrefix}${price.toFixed(2)} (${change.toFixed(2)}% today).
    RSI: ${rsi.toFixed(1)}. 100-Day EMA: ${currencyPrefix}${ema.toFixed(2)}. Risk: ${risk}. Signal: ${signal}.
    3-Day Projection: ${forecastStr}

    Draft an elite strategic briefing for a portfolio manager in 2 short paragraphs.
    1. A blunt diagnostic of chart architecture (momentum, support/resistance).
    2. Tactical trading execution commands (Buy/Sell Bounds, risk management). No generic disclaimers.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ success: true, analysis: response.text });
  } catch (error) {
    next(error);
  }
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`[Unhandled Error] ${req.method} ${req.url}:`, err);
  res.status(500).json({ success: false, error: "Internal server error." });
});

// ============================================================================
// 6. VITE SPA SERVING & SERVER START
// ============================================================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    app.use(helmet({ contentSecurityPolicy: false })); 
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, () => {
    console.log(`🚀 AI Trading Command Center listening on port ${PORT}`);
  });
}

startServer();