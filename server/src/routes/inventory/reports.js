import express from 'express';
import auth from '../../middleware/auth.js';
import { getStockSummary, getSupplierSpend } from '../../controllers/inventory/reportsController.js';

const router = express.Router();

// Stock summary (supports: category, supplierId, startDate, endDate)
router.get('/stock-summary', auth, getStockSummary);

// Supplier spend (supports: supplierId, startDate, endDate)
router.get('/supplier-spend', auth, getSupplierSpend);

export default router;


