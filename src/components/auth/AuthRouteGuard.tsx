import React, { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useGreeksStore, NavigationTab } from '../../store/useGreeksStore';
import { Lock, ShieldAlert, ArrowRight, RefreshCw, LayoutDashboard } from 'lucide-react';

interface AuthRouteGuardProps {
  children: React.ReactNode;
  viewId: NavigationTab;
  viewTitle?: string;
  description?: string;
}

/**
 * Route guard wrapper for sensitive views (e.g. Analytics, History).
 * Redirects unauthenticated users to the AuthView while caching their
 * intended destination so they return automatically after signing in.
 */
export const AuthRouteGuard: React.FC<AuthRouteGuardProps> = ({
  children,
  viewId,
  viewTitle = 'Protected Analysis',
  description = 'This view contains sensitive quantitative analysis and historical market data. Please sign in to access.'
}) => {
  const { isAuthenticated, isSessionInitialized, setIntendedDestination } = useAuthStore();
  const { setActiveTab } = useGreeksStore();

  useEffect(() => {
    // Wait until local session verification completes to avoid premature redirection
    if (isSessionInitialized && !isAuthenticated) {
      setIntendedDestination(viewId);
      const redirectTimer = setTimeout(() => {
        setActiveTab('auth');
      }, 100);
      return () => clearTimeout(redirectTimer);
    }
  }, [isSessionInitialized, isAuthenticated, viewId, setActiveTab, setIntendedDestination]);

  // Loading state while verifying stored credentials
  if (!isSessionInitialized) {
    return (
      <div className="w-full min-h-[380px] flex flex-col items-center justify-center p-8 rounded-3xl bg-white/80 dark:bg-[#121E2A]/80 border border-[#DCE9EE] dark:border-[#223344] shadow-xs text-center">
        <RefreshCw className="w-8 h-8 text-[#00778A] animate-spin mb-4" />
        <h3 className="text-sm font-bold text-[#1D2939] dark:text-white">
          Verifying Trader Session
        </h3>
        <p className="text-xs text-[#667085] dark:text-[#94A3B8] mt-1">
          Validating cryptographic credentials and role permissions...
        </p>
      </div>
    );
  }

  // If not authenticated, display protection notice while redirect takes effect
  if (!isAuthenticated) {
    return (
      <div className="w-full min-h-[420px] flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-[#121E2A] border border-[#DCE9EE] dark:border-[#223344] shadow-sm text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-14 h-14 rounded-2xl bg-[#00778A]/10 dark:bg-[#00778A]/20 flex items-center justify-center mx-auto text-[#00778A]">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#FEF3F2] dark:bg-[#7F1D1D]/30 text-[#F04438] border border-[#F04438]/20">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Authentication Required</span>
            </span>
            <h2 className="text-lg font-bold text-[#1D2939] dark:text-white">
              {viewTitle}
            </h2>
            <p className="text-xs text-[#667085] dark:text-[#94A3B8] leading-relaxed">
              {description}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              id="auth-guard-signin-btn"
              onClick={() => {
                setIntendedDestination(viewId);
                setActiveTab('auth');
              }}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#00778A] hover:bg-[#006070] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <span>Sign In with Google / Email</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              id="auth-guard-cancel-btn"
              onClick={() => setActiveTab('dashboard')}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-[#F7FAFB] dark:bg-[#1A2936] text-[#667085] dark:text-[#94A3B8] hover:text-[#1D2939] dark:hover:text-white border border-[#DCE9EE] dark:border-[#2E4052] text-xs font-semibold cursor-pointer"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
          </div>

          <p className="text-[11px] text-[#667085] dark:text-[#94A3B8]">
            Redirecting to sign-in page...
          </p>
        </div>
      </div>
    );
  }

  // Authenticated: Render protected view
  return <>{children}</>;
};
