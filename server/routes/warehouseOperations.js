import express from 'express';
import mongoose from 'mongoose';
import { authenticate } from '../middleware/auth.js';
import WarehouseReceipt from '../models/WarehouseReceipt.js';
import Stock from '../models/Stock.js';
import StockMovement from '../models/StockMovement.js';
import PurchaseRequest from '../models/PurchaseRequest.js';

const router = express.Router();

// Route to receive goods against a warehouse receipt
router.post('/receipts/:id/receive', authenticate, async (req, res) => {
  const { id: receiptId } = req.params;
  // Body should contain the quantity being received for each item.
  // Example: { "items": [{ "itemId": "60d5f1b4f8a4a2a1a8e4b3e2", "receivedQuantity": 10 }] }
  const { items } = req.body;
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      // 1. Validate input
      if (!mongoose.Types.ObjectId.isValid(receiptId)) {
        throw new Error('Invalid receipt ID format.');
      }
      if (!items || !Array.isArray(items) || items.length === 0) {
        throw new Error('Received items data is required.');
      }

      // 2. Find the Warehouse Receipt
      const receipt = await WarehouseReceipt.findById(receiptId).session(session);
      if (!receipt) {
        throw new Error('Warehouse receipt not found.');
      }
      if (receipt.status !== 'pending') {
        throw new Error(`Receipt is already in status: ${receipt.status}.`);
      }

      // 3. Process each received item
      for (const receivedItem of items) {
        const { itemId, receivedQuantity } = receivedItem;

        const itemInReceipt = receipt.items.find(item => item._id.toString() === itemId);
        if (!itemInReceipt) {
          throw new Error(`Item with ID ${itemId} not found in this receipt.`);
        }
        
        if (receivedQuantity <= 0) {
            throw new Error('Received quantity must be positive.');
        }

        if (itemInReceipt.quantityReceived + receivedQuantity > itemInReceipt.quantityOrdered) {
            throw new Error(`Cannot receive more than ordered for item ${itemInReceipt.productName}.`);
        }

        // 4. Update Stock, create Movement, and update Average Cost
        const stock = await Stock.findOneAndUpdate(
          { warehouseId: receipt.warehouseId, productId: itemInReceipt.productId },
          { $inc: { 'quantities.available': receivedQuantity } },
          { new: true, upsert: true, session }
        );
        
        await Stock.updateAverageCost(receipt.warehouseId, itemInReceipt.productId, receivedQuantity, itemInReceipt.unitCost);

        const movement = new StockMovement({
          warehouseId: receipt.warehouseId,
          productId: itemInReceipt.productId,
          quantity: receivedQuantity,
          unitCost: itemInReceipt.unitCost,
          type: 'receipt',
          subtype: 'purchase',
          reference: { type: 'warehouse_receipt', id: receipt._id, number: receipt.receiptNumber },
          reason: `Receipt for PO: ${receipt.purchaseRequestNumber}`,
          executedBy: { userId: req.user._id, name: `${req.user.profile.firstName} ${req.user.profile.lastName}` },
        });
        await movement.save({ session });

        itemInReceipt.quantityReceived += receivedQuantity;
      }
      
      // 5. Update overall status for Receipt and Purchase Request
      const totalOrdered = receipt.items.reduce((sum, item) => sum + item.quantityOrdered, 0);
      const totalReceived = receipt.items.reduce((sum, item) => sum + item.quantityReceived, 0);

      if (totalReceived >= totalOrdered) {
        receipt.status = 'completed';
      } else {
        receipt.status = 'partially_received';
      }
      await receipt.save({ session });

      const purchaseRequest = await PurchaseRequest.findById(receipt.purchaseRequestId).session(session);
      if (purchaseRequest) {
        purchaseRequest.warehouseInfo.receivedQuantity = totalReceived;
        purchaseRequest.warehouseInfo.pendingQuantity = totalOrdered - totalReceived;
        
        if (receipt.status === 'completed') {
            purchaseRequest.warehouseInfo.warehouseStatus = 'received_complete';
            purchaseRequest.status = 'received';
        } else {
            purchaseRequest.warehouseInfo.warehouseStatus = 'received_partial';
        }
        await purchaseRequest.save({ session });
      }

      res.status(200).json({ success: true, message: 'Goods received successfully.', receipt });
    });
  } catch (error) {
    console.error('Receive goods error:', error);
    res.status(400).json({ success: false, message: error.message });
  } finally {
    await session.endSession();
  }
});

export default router;
