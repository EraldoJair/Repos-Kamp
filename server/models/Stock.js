import mongoose from 'mongoose';

const stockSchema = new mongoose.Schema({
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
  location: {
    zone: String,
    aisle: String,
    shelf: String,
    level: String,
    position: String
  },
  quantities: {
    available: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    reserved: {
      type: Number,
      default: 0,
      min: 0
    },
    inTransit: {
      type: Number,
      default: 0,
      min: 0
    },
    damaged: {
      type: Number,
      default: 0,
      min: 0
    },
    total: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  valuation: {
    averageCost: {
      type: Number,
      default: 0
    },
    totalValue: {
      type: Number,
      default: 0
    },
    lastCostUpdate: Date
  },
  batches: [{
    batchNumber: String,
    quantity: Number,
    expirationDate: Date,
    receivedDate: Date,
    cost: Number,
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier'
    }
  }],
  alerts: {
    lowStock: {
      type: Boolean,
      default: false
    },
    overStock: {
      type: Boolean,
      default: false
    },
    nearExpiry: {
      type: Boolean,
      default: false
    },
    damaged: {
      type: Boolean,
      default: false
    }
  },
  lastMovement: {
    date: Date,
    type: String,
    quantity: Number,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  audit: {
    lastCount: {
      date: Date,
      countedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      physicalCount: Number,
      systemCount: Number,
      variance: Number,
      adjustmentMade: Boolean
    },
    cycleCountFrequency: {
      type: Number,
      default: 90 // days
    }
  }
}, {
  timestamps: true
});

// Compound indexes
stockSchema.index({ warehouseId: 1, productId: 1 }, { unique: true });
stockSchema.index({ warehouseId: 1, 'quantities.available': 1 });
stockSchema.index({ productId: 1, 'quantities.total': 1 });
stockSchema.index({ 'alerts.lowStock': 1 });

// Pre-save middleware to calculate total quantity
stockSchema.pre('save', function(next) {
  this.quantities.total = this.quantities.available + this.quantities.reserved + this.quantities.damaged;
  this.valuation.totalValue = this.quantities.total * this.valuation.averageCost;
  next();
});

stockSchema.statics.updateAverageCost = async function(warehouseId, productId, quantity, newCost) {
  const stock = await this.findOne({ warehouseId, productId });

  if (stock) {
    const oldTotalQuantity = stock.quantities.available + stock.quantities.reserved;
    const oldTotalValue = stock.valuation.averageCost * oldTotalQuantity;

    const newTotalQuantity = oldTotalQuantity + quantity;
    const newTotalValue = oldTotalValue + (quantity * newCost);

    stock.valuation.averageCost = newTotalQuantity > 0 ? newTotalValue / newTotalQuantity : 0;
    stock.valuation.lastCostUpdate = new Date();

    await stock.save();
  }
};

export default mongoose.model('Stock', stockSchema);