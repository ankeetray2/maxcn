import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import greeksRoutes from './src/server/routes/greeksRoutes';
import apiRoutes from './src/server/routes/apiRoutes';
import priceRoutes from './src/server/routes/priceRoutes';
import authRoutes from './src/server/routes/authRoutes';
import { runAllTests } from './src/server/tests/blackScholes.test';
import { getGreeksRepository } from './src/server/repositories/greeksRepository';
import { getAppRepository } from './src/server/repositories/appRepository';
import {
  helmetMiddleware,
  generalRateLimiter,
  mongoSanitizeMiddleware,
  csrfProtection,
  jwtAuthMiddleware
} from './src/server/middleware/security';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust proxy for reverse-proxy / container ingress environments (Cloud Run, Nginx)
  app.set('trust proxy', 1);

  // STEP 11: Security headers (Helmet)
  app.use(helmetMiddleware);

  // JSON request body parser with 25MB limit to support 10MB image uploads
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // STEP 11: Security protections: Rate Limiter, Mongo Sanitizer, CSRF, JWT
  app.use('/api', generalRateLimiter);
  app.use(mongoSanitizeMiddleware);
  app.use('/api', csrfProtection);
  app.use(jwtAuthMiddleware);

  // CORS middleware for API consumers
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // 1. Health check endpoint
  app.get('/api/health', async (_req, res) => {
    const [repo, appRepo] = await Promise.all([
      getGreeksRepository(),
      getAppRepository()
    ]);
    res.json({
      status: 'ok',
      engine: 'AI-Powered Commodity Option Greeks Calculation Engine',
      database: appRepo.getStatus(),
      collections: ['users', 'uploads', 'optionChains', 'greeksHistory', 'analytics', 'priceHistory'],
      features: [
        'Smart Commodity Price Ingestion (Manual, TradingView Chart, Option Chain, CSV/Excel)',
        'Automated Screenshot OCR (Groww, Zerodha, Upstox, Angel One, MCX, TradingView)',
        'AI Validation & Error Correction (O.99->0.99, l35OOO->135000, 3S.67->35.67)',
        'Black-Scholes Greeks Calculation Engine',
        'Scenario Stress Analysis (+/-100, +/-500, +/-1000)',
        'Analytics Dashboard (Price History, Candlestick Chart, Greeks vs Price, OI vs Price, IV vs Price)',
        'AI Insights (Max Pain, Highest Gamma/Vega, Support/Resistance Zones)'
      ],
      timestamp: new Date().toISOString()
    });
  });

  // 2. Unit Test Runner endpoint
  app.get('/api/test-suite', (_req, res) => {
    try {
      const results = runAllTests();
      res.json({
        success: true,
        summary: results
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  });

  // 3. Smart Commodity Price Ingestion API (/api/price/manual, /api/price/upload-chart, /api/price/upload-option-chain, /api/price/upload-csv, /api/price/latest, /api/price/history)
  app.use('/api/price', priceRoutes);

  // 4. User Authentication & Google Sign-In (/api/auth/google, /api/auth/register, /api/auth/login, /api/auth/me, /api/auth/logout)
  app.use('/api/auth', authRoutes);

  // 5. STEP 12 API Endpoints (/api/upload-screenshot, /api/extract-option-chain, /api/calculate-greeks, /api/scenario-analysis, /api/history, /api/analytics, /api/insights)
  app.use('/api', apiRoutes);

  // 5. Core Greeks calculation legacy routes
  app.use('/api/greeks', greeksRoutes);

  // 5. Vite middleware for frontend SPA in development, static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, port: PORT, host: '0.0.0.0' },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Commodity Greeks Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
