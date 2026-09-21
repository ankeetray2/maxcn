import React, { useState } from 'react';
import { useGreeksStore, NavigationTab } from '../../store/useGreeksStore';
import { COMMODITY_SPECS } from '../../services/mockData';
import { CommodityType } from '../../types';
import { usePriceStore } from '../../store/priceStore';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard,
  Calculator,
  LineChart,
  Upload,
  History,
  FileText,
  PieChart,
  Plus,
  RefreshCw,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Sun,
  Moon,
  LogIn,
  LogOut,
  User,
  ShieldCheck,
  Settings,
  Menu,
  X
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    selectedCommodity,
    setSelectedCommodity,
    settings,
    toggleTheme
  } = useGreeksStore();

  const {
    currentPrice,
    change: liveChange,
    changePercent: liveChangePercent,
    fetchLatestPrice
  } = usePriceStore();

  const { user, isAuthenticated, logout, setAuthMode } = useAuthStore();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const spec = COMMODITY_SPECS[selectedCommodity] || COMMODITY_SPECS.GOLD;

  // Center Navigation Tabs - exactly 7 professional trading terminal views
  const navItems: { id: NavigationTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calculator', label: 'Calculator', icon: Calculator },
    { id: 'analytics', label: 'Analytics', icon: LineChart },
    { id: 'uploads', label: 'Price Ingestion', icon: Upload },
    { id: 'history', label: 'History', icon: History },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'portfolio', label: 'Portfolio', icon: PieChart }
  ];

  // Top Market Ticker Commodities (Gold, Silver, Crude, Copper, Nickel + Natural Gas, Zinc)
  const tickerCommodities: CommodityType[] = [
    'GOLD',
    'SILVER',
    'CRUDEOIL',
    'COPPER',
    'NICKEL',
    'NATURALGAS',
    'ZINC',
    'ALUMINIUM',
    'LEAD'
  ];

  const handleManualRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await fetchLatestPrice(spec.name || 'Gold Mini', true);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleNewAnalysis = () => {
    setActiveTab('calculator');
  };

  // Live Price calculations
  const effectivePrice = currentPrice || spec.defaultSpot;
  const isPos = liveChange >= 0;

  return (
    <header className="sticky top-0 z-50 w-full transition-colors">
      {/* 1. TOP MARKET TICKER - Exactly 32px height */}
      <div className="h-[32px] bg-[#08111F] border-b border-slate-800/80 text-slate-300 text-[11px] overflow-hidden flex items-center select-none relative z-20">
        {/* Fixed Left Badge */}
        <div className="flex items-center gap-2 pl-4 pr-3 border-r border-slate-800/80 shrink-0 z-10 bg-[#08111F] h-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
          </span>
          <span className="text-[10px] font-black tracking-wider uppercase text-[#0EA5E9]">
            MCX REALTIME
          </span>
        </div>

        {/* Gradient fade masks for smooth ticker appearance */}
        <div className="pointer-events-none absolute left-[125px] top-0 bottom-0 w-6 bg-gradient-to-r from-[#08111F] to-transparent z-10" />
        <div className="pointer-events-none absolute right-[130px] top-0 bottom-0 w-6 bg-gradient-to-l from-[#08111F] to-transparent z-10 hidden md:block" />

        {/* Continuous Horizontal Scrolling Ticker Track */}
        <div className="flex-1 overflow-x-auto scrollbar-none flex items-center h-full">
          <div className="animate-terminal-ticker flex items-center gap-6 py-0.5 whitespace-nowrap pl-4">
            {/* First sequence of ticker items */}
            {tickerCommodities.map((c) => {
              const s = COMMODITY_SPECS[c];
              const isPositiveChange = s.change24h >= 0;
              const isSelected = selectedCommodity === c;
              return (
                <button
                  key={`ticker-1-${c}`}
                  onClick={() => setSelectedCommodity(c)}
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md transition-all text-[11px] cursor-pointer ${
                    isSelected
                      ? 'bg-[#0EA5E9]/20 text-[#0EA5E9] font-bold ring-1 ring-[#0EA5E9]/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                  title={`Click to analyze ${s.name}`}
                >
                  <span className="font-bold tracking-tight">{s.symbol}</span>
                  <span className="font-mono text-white/90">
                    ₹{s.defaultSpot.toLocaleString('en-IN')}
                  </span>
                  <span
                    className={`inline-flex items-center text-[10px] font-semibold ${
                      isPositiveChange ? 'text-[#10B981]' : 'text-[#EF4444]'
                    }`}
                  >
                    {isPositiveChange ? (
                      <ArrowUpRight className="w-2.5 h-2.5" />
                    ) : (
                      <ArrowDownRight className="w-2.5 h-2.5" />
                    )}
                    {isPositiveChange ? '+' : ''}
                    {s.change24h}%
                  </span>
                </button>
              );
            })}

            {/* Seamless duplicate sequence for infinite ticker loop */}
            {tickerCommodities.map((c) => {
              const s = COMMODITY_SPECS[c];
              const isPositiveChange = s.change24h >= 0;
              const isSelected = selectedCommodity === c;
              return (
                <button
                  key={`ticker-2-${c}`}
                  onClick={() => setSelectedCommodity(c)}
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md transition-all text-[11px] cursor-pointer ${
                    isSelected
                      ? 'bg-[#0EA5E9]/20 text-[#0EA5E9] font-bold ring-1 ring-[#0EA5E9]/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                  title={`Click to analyze ${s.name}`}
                >
                  <span className="font-bold tracking-tight">{s.symbol}</span>
                  <span className="font-mono text-white/90">
                    ₹{s.defaultSpot.toLocaleString('en-IN')}
                  </span>
                  <span
                    className={`inline-flex items-center text-[10px] font-semibold ${
                      isPositiveChange ? 'text-[#10B981]' : 'text-[#EF4444]'
                    }`}
                  >
                    {isPositiveChange ? (
                      <ArrowUpRight className="w-2.5 h-2.5" />
                    ) : (
                      <ArrowDownRight className="w-2.5 h-2.5" />
                    )}
                    {isPositiveChange ? '+' : ''}
                    {s.change24h}%
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Fixed Right Terminal Status */}
        <div className="hidden md:flex items-center gap-2 pl-3 pr-4 border-l border-slate-800/80 shrink-0 z-10 bg-[#08111F] text-[10px] text-slate-400 font-mono h-full">
          <span className="flex items-center gap-1.5 text-[#10B981]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            <span>SESSION ACTIVE</span>
          </span>
        </div>
      </div>

      {/* 2. MAIN HEADER - Exactly 72px height, Glassmorphism with backdrop-blur-[20px] */}
      <div className="h-[72px] w-full backdrop-blur-[20px] bg-[#F8FAFC]/85 dark:bg-[#08111F]/85 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* LEFT: Logo + Product Name + Subtitle */}
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 shrink-0 cursor-pointer group select-none"
            id="navbar-brand-logo"
          >
            {/* Geometric institutional delta-theta mark */}
            <div className="w-10 h-10 rounded-[14px] bg-gradient-to-tr from-[#0EA5E9] to-[#0284C7] flex items-center justify-center text-white shadow-md shadow-[#0EA5E9]/20 group-hover:scale-[1.03] transition-transform shrink-0">
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 19L12 5L20 19H4Z" />
                <circle cx="12" cy="14" r="2.2" fill="currentColor" />
              </svg>
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5 leading-tight">
                <span className="font-heading font-extrabold text-[17px] tracking-tight text-slate-900 dark:text-white">
                  Commodity Greeks
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-[#0EA5E9]/10 dark:bg-[#0EA5E9]/20 text-[#0EA5E9] border border-[#0EA5E9]/25 rounded-md">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-tight">
                MCX Options & Volatility Terminal
              </p>
            </div>
          </div>

          {/* CENTER: Navigation Links (Linear / Stripe Style 16px Rounded Segment) */}
          <nav
            aria-label="Main Navigation"
            className="hidden xl:flex items-center gap-1 p-1 bg-slate-100/80 dark:bg-slate-900/60 rounded-[16px] border border-slate-200/70 dark:border-slate-800/70 backdrop-blur-[10px] shadow-2xs"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  id={`nav-tab-${item.id}`}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-white dark:bg-[#0c1829] text-[#0EA5E9] shadow-xs border border-slate-200/60 dark:border-slate-700/60 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#0EA5E9]' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* RIGHT: Commodity Selector + Compact Live Price + Refresh + New Analysis + User Menu */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Commodity Selector */}
            <div className="relative group hidden sm:block">
              <select
                aria-label="Select Active Commodity"
                value={selectedCommodity}
                onChange={(e) => setSelectedCommodity(e.target.value as CommodityType)}
                className="appearance-none h-9 pl-3 pr-8 rounded-xl bg-white dark:bg-[#0c1829] border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs hover:border-[#0EA5E9] dark:hover:border-[#0EA5E9] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/20 transition-all cursor-pointer"
                id="header-commodity-select"
              >
                {tickerCommodities.map((c) => (
                  <option key={c} value={c}>
                    {COMMODITY_SPECS[c].symbol}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Compact Live Price Card (Flush & Embedded, No Floating bloat) */}
            <div
              className="h-9 px-3 rounded-xl bg-white/90 dark:bg-[#0c1829]/90 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-2 select-none"
              title={`Live MCX Spot: ₹${effectivePrice.toLocaleString('en-IN')}`}
              id="header-compact-price"
            >
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono hidden md:inline-block">
                  {spec.symbol}
                </span>
                <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                  ₹{effectivePrice.toLocaleString('en-IN')}
                </span>
              </div>
              <span
                className={`inline-flex items-center text-[10px] font-bold ${
                  isPos ? 'text-[#10B981]' : 'text-[#EF4444]'
                }`}
              >
                {isPos ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                {isPos ? '+' : ''}
                {liveChangePercent}%
              </span>
            </div>

            {/* Dedicated Manual Refresh Button */}
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-white dark:bg-[#0c1829] border border-slate-200 dark:border-slate-800 hover:border-[#0EA5E9] dark:hover:border-[#0EA5E9] text-slate-600 dark:text-slate-400 hover:text-[#0EA5E9] dark:hover:text-[#0EA5E9] shadow-2xs transition-all cursor-pointer disabled:opacity-60"
              title="Refresh Live MCX Data"
              aria-label="Refresh Live MCX Data"
              id="header-refresh-btn"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#0EA5E9]' : ''}`} />
            </button>

            {/* High-Visibility "New Analysis" CTA (Linear / Stripe Style) */}
            <button
              onClick={handleNewAnalysis}
              className="h-9 px-3.5 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-xs font-semibold shadow-xs hover:shadow-[#0EA5E9]/25 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              id="header-new-analysis-btn"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline-block">New Analysis</span>
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-white dark:bg-[#0c1829] border border-slate-200 dark:border-slate-800 hover:border-[#0EA5E9] text-slate-600 dark:text-slate-400 hover:text-[#0EA5E9] shadow-2xs transition-all cursor-pointer"
              title={`Active: ${settings.theme.toUpperCase()} mode. Click to toggle.`}
              aria-label="Toggle Theme"
              id="header-theme-toggle"
            >
              {settings.theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-[#0EA5E9]" />
              )}
            </button>

            {/* User Profile Dropdown Menu */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="h-9 flex items-center gap-2 pl-1.5 pr-2.5 rounded-xl bg-white dark:bg-[#0c1829] border border-slate-200 dark:border-slate-800 hover:border-[#0EA5E9] shadow-2xs transition-all cursor-pointer select-none"
                  title={`${user.name} (${user.email})`}
                  id="header-user-profile-btn"
                >
                  <div className="relative">
                    <img
                      src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                      alt={user.name}
                      className="w-6 h-6 rounded-lg object-cover bg-slate-100 dark:bg-slate-800"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#10B981] border-2 border-white dark:border-[#0c1829]" />
                  </div>
                  <span className="hidden 2xl:inline-block text-xs font-bold text-slate-800 dark:text-white max-w-[80px] truncate">
                    {user.name.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-[#0c1829] border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {user.name}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#0EA5E9]/10 text-[#0EA5E9] uppercase">
                            {user.role}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                          {user.email}
                        </p>
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-[#10B981]">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Google Verified Trader</span>
                        </div>
                      </div>

                      <div className="p-1 space-y-0.5">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            setActiveTab('auth');
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 cursor-pointer"
                        >
                          <User className="w-3.5 h-3.5 text-[#0EA5E9]" />
                          <span>Trader Profile & Account</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            setActiveTab('settings');
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 cursor-pointer"
                        >
                          <Settings className="w-3.5 h-3.5 text-slate-400" />
                          <span>Terminal Settings</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            logout();
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-[#EF4444] hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthMode('login');
                  setActiveTab('auth');
                }}
                className="h-9 inline-flex items-center gap-1.5 px-3 rounded-xl bg-white dark:bg-[#0c1829] hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                id="header-login-btn"
              >
                <LogIn className="w-3.5 h-3.5 text-[#0EA5E9]" />
                <span className="hidden sm:inline-block">Sign In</span>
              </button>
            )}

            {/* Mobile Hamburger Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden w-9 h-9 rounded-xl flex items-center justify-center bg-white dark:bg-[#0c1829] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer shadow-2xs"
              aria-label="Toggle Navigation Menu"
              id="header-mobile-menu-btn"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Responsive Mobile Drawer (Opens below 72px main header) */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-b border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#08111F] px-4 py-3 shadow-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Mobile Commodity Selection */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-500">Asset:</span>
              <select
                value={selectedCommodity}
                onChange={(e) => setSelectedCommodity(e.target.value as CommodityType)}
                className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-semibold text-xs"
              >
                {tickerCommodities.map((c) => (
                  <option key={c} value={c}>
                    {COMMODITY_SPECS[c].name}
                  </option>
                ))}
              </select>
            </div>

            {/* Mobile Nav items grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold ${
                      isActive
                        ? 'bg-[#0EA5E9] text-white'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
