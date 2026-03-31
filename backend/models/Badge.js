const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: '🏆' // Default emoji icon
  },
  category: {
    type: String,
    enum: ['Achievement', 'Skill', 'Contribution', 'Milestone', 'Special'],
    default: 'Achievement'
  },
  criteria: {
    type: String,
    required: true // Description of how to earn this badge
  },
  rarity: {
    type: String,
    enum: ['Common', 'Rare', 'Epic', 'Legendary'],
    default: 'Common'
  },
  points: {
    type: Number,
    default: 10 // Points awarded for earning this badge
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
badgeSchema.index({ category: 1, isActive: 1 });

module.exports = mongoose.model('Badge', badgeSchema);

