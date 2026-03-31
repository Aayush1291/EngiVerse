const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const { detectFakeProfile, verifyProfile } = require('../utils/fakeProfileDetector');

// Check if a profile is fake
router.get('/check/:userId', auth, async (req, res) => {
  try {
    // Only admin or the user themselves can check
    if (req.user._id.toString() !== req.params.userId && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const result = await detectFakeProfile(req.params.userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Check current user's profile
router.get('/check', auth, async (req, res) => {
  try {
    const result = await detectFakeProfile(req.user._id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify profile using AI (Admin only - triggers AI verification)
router.post('/verify/:userId', auth, authorize('Admin'), async (req, res) => {
  try {
    const result = await verifyProfile(req.params.userId);

    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

