import React, { useState } from 'react';
import {
  Code2,
  X,
  Copy,
  Check,
  Server,
  Zap,
  Radio,
  FileCode2,
  ChevronRight
} from 'lucide-react';

interface TerminalApiDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TerminalApiDocsModal: React.FC<TerminalApiDocsModalProps> = ({ isOpen, onClose }) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<'calculate' | 'prices' | 'ocr' | 'history'>('calculate');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const endpoints = [
    {
      id: 'calculate',
      method: 'POST',
      path: '/api/greeks/calculate',
      title: 'Calculate Option Greeks',
      desc: 'Computes institutional Black-76 / Black-Scholes Delta, Gamma, Theta, Vega, Rho, and POP.',
      curl: `curl -X POST https://api.commoditygreeks.pro/v1/greeks/calculate \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <API_KEY>" \\
  -d '{
    "commodity": "CRUDEOIL",
    "spotPrice": 6240,
    "strikePrice": 6300,
    "volatility": 28.5,
    "expiryDays": 14,
    "interestRate": 6.5,
    "optionType": "CALL",
    "model": "BLACK_76"
  }'`,
      response: `{
  "status": "success",
  "data": {
    "price": 142.80,
    "delta": 0.472,
    "gamma": 0.00118,
    "theta": -8.45,
    "vega": 9.32,
    "rho": 1.14,
    "pop": 46.8,
    "breakeven": 6442.80,
    "intrinsicValue": 0,
    "timeValue": 142.80
  }
}`
    },
    {
      id: 'prices',
      method: 'GET',
      path: '/api/mcx/live-prices',
      title: 'MCX Real-Time Spot Prices',
      desc: 'Fetches low-latency underlying spot prices, 24h change, high/low for active MCX contracts.',
      curl: `curl -X GET "https://api.commoditygreeks.pro/v1/mcx/live-prices?symbols=GOLD,SILVER,CRUDEOIL,NATURALGAS" \\
  -H "Authorization: Bearer <API_KEY>"`,
      response: `{
  "status": "success",
  "timestamp": "2026-09-21T18:45:03Z",
  "data": [
    { "symbol": "GOLD", "price": 72450, "change": 320, "changePercent": 0.44, "high": 72680, "low": 72120 },
    { "symbol": "CRUDEOIL", "price": 6240, "change": -45, "changePercent": -0.72, "high": 6315, "low": 6210 },
    { "symbol": "NATURALGAS", "price": 228.4, "change": 3.8, "changePercent": 1.69, "high": 231.2, "low": 223.5 }
  ]
}`
    },
    {
      id: 'ocr',
      method: 'POST',
      path: '/api/ocr/parse-chain',
      title: 'Option Chain Screenshot Extraction',
      desc: 'Ingests broker mobile screenshot and extracts strikes, implied volatility, LTP, and OI.',
      curl: `curl -X POST https://api.commoditygreeks.pro/v1/ocr/parse-chain \\
  -H "Authorization: Bearer <API_KEY>" \\
  -F "image=@zerodha_crude_chain.png" \\
  -F "commodity=CRUDEOIL"`,
      response: `{
  "status": "success",
  "confidence": 0.994,
  "detectedSpot": 6240,
  "strikes": [
    { "strike": 6200, "callLtp": 168.0, "callIv": 28.2, "putLtp": 128.5, "putIv": 28.9 },
    { "strike": 6250, "callLtp": 139.5, "callIv": 28.5, "putLtp": 149.0, "putIv": 28.6 },
    { "strike": 6300, "callLtp": 114.0, "callIv": 28.8, "putLtp": 173.5, "putIv": 28.4 }
  ]
}`
    },
    {
      id: 'history',
      method: 'GET',
      path: '/api/history',
      title: 'Query Calculation History',
      desc: 'Retrieves MongoDB-persisted option calculations, audit records, and scenario logs.',
      curl: `curl -X GET "https://api.commoditygreeks.pro/v1/history?limit=25&commodity=GOLD" \\
  -H "Authorization: Bearer <API_KEY>"`,
      response: `{
  "status": "success",
  "total": 142,
  "records": [
    {
      "_id": "66f0a12e8b...",
      "commodity": "GOLD",
      "strike": 72500,
      "optionType": "CE",
      "delta": 0.491,
      "premium": 1120.50,
      "createdAt": "2026-09-21T18:30:00Z"
    }
  ]
}`
    }
  ];

  const current = endpoints.find((e) => e.id === selectedEndpoint) || endpoints[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#F8FAFC] dark:bg-[#08111F] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#0EA5E9]/10 border border-[#0EA5E9]/30 flex items-center justify-center text-[#0EA5E9]">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white font-mono uppercase tracking-wider">
                  REST & WebSocket API Developer Docs
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#0EA5E9]/10 text-[#0EA5E9] font-bold border border-[#0EA5E9]/30">
                  v1.0.0
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Integrate institutional MCX Black-76 Greeks into algos and backtesters
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar + Main API Area */}
        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
          {/* Endpoint List */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/40 p-3 space-y-1.5 overflow-y-auto shrink-0 font-mono text-xs">
            <div className="text-[10px] font-bold text-slate-500 uppercase px-2 py-1">
              Core Endpoints
            </div>
            {endpoints.map((ep) => (
              <button
                key={ep.id}
                onClick={() => setSelectedEndpoint(ep.id as any)}
                className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between ${
                  selectedEndpoint === ep.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-800 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-900/40'
                }`}
              >
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[9px] font-bold px-1 rounded ${
                        ep.method === 'POST'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {ep.method}
                    </span>
                    <span className="text-[11px] truncate">{ep.title}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">{ep.path}</div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-50 shrink-0" />
              </button>
            ))}
          </div>

          {/* Details Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 font-mono text-xs">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    current.method === 'POST'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                  }`}
                >
                  {current.method}
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {current.path}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-sans">
                {current.desc}
              </p>
            </div>

            {/* Request cURL */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Example Request (cURL)</span>
                <button
                  onClick={() => handleCopy(current.curl, 'curl')}
                  className="flex items-center gap-1 text-[#0EA5E9] hover:underline cursor-pointer"
                >
                  {copiedKey === 'curl' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span className="text-emerald-500">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3.5 rounded-xl bg-slate-900 text-slate-200 text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
                {current.curl}
              </pre>
            </div>

            {/* JSON Response */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Sample JSON Response (200 OK)</span>
                <button
                  onClick={() => handleCopy(current.response, 'response')}
                  className="flex items-center gap-1 text-[#0EA5E9] hover:underline cursor-pointer"
                >
                  {copiedKey === 'response' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span className="text-emerald-500">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3.5 rounded-xl bg-slate-900 text-emerald-400 text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
                {current.response}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            Rate limit: 100 req/sec per API Key • SSL Required
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
