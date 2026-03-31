const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
  investor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

bookmarkSchema.index({ investor: 1, project: 1 }, { unique: true });

module.exports = mongoose.model('Bookmark', bookmarkSchema);

