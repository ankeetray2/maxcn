import { z } from 'zod';

/**
 * Validation schema for Black-Scholes calculation request
 */
export const calculateGreeksSchema = z.object({
  commodity: z.string().min(1, 'Commodity name is required'),
  spotPrice: z.number().positive('Spot price must be greater than 0'),
  strikePrice: z.number().positive('Strike price must be greater than 0'),
  // Support either timeToExpiryYears or expiryDays
  timeToExpiryYears: z.number().positive().optional(),
  expiryDays: z.number().positive().optional(),
  riskFreeRate: z.number().min(0, 'Risk-free rate must be non-negative'),
  impliedVolatility: z.number().positive('Implied volatility must be greater than 0'),
  optionType: z.enum(['CALL', 'PUT'], {
    message: "Option type must be either 'CALL' or 'PUT'"
  }),
  lots: z.number().int().positive().default(1).optional(),
  lotSize: z.number().positive().optional(),
  saveToDatabase: z.boolean().default(true).optional(),
  notes: z.string().max(500).optional()
}).refine((data) => data.timeToExpiryYears !== undefined || data.expiryDays !== undefined, {
  message: "Either 'timeToExpiryYears' or 'expiryDays' must be provided",
  path: ['timeToExpiryYears']
});

export type CalculateGreeksDTO = z.infer<typeof calculateGreeksSchema>;

/**
 * Validation schema for Scenario Analysis simulation
 */
export const scenarioAnalysisSchema = calculateGreeksSchema.extend({
  customMoves: z.array(z.number()).optional(),
  volatilityShocks: z.array(z.number()).optional() // e.g. [-5, 0, 5]
});

export type ScenarioAnalysisDTO = z.infer<typeof scenarioAnalysisSchema>;

/**
 * Normalizes input rates & volatility (accepts either percentage like 25 or decimal like 0.25)
 */
export function normalizeGreeksInput(input: CalculateGreeksDTO) {
  let timeToExpiryYears = input.timeToExpiryYears;
  if (timeToExpiryYears === undefined && input.expiryDays !== undefined) {
    timeToExpiryYears = input.expiryDays / 365.0;
  }

  // If user passed rate as e.g. 6.5 (percentage), convert to 0.065
  let rate = input.riskFreeRate;
  if (rate > 1.0) {
    rate = rate / 100.0;
  }

  // If user passed vol as e.g. 24.5 (percentage), convert to 0.245
  let vol = input.impliedVolatility;
  if (vol > 1.0) {
    vol = vol / 100.0;
  }

  return {
    commodity: input.commodity.toUpperCase(),
    spotPrice: input.spotPrice,
    strikePrice: input.strikePrice,
    timeToExpiryYears: Math.max(0.00001, timeToExpiryYears || 0.082),
    riskFreeRate: rate,
    impliedVolatility: vol,
    optionType: input.optionType,
    lots: input.lots || 1,
    lotSize: input.lotSize,
    saveToDatabase: input.saveToDatabase ?? true,
    notes: input.notes
  };
}
