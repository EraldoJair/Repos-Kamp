import mongoose from 'mongoose';
import { getNextSequenceValue } from './Counter.js';

const stockMovementSchema = new mongoose.Schema({
  movementNumber: {
    type: String,
    required: true,
    unique: true,
    default: 'PENDING'
  },
  type: {
    type: String,
    required: true,
    enum: ['receipt', 'issue', 'transfer', 'adjustment', 'return', 'damage', 'disposal']
  },
  subtype: {
    type: String,
    enum: ['purchase', 'production', 'customer_return', 'supplier_return', 'internal_transfer', 'cycle_count', 'physical_adjustment']
  },
  warehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  unitCost: {
    type: Number,
    default: 0
  },
  totalValue: {
    type: Number,
    default: 0
  },
  location: {
    from: {
      zone: String,
      aisle: String,
      shelf: String,
      level: String
    },
    to: {
      zone: String,
      aisle: String,
      shelf: String,
      level: String
    }
  },
  reference: {
    type: {
      type: String,
      enum: ['purchase_request', 'warehouse_receipt', 'transfer_order', 'adjustment_order', 'work_order']
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'reference.type'
    },
    number: String
  },
  batch: {
    batchNumber: String,
    expirationDate: Date,
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier'
    }
  },
  reason: {
    type: String,
    required: true
  },
  notes: String,
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'completed'
  },
  executedBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  approvedBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    timestamp: Date
  },
  stockBefore: {
    available: Number,
    reserved: Number,
    total: Number
  },
  stockAfter: {
    available: Number,
    reserved: Number,
    total: Number
  }
}, {
  timestamps: true
});

// Indexes

stockMovementSchema.index({ warehouseId: 1, createdAt: -1 });
stockMovementSchema.index({ productId: 1, createdAt: -1 });
stockMovementSchema.index({ type: 1, createdAt: -1 });
stockMovementSchema.index({ 'reference.type': 1, 'reference.id': 1 });

// Auto-generate movement number
stockMovementSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const sequence = await getNextSequenceValue(`movement_${year}_${month}`);
      this.movementNumber = `MOV-${year}${month}-${String(sequence).padStart(6, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  
  // Calculate total value
  this.totalValue = this.quantity * this.unitCost;
  
  next();
});

export default mongoose.model('StockMovement', stockMovementSchema);