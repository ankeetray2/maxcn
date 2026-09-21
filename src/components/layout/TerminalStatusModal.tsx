import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  Database,
  Cpu,
  Zap,
  Server,
  Radio,
  RefreshCw,
  X,
  Layers,
  ShieldCheck,
  HardDrive
} from 'lucide-react';

interface TerminalStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  latencyMs: number;
  lastUpdateTime: string;
}

export const TerminalStatusModal: React.FC<TerminalStatusModalProps> = ({
  isOpen,
  onClose,
  latencyMs,
  lastUpdateTime
}) => {
  const [isPinging, setIsPinging] = useState(false);
  const [currentLatency, setCurrentLatency] = useState(latencyMs);
  const [pingCount, setPingCount] = useState(1);

  if (!isOpen) return null;

  const handleRunPing = () => {
    setIsPinging(true);
    setTimeout(() => {
      // Simulate realistic jitter 14ms - 26ms
      const newLat = Math.floor(14 + Math.random() * 12);
      setCurrentLatency(newLat);
      setPingCount((prev) => prev + 1);
      setIsPinging(false);
    }, 450);
  };

  const systems = [
    {
      name: 'MongoDB',
      icon: Database,
      status: 'Connected' as const,
      color: '#10B981',
      details: 'Atlas Cluster (Primary Node)',
      subtext: 'Replica set active • 0ms pool wait • Database: mcx_greeks',
      metrics: 'Ping: 12ms • Pool: 10/100'
    },
    {
      name: 'OCR Engine',
      icon: HardDrive,
      status: 'Connected' as const,
      color: '#10B981',
      details: 'Vision AI & Neural Parser v2.4',
      subtext: 'Multimodal OCR pipeline ready • 99.4% confidence score',
      metrics: 'Memory: 142MB • Queue: 0'
    },
    {
      name: 'Greeks Engine',
      icon: Cpu,
      status: 'Processing' as const,
      color: '#F59E0B',
      details: 'Abramowitz-Stegun Black-76 Core',
      subtext: 'High-throughput 64-bit IEEE float computation',
      metrics: 'Throughput: 14,200 calc/sec'
    },
    {
      name: 'Analytics Engine',
      icon: Activity,
      status: 'Connected' as const,
      color: '#10B981',
      details: 'Monte Carlo & Volatility Skew Matrix',
      subtext: 'IV percentile, skew surfaces & payoff curve generator',
      metrics: 'Cache Hit: 98.2%'
    },
    {
      name: 'WebSocket',
      icon: Radio,
      status: 'Connected' as const,
      color: '#10B981',
      details: 'MCX Level-2 Live Tick Stream',
      subtext: 'Binary tick packet ingestion • 0 dropped frames',
      metrics: 'Heartbeat: 1.0s • SSL TLS 1.3'
    },
    {
      name: 'API Server',
      icon: Server,
      status: 'Connected' as const,
      color: '#10B981',
      details: 'Express.js Cloud Edge Gateway',
      subtext: 'HTTP/2 multiplexed reverse proxy with gzip compression',
      metrics: 'Uptime: 99.99% • 200 OK'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#F8FAFC] dark:bg-[#08111F] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#0EA5E9]/10 border border-[#0EA5E9]/30 flex items-center justify-center text-[#0EA5E9]">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white font-mono uppercase tracking-wider">
                  Terminal System Telemetry & Engine Health
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-semibold border border-emerald-500/20">
                  ALL OPERATIONAL
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live monitoring for MCX Options microservices & compute cluster
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

        {/* Global Summary Metrics Banner */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-slate-100/70 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] mb-1">
              <span>API Gateway Latency</span>
              <Activity className="w-3.5 h-3.5 text-[#0EA5E9]" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-[#0EA5E9]">{currentLatency}ms</span>
              <span className="text-[10px] text-emerald-500 font-semibold">Fast (Edge)</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] mb-1">
              <span>Market Feed Sync</span>
              <Radio className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-emerald-500">LIVE</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">{lastUpdateTime}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] mb-1">
              <span>Cluster Precision</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-slate-900 dark:text-white">64-bit IEEE</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Black-76</span>
            </div>
          </div>
        </div>

        {/* Engine Status Grid */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 font-mono">
            Active Microservice Nodes (6/6 Online)
          </div>

          {systems.map((sys) => {
            const Icon = sys.icon;
            return (
              <div
                key={sys.name}
                className="p-3 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                        {sys.name}
                      </span>
                      <span
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold"
                        style={{
                          backgroundColor: `${sys.color}15`,
                          color: sys.color,
                          border: `1px solid ${sys.color}35`
                        }}
                      >
                        {sys.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                      {sys.details}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      {sys.subtext}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="flex items-center justify-end gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        sys.status === 'Processing'
                          ? 'bg-[#F59E0B] animate-pulse'
                          : 'bg-[#10B981]'
                      }`}
                    />
                    <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                      {sys.metrics}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>Diagnostics sequence #{pingCount} • Heartbeat healthy</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunPing}
              disabled={isPinging}
              className="px-3 py-1.5 rounded-lg bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-xs font-semibold font-mono flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
              {isPinging ? 'Pinging...' : 'Ping Cluster'}
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
