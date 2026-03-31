const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Get profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const profileCompletion = user.calculateProfileCompletion();
    
    res.json({
      user: {
        ...user.toObject(),
        profileCompletion
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update profile
router.put('/me', auth, async (req, res) => {
  try {
    const { name, bio, college, company, skills, avatar, linkedin, github, website } = req.body;
    
    const user = await User.findById(req.user._id);
    
    // Validation
    if (name) {
      if (name.trim().length < 2) {
        return res.status(400).json({ message: 'Name must be at least 2 characters long' });
      }
      if (name.trim().length > 100) {
        return res.status(400).json({ message: 'Name must be less than 100 characters' });
      }
      user.profile.name = name.trim();
    }

    if (bio) {
      if (bio.trim().length > 1000) {
        return res.status(400).json({ message: 'Bio must be less than 1000 characters' });
      }
      user.profile.bio = bio.trim();
    }

    if (college) {
      if (college.trim().length > 200) {
        return res.status(400).json({ message: 'College name must be less than 200 characters' });
      }
      user.profile.college = college.trim();
    }

    if (company) {
      if (company.trim().length > 200) {
        return res.status(400).json({ message: 'Company name must be less than 200 characters' });
      }
      user.profile.company = company.trim();
    }

    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : [skills];
      if (skillsArray.length > 50) {
        return res.status(400).json({ message: 'Maximum 50 skills allowed' });
      }
      user.profile.skills = skillsArray.map(skill => skill.trim()).filter(skill => skill.length > 0 && skill.length <= 50);
    }

    // URL validation
    const urlPattern = /^https?:\/\/.+/i;
    if (linkedin) {
      if (!urlPattern.test(linkedin)) {
        return res.status(400).json({ message: 'Invalid LinkedIn URL format' });
      }
      user.profile.linkedin = linkedin.trim();
    }

    if (github) {
      if (!urlPattern.test(github)) {
        return res.status(400).json({ message: 'Invalid GitHub URL format' });
      }
      user.profile.github = github.trim();
    }

    if (website) {
      if (!urlPattern.test(website)) {
        return res.status(400).json({ message: 'Invalid website URL format' });
      }
      user.profile.website = website.trim();
    }

    if (avatar) {
      if (!urlPattern.test(avatar)) {
        return res.status(400).json({ message: 'Invalid avatar URL format' });
      }
      user.profile.avatar = avatar.trim();
    }

    // Check if profile is complete
    const completion = user.calculateProfileCompletion();
    user.profile.completed = completion >= 80;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        ...user.toObject(),
        profileCompletion: completion
      }
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', error: error.message });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get public profile
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password -email');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        role: user.role,
        profile: user.profile,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

