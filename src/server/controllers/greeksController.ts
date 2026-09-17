import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { COMMODITY_SPECS_SERVER } from '../data/commoditySpecs';
import { GreeksCalculationService } from '../services/greeksCalculationService';
import { ScenarioService } from '../services/scenarioService';
import { calculateGreeksSchema, scenarioAnalysisSchema } from '../validators/greeksValidator';

export class GreeksController {
  private calculationService: GreeksCalculationService;
  private scenarioService: ScenarioService;

  constructor() {
    this.calculationService = new GreeksCalculationService();
    this.scenarioService = new ScenarioService();
  }

  /**
   * POST /api/greeks/calculate
   */
  calculate = async (req: Request, res: Response): Promise<void> => {
    try {
      const validated = calculateGreeksSchema.parse(req.body);
      const result = await this.calculationService.calculate(validated);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err: any) {
      if (err instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation Failed',
          details: (err.issues || []).map((e: any) => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
        return;
      }
      res.status(500).json({
        success: false,
        error: 'Calculation Error',
        message: err.message || 'An unexpected error occurred during calculation'
      });
    }
  };

  /**
   * POST /api/greeks/scenario
   */
  scenario = async (req: Request, res: Response): Promise<void> => {
    try {
      const validated = scenarioAnalysisSchema.parse(req.body);
      const result = await this.scenarioService.simulate(validated);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err: any) {
      if (err instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation Failed',
          details: (err.issues || []).map((e: any) => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
        return;
      }
      res.status(500).json({
        success: false,
        error: 'Scenario Simulation Error',
        message: err.message || 'An unexpected error occurred during scenario simulation'
      });
    }
  };

  /**
   * GET /api/greeks/history
   */
  getHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const commodity = req.query.commodity as string | undefined;
      const history = await this.calculationService.getHistory(limit, commodity);
      res.status(200).json({
        success: true,
        data: history
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch history',
        message: err.message
      });
    }
  };

  /**
   * GET /api/greeks/:id
   */
  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const record = await this.calculationService.getById(id);
      if (!record) {
        res.status(404).json({
          success: false,
          error: 'Record Not Found',
          message: `Greeks record with ID '${id}' was not found in database.`
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: record
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: 'Database Query Error',
        message: err.message
      });
    }
  };

  /**
   * DELETE /api/greeks/:id
   */
  deleteById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const deleted = await this.calculationService.deleteById(id);
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Record Not Found',
          message: `Greeks record with ID '${id}' not found or could not be deleted.`
        });
        return;
      }
      res.status(200).json({
        success: true,
        message: `Record ${id} deleted successfully.`,
        deleted: true
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: 'Database Deletion Error',
        message: err.message
      });
    }
  };

  /**
   * GET /api/greeks/commodities
   */
  getCommodities = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({
      success: true,
      data: Object.values(COMMODITY_SPECS_SERVER)
    });
  };

  /**
   * GET /api/greeks/docs
   */
  getApiDocs = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({
      title: 'MCX Commodity Option Greeks Engine API',
      version: '1.0.0',
      description: 'Enterprise-grade Black-Scholes Greeks Calculation Engine with MongoDB persistence for MCX Commodities',
      endpoints: [
        {
          path: '/api/greeks/calculate',
          method: 'POST',
          description: 'Calculates Black-Scholes Greeks, premiums, probabilities, and lot exposures, optionally saving to MongoDB.',
          requestExample: {
            commodity: 'GOLD',
            spotPrice: 78500,
            strikePrice: 79000,
            expiryDays: 30,
            riskFreeRate: 6.5,
            impliedVolatility: 15.4,
            optionType: 'CALL',
            lots: 2,
            lotSize: 100,
            saveToDatabase: true
          }
        },
        {
          path: '/api/greeks/scenario',
          method: 'POST',
          description: 'Simulates spot price moves (+100, +500, +1000, -100, -500, -1000 or custom) and returns recalculated Greeks and curve points.',
          requestExample: {
            commodity: 'GOLD',
            spotPrice: 78500,
            strikePrice: 79000,
            expiryDays: 30,
            riskFreeRate: 6.5,
            impliedVolatility: 15.4,
            optionType: 'CALL',
            lots: 2,
            lotSize: 100,
            customMoves: [-1000, -500, -100, 100, 500, 1000]
          }
        },
        {
          path: '/api/greeks/history',
          method: 'GET',
          description: 'Fetches calculation history stored in MongoDB or local persistent repository.'
        },
        {
          path: '/api/greeks/:id',
          method: 'GET',
          description: 'Fetches an individual calculation record by MongoDB ID.'
        },
        {
          path: '/api/greeks/:id',
          method: 'DELETE',
          description: 'Deletes an individual calculation record by MongoDB ID.'
        }
      ]
    });
  };
}
