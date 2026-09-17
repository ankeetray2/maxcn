import { Router } from 'express';
import { GreeksController } from '../controllers/greeksController';

const router = Router();
const controller = new GreeksController();

// Core Calculation & Simulation Endpoints
router.post('/calculate', controller.calculate);
router.post('/scenario', controller.scenario);

// History & MongoDB persistence CRUD
router.get('/history', controller.getHistory);
router.get('/commodities', controller.getCommodities);
router.get('/docs', controller.getApiDocs);
router.get('/:id', controller.getById);
router.delete('/:id', controller.deleteById);

export default router;
