import express from 'express';
import auth from '../../middleware/auth.js';
import { getStockSummary, getSupplierSpend, downloadStockSummaryCSV, downloadStockSummaryPDF, downloadSupplierSpendCSV, downloadSupplierSpendPDF } from '../../controllers/inventory/reportsController.js';

const router = express.Router();

// Stock summary (supports: category, supplierId, startDate, endDate)
router.get('/stock-summary', auth, getStockSummary);

// Stock summary downloads
router.get('/stock-summary/download.csv', auth, downloadStockSummaryCSV);
router.get('/stock-summary/download.pdf', auth, downloadStockSummaryPDF);

// Supplier spend (supports: supplierId, startDate, endDate)
router.get('/supplier-spend', auth, getSupplierSpend);

// Supplier spend downloads
router.get('/supplier-spend/download.csv', auth, downloadSupplierSpendCSV);
router.get('/supplier-spend/download.pdf', auth, downloadSupplierSpendPDF);

export default router;


