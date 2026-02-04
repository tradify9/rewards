const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: false
  },
  alt: {
    type: String,
    default: ''
  },
  width: {
    type: String,
    default: 'auto'
  },
  height: {
    type: String,
    default: 'auto'
  }
});

const sectionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    required: true,
    enum: ['hero', 'features', 'how-it-works', 'tiers', 'testimonials', 'cta', 'about', 'share-price']
  },
  title: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  },
  content: [{
    type: String
  }],
  images: [imageSchema],
  styles: {
    backgroundColor: { type: String, default: '' },
    textColor: { type: String, default: '' },
    fontSize: { type: String, default: '' },
    fontWeight: { type: String, default: '' },
    textAlign: { type: String, default: 'left' },
    padding: { type: String, default: '' },
    margin: { type: String, default: '' }
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Additional fields for specific sections
  stats: [{
    title: String,
    description: String,
    icon: String
  }],
  benefits: [{
    title: String,
    description: String,
    icon: String,
    color: String
  }],
  steps: [{
    number: Number,
    title: String,
    description: String
  }],
  tiers: [{
    name: String,
    coinRange: String,
    description: String,
    features: [String],
    price: Number,
    color: String,
    icon: String
  }],
  sharePriceData: [{
    srNo: Number,
    date: String,
    price: Number
  }]
});

const homeContentSchema = new mongoose.Schema({
  sections: [sectionSchema],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('HomeContent', homeContentSchema);