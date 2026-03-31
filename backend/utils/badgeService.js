const Badge = require('../models/Badge');
const User = require('../models/User');
const Project = require('../models/Project');
const CollaborationRequest = require('../models/CollaborationRequest');

/**
 * Award a badge to a user
 */
const awardBadge = async (userId, badgeName) => {
  try {
    const badge = await Badge.findOne({ name: badgeName, isActive: true });
    if (!badge) {
      return { success: false, message: 'Badge not found' };
    }

    const user = await User.findById(userId);
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Check if user already has this badge
    const hasBadge = user.profile.badges?.some(
      b => b.badgeId?.toString() === badge._id.toString()
    );

    if (hasBadge) {
      return { success: false, message: 'User already has this badge' };
    }

    // Add badge to user
    if (!user.profile.badges) {
      user.profile.badges = [];
    }

    user.profile.badges.push({
      badgeId: badge._id,
      earnedAt: new Date()
    });

    await user.save();

    return {
      success: true,
      message: `Badge "${badge.name}" awarded successfully`,
      badge: {
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        category: badge.category,
        rarity: badge.rarity,
        points: badge.points
      }
    };
  } catch (error) {
    console.error('Badge award error:', error);
    return { success: false, message: 'Error awarding badge', error: error.message };
  }
};

/**
 * Check and award badges based on user achievements
 */
const checkAndAwardBadges = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const awardedBadges = [];
    const userProjects = await Project.countDocuments({ owner: userId });
    const userCollaborations = await CollaborationRequest.countDocuments({
      requester: userId,
      status: 'Accepted'
    });
    const profileCompletion = user.calculateProfileCompletion();

    // First Project Badge
    if (userProjects >= 1) {
      const result = await awardBadge(userId, 'First Project');
      if (result.success) awardedBadges.push(result.badge);
    }

    // Prolific Creator Badge
    if (userProjects >= 5) {
      const result = await awardBadge(userId, 'Prolific Creator');
      if (result.success) awardedBadges.push(result.badge);
    }

    // Team Player Badge
    if (userCollaborations >= 3) {
      const result = await awardBadge(userId, 'Team Player');
      if (result.success) awardedBadges.push(result.badge);
    }

    // Profile Complete Badge
    if (profileCompletion >= 100) {
      const result = await awardBadge(userId, 'Profile Complete');
      if (result.success) awardedBadges.push(result.badge);
    }

    // Verified Badge
    if (user.emailVerified && user.profile.verified) {
      const result = await awardBadge(userId, 'Verified Member');
      if (result.success) awardedBadges.push(result.badge);
    }

    return {
      success: true,
      message: `Checked and awarded ${awardedBadges.length} badge(s)`,
      awardedBadges
    };
  } catch (error) {
    console.error('Badge check error:', error);
    return { success: false, message: 'Error checking badges', error: error.message };
  }
};

/**
 * Get all badges for a user
 */
const getUserBadges = async (userId) => {
  try {
    const user = await User.findById(userId).populate('profile.badges.badgeId');
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const badges = user.profile.badges?.map(b => ({
      id: b.badgeId?._id,
      name: b.badgeId?.name,
      description: b.badgeId?.description,
      icon: b.badgeId?.icon,
      category: b.badgeId?.category,
      rarity: b.badgeId?.rarity,
      points: b.badgeId?.points,
      earnedAt: b.earnedAt
    })) || [];

    return {
      success: true,
      badges,
      totalPoints: badges.reduce((sum, b) => sum + (b.points || 0), 0)
    };
  } catch (error) {
    console.error('Get user badges error:', error);
    return { success: false, message: 'Error fetching badges', error: error.message };
  }
};

/**
 * Initialize default badges (run once)
 */
const initializeDefaultBadges = async () => {
  try {
    const defaultBadges = [
      {
        name: 'First Project',
        description: 'Created your first project',
        icon: '🎯',
        category: 'Milestone',
        rarity: 'Common',
        points: 10,
        criteria: 'Create at least one project'
      },
      {
        name: 'Prolific Creator',
        description: 'Created 5 or more projects',
        icon: '🚀',
        category: 'Achievement',
        rarity: 'Rare',
        points: 50,
        criteria: 'Create 5 or more projects'
      },
      {
        name: 'Team Player',
        description: 'Successfully collaborated on 3+ projects',
        icon: '👥',
        category: 'Contribution',
        rarity: 'Rare',
        points: 30,
        criteria: 'Get accepted to collaborate on 3 or more projects'
      },
      {
        name: 'Profile Complete',
        description: 'Completed 100% of your profile',
        icon: '✅',
        category: 'Achievement',
        rarity: 'Common',
        points: 15,
        criteria: 'Complete all profile fields'
      },
      {
        name: 'Verified Member',
        description: 'Verified email and profile',
        icon: '✓',
        category: 'Special',
        rarity: 'Epic',
        points: 25,
        criteria: 'Verify email and get profile verified'
      },
      {
        name: 'Mentor',
        description: 'Helping others as a mentor',
        icon: '🎓',
        category: 'Contribution',
        rarity: 'Rare',
        points: 40,
        criteria: 'Be assigned as a mentor to a project'
      },
      {
        name: 'Project Health Champion',
        description: 'Achieved 90+ health score on a project',
        icon: '💎',
        category: 'Achievement',
        rarity: 'Epic',
        points: 50,
        criteria: 'Have a project with health score of 90 or above'
      },
      {
        name: 'Open Source Contributor',
        description: 'Project has GitHub repository',
        icon: '💻',
        category: 'Skill',
        rarity: 'Common',
        points: 20,
        criteria: 'Add GitHub repository to your project'
      }
    ];

    const createdBadges = [];
    for (const badgeData of defaultBadges) {
      const existingBadge = await Badge.findOne({ name: badgeData.name });
      if (!existingBadge) {
        const badge = new Badge(badgeData);
        await badge.save();
        createdBadges.push(badge);
      }
    }

    return {
      success: true,
      message: `Initialized ${createdBadges.length} default badges`,
      badges: createdBadges
    };
  } catch (error) {
    console.error('Initialize badges error:', error);
    return { success: false, message: 'Error initializing badges', error: error.message };
  }
};

module.exports = {
  awardBadge,
  checkAndAwardBadges,
  getUserBadges,
  initializeDefaultBadges
};

