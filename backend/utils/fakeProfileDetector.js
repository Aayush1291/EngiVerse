const User = require('../models/User');
const Project = require('../models/Project');
const CollaborationRequest = require('../models/CollaborationRequest');

/**
 * Detect fake profiles based on multiple factors
 */
const detectFakeProfile = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return {
        isFake: false,
        riskScore: 0,
        reasons: [],
        message: 'User not found'
      };
    }

    const riskFactors = [];
    let riskScore = 0;

    // 1. Email verification check
    if (!user.emailVerified) {
      riskFactors.push('Email not verified');
      riskScore += 30;
    }

    // 2. Profile completeness check
    const profileCompletion = user.calculateProfileCompletion();
    if (profileCompletion < 50) {
      riskFactors.push(`Low profile completion (${profileCompletion}%)`);
      riskScore += 20;
    }

    // 3. Check for suspicious email patterns
    const suspiciousEmailPatterns = [
      /^test\d+@/i,
      /^fake\d+@/i,
      /^temp\d+@/i,
      /@(tempmail|10minutemail|guerrillamail|mailinator)\./i
    ];
    
    const hasSuspiciousEmail = suspiciousEmailPatterns.some(pattern => 
      pattern.test(user.email)
    );
    
    if (hasSuspiciousEmail) {
      riskFactors.push('Suspicious email domain');
      riskScore += 25;
    }

    // 4. Check profile information quality
    if (user.profile.name && user.profile.name.length < 3) {
      riskFactors.push('Very short name');
      riskScore += 10;
    }

    if (user.profile.bio && user.profile.bio.length < 20) {
      riskFactors.push('Very short bio');
      riskScore += 10;
    }

    // 5. Check for missing social links (especially for Mentors/Investors)
    if ((user.role === 'Mentor' || user.role === 'Investor') && !user.profile.linkedin) {
      riskFactors.push('Missing LinkedIn (expected for ' + user.role + ')');
      riskScore += 15;
    }

    // 6. Activity-based checks
    const userProjects = await Project.countDocuments({ owner: userId });
    const userCollaborations = await CollaborationRequest.countDocuments({ 
      requester: userId 
    });

    // New account with no activity
    const accountAge = Date.now() - new Date(user.createdAt).getTime();
    const daysSinceCreation = accountAge / (1000 * 60 * 60 * 24);
    
    if (daysSinceCreation > 7 && userProjects === 0 && userCollaborations === 0) {
      riskFactors.push('Inactive account (no projects or collaborations)');
      riskScore += 15;
    }

    // 7. Check for duplicate or similar profiles
    const similarProfiles = await User.find({
      _id: { $ne: userId },
      'profile.name': user.profile.name,
      role: user.role
    }).limit(5);

    if (similarProfiles.length > 2) {
      riskFactors.push('Multiple profiles with same name and role');
      riskScore += 20;
    }

    // 8. Check GitHub/LinkedIn URL validity (basic check)
    if (user.profile.github && !isValidURL(user.profile.github)) {
      riskFactors.push('Invalid GitHub URL');
      riskScore += 10;
    }

    if (user.profile.linkedin && !isValidURL(user.profile.linkedin)) {
      riskFactors.push('Invalid LinkedIn URL');
      riskScore += 10;
    }

    // 9. Skills validation
    if (user.profile.skills && user.profile.skills.length > 50) {
      riskFactors.push('Unusually high number of skills (possible spam)');
      riskScore += 15;
    }

    // Determine if profile is fake
    const isFake = riskScore >= 50;

    return {
      isFake,
      riskScore: Math.min(riskScore, 100),
      reasons: riskFactors,
      message: isFake 
        ? 'Profile flagged as potentially fake. Please verify your information.'
        : riskScore > 30
        ? 'Profile has some risk factors. Consider completing your profile.'
        : 'Profile appears legitimate'
    };
  } catch (error) {
    console.error('Fake profile detection error:', error);
    return {
      isFake: false,
      riskScore: 0,
      reasons: [],
      message: 'Error detecting fake profile'
    };
  }
};

/**
 * Validate URL format
 */
const isValidURL = (string) => {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
};

/**
 * Verify profile using AI only (no manual verification)
 */
const verifyProfile = async (userId) => {
  try {
    const { verifyProfileWithAI } = require('./aiVerification');
    return await verifyProfileWithAI(userId);
  } catch (error) {
    console.error('Profile verification error:', error);
    return { success: false, message: 'Error verifying profile' };
  }
};

module.exports = {
  detectFakeProfile,
  verifyProfile
};

