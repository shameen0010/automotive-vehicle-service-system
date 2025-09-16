import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate PDF for a single purchase order
 */
export const generatePurchaseOrderPDF = async (purchaseOrder, supplier, parts) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 50,
        info: {
          Title: `Purchase Order - ${purchaseOrder.poNumber || purchaseOrder._id}`,
          Author: 'Automotive Service Management System',
          Subject: 'Purchase Order',
          Keywords: 'purchase order, automotive, parts',
          CreationDate: new Date()
        }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .text('PURCHASE ORDER', { align: 'center' })
         .moveDown(0.5);

      // Company Info
      doc.fontSize(12)
         .font('Helvetica')
         .text('Automotive Service Management System', { align: 'center' })
         .text('123 Auto Service Lane, City, State 12345', { align: 'center' })
         .text('Phone: (555) 123-4567 | Email: info@autoservice.com', { align: 'center' })
         .moveDown(1);

      // PO Details
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Purchase Order Details')
         .moveDown(0.5);

      const poDetails = [
        ['PO Number:', purchaseOrder.poNumber || purchaseOrder._id],
        ['Date:', new Date(purchaseOrder.createdAt).toLocaleDateString()],
        ['Status:', purchaseOrder.status || 'Pending'],
        ['Expected Delivery:', purchaseOrder.expectedDeliveryDate ? new Date(purchaseOrder.expectedDeliveryDate).toLocaleDateString() : 'Not specified']
      ];

      poDetails.forEach(([label, value]) => {
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .text(label, { continued: true })
           .font('Helvetica')
           .text(` ${value}`)
           .moveDown(0.3);
      });

      doc.moveDown(0.5);

      // Supplier Information
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Supplier Information')
         .moveDown(0.5);

      if (supplier) {
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .text('Name:', { continued: true })
           .font('Helvetica')
           .text(` ${supplier.name}`)
           .moveDown(0.3);

        if (supplier.email) {
          doc.fontSize(10)
             .font('Helvetica-Bold')
             .text('Email:', { continued: true })
             .font('Helvetica')
             .text(` ${supplier.email}`)
             .moveDown(0.3);
        }

        if (supplier.phone) {
          doc.fontSize(10)
             .font('Helvetica-Bold')
             .text('Phone:', { continued: true })
             .font('Helvetica')
             .text(` ${supplier.phone}`)
             .moveDown(0.3);
        }

        if (supplier.address) {
          doc.fontSize(10)
             .font('Helvetica-Bold')
             .text('Address:', { continued: true })
             .font('Helvetica')
             .text(` ${supplier.address}`)
             .moveDown(0.3);
        }
      }

      doc.moveDown(0.5);

      // Delivery Address
      if (purchaseOrder.deliveryAddress && Object.values(purchaseOrder.deliveryAddress).some(val => val)) {
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('Delivery Address')
           .moveDown(0.5);

        const address = purchaseOrder.deliveryAddress;
        const addressParts = [
          address.street,
          address.city,
          address.state,
          address.zipCode,
          address.country
        ].filter(Boolean);

        if (addressParts.length > 0) {
          doc.fontSize(10)
             .font('Helvetica')
             .text(addressParts.join(', '))
             .moveDown(0.5);
        }
      }

      // Payment Information
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Payment Information')
         .moveDown(0.5);

      const paymentInfo = [
        ['Payment Terms:', purchaseOrder.paymentTerms || 'Not specified'],
        ['Payment Method:', purchaseOrder.paymentMethod || 'Not specified']
      ];

      paymentInfo.forEach(([label, value]) => {
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .text(label, { continued: true })
           .font('Helvetica')
           .text(` ${value}`)
           .moveDown(0.3);
      });

      doc.moveDown(0.5);

      // Items Table
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Order Items')
         .moveDown(0.5);

      if (purchaseOrder.items && purchaseOrder.items.length > 0) {
        // Table headers
        const tableTop = doc.y;
        const itemCodeX = 50;
        const itemNameX = 120;
        const quantityX = 300;
        const unitPriceX = 380;
        const totalX = 480;

        // Headers
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .text('Item Code', itemCodeX, tableTop)
           .text('Item Name', itemNameX, tableTop)
           .text('Qty', quantityX, tableTop)
           .text('Unit Price', unitPriceX, tableTop)
           .text('Total', totalX, tableTop);

        // Separator line
        doc.moveTo(50, tableTop + 15)
           .lineTo(550, tableTop + 15)
           .stroke();

        let currentY = tableTop + 25;
        let grandTotal = 0;

        // Items
        purchaseOrder.items.forEach((item, index) => {
          const part = parts.find(p => p._id === item.part);
          const itemName = part ? part.name : 'Unknown Part';
          const itemCode = part ? part.partCode : 'N/A';
          const quantity = item.quantity || 0;
          const unitPrice = item.unitPrice || 0;
          const total = quantity * unitPrice;
          grandTotal += total;

          doc.fontSize(9)
             .font('Helvetica')
             .text(itemCode, itemCodeX, currentY)
             .text(itemName, itemNameX, currentY, { width: 160, ellipsis: true })
             .text(quantity.toString(), quantityX, currentY)
             .text(`$${unitPrice.toFixed(2)}`, unitPriceX, currentY)
             .text(`$${total.toFixed(2)}`, totalX, currentY);

          currentY += 20;

          // Add page break if needed
          if (currentY > 700) {
            doc.addPage();
            currentY = 50;
          }
        });

        // Total line
        doc.moveTo(50, currentY)
           .lineTo(550, currentY)
           .stroke();

        currentY += 10;

        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text('Grand Total:', 380, currentY)
           .text(`$${grandTotal.toFixed(2)}`, 480, currentY);
      }

      // Notes
      if (purchaseOrder.notes) {
        doc.addPage();
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('Notes')
           .moveDown(0.5);

        doc.fontSize(10)
           .font('Helvetica')
           .text(purchaseOrder.notes, { width: 500 });
      }

      // Shipping Instructions
      if (purchaseOrder.shippingInstructions) {
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('Shipping Instructions')
           .moveDown(0.5);

        doc.fontSize(10)
           .font('Helvetica')
           .text(purchaseOrder.shippingInstructions, { width: 500 });
      }

      // Footer
      doc.fontSize(10)
         .font('Helvetica')
         .text('Generated on: ' + new Date().toLocaleString(), { align: 'center' })
         .moveDown(0.5)
         .text('This is a computer-generated document. No signature required.', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate PDF for multiple purchase orders (summary report)
 */
export const generatePurchaseOrdersSummaryPDF = async (purchaseOrders, suppliers, parts) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 50,
        info: {
          Title: 'Purchase Orders Summary Report',
          Author: 'Automotive Service Management System',
          Subject: 'Purchase Orders Summary',
          Keywords: 'purchase orders, summary, automotive, parts',
          CreationDate: new Date()
        }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .text('PURCHASE ORDERS SUMMARY', { align: 'center' })
         .moveDown(0.5);

      doc.fontSize(12)
         .font('Helvetica')
         .text('Automotive Service Management System', { align: 'center' })
         .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' })
         .moveDown(1);

      // Summary Table
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Purchase Orders Overview')
         .moveDown(0.5);

      const tableTop = doc.y;
      const poNumberX = 50;
      const dateX = 120;
      const supplierX = 200;
      const statusX = 300;
      const totalX = 380;

      // Headers
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text('PO Number', poNumberX, tableTop)
         .text('Date', dateX, tableTop)
         .text('Supplier', supplierX, tableTop)
         .text('Status', statusX, tableTop)
         .text('Total', totalX, tableTop);

      // Separator line
      doc.moveTo(50, tableTop + 15)
         .lineTo(500, tableTop + 15)
         .stroke();

      let currentY = tableTop + 25;
      let grandTotal = 0;

      // Purchase Orders
      purchaseOrders.forEach((po, index) => {
        const supplier = suppliers.find(s => s._id === po.supplier);
        const supplierName = supplier ? supplier.name : 'Unknown Supplier';
        const poTotal = po.items ? po.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) : 0;
        grandTotal += poTotal;

        doc.fontSize(9)
           .font('Helvetica')
           .text(po.poNumber || po._id.slice(-8), poNumberX, currentY)
           .text(new Date(po.createdAt).toLocaleDateString(), dateX, currentY)
           .text(supplierName, supplierX, currentY, { width: 80, ellipsis: true })
           .text(po.status || 'Pending', statusX, currentY)
           .text(`$${poTotal.toFixed(2)}`, totalX, currentY);

        currentY += 20;

        // Add page break if needed
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }
      });

      // Total line
      doc.moveTo(50, currentY)
         .lineTo(500, currentY)
         .stroke();

      currentY += 10;

      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('Grand Total:', 300, currentY)
         .text(`$${grandTotal.toFixed(2)}`, 380, currentY);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate PDF for stock summary report
 */
export const generateStockSummaryPDF = async (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40, info: { Title: 'Stock Summary Report', Author: 'Automotive Service Management System' } });
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header
      doc.font('Helvetica-Bold').fontSize(20).text('STOCK SUMMARY REPORT', { align: 'center' }).moveDown(0.5);
      doc.font('Helvetica').fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' }).moveDown(1);

      // Summary
      doc.font('Helvetica-Bold').fontSize(12).text('Overview').moveDown(0.3);
      doc.font('Helvetica').fontSize(10)
        .text(`Total Parts: ${data.summary.totalParts}`)
        .text(`Total On Hand: ${data.summary.totalOnHand}`)
        .text(`Total Available: ${data.summary.totalAvailable}`)
        .text(`Stock Value: $${Number(data.summary.totalValuation || 0).toFixed(2)}`)
        .moveDown(0.8);

      // Table headers
      const headers = ['Part Code','Name','Category','OnHand','Reserved','Avail','Min','Max','Reorder','Status','Unit','Value'];
      const colX = [40, 100, 240, 320, 360, 405, 445, 480, 515, 560, 600, 640];
      const headerY = doc.y;
      doc.font('Helvetica-Bold').fontSize(9);
      headers.forEach((h, i) => { doc.text(h, colX[i], headerY, { width: (colX[i+1]||690) - colX[i] - 2 }); });
      doc.moveTo(40, headerY + 12).lineTo(690, headerY + 12).stroke();

      // Rows
      doc.font('Helvetica').fontSize(9);
      let y = headerY + 18;
      data.items.forEach((r) => {
        if (y > 740) {
          doc.addPage();
          y = 40;
        }
        const values = [
          r.partCode,
          r.name,
          r.category,
          String(r.onHand),
          String(r.reserved),
          String(r.available),
          String(r.minLevel ?? ''),
          String(r.maxLevel ?? ''),
          String(r.reorderLevel ?? ''),
          r.status || '',
          `$${Number(r.unitPrice || 0).toFixed(2)}`,
          `$${Number(r.value || 0).toFixed(2)}`
        ];
        values.forEach((v, i) => { doc.text(v, colX[i], y, { width: (colX[i+1]||690) - colX[i] - 2 }); });
        y += 14;
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Generate PDF for supplier spend report
 */
export const generateSupplierSpendPDF = async (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40, info: { Title: 'Supplier Spend Report', Author: 'Automotive Service Management System' } });
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header
      doc.font('Helvetica-Bold').fontSize(20).text('SUPPLIER SPEND REPORT', { align: 'center' }).moveDown(0.5);
      doc.font('Helvetica').fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' }).moveDown(1);

      // Table headers
      const headers = ['Supplier','Orders','Total','Avg','Min','Max','First','Last'];
      const colX = [40, 240, 300, 360, 420, 480, 540, 600];
      const headerY = doc.y;
      doc.font('Helvetica-Bold').fontSize(9);
      headers.forEach((h, i) => { doc.text(h, colX[i], headerY, { width: (colX[i+1]||690) - colX[i] - 2 }); });
      doc.moveTo(40, headerY + 12).lineTo(690, headerY + 12).stroke();

      // Rows
      doc.font('Helvetica').fontSize(9);
      let y = headerY + 18;
      data.rows.forEach(r => {
        if (y > 740) { doc.addPage(); y = 40; }
        const values = [
          r.companyName || '',
          String(r.totalOrders || 0),
          `$${Number(r.totalAmount || 0).toFixed(2)}`,
          `$${Number(r.avgOrderValue || 0).toFixed(2)}`,
          `$${Number(r.minOrderValue || 0).toFixed(2)}`,
          `$${Number(r.maxOrderValue || 0).toFixed(2)}`,
          r.firstOrderDate ? new Date(r.firstOrderDate).toISOString().split('T')[0] : '',
          r.lastOrderDate ? new Date(r.lastOrderDate).toISOString().split('T')[0] : ''
        ];
        values.forEach((v, i) => { doc.text(v, colX[i], y, { width: (colX[i+1]||690) - colX[i] - 2 }); });
        y += 14;
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};