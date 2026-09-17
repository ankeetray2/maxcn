import { calculateBlackScholesGreeks, normalCdf, normalPdf, roundToPrecision } from '../utils/blackScholes';
import { calculateGreeksSchema, normalizeGreeksInput } from '../validators/greeksValidator';
import { COMMODITY_SPECS_SERVER } from '../data/commoditySpecs';

/**
 * Unit Test Suite for Commodity Option Greeks Calculation Engine
 */
let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  PASS: ${testName}`);
  } else {
    console.error(`  FAIL: ${testName} ${details ? `(${details})` : ''}`);
  }
}

function assertNear(actual: number, expected: number, tolerance: number = 0.001, testName: string) {
  const diff = Math.abs(actual - expected);
  assert(diff <= tolerance, testName, `Expected ~${expected}, got ${actual}, diff: ${diff}`);
}

export function runAllTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING COMMODITY GREEKS CALCULATION TEST SUITE');
  console.log('======================================================\n');

  // Test 1: Cumulative Normal Distribution N(x) & PDF N'(x)
  console.log('--- Group 1: Statistical Distributions ---');
  assertNear(normalCdf(0), 0.5, 0.0001, 'N(0) must equal 0.5');
  assertNear(normalCdf(1.96), 0.975, 0.001, 'N(1.96) must be ~0.975');
  assertNear(normalCdf(-1.96), 0.025, 0.001, 'N(-1.96) must be ~0.025');
  assertNear(normalPdf(0), 1 / Math.sqrt(2 * Math.PI), 0.0001, "N'(0) standard bell peak");

  // Test 2: Core Black-Scholes Greeks Benchmark (Gold Call)
  console.log('\n--- Group 2: Black-Scholes Greeks Formulas ---');
  const goldCall = calculateBlackScholesGreeks({
    commodity: 'GOLD',
    spotPrice: 78500,
    strikePrice: 78500, // ATM
    timeToExpiryYears: 30 / 365,
    riskFreeRate: 0.065,
    impliedVolatility: 0.154,
    optionType: 'CALL',
    lots: 1,
    lotSize: 100
  });

  const goldPut = calculateBlackScholesGreeks({
    commodity: 'GOLD',
    spotPrice: 78500,
    strikePrice: 78500, // ATM
    timeToExpiryYears: 30 / 365,
    riskFreeRate: 0.065,
    impliedVolatility: 0.154,
    optionType: 'PUT',
    lots: 1,
    lotSize: 100
  });

  // Delta range
  assert(goldCall.delta > 0.49 && goldCall.delta < 0.58, 'ATM Call Delta should be between 0.49 and 0.58');
  assert(goldPut.delta < -0.42 && goldPut.delta > -0.51, 'ATM Put Delta should be between -0.51 and -0.42');
  
  // Delta Parity: Delta_call - Delta_put = 1.0 (with precision)
  assertNear(goldCall.delta - goldPut.delta, 1.0, 0.0001, 'Delta Call - Delta Put must equal 1.0');

  // Gamma equality
  assertNear(goldCall.gamma, goldPut.gamma, 0.000001, 'Call and Put Gamma must be identical');
  assert(goldCall.gamma > 0, 'Gamma must be strictly positive');

  // Vega equality
  assertNear(goldCall.vega, goldPut.vega, 0.0001, 'Call and Put Vega must be identical');
  assert(goldCall.vega > 0, 'Vega must be strictly positive for long option');

  // Theta daily decay
  assert(goldCall.thetaDaily < 0, 'Daily Theta decay must be negative for long Call');
  assert(goldPut.thetaDaily < 0, 'Daily Theta decay must be negative for long Put');

  // Rho signs
  assert(goldCall.rho > 0, 'Call Rho must be positive with interest rate');
  assert(goldPut.rho < 0, 'Put Rho must be negative with interest rate');

  // Put-Call Parity Test: C - P = S - K * e^(-rT)
  const discountFactor = Math.exp(-0.065 * (30 / 365));
  const expectedParityDiff = 78500 - 78500 * discountFactor;
  assertNear(goldCall.premium - goldPut.premium, expectedParityDiff, 0.05, 'Put-Call Parity holds');

  // Test 3: Lot Calculations & Portfolio Exposures
  console.log('\n--- Group 3: Lot Calculations & Exposures ---');
  const multiLotSilver = calculateBlackScholesGreeks({
    commodity: 'SILVER',
    spotPrice: 93200,
    strikePrice: 94000,
    timeToExpiryYears: 45 / 365,
    riskFreeRate: 0.065,
    impliedVolatility: 0.238,
    optionType: 'CALL',
    lots: 3,
    lotSize: 30 // MCX Silver 30kg
  });

  assert(multiLotSilver.totalQuantity === 90, 'Total quantity = 3 lots * 30kg = 90kg');
  assertNear(multiLotSilver.positionDelta, multiLotSilver.delta * 90, 0.001, 'Position Delta = delta * quantity');
  assertNear(multiLotSilver.positionTheta, multiLotSilver.thetaDaily * 90, 0.001, 'Position Theta = thetaDaily * quantity');
  assertNear(multiLotSilver.totalDeltaExposure, multiLotSilver.positionDelta * 93200, 1.0, 'Total Delta Exposure = Position Delta * Spot');

  // Test 4: Zod Validation & Normalization
  console.log('\n--- Group 4: Zod Validation ---');
  const validDTO = calculateGreeksSchema.safeParse({
    commodity: 'CRUDEOIL',
    spotPrice: 6240,
    strikePrice: 6200,
    expiryDays: 20,
    riskFreeRate: 6.5, // percent
    impliedVolatility: 32.5, // percent
    optionType: 'CALL',
    lots: 5
  });
  assert(validDTO.success, 'Valid DTO passes Zod validation');

  const invalidDTO = calculateGreeksSchema.safeParse({
    commodity: 'COPPER',
    spotPrice: -850, // negative spot
    strikePrice: 850,
    expiryDays: 10,
    riskFreeRate: 6.5,
    impliedVolatility: 20,
    optionType: 'INVALID_TYPE'
  });
  assert(!invalidDTO.success, 'Invalid DTO rejected by Zod');

  // Test 5: All 9 MCX Commodities specifications verification
  console.log('\n--- Group 5: MCX Commodity Specifications ---');
  const expectedCommodities = [
    'GOLD', 'SILVER', 'CRUDEOIL', 'NATURALGAS', 'COPPER', 'ZINC', 'ALUMINIUM', 'LEAD', 'NICKEL'
  ];
  for (const c of expectedCommodities) {
    const spec = COMMODITY_SPECS_SERVER[c as any];
    assert(spec !== undefined, `Commodity ${c} spec exists with symbol ${spec?.symbol}`);
    assert(spec?.standardLotSize > 0, `Commodity ${c} has valid standard lot size ${spec?.standardLotSize}`);
  }

  // MCX Gold Mini test: 100g
  const goldMiniSpec = COMMODITY_SPECS_SERVER.GOLD.lotPresets.find(p => p.size === 10);
  assert(goldMiniSpec !== undefined, 'MCX Gold Mini (100g) preset exists');

  // MCX Silver 30kg test
  const silverSpec = COMMODITY_SPECS_SERVER.SILVER;
  assert(silverSpec.standardLotSize === 30, 'MCX Silver Standard lot size is 30kg');

  console.log('\n======================================================');
  console.log(`🏁 TEST RESULTS: ${passedTests}/${totalTests} Passed (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
  console.log('======================================================\n');

  return { passedTests, totalTests, success: passedTests === totalTests };
}

// Auto-run if executed directly via tsx
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('blackScholes.test')) {
  runAllTests();
}
