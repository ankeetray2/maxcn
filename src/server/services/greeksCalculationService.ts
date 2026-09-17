import { COMMODITY_SPECS_SERVER } from '../data/commoditySpecs';
import { getGreeksRepository } from '../repositories/greeksRepository';
import { BlackScholesInputs, CommodityType, GreeksCalculationResult } from '../types/greeks.types';
import { calculateBlackScholesGreeks } from '../utils/blackScholes';
import { CalculateGreeksDTO, normalizeGreeksInput } from '../validators/greeksValidator';

export class GreeksCalculationService {
  /**
   * Execute Black-Scholes Greeks calculation with lot sizes, risk exposures and optional persistence
   */
  async calculate(dto: CalculateGreeksDTO) {
    const normalized = normalizeGreeksInput(dto);
    const commKey = normalized.commodity as CommodityType;
    const spec = COMMODITY_SPECS_SERVER[commKey];

    // Determine lot size: user custom > commodity standard > 1
    const resolvedLotSize = normalized.lotSize || (spec ? spec.standardLotSize : 1);

    const inputs: BlackScholesInputs = {
      commodity: normalized.commodity,
      spotPrice: normalized.spotPrice,
      strikePrice: normalized.strikePrice,
      timeToExpiryYears: normalized.timeToExpiryYears,
      riskFreeRate: normalized.riskFreeRate,
      impliedVolatility: normalized.impliedVolatility,
      optionType: normalized.optionType,
      lots: normalized.lots,
      lotSize: resolvedLotSize,
      saveToDatabase: normalized.saveToDatabase
    };

    const greeks = calculateBlackScholesGreeks(
      inputs,
      spec?.default52wHighIV,
      spec?.default52wLowIV
    );

    let savedRecord = null;
    if (normalized.saveToDatabase) {
      const repo = await getGreeksRepository();
      savedRecord = await repo.create({
        commodity: normalized.commodity,
        spotPrice: normalized.spotPrice,
        strikePrice: normalized.strikePrice,
        optionType: normalized.optionType,
        volatility: normalized.impliedVolatility * 100, // as percentage in DB
        expiry: (normalized.timeToExpiryYears * 365).toFixed(0) + ' days',
        delta: greeks.delta,
        gamma: greeks.gamma,
        theta: greeks.thetaDaily,
        vega: greeks.vega,
        rho: greeks.rho,
        premium: greeks.premium,
        lots: greeks.lots,
        lotSize: greeks.lotSize,
        pnl: 0,
        notes: normalized.notes
      });
    }

    return {
      inputs,
      greeks,
      commoditySpec: spec || null,
      savedRecord,
      calculatedAt: new Date().toISOString()
    };
  }

  /**
   * Fetch calculation history
   */
  async getHistory(limit: number = 50, commodity?: string) {
    const repo = await getGreeksRepository();
    const records = await repo.findAll(limit, commodity);
    const totalCount = await repo.count();
    const status = repo.getStatus();
    return {
      records,
      totalCount,
      databaseStatus: status
    };
  }

  /**
   * Fetch calculation record by ID
   */
  async getById(id: string) {
    const repo = await getGreeksRepository();
    return await repo.findById(id);
  }

  /**
   * Delete calculation record by ID
   */
  async deleteById(id: string) {
    const repo = await getGreeksRepository();
    return await repo.deleteById(id);
  }
}
