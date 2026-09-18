import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGreeksStore, applyTheme } from './store/useGreeksStore';
import { useAutoPriceSync } from './hooks/useAutoPriceSync';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';
import { DashboardView } from './app/dashboard/DashboardView';
import { CalculatorView } from './app/calculator/CalculatorView';
import { AnalyticsView } from './app/analytics/AnalyticsView';
import { UploadsView } from './app/uploads/UploadsView';
import { HistoryView } from './app/history/HistoryView';
import { SettingsView } from './app/settings/SettingsView';
import { AuthView } from './app/auth/AuthView';
import { AuthRouteGuard } from './components/auth/AuthRouteGuard';
import { useAuthStore } from './store/authStore';

export default function App() {
  const { activeTab, isSimulatingTicks, tickPriceUpdate, settings } = useGreeksStore();
  const { initSession } = useAuthStore();

  // Restore authenticated session from storage on app load
  useEffect(() => {
    initSession();
  }, [initSession]);

  // Initialize and maintain automatic live gold price loading & 30s auto-refresh
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
      case 'analytics':
        return (
          <AuthRouteGuard
            viewId="analytics"
            viewTitle="Quantitative Analytics & Volatility Surfaces"
            description="Accessing real-time risk analytics, Monte Carlo curves, and volatility skew surfaces requires an authenticated trader account."
          >
            <AnalyticsView />
          </AuthRouteGuard>
        );
      case 'uploads':
        return <UploadsView />;
      case 'history':
        return (
          <AuthRouteGuard
            viewId="history"
            viewTitle="Historical Greeks & Calculation Records"
            description="Accessing calculation history archives, audit records, and portfolio stress test logs requires an authenticated trader account."
          >
            <HistoryView />
          </AuthRouteGuard>
        );
      case 'settings':
        return <SettingsView />;
      case 'auth':
        return <AuthView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FAFB] dark:bg-[#0B131B] text-[#1D2939] dark:text-[#F0F6F9] flex flex-col relative selection:bg-[#00778A]/20 selection:text-[#00778A] transition-colors duration-200">
      {/* Background ambient floating gradients - TrustedAir aesthetic */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] rounded-full floating-gradient-1 pointer-events-none blur-[120px] -z-10 opacity-70" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] rounded-full floating-gradient-2 pointer-events-none blur-[100px] -z-10 opacity-60" />

      {/* Top Navigation */}
      <Navbar />

      {/* Main Trading Platform Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left Sidebar */}
          <Sidebar />

          {/* Right Main Content Panel */}
          <div className="flex-1 w-full min-w-0">
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
        </div>
      </main>

      {/* Institutional Footer */}
      <Footer />
    </div>
  );
}
