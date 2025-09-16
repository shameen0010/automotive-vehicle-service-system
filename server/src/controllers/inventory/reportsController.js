import mongoose from 'mongoose';
import Part from '../../models/inventory/Part.js';
import PurchaseOrder from '../../models/inventory/PurchaseOrder.js';

// Build common filters from query
function buildFilters(query) {
  const { startDate, endDate, supplierId, category } = query;
  const dateFilter = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(endDate);

  const partMatch = {};
  if (category) partMatch.category = category;

  const poMatch = {};
  if (supplierId) poMatch.supplier = new mongoose.Types.ObjectId(supplierId);
  if (dateFilter.$gte || dateFilter.$lte) poMatch.createdAt = dateFilter;

  return { partMatch, poMatch };
}

// GET /api/inventory/reports/stock-summary
// Returns current stock levels and valuation, optionally filtered by category
export async function getStockSummary(req, res) {
  try {
    const { partMatch, poMatch } = buildFilters(req.query);

    // Latest prices per part from Purchase Orders (respect supplier/date filters if provided)
    const latestPrices = await PurchaseOrder.aggregate([
      { $match: poMatch },
      { $unwind: '$items' },
      { $project: { part: '$items.part', unitPrice: '$items.unitPrice', createdAt: 1 } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$part', unitPrice: { $first: '$unitPrice' } } }
    ]);

    const partIdToPrice = new Map(latestPrices.map(p => [String(p._id), p.unitPrice || 0]));

    const parts = await Part.find({ isActive: true, ...partMatch })
      .select('name partCode category stock.onHand stock.reserved');

    let totalOnHand = 0;
    let totalAvailable = 0;
    let totalValuation = 0;

    const items = parts.map(p => {
      const onHand = p?.stock?.onHand || 0;
      const reserved = p?.stock?.reserved || 0;
      const available = Math.max(0, onHand - reserved);
      const price = partIdToPrice.get(String(p._id)) || 0;
      const value = onHand * price;
      totalOnHand += onHand;
      totalAvailable += available;
      totalValuation += value;
      return {
        partId: p._id,
        name: p.name,
        partCode: p.partCode,
        category: p.category,
        onHand,
        reserved,
        available,
        unitPrice: price,
        value
      };
    });

    res.json({
      summary: {
        totalParts: parts.length,
        totalOnHand,
        totalAvailable,
        totalValuation
      },
      items
    });
  } catch (error) {
    console.error('getStockSummary error:', error);
    res.status(500).json({ message: 'Failed to generate stock summary report' });
  }
}

// GET /api/inventory/reports/supplier-spend
// Aggregates purchase order spend by supplier within date range
export async function getSupplierSpend(req, res) {
  try {
    const { poMatch } = buildFilters(req.query);

    const pipeline = [
      { $match: poMatch },
      { $group: { _id: '$supplier', totalOrders: { $sum: 1 }, totalAmount: { $sum: '$totalAmount' } } },
      { $sort: { totalAmount: -1 } },
      { $lookup: { from: 'suppliers', localField: '_id', foreignField: '_id', as: 'supplier' } },
      { $unwind: { path: '$supplier', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, supplierId: '$_id', companyName: '$supplier.companyName', totalOrders: 1, totalAmount: 1 } }
    ];

    const rows = await PurchaseOrder.aggregate(pipeline);
    res.json({ rows });
  } catch (error) {
    console.error('getSupplierSpend error:', error);
    res.status(500).json({ message: 'Failed to generate supplier spend report' });
  }
}


