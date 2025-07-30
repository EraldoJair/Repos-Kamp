import mongoose from 'mongoose';

const warehouseReceiptSchema = new mongoose.Schema({
  receiptNumber: {
    type: String,
    required: true,
    unique: true
  },
  purchaseRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseRequest',
    required: true
  },
  purchaseRequestNumber: {
    type: String,
    required: true
  },
  warehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  supplier: {
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier'
    },
    name: String,
    deliveryNote: { // Guía de Remisión
      type: String,
      trim: true
    },
    invoice: { // Factura
      type: String,
      trim: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'partial', 'completed', 'cancelled'],
    default: 'pending'
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productCode: String,
    productName: String,
    quantityOrdered: {
      type: Number,
      required: true
    },
    quantityReceived: {
      type: Number,
      default: 0
    },
    quantityAccepted: {
      type: Number,
      default: 0
    },
    quantityRejected: {
      type: Number,
      default: 0
    },
    unitCost: {
      type: Number,
      required: true
    },
    totalValue: {
      type: Number,
      default: 0
    },
    location: {
      zone: String,
      aisle: String,
      shelf: String,
      level: String
    },
    batch: {
      batchNumber: String,
      expirationDate: Date,
      manufacturingDate: Date
    },
    condition: {
      type: String,
      enum: ['good', 'damaged', 'expired', 'defective'],
      default: 'good'
    },
    notes: String,
    status: {
      type: String,
      enum: ['pending', 'received', 'completed'],
      default: 'pending'
    }
  }],
  inspection: {
    inspectedBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      name: String
    },
    inspectionDate: Date,
    qualityCheck: {
      passed: Boolean,
      notes: String,
      photos: [String]
    },
    packaging: {
      condition: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor', 'damaged']
      },
      notes: String
    }
  },
  delivery: {
    deliveryDate: Date,
    deliveredBy: String,
    vehicleInfo: String,
    receivedBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      name: String,
      signature: String
    }
  },
  totals: {
    itemsOrdered: {
      type: Number,
      default: 0
    },
    itemsReceived: {
      type: Number,
      default: 0
    },
    totalValue: {
      type: Number,
      default: 0
    },
    completionPercentage: {
      type: Number,
      default: 0
    }
  },
  conformity: {
    isConformed: {
      type: Boolean,
      default: false
    },
    conformedBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      name: String
    },
    conformityDate: Date,
    observations: String,
    discrepancies: [{
      itemId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      },
      discrepancyType: {
        type: String,
        enum: ['quantity', 'quality', 'specification', 'damage', 'other'],
        required: true
      },
      expected: String,
      found: String,
      notes: String,
      actionTaken: {
        type: String,
        enum: ['accepted_with_deviation', 'rejected', 'returned_to_supplier', 'rework']
      }
    }]
  },
  stockUpdated: {
    type: Boolean,
    default: false
  },
  stockUpdateDate: Date,
  movementIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StockMovement'
  }]
}, {
  timestamps: true
});

// Indexes

warehouseReceiptSchema.index({ purchaseRequestId: 1 });
warehouseReceiptSchema.index({ warehouseId: 1, status: 1 });
warehouseReceiptSchema.index({ status: 1, createdAt: -1 });

// Auto-generate receipt number
warehouseReceiptSchema.pre('save', async function(next) {
  if (this.isNew && !this.receiptNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1)
      }
    });
    this.receiptNumber = `REC-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Calculate totals before saving
warehouseReceiptSchema.pre('save', function(next) {
  this.totals.itemsOrdered = this.items.reduce((sum, item) => sum + item.quantityOrdered, 0);
  this.totals.itemsReceived = this.items.reduce((sum, item) => sum + item.quantityReceived, 0);
  this.totals.totalValue = this.items.reduce((sum, item) => sum + item.totalValue, 0);
  
  if (this.totals.itemsOrdered > 0) {
    this.totals.completionPercentage = (this.totals.itemsReceived / this.totals.itemsOrdered) * 100;
  }
  
  // Update item total values
  this.items.forEach(item => {
    item.totalValue = item.quantityAccepted * item.unitCost;
  });
  
  next();
});

export default mongoose.model('WarehouseReceipt', warehouseReceiptSchema);