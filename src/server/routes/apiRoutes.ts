import { Router, Request, Response } from 'express';
import {
  validateScreenshotFile,
  uploadRateLimiter,
  generateJwtToken,
  verifyJwtToken
} from '../middleware/security';
import { ocrExtractionService } from '../services/ocrExtractionService';
import { calculateBlackScholesGreeks } from '../utils/blackScholes';
import { getAppRepository } from '../repositories/appRepository';

const router = Router();

/**
 * STEP 12: API Endpoints
 * 1. POST /api/upload-screenshot
 */
router.post('/upload-screenshot', uploadRateLimiter, async (req: Request, res: Response) => {
  try {
    const { imageBase64, filename, mimeType, platformHint } = req.body;

    // STEP 11: File validation (Accept only PNG, JPG, JPEG, WEBP; Maximum Size: 10 MB)
    const fileValidation = validateScreenshotFile({
      imageBase64,
      filename,
      mimeType
    });

    if (!fileValidation.valid || !fileValidation.data) {
      return res.status(400).json({
        success: false,
        error: fileValidation.error || 'Invalid file payload'
      });
    }

    // Run complete automated pipeline:
    // OCR Extraction -> AI Validation -> Structured JSON -> Greeks Calculation -> Scenario Analysis -> MongoDB Storage -> Charts & Insights
    const result = await ocrExtractionService.processScreenshot({
      imageBase64,
      mimeType: fileValidation.data.mimeType,
      filename: fileValidation.data.filename,
      sizeBytes: fileValidation.data.sizeBytes,
      platformHint
    });

    return res.json({
      success: true,
      message: 'Screenshot processed and stored successfully',
      data: result
    });
  } catch (err: any) {
    console.error('Error processing screenshot:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to process screenshot: ' + (err.message || 'Unknown server error')
    });
  }
});

/**
 * 2. POST /api/extract-option-chain
 */
router.post('/extract-option-chain', uploadRateLimiter, async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType, filename, platformHint } = req.body;

    const fileValidation = validateScreenshotFile({
      imageBase64,
      filename,
      mimeType
    });

    if (!fileValidation.valid || !fileValidation.data) {
      return res.status(400).json({
        success: false,
        error: fileValidation.error
      });
    }

    const result = await ocrExtractionService.processScreenshot({
      imageBase64,
      mimeType: fileValidation.data.mimeType,
      filename: fileValidation.data.filename,
      sizeBytes: fileValidation.data.sizeBytes,
      platformHint
    });

    return res.json({
      success: true,
      data: result.structuredJson,
      corrections: result.ocrCorrections
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 3. POST /api/calculate-greeks
 * STEP 5: Greeks Calculation Engine
 */
router.post('/calculate-greeks', (req: Request, res: Response) => {
  try {
    const {
      spotPrice,
      strikePrice,
      timeToExpiryYears,
      expiry,
      riskFreeRate = 0.065,
      impliedVolatility,
      optionType = 'CALL'
    } = req.body;

    if (!spotPrice || !strikePrice) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: spotPrice and strikePrice are mandatory'
      });
    }

    let tYears = timeToExpiryYears;
    if (!tYears && expiry) {
      const expDate = new Date(expiry);
      if (!isNaN(expDate.getTime())) {
        const diffMs = expDate.getTime() - Date.now();
        const days = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
        tYears = days / 365.0;
      }
    }
    if (!tYears) tYears = 18 / 365.0;

    const iv = (impliedVolatility || 25.0) > 1 ? impliedVolatility / 100.0 : impliedVolatility || 0.25;

    const result = calculateBlackScholesGreeks({
      commodity: req.body.commodity || 'GOLD',
      spotPrice: Number(spotPrice),
      strikePrice: Number(strikePrice),
      timeToExpiryYears: tYears,
      riskFreeRate: Number(riskFreeRate),
      impliedVolatility: iv,
      optionType: optionType.toUpperCase() as 'CALL' | 'PUT'
    });

    return res.json({
      success: true,
      data: {
        premium: result.premium,
        delta: result.delta,
        gamma: result.gamma,
        theta: result.thetaDaily,
        thetaAnnual: result.thetaAnnual,
        vega: result.vega,
        rho: result.rho,
        probabilityITM: result.probabilityITM,
        probabilityOTM: result.probabilityOTM
      }
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 4. POST /api/scenario-analysis
 * STEP 6: Scenario Analysis
 */
router.post('/scenario-analysis', async (req: Request, res: Response) => {
  try {
    const {
      commodity = 'Gold Mini',
      spotPrice = 153219,
      expiry = '2025-10-05',
      optionChain
    } = req.body;

    const chain = Array.isArray(optionChain) && optionChain.length > 0
      ? optionChain
      : [
          {
            strike: 153000,
            call: { delta: 0.52, theta: -61.2, gamma: 0.000035, vega: 44.8, rho: 18.2, iv: 29.8, oi: 3850, ltp: 3120 },
            put: { delta: -0.48, theta: -61.2, gamma: 0.000035, vega: 44.8, rho: -14.6, iv: 29.8, oi: 4120, ltp: 2180 }
          }
        ];

    const scenarios = ocrExtractionService.calculateScenarios(commodity, Number(spotPrice), expiry, chain);

    return res.json({
      success: true,
      commodity,
      baseSpotPrice: Number(spotPrice),
      scenarios
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 4b. POST /api/scenario-analysis/save
 * Explicitly save user scenario analysis to MongoDB collection 'scenarioAnalysis'
 */
router.post('/scenario-analysis/save', async (req: Request, res: Response) => {
  try {
    const {
      commodity,
      currentPrice,
      strike,
      optionType,
      iv,
      daysToExpiry,
      lots,
      lotSize,
      movePoints,
      recalculatedGreeks,
      pnl
    } = req.body;

    if (!commodity || currentPrice === undefined || strike === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: commodity, currentPrice, strike'
      });
    }

    const repo = await getAppRepository();
    const doc = await repo.saveScenarioAnalysis({
      commodity: String(commodity),
      currentPrice: Number(currentPrice),
      strike: Number(strike),
      optionType: optionType || 'CE',
      iv: Number(iv) || 0,
      daysToExpiry: daysToExpiry !== undefined ? Number(daysToExpiry) : undefined,
      lots: Number(lots) || 1,
      lotSize: lotSize !== undefined ? Number(lotSize) : undefined,
      movePoints: Number(movePoints) || 0,
      recalculatedGreeks: recalculatedGreeks || {
        delta: 0,
        gamma: 0,
        theta: 0,
        vega: 0,
        rho: 0,
        premium: 0,
        intrinsicValue: 0,
        extrinsicValue: 0
      },
      pnl: pnl || {
        currentPremium: 0,
        futurePremium: 0,
        premiumChange: 0,
        pnlPerLot: 0,
        pnlTotal: 0
      }
    });

    return res.json({
      success: true,
      message: 'Scenario analysis saved to MongoDB collection "scenarioAnalysis"',
      data: doc
    });
  } catch (err: any) {
    console.error('Error saving scenario analysis:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to save scenario analysis: ' + (err.message || 'Unknown server error')
    });
  }
});

/**
 * 4c. GET /api/scenario-analysis/saved
 * Retrieve saved scenario analyses from MongoDB collection 'scenarioAnalysis'
 */
router.get('/scenario-analysis/saved', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const commodity = req.query.commodity as string;
    const repo = await getAppRepository();
    const records = await repo.getScenarioAnalyses(limit, commodity);

    return res.json({
      success: true,
      count: records.length,
      collection: 'scenarioAnalysis',
      database: repo.getStatus(),
      data: records
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve saved scenario analyses: ' + (err.message || 'Unknown error')
    });
  }
});

/**
 * 4d. POST /api/greek-calculations/save
 * Save calculated Greek scenario to MongoDB collection: greekCalculations
 */
router.post('/greek-calculations/save', async (req: Request, res: Response) => {
  try {
    const {
      commodity,
      spotPrice,
      strike,
      optionType,
      expiry,
      iv,
      delta,
      gamma,
      theta,
      vega,
      rho,
      pop,
      premium,
      lots,
      scenarioAnalysis,
      uploadedScreenshot
    } = req.body;

    const repo = await getAppRepository();
    const doc = await repo.saveGreekCalculation({
      commodity: commodity || 'Gold Mini',
      spotPrice: Number(spotPrice) || 0,
      strike: Number(strike) || 0,
      optionType: (optionType === 'PE' || optionType === 'PUT') ? 'PE' : 'CE',
      expiry: Number(expiry) || 0,
      iv: Number(iv) || 0,
      delta: Number(delta) || 0,
      gamma: Number(gamma) || 0,
      theta: Number(theta) || 0,
      vega: Number(vega) || 0,
      rho: Number(rho) || 0,
      pop: Number(pop) || 0,
      premium: Number(premium) || 0,
      lots: Number(lots) || 1,
      scenarioAnalysis: Array.isArray(scenarioAnalysis) ? scenarioAnalysis : [],
      uploadedScreenshot: uploadedScreenshot || undefined
    });

    return res.json({
      success: true,
      message: 'Greek calculation saved to MongoDB collection "greekCalculations"',
      collection: 'greekCalculations',
      data: doc
    });
  } catch (err: any) {
    console.error('Error saving greek calculation:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to save greek calculation: ' + (err.message || 'Unknown error')
    });
  }
});

/**
 * 4e. GET /api/greek-calculations
 * Retrieve saved Greek calculations from MongoDB collection: greekCalculations
 */
router.get('/greek-calculations', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const commodity = req.query.commodity as string;
    const repo = await getAppRepository();
    const records = await repo.getGreekCalculations(limit, commodity);

    return res.json({
      success: true,
      count: records.length,
      collection: 'greekCalculations',
      database: repo.getStatus(),
      data: records
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve greek calculations: ' + (err.message || 'Unknown error')
    });
  }
});

/**
 * 5. GET /api/history
 * STEP 9: Historical Tracking
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    const commodity = req.query.commodity as string;
    const limit = parseInt(req.query.limit as string, 10) || 50;

    const repo = await getAppRepository();
    const [uploads, greeksHistory, optionChain] = await Promise.all([
      repo.getUploads(10),
      repo.getGreeksHistory(limit, commodity),
      repo.getLatestOptionChain(commodity)
    ]);

    return res.json({
      success: true,
      database: repo.getStatus(),
      uploads,
      greeksHistory,
      latestOptionChain: optionChain
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/save-upload
 * Persists the structured OCR and Option Chain payload to MongoDB / Local repo
 */
router.post('/save-upload', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const repo = await getAppRepository();
    const saved = await repo.saveStructuredUpload(payload);

    return res.json({
      success: true,
      message: 'Upload saved to database successfully',
      data: saved
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to save upload'
    });
  }
});

/**
 * DELETE /api/uploads/:id
 * Deletes an upload by ID
 */
router.delete('/uploads/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const repo = await getAppRepository();
    const success = await repo.deleteUpload(id);

    return res.json({
      success,
      message: success ? 'Upload deleted successfully' : 'Upload not found'
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to delete upload'
    });
  }
});

/**
 * 6. GET /api/analytics
 * STEP 8: Analytics Dashboard
 */
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const commodity = req.query.commodity as string;
    const repo = await getAppRepository();
    const analytics = await repo.getLatestAnalytics(commodity);

    if (!analytics) {
      // Return fresh default calculated analytics
      const fallbackResult = await ocrExtractionService.processScreenshot({
        imageBase64: 'placeholder',
        mimeType: 'image/png',
        filename: 'gold_mini_groww_sample.png',
        sizeBytes: 1024,
        platformHint: 'Groww Option Chain'
      });
      return res.json({
        success: true,
        data: {
          insights: fallbackResult.insights,
          scenarios: fallbackResult.scenarios,
          chartData: fallbackResult.charts
        }
      });
    }

    return res.json({
      success: true,
      data: {
        commodity: analytics.commodity,
        expiry: analytics.expiry,
        spotPrice: analytics.spotPrice,
        insights: analytics.insights,
        scenarios: analytics.scenarios,
        chartData: analytics.chartData
      }
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 7. GET /api/insights
 * STEP 10: AI Insights
 */
router.get('/insights', async (req: Request, res: Response) => {
  try {
    const commodity = req.query.commodity as string;
    const repo = await getAppRepository();
    const analytics = await repo.getLatestAnalytics(commodity);

    if (analytics) {
      return res.json({
        success: true,
        commodity: analytics.commodity,
        spotPrice: analytics.spotPrice,
        insights: analytics.insights
      });
    }

    // Default insights
    const fallback = await ocrExtractionService.processScreenshot({
      imageBase64: 'placeholder',
      mimeType: 'image/png',
      filename: 'gold_mini_insights.png',
      sizeBytes: 1024
    });

    return res.json({
      success: true,
      commodity: fallback.structuredJson.commodity,
      spotPrice: fallback.structuredJson.spotPrice,
      insights: fallback.insights
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * Authentication helper endpoint (JWT)
 */
router.post('/auth/token', (req: Request, res: Response) => {
  const { username = 'trader', role = 'trader' } = req.body;
  const token = generateJwtToken({
    userId: 'usr_' + Date.now(),
    username,
    role
  });
  return res.json({
    success: true,
    token,
    expiresIn: '7d'
  });
});

export default router;
