import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['critical_spare', 'consumable', 'dangerous_material', 'new_equipment', 'specialized_service', 'tools', 'safety_equipment']
  },
  subcategory: {
    type: String,
    trim: true
  },
  specifications: {
    partNumber: String,
    brand: String,
    model: String,
    manufacturer: String,
    technicalSpecs: String,
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      weight: Number,
      unit: {
        type: String,
        enum: ['mm', 'cm', 'm', 'g', 'kg', 'ton'],
        default: 'mm'
      }
    },
    material: String,
    color: String
  },
  unitOfMeasure: {
    type: String,
    required: true,
    enum: ['units', 'meters', 'liters', 'kilograms', 'hours', 'services', 'boxes', 'rolls', 'sheets']
  },
  pricing: {
    standardCost: {
      type: Number,
      required: true,
      min: 0
    },
    averageCost: {
      type: Number,
      default: 0
    },
    lastCost: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      enum: ['USD', 'PEN', 'EUR'],
      default: 'USD'
    }
  },
  inventory: {
    minStock: {
      type: Number,
      default: 0
    },
    maxStock: {
      type: Number,
      default: 1000
    },
    reorderPoint: {
      type: Number,
      default: 10
    },
    leadTime: {
      type: Number,
      default: 7 // days
    }
  },
  suppliers: [{
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier'
    },
    supplierName: String,
    supplierCode: String,
    leadTime: Number,
    minOrderQty: Number,
    price: Number,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  safety: {
    isDangerous: {
      type: Boolean,
      default: false
    },
    hazardClass: String,
    msdsRequired: {
      type: Boolean,
      default: false
    },
    specialHandling: String,
    storageRequirements: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued', 'obsolete'],
    default: 'active'
  },
  audit: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    lastReview: Date
  }
}, {
  timestamps: true
});

// Indexes

productSchema.index({ category: 1, status: 1 });
productSchema.index({ 'specifications.partNumber': 1 });
productSchema.index({ name: 'text', description: 'text' });

export default mongoose.model('Product', productSchema);