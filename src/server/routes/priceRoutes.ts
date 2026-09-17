import { Router, Request, Response } from 'express';
import {
  validateScreenshotFile,
  validateSpreadsheetFile,
  uploadRateLimiter
} from '../middleware/security';
import { chartOcrService } from '../services/chartOcrService';
import { ocrExtractionService } from '../services/ocrExtractionService';
import { getAppRepository } from '../repositories/appRepository';

const router = Router();

/**
 * 1. Method 1: Manual Price Entry
 * POST /api/price/manual
 * Store: { commodity: "Gold Mini", currentPrice: 153330, source: "manual", createdAt: current_time }
 */
router.post('/manual', async (req: Request, res: Response) => {
  try {
    const { commodity, currentPrice } = req.body;

    // Validation: must be numeric, positive, support decimal values
    const numPrice = typeof currentPrice === 'string' ? parseFloat(currentPrice.replace(/,/g, '')) : Number(currentPrice);

    if (isNaN(numPrice) || typeof numPrice !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Price must be a valid numeric value.'
      });
    }

    if (numPrice <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Price must be a positive number greater than 0.'
      });
    }

    const commName = (commodity && typeof commodity === 'string' && commodity.trim()) ? commodity.trim() : 'Gold Mini';

    const repo = await getAppRepository();
    const savedDoc = await repo.savePriceHistory({
      commodity: commName,
      currentPrice: numPrice,
      close: numPrice,
      source: 'manual'
    });

    return res.json({
      success: true,
      message: 'Gold price saved successfully',
      data: {
        commodity: savedDoc.commodity,
        currentPrice: savedDoc.currentPrice,
        source: savedDoc.source,
        timestamp: savedDoc.createdAt,
        id: savedDoc.id
      }
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to record manual price: ' + (err.message || 'Unknown error')
    });
  }
});

/**
 * 2. Method 2: Chart Screenshot Upload (TradingView, Groww, Zerodha Kite, Upstox)
 * POST /api/price/upload-chart
 * Detects: Commodity Name, Current Price, High, Low, Open, Close
 * Store: { commodity: "Gold Mini", open: 153346, high: 153346, low: 153305, close: 153330, source: "screenshot" }
 */
router.post('/upload-chart', uploadRateLimiter, async (req: Request, res: Response) => {
  try {
    const { imageBase64, filename, mimeType } = req.body;

    const fileValidation = validateScreenshotFile({
      imageBase64,
      filename,
      mimeType
    });

    if (!fileValidation.valid || !fileValidation.data) {
      return res.status(400).json({
        success: false,
        error: fileValidation.error || 'Invalid chart screenshot payload'
      });
    }

    const ocrResult = await chartOcrService.processChartScreenshot({
      imageBase64,
      mimeType: fileValidation.data.mimeType,
      filename: fileValidation.data.filename
    });

    const repo = await getAppRepository();
    const savedDoc = await repo.savePriceHistory({
      commodity: ocrResult.commodity,
      currentPrice: ocrResult.currentPrice,
      open: ocrResult.open,
      high: ocrResult.high,
      low: ocrResult.low,
      close: ocrResult.close,
      source: 'screenshot',
      rawMetadata: {
        filename: fileValidation.data.filename,
        timeframe: ocrResult.timeframe,
        ocrCorrections: ocrResult.ocrCorrections
      }
    });

    return res.json({
      success: true,
      message: 'TradingView chart screenshot processed successfully',
      data: {
        commodity: ocrResult.commodity,
        currentPrice: ocrResult.currentPrice,
        open: ocrResult.open,
        high: ocrResult.high,
        low: ocrResult.low,
        close: ocrResult.close,
        source: 'screenshot',
        ocrCorrections: ocrResult.ocrCorrections,
        savedDoc
      }
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to process chart screenshot: ' + (err.message || 'Unknown error')
    });
  }
});

/**
 * 3. Method 3: Option Chain Screenshot Upload
 * POST /api/price/upload-option-chain
 * Extracts: all strikes, Greeks, OI, IV, LTP -> Generates structured JSON
 */
router.post('/upload-option-chain', uploadRateLimiter, async (req: Request, res: Response) => {
  try {
    const { imageBase64, filename, mimeType, platformHint } = req.body;

    const fileValidation = validateScreenshotFile({
      imageBase64,
      filename,
      mimeType
    });

    if (!fileValidation.valid || !fileValidation.data) {
      return res.status(400).json({
        success: false,
        error: fileValidation.error || 'Invalid option chain screenshot payload'
      });
    }

    const result = await ocrExtractionService.processScreenshot({
      imageBase64,
      mimeType: fileValidation.data.mimeType,
      filename: fileValidation.data.filename,
      sizeBytes: fileValidation.data.sizeBytes,
      platformHint
    });

    // Save spot price to priceHistory collection
    const repo = await getAppRepository();
    await repo.savePriceHistory({
      commodity: result.structuredJson.commodity,
      currentPrice: result.structuredJson.spotPrice,
      close: result.structuredJson.spotPrice,
      source: 'option-chain',
      rawMetadata: {
        expiry: result.structuredJson.expiry,
        strikesCount: result.structuredJson.optionChain.length
      }
    });

    return res.json({
      success: true,
      message: 'Option chain screenshot extracted successfully',
      data: result
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to extract option chain: ' + (err.message || 'Unknown error')
    });
  }
});

/**
 * 4. Method 4: CSV / Excel Upload
 * POST /api/price/upload-csv
 * Accepts: .csv, .xlsx up to 10MB
 * Columns: Date, Commodity, Price, Strike, Delta, Gamma, Theta, Vega, Rho
 */
router.post('/upload-csv', uploadRateLimiter, async (req: Request, res: Response) => {
  try {
    const { fileBase64, filename } = req.body;

    const validation = validateSpreadsheetFile({
      fileBase64,
      filename
    });

    if (!validation.valid || !validation.data) {
      return res.status(400).json({
        success: false,
        error: validation.error || 'Invalid CSV or Excel file payload'
      });
    }

    const parseResult = chartOcrService.parseCsvOrExcel(
      validation.data.buffer,
      validation.data.filename
    );

    const repo = await getAppRepository();

    // Store latest price in priceHistory
    const savedPrice = await repo.savePriceHistory({
      commodity: parseResult.commodity,
      currentPrice: parseResult.latestPrice,
      close: parseResult.latestPrice,
      source: validation.data.extension === 'xlsx' ? 'excel' : 'csv',
      rawMetadata: {
        filename: validation.data.filename,
        rowsParsed: parseResult.rowCount
      }
    });

    // Store Greeks records in greeksHistory if available
    if (parseResult.greeksRecords.length > 0) {
      await repo.saveGreeksHistory(
        parseResult.greeksRecords.map(r => ({
          commodity: r.commodity,
          expiry: 'EXPIRY-CSV',
          spotPrice: r.price,
          strike: r.strike,
          call: {
            delta: r.delta,
            gamma: r.gamma,
            theta: r.theta,
            vega: r.vega,
            rho: r.rho,
            iv: 25,
            ltp: Math.max(10, r.price - r.strike),
            oi: 1000
          },
          put: {
            delta: r.delta - 1,
            gamma: r.gamma,
            theta: r.theta,
            vega: r.vega,
            rho: r.rho,
            iv: 25,
            ltp: Math.max(10, r.strike - r.price),
            oi: 1000
          }
        }))
      );
    }

    return res.json({
      success: true,
      message: `Parsed ${parseResult.rowCount} rows from ${validation.data.filename}`,
      data: {
        commodity: parseResult.commodity,
        latestPrice: parseResult.latestPrice,
        rowCount: parseResult.rowCount,
        priceRecords: parseResult.priceRecords,
        greeksRecords: parseResult.greeksRecords,
        savedPrice
      }
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to process spreadsheet: ' + (err.message || 'Unknown error')
    });
  }
});

/**
 * 5. GET /api/price/latest
 * Show: Current Gold Price, Day High, Day Low, Price Change, Percentage Change
 */
router.get('/latest', async (req: Request, res: Response) => {
  try {
    const commodity = (req.query.commodity as string) || 'Gold Mini';
    const repo = await getAppRepository();

    const [latestPrice, history] = await Promise.all([
      repo.getLatestPrice(commodity),
      repo.getPriceHistory(50, commodity)
    ]);

    const currentPrice = latestPrice?.currentPrice || 153330;

    // Calculate Day High and Day Low from history
    const allPrices = history.map(h => h.currentPrice).filter(p => !isNaN(p) && p > 0);
    if (latestPrice?.high) allPrices.push(latestPrice.high);
    if (latestPrice?.low) allPrices.push(latestPrice.low);
    allPrices.push(currentPrice);

    const dayHigh = allPrices.length > 0 ? Math.max(...allPrices) : currentPrice;
    const dayLow = allPrices.length > 0 ? Math.min(...allPrices) : currentPrice;

    // Price change compared to the second latest entry or open
    const prevPrice = history.length > 1 ? history[1].currentPrice : (latestPrice?.open || currentPrice);
    const priceChange = Number((currentPrice - prevPrice).toFixed(2));
    const percentageChange = prevPrice > 0 ? Number(((priceChange / prevPrice) * 100).toFixed(2)) : 0;

    return res.json({
      success: true,
      data: {
        commodity: latestPrice?.commodity || commodity,
        currentPrice,
        dayHigh,
        dayLow,
        priceChange,
        percentageChange,
        open: latestPrice?.open ?? 153346,
        high: latestPrice?.high ?? dayHigh,
        low: latestPrice?.low ?? dayLow,
        close: latestPrice?.close ?? currentPrice,
        source: latestPrice?.source || 'manual',
        timestamp: latestPrice?.createdAt || new Date(),
        historyCount: history.length
      }
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch latest price: ' + (err.message || 'Unknown error')
    });
  }
});

/**
 * 6. GET /api/price/history
 * Returns historical prices and OHLC candle series for chart rendering
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    const commodity = (req.query.commodity as string) || 'Gold Mini';
    const limit = parseInt(req.query.limit as string) || 50;

    const repo = await getAppRepository();
    const history = await repo.getPriceHistory(limit, commodity);

    return res.json({
      success: true,
      commodity,
      count: history.length,
      data: history
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch price history: ' + (err.message || 'Unknown error')
    });
  }
});

export default router;
