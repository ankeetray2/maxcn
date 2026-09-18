import React from 'react';
import { useGreeksStore, NavigationTab } from '../../store/useGreeksStore';
import { COMMODITY_SPECS } from '../../services/mockData';
import { CommodityType } from '../../types';
import { LivePriceNavbarWidget } from '../common/LivePriceNavbarWidget';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard,
  Calculator,
  LineChart,
  History,
  Settings,
  Upload,
  Sparkles,
  ChevronDown,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Database,
  Sun,
  Moon,
  LogIn,
  LogOut,
  User,
  ShieldCheck,
  Lock
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    selectedCommodity,
    setSelectedCommodity,
    isSimulatingTicks,
    toggleTickSimulation,
    databaseStatus,
    settings,
    toggleTheme
  } = useGreeksStore();

  const { user, isAuthenticated, logout, setAuthMode } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  const spec = COMMODITY_SPECS[selectedCommodity] || COMMODITY_SPECS.GOLD;

  const navItems: { id: NavigationTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calculator', label: 'Calculator', icon: Calculator },
    { id: 'analytics', label: 'Analytics', icon: LineChart },
    { id: 'uploads', label: 'Price Ingestion', icon: Upload },
    { id: 'history', label: 'History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const commodities: CommodityType[] = [
    'GOLD',
    'SILVER',
    'CRUDEOIL',
    'NATURALGAS',
    'COPPER',
    'ZINC',
    'ALUMINIUM',
    'LEAD',
    'NICKEL'
  ];

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/85 border-b border-[#DCE9EE] transition-all">
      {/* Top micro-ticker bar */}
      <div className="hidden lg:flex items-center justify-between px-6 py-1.5 bg-[#F7FAFB] border-b border-[#DCE9EE]/60 text-xs text-[#667085]">
        <div className="flex items-center space-x-4 overflow-x-auto py-0.5">
          <div className="flex items-center gap-2 font-medium text-[#1D2939] whitespace-nowrap">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#12B76A] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#12B76A]"></span>
            </span>
            <span className="text-[10px] tracking-wider uppercase font-bold text-[#00778A]">MCX Live Market</span>
          </div>

          {commodities.map((c) => {
            const s = COMMODITY_SPECS[c];
            const isPos = s.change24h >= 0;
            return (
              <button
                key={c}
                onClick={() => setSelectedCommodity(c)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full transition-all text-[11px] whitespace-nowrap ${
                  selectedCommodity === c
                    ? 'bg-[#00778A]/10 text-[#00778A] font-semibold ring-1 ring-[#00778A]/30'
                    : 'hover:text-[#1D2939] hover:bg-white'
                }`}
              >
                <span className="font-semibold">{s.symbol}</span>
                <span className="font-mono text-[#1D2939]">
                  {s.defaultSpot.toLocaleString('en-IN')}
                </span>
                <span className={`flex items-center text-[10px] font-medium ${isPos ? 'text-[#12B76A]' : 'text-[#F04438]'}`}>
                  {isPos ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                  {isPos ? '+' : ''}{s.change24h}%
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4 text-[11px] whitespace-nowrap">
          <div className="flex items-center gap-1 text-[#12B76A]">
            <Database className="w-3.5 h-3.5" />
            <span className="font-medium">{databaseStatus.driver === 'mongodb' ? 'MongoDB Engine' : 'Storage Engine'}</span>
          </div>
          <span className="text-[#B5CEDA]">|</span>
          <button
            onClick={toggleTickSimulation}
            className="flex items-center gap-1.5 text-[#00778A] hover:underline"
            title="Toggle simulated live price updates"
          >
            <Activity className={`w-3.5 h-3.5 ${isSimulatingTicks ? 'animate-pulse text-[#12B76A]' : 'text-[#667085]'}`} />
            <span>Feed: {isSimulatingTicks ? 'Live Streaming' : 'Paused'}</span>
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo Left */}
          <div className="flex items-center gap-3">
            <div 
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00778A] to-[#7A9266] flex items-center justify-center text-white shadow-md shadow-[#00778A]/15 group-hover:scale-105 transition-transform">
                <span className="font-heading font-extrabold text-lg tracking-tight">Δθ</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-heading font-bold text-lg tracking-tight text-[#1D2939]">
                    Commodity Greeks
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-[#00778A] text-white rounded-md">
                    PRO
                  </span>
                </div>
                <p className="text-[11px] text-[#667085] hidden sm:block font-medium">
                  MCX Options Terminal & Volatility Suite
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Links Center */}
          <nav className="hidden md:flex items-center space-x-1 p-1 bg-[#F7FAFB] rounded-[18px] border border-[#DCE9EE]/80">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-[#00778A] shadow-sm shadow-[#00778A]/10 border border-[#DCE9EE]'
                      : 'text-[#667085] hover:text-[#1D2939] hover:bg-white/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#00778A]' : 'text-[#667085]'}`} />
                  <span>{item.label}</span>
                  {!isAuthenticated && (item.id === 'analytics' || item.id === 'history') && (
                    <Lock className="w-3 h-3 text-[#667085] opacity-70 ml-0.5" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action: Live Price Widget, Active Commodity & CTA */}
          <div className="flex items-center gap-2.5">
            {/* Global Live Price Widget: 🟢 LIVE | Gold Mini | ₹153,330 | Updated 5 sec ago */}
            <LivePriceNavbarWidget />

            {/* Commodity dropdown selector */}
            <div className="relative group">
              <select
                aria-label="Select Commodity"
                value={selectedCommodity}
                onChange={(e) => setSelectedCommodity(e.target.value as CommodityType)}
                className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-white border border-[#DCE9EE] text-xs font-semibold text-[#1D2939] hover:border-[#00778A] focus:outline-none focus:ring-2 focus:ring-[#00778A]/20 cursor-pointer shadow-xs"
              >
                {commodities.map((c) => (
                  <option key={c} value={c}>
                    {COMMODITY_SPECS[c].symbol} ({COMMODITY_SPECS[c].unit})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#667085] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Dark Mode Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Dark / Light Theme"
              className="p-2 rounded-xl bg-white border border-[#DCE9EE] text-[#667085] hover:text-[#00778A] hover:bg-[#F7FAFB] transition-all shadow-xs flex items-center justify-center cursor-pointer"
              title={`Active: ${settings.theme.toUpperCase()} mode. Click to toggle.`}
            >
              {settings.theme === 'dark' ? (
                <Sun className="w-4 h-4 text-[#F59E0B]" />
              ) : (
                <Moon className="w-4 h-4 text-[#00778A]" />
              )}
            </button>

            {/* Quick Upload CTA */}
            <button
              onClick={() => setActiveTab('uploads')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#00778A] border border-[#DCE9EE] hover:bg-[#F7FAFB] text-xs font-semibold transition-all shadow-xs"
            >
              <Upload className="w-3.5 h-3.5 text-[#00778A]" />
              <span>Upload Chain</span>
            </button>

            {/* Primary Analysis CTA */}
            <button
              onClick={() => setActiveTab('calculator')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00778A] hover:bg-[#00778A]/90 text-white text-xs font-semibold transition-all shadow-sm shadow-[#00778A]/25"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Start Analysis</span>
            </button>

            {/* Authentication / User Profile CTA */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-xl bg-white border border-[#DCE9EE] hover:border-[#00778A] transition-all shadow-xs cursor-pointer group"
                  title={`${user.name} (${user.email})`}
                >
                  <div className="relative">
                    <img
                      src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                      alt={user.name}
                      className="w-7 h-7 rounded-lg object-cover bg-gray-100"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#12B76A] border-2 border-white" />
                  </div>
                  <span className="hidden xl:inline-block text-xs font-bold text-[#1D2939] max-w-[90px] truncate">
                    {user.name.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-3 h-3 text-[#667085] group-hover:text-[#00778A]" />
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-[#1E293B] border border-[#DCE9EE] dark:border-[#334155] shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2.5 border-b border-[#DCE9EE] dark:border-[#334155]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-[#1D2939] dark:text-white truncate">
                          {user.name}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#00778A]/10 text-[#00778A] uppercase">
                          {user.role}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-[#667085] dark:text-[#94A3B8] truncate">
                        {user.email}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] text-[#12B76A]">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Google Verified Session</span>
                      </div>
                    </div>

                    <div className="p-1 space-y-0.5">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          setActiveTab('auth');
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-[#1D2939] dark:text-gray-200 hover:bg-[#F7FAFB] dark:hover:bg-[#334155] flex items-center gap-2 cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5 text-[#00778A]" />
                        <span>View Profile & Account</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          setActiveTab('settings');
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-[#1D2939] dark:text-gray-200 hover:bg-[#F7FAFB] dark:hover:bg-[#334155] flex items-center gap-2 cursor-pointer"
                      >
                        <Settings className="w-3.5 h-3.5 text-[#667085]" />
                        <span>Trading Settings</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-[#F04438] hover:bg-[#FEF3F2] dark:hover:bg-red-950/30 flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setActiveTab('auth');
                  }}
                  id="navbar-btn-login"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#F8FAFB] text-[#1D2939] border border-[#DCE9EE] hover:border-[#B5CEDA] text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                  </svg>
                  <span>Sign In</span>
                </button>

                <button
                  onClick={() => {
                    setAuthMode('register');
                    setActiveTab('auth');
                  }}
                  id="navbar-btn-register"
                  className="hidden sm:inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#F0F7F9] hover:bg-[#E3EFF3] text-[#00778A] border border-[#DCE9EE] text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <span>Register</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-[#DCE9EE]/60 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-medium ${
                  isActive ? 'text-[#00778A] font-bold' : 'text-[#667085]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#00778A]' : 'text-[#667085]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
