const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['website', 'application', 'bot', 'design', 'other']
  },
  category: {
    type: String,
    enum: [
      'portfolio',
      'business',
      'ecommerce',
      'blog',
      'landing-page',
      'dashboard',
      'mobile-app',
      'api',
      'automation',
      'custom'
    ]
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  },
  files: [{
    name: { type: String, required: true },
    path: { type: String, required: true },
    size: Number,
    type: {
      type: String,
      enum: ['html', 'css', 'js', 'image', 'document', 'other']
    },
    uploadedAt: { type: Date, default: Date.now }
  }],
  deployment: {
    url: String,
    platform: {
      type: String,
      enum: ['render', 'vercel', 'netlify', 'github-pages', 'custom']
    },
    status: {
      type: String,
      enum: ['not-deployed', 'deploying', 'deployed', 'failed'],
      default: 'not-deployed'
    },
    lastDeployed: Date,
    buildLogs: String,
    environment: {
      type: String,
      enum: ['development', 'staging', 'production'],
      default: 'development'
    }
  },
  settings: {
    domain: String,
    ssl: { type: Boolean, default: false },
    autoDeploy: { type: Boolean, default: false },
    buildCommand: { type: String, default: 'npm run build' },
    outputDirectory: { type: String, default: 'dist' },
    nodeVersion: { type: String, default: '18' }
  },
  technologies: [{
    type: String,
    enum: [
      'html', 'css', 'javascript', 'react', 'vue', 'angular',
      'nodejs', 'python', 'php', 'ruby', 'java',
      'mongodb', 'postgresql', 'mysql', 'sqlite',
      'docker', 'kubernetes', 'aws', 'azure', 'gcp'
    ]
  }],
  collaborators: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: {
      type: String,
      enum: ['viewer', 'editor', 'admin'],
      default: 'viewer'
    },
    addedAt: { type: Date, default: Date.now }
  }],
  analytics: {
    visits: { type: Number, default: 0 },
    bandwidth: { type: Number, default: 0 },
    uptime: { type: Number, default: 100 },
    lastChecked: Date
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'archived'],
    default: 'draft'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'unlisted'],
    default: 'private'
  },
  tags: [{
    type: String
  }],
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
projectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes for better performance
projectSchema.index({ user: 1, status: 1 });
projectSchema.index({ type: 1, category: 1 });
projectSchema.index({ 'deployment.status': 1 });

module.exports = mongoose.model('Project', projectSchema);