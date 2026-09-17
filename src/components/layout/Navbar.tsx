import React from 'react';
import { useGreeksStore, NavigationTab } from '../../store/useGreeksStore';
import { COMMODITY_SPECS } from '../../services/mockData';
import { CommodityType } from '../../types';
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
  Moon
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
                </button>
              );
            })}
          </nav>

          {/* Right Action: Active Commodity & CTA */}
          <div className="flex items-center gap-2.5">
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
