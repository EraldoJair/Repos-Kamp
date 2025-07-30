import mongoose from 'mongoose';

const warehouseSchema = new mongoose.Schema({
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
  type: {
    type: String,
    required: true,
    enum: ['main', 'satellite', 'mobile', 'temporary'],
    default: 'main'
  },
  location: {
    address: {
      type: String,
      required: true
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    zone: String,
    building: String,
    floor: String
  },
  responsible: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    phone: String,
    email: String
  },
  capacity: {
    maxItems: {
      type: Number,
      default: 10000
    },
    maxWeight: {
      type: Number,
      default: 50000 // kg
    },
    maxVolume: {
      type: Number,
      default: 1000 // m3
    }
  },
  configuration: {
    zones: [{
      code: String,
      name: String,
      aisles: [{
        code: String,
        shelves: [{
          code: String,
          levels: Number,
          capacity: Number
        }]
      }]
    }],
    temperature: {
      min: Number,
      max: Number,
      controlled: {
        type: Boolean,
        default: false
      }
    },
    security: {
      level: {
        type: String,
        enum: ['basic', 'medium', 'high', 'maximum'],
        default: 'medium'
      },
      cameras: Boolean,
      access_control: Boolean
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  metrics: {
    totalProducts: {
      type: Number,
      default: 0
    },
    totalValue: {
      type: Number,
      default: 0
    },
    occupancyRate: {
      type: Number,
      default: 0
    },
    lastInventory: Date
  }
}, {
  timestamps: true
});

// Indexes

warehouseSchema.index({ type: 1, status: 1 });
warehouseSchema.index({ 'responsible.userId': 1 });

export default mongoose.model('Warehouse', warehouseSchema);