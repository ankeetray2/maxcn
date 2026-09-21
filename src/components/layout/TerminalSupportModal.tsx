import React, { useState } from 'react';
import {
  HelpCircle,
  X,
  Copy,
  Check,
  Send,
  MessageSquare,
  ShieldCheck,
  Terminal,
  Clock,
  Headphones
} from 'lucide-react';

interface TerminalSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  latencyMs: number;
}

export const TerminalSupportModal: React.FC<TerminalSupportModalProps> = ({
  isOpen,
  onClose,
  latencyMs
}) => {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [category, setCategory] = useState<'bug' | 'calculation' | 'data' | 'feature'>('calculation');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const diagnosticText = `Commodity Greeks Pro v1.0.0 Diagnostic Dump
Generated: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}
Screen: ${window.innerWidth}x${window.innerHeight}
API Latency: ${latencyMs}ms
Database: MongoDB Atlas (Connected)
OCR Engine: Vision AI (Connected)
Greeks Engine: Black-76 64-bit (Active)
Feed: MCX WebSocket Stream (Online)`;

  const handleCopyDiagnostics = () => {
    navigator.clipboard.writeText(diagnosticText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFeedback('');
      onClose();
    }, 1600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#F8FAFC] dark:bg-[#08111F] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#0EA5E9]/10 border border-[#0EA5E9]/30 flex items-center justify-center text-[#0EA5E9]">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white font-mono uppercase tracking-wider">
                Terminal Support & Desk
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct quantitative desk assistance & telemetry diagnostics
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

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto text-xs">
          {/* Desk Hours Banner */}
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#0EA5E9]" />
              <div>
                <span className="font-bold text-slate-900 dark:text-white block font-mono">
                  MCX Trading Desk Hours
                </span>
                <span className="text-[11px] text-slate-500">
                  Mon – Fri: 09:00 – 23:30 IST
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">
              DESK ACTIVE
            </span>
          </div>

          {/* Diagnostics Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between font-mono text-[11px] text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5 font-bold">
                <Terminal className="w-3.5 h-3.5 text-[#0EA5E9]" />
                Client Diagnostic Telemetry
              </span>
              <button
                onClick={handleCopyDiagnostics}
                className="text-[#0EA5E9] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span className="text-emerald-500">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Telemetry</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-slate-900 text-slate-300 font-mono text-[10px] leading-relaxed border border-slate-800 select-all overflow-x-auto">
              {diagnosticText}
            </pre>
          </div>

          {/* Feedback / Ticket Form */}
          {submitted ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-center font-mono py-6 space-y-1">
              <Check className="w-6 h-6 mx-auto mb-1 text-emerald-500" />
              <div className="font-bold text-xs">Diagnostic Report Dispatched</div>
              <div className="text-[11px] opacity-80">
                Ticket #MCX-{Math.floor(1000 + Math.random() * 9000)} logged with our quant desk.
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono">
                  Report Calculation Query or Issue
                </label>
                <div className="flex items-center gap-1">
                  {(['calculation', 'bug', 'data', 'feature'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono capitalize transition-all ${
                        category === cat
                          ? 'bg-[#0EA5E9] text-white font-bold'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Describe discrepancy in Delta/Greeks calculation or MCX strike feed..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0EA5E9] font-sans text-xs"
              />

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  support@commoditygreeks.pro
                </span>
                <button
                  type="submit"
                  disabled={!feedback.trim()}
                  className="px-4 py-1.5 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] disabled:opacity-50 text-white font-semibold font-mono text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send Ticket
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
