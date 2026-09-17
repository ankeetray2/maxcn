import { BlackScholesInputs, GreeksCalculationResult } from '../types/greeks.types';

/**
 * Standard Normal Probability Density Function (PDF): N'(x)
 */
export function normalPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/**
 * Cumulative Standard Normal Distribution Function: N(x)
 * High-precision Abramowitz & Stegun polynomial approximation (error < 7.5e-8)
 */
export function normalCdf(x: number): number {
  if (isNaN(x)) return 0;
  // Handle extreme boundaries gracefully
  if (x > 8.0) return 1.0;
  if (x < -8.0) return 0.0;

  const a1 = 0.319381530;
  const a2 = -0.356563782;
  const a3 = 1.781477937;
  const a4 = -1.821255978;
  const a5 = 1.330274429;
  const p = 0.2316419;

  if (x >= 0) {
    const k = 1.0 / (1.0 + p * x);
    const poly = k * (a1 + k * (a2 + k * (a3 + k * (a4 + k * a5))));
    return 1.0 - normalPdf(x) * poly;
  } else {
    const k = 1.0 / (1.0 - p * x);
    const poly = k * (a1 + k * (a2 + k * (a3 + k * (a4 + k * a5))));
    return normalPdf(x) * poly;
  }
}

/**
 * Rounds a number to a specified number of decimal places (default 6 for institutional financial precision).
 */
export function roundToPrecision(num: number, decimals: number = 6): number {
  if (isNaN(num) || !isFinite(num)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}

/**
 * Computes exact Black-Scholes Greeks, Premiums, and Risk Exposures
 * matching the user mathematical specifications.
 */
export function calculateBlackScholesGreeks(
  inputs: BlackScholesInputs,
  default52wHighIV?: number,
  default52wLowIV?: number
): GreeksCalculationResult {
  const S = Math.max(0.000001, inputs.spotPrice);
  const K = Math.max(0.000001, inputs.strikePrice);
  const T = Math.max(0.000001, inputs.timeToExpiryYears);
  const r = inputs.riskFreeRate; // e.g. 0.065
  const sigma = Math.max(0.000001, inputs.impliedVolatility); // e.g. 0.25
  const isCall = inputs.optionType === 'CALL';

  const sqrtT = Math.sqrt(T);

  // 1. d1 = [ln(S/K) + (r + σ²/2) × T] / [σ × √T]
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);

  // 2. d2 = d1 − σ × √T
  const d2 = d1 - sigma * sqrtT;

  const Nd1 = normalCdf(d1);
  const Nd2 = normalCdf(d2);
  const NnegD1 = normalCdf(-d1);
  const NnegD2 = normalCdf(-d2);
  const nPrimeD1 = normalPdf(d1);
  const discountFactor = Math.exp(-r * T);

  // 3. Delta
  // CALL: N(d1)
  // PUT: N(d1) − 1
  const delta = isCall ? Nd1 : Nd1 - 1.0;

  // 4. Gamma
  // N'(d1) / [S × σ × √T]
  const gamma = nPrimeD1 / (S * sigma * sqrtT);

  // 5. Theta (Annualized and daily decay)
  // CALL Theta: −[S × N'(d1) × σ / (2√T)] − rK e^(−rT) N(d2)
  // PUT Theta:  −[S × N'(d1) × σ / (2√T)] + rK e^(−rT) N(−d2)
  const thetaFirstTerm = -(S * nPrimeD1 * sigma) / (2.0 * sqrtT);
  let thetaAnnual: number;
  if (isCall) {
    thetaAnnual = thetaFirstTerm - r * K * discountFactor * Nd2;
  } else {
    thetaAnnual = thetaFirstTerm + r * K * discountFactor * NnegD2;
  }
  const thetaDaily = thetaAnnual / 365.0;

  // 6. Vega
  // S × N'(d1) × √T / 100
  const vega = (S * nPrimeD1 * sqrtT) / 100.0;

  // 7. Rho
  // CALL:  K × T × e^(−rT) × N(d2) / 100
  // PUT:  −K × T × e^(−rT) × N(−d2) / 100
  let rho: number;
  if (isCall) {
    rho = (K * T * discountFactor * Nd2) / 100.0;
  } else {
    rho = (-K * T * discountFactor * NnegD2) / 100.0;
  }

  // 8. Option Premium (Black-Scholes theoretical value)
  // CALL: S × N(d1) − K × e^(−rT) × N(d2)
  // PUT:  K × e^(−rT) × N(−d2) − S × N(−d1)
  let premium: number;
  if (isCall) {
    premium = S * Nd1 - K * discountFactor * Nd2;
  } else {
    premium = K * discountFactor * NnegD2 - S * NnegD1;
  }
  premium = Math.max(0, premium);

  // 9. Intrinsic Value
  // CALL: max(0, S − K)
  // PUT:  max(0, K − S)
  const intrinsicValue = isCall ? Math.max(0, S - K) : Math.max(0, K - S);

  // 10. Extrinsic Value (Time Value)
  const extrinsicValue = Math.max(0, premium - intrinsicValue);

  // Additional Metrics:
  // 11. Probability ITM: CALL: N(d2), PUT: N(-d2)
  const probabilityITM = isCall ? Nd2 : NnegD2;

  // 12. Probability OTM: 1 - Probability ITM
  const probabilityOTM = Math.max(0, 1.0 - probabilityITM);

  // 13. Probability Touch: min(1, 2 * Probability ITM)
  const probabilityTouch = Math.min(1.0, 2.0 * probabilityITM);

  // 14. IV Rank: ((Current IV - 52w Low) / (52w High - 52w Low)) * 100
  const currentIVPercent = sigma * 100;
  const highIV = default52wHighIV ?? currentIVPercent * 1.6;
  const lowIV = default52wLowIV ?? currentIVPercent * 0.65;
  const ivRank = Math.min(100, Math.max(0, ((currentIVPercent - lowIV) / (highIV - lowIV)) * 100));

  // 15. IV Percentile
  // Modeled as cumulative normal distribution position relative to historical mean & std dev
  const meanIV = (highIV + lowIV) / 2;
  const ivStd = Math.max(1.0, (highIV - lowIV) / 4);
  const ivZScore = (currentIVPercent - meanIV) / ivStd;
  const ivPercentile = Math.min(100, Math.max(0, normalCdf(ivZScore) * 100));

  // Lot Calculations:
  const lots = inputs.lots && inputs.lots > 0 ? inputs.lots : 1;
  const lotSize = inputs.lotSize && inputs.lotSize > 0 ? inputs.lotSize : 1;
  const totalQuantity = lots * lotSize;

  const positionDelta = delta * totalQuantity;
  const positionGamma = gamma * totalQuantity;
  const positionTheta = thetaDaily * totalQuantity;
  const positionVega = vega * totalQuantity;
  const positionRho = rho * totalQuantity;
  const positionValue = premium * totalQuantity;

  // Portfolio Exposure metrics:
  // Total Delta Exposure in currency units (e.g. ₹ exposure to underlying)
  const totalDeltaExposure = positionDelta * S;
  const totalGammaExposure = positionGamma;
  const totalVegaExposure = positionVega;
  const totalThetaExposure = positionTheta;

  return {
    d1: roundToPrecision(d1, 6),
    d2: roundToPrecision(d2, 6),
    delta: roundToPrecision(delta, 6),
    gamma: roundToPrecision(gamma, 6),
    thetaDaily: roundToPrecision(thetaDaily, 6),
    thetaAnnual: roundToPrecision(thetaAnnual, 6),
    vega: roundToPrecision(vega, 6),
    rho: roundToPrecision(rho, 6),
    premium: roundToPrecision(premium, 6),
    intrinsicValue: roundToPrecision(intrinsicValue, 6),
    extrinsicValue: roundToPrecision(extrinsicValue, 6),
    probabilityITM: roundToPrecision(probabilityITM * 100, 2), // in %
    probabilityOTM: roundToPrecision(probabilityOTM * 100, 2), // in %
    probabilityTouch: roundToPrecision(probabilityTouch * 100, 2), // in %
    ivRank: roundToPrecision(ivRank, 2),
    ivPercentile: roundToPrecision(ivPercentile, 2),
    lots,
    lotSize,
    totalQuantity,
    positionDelta: roundToPrecision(positionDelta, 6),
    positionGamma: roundToPrecision(positionGamma, 6),
    positionTheta: roundToPrecision(positionTheta, 6),
    positionVega: roundToPrecision(positionVega, 6),
    positionRho: roundToPrecision(positionRho, 6),
    positionValue: roundToPrecision(positionValue, 2),
    totalDeltaExposure: roundToPrecision(totalDeltaExposure, 2),
    totalGammaExposure: roundToPrecision(totalGammaExposure, 6),
    totalVegaExposure: roundToPrecision(totalVegaExposure, 2),
    totalThetaExposure: roundToPrecision(totalThetaExposure, 2)
  };
}
