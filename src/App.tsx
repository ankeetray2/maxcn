import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGreeksStore, applyTheme } from './store/useGreeksStore';
import { useAutoPriceSync } from './hooks/useAutoPriceSync';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { DashboardView } from './app/dashboard/DashboardView';
import { CalculatorView } from './app/calculator/CalculatorView';
import { GreeksSimulatorView } from './app/calculator/GreeksSimulatorView';
import { AnalyticsView } from './app/analytics/AnalyticsView';
import { UploadsView } from './app/uploads/UploadsView';
import { HistoryView } from './app/history/HistoryView';
import { SettingsView } from './app/settings/SettingsView';

export default function App() {
  const { activeTab, isSimulatingTicks, tickPriceUpdate, settings } = useGreeksStore();

  // Initialize and synchronize underlying live commodity price
  useAutoPriceSync();

  // Sync theme to DOM on mount and when settings change
  useEffect(() => {
    applyTheme(settings.theme);

    if (settings.theme === 'system' && window.matchMedia) {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme('system');
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, [settings.theme]);

  // Subtle real-time price tick simulation for live MCX trading ambiance
  useEffect(() => {
    if (!isSimulatingTicks) return;
    const interval = setInterval(() => {
      tickPriceUpdate();
    }, 3800);
    return () => clearInterval(interval);
  }, [isSimulatingTicks, tickPriceUpdate]);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'calculator':
        return <CalculatorView />;
      case 'scenario':
        return <GreeksSimulatorView />;
      case 'analytics':
      case 'portfolio':
        return <AnalyticsView />;
      case 'uploads':
        return <UploadsView />;
      case 'history':
      case 'reports':
        return <HistoryView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  const isWideLayout = activeTab === 'calculator' || activeTab === 'scenario' || activeTab === 'analytics';

  return (
    <div className="min-h-screen bg-[#F7FAFB] dark:bg-[#0B131B] text-[#1D2939] dark:text-[#F0F6F9] flex flex-col relative selection:bg-[#00778A]/20 selection:text-[#00778A] transition-colors duration-200">
      {/* Background ambient floating gradients - TrustedAir aesthetic */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] rounded-full floating-gradient-1 pointer-events-none blur-[120px] -z-10 opacity-70" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] rounded-full floating-gradient-2 pointer-events-none blur-[100px] -z-10 opacity-60" />

      {/* Top Navigation */}
      <Navbar />

      {/* Main Trading Platform Container - Wide for Laptop/PC Terminal */}
      <main className={`flex-1 w-full mx-auto px-3 sm:px-5 lg:px-8 pt-4 sm:pt-6 pb-20 sm:pb-24 ${
        isWideLayout ? 'max-w-[1920px]' : 'max-w-7xl'
      }`}>
        <div className="w-full min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              {renderActiveView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Institutional Footer */}
      <Footer />
    </div>
  );
}
