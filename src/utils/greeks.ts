import { GreekResult, OptionType, PricingModel } from '../types';

/**
 * Standard normal probability density function (PDF): N'(x)
 */
export function normalPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/**
 * Cumulative standard normal distribution function: N(x)
 * Accurate Abramowitz & Stegun polynomial approximation (error < 7.5e-8)
 */
export function normalCdf(x: number): number {
  if (isNaN(x)) return 0;
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
 * Round to financial precision (up to 6 decimal places)
 */
export function round6(val: number): number {
  if (isNaN(val) || !isFinite(val)) return 0;
  return Math.round((val + Number.EPSILON) * 1000000) / 1000000;
}

/**
 * Calculate Option Greeks using Black-Scholes Option Pricing Model
 * Formulas:
 * 1. d1 = [ln(S/K) + (r + σ²/2) × T] / [σ × √T]
 * 2. d2 = d1 − σ × √T
 * 3. Delta: CALL N(d1), PUT N(d1) - 1
 * 4. Gamma: N'(d1) / [S × σ × √T]
 * 5. Theta: daily decay
 *    CALL: −[S × N'(d1) × σ / (2√T)] − rK e^(−rT) N(d2)
 *    PUT:  −[S × N'(d1) × σ / (2√T)] + rK e^(−rT) N(−d2)
 * 6. Vega: S × N'(d1) × √T / 100
 * 7. Rho:
 *    CALL: K × T × e^(−rT) × N(d2) / 100
 *    PUT: −K × T × e^(−rT) × N(−d2) / 100
 * 8. Premium: theoretical Black-Scholes
 * 9. Intrinsic Value: CALL max(0, S-K), PUT max(0, K-S)
 * 10. Extrinsic Value: Premium - Intrinsic Value
 * 11-15. Probability ITM, OTM, Touch, IV Rank, IV Percentile
 * 16-19. Lot Calculations & Exposures
 */
export function calculateGreeks(
  F: number,
  K: number,
  days: number,
  vol: number,
  rate: number,
  type: OptionType,
  model: PricingModel = 'BLACK_SCHOLES',
  lots: number = 1,
  lotSize: number = 100,
  highIV52w?: number,
  lowIV52w?: number
): GreekResult {
  const S = Math.max(0.0001, F);
  const strike = Math.max(0.0001, K);
  const sigma = Math.max(0.0001, vol / 100);
  const r = rate / 100;
  const T = Math.max(0.0001, days / 365.0);
  const sqrtT = Math.sqrt(T);

  const discountFactor = Math.exp(-r * T);

  // 1. d1 = [ln(S/K) + (r + σ²/2) × T] / [σ × √T]
  const d1 = (Math.log(S / strike) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);

  // 2. d2 = d1 − σ × √T
  const d2 = d1 - sigma * sqrtT;

  const Nd1 = normalCdf(d1);
  const Nd2 = normalCdf(d2);
  const NnegD1 = normalCdf(-d1);
  const NnegD2 = normalCdf(-d2);
  const pdfD1 = normalPdf(d1);

  const isCall = type === 'CALL';

  // 3. Delta
  const delta = isCall ? Nd1 : Nd1 - 1.0;

  // 4. Gamma
  const gamma = pdfD1 / (S * sigma * sqrtT);

  // 5. Theta (annual and daily decay)
  const thetaFirstTerm = -(S * pdfD1 * sigma) / (2.0 * sqrtT);
  let thetaAnnual: number;
  if (isCall) {
    thetaAnnual = thetaFirstTerm - r * strike * discountFactor * Nd2;
  } else {
    thetaAnnual = thetaFirstTerm + r * strike * discountFactor * NnegD2;
  }
  const thetaDaily = thetaAnnual / 365.0;

  // 6. Vega (per 1% move in volatility)
  const vega = (S * pdfD1 * sqrtT) / 100.0;

  // 7. Rho (per 1% move in rate)
  let rho: number;
  if (isCall) {
    rho = (strike * T * discountFactor * Nd2) / 100.0;
  } else {
    rho = (-strike * T * discountFactor * NnegD2) / 100.0;
  }

  // 8. Option Premium
  let price: number;
  if (isCall) {
    price = S * Nd1 - strike * discountFactor * Nd2;
  } else {
    price = strike * discountFactor * NnegD2 - S * NnegD1;
  }
  price = Math.max(0, price);

  // 9. Intrinsic Value
  const intrinsicValue = isCall ? Math.max(0, S - strike) : Math.max(0, strike - S);

  // 10. Extrinsic Value (Time Value)
  const extrinsicValue = Math.max(0, price - intrinsicValue);

  // 10b. Breakeven & POP (Probability of Profit)
  const breakeven = isCall ? strike + price : Math.max(0.0001, strike - price);
  let popRaw = 0;
  if (breakeven > 0) {
    const d2Breakeven = (Math.log(S / breakeven) + (r - 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
    popRaw = isCall ? normalCdf(d2Breakeven) : normalCdf(-d2Breakeven);
  }
  const pop = Math.min(99.9, Math.max(0.1, popRaw * 100));

  // Additional Metrics:
  // 11. Probability ITM
  const probabilityITM = isCall ? Nd2 : NnegD2;

  // 12. Probability OTM
  const probabilityOTM = Math.max(0, 1.0 - probabilityITM);

  // 13. Probability Touch
  const probabilityTouch = Math.min(1.0, 2.0 * probabilityITM);

  // 14. IV Rank
  const currentIV = vol;
  const highIV = highIV52w ?? currentIV * 1.6;
  const lowIV = lowIV52w ?? currentIV * 0.65;
  const ivRank = Math.min(100, Math.max(0, ((currentIV - lowIV) / (highIV - lowIV)) * 100));

  // 15. IV Percentile
  const meanIV = (highIV + lowIV) / 2;
  const ivStd = Math.max(1.0, (highIV - lowIV) / 4);
  const ivZScore = (currentIV - meanIV) / ivStd;
  const ivPercentile = Math.min(100, Math.max(0, normalCdf(ivZScore) * 100));

  // Lot Calculations:
  const validLots = Math.max(1, lots);
  const validLotSize = Math.max(1, lotSize);
  const totalQuantity = validLots * validLotSize;

  const positionDelta = delta * totalQuantity;
  const positionGamma = gamma * totalQuantity;
  const positionTheta = thetaDaily * totalQuantity;
  const positionVega = vega * totalQuantity;
  const positionRho = rho * totalQuantity;
  const positionValue = price * totalQuantity;

  // Total Exposures:
  const totalDeltaExposure = positionDelta * S;
  const totalGammaExposure = positionGamma;
  const totalVegaExposure = positionVega;
  const totalThetaExposure = positionTheta;

  return {
    price: round6(price),
    delta: round6(delta),
    gamma: round6(gamma),
    theta: round6(thetaDaily),
    thetaAnnual: round6(thetaAnnual),
    vega: round6(vega),
    rho: round6(rho),
    pop: Number(pop.toFixed(2)),
    breakeven: round6(breakeven),
    intrinsicValue: round6(intrinsicValue),
    timeValue: round6(extrinsicValue),
    extrinsicValue: round6(extrinsicValue),
    d1: round6(d1),
    d2: round6(d2),
    probabilityITM: Number((probabilityITM * 100).toFixed(2)),
    probabilityOTM: Number((probabilityOTM * 100).toFixed(2)),
    probabilityTouch: Number((probabilityTouch * 100).toFixed(2)),
    ivRank: Number(ivRank.toFixed(2)),
    ivPercentile: Number(ivPercentile.toFixed(2)),
    lots: validLots,
    lotSize: validLotSize,
    totalQuantity,
    positionDelta: round6(positionDelta),
    positionGamma: round6(positionGamma),
    positionTheta: round6(positionTheta),
    positionVega: round6(positionVega),
    positionRho: round6(positionRho),
    positionValue: Number(positionValue.toFixed(2)),
    totalDeltaExposure: Number(totalDeltaExposure.toFixed(2)),
    totalGammaExposure: round6(totalGammaExposure),
    totalVegaExposure: Number(totalVegaExposure.toFixed(2)),
    totalThetaExposure: Number(totalThetaExposure.toFixed(2))
  };
}

/**
 * Format currency with locale precision (Indian Rupee ₹ or USD $)
 */
export function formatCurrency(
  val: number,
  currency: 'INR' | 'USD' = 'INR',
  precision = 2
): string {
  if (val === undefined || isNaN(val)) return '₹0.00';
  const sym = currency === 'INR' ? '₹' : '$';
  if (Math.abs(val) >= 10_000_000 && currency === 'INR') {
    return `${sym}${(val / 10_000_000).toFixed(2)} Cr`;
  }
  if (Math.abs(val) >= 100_000 && currency === 'INR') {
    return `${sym}${(val / 100_000).toFixed(2)} L`;
  }
  if (Math.abs(val) >= 1_000_000 && currency === 'USD') {
    return `${sym}${(val / 1_000_000).toFixed(2)}M`;
  }
  return `${sym}${val.toLocaleString('en-IN', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision
  })}`;
}

/**
 * Format raw Greek number with sign and precise decimals (up to 6 decimals)
 */
export function formatGreek(val: number, precision = 4, showSign = true): string {
  if (val === undefined || isNaN(val)) return '0.0000';
  const prefix = showSign && val > 0 ? '+' : '';
  return `${prefix}${val.toFixed(precision)}`;
}
