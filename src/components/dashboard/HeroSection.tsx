import React from 'react';
import { motion } from 'framer-motion';
import { useGreeksStore } from '../../store/useGreeksStore';
import {
  Sparkles,
  Upload,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  CheckCircle2
} from 'lucide-react';

export const HeroSection: React.FC = () => {
  const { setActiveTab, selectedCommodity } = useGreeksStore();

  return (
    <div className="relative overflow-hidden rounded-[24px] glass-panel p-8 md:p-12 mb-8 border border-[#DCE9EE] shadow-sm">
      {/* Floating decorative gradients - TrustedAir Inspired */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full floating-gradient-1 pointer-events-none blur-3xl opacity-70" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full floating-gradient-2 pointer-events-none blur-3xl opacity-60" />

      <div className="relative z-10 max-w-3xl">
        {/* Market Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-[#DCE9EE] shadow-xs text-xs font-semibold text-[#00778A] mb-5"
        >
          <span className="flex h-2 w-2 rounded-full bg-[#12B76A] animate-pulse" />
          <span>Next-Gen MCX Derivatives Engine</span>
          <span className="text-[#B5CEDA]">•</span>
          <span className="text-[#667085] font-normal">Black-76 & Black-Scholes</span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#1D2939] leading-[1.15]"
        >
          Professional Commodity <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-[#00778A] via-[#00778A] to-[#7A9266] bg-clip-text text-transparent">
            Greeks Analysis
          </span>
        </motion.h1>

        {/* Hero Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-4 text-base sm:text-lg text-[#667085] max-w-2xl leading-relaxed"
        >
          Calculate Delta, Gamma, Theta, Vega and Rho for <strong className="text-[#1D2939] font-semibold">Gold, Silver, Crude Oil, Natural Gas</strong> and more with institutional precision.
        </motion.p>

        {/* Feature Highlights Pill Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="flex flex-wrap items-center gap-4 mt-6 text-xs text-[#667085]"
        >
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#12B76A]" />
            <span>Black-76 Futures Discounting</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#12B76A]" />
            <span>Multi-Strike Option Chain Upload</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#12B76A]" />
            <span>Interactive Risk & Volatility Charts</span>
          </div>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap items-center gap-4 mt-8"
        >
          <button
            onClick={() => setActiveTab('calculator')}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#00778A] hover:bg-[#006070] text-white font-semibold text-sm transition-all shadow-md shadow-[#00778A]/25 group"
          >
            <Sparkles className="w-4 h-4" />
            <span>Start Analysis</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => setActiveTab('uploads')}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white hover:bg-[#F7FAFB] text-[#00778A] border border-[#DCE9EE] font-semibold text-sm transition-all shadow-xs"
          >
            <Upload className="w-4 h-4 text-[#00778A]" />
            <span>Smart Price Ingestion</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
};
