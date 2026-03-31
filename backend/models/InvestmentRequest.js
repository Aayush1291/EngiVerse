const mongoose = require('mongoose');

const investmentRequestSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  investor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    trim: true,
    required: true
  },
  investmentAmount: {
    type: Number,
    min: 0
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected', 'Negotiating'],
    default: 'Pending'
  },
  respondedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('InvestmentRequest', investmentRequestSchema);

