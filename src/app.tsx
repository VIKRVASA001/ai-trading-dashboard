/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Sparkles, 
  Trash2, 
  Plus, 
  AlertOctagon, 
  Info, 
  ChevronRight, 
  MessageSquare, 
  Send, 
  X, 
  Gauge, 
  Clock,
  Layers,
  Activity,
  Calculator,
  ShieldCheck,
  Search,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface TickerData {
  ticker: string;
  name: string;
  price: number;
  prevPrice: number;
  high: number;
  low: number;
  change: number;
  rsi: number;
  ema: number;
  signal: string;
  volatility: number;
  risk: string;
  preds: number[] | null;
  confidence: number | null;
  slope: number | null;
  currencyPrefix: string;
  history: Array<{ date: string; value: number }>;
}

interface ChatMessage {
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

// Sparkline SVG Component (Premium Orange/Red & Emerald theme)
function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (!data || data.length < 2) return <div className="text-gray-600 text-xs text-center font-mono">No Data</div>;
  const width = 160;
  const height = 45;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height - 2;
      return `${x},${Math.max(2, y)}`;
    })
    .join(" ");

  const fillPoints = `${points} ${width},${height} 0,${height}`;
  const strokeColor = positive ? "#22C55E" : "#EF4444";
  const fillColorId = `grad-${positive ? "up" : "down"}-${Math.random().toString(36).substr(2, 4)}`;

  return (
    <svg className="w-full h-11 overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={fillColorId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.18" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <polygon points={fillPoints} fill={`url(#${fillColorId})`} />
      <polyline fill="none" stroke={strokeColor} strokeWidth="1.8" points={points} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Panoramic Chart for Side Drawer
function PanoramicChart({ history, preds, currencyPrefix, name }: { 
  history: Array<{ date: string; value: number }>; 
  preds: number[] | null; 
  currencyPrefix: string;
  name: string;
}) {
  if (!history || history.length < 2) return null;

  const width = 600;
  const height = 180;
  
  const histValues = history.map((h) => h.value);
  const allValues = [...histValues, ...(preds || [])];
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const range = max - min || 1;

  const points = histValues
    .map((val, idx) => {
      const x = (idx / (history.length - 1)) * (width * 0.85);
      const y = height - ((val - min) / range) * (height - 30) - 15;
      return { x, y, val, date: history[idx].date };
    });

  const polylineStr = points.map((p) => `${p.x},${p.y}`).join(" ");

  const projPoints: Array<{ x: number; y: number; val: number; label: string }> = [];
  if (preds && preds.length >= 3) {
    const startX = width * 0.85;
    const stepX = (width * 0.15) / 3;
    preds.forEach((predVal, idx) => {
      const x = startX + (idx + 1) * stepX - 10;
      const y = height - ((predVal - min) / range) * (height - 30) - 15;
      projPoints.push({ x, y, val: predVal, label: `Day ${idx + 1}` });
    });
  }

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div className="relative bg-[#1b1c24] border border-[#2d303f] rounded-xl p-5 overflow-hidden">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-xs text-[#a0a5bc] uppercase tracking-wider font-mono font-bold flex items-center gap-1.5">
          <Activity size={12} className="text-[#E21E26]" /> 30-Day Workstation Feed & OLS Forecast
        </h4>
        <div className="flex gap-4 text-[10px] font-mono">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-1 bg-[#22C55E]"></span> History</span>
          {preds && <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 border-t-2 border-dashed border-[#F95738]"></span> Forecast</span>}
        </div>
      </div>

      <div className="relative h-44 w-full">
        <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
            const yCoord = 15 + r * (height - 30);
            const gridVal = max - r * range;
            return (
              <g key={i}>
                <line x1="0" y1={yCoord} x2={width} y2={yCoord} stroke="#2a2e3d" strokeWidth="0.5" strokeDasharray="3 3" />
                <text x="3" y={yCoord - 3} fill="#5e657e" className="text-[9px] font-mono">{currencyPrefix}{gridVal.toLocaleString(undefined, { maximumFractionDigits: 1 })}</text>
              </g>
            );
          })}

          <polygon 
            points={`${polylineStr} ${width * 0.85},${height} 0,${height}`} 
            fill="url(#panoramicFill)" 
          />

          <defs>
            <linearGradient id="panoramicFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22C55E" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#22C55E" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Historical line */}
          <polyline fill="none" stroke="#22C55E" strokeWidth="2.2" points={polylineStr} strokeLinecap="round" />

          {/* Forecast link */}
          {projPoints.length > 0 && (
            <line 
              x1={points[points.length - 1].x} 
              y1={points[points.length - 1].y} 
              x2={projPoints[0].x} 
              y2={projPoints[0].y} 
              stroke="#F95738" 
              strokeWidth="2" 
              strokeDasharray="4 4" 
            />
          )}

          {/* Forecast line */}
          {projPoints.length > 1 && (
            <polyline 
              fill="none" 
              stroke="#F95738" 
              strokeWidth="2" 
              strokeDasharray="4 4" 
              points={projPoints.map((p) => `${p.x},${p.y}`).join(" ")} 
            />
          )}

          {/* Circles */}
          {points.map((p, idx) => (
            <circle
              key={`hist-${idx}`}
              cx={p.x}
              cy={p.y}
              r={hoveredIdx === idx ? 6 : 2}
              fill={hoveredIdx === idx ? "#15803D" : "#22C55E"}
              stroke="#13141b"
              strokeWidth="1.5"
              className="cursor-pointer transition-all duration-150"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          ))}

          {projPoints.map((p, idx) => (
            <g key={`proj-${idx}`}>
              <circle cx={p.x} cy={p.y} r="4.5" fill="#F95738" stroke="#13141b" strokeWidth="1.5" />
              <text x={p.x} y={p.y - 8} fill="#F95738" textAnchor="middle" className="text-[9px] font-mono font-bold">
                {currencyPrefix}{p.val.toFixed(0)}
              </text>
              <text x={p.x} y={height - 4} fill="#8087a3" textAnchor="middle" className="text-[8px] font-mono">
                {p.label}
              </text>
            </g>
          ))}
        </svg>

        {hoveredIdx !== null && points[hoveredIdx] && (
          <div 
            className="absolute bg-[#14151a] border border-[#22C55E]/50 rounded px-2.5 py-1 text-left shadow-2xl pointer-events-none"
            style={{
              left: `${Math.min(width - 120, points[hoveredIdx].x + 10)}px`,
              top: `${Math.min(height - 50, points[hoveredIdx].y - 35)}px`,
            }}
          >
            <p className="text-[9px] text-[#8087a3] font-mono">{points[hoveredIdx].date}</p>
            <p className="text-xs font-mono font-bold text-[#22C55E]">
              {currencyPrefix}{points[hoveredIdx].val.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [tickers, setTickers] = useState<string[]>(() => {
    const saved = localStorage.getItem("vvm-trading-tickers");
    return saved ? JSON.parse(saved) : [
      "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS",
      "SBIN.NS", "BHARTIARTL.NS", "ITC.NS", "KOTAKBANK.NS", "AXISBANK.NS",
      "HINDUNILVR.NS", "LT.NS", "BAJFINANCE.NS", "MARUTI.NS", "SUNPHARMA.NS",
      "TITAN.NS", "TATAMOTORS.NS", "COALINDIA.NS", "ASIANPAINT.NS", "HCLTECH.NS"
    ];
  });

  const [tickerObjects, setTickerObjects] = useState<TickerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshCountdown, setRefreshCountdown] = useState(60);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [newTickerInput, setNewTickerInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // --- VVM PORTFOLIO, BUY/SELL TRADING STATES ---
  const [selectedTradeTicker, setSelectedTradeTicker] = useState<TickerData | null>(null);
  const [tradeType, setTradeType] = useState<"BUY" | "SELL" | null>(null);
  const [tradeOrderMode, setTradeOrderMode] = useState<"MARKET" | "LIMIT" | "TRIGGER">("MARKET");
  const [tradeQty, setTradeQty] = useState<number>(10);
  const [tradePriceInput, setTradePriceInput] = useState<string>("");
  const [tradeTriggerPriceInput, setTradeTriggerPriceInput] = useState<string>("");

  // Real Local Saving Portfolio simulation
  const [positions, setPositions] = useState<any[]>(() => {
    const saved = localStorage.getItem("vvm-trading-positions");
    return saved ? JSON.parse(saved) : [];
  });
  const [accountBalance, setAccountBalance] = useState<number>(() => {
    const saved = localStorage.getItem("vvm-trading-balance");
    return saved ? parseFloat(saved) : 1000000; // Ten Lakhs INR starting cash
  });

  const [ledgerEntries, setLedgerEntries] = useState<any[]>(() => {
    const saved = localStorage.getItem("vvm-trading-ledger");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return [
      {
        id: "L-29104",
        timestamp: "2026-06-10 09:00:00",
        ticker: "SYSTEM",
        action: "CREDIT",
        particulars: "Demat Funds Setup - Initial Cash Allocation",
        amount: 1000000,
        balance: 1000000
      }
    ];
  });

  const [orders, setOrders] = useState<any[]>(() => {
    const saved = localStorage.getItem("vvm-trading-orders");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return [
      {
        id: "TX-94817",
        ticker: "RELIANCE.NS",
        name: "Reliance Industries",
        type: "BUY",
        mode: "MARKET",
        quantity: 50,
        price: 2450.50,
        status: "EXECUTED",
        timestamp: "2026-06-10 14:24:10",
        currencyPrefix: "₹"
      },
      {
        id: "TX-38102",
        ticker: "TCS.NS",
        name: "Tata Consultancy Services Ltd.",
        type: "BUY",
        mode: "LIMIT",
        quantity: 20,
        price: 3100.00,
        status: "PENDING",
        timestamp: "2026-06-10 15:45:12",
        currencyPrefix: "₹"
      },
      {
        id: "TX-11849",
        ticker: "INFY.NS",
        name: "Infosys Ltd.",
        type: "SELL",
        mode: "LIMIT",
        quantity: 15,
        price: 1520.00,
        status: "CANCELLED",
        timestamp: "2026-06-10 16:12:05",
        currencyPrefix: "₹"
      }
    ];
  });

  const [currentDateTimeStr, setCurrentDateTimeStr] = useState<string>("");

  // Keep localStorage updated
  useEffect(() => {
    localStorage.setItem("vvm-trading-positions", JSON.stringify(positions));
  }, [positions]);

  useEffect(() => {
    localStorage.setItem("vvm-trading-balance", accountBalance.toString());
  }, [accountBalance]);

  useEffect(() => {
    localStorage.setItem("vvm-trading-ledger", JSON.stringify(ledgerEntries));
  }, [ledgerEntries]);

  useEffect(() => {
    localStorage.setItem("vvm-trading-orders", JSON.stringify(orders));
  }, [orders]);

  // Reactive Clock Update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const optionsDate: Intl.DateTimeFormatOptions = { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      };
      const optionsTime: Intl.DateTimeFormatOptions = { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        hour12: true 
      };
      const dateStr = now.toLocaleDateString('en-US', optionsDate);
      const timeStr = now.toLocaleTimeString('en-US', optionsTime);
      setCurrentDateTimeStr(`${dateStr} • ${timeStr}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);
  
  // Custom Indian Indices to simulate real-time stock ticking (iconic Sharekhan style)
  const [indices, setIndices] = useState([
    { name: "NIFTY 50", value: 23320.15, change: 0.45, isUp: true },
    { name: "SENSEX", value: 76510.35, change: 0.48, isUp: true },
    { name: "NIFTY BANK", value: 49850.20, change: -0.12, isUp: false },
    { name: "INDIA VIX", value: 13.40, change: -4.22, isUp: false },
    { name: "NIFTY IT", value: 35420.50, change: 1.10, isUp: true }
  ]);

  // Preset Library of 25 major NSE Companies to easily toggle, add or track
  const presetNseLibrary = [
    { symbol: "RELIANCE.NS", label: "Reliance Industries" },
    { symbol: "TCS.NS", label: "Tata Consultancy" },
    { symbol: "HDFCBANK.NS", label: "HDFC Bank" },
    { symbol: "INFY.NS", label: "Infosys" },
    { symbol: "ICICIBANK.NS", label: "ICICI Bank" },
    { symbol: "SBIN.NS", label: "SBI" },
    { symbol: "BHARTIARTL.NS", label: "Bharti Airtel" },
    { symbol: "ITC.NS", label: "ITC Ltd" },
    { symbol: "KOTAKBANK.NS", label: "Kotak Mahindra" },
    { symbol: "AXISBANK.NS", label: "Axis Bank" },
    { symbol: "HINDUNILVR.NS", label: "Hindustan Unilever" },
    { symbol: "LT.NS", label: "Larsen & Toubro" },
    { symbol: "BAJFINANCE.NS", label: "Bajaj Finance" },
    { symbol: "MARUTI.NS", label: "Maruti Suzuki" },
    { symbol: "SUNPHARMA.NS", label: "Sun Pharma" },
    { symbol: "TITAN.NS", label: "Titan" },
    { symbol: "TATAMOTORS.NS", label: "Tata Motors" },
    { symbol: "COALINDIA.NS", label: "Coal India" },
    { symbol: "ASIANPAINT.NS", label: "Asian Paints" },
    { symbol: "HCLTECH.NS", label: "HCL Technologies" },
    { symbol: "WIPRO.NS", label: "Wipro" },
    { symbol: "NTPC.NS", label: "NTPC" },
    { symbol: "POWERGRID.NS", label: "Power Grid" },
    { symbol: "ADANIENT.NS", label: "Adani Enterprises" },
    { symbol: "ULTRACEMCO.NS", label: "UltraTech Cement" }
  ];

  // Helper actions for bulk management of the watchlist
  const handleAddAllPresets = () => {
    let updated = [...tickers];
    let addedCount = 0;
    presetNseLibrary.forEach((item) => {
      if (!updated.includes(item.symbol)) {
        updated.push(item.symbol);
        addedCount++;
      }
    });
    if (addedCount > 0) {
      setTickers(updated);
      setSuccessMessage(`Successfully added ${addedCount} popular NSE scrips to watchlist.`);
      setTimeout(() => setSuccessMessage(""), 4000);
      fetchMarketData(updated);
    } else {
      setErrorMessage("All 25 popular NSE scrips are already in your watchlist.");
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  const handleClearWatchlistChecklist = () => {
    setTickers([]);
    setTickerObjects([]);
    setSuccessMessage(`Watchlist cleared. Please select or search scrips to monitor.`);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  // Simulated minor ticker updates on sync
  const simulateIndicesTick = () => {
    setIndices(prev => prev.map(ind => {
      const deltaPercent = (Math.random() - 0.5) * 0.1; // -0.05% to +0.05%
      const valDelta = ind.value * (deltaPercent / 100);
      const newValue = ind.value + valDelta;
      const newChange = ind.change + (deltaPercent);
      return {
        ...ind,
        value: Number(newValue.toFixed(2)),
        change: Number(newChange.toFixed(2)),
        isUp: newChange >= 0
      };
    }));
  };

  // Watchlist suggestions
  const suggestions = [
    { symbol: "TATASTEEL.NS", label: "Tata Steel" },
    { symbol: "HDFCBANK.NS", label: "HDFC Bank" },
    { symbol: "INFY.NS", label: "Infosys" },
    { symbol: "AAPL", label: "Apple" },
    { symbol: "BTC-USD", label: "Bitcoin" },
  ];

  // AI Advisory Drawer states
  const [activeBriefingTicker, setActiveBriefingTicker] = useState<TickerData | null>(null);
  const [aiAnalysisText, setAiAnalysisText] = useState("");
  const [fetchingAnalysis, setFetchingAnalysis] = useState(false);
  const [analystChat, setAnalystChat] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // VVM Position Estimator States (Sharekhan Intraday Brokerage Margin style)
  const [calculatorTicker, setCalculatorTicker] = useState<string>("");
  const [calculatorQty, setCalculatorQty] = useState<number>(10);
  const [calcMarginOutput, setCalcMarginOutput] = useState<{ total: number; margin: number } | null>(null);

  useEffect(() => {
    if (tickerObjects.length > 0 && !calculatorTicker) {
      setCalculatorTicker(tickerObjects[0].ticker);
    }
  }, [tickerObjects]);

  // Recalculate Margin when input changes
  useEffect(() => {
    const selected = tickerObjects.find(t => t.ticker === calculatorTicker);
    if (selected) {
      const total = selected.price * calculatorQty;
      const margin = total / 5; // Intraday standard 5x Leverage
      setCalcMarginOutput({ total, margin });
    } else {
      setCalcMarginOutput(null);
    }
  }, [calculatorTicker, calculatorQty, tickerObjects]);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("vvm-trading-tickers", JSON.stringify(tickers));
  }, [tickers]);

  // Main Data Fetcher
  const fetchMarketData = async (targetTickers: string[] = tickers) => {
    if (targetTickers.length === 0) {
      setTickerObjects([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/market-data?tickers=${targetTickers.join(",")}`);
      const payload = await response.json();
      if (payload.success && payload.data) {
        setTickerObjects(payload.data);
        simulateIndicesTick();
      } else {
        setErrorMessage("Warning: Data feed update failed from server.");
      }
    } catch {
      setErrorMessage("System Error: No telemetry response from trading gateway API.");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchMarketData();
  }, []);

  // Timer loop for standard 60-second Refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          fetchMarketData();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [tickers, autoRefresh]);

  // Action: Add Ticker
  const handleAddTicker = (symbol: string) => {
    const formatted = symbol.trim().toUpperCase();
    if (!formatted) return;

    if (tickers.includes(formatted)) {
      setErrorMessage("Scrip already present in your watch list.");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    const updated = [...tickers, formatted];
    setTickers(updated);
    setNewTickerInput("");
    setSuccessMessage(`Scrip ${formatted} added to watchlist successfully.`);
    setTimeout(() => setSuccessMessage(""), 3000);

    // Dynamic refetch
    fetchMarketData(updated);
  };

  // Action: Remove Ticker
  const handleRemoveTicker = (symbol: string) => {
    const updated = tickers.filter((t) => t !== symbol);
    setTickers(updated);
    setTickerObjects((prev) => prev.filter((o) => o.ticker !== symbol));
    setSuccessMessage(`Scrip ${symbol} removed from monitor.`);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  // --- VVM TRADING EXECUTIVE ACTIONS AND LOGIC ---
  const handleOpenTradeDialog = (tickerObj: TickerData, initialType: "BUY" | "SELL" | null = null) => {
    setSelectedTradeTicker(tickerObj);
    setTradeType(initialType);
    setTradeOrderMode("MARKET");
    setTradeQty(10);
    setTradePriceInput(tickerObj.price.toFixed(2));
    setTradeTriggerPriceInput((tickerObj.price * 0.99).toFixed(2));
  };

  const handleExecuteSearch = async (symbol: string) => {
    const formatted = symbol.trim().toUpperCase();
    if (!formatted) return;

    setLoading(true);
    setErrorMessage("");
    try {
      const response = await fetch(`/api/market-data?tickers=${formatted}`);
      const payload = await response.json();
      if (payload.success && payload.data && payload.data.length > 0) {
        const tickerObj = payload.data[0];
        handleOpenTradeDialog(tickerObj, null);
        
        // Also if they want, they can add to watchlist, or let's auto-add to watchlist so it is displayed
        if (!tickers.includes(formatted)) {
          const updated = [...tickers, formatted];
          setTickers(updated);
          // Append to objects so it draws live
          setTickerObjects(prev => {
            if (prev.some(t => t.ticker === formatted)) return prev;
            return [...prev, tickerObj];
          });
        }
      } else {
        setErrorMessage(`Unable to find telemetry specs for requested scrip "${formatted}".`);
        setTimeout(() => setErrorMessage(""), 4000);
      }
    } catch {
      setErrorMessage("System Error: No telemetry response from trading gateway API.");
      setTimeout(() => setErrorMessage(""), 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteTrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTradeTicker || !tradeType) return;
    
    const qty = Number(tradeQty);
    if (isNaN(qty) || qty <= 0) {
      setErrorMessage("Invalid Trade Volume / Quantity entered.");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    let price = selectedTradeTicker.price;
    if (tradeOrderMode === "LIMIT" || tradeOrderMode === "TRIGGER") {
      const customPrice = parseFloat(tradePriceInput);
      if (isNaN(customPrice) || customPrice <= 0) {
        setErrorMessage("Please enter a valid buy/limit price.");
        setTimeout(() => setErrorMessage(""), 3000);
        return;
      }
      price = customPrice;
    }

    const totalPrice = price * qty;
    const currency = selectedTradeTicker.currencyPrefix;
    const orderId = `TX-${Math.floor(10000 + Math.random() * 90000)}`;
    const timestampStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newOrder = {
      id: orderId,
      ticker: selectedTradeTicker.ticker,
      name: selectedTradeTicker.name,
      type: tradeType,
      mode: tradeOrderMode,
      quantity: qty,
      price: price,
      triggerPrice: tradeOrderMode === "TRIGGER" ? parseFloat(tradeTriggerPriceInput) || price : undefined,
      status: tradeOrderMode === "MARKET" ? "EXECUTED" : "PENDING",
      timestamp: timestampStr,
      currencyPrefix: currency
    };

    if (tradeOrderMode === "MARKET") {
      if (tradeType === "BUY") {
        if (accountBalance < totalPrice) {
          setErrorMessage(`Insufficient Funds! Required: ${currency}${totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}, Account Cash: ${currency}${accountBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
          setTimeout(() => setErrorMessage(""), 4000);
          return;
        }

        // Deduct balances & post Ledger debit line
        const newBalance = accountBalance - totalPrice;
        setAccountBalance(newBalance);

        setLedgerEntries(prev => [
          {
            id: `L-${Math.floor(10000 + Math.random() * 90000)}`,
            timestamp: timestampStr,
            ticker: selectedTradeTicker.ticker,
            action: "DEBIT",
            particulars: `Bought ${qty} shares of ${selectedTradeTicker.ticker} (Market Order)`,
            amount: totalPrice,
            balance: newBalance
          },
          ...prev
        ]);

        setPositions(prev => {
          const existingIdx = prev.findIndex(p => p.ticker === selectedTradeTicker.ticker && p.type === "BUY");
          if (existingIdx > -1) {
            const updated = [...prev];
            const existing = updated[existingIdx];
            const totalQty = existing.quantity + qty;
            const newAvgPrice = ((existing.avgPrice * existing.quantity) + (price * qty)) / totalQty;
            updated[existingIdx] = {
              ...existing,
              quantity: totalQty,
              avgPrice: Number(newAvgPrice.toFixed(2))
            };
            return updated;
          } else {
            return [...prev, {
              ticker: selectedTradeTicker.ticker,
              name: selectedTradeTicker.name,
              type: "BUY",
              quantity: qty,
              avgPrice: Number(price.toFixed(2)),
              currencyPrefix: currency
            }];
          }
        });

        setSuccessMessage(`Simulated Order Executed: BOUGHT ${qty} shares of ${selectedTradeTicker.ticker} at ${currency}${price.toFixed(2)}`);
        setTimeout(() => setSuccessMessage(""), 4000);

      } else { // SELL
        const totalHeld = positions
          .filter(p => p.ticker === selectedTradeTicker.ticker && p.type === "BUY")
          .reduce((sum, p) => sum + p.quantity, 0);

        if (totalHeld < qty) {
          setErrorMessage(`Short Sell Blocked: You do not own enough shares of ${selectedTradeTicker.ticker} to execute this SELL order. Owned: ${totalHeld}, Requested: ${qty}`);
          setTimeout(() => setErrorMessage(""), 4000);
          return;
        }

        const newBalance = accountBalance + totalPrice;
        setAccountBalance(newBalance);

        setLedgerEntries(prev => [
          {
            id: `L-${Math.floor(10000 + Math.random() * 90000)}`,
            timestamp: timestampStr,
            ticker: selectedTradeTicker.ticker,
            action: "CREDIT",
            particulars: `Sold ${qty} shares of ${selectedTradeTicker.ticker} (Market Order)`,
            amount: totalPrice,
            balance: newBalance
          },
          ...prev
        ]);

        setPositions(prev => {
          let qtyToDeduct = qty;
          return prev.map(p => {
            if (p.ticker === selectedTradeTicker.ticker && p.type === "BUY") {
              if (p.quantity <= qtyToDeduct) {
                qtyToDeduct -= p.quantity;
                return null;
              } else {
                const newQty = p.quantity - qtyToDeduct;
                qtyToDeduct = 0;
                return { ...p, quantity: newQty };
              }
            }
            return p;
          }).filter(Boolean);
        });

        setSuccessMessage(`Simulated Order Executed: SOLD ${qty} shares of ${selectedTradeTicker.ticker} at ${currency}${price.toFixed(2)}`);
        setTimeout(() => setSuccessMessage(""), 4000);
      }
    } else {
      // Pending non-market lockin
      setSuccessMessage(`Simulated ${tradeOrderMode} Order Placed: PENDING ${tradeType} ${qty} shares of ${selectedTradeTicker.ticker} at target ${currency}${price.toFixed(2)}`);
      setTimeout(() => setSuccessMessage(""), 4000);
    }

    setOrders(prev => [newOrder, ...prev]);
    setSelectedTradeTicker(null);
    setTradeType(null);
  };

  // Action: Force Trigger a Pending order manually to witness execution workflows
  const handleForceTriggerOrder = (orderId: string) => {
    const orderIndex = orders.findIndex(o => o.id === orderId && o.status === "PENDING");
    if (orderIndex === -1) return;

    const orderObj = orders[orderIndex];
    const totalPrice = orderObj.price * orderObj.quantity;
    const currency = orderObj.currencyPrefix || "₹";
    const timestampStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    if (orderObj.type === "BUY") {
      if (accountBalance < totalPrice) {
        setErrorMessage(`Insufficient Funds to Trigger! Required: ${currency}${totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}, Balance: ${currency}${accountBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
        setTimeout(() => setErrorMessage(""), 4000);
        return;
      }

      const newBalance = accountBalance - totalPrice;
      setAccountBalance(newBalance);

      setLedgerEntries(prev => [
        {
          id: `L-${Math.floor(10000 + Math.random() * 90000)}`,
          timestamp: timestampStr,
          ticker: orderObj.ticker,
          action: "DEBIT",
          particulars: `Triggered Order ${orderObj.id} • Bought ${orderObj.quantity} shares of ${orderObj.ticker}`,
          amount: totalPrice,
          balance: newBalance
        },
        ...prev
      ]);

      setPositions(prev => {
        const existingIdx = prev.findIndex(p => p.ticker === orderObj.ticker && p.type === "BUY");
        if (existingIdx > -1) {
          const updated = [...prev];
          const existing = updated[existingIdx];
          const totalQty = existing.quantity + orderObj.quantity;
          const newAvgPrice = ((existing.avgPrice * existing.quantity) + (orderObj.price * orderObj.quantity)) / totalQty;
          updated[existingIdx] = {
            ...existing,
            quantity: totalQty,
            avgPrice: Number(newAvgPrice.toFixed(2))
          };
          return updated;
        } else {
          return [...prev, {
            ticker: orderObj.ticker,
            name: orderObj.name,
            type: "BUY",
            quantity: orderObj.quantity,
            avgPrice: Number(orderObj.price.toFixed(2)),
            currencyPrefix: currency
          }];
        }
      });

      setSuccessMessage(`Order ${orderObj.id} Triggered: BOUGHT ${orderObj.quantity} shares of ${orderObj.ticker} at ${currency}${orderObj.price.toFixed(2)}`);
      setTimeout(() => setSuccessMessage(""), 4000);
    } else { // SELL
      const totalHeld = positions
        .filter(p => p.ticker === orderObj.ticker && p.type === "BUY")
        .reduce((sum, p) => sum + p.quantity, 0);

      if (totalHeld < orderObj.quantity) {
        setErrorMessage(`Short Sell Blocked: You do not own enough shares of ${orderObj.ticker} to execute this SELL order.`);
        setTimeout(() => setErrorMessage(""), 4000);
        return;
      }

      const newBalance = accountBalance + totalPrice;
      setAccountBalance(newBalance);

      setLedgerEntries(prev => [
        {
          id: `L-${Math.floor(10000 + Math.random() * 90000)}`,
          timestamp: timestampStr,
          ticker: orderObj.ticker,
          action: "CREDIT",
          particulars: `Triggered Order ${orderObj.id} • Sold ${orderObj.quantity} shares of ${orderObj.ticker}`,
          amount: totalPrice,
          balance: newBalance
        },
        ...prev
      ]);

      setPositions(prev => {
        let qtyToDeduct = orderObj.quantity;
        return prev.map(p => {
          if (p.ticker === orderObj.ticker && p.type === "BUY") {
            if (p.quantity <= qtyToDeduct) {
              qtyToDeduct -= p.quantity;
              return null;
            } else {
              const newQty = p.quantity - qtyToDeduct;
              qtyToDeduct = 0;
              return { ...p, quantity: newQty };
            }
          }
          return p;
        }).filter(Boolean);
      });

      setSuccessMessage(`Order ${orderObj.id} Triggered: SOLD ${orderObj.quantity} shares of ${orderObj.ticker} at ${currency}${orderObj.price.toFixed(2)}`);
      setTimeout(() => setSuccessMessage(""), 4000);
    }

    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "EXECUTED" } : o));
  };

  // Action: Cancel a Pending limit/trigger order
  const handleCancelPendingOrder = (orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId && o.status === "PENDING" ? { ...o, status: "CANCELLED" } : o));
    setSuccessMessage(`Simulated Order ${orderId} successfully set to CANCELLED.`);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  // Action: Clear order logs completely
  const handleResetLedgerAndOrders = () => {
    if (confirm("Reset financial ledger accounts and clear trades history?")) {
      setLedgerEntries([
        {
          id: "L-29104",
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          ticker: "SYSTEM",
          action: "CREDIT",
          particulars: "Demat Funds Setup - Restored Account Backing Balance",
          amount: 1000000,
          balance: 1000000
        }
      ]);
      setOrders([]);
      setPositions([]);
      setAccountBalance(1000000);
      setSuccessMessage("Trading Ledger books reset to ₹10,00,000 Starting Capital.");
      setTimeout(() => setSuccessMessage(""), 4000);
    }
  };

  // Action: Launch AI Strategic Briefing
  const handleLaunchAnalyst = async (tickerObj: TickerData) => {
    setActiveBriefingTicker(tickerObj);
    setAiAnalysisText("");
    setFetchingAnalysis(true);
    setAnalystChat([]);

    try {
      const response = await fetch("/api/ai-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tickerObj),
      });
      const data = await response.json();
      if (data.success) {
        setAiAnalysisText(data.analysis);
        setAnalystChat([
          {
            sender: "ai",
            text: `VVM Advisory desk is live on scrip **${tickerObj.name}** (${tickerObj.ticker}).\n\nOur current metrics reflect a spot rate of **${tickerObj.currencyPrefix}${tickerObj.price.toFixed(2)}**, Momentum RSI of **${tickerObj.rsi.toFixed(1)}**, and EMA indicator reading **${tickerObj.currencyPrefix}${tickerObj.ema.toFixed(1)}**.\n\nPlease type any query regarding entry pricing targets, hedging strategy, or derivative contracts advice.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
      } else {
        setAiAnalysisText(`Research Blocked: ${data.error}`);
      }
    } catch {
      setAiAnalysisText("System offline. Check Gemini API configuration parameters.");
    } finally {
      setFetchingAnalysis(false);
    }
  };

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [analystChat]);

  // Action: Post Message to Stock Analyst Chat
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeBriefingTicker || sendingMessage) return;

    const userMsgText = chatInput;
    setChatInput("");
    
    const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      sender: "user",
      text: userMsgText,
      timestamp: timestampStr,
    };

    setAnalystChat((prev) => [...prev, userMsg]);
    setSendingMessage(true);

    try {
      const historyStr = analystChat.map(m => `${m.sender.toUpperCase()}: ${m.text}`).join("\n");
      const completePrompt = `You are the lead SEBI-inspired financial workstation advisor at VVM Securities Research Desk, conversing with a premium client regarding ${activeBriefingTicker.name} (${activeBriefingTicker.ticker}).
Latest criteria: Spot Price ${activeBriefingTicker.currencyPrefix}${activeBriefingTicker.price.toFixed(2)}, RSI ${activeBriefingTicker.rsi.toFixed(1)}, Slope ${activeBriefingTicker.slope?.toFixed(4)}, Signal Trigger "${activeBriefingTicker.signal}".

Prior Conversation:
${historyStr}

Humans Query: ${userMsgText}

Please respond with precise, elegant stock advice. Be conservative, professional, extremely analytical, and utilize technical parameters (Support levels, OLS trend projection, RSI limits). Keep response crisp (under 100 words).`;

      const response = await fetch("/api/ai-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ticker: activeBriefingTicker.ticker,
          name: activeBriefingTicker.name,
          price: activeBriefingTicker.price,
          change: activeBriefingTicker.change,
          rsi: activeBriefingTicker.rsi,
          ema: activeBriefingTicker.ema,
          signal: activeBriefingTicker.signal,
          risk: activeBriefingTicker.risk,
          currencyPrefix: activeBriefingTicker.currencyPrefix,
          preds: activeBriefingTicker.preds,
          confidence: activeBriefingTicker.confidence,
          customPrompt: completePrompt
        }),
      });

      const data = await response.json();
      if (data.success) {
        setAnalystChat((prev) => [
          ...prev,
          {
            sender: "ai",
            text: data.analysis,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
      } else {
        setAnalystChat((prev) => [
          ...prev,
          {
            sender: "ai",
            text: "Intercom update blocked. Interface transmission scrambled.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
      }
    } catch {
      setAnalystChat((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "API error. Verify local workspace credentials.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } finally {
      setSendingMessage(false);
    }
  };

  const countSignals = (type: string) => {
    return tickerObjects.filter((o) => o.signal.toLowerCase().includes(type.toLowerCase())).length;
  };

  const getTopGainer = () => {
    if (tickerObjects.length === 0) return null;
    return [...tickerObjects].sort((a, b) => b.change - a.change)[0];
  };

  const getHighRisk = () => {
    return tickerObjects.filter((o) => o.risk === "High");
  };

  const topGainer = getTopGainer();
  const highRiskList = getHighRisk();

  return (
    <div className="min-h-screen bg-[#0e1014] text-[#d1d5db] flex flex-col font-sans relative overflow-x-hidden selection:bg-[#E21E26] selection:text-white">
      
      {/* SHREKHAN ICONIC TOP INDEX BAND */}
      <section className="bg-[#181a21] border-b border-[#242731] text-[11px] font-mono shadow-sm" id="indices-ticker-tape">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-6 overflow-x-auto whitespace-nowrap py-2 justify-between">
          <div className="flex items-center gap-1 bg-[#242731] py-0.5 px-2 rounded font-bold text-white text-[10px] tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E21E26] animate-pulse"></span> INDICES
          </div>
          <div className="flex items-center gap-6 overflow-x-auto scrollbar-none py-1">
            {indices.map((ind, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="text-[#a0a5bc] font-bold">{ind.name}</span>
                <span className="text-white font-bold">{ind.value.toLocaleString()}</span>
                <span className={`flex items-center font-bold text-[10px] ${ind.isUp ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
                  {ind.isUp ? <ArrowUpRight size={12} className="inline mr-0.5" /> : <ArrowDownRight size={12} className="inline mr-0.5" />}
                  {ind.isUp ? "+" : ""}{ind.change}%
                </span>
                {i < indices.length - 1 && <span className="text-[#363a4d] mx-1">|</span>}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-[#5e657e] hidden md:block">Market State: Standard Session Open</p>
        </div>
      </section>

      {/* DYNAMIC SCROLLING LIVE STOCK TICKER TAPE (A to Z Ascending Order) */}
      <section className="bg-[#0c0d12] border-b border-[#242731] py-2 overflow-hidden relative select-none w-full" id="nse-ticker-marquee">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 bg-[#E21E26]/10 text-[#E21E26] px-2 py-0.5 rounded border border-[#E21E26]/20 font-bold text-[9px] tracking-wider shrink-0 z-10 mr-4 shadow-sm font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E21E26] animate-pulse"></span>
            LIVE NSE MARQUEE (A-Z)
          </div>
          <div className="flex-grow overflow-hidden relative">
            {tickerObjects && tickerObjects.length > 0 ? (
              <div className="flex w-full">
                <div className="animate-marquee whitespace-nowrap flex gap-10 items-center font-mono">
                  {[...tickerObjects]
                    .sort((a, b) => a.ticker.localeCompare(b.ticker))
                    .concat([...tickerObjects].sort((a, b) => a.ticker.localeCompare(b.ticker)))
                    .concat([...tickerObjects].sort((a, b) => a.ticker.localeCompare(b.ticker)))
                    .concat([...tickerObjects].sort((a, b) => a.ticker.localeCompare(b.ticker)))
                    .map((obj, i) => {
                      const isUp = obj.change >= 0;
                      return (
                        <div key={`${obj.ticker}-${i}`} className="inline-flex items-center gap-1.5 text-xs">
                          <span className="font-bold text-white text-[11px]">{obj.ticker}</span>
                          <span className="text-[#a0a5bc] text-[9px] truncate max-w-[80px]">({obj.name})</span>
                          <span className="text-[#d1d5db] font-semibold">{obj.currencyPrefix}{obj.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          <span className={`inline-flex items-center font-bold text-[10px] ${isUp ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
                            {isUp ? "▲ +" : "▼ "}{obj.change.toFixed(2)}%
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : (
              <div className="text-[#5e657e] italic text-[11px] animate-pulse font-mono">
                Establishing connection to NSE ticker feed via YFinance... Please wait.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* AT TOP BUT BELOW THE SCROLLING SCRIPS: CLIENT WELCOME IDENTITY BANNER */}
      <section className="bg-[#0b0c10] border-b border-[#242731] py-3.5 select-none w-full" id="client-auth-greeting-banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#14161f] border border-[#2d303f] rounded-2xl p-4.5 shadow-md">
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-[#E21E26]/10 border border-[#E21E26]/30 flex items-center justify-center text-[#E21E26]">
                <ShieldCheck size={20} />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[#a0a5bc] font-mono text-[10px] uppercase font-bold tracking-wider">SECURE AUTHORIZED ACCESS</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]"></span>
                  <span className="text-[10px] text-[#22C55E] font-mono font-bold uppercase tracking-wider">SEBI REGISTERED</span>
                </div>
                <h2 className="text-white font-extrabold font-mono text-sm sm:text-base tracking-wide">
                  Welcome Mr. Vikram Mohite
                </h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-[#8087a3]">
                  <span className="flex items-center gap-1">
                    <span className="text-[#5e657e] font-semibold uppercase text-[9px]">DP Id:</span>
                    <span className="text-white font-bold bg-[#0f111a] px-2 py-0.5 rounded border border-[#2d303f]">123456</span>
                  </span>
                  <span className="text-[#2d303f] hidden sm:inline">|</span>
                  <span className="flex items-center gap-1">
                    <span className="text-[#5e657e] font-semibold uppercase text-[9px]">Customer Id:</span>
                    <span className="text-white font-bold bg-[#0f111a] px-2 py-0.5 rounded border border-[#2d303f]">7654321</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-[#0f111a] border border-[#2d303f] px-4 py-2 rounded-xl text-xs font-mono shrink-0">
              <Clock size={13} className="text-[#E21E26] animate-pulse" />
              <div className="text-right">
                <span className="text-[8px] text-[#5e657e] block font-bold uppercase tracking-wider">LIVE TERMINAL TIMESTAMP</span>
                <span className="text-white font-bold text-[11px] tracking-wide uppercase">
                  {currentDateTimeStr || "Syncing global atomic lock..."}
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* HEADER SECTION - VVM TRADING DASHBOARD (Sharekhan Inspired Workstation) */}
      <header className="border-b border-[#242731] bg-[#14161f]/95 sticky top-0 z-40 backdrop-blur" id="vvm-dashboard-header">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-[#E21E26] rounded-xl flex items-center justify-center text-white shadow-lg animate-pulse">
              <ShieldCheck size={24} strokeWidth={2.4} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white uppercase font-mono">
                  VVM TRADING DASHBOARD
                </h1>
                <span className="bg-[#E21E26] text-white text-[8px] font-bold font-mono py-0.5 px-1.5 rounded tracking-wider uppercase">PRO-BROKER</span>
              </div>
              <p className="text-[10px] uppercase tracking-wider text-[#a0a5bc] font-mono">Sharekhan-Backed Multi-Asset Terminal & AI Predictor</p>
            </div>
          </div>

          <div className="flex gap-3 items-center flex-wrap justify-center font-mono">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#181a21] rounded-lg border border-[#2d303f]">
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse"></span>
              <span className="text-[10px] font-bold text-white uppercase">VVM CONNECTED</span>
            </div>
            
            <div className="flex items-center gap-2.5 bg-[#181a21] border border-[#2d303f] rounded-lg px-2.5 py-1 text-xs">
              <Clock size={12} className="text-[#a0a5bc]" />
              <button 
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`text-[9px] font-mono font-bold uppercase transition ${autoRefresh ? "text-[#22C55E]" : "text-[#a0a5bc]"}`}
              >
                {autoRefresh ? "Auto tick" : "Hold"}
              </button>
              {autoRefresh && (
                <span className="text-white w-4 inline-block text-right text-[10px]">{refreshCountdown}s</span>
              )}
            </div>

            <button
              onClick={() => {
                fetchMarketData();
                setRefreshCountdown(60);
              }}
              disabled={loading}
              className="bg-[#E21E26] hover:bg-[#c2141a] text-white font-mono font-bold text-xs px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-md rounded"
              id="refresh-btn"
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              {loading ? "REFRESHING..." : "LIVE SYNC"}
            </button>
          </div>
        </div>
      </header>

      {/* ERROR / SUCCESS FEEDBAR */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-4.5">
        {errorMessage && (
          <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-xs px-4 py-2.5 rounded-lg mb-3 flex items-center gap-2" id="system-error">
            <AlertOctagon size={13} className="text-[#EF4444]" />
            <span className="font-mono font-bold">MONITOR ERROR: {errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] text-xs px-4 py-2.5 rounded-lg mb-3 flex items-center gap-2 animate-fadeIn" id="system-success">
            <ShieldCheck size={13} className="text-[#22C55E]" />
            <span className="font-mono font-bold">INFO BLOCK: {successMessage}</span>
          </div>
        )}
      </div>

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-3 flex flex-col gap-6">
        
        {/* TOP MARKET SUMMARY BOARD */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="vvm-brokerage-board">
          
          <div className="bg-[#14161f] border border-[#242731] rounded-xl p-4 flex flex-col justify-between shadow-sm">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#a0a5bc] font-bold">Watchlists Monitored</span>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl font-mono font-bold text-white">{tickers.length}</span>
              <span className="text-[#8087a3] text-[10px] font-mono">ACTIVE COORDINATES</span>
            </div>
            <p className="text-[10px] text-[#5e657e] font-mono mt-1">Multi-asset monitor active</p>
          </div>

          <div className="bg-[#14161f] border border-[#242731] rounded-xl p-4 flex flex-col justify-between shadow-sm">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#a0a5bc] font-bold">Buy/Sell Indicators</span>
            <div className="flex gap-3 mt-2">
              <div className="flex flex-col">
                <span className="text-sm font-mono font-bold text-[#22C55E]">{countSignals("Buy") + countSignals("Bullish")}</span>
                <span className="text-[8px] text-[#8087a3] uppercase font-mono font-bold">Buy Focus</span>
              </div>
              <div className="border-r border-[#2d303f] h-6 my-auto"></div>
              <div className="flex flex-col">
                <span className="text-sm font-mono font-bold text-amber-500">{countSignals("Neutral")}</span>
                <span className="text-[8px] text-[#8087a3] uppercase font-mono font-bold">Hold / Hold</span>
              </div>
              <div className="border-r border-[#2d303f] h-6 my-auto"></div>
              <div className="flex flex-col">
                <span className="text-sm font-mono font-bold text-[#EF4444]">{countSignals("Sell") + countSignals("Bearish")}</span>
                <span className="text-[8px] text-[#8087a3] uppercase font-mono font-bold">Bearish</span>
              </div>
            </div>
            <p className="text-[10px] text-[#5e657e] font-mono mt-1">Technical buy/sell bias balance</p>
          </div>

          <div className="bg-[#14161f] border border-[#242731] rounded-xl p-4 flex flex-col justify-between shadow-sm">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#a0a5bc] font-bold">Primary Outperformer</span>
            {topGainer ? (
              <div className="flex items-center justify-between mt-1">
                <div className="flex flex-col select-none">
                  <span className="text-xs font-mono font-bold text-white truncate max-w-[90px]">{topGainer.ticker}</span>
                  <span className="text-[8px] text-[#8087a3] truncate max-w-[90px]">{topGainer.name}</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded border border-[#22C55E]/20 flex items-center gap-0.5">
                  <TrendingUp size={10} /> +{topGainer.change.toFixed(1)}%
                </span>
              </div>
            ) : (
              <span className="text-xs text-[#8087a3] mt-2 font-mono">No Active Feed</span>
            )}
            <p className="text-[10px] text-[#5e657e] font-mono mt-1">Watching top volatility gainer</p>
          </div>

          <div className="bg-[#14161f] border border-[#242731] rounded-xl p-4 flex flex-col justify-between shadow-sm">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#a0a5bc] font-bold">High volatility counters</span>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-md font-mono font-bold ${highRiskList.length > 0 ? "text-[#F95738]" : "text-[#8087a3]"}`}>
                {highRiskList.length} Counters
              </span>
              {highRiskList.length > 0 && (
                <span className="h-2 w-2 rounded-full bg-[#F95738] animate-ping"></span>
              )}
            </div>
            <p className="text-[10px] text-[#5e657e] font-mono mt-1">Trading range standard risk alert</p>
          </div>

        </section>

        {/* TWO-COLUMN LAYOUT: Watchlist Controller + Watchlist Value Margin Estimator */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Watchlist Inject block */}
          <div className="bg-[#14161f] border border-[#242731] rounded-xl p-5 lg:col-span-2 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 border-b border-[#2d303f] pb-3 gap-2">
              <div>
                <h3 className="text-xs uppercase font-mono tracking-wider text-[#F95738] flex items-center gap-1.5 font-bold">
                  <Search size={13} /> Monitor New Trading Asset
                </h3>
                <p className="text-[10px] text-[#8087a3] font-mono mt-0.5">NSE, BSE & Crypto codes supported</p>
              </div>
              <div className="flex items-center gap-2 font-mono text-[10px] w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleAddAllPresets}
                  className="bg-[#22C55E]/15 hover:bg-[#22C55E]/25 border border-[#22C55E]/40 text-[#22C55E] px-2 py-1 rounded font-bold transition cursor-pointer"
                  title="Add all 25 presets at once"
                >
                  + ADD ALL 25 PRESETS
                </button>
                <button
                  type="button"
                  onClick={handleClearWatchlistChecklist}
                  className="bg-[#EF4444]/15 hover:bg-[#EF4444]/25 border border-[#EF4444]/40 text-[#EF4444] px-2 py-1 rounded font-bold transition cursor-pointer"
                  title="Clear watchlist to configure from scratch"
                >
                  ✕ CLEAR ALL
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-grow flex gap-2">
                <input
                  type="text"
                  placeholder="Enter NSE Scrip or Global Tickers (e.g. INFY.NS, TCS.NS, NVDA, AAPL, BTC-USD)"
                  value={newTickerInput}
                  onChange={(e) => setNewTickerInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleExecuteSearch(newTickerInput);
                    }
                  }}
                  className="flex-grow bg-[#0f111a] border border-[#2d303f] focus:border-[#E21E26] rounded-lg px-3.5 py-2 text-white font-mono text-xs placeholder:text-[#5e657e] focus:outline-none"
                />
                <button
                  onClick={() => handleExecuteSearch(newTickerInput)}
                  className="bg-[#E21E26] hover:bg-[#c2141a] text-white font-mono font-bold px-4 py-2 rounded-lg transition-all text-xs flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md uppercase"
                  title="Search stock and open Buy/Sell Trade pane"
                >
                  <ArrowUpRight size={14} className="text-white" /> Trade Instantly
                </button>
                <button
                  onClick={() => handleAddTicker(newTickerInput)}
                  className="bg-[#1f2231] hover:bg-[#282c3f] border border-[#2d303f] text-[#d1d5db] font-mono font-bold px-4 py-2 rounded-lg transition-all text-xs flex items-center gap-1 shrink-0 cursor-pointer"
                  title="Add stock to active Monitor checklist"
                >
                  <Plus size={14} /> Monitor Watchlist
                </button>
              </div>
            </div>

            {/* Quick-Add Interactive NSE Scrip Library Checklist (25 Major Stocks) */}
            <div className="mt-5 pt-3 border-t border-[#2d303f]/60">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#a0a5bc] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E21E26]"></span>
                  QUICK-ADD NSE SCRIP LIBRARY (25 Major Indian Entities)
                </h4>
                <p className="text-[9px] text-[#5e657e] font-mono">Click to toggle watchlist state</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 max-h-[160px] overflow-y-auto pr-1">
                {presetNseLibrary.map((item) => {
                  const isMonitored = tickers.includes(item.symbol);
                  return (
                    <button
                      key={item.symbol}
                      onClick={() => {
                        if (isMonitored) {
                          handleRemoveTicker(item.symbol);
                        } else {
                          handleAddTicker(item.symbol);
                        }
                      }}
                      className={`px-2 py-1.5 rounded-lg text-[10px] font-mono transition-all text-left flex items-center justify-between border cursor-pointer ${
                        isMonitored
                          ? "bg-[#22C55E]/10 hover:bg-[#EF4444]/10 text-white border-[#22C55E]/40 hover:border-[#EF4444]/40"
                          : "bg-[#181a21] hover:bg-[#20222f] border-[#2d303f]/80 text-[#8087a3] hover:text-white hover:border-[#E21E26]/50"
                      }`}
                      title={`${isMonitored ? "Remove" : "Add"} ${item.label}`}
                    >
                      <div className="flex flex-col truncate pr-1">
                        <span className={`font-bold truncate ${isMonitored ? "text-[#22C55E]" : "text-[#d1d5db]"}`}>
                          {item.symbol.replace(".NS", "")}
                        </span>
                        <span className="text-[8px] text-[#5e657e] truncate">{item.label}</span>
                      </div>
                      <span className="shrink-0">
                        {isMonitored ? (
                          <span className="text-[#22C55E] font-extrabold text-[11px] group-hover:hidden">✓</span>
                        ) : (
                          <span className="text-[#5e657e] font-bold text-[10px]">+</span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Fully Functional Watchlist Position Margin Estimator Widget (Unique to VVM Sharekhan style) */}
          <div className="bg-[#14161f] border border-[#242731] rounded-xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-[#2d303f] pb-2">
                <h3 className="text-xs uppercase font-mono tracking-wider text-[#a0a5bc] flex items-center gap-1.5 font-bold">
                  <Calculator size={14} className="text-[#E21E26]" /> VVM Intraday Leverage Margin
                </h3>
                <span className="text-[9px] font-mono text-[#22C55E]">Intraday 5x</span>
              </div>
              
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <label className="block text-[10px] uppercase text-[#a0a5bc] font-bold mb-1">Select Active Scrip</label>
                  <select 
                    value={calculatorTicker}
                    onChange={(e) => setCalculatorTicker(e.target.value)}
                    className="w-full bg-[#0f111a] border border-[#2d303f] focus:border-[#E21E26] text-white rounded p-2 text-xs focus:outline-none"
                  >
                    {tickerObjects.length > 0 ? (
                      tickerObjects.map(obj => (
                        <option key={obj.ticker} value={obj.ticker}>{obj.ticker} ({obj.currencyPrefix}{obj.price.toFixed(1)})</option>
                      ))
                    ) : (
                      <option value="">No Active Watched Items</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-[#a0a5bc] font-bold mb-1">Shares Volume</label>
                  <input 
                    type="number" 
                    value={calculatorQty} 
                    min={1}
                    onChange={(e) => setCalculatorQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-[#0f111a] border border-[#2d303f] focus:border-[#E21E26] text-white rounded p-1.5 text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {calcMarginOutput ? (
              <div className="bg-[#1b1d28] border border-[#2d303f] rounded-lg p-2.5 mt-3 space-y-1.5 font-mono">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-[#8087a3]">Estimated value:</span>
                  <span className="text-white font-bold">{calcMarginOutput.total.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-xs pt-1 border-t border-[#2d303f]">
                  <span className="text-white font-bold flex items-center gap-1">VVM Intraday Outlay:</span>
                  <span className="text-[#E21E26] font-extrabold">{calcMarginOutput.margin.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-[#5e657e] italic text-center mt-4">Select items to determine trade outlay</p>
            )}
          </div>

        </section>

        {/* ACTIVE WATCHLIST COMPONENT MATRIXGRID */}
        {loading && tickerObjects.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="loading-skeletons">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-[#14161f] border border-[#242731] rounded-xl p-5 h-72 animate-pulse flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="h-4 bg-[#232634] rounded w-1/3"></div>
                  <div className="h-3 bg-[#232634] rounded w-2/3"></div>
                </div>
                <div className="h-12 bg-[#232634] rounded-lg"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-[#232634] rounded w-5/6"></div>
                  <div className="h-3 bg-[#232634] rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : tickerObjects.length === 0 ? (
          <div className="bg-[#14161f] border border-[#242731] rounded-xl p-12 text-center shadow-inner" id="empty-state">
            <div className="max-w-md mx-auto">
              <div className="h-12 w-12 rounded-full bg-[#181a21] border border-[#2d303f] mx-auto flex items-center justify-center text-[#EF4444] mb-4 animate-bounce">
                <AlertOctagon size={24} />
              </div>
              <h2 className="text-sm font-bold tracking-wider font-mono text-white text-center uppercase">VVM MONITOR: WATCHLIST UNConfigured</h2>
              <p className="text-xs text-[#a0a5bc] mt-2 font-mono">Inject scrips above or apply standard broker suggestion matrices to track active parameters.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="vvm-stock-grid">
            {tickerObjects.map((obj) => {
              const isChangePositive = obj.change >= 0;
              const closesHistory = obj.history ? obj.history.map((h) => h.value) : [];

              return (
                <div 
                  key={obj.ticker} 
                  className="bg-[#14161f] hover:bg-[#1b1c25] border border-[#242731] hover:border-[#E21E26]/40 rounded-xl p-5 flex flex-col justify-between transition-all duration-300 shadow group relative overflow-hidden"
                  id={`card-${obj.ticker}`}
                >
                  <div className="absolute top-0 right-0 h-28 w-28 bg-[radial-gradient(circle_at_top_right,rgba(226,30,38,0.02),transparent_60%)] pointer-events-none"></div>

                  <div>
                    {/* Header line for Scrip */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-base font-mono font-bold tracking-tight text-white group-hover:text-[#E21E26] transition-colors">
                            {obj.ticker}
                          </span>
                          <span className="text-[8px] font-mono tracking-widest px-1 py-0.2 bg-[#090a0f] border border-[#242731] rounded text-[#8087a3]">
                            {obj.ticker.endsWith(".NS") || obj.ticker.endsWith(".BO") ? "INDIA CASH" : "GLOBAL/FOREX"}
                          </span>
                        </div>
                        <h2 className="text-xs text-[#a0a5bc] font-sans font-medium line-clamp-1 max-w-[200px]" title={obj.name}>
                          {obj.name}
                        </h2>
                      </div>
                      
                      <button
                        onClick={() => handleRemoveTicker(obj.ticker)}
                        className="text-[#5e657e] hover:text-[#EF4444] p-1.5 rounded-md transition hover:bg-[#181a21]"
                        title="Delete Scrip"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {/* Spot Quote parameters */}
                    <div className="flex justify-between items-center mt-5 mb-4 gap-4">
                      <div>
                        <span className="text-[9px] text-[#8087a3] font-mono block uppercase tracking-wider">SPOT TRADED VALUE</span>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span className="text-xl font-mono font-bold text-white">
                            {obj.currencyPrefix}{obj.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className={`text-xs font-mono font-bold flex items-center gap-0.5 ${isChangePositive ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
                            {isChangePositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                            {isChangePositive ? "+" : ""}{obj.change.toFixed(2)}%
                          </span>
                        </div>
                      </div>

                      {/* Sparkline Visual */}
                      <div className="w-36 h-11 bg-[#0f111a] rounded-lg p-1.5 border border-[#242731] select-none">
                        <Sparkline data={closesHistory} positive={isChangePositive} />
                      </div>
                    </div>

                    {/* Technical stats matrix */}
                    <div className="grid grid-cols-3 border-t border-b border-[#242731] py-3 my-4 gap-2 text-center bg-[#0f111a]/50 rounded-lg px-2">
                      <div className="flex flex-col">
                        <span className="text-[8px] uppercase font-mono text-[#8087a3] font-bold">RSI (14)</span>
                        <span className={`text-xs font-mono font-bold mt-1 ${obj.rsi < 35 ? "text-[#22C55E]" : obj.rsi > 65 ? "text-[#EF4444]" : "text-white"}`}>
                          {obj.rsi.toFixed(1)}
                        </span>
                        <span className="text-[8px] text-[#5e657e] font-mono">
                          {obj.rsi < 35 ? "Oversold" : obj.rsi > 65 ? "Overbought" : "Neutral"}
                        </span>
                      </div>

                      <div className="flex flex-col border-r border-l border-[#242731]">
                        <span className="text-[8px] uppercase font-mono text-[#8087a3] font-bold">100D EMA Baseline</span>
                        <span className="text-xs font-mono font-semibold text-white mt-1">
                          {obj.currencyPrefix}{obj.ema.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                        </span>
                        <span className="text-[8px] text-[#5e657e] font-mono">
                          {obj.price > obj.ema ? "Bullish Crossover" : "Bearish Spread"}
                        </span>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-[8px] uppercase font-mono text-[#8087a3] font-bold">Volatility standard dev</span>
                        <span className={`text-xs font-mono font-bold mt-1 ${obj.risk === "High" ? "text-[#EF4444]" : obj.risk === "Moderate" ? "text-amber-500" : "text-[#22C55E]"}`}>
                          {obj.risk}
                        </span>
                        <span className="text-[8px] text-[#5e657e] font-mono">
                          Std dev based metric
                        </span>
                      </div>
                    </div>

                    {/* Linear Regression Forecast indicators (OLS Models) */}
                    <div className="bg-[#0f111a] border border-[#242731] rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-center text-[9px] font-mono uppercase tracking-wider">
                        <span className="text-[#F95738] font-bold flex items-center gap-1">
                          <Layers size={10} /> OLS 3-DAY TREND PROJECTION
                        </span>
                        <span className="text-[#8087a3] text-[8px]">
                          Slope probability: {obj.confidence !== null ? `${(obj.confidence * 100).toFixed(0)}%` : "N/A"}
                        </span>
                      </div>

                      {obj.preds ? (
                        <div className="grid grid-cols-3 gap-2 font-mono">
                          {obj.preds.map((p, idx) => (
                            <div key={idx} className="bg-[#14151e] border border-[#2d303f] rounded p-1.5 text-center text-xs">
                              <span className="text-[8px] text-[#8087a3] block font-bold uppercase">Day {idx + 1}</span>
                              <span className="font-bold text-white">
                                {obj.currencyPrefix}{p.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-[10px] text-[#5e657e] py-1">
                          Insufficient historical timeframe (requires 40 indexes).
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Action footer layout: custom buy/sell and analysis */}
                  <div className="mt-4 pt-1 flex gap-2">
                    <button
                      onClick={() => handleOpenTradeDialog(obj, null)}
                      className="flex-grow bg-[#22C55E]/10 hover:bg-[#22C55E]/20 border border-[#22C55E]/40 text-white font-mono font-bold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:border-[#22C55E]"
                      id={`trade-btn-${obj.ticker}`}
                    >
                      <TrendingUp size={12} className="text-[#22C55E]" />
                      TRADE (BUY/SELL)
                    </button>
                    <button
                      onClick={() => handleLaunchAnalyst(obj)}
                      className="bg-[#1c1e28] hover:bg-[#282b3d] border border-[#2d303f] hover:border-[#E21E26]/50 text-white font-mono font-bold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      id={`analyst-btn-${obj.ticker}`}
                    >
                      <Sparkles size={11} className="text-[#E21E26] animate-pulse" />
                      RESEARCH DESK
                    </button>
                  </div>

                  {/* Trade Signal Indicator float badge */}
                  <div className="absolute top-14 right-4">
                    <span className={`text-[9px] font-mono font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded border ${
                      obj.signal.includes("Strong Buy") 
                        ? "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20" 
                        : obj.signal.includes("Strong Sell") 
                        ? "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20" 
                        : obj.signal.includes("Bullish") 
                        ? "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20" 
                        : obj.signal.includes("Bearish") 
                        ? "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20" 
                        : "bg-[#090a0f] text-[#8087a3] border-[#242731]"
                    }`}>
                      {obj.signal}
                    </span>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* VVM THREE-MODULE INTEGRATED SECURITIES ACCOUNTING SYSTEMS */}
        <div className="space-y-6" id="vvm-brokerage-ledgers-hub">
          
          {/* MODULE 1: SIMULATED POSITIONS BOOK & LEDGER ACCOUNT (CASH BOOK) */}
          <section className="bg-[#14161f] border border-[#242731] rounded-2xl p-5 shadow-lg" id="vvm-ledger-account-container">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#2d303f] pb-4 mb-4 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#E21E26] animate-pulse"></span>
                  <h3 className="text-sm font-mono font-bold tracking-wider text-white uppercase">
                    VVM CAPITAL STATEMENT & LEDGER ACCOUNT
                  </h3>
                </div>
                <p className="text-[10px] text-[#8087a3] font-mono mt-0.5">Dual-entry simulated financial cash book database</p>
              </div>

              <div className="flex flex-wrap items-center gap-4 bg-[#0f111a] border border-[#2d303f] px-4 py-2.5 rounded-xl font-mono text-xs">
                <div className="space-y-0.5">
                  <span className="text-[8px] text-[#8087a3] block font-bold uppercase tracking-wider">AVAILABLE TRADING CAPITAL (CASH)</span>
                  <span className="text-white font-extrabold text-sm sm:text-base">
                    ₹{accountBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="border-r border-[#2d303f] h-8 hidden sm:block"></div>
                <div className="space-y-0.5">
                  <span className="text-[8px] text-[#8087a3] block font-bold uppercase tracking-wider">LEDGER NET BALANCE</span>
                  {(() => {
                    let totalPnL = 0;
                    positions.forEach(pos => {
                      const matchObj = tickerObjects.find(t => t.ticker === pos.ticker);
                      const livePrice = matchObj ? matchObj.price : pos.avgPrice;
                      totalPnL += (livePrice - pos.avgPrice) * pos.quantity;
                    });
                    const ledgerTotal = accountBalance + totalPnL;
                    return (
                      <span className="font-extrabold text-[#22C55E] text-xs sm:text-sm">
                        ₹{ledgerTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    );
                  })()}
                </div>
                <div className="border-r border-[#2d303f] h-8 hidden sm:block"></div>
                <button
                  onClick={handleResetLedgerAndOrders}
                  className="bg-[#EF4444]/15 hover:bg-[#EF4444]/25 border border-[#EF4444]/30 text-[#EF4444] px-3 py-1.5 text-[10px] rounded font-bold transition ml-auto cursor-pointer uppercase font-mono shadow-sm"
                  title="Wipe ledgers, orders log and restore standard ₹10 Lakhs capital"
                >
                  RE-SETUP LEDGERS
                </button>
              </div>
            </div>

            {/* LEDGER ENTRIES LIST (CASH TRANSACTIONS REGISTRY) */}
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#a0a5bc] mb-2">Simulated Bank & Brokerage Ledger Statement</h4>
            {ledgerEntries.length === 0 ? (
              <p className="text-xs font-mono text-[#5e657e] italic text-center py-4">No logged entries.</p>
            ) : (
              <div className="overflow-x-auto max-h-[220px] overflow-y-auto pr-1">
                <table className="w-full text-left font-mono text-[11px] text-[#d1d5db]">
                  <thead>
                    <tr className="bg-[#0f111a] text-[#8087a3] border-b border-[#2d303f] text-[9px] uppercase font-bold tracking-wider">
                      <th className="p-2.5 rounded-l-lg">ID</th>
                      <th className="p-2.5">Date & Time</th>
                      <th className="p-2.5">Ticker Ref</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">Transaction Particulars</th>
                      <th className="p-2.5 text-right">Debit/Credit Amount</th>
                      <th className="p-2.5 text-right rounded-r-lg">Post Running Cash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2d303f]/40">
                    {ledgerEntries.map((ent, i) => {
                      const isCredit = ent.action === "CREDIT";
                      return (
                        <tr key={`${ent.id}-${i}`} className="hover:bg-[#1b1c25]/30 transition-colors">
                          <td className="p-2.5 font-bold text-white text-[10px]">{ent.id}</td>
                          <td className="p-2.5 text-[#8087a3]">{ent.timestamp}</td>
                          <td className="p-2.5 font-bold text-gray-300">{ent.ticker}</td>
                          <td className="p-2.5">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${isCredit ? "bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E]" : "bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444]"}`}>
                              {ent.action}
                            </span>
                          </td>
                          <td className="p-2.5 text-[#a0a5bc]">{ent.particulars}</td>
                          <td className={`p-2.5 text-right font-bold ${isCredit ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
                            {isCredit ? "+" : "-"}₹{ent.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-2.5 text-right text-white font-semibold">
                            ₹{ent.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* MODULE 2: DP SR (DETAILS OF SHARE HELD) */}
          <section className="bg-[#14161f] border border-[#242731] rounded-2xl p-5 shadow-lg" id="vvm-dp-sr-holdings">
            <div className="border-b border-[#2d303f] pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#22C55E]"></span>
                  <h3 className="text-sm font-mono font-bold tracking-wider text-white uppercase">
                    DP SR (Details of Share Held)
                  </h3>
                </div>
                <p className="text-[10px] text-[#8087a3] font-mono mt-0.5">Depository Participant holding summary logged to CDSL/NSDL accounts</p>
              </div>
              <div className="text-right text-xs font-mono">
                <span className="text-[#8087a3] block text-[9px] uppercase font-bold">TOTAL PORTFOLIO HELD VALUATION</span>
                {(() => {
                  let totalVal = 0;
                  positions.forEach(pos => {
                    const matchObj = tickerObjects.find(t => t.ticker === pos.ticker);
                    const livePrice = matchObj ? matchObj.price : pos.avgPrice;
                    totalVal += livePrice * pos.quantity;
                  });
                  return (
                    <span className="text-white font-extrabold text-base tracking-wide">
                      ₹{totalVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  );
                })()}
              </div>
            </div>

            {positions.length === 0 ? (
              <div className="text-center py-8 bg-[#0f111a]/40 border border-[#242731] rounded-xl p-6">
                <AlertOctagon size={20} className="text-[#a0a5bc] mx-auto opacity-50 mb-2" />
                <h4 className="text-xs font-mono text-white font-bold uppercase tracking-wider">No Active Demat Shares Held (DP SR Empty)</h4>
                <p className="text-[10px] text-[#8087a3] font-mono mt-1">Use the BUY trade cards above to simulated-dispatch scrips to your DP held system.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs text-[#d1d5db]">
                  <thead>
                    <tr className="bg-[#0f111a] text-[#8087a3] border-b border-[#2d303f] text-[10px] uppercase font-bold tracking-wider">
                      <th className="p-3.5 rounded-l-lg">Scrip Ticker</th>
                      <th className="p-3.5">Demat Origin</th>
                      <th className="p-3.5 text-right">Shares Volume</th>
                      <th className="p-3.5 text-right">Avg Buy Price</th>
                      <th className="p-3.5 text-right">Current quote</th>
                      <th className="p-3.5 text-right">Market value</th>
                      <th className="p-3.5 text-right">Demat Profits/Loss (P&L)</th>
                      <th className="p-3.5 text-center rounded-r-lg">DP Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2d303f]/50">
                    {positions.map((pos, idx) => {
                      const matchObj = tickerObjects.find(t => t.ticker === pos.ticker);
                      const livePrice = matchObj ? matchObj.price : pos.avgPrice;
                      const pnl = (livePrice - pos.avgPrice) * pos.quantity;
                      const pnlPct = ((livePrice - pos.avgPrice) / pos.avgPrice) * 100;
                      const currentValue = livePrice * pos.quantity;
                      const isPnLPositive = pnl >= 0;

                      return (
                        <tr key={`${pos.ticker}-${pos.type}-${idx}`} className="hover:bg-[#1b1c25]/50 transition-colors">
                          <td className="p-3.5">
                            <div className="flex flex-col">
                              <span className="font-extrabold text-white text-xs">{pos.ticker}</span>
                              <span className="text-[9px] text-[#8087a3] font-sans truncate max-w-[130px]">{pos.name}</span>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className="bg-[#E21E26]/10 border border-[#E21E26]/20 text-[#E21E26] px-1.5 py-0.5 rounded text-[9px] font-bold">
                              DP-CDSL
                            </span>
                          </td>
                          <td className="p-3.5 text-right font-bold text-white">
                            {pos.quantity}
                          </td>
                          <td className="p-3.5 text-right text-[#a0a5bc]">
                            ₹{pos.avgPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-3.5 text-right text-[#22C55E] font-semibold">
                            ₹{livePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-3.5 text-right font-bold text-white">
                            ₹{currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className={`p-3.5 text-right font-extrabold ${isPnLPositive ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
                            <div className="flex flex-col items-end">
                              <span>{isPnLPositive ? "+" : ""}₹{pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              <span className="text-[9px] font-bold">({isPnLPositive ? "+" : ""}{pnlPct.toFixed(2)}%)</span>
                            </div>
                          </td>
                          <td className="p-3.5 text-center">
                            <div className="inline-flex gap-1.5 justify-center">
                              <button
                                onClick={() => {
                                  const scripEntity = matchObj || {
                                    ticker: pos.ticker,
                                    name: pos.name,
                                    price: pos.avgPrice,
                                    prevPrice: pos.avgPrice,
                                    high: pos.avgPrice * 1.01,
                                    low: pos.avgPrice * 0.99,
                                    change: 0,
                                    rsi: 50,
                                    ema: pos.avgPrice,
                                    signal: "⚖ Neutral",
                                    volatility: 1,
                                    risk: "Low",
                                    preds: null,
                                    confidence: null,
                                    slope: null,
                                    currencyPrefix: "₹",
                                    history: []
                                  };
                                  handleOpenTradeDialog(scripEntity as TickerData, "BUY");
                                }}
                                className="bg-[#22C55E]/15 hover:bg-[#22C55E]/25 text-[#22C55E] px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer"
                              >
                                BUY MORE
                              </button>
                              <button
                                onClick={() => {
                                  const scripEntity = matchObj || {
                                    ticker: pos.ticker,
                                    name: pos.name,
                                    price: pos.avgPrice,
                                    prevPrice: pos.avgPrice,
                                    high: pos.avgPrice * 1.01,
                                    low: pos.avgPrice * 0.99,
                                    change: 0,
                                    rsi: 50,
                                    ema: pos.avgPrice,
                                    signal: "⚖ Neutral",
                                    volatility: 1,
                                    risk: "Low",
                                    preds: null,
                                    confidence: null,
                                    slope: null,
                                    currencyPrefix: "₹",
                                    history: []
                                  };
                                  handleOpenTradeDialog(scripEntity as TickerData, "SELL");
                                }}
                                className="bg-[#EF4444]/15 hover:bg-[#EF4444]/25 text-[#EF4444] px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer"
                              >
                                SELL OUT
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* MODULE 3: ORDER PLACED RECORD WITH STATUS (PENDING, EXECUTED, CANCELLED) */}
          <section className="bg-[#14161f] border border-[#242731] rounded-2xl p-5 shadow-lg animate-fadeIn" id="vvm-orders-queue-panel">
            <div className="border-b border-[#2d303f] pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                  <h3 className="text-sm font-mono font-bold tracking-wider text-white uppercase">
                    Order Book & Execution Records
                  </h3>
                </div>
                <p className="text-[10px] text-[#8087a3] font-mono mt-0.5">Status dashboard tracking (Pending, Executed, Cancelled) states</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const pendingOrders = orders.filter(o => o.status === "PENDING");
                    if (pendingOrders.length === 0) {
                      setErrorMessage("No pending orders found to trigger auto-simulation.");
                      setTimeout(() => setErrorMessage(""), 3000);
                      return;
                    }
                    pendingOrders.forEach(o => handleForceTriggerOrder(o.id));
                  }}
                  className="bg-[#22C55E]/15 hover:bg-[#22C55E]/25 border border-[#22C55E]/40 text-[#22C55E] px-2.5 py-1 text-[10px] rounded font-bold transition font-mono uppercase"
                  title="Simulate triggers on all target limit pending orders"
                >
                  ⚡ TRIGGER ALL PENDING
                </button>
                <button
                  type="button"
                  onClick={() => setOrders([])}
                  className="bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/30 text-[#EF4444] px-2.5 py-1 text-[10px] rounded font-bold transition font-mono uppercase"
                  title="Clear order queue table completely"
                >
                  CLEAR ORDER ARCHIVE
                </button>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-[#2d303f] rounded-xl p-5">
                <p className="text-xs text-[#a0a5bc] font-mono italic">No simulated order requests recorded in session log.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs text-[#d1d5db]">
                  <thead>
                    <tr className="bg-[#0f111a] text-[#8087a3] border-b border-[#2d303f] text-[10px] uppercase font-bold tracking-wider">
                      <th className="p-3 rounded-l-lg">Order ID</th>
                      <th className="p-3">Scrip Ticker</th>
                      <th className="p-3">Trade</th>
                      <th className="p-3">Type</th>
                      <th className="p-3 text-right">Volume</th>
                      <th className="p-3 text-right">Trigger Target</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3">Timestamp Log</th>
                      <th className="p-3 text-center rounded-r-lg">Test Sim Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2d303f]/50">
                    {orders.map((ord, idx) => {
                      const isPending = ord.status === "PENDING";
                      const isExecuted = ord.status === "EXECUTED";
                      const isCancelled = ord.status === "CANCELLED";

                      return (
                        <tr key={`${ord.id}-${ord.status}-${idx}`} className="hover:bg-[#1b1c25]/50 transition-colors">
                          <td className="p-3 text-[#a0a5bc] font-bold text-xs">{ord.id}</td>
                          <td className="p-3">
                            <div className="flex flex-col">
                              <span className="font-extrabold text-white text-xs">{ord.ticker}</span>
                              <span className="text-[8px] text-[#5e657e] truncate max-w-[100px]">{ord.name}</span>
                            </div>
                          </td>
                          <td className="p-3 text-xs">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${ord.type === "BUY" ? "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/25" : "bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/25"}`}>
                              {ord.type}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="text-[#a0a5bc] text-[10px]">{ord.mode}</span>
                          </td>
                          <td className="p-3 text-right font-bold text-white">{ord.quantity}</td>
                          <td className="p-3 text-right text-gray-300">
                            ₹{ord.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-center">
                            {isPending && (
                              <span className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded text-[10px] font-black uppercase">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping shrink-0"></span>
                                PENDING
                              </span>
                            )}
                            {isExecuted && (
                              <span className="inline-flex items-center gap-1.5 bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] px-2 py-0.5 rounded text-[10px] font-black uppercase">
                                EXECUTED
                              </span>
                            )}
                            {isCancelled && (
                              <span className="inline-flex items-center gap-1.5 bg-rose-500/15 border border-rose-500/30 text-rose-400 px-2 py-0.5 rounded text-[10px] font-black uppercase">
                                CANCELLED
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-[#8087a3] text-[10px]">{ord.timestamp}</td>
                          <td className="p-3 text-center">
                            {isPending ? (
                              <div className="inline-flex gap-1 justify-center">
                                <button
                                  type="button"
                                  onClick={() => handleForceTriggerOrder(ord.id)}
                                  className="bg-amber-500/20 hover:bg-amber-500 text-white border border-amber-500/40 hover:border-amber-500 px-2 py-0.5 rounded text-[9px] font-bold transition font-mono uppercase cursor-pointer"
                                  title="Force trade-trigger limit constraint execution"
                                >
                                  ⚡ EXECUTE
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCancelPendingOrder(ord.id)}
                                  className="bg-[#EF4444]/15 hover:bg-[#EF4444] text-[#EF4444] hover:text-white border border-[#EF4444]/30 px-2 py-0.5 rounded text-[9px] font-bold transition font-mono uppercase cursor-pointer"
                                  title="Revoke and cancel order placement request"
                                >
                                  ✕ CANCEL
                                </button>
                              </div>
                            ) : (
                              <span className="text-[#5e657e] text-[9px] font-mono italic">Archived</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

        </div>
      </main>

      {/* FOOTER METADATA */}
      <footer className="border-t border-[#242731] bg-[#14161f] py-6 mt-12 text-center text-[10px] text-[#5e657e] font-mono relative z-20">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-bold">VVM Trading Terminal • Authorized Broker Station Access Code 409X</p>
          <p className="text-[9px] text-[#5e657e]">Forecast models are powered by standard ordinary least squares linear regressions computed over a 40-day asset timeframe. Dynamic updates powered by Gemini Models.</p>
        </div>
      </footer>

      {/* SIDE DRAWER ELEMENT FOR VVM RESEARCH INTERCOM */}
      <AnimatePresence>
        {activeBriefingTicker && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end" id="ai-briefing-drawer-overlay">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.55 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveBriefingTicker(null)}
              className="absolute inset-0 bg-black"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 24, stiffness: 210 }}
              className="relative w-full max-w-2xl h-full bg-[#14161f] border-l border-[#242731] shadow-2xl flex flex-col justify-between"
              id="ai-briefing-drawer"
            >
              
              <div className="p-4 border-b border-[#242731] flex justify-between items-center bg-[#181a21]">
                <div className="flex items-center gap-2.5">
                  <div className="h-2 w-2 rounded-full bg-[#E21E26] animate-ping"></div>
                  <div>
                    <h3 className="text-sm font-bold tracking-wider font-mono uppercase text-white flex items-center gap-1.5">
                      <Sparkles size={12} className="text-[#E21E26]" /> VVM Securities Advisory Desk
                    </h3>
                    <p className="text-[9px] text-[#8087a3] font-mono uppercase tracking-wider">{activeBriefingTicker.ticker} — {activeBriefingTicker.name}</p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveBriefingTicker(null)}
                  className="text-[#8087a3] hover:text-white bg-[#0f111a] border border-[#2d303f] hover:border-[#E21E26] p-1.5 rounded-lg transition-all"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-5 space-y-6">
                
                {/* Visual Chart */}
                <PanoramicChart 
                  history={activeBriefingTicker.history} 
                  preds={activeBriefingTicker.preds} 
                  currencyPrefix={activeBriefingTicker.currencyPrefix}
                  name={activeBriefingTicker.name}
                />

                {/* Key parameters overview metric boxes */}
                <div className="bg-[#0f111a] border border-[#242731] rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center font-mono">
                  <div className="p-1">
                    <span className="text-[8px] text-[#8087a3] uppercase font-bold">Spot Quote</span>
                    <p className="text-sm font-bold text-white mt-0.5">
                      {activeBriefingTicker.currencyPrefix}{activeBriefingTicker.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-1">
                    <span className="text-[8px] text-[#8087a3] uppercase font-bold">RSI (14) Indicator</span>
                    <p className={`text-sm font-bold mt-0.5 ${activeBriefingTicker.rsi < 35 ? "text-[#22C55E]" : activeBriefingTicker.rsi > 65 ? "text-[#EF4444]" : "text-white"}`}>
                      {activeBriefingTicker.rsi.toFixed(1)}
                    </p>
                  </div>
                  <div className="p-1">
                    <span className="text-[8px] text-[#8087a3] uppercase font-bold">OLS Regression Slope</span>
                    <p className={`text-sm font-bold mt-0.5 ${activeBriefingTicker.slope && activeBriefingTicker.slope > 0 ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
                      {activeBriefingTicker.slope ? activeBriefingTicker.slope.toFixed(4) : "N/A"}
                    </p>
                  </div>
                  <div className="p-1">
                    <span className="text-[8px] text-[#8087a3] uppercase font-bold">Model Confidence</span>
                    <p className="text-sm font-bold text-[#22C55E] mt-0.5">
                      {activeBriefingTicker.confidence ? `${(activeBriefingTicker.confidence * 100).toFixed(0)}%` : "N/A"}
                    </p>
                  </div>
                </div>

                {/* Advisory feed text from server */}
                <div className="bg-[#0f111a] border border-[#242731] rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-[#2d303f] pb-3">
                    <Sparkles size={14} className="text-[#E21E26] animate-pulse" />
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">VVM SECURITIES EXECUTIVE INTRODUCTORY SUMMARY</span>
                  </div>

                  {fetchingAnalysis ? (
                    <div className="space-y-3 py-4">
                      <div className="h-3.5 bg-[#232634] rounded w-full animate-pulse"></div>
                      <div className="h-3.5 bg-[#232634] rounded w-11/12 animate-pulse"></div>
                      <div className="h-3.5 bg-[#232634] rounded w-5/6 animate-pulse"></div>
                    </div>
                  ) : (
                    <div className="text-white text-xs font-sans leading-relaxed space-y-4 whitespace-pre-line select-text font-medium">
                      {aiAnalysisText}
                    </div>
                  )}

                  <div className="p-3 bg-[#EF4444]/5 border border-[#EF4444]/15 rounded-xl text-[9px] font-mono text-[#EF4444] flex items-start gap-2">
                    <Info size={12} className="shrink-0 mt-0.5" />
                    <span>Advisory briefings are derived through computational algorithms and generative models. Investing on leverage carries high capital risk. Make decisions carefully.</span>
                  </div>
                </div>

                {/* Advisory chat box */}
                <div className="border border-[#242731] bg-[#0f111a]/80 rounded-xl overflow-hidden flex flex-col h-[320px]">
                  
                  <div className="bg-[#181a21] text-[#a0a5bc] border-b border-[#2d303f] px-4 py-2 flex items-center gap-2">
                    <MessageSquare size={12} className="text-[#E21E26]" />
                    <span className="font-mono text-[9px] uppercase tracking-wider font-bold">Interactive Research Desk Intercom</span>
                  </div>

                  <div className="flex-grow p-4 overflow-y-auto space-y-3 text-xs font-sans">
                    {analystChat.map((msg, index) => (
                      <div 
                        key={index} 
                        className={`flex flex-col max-w-[85%] ${msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"}`}
                      >
                        <div className={`p-3 rounded-xl whitespace-pre-line leading-relaxed ${
                          msg.sender === "user" 
                            ? "bg-[#E21E26] text-white font-semibold rounded-br-none" 
                            : "bg-[#1c1d26] border border-[#2d303f] text-white rounded-bl-none"
                        }`}>
                          {msg.text}
                        </div>
                        <span className="text-[8px] text-[#5e657e] font-mono mt-1 px-1">{msg.timestamp}</span>
                      </div>
                    ))}
                    {sendingMessage && (
                      <div className="flex flex-col mr-auto max-w-[80%] items-start">
                        <div className="bg-[#1c1d26] border border-[#2d303f] p-3 rounded-xl rounded-bl-none flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce"></span>
                          <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce delay-100"></span>
                          <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce delay-200"></span>
                          <span className="text-[9px] text-[#8087a3] font-mono ml-2">Assembling professional recommendations...</span>
                        </div>
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  <form onSubmit={handleSendChatMessage} className="p-2 border-t border-[#242731] bg-[#14161f] flex gap-2">
                    <input
                      type="text"
                      placeholder={`Inquire pricing targets or stops for ${activeBriefingTicker.ticker}...`}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      disabled={sendingMessage}
                      className="flex-grow bg-[#0f111a] border border-[#242731] focus:border-[#E21E26] rounded-lg px-3 py-2 text-xs focus:outline-none placeholder:text-[#5e657e] text-white font-mono"
                    />
                    <button
                      type="submit"
                      disabled={sendingMessage || !chatInput.trim()}
                      className="bg-[#E21E26] hover:bg-[#c2141a] text-white disabled:opacity-40 p-2 rounded-lg transition-all shrink-0 cursor-pointer"
                    >
                      <Send size={13} />
                    </button>
                  </form>
                </div>

              </div>

              <div className="p-4 border-t border-[#242731] bg-[#181a21] flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveBriefingTicker(null)}
                  className="bg-[#1c1d26] hover:bg-[#282a3a] border border-[#2d303f] text-[#d1d5db] font-mono text-xs px-4 py-2 rounded-lg transition-all cursor-pointer"
                >
                  DISMISS TERMINAL VIEW
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TRADING TERMINAL BUY AND SELL POPUP MODAL */}
      <AnimatePresence>
        {selectedTradeTicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 overflow-y-auto" id="trade-modal-overlay">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ ease: "easeInOut", duration: 0.2 }}
              className="relative w-full max-w-lg bg-[#14161f] border border-[#2d303f] rounded-2xl shadow-2xl overflow-hidden flex flex-col font-mono"
              id="trade-modal"
            >
              
              {/* Header */}
              <div className="p-4 bg-[#181a21] border-b border-[#2d303f] flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#E21E26] animate-pulse"></span>
                  <div>
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                      VVM Securities Trade Hub
                    </h3>
                    <p className="text-[9px] text-[#8087a3] uppercase">Authorized multi-asset execution desk</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedTradeTicker(null);
                    setTradeType(null);
                  }}
                  className="text-[#8087a3] hover:text-white bg-[#0f111a] border border-[#2d303f] hover:border-[#E21E26] p-1.5 rounded-lg transition cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4 text-left">
                
                {/* Ticker Banner */}
                <div className="flex items-start justify-between bg-[#0f111a] border border-[#242731] rounded-xl p-4">
                  <div>
                    <span className="text-xs text-[#8087a3] block font-bold leading-none mb-1">SCRIP CODE</span>
                    <span className="text-lg font-extrabold text-white tracking-tight">{selectedTradeTicker.ticker}</span>
                    <p className="text-[10px] text-[#a0a5bc] mt-0.5 font-sans leading-tight">{selectedTradeTicker.name}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#8087a3] block font-bold font-mono">CURRENT SPOT PRICE</span>
                    <span className="text-lg font-bold text-white block">
                      {selectedTradeTicker.currencyPrefix}{selectedTradeTicker.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className={`inline-block text-[10px] font-bold ${selectedTradeTicker.change >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
                      {selectedTradeTicker.change >= 0 ? "▲ +" : "▼ "}{selectedTradeTicker.change.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Day's Range Stats block */}
                <div className="grid grid-cols-2 bg-[#0f111a]/40 border border-[#242731] rounded-lg p-3.5 gap-4">
                  <div className="space-y-0.5">
                    <span className="text-[8px] text-[#8087a3] block uppercase font-bold tracking-wider">DAYS HIGH</span>
                    <span className="text-white font-semibold text-xs flex items-center gap-1">
                      <TrendingUp size={11} className="text-[#22C55E]" />
                      {selectedTradeTicker.currencyPrefix}{(selectedTradeTicker.high || selectedTradeTicker.price * 1.01).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="space-y-0.5 border-l border-[#2d303f] pl-4">
                    <span className="text-[8px] text-[#8087a3] block uppercase font-bold tracking-wider">DAYS LOW</span>
                    <span className="text-white font-semibold text-xs flex items-center gap-1">
                      <TrendingDown size={11} className="text-[#EF4444]" />
                      {selectedTradeTicker.currencyPrefix}{(selectedTradeTicker.low || selectedTradeTicker.price * 0.99).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Days gain or daily loss explicitly detailed */}
                {(() => {
                  const absoluteChange = selectedTradeTicker.price - (selectedTradeTicker.prevPrice || selectedTradeTicker.price * 0.97);
                  const isGain = absoluteChange >= 0;
                  const valueStr = Math.abs(absoluteChange).toLocaleString(undefined, { minimumFractionDigits: 2 });
                  return (
                    <div className="grid grid-cols-2 gap-3">
                      <div className={`p-2.5 rounded-lg border text-center transition-all ${
                        isGain ? "bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]" : "bg-[#22C55E]/2 border-[#2d303f] text-[#5e657e] opacity-40"
                      }`}>
                        <span className="text-[8px] block font-extrabold uppercase">TODAYS GAIN</span>
                        <p className="text-xs font-bold mt-0.5">
                          {isGain ? `+${selectedTradeTicker.currencyPrefix}${valueStr}` : "--"}
                        </p>
                      </div>
                      <div className={`p-2.5 rounded-lg border text-center transition-all ${
                        !isGain ? "bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]" : "bg-[#EF4444]/2 border-[#2d303f] text-[#5e657e] opacity-40"
                      }`}>
                        <span className="text-[8px] block font-extrabold uppercase">TODAYS LOSS</span>
                        <p className="text-xs font-bold mt-0.5">
                          {!isGain ? `-${selectedTradeTicker.currencyPrefix}${valueStr}` : "--"}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Primary Action selector: Buy / Sell buttons */}
                <div>
                  <label className="block text-[10px] text-[#8087a3] font-bold uppercase mb-2">
                    Action Selection
                  </label>
                  <div className="grid grid-cols-2 gap-3.5">
                    <button
                      type="button"
                      onClick={() => setTradeType("BUY")}
                      className={`py-3 rounded-xl font-bold uppercase tracking-wider border cursor-pointer transition text-xs ${
                        tradeType === "BUY"
                          ? "bg-[#22C55E] text-white border-[#22C55E] shadow-lg shadow-[#22C55E]/15"
                          : "bg-transparent border-[#22C55E]/40 hover:bg-[#22C55E]/10 text-[#22C55E]"
                      }`}
                    >
                      BUY SHARES
                    </button>
                    <button
                      type="button"
                      onClick={() => setTradeType("SELL")}
                      className={`py-3 rounded-xl font-bold uppercase tracking-wider border cursor-pointer transition text-xs ${
                        tradeType === "SELL"
                          ? "bg-[#EF4444] text-white border-[#EF4444] shadow-lg shadow-[#EF4444]/15"
                          : "bg-transparent border-[#EF4444]/40 hover:bg-[#EF4444]/10 text-[#EF4444]"
                      }`}
                    >
                      SELL SHARES
                    </button>
                  </div>
                </div>

                {/* CONDITIONAL TRADING BLOCK APPEARS BELOW ONCE ACTION IS ACTIVE */}
                {tradeType && (
                  <motion.form 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="border-t border-[#2d303f] pt-4.5 space-y-4"
                    onSubmit={handleExecuteTrade}
                  >
                    
                    <div className="bg-[#181a21] border border-[#2d303f]/80 rounded-xl p-3.5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-[#a0a5bc] font-bold uppercase tracking-wider flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${tradeType === "BUY" ? "bg-[#22C55E]" : "bg-[#EF4444]"}`}></span>
                          {tradeType} SYSTEM ORDER PARAMETERS
                        </span>
                        <div className="flex gap-1.5">
                          {["MARKET", "LIMIT", "TRIGGER"].map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setTradeOrderMode(m as any)}
                              className={`px-2 py-0.5 text-[8px] font-bold rounded border transition uppercase cursor-pointer ${
                                tradeOrderMode === m
                                  ? tradeType === "BUY"
                                    ? "bg-[#22C55E] text-white border-[#22C55E]"
                                    : "bg-[#EF4444] text-white border-[#EF4444]"
                                  : "bg-[#090a0f] border-[#2d303f] text-[#8087a3] hover:text-white"
                              }`}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Quantum values input */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[8px] uppercase text-[#8087a3] font-bold">Qty Shares</label>
                          <div className="relative flex items-center bg-[#090a0f] border border-[#2d303f] rounded-lg">
                            <button
                              type="button"
                              onClick={() => setTradeQty(prev => Math.max(1, prev - 1))}
                              className="px-2 py-1.5 text-xs text-[#8087a3] hover:text-white cursor-pointer"
                            >
                              -
                            </button>
                            <input
                              type="text"
                              value={tradeQty}
                              onChange={(e) => setTradeQty(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-full text-center bg-transparent border-none text-white text-xs font-bold leading-none py-1 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setTradeQty(prev => prev + 1)}
                              className="px-2 py-1.5 text-xs text-[#8087a3] hover:text-white cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                          
                          {/* Qty quick shortcuts */}
                          <div className="flex justify-between gap-1 mt-1">
                            {[5, 10, 50, 100].map((step) => (
                              <button
                                key={step}
                                type="button"
                                onClick={() => {
                                  setTradeQty(step);
                                }}
                                className="flex-1 bg-[#14161f] border border-[#2d303f]/50 hover:border-white/20 hover:bg-[#20222f] text-[8px] font-bold py-0.5 rounded text-[#8087a3] cursor-pointer"
                              >
                                {step}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Order price input depending on mode */}
                        <div className="space-y-1">
                          <label className="block text-[8px] uppercase text-[#8087a3] font-bold">
                            {tradeOrderMode === "MARKET" ? "Spot Price" : `${tradeType} Limit Price`}
                          </label>
                          <input
                            type="text"
                            value={tradeOrderMode === "MARKET" ? selectedTradeTicker.price.toFixed(2) : tradePriceInput}
                            disabled={tradeOrderMode === "MARKET"}
                            onChange={(e) => setTradePriceInput(e.target.value)}
                            className={`w-full bg-[#090a0f] border border-[#2d303f] rounded-lg p-2.5 text-center text-xs font-bold font-mono focus:outline-none focus:border-[#E21E26] ${
                              tradeOrderMode === "MARKET" ? "text-white/50 cursor-not-allowed opacity-60" : "text-white"
                            }`}
                          />
                        </div>
                      </div>

                      {/* Trigger Price Field block appeared when TRIGGER is clicked */}
                      {tradeOrderMode === "TRIGGER" && (
                        <div className="space-y-1 border-t border-[#2d303f]/60 pt-2 animate-fadeIn">
                          <label className="block text-[8px] uppercase text-[#EF4444] font-bold flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-[#EF4444]"></span>
                            Active Stop-Trigger Price
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={tradeTriggerPriceInput}
                              onChange={(e) => setTradeTriggerPriceInput(e.target.value)}
                              placeholder="Execution trigger price value"
                              className="w-full bg-[#090a0f] border border-[#EF4444]/40 hover:border-[#EF4444] rounded-lg p-2 text-xs font-bold text-center text-[#EF4444] font-mono focus:outline-none"
                            />
                            <p className="text-[7.5px] text-[#8087a3] text-center mt-0.5 font-mono">
                              System triggers trading sequence once Spot crosses above/below Trigger Price
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Cost projection and transaction ledger stats */}
                    <div className="bg-[#0f111a] border border-[#242731] rounded-xl p-3.5 space-y-1.5 text-xs text-left">
                      <div className="flex justify-between text-[#8087a3] text-[10px]">
                        <span>Simulated shares valuation:</span>
                        <span className="text-white font-bold">
                          {selectedTradeTicker.currencyPrefix}
                          {(() => {
                            const p = tradeOrderMode === "MARKET" ? selectedTradeTicker.price : parseFloat(tradePriceInput) || 0;
                            return (p * tradeQty).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                          })()}
                        </span>
                      </div>
                      <div className="border-t border-[#2d303f] pt-1.5 flex justify-between font-bold text-[#d1d5db]">
                        <span>Trading Account Balance:</span>
                        <span>
                          ₹{accountBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {/* Execution Button */}
                    <button
                      type="submit"
                      className={`w-full py-3.5 rounded-xl font-bold font-mono tracking-wider text-xs transition duration-200 uppercase cursor-pointer shadow-lg text-white ${
                        tradeType === "BUY"
                          ? "bg-[#22C55E] hover:bg-[#16a34a] shadow-[#22C55E]/10"
                          : "bg-[#EF4444] hover:bg-[#dc2626] shadow-[#EF4444]/10"
                      }`}
                    >
                      Execute simulated {tradeType} order
                    </button>

                  </motion.form>
                )}

              </div>

              {/* Footer info warning */}
              <div className="p-3 bg-[#181a21] border-t border-[#2d303f] text-center text-[8.5px] text-[#5e657e] tracking-wider uppercase">
                Virtual execution desk • Zero real risk • Simulated broker station
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
