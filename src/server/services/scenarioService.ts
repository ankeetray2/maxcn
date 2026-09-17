import { COMMODITY_SPECS_SERVER } from '../data/commoditySpecs';
import { CommodityType, ScenarioAnalysisResponse, ScenarioPoint } from '../types/greeks.types';
import { calculateBlackScholesGreeks, roundToPrecision } from '../utils/blackScholes';
import { normalizeGreeksInput, ScenarioAnalysisDTO } from '../validators/greeksValidator';

export class ScenarioService {
  /**
   * Run Scenario Analysis & Multi-Greek Shock Simulation
   */
  async simulate(dto: ScenarioAnalysisDTO): Promise<ScenarioAnalysisResponse> {
    const normalized = normalizeGreeksInput(dto);
    const commKey = normalized.commodity as CommodityType;
    const spec = COMMODITY_SPECS_SERVER[commKey];
    const resolvedLotSize = normalized.lotSize || (spec ? spec.standardLotSize : 1);

    const baseInput = {
      commodity: normalized.commodity,
      spotPrice: normalized.spotPrice,
      strikePrice: normalized.strikePrice,
      timeToExpiryYears: normalized.timeToExpiryYears,
      riskFreeRate: normalized.riskFreeRate,
      impliedVolatility: normalized.impliedVolatility,
      optionType: normalized.optionType,
      lots: normalized.lots,
      lotSize: resolvedLotSize
    };

    // Calculate base scenario
    const baseResult = calculateBlackScholesGreeks(
      baseInput,
      spec?.default52wHighIV,
      spec?.default52wLowIV
    );

    // Standard moves requested: +100, +500, +1000, -100, -500, -1000
    // Adapt scale if commodity spot is very small (like Natural Gas at ₹250 or Zinc at ₹285)
    let defaultMoves = [-1000, -500, -100, 100, 500, 1000];
    if (normalized.spotPrice < 500) {
      // Scale down for small nominal spot commodities (e.g. NatGas, Zinc, Aluminium)
      defaultMoves = [-50, -25, -5, 5, 25, 50];
    } else if (normalized.spotPrice < 2000) {
      defaultMoves = [-200, -100, -25, 25, 100, 200];
    }

    const movesToEvaluate = dto.customMoves && dto.customMoves.length > 0
      ? dto.customMoves
      : defaultMoves;

    const scenarios: ScenarioPoint[] = movesToEvaluate.map((move) => {
      const simulatedSpot = Math.max(0.01, normalized.spotPrice + move);
      const recalculated = calculateBlackScholesGreeks({
        ...baseInput,
        spotPrice: simulatedSpot
      });

      const unitPnl = recalculated.premium - baseResult.premium;
      const totalPnl = unitPnl * baseResult.totalQuantity;
      const returnPct = baseResult.premium > 0
        ? (unitPnl / baseResult.premium) * 100
        : 0;

      const sign = move > 0 ? `+${move}` : `${move}`;
      return {
        moveLabel: `${sign} move`,
        spotMove: move,
        simulatedSpot: roundToPrecision(simulatedSpot, 2),
        recalculatedPremium: recalculated.premium,
        delta: recalculated.delta,
        gamma: recalculated.gamma,
        theta: recalculated.thetaDaily,
        vega: recalculated.vega,
        rho: recalculated.rho,
        unitPnl: roundToPrecision(unitPnl, 4),
        totalPnl: roundToPrecision(totalPnl, 2),
        returnPercentage: roundToPrecision(returnPct, 2)
      };
    });

    // Generate continuous curve series for Payoff, Delta, Gamma, Theta, Vega curves
    const curvePointsCount = 31;
    const minSpot = normalized.spotPrice * 0.85;
    const maxSpot = normalized.spotPrice * 1.15;
    const step = (maxSpot - minSpot) / (curvePointsCount - 1);

    const curveData = [];
    const isCall = normalized.optionType === 'CALL';

    for (let i = 0; i < curvePointsCount; i++) {
      const spot = minSpot + i * step;
      const ptGreeks = calculateBlackScholesGreeks({
        ...baseInput,
        spotPrice: spot
      });

      // Payoff at expiry
      const callPayoff = Math.max(0, spot - normalized.strikePrice) - baseResult.premium;
      const putPayoff = Math.max(0, normalized.strikePrice - spot) - baseResult.premium;
      const activePayoff = isCall ? callPayoff : putPayoff;
      const theoreticalPrice = ptGreeks.premium;
      const pnl = theoreticalPrice - baseResult.premium;

      curveData.push({
        spot: roundToPrecision(spot, 2),
        callPayoff: roundToPrecision(callPayoff, 2),
        putPayoff: roundToPrecision(putPayoff, 2),
        activePayoff: roundToPrecision(activePayoff, 2),
        theoreticalPrice: roundToPrecision(theoreticalPrice, 2),
        delta: ptGreeks.delta,
        gamma: ptGreeks.gamma,
        theta: ptGreeks.thetaDaily,
        vega: ptGreeks.vega,
        pnl: roundToPrecision(pnl * baseResult.totalQuantity, 2)
      });
    }

    return {
      baseInput,
      baseResult,
      scenarios,
      curveData
    };
  }
}
