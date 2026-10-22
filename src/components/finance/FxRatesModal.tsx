import React, { useState, useEffect } from 'react';
import {
  X,
  Coins,
  RefreshCw,
  RotateCcw,
  Check,
  TrendingUp,
  DollarSign,
  Calculator,
  ArrowRightLeft,
  ShieldCheck,
  Sparkles,
  Info,
  Clock,
  User,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CurrencyCode, ExchangeRate } from '../../types';

interface FxRatesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Current realistic market sample rates for auto-fetch simulation
const MARKET_LIVE_RATES: Record<CurrencyCode, number> = {
  USD: 1.0,
  EUR: 0.9235,
  GBP: 0.7842,
  ILS: 3.7315,
  JPY: 154.28,
  AUD: 1.524,
  CAD: 1.3655,
  CHF: 0.8912,
};

export const FxRatesModal: React.FC<FxRatesModalProps> = ({ isOpen, onClose }) => {
  const {
    exchangeRates,
    updateExchangeRate,
    updateMultipleExchangeRates,
    currentUser,
    convertCurrency,
    formatMoney,
  } = useApp();

  // Local draft state for editing rates
  const [draftRates, setDraftRates] = useState<Record<CurrencyCode, number>>(() => {
    const initial: Record<CurrencyCode, number> = {} as Record<CurrencyCode, number>;
    (Object.keys(exchangeRates) as CurrencyCode[]).forEach((code) => {
      initial[code] = exchangeRates[code].rateAgainstUSD;
    });
    return initial;
  });

  // Sync draft rates when modal opens or exchangeRates update
  useEffect(() => {
    if (isOpen) {
      const updated: Record<CurrencyCode, number> = {} as Record<CurrencyCode, number>;
      (Object.keys(exchangeRates) as CurrencyCode[]).forEach((code) => {
        updated[code] = exchangeRates[code].rateAgainstUSD;
      });
      setDraftRates(updated);
      setSuccessToast(null);
    }
  }, [isOpen, exchangeRates]);

  // Converter test state
  const [testAmount, setTestAmount] = useState<number>(1000);
  const [testFromCurrency, setTestFromCurrency] = useState<CurrencyCode>('USD');

  // Status and animation states
  const [isFetchingMarket, setIsFetchingMarket] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>(() => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });

  if (!isOpen) return null;

  const handleRateChange = (code: CurrencyCode, valueStr: string) => {
    const val = parseFloat(valueStr);
    setDraftRates((prev) => ({
      ...prev,
      [code]: isNaN(val) ? 0 : val,
    }));
  };

  const handleNudgeRate = (code: CurrencyCode, deltaPercent: number) => {
    if (code === 'USD') return;
    const current = draftRates[code] || 1;
    const updated = Math.round(current * (1 + deltaPercent / 100) * 10000) / 10000;
    setDraftRates((prev) => ({
      ...prev,
      [code]: updated,
    }));
  };

  const handleFetchMarketRates = () => {
    setIsFetchingMarket(true);
    setTimeout(() => {
      // Simulate live market fluctuation
      const randomized: Record<CurrencyCode, number> = {} as Record<CurrencyCode, number>;
      (Object.keys(MARKET_LIVE_RATES) as CurrencyCode[]).forEach((code) => {
        if (code === 'USD') {
          randomized[code] = 1.0;
        } else {
          const base = MARKET_LIVE_RATES[code];
          // Minor jitter ±0.2%
          const jitter = 1 + (Math.random() * 0.004 - 0.002);
          randomized[code] = Math.round(base * jitter * 10000) / 10000;
        }
      });
      setDraftRates(randomized);
      setIsFetchingMarket(false);
      setSuccessToast('Fetched live institutional market exchange feeds! Click "Save FX Rates" to apply.');
    }, 600);
  };

  const handleResetDefaults = () => {
    const defaults: Record<CurrencyCode, number> = {
      USD: 1.0,
      EUR: 0.92,
      GBP: 0.78,
      ILS: 3.72,
      JPY: 154.5,
      AUD: 1.52,
      CAD: 1.36,
      CHF: 0.89,
    };
    setDraftRates(defaults);
    setSuccessToast('Reset all rates to standard TourOps benchmarks.');
  };

  const handleSaveAll = () => {
    if (updateMultipleExchangeRates) {
      updateMultipleExchangeRates(draftRates);
    } else {
      (Object.keys(draftRates) as CurrencyCode[]).forEach((code) => {
        updateExchangeRate(code, draftRates[code]);
      });
    }

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLastUpdatedTime(nowStr);
    setSuccessToast(`FX exchange rates successfully updated across all modules by ${currentUser?.name || 'Staff'}.`);

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const currencyOrder: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'ILS', 'AUD', 'CAD', 'CHF', 'JPY'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white p-6 sm:p-7 relative border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2.5 mb-2">
            <span className="p-2 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-400">
              <Coins className="w-5 h-5" />
            </span>
            <div className="flex items-center space-x-2 text-xs">
              <span className="font-bold uppercase tracking-wider text-amber-400">
                Staff Multi-Currency Control
              </span>
              <span className="text-slate-500">&bull;</span>
              <span className="flex items-center text-emerald-400 font-semibold gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Conversion Engine
              </span>
            </div>
          </div>

          <h2 className="text-2xl font-bold font-serif-display tracking-tight text-white">
            Manage Foreign Exchange (FX) Rates
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            All staff members can update exchange rates at any time. Changes immediately update all
            cost estimates, client trip invoices, supplier payouts, and multi-currency expense ledger records.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3 pt-3 border-t border-slate-800/80 text-xs text-slate-300">
            <div className="flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Last updated: <strong>{lastUpdatedTime}</strong></span>
            </div>
            <span className="text-slate-600">&bull;</span>
            <div className="flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>Logged by: <strong>{currentUser?.name || 'Staff User'}</strong></span>
            </div>
            <span className="text-slate-600">&bull;</span>
            <span className="text-amber-400 font-semibold">Base Currency: 1.00 USD</span>
          </div>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="bg-emerald-600 text-white px-6 py-2.5 text-xs font-bold flex items-center justify-between shadow-md">
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successToast}</span>
            </div>
            <button
              onClick={() => setSuccessToast(null)}
              className="text-white hover:text-slate-200 text-sm font-black cursor-pointer"
            >
              &times;
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 sm:p-7 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Quick Action Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="text-xs text-slate-600">
              <span className="font-bold text-slate-900 block">Institutional Rate Tools</span>
              <span>Edit individual rates directly below, or sync from institutional benchmarks.</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleFetchMarketRates}
                disabled={isFetchingMarket}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isFetchingMarket ? 'animate-spin' : ''}`} />
                <span>{isFetchingMarket ? 'Fetching Market Feeds...' : 'Fetch Market Rates'}</span>
              </button>

              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Restore default benchmark exchange rates"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Reset Defaults</span>
              </button>
            </div>
          </div>

          {/* Currency Rates Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Official Currency Conversion Pegs (Against USD)
              </h3>
              <span className="text-[11px] text-slate-400">
                Formula: Amount in USD = Amount &divide; Rate
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {currencyOrder.map((code) => {
                const info = exchangeRates[code];
                const currentDraftVal = draftRates[code] ?? info.rateAgainstUSD;
                const isBase = code === 'USD';
                const inverseRate = currentDraftVal > 0 ? (1 / currentDraftVal).toFixed(4) : '0';

                return (
                  <div
                    key={code}
                    className={`p-4 rounded-2xl border transition-all ${
                      isBase
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center ${
                            isBase
                              ? 'bg-amber-500 text-slate-950 font-black'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {info.symbol}
                        </span>
                        <div>
                          <div className={`text-xs font-black ${isBase ? 'text-white' : 'text-slate-900'}`}>
                            {code}
                          </div>
                          <div
                            className={`text-[10px] truncate max-w-[110px] ${
                              isBase ? 'text-slate-400' : 'text-slate-500'
                            }`}
                          >
                            {info.name}
                          </div>
                        </div>
                      </div>

                      {isBase ? (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white">
                          Base Peg
                        </span>
                      ) : (
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => handleNudgeRate(code, -1)}
                            className="px-1.5 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 rounded font-mono font-bold"
                            title="Decrease rate by 1%"
                          >
                            -1%
                          </button>
                          <button
                            type="button"
                            onClick={() => handleNudgeRate(code, 1)}
                            className="px-1.5 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 rounded font-mono font-bold"
                            title="Increase rate by 1%"
                          >
                            +1%
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="mt-3">
                      <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                        isBase ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        1 USD Equals:
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          step="0.0001"
                          min="0.0001"
                          disabled={isBase}
                          value={currentDraftVal}
                          onChange={(e) => handleRateChange(code, e.target.value)}
                          className={`w-full px-3 py-2 rounded-xl text-sm font-bold font-mono transition-all ${
                            isBase
                              ? 'bg-slate-800 text-slate-300 border border-slate-700 cursor-not-allowed select-none'
                              : 'bg-slate-50 text-slate-900 border border-slate-200 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                          }`}
                        />
                        <span className={`absolute right-3 text-xs font-bold font-mono ${
                          isBase ? 'text-slate-500' : 'text-slate-400'
                        }`}>
                          {code}
                        </span>
                      </div>
                    </div>

                    {!isBase && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                        <span>Inverse:</span>
                        <span className="font-mono font-semibold text-slate-700">
                          1 {code} = ${inverseRate} USD
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Currency Conversion Sandbox */}
          <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Calculator className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Live Conversion Test Sandbox
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">
                Preview converted amounts across all currencies simultaneously using current draft pegs
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Sample Amount to Convert
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={testAmount}
                    onChange={(e) => setTestAmount(Number(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-amber-400"
                    placeholder="Enter amount..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  From Currency
                </label>
                <select
                  value={testFromCurrency}
                  onChange={(e) => setTestFromCurrency(e.target.value as CurrencyCode)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-semibold text-sm focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  {currencyOrder.map((code) => (
                    <option key={code} value={code}>
                      {code} &mdash; {exchangeRates[code].name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Converted Output Pill Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              {currencyOrder.map((targetCode) => {
                const rateFrom = draftRates[testFromCurrency] || 1;
                const rateTo = draftRates[targetCode] || 1;
                const inUSD = testAmount / rateFrom;
                const converted = Math.round(inUSD * rateTo * 100) / 100;
                const symbol = exchangeRates[targetCode].symbol;

                return (
                  <div
                    key={targetCode}
                    className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {targetCode}
                      </div>
                      <div className="text-sm font-extrabold text-white font-mono mt-0.5">
                        {symbol}
                        {converted.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    {targetCode === testFromCurrency && (
                      <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-bold uppercase">
                        Source
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Real-time cross-tab & client sync enabled</span>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save &amp; Apply FX Rates</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
