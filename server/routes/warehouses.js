import express from 'express';
import mongoose from 'mongoose';
import Warehouse from '../models/Warehouse.js';
import Product from '../models/Product.js';
import Stock from '../models/Stock.js';
import StockMovement from '../models/StockMovement.js';
import WarehouseReceipt from '../models/WarehouseReceipt.js';
import PurchaseRequest from '../models/PurchaseRequest.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/', 
  authenticate, 
  authorize('admin'), 
  async (req, res) => {
    try {
      const warehouse = new Warehouse(req.body);
      await warehouse.save();
      res.status(201).json({ 
        success: true, 
        message: 'Warehouse created successfully', 
        warehouse 
      });
    } catch (error) {
      console.error('Create warehouse error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error creating warehouse' 
      });
    }
  }
);

// Get all warehouses
router.get('/', authenticate, async (req, res) => {
  try {
    const warehouses = await Warehouse.find({ status: 'active' })
      .populate('responsible.userId', 'profile.firstName profile.lastName')
      .sort({ name: 1 });

    res.json({
      success: true,
      warehouses
    });
  } catch (error) {
    console.error('Get warehouses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching warehouses'
    });
  }
});

// Get approved purchase requests ready for warehouse receipt
router.get('/pending-receipts', authenticate, async (req, res) => {
  try {
    const requests = await PurchaseRequest.find({
      status: { $in: ['approved', 'in_warehouse'] },
      'warehouseInfo.warehouseStatus': { $in: ['pending_assignment', 'assigned', 'in_transit'] }
    })
    .populate('requestor.userId', 'profile.firstName profile.lastName')
    .populate('warehouseInfo.assignedWarehouse', 'name location')
    .populate('warehouseInfo.productId', 'name code')
    .sort({ 'requestDetails.criticality': 1, createdAt: 1 });

    res.json({
      success: true,
      requests
    });
  } catch (error) {
    console.error('Get pending receipts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching pending receipts'
    });
  }
});

// Create warehouse receipt
router.post('/receipts', authenticate, async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const { 
        purchaseRequestId, 
        warehouseId, 
        items, 
        observations,
        supplierInfo,
        receiptNumber // Expect receiptNumber from frontend
      } = req.body;

      // Validate purchase request
      const purchaseRequest = await PurchaseRequest.findById(purchaseRequestId).session(session);
      if (!purchaseRequest) {
        throw new Error('Purchase request not found');
      }

      // Check if the purchase request is in a state that allows receipt creation
      if (!['in_warehouse'].includes(purchaseRequest.status)) {
        throw new Error('Purchase request must be in "in_warehouse" status to create a receipt');
      }

      // Validate warehouse
      const warehouse = await Warehouse.findById(warehouseId).session(session);
      if (!warehouse) {
        throw new Error('Warehouse not found');
      }

      // Create warehouse receipt
      const receipt = new WarehouseReceipt({
        receiptNumber: receiptNumber, // Use the receiptNumber from the frontend
        purchaseRequestId: purchaseRequestId,
        purchaseRequestNumber: purchaseRequest.requestNumber, // Add purchaseRequestNumber
        warehouseId: warehouseId,
        items: items.map(item => ({
          ...item,
          // Ensure productId is part of the item object
          productId: item.productId,
          productCode: item.productCode,
          productName: item.productName,
          quantityOrdered: item.quantityOrdered,
          unitCost: item.unitCost,
          // Add other item fields as necessary from the frontend
          // receivedBy: req.user._id // This should be set on confirmation, not creation
        })),
        status: 'pending',
        observations,
        supplierInfo,
        createdBy: req.user ? req.user._id : null
      });

      await receipt.save({ session });

      res.status(201).json({
        success: true,
        message: 'Warehouse receipt created successfully',
        receipt
      });
    });

  } catch (error) {
    console.error('Create receipt error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error creating receipt'
    });
  } finally {
    await session.endSession();
  }
});

// Confirm warehouse receipt (process stock movement)
router.post('/receipts/:id/confirm', authenticate, async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const { receivedQuantities, observations } = req.body;
      
      const receipt = await WarehouseReceipt.findById(req.params.id)
        .populate('purchaseRequestId')
        .populate('items.productId')
        .populate('warehouseId')
        .session(session);

      if (!receipt) {
        throw new Error('Warehouse receipt not found');
      }

      if (receipt.status !== 'pending') {
        throw new Error('Receipt has already been processed');
      }

      let totalReceived = 0;
      const stockMovements = [];

      // Process each item
      for (const item of receipt.items) {
        const receivedQty = receivedQuantities[item._id.toString()] || 0;
        
        if (receivedQty > 0) {
          totalReceived += receivedQty;

          // Update item with received quantity
          item.receivedQuantity = receivedQty;
          item.status = receivedQty >= item.expectedQuantity ? 'complete' : 'partial';
          item.receivedDate = new Date();
          item.receivedBy = req.user._id;

          // Find or create stock record
          let stock = await Stock.findOne({
            warehouse: receipt.warehouseId._id,
            product: item.productId._id
          }).session(session);

          if (!stock) {
            stock = new Stock({
              warehouse: receipt.warehouseId._id,
              product: item.productId._id,
              availableQuantity: 0,
              reservedQuantity: 0,
              inTransitQuantity: 0,
              totalQuantity: 0,
              averageCost: item.unitCost,
              totalValue: 0,
              lastMovementDate: new Date(),
              createdBy: req.user._id
            });
          }

          // Update stock quantities
          const unitCost = item.unitCost;
          const newTotalQuantity = stock.totalQuantity + receivedQty;
          const newTotalValue = stock.totalValue + (receivedQty * unitCost);
          
          stock.availableQuantity += receivedQty;
          stock.totalQuantity = newTotalQuantity;
          stock.totalValue = newTotalValue;
          stock.averageCost = newTotalValue / newTotalQuantity;
          stock.lastMovementDate = new Date();
          stock.lastMovementBy = req.user._id;

          await stock.save({ session });

          // Create stock movement record
          const movement = new StockMovement({
            type: 'inbound',
            subtype: 'purchase_receipt',
            warehouse: receipt.warehouseId._id,
            product: item.productId._id,
            quantity: receivedQty,
            unitCost: unitCost,
            totalCost: receivedQty * unitCost,
            reference: {
              type: 'purchase_request',
              id: receipt.purchaseRequestId._id,
              number: receipt.purchaseRequestId.requestNumber
            },
            warehouseReceipt: receipt._id,
            performedBy: req.user._id,
            observations: `Receipt confirmation: ${observations || 'No observations'}`
          });

          await movement.save({ session });
          stockMovements.push(movement);
        }
      }

      // Update receipt status
      const allItemsComplete = receipt.items.every(item => 
        item.status === 'complete' || item.status === 'partial'
      );
      
      receipt.status = allItemsComplete ? 'confirmed' : 'partial';
      receipt.confirmedDate = new Date();
      receipt.confirmedBy = req.user._id;
      receipt.finalObservations = observations;

      await receipt.save({ session });

      // Update purchase request
      const purchaseRequest = await PurchaseRequest.findById(receipt.purchaseRequestId._id).session(session);
      if (!purchaseRequest) {
        throw new Error('Purchase request not found after receipt confirmation');
      }

      purchaseRequest.warehouseInfo.receivedQuantity = (purchaseRequest.warehouseInfo.receivedQuantity || 0) + totalReceived;
      purchaseRequest.warehouseInfo.pendingQuantity = purchaseRequest.requestDetails.specifications.quantity - purchaseRequest.warehouseInfo.receivedQuantity;
      purchaseRequest.warehouseInfo.warehouseReceipt = receipt._id;
      purchaseRequest.warehouseInfo.actualDeliveryDate = new Date();

      // Update warehouse status and overall status
      if (purchaseRequest.warehouseInfo.receivedQuantity >= purchaseRequest.requestDetails.specifications.quantity) {
        purchaseRequest.warehouseInfo.warehouseStatus = 'received_complete';
        purchaseRequest.status = 'completed';
      } else {
        purchaseRequest.warehouseInfo.warehouseStatus = 'received_partial';
        purchaseRequest.status = 'received_partial';
      }

      // Add to audit log
      purchaseRequest.audit.changeLog.push({
        field: 'warehouseInfo.receivedQuantity',
        oldValue: (purchaseRequest.warehouseInfo.receivedQuantity || 0) - totalReceived,
        newValue: purchaseRequest.warehouseInfo.receivedQuantity,
        changedBy: req.user._id,
        changedAt: new Date(),
        reason: `Warehouse receipt confirmed: ${receipt.receiptNumber}`
      });

      purchaseRequest.audit.modifiedBy = req.user._id;
      purchaseRequest.audit.version += 1;

      await purchaseRequest.save({ session });

      // Populate response data
      await receipt.populate([
        { path: 'purchaseRequestId', select: 'requestNumber status' },
        { path: 'items.productId', select: 'name code' },
        { path: 'warehouseId', select: 'name location' }
      ]);

      res.json({
        success: true,
        message: 'Receipt confirmed successfully',
        receipt,
        stockMovements: stockMovements.length,
        totalReceived
      });

      // Emit socket event
      req.io.emit('receipt:confirmed', { receipt, purchaseRequest });
    });

  } catch (error) {
    console.error('Confirm receipt error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error confirming receipt'
    });
  } finally {
    await session.endSession();
  }
});

// Get warehouse receipts
router.get('/receipts', authenticate, async (req, res) => {
  try {
    const { status, warehouse, page = 1, limit = 20 } = req.query;
    
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (warehouse && warehouse !== 'all') {
      if (!mongoose.Types.ObjectId.isValid(warehouse)) {
        return res.status(400).json({ success: false, message: 'Invalid warehouse ID' });
      }
      filter.warehouse = warehouse;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const receipts = await WarehouseReceipt.find(filter)
      .populate({ path: 'purchaseRequestId', select: 'requestNumber requestDetails.description', as: 'purchaseRequest' })
      .populate({ path: 'items.productId', select: 'name code', as: 'product' })
      .populate({ path: 'warehouseId', select: 'name location', as: 'warehouse' })
      .populate('createdBy', 'profile.firstName profile.lastName')
      .populate('confirmedBy', 'profile.firstName profile.lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await WarehouseReceipt.countDocuments(filter);

    res.json({
      success: true,
      receipts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });

  } catch (error) {
    console.error('Get receipts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching receipts'
    });
  }
});

// Get stock by warehouse
router.get('/stock', authenticate, async (req, res) => {
  try {
    const { search, category, page = 1, limit = 20 } = req.query;
    
    const filter = {};
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let stockQuery = Stock.find(filter)
      .populate('product', 'name code description category unitOfMeasure')
      .populate('warehouse', 'name location');

    if (search) {
      // We need to use aggregation for searching in populated fields
      const stocks = await Stock.aggregate([
        { $match: filter },
        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' },
        {
          $match: {
            $or: [
              { 'product.name': { $regex: search, $options: 'i' } },
              { 'product.code': { $regex: search, $options: 'i' } },
              { 'product.description': { $regex: search, $options: 'i' } }
            ]
          }
        },
        { $skip: skip },
        { $limit: parseInt(limit) },
        { $sort: { 'product.name': 1 } }
      ]);

      return res.json({
        success: true,
        stocks,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(stocks.length / parseInt(limit)),
          total: stocks.length
        }
      });
    }

    const stocks = await stockQuery
      .sort({ 'product.name': 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Stock.countDocuments(filter);

    res.json({
      success: true,
      stocks,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });

  } catch (error) {
    console.error('Get stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching stock'
    });
  }
});

// Get stock by warehouse
router.get('/:warehouseId/stock', authenticate, async (req, res) => {
  try {
    const { search, category, page = 1, limit = 20 } = req.query;
    
    const filter = { warehouse: req.params.warehouseId };
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let stockQuery = Stock.find(filter)
      .populate('product', 'name code description category unitOfMeasure')
      .populate('warehouse', 'name location');

    if (search) {
      // We need to use aggregation for searching in populated fields
      const stocks = await Stock.aggregate([
        { $match: filter },
        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' },
        {
          $match: {
            $or: [
              { 'product.name': { $regex: search, $options: 'i' } },
              { 'product.code': { $regex: search, $options: 'i' } },
              { 'product.description': { $regex: search, $options: 'i' } }
            ]
          }
        },
        { $skip: skip },
        { $limit: parseInt(limit) },
        { $sort: { 'product.name': 1 } }
      ]);

      return res.json({
        success: true,
        stocks,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(stocks.length / parseInt(limit)),
          total: stocks.length
        }
      });
    }

    const stocks = await stockQuery
      .sort({ 'product.name': 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Stock.countDocuments(filter);

    res.json({
      success: true,
      stocks,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });

  } catch (error) {
    console.error('Get stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching stock'
    });
  }
});

// Get stock movements
router.get('/movements', authenticate, async (req, res) => {
  try {
    const { 
      warehouse, 
      product, 
      type, 
      dateFrom, 
      dateTo, 
      page = 1, 
      limit = 20 
    } = req.query;
    
    const filter = {};
    
    if (warehouse && warehouse !== 'all') {
      if (!mongoose.Types.ObjectId.isValid(warehouse)) {
        return res.status(400).json({ success: false, message: 'Invalid warehouse ID' });
      }
      filter.warehouse = warehouse;
    }
    if (product) {
      filter.product = product;
    }
    if (type && type !== 'all') {
      filter.type = type;
    }
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const movements = await StockMovement.find(filter)
      .populate('warehouse', 'name location')
      .populate('product', 'name code')
      .populate('performedBy', 'profile.firstName profile.lastName')
      .populate('warehouseReceipt', 'receiptNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await StockMovement.countDocuments(filter);

    res.json({
      success: true,
      movements,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });

  } catch (error) {
    console.error('Get movements error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching movements'
    });
  }
});

// Get warehouse dashboard stats
router.get('/stats/dashboard', authenticate, async (req, res) => {
  try {
    const stats = await Promise.all([
      WarehouseReceipt.countDocuments({ status: 'pending' }),
      WarehouseReceipt.countDocuments({ status: 'confirmed' }),
      Stock.countDocuments({ availableQuantity: { $gt: 0 } }),
      StockMovement.countDocuments({ 
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
      }),
      PurchaseRequest.countDocuments({ 
        status: 'approved',
        'warehouseInfo.warehouseStatus': 'pending_assignment'
      }),
      Stock.aggregate([
        { $group: { _id: null, totalValue: { $sum: '$totalValue' } } }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        pendingReceipts: stats[0],
        confirmedReceipts: stats[1],
        productsInStock: stats[2],
        todayMovements: stats[3],
        pendingAssignments: stats[4],
        totalInventoryValue: stats[5][0]?.totalValue || 0
      }
    });

  } catch (error) {
    console.error('Get warehouse stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching warehouse statistics'
    });
  }
});

export default router;