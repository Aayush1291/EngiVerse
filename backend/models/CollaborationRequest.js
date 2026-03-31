const mongoose = require('mongoose');

const collaborationRequestSchema = new mongoose.Schema({
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
  message: String,
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected'],
    default: 'Pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: Date
});

collaborationRequestSchema.index({ project: 1, requester: 1 }, { unique: true });

module.exports = mongoose.model('CollaborationRequest', collaborationRequestSchema);

