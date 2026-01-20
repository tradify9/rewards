const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
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
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['hero', 'features', 'how-it-works', 'tiers', 'testimonials', 'cta']
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
  }
});

const homeContentSchema = new mongoose.Schema({
  sections: [sectionSchema]
}, {
  timestamps: true
});

// Removed pre-save hook to avoid issues

module.exports = mongoose.model('HomeContent', homeContentSchema);
