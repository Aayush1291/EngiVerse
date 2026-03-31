const express = require('express');
const router = express.Router();
const Badge = require('../models/Badge');
const { auth, authorize } = require('../middleware/auth');
const { awardBadge, checkAndAwardBadges, getUserBadges, initializeDefaultBadges } = require('../utils/badgeService');

// Get all available badges
router.get('/', async (req, res) => {
  try {
    const badges = await Badge.find({ isActive: true }).sort({ category: 1, name: 1 });
    res.json({ badges });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's badges
router.get('/user/:userId', auth, async (req, res) => {
  try {
    // Users can only view their own badges unless admin
    if (req.user._id.toString() !== req.params.userId && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const result = await getUserBadges(req.params.userId);
    if (!result.success) {
      return res.status(404).json({ message: result.message });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user's badges
router.get('/me', auth, async (req, res) => {
  try {
    const result = await getUserBadges(req.user._id);
    if (!result.success) {
      return res.status(404).json({ message: result.message });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Check and award badges (triggered automatically or manually)
router.post('/check', auth, async (req, res) => {
  try {
    const result = await checkAndAwardBadges(req.user._id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Award badge manually (Admin only)
router.post('/award', auth, authorize('Admin'), async (req, res) => {
  try {
    const { userId, badgeName } = req.body;

    if (!userId || !badgeName) {
      return res.status(400).json({ message: 'Please provide userId and badgeName' });
    }

    const result = await awardBadge(userId, badgeName);
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Initialize default badges (Admin only, run once)
router.post('/initialize', auth, authorize('Admin'), async (req, res) => {
  try {
    const result = await initializeDefaultBadges();
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

