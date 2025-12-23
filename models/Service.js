const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
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
    enum: [
      'web-development',
      'design',
      'hosting',
      'automation',
      'deployment',
      'consulting',
      'security',
      'maintenance'
    ]
  },
  type: {
    type: String,
    required: true,
    enum: ['free', 'paid', 'subscription', 'one-time']
  },
  price: {
    amount: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    interval: { type: String, enum: ['monthly', 'yearly', 'one-time'] }
  },
  features: [{
    name: String,
    description: String,
    included: { type: Boolean, default: true }
  }],
  requirements: [{
    type: String
  }],
  deliverables: [{
    type: String
  }],
  timeline: {
    min: Number,
    max: Number,
    unit: { type: String, enum: ['hours', 'days', 'weeks', 'months'] }
  },
  images: [{
    type: String
  }],
  preview: {
    type: String
  },
  documentation: {
    type: String
  },
  api: {
    endpoint: String,
    documentation: String,
    status: { type: String, enum: ['active', 'inactive', 'maintenance'], default: 'active' }
  },
  integrations: [{
    name: String,
    type: String,
    configuration: mongoose.Schema.Types.Mixed
  }],
  templates: [{
    name: String,
    description: String,
    file: String,
    preview: String
  }],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  projects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }],
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'archived'],
    default: 'draft'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'unlisted'],
    default: 'public'
  },
  tags: [{
    type: String
  }],
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }],
  analytics: {
    views: { type: Number, default: 0 },
    purchases: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
serviceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes for better performance
serviceSchema.index({ category: 1, status: 1 });
serviceSchema.index({ user: 1, status: 1 });
serviceSchema.index({ 'rating.average': -1 });
serviceSchema.index({ tags: 1 });

module.exports = mongoose.model('Service', serviceSchema);