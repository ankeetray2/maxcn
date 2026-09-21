import React, { useState, useEffect, useMemo } from 'react';
import { useGreeksStore, NavigationTab } from '../../store/useGreeksStore';
import { usePriceStore } from '../../store/priceStore';
import { useAuthStore } from '../../store/authStore';
import { TerminalStatusModal } from './TerminalStatusModal';
import { TerminalDocsModal } from './TerminalDocsModal';
import { TerminalApiDocsModal } from './TerminalApiDocsModal';
import { TerminalSupportModal } from './TerminalSupportModal';
import {
  LayoutDashboard,
  Calculator,
  Upload,
  LineChart,
  User,
  Activity,
  Zap,
  Radio,
  Clock,
  Sun,
  Moon,
  Database,
  Cpu,
  Server,
  HardDrive,
  BookOpen,
  Code2,
  FileSpreadsheet,
  Settings,
  HelpCircle,
  ChevronUp,
  Terminal,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Circle
} from 'lucide-react';

export const Footer: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    settings,
    toggleTheme,
    selectedCommodity
  } = useGreeksStore();

  const { lastUpdated, isLoading: isPriceLoading } = usePriceStore();
  const { user, isAuthenticated } = useAuthStore();

  // Modal Dialog States
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [isApiDocsModalOpen, setIsApiDocsModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [showLinksMenu, setShowLinksMenu] = useState(false);

  // Live Market Time Clock (HH:mm:ss)
  const [marketTime, setMarketTime] = useState<string>('18:45:03');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setMarketTime(`${h}:${m}:${s}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Live Edge Latency simulation (16-22ms realistic trading edge ping)
  const [latency, setLatency] = useState(18);
  useEffect(() => {
    const timer = setInterval(() => {
      setLatency(Math.floor(16 + Math.random() * 6));
    }, 8500);
    return () => clearInterval(timer);
  }, []);

  // Determine current active theme
  const isDark = useMemo(() => {
    if (settings.theme === 'dark') return true;
    if (settings.theme === 'light') return false;
    return typeof window !== 'undefined' && document.documentElement.classList.contains('dark');
  }, [settings.theme]);

  // System Status Chips specifications as requested
  const statusChips = [
    {
      id: 'mongo',
      name: 'MongoDB',
      status: 'Connected' as const,
      color: '#10B981', // Success
      icon: Database
    },
    {
      id: 'ocr',
      name: 'OCR Engine',
      status: 'Connected' as const,
      color: '#10B981',
      icon: HardDrive
    },
    {
      id: 'greeks',
      name: 'Greeks Engine',
      status: 'Processing' as const, // Real-time continuous Black-76 64-bit computation
      color: '#10B981', // Connected / live
      badgeColor: '#F59E0B',
      icon: Cpu
    },
    {
      id: 'analytics',
      name: 'Analytics Engine',
      status: 'Connected' as const,
      color: '#10B981',
      icon: Activity
    },
    {
      id: 'websocket',
      name: 'WebSocket',
      status: 'Connected' as const,
      color: '#10B981',
      icon: Radio
    },
    {
      id: 'api',
      name: 'API Server',
      status: 'Connected' as const,
      color: '#10B981',
      icon: Server
    }
  ];

  // Mobile Bottom Navigation Items (exactly 5 items per specification)
  const mobileNavItems: {
    id: NavigationTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calculator', label: 'Calculator', icon: Calculator },
    { id: 'uploads', label: 'Upload', icon: Upload },
    { id: 'analytics', label: 'Analytics', icon: LineChart },
    { id: 'auth', label: 'Profile', icon: User }
  ];

  return (
    <>
      <footer
        id="terminal-footer"
        className="sticky bottom-0 z-40 w-full h-16 min-h-[64px] bg-[#F8FAFC]/90 dark:bg-[#08111F]/90 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_28px_rgba(0,0,0,0.5)] transition-colors duration-200 select-none"
      >
        {/* ========================================================================= */}
        {/* DESKTOP TERMINAL FOOTER (Screen width >= md: 768px)                       */}
        {/* Inspired by TradingView, Bloomberg Terminal, Zerodha Kite & Linear        */}
        {/* ========================================================================= */}
        <div className="hidden md:flex items-center justify-between h-full px-4 lg:px-6 w-full text-xs font-mono">
          {/* ----------------------------------------------------------------------- */}
          {/* LEFT SECTION: Commodity Greeks Pro • v1.0.0 • MCX Options Analytics    */}
          {/* ----------------------------------------------------------------------- */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Terminal Branding Icon Badge */}
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0EA5E9] to-[#0284C7] flex items-center justify-center text-white font-bold text-xs shadow-xs"
                title="Commodity Greeks Pro Terminal"
              >
                Δ
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 leading-none">
                  <span className="font-bold text-slate-900 dark:text-white tracking-tight text-xs">
                    Commodity Greeks Pro
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-[#0EA5E9]/10 text-[#0EA5E9] border border-[#0EA5E9]/30 px-1.5 py-0.2 rounded">
                    v1.0.0
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans tracking-tight mt-0.5 hidden xl:inline">
                  MCX Options Analytics Platform
                </span>
              </div>
            </div>

            {/* Micro divider */}
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden lg:block" />

            {/* Extra: Quick Feed & Latency Badge */}
            <div
              onClick={() => setIsStatusModalOpen(true)}
              className="hidden lg:flex items-center gap-2 px-2 py-1 rounded-md bg-slate-100/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 text-[10px] text-slate-600 dark:text-slate-300 hover:border-[#0EA5E9]/50 transition-colors cursor-pointer"
              title="Click to view full System Telemetry & Cluster Health"
            >
              <span className="flex items-center gap-1 font-bold text-emerald-500">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                MCX LIVE
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="flex items-center gap-1 text-[#0EA5E9] font-bold">
                <Zap className="w-2.5 h-2.5" />
                {latency}ms
              </span>
            </div>
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* CENTER SECTION: System Status Chips (MongoDB, OCR, Greeks, etc.)         */}
          {/* ----------------------------------------------------------------------- */}
          <div className="flex-1 flex items-center justify-center px-4 overflow-x-auto scrollbar-none">
            <div
              className="flex items-center gap-1.5 lg:gap-2 cursor-pointer"
              onClick={() => setIsStatusModalOpen(true)}
              title="Click to view detailed Engine Status & Diagnostics"
            >
              {statusChips.map((chip) => {
                const isProcessing = chip.status === 'Processing';
                return (
                  <div
                    key={chip.id}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 hover:border-[#0EA5E9]/50 dark:hover:border-[#0EA5E9]/50 transition-all text-[11px] group whitespace-nowrap shadow-2xs"
                  >
                    {/* Status Dot */}
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        isProcessing
                          ? 'bg-[#F59E0B] animate-pulse'
                          : chip.color === '#10B981'
                          ? 'bg-[#10B981]'
                          : 'bg-[#EF4444]'
                      }`}
                    />

                    {/* Engine Name */}
                    <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                      {chip.name}
                    </span>

                    {/* Status Indicator Text */}
                    <span
                      className={`text-[9px] font-bold tracking-tight px-1 py-0.2 rounded ${
                        isProcessing
                          ? 'text-[#F59E0B] bg-[#F59E0B]/10'
                          : 'text-[#10B981] bg-[#10B981]/10'
                      }`}
                    >
                      {chip.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* RIGHT SECTION: Links, Market Clock, Theme Toggle & Current User Avatar  */}
          {/* ----------------------------------------------------------------------- */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Footer Quick Links (Documentation, API Docs, Reports, Settings, Support) */}
            <div className="hidden 2xl:flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400 font-sans">
              <button
                type="button"
                onClick={() => setIsDocsModalOpen(true)}
                className="hover:text-[#0EA5E9] dark:hover:text-[#0EA5E9] transition-colors cursor-pointer"
              >
                Documentation
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setIsApiDocsModalOpen(true)}
                className="hover:text-[#0EA5E9] dark:hover:text-[#0EA5E9] transition-colors cursor-pointer"
              >
                API Docs
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setActiveTab('reports')}
                className="hover:text-[#0EA5E9] dark:hover:text-[#0EA5E9] transition-colors cursor-pointer"
              >
                Reports
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className="hover:text-[#0EA5E9] dark:hover:text-[#0EA5E9] transition-colors cursor-pointer"
              >
                Settings
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setIsSupportModalOpen(true)}
                className="hover:text-[#0EA5E9] dark:hover:text-[#0EA5E9] transition-colors cursor-pointer"
              >
                Support
              </button>
            </div>

            {/* Collapsed Links Dropdown for Mid/Large Screens */}
            <div className="relative 2xl:hidden">
              <button
                type="button"
                onClick={() => setShowLinksMenu(!showLinksMenu)}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 hover:border-[#0EA5E9]/50 transition-colors"
              >
                <BookOpen className="w-3 h-3 text-[#0EA5E9]" />
                <span>Links</span>
                <ChevronUp className={`w-3 h-3 transition-transform ${showLinksMenu ? 'rotate-180' : ''}`} />
              </button>

              {showLinksMenu && (
                <div
                  className="absolute bottom-full right-0 mb-2 w-44 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 space-y-0.5 text-xs font-sans z-50 animate-in fade-in slide-in-from-bottom-2 duration-150"
                  onMouseLeave={() => setShowLinksMenu(false)}
                >
                  <button
                    onClick={() => {
                      setIsDocsModalOpen(true);
                      setShowLinksMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#0EA5E9]" />
                    <span>Documentation</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsApiDocsModalOpen(true);
                      setShowLinksMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Code2 className="w-3.5 h-3.5 text-[#0EA5E9]" />
                    <span>API Docs</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('reports');
                      setShowLinksMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-[#0EA5E9]" />
                    <span>Reports</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('settings');
                      setShowLinksMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Settings className="w-3.5 h-3.5 text-[#0EA5E9]" />
                    <span>Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsSupportModalOpen(true);
                      setShowLinksMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-[#0EA5E9]" />
                    <span>Support</span>
                  </button>
                </div>
              )}
            </div>

            {/* Vertical Divider */}
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

            {/* Last Market Update Time (e.g. 18:45:03) */}
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300"
              title={`Last Market Update: ${marketTime} IST`}
            >
              <Clock className="w-3 h-3 text-slate-400" />
              <div className="flex items-center gap-1 text-[11px] font-mono">
                <span className="text-slate-500 hidden xl:inline">Update:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {marketTime}
                </span>
              </div>
            </div>

            {/* Current Theme Pill Toggle (Dark / Light) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-[#0EA5E9]/50 transition-colors cursor-pointer"
              title="Click to toggle Theme"
            >
              {isDark ? (
                <Moon className="w-3 h-3 text-[#0EA5E9]" />
              ) : (
                <Sun className="w-3 h-3 text-amber-500" />
              )}
              <span className="text-[11px] font-bold">
                {isDark ? 'Dark' : 'Light'}
              </span>
            </button>

            {/* Current User Profile Avatar */}
            <button
              type="button"
              onClick={() => setActiveTab('auth')}
              className="flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 transition-colors cursor-pointer"
              title={
                isAuthenticated && user
                  ? `${user.name} (${user.role.toUpperCase()})`
                  : 'Trader Profile / Guest'
              }
            >
              {isAuthenticated && user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-5 h-5 rounded-full object-cover border border-[#0EA5E9]"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#0EA5E9] to-indigo-500 text-white flex items-center justify-center text-[10px] font-bold">
                  {isAuthenticated && user?.name
                    ? user.name.slice(0, 1).toUpperCase()
                    : 'T'}
                </div>
              )}
              <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 max-w-[80px] truncate">
                {isAuthenticated && user?.name ? user.name.split(' ')[0] : 'Profile'}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MOBILE BOTTOM NAVIGATION (< md: 768px)                                    */}
        {/* Converts into sleek terminal bottom nav:                                  */}
        {/* Dashboard • Calculator • Upload • Analytics • Profile                     */}
        {/* ========================================================================= */}
        <div className="md:hidden flex items-center justify-around h-full px-2 w-full">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`relative flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 transition-all rounded-lg cursor-pointer ${
                  isActive
                    ? 'text-[#0EA5E9] font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {/* Active Indicator Top Glow Line */}
                {isActive && (
                  <span className="absolute -top-1 w-7 h-0.5 bg-[#0EA5E9] rounded-full shadow-[0_0_8px_#0EA5E9]" />
                )}

                <Icon className={`w-4 h-4 transition-transform ${isActive ? 'scale-110' : ''}`} />
                <span className="text-[10px] font-sans tracking-tight mt-0.5 font-medium">
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* Quick Status Button on Mobile to trigger status modal */}
          <button
            type="button"
            onClick={() => setIsStatusModalOpen(true)}
            className="flex flex-col items-center justify-center min-w-[48px] min-h-[44px] py-1 text-emerald-500 cursor-pointer"
            title="System Status"
          >
            <span className="relative flex h-3 w-3 mb-0.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-[9px] font-mono font-bold tracking-tight">LIVE</span>
          </button>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* TERMINAL FOOTER MODALS                                                    */}
      {/* ========================================================================= */}
      <TerminalStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        latencyMs={latency}
        lastUpdateTime={marketTime}
      />

      <TerminalDocsModal
        isOpen={isDocsModalOpen}
        onClose={() => setIsDocsModalOpen(false)}
      />

      <TerminalApiDocsModal
        isOpen={isApiDocsModalOpen}
        onClose={() => setIsApiDocsModalOpen(false)}
      />

      <TerminalSupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
        latencyMs={latency}
      />
    </>
  );
};
