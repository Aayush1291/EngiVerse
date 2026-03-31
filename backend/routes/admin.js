const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Project = require('../models/Project');
const CollaborationRequest = require('../models/CollaborationRequest');
const Bookmark = require('../models/Bookmark');
const { auth, authorize } = require('../middleware/auth');
const { verifyProject, checkProjectVerification, autoVerifyProject } = require('../utils/projectVerification');
const { detectFakeProfile, verifyProfile } = require('../utils/fakeProfileDetector');
const { checkPlagiarism } = require('../utils/plagiarismDetector');

// Get admin dashboard - Full God View
router.get('/dashboard', auth, authorize('Admin'), async (req, res) => {
  try {
    // User Statistics
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ 'profile.verified': true });
    const emailVerifiedUsers = await User.countDocuments({ emailVerified: true });
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Project Statistics
    const totalProjects = await Project.countDocuments();
    const verifiedProjects = await Project.countDocuments({ 'verification.verified': true });
    const projectsByStatus = await Project.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const projectsByDomain = await Project.aggregate([
      { $group: { _id: '$domain', count: { $sum: 1 } } }
    ]);

    // Collaboration Statistics
    const totalRequests = await CollaborationRequest.countDocuments();
    const pendingRequests = await CollaborationRequest.countDocuments({ status: 'Pending' });
    const acceptedRequests = await CollaborationRequest.countDocuments({ status: 'Accepted' });

    // Bookmark Statistics
    const totalBookmarks = await Bookmark.countDocuments();

    // Recent Activity
    const recentProjects = await Project.find()
      .populate('owner', 'email profile')
      .populate('verification.verifiedBy', 'email profile')
      .sort({ createdAt: -1 })
      .limit(10);

    const recentUsers = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(10);

    // Abandoned Projects
    const abandonedProjects = await Project.find({
      status: { $in: ['Open', 'Adopted'] },
      updatedAt: { $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
    })
      .populate('owner', 'email profile')
      .limit(10);

    // Unverified Projects
    const unverifiedProjects = await Project.find({
      'verification.verified': { $ne: true }
    })
      .populate('owner', 'email profile')
      .limit(10);

    // Projects with Plagiarism Issues
    const plagiarizedProjects = await Project.find({
      'plagiarismCheck.isPlagiarized': true
    })
      .populate('owner', 'email profile')
      .limit(10);

    // Users with Fake Profile Risk
    const allUsers = await User.find().select('-password');
    const riskyUsers = [];
    for (const user of allUsers.slice(0, 50)) { // Check first 50 to avoid performance issues
      const fakeCheck = await detectFakeProfile(user._id);
      if (fakeCheck.riskScore >= 50) {
        riskyUsers.push({
          user,
          riskScore: fakeCheck.riskScore,
          reasons: fakeCheck.reasons
        });
      }
    }

    const stats = {
      users: {
        total: totalUsers,
        verified: verifiedUsers,
        emailVerified: emailVerifiedUsers,
        byRole: usersByRole
      },
      projects: {
        total: totalProjects,
        verified: verifiedProjects,
        byStatus: projectsByStatus,
        byDomain: projectsByDomain
      },
      collaborations: {
        total: totalRequests,
        pending: pendingRequests,
        accepted: acceptedRequests
      },
      bookmarks: totalBookmarks,
      abandonedProjectsCount: abandonedProjects.length,
      unverifiedProjectsCount: unverifiedProjects.length,
      plagiarizedProjectsCount: plagiarizedProjects.length,
      riskyUsersCount: riskyUsers.length
    };

    res.json({
      stats,
      recentProjects,
      recentUsers,
      abandonedProjects,
      unverifiedProjects,
      plagiarizedProjects,
      riskyUsers: riskyUsers.slice(0, 10) // Limit to 10 for response size
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all users
router.get('/users', auth, authorize('Admin'), async (req, res) => {
  try {
    const { role, search } = req.query;
    const query = {};

    if (role) query.role = role;
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { 'profile.name': { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user details
router.get('/users/:userId', auth, authorize('Admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userProjects = await Project.find({ owner: req.params.userId });
    const collaborations = await CollaborationRequest.find({ requester: req.params.userId });

    res.json({
      user: {
        ...user.toObject(),
        profileCompletion: user.calculateProfileCompletion()
      },
      projects: userProjects.length,
      collaborationRequests: collaborations.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user role
router.put('/users/:userId/role', auth, authorize('Admin'), async (req, res) => {
  try {
    const { role } = req.body;

    if (!['Student', 'Mentor', 'Investor', 'Admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.json({ message: 'User role updated', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete user
router.delete('/users/:userId', auth, authorize('Admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user's projects
    await Project.deleteMany({ owner: req.params.userId });

    // Delete user
    await User.findByIdAndDelete(req.params.userId);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all projects (Full view for admin)
router.get('/projects', auth, authorize('Admin'), async (req, res) => {
  try {
    const { status, domain, search, verified } = req.query;
    const query = {};

    if (status) query.status = status;
    if (domain) query.domain = domain;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const projects = await Project.find(query)
      .populate('owner', 'email profile')
      .populate('mentor', 'email profile')
      .populate('collaborators.user', 'email profile')
      .populate('verification.verifiedBy', 'email profile')
      .populate('plagiarismCheck.similarProjects.projectId', 'title description')
      .sort({ createdAt: -1 });

    // Filter by verification if specified
    let filteredProjects = projects;
    if (verified === 'true') {
      filteredProjects = projects.filter(p => p.verification?.verified === true);
    } else if (verified === 'false') {
      filteredProjects = projects.filter(p => !p.verification?.verified);
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const paginatedProjects = filteredProjects.slice(skip, skip + limit);

    res.json({ 
      projects: paginatedProjects,
      total: projects.length,
      filtered: filteredProjects.length,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(filteredProjects.length / limit),
        totalItems: filteredProjects.length,
        itemsPerPage: limit,
        hasNextPage: skip + limit < filteredProjects.length,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Flag abandoned projects
router.post('/projects/:projectId/flag-abandoned', auth, authorize('Admin'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Add flag to project (you can extend schema to add flags array)
    project.status = 'Open'; // Reset to open for visibility
    await project.save();

    res.json({ message: 'Project flagged', project });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete project
router.delete('/projects/:projectId', auth, authorize('Admin'), async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.projectId);
    await CollaborationRequest.deleteMany({ project: req.params.projectId });
    await Bookmark.deleteMany({ project: req.params.projectId });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ========== PROJECT VERIFICATION (AI ONLY) ==========

// Verify project using AI (automatic, no manual verification)
router.post('/projects/:projectId/verify', auth, authorize('Admin'), async (req, res) => {
  try {
    const result = await verifyProject(req.params.projectId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Check project verification status
router.get('/projects/:projectId/verification', auth, authorize('Admin'), async (req, res) => {
  try {
    const result = await checkProjectVerification(req.params.projectId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Auto-verify project using AI (triggers AI verification)
router.post('/projects/:projectId/auto-verify', auth, authorize('Admin'), async (req, res) => {
  try {
    const result = await autoVerifyProject(req.params.projectId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all unverified projects
router.get('/projects/unverified', auth, authorize('Admin'), async (req, res) => {
  try {
    const projects = await Project.find({
      'verification.verified': { $ne: true }
    })
      .populate('owner', 'email profile')
      .populate('verification.verifiedBy', 'email profile')
      .sort({ createdAt: -1 });

    res.json({ projects });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ========== PROFILE VERIFICATION (AI ONLY) ==========

// Verify user profile using AI (automatic, no manual verification)
router.post('/users/:userId/verify-profile', auth, authorize('Admin'), async (req, res) => {
  try {
    const result = await verifyProfile(req.params.userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Check user profile risk
router.get('/users/:userId/profile-risk', auth, authorize('Admin'), async (req, res) => {
  try {
    const result = await detectFakeProfile(req.params.userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all unverified users
router.get('/users/unverified', auth, authorize('Admin'), async (req, res) => {
  try {
    const users = await User.find({
      $or: [
        { 'profile.verified': { $ne: true } },
        { emailVerified: false }
      ]
    })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ========== PLAGIARISM MANAGEMENT ==========

// Check plagiarism for project
router.post('/projects/:projectId/check-plagiarism', auth, authorize('Admin'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const result = await checkPlagiarism(project._id, project.title, project.description);

    project.plagiarismCheck = {
      checked: true,
      checkedAt: new Date(),
      similarityScore: result.similarityScore,
      isPlagiarized: result.isPlagiarized,
      similarProjects: result.similarProjects.map(sp => ({
        projectId: sp.id,
        similarity: sp.similarity
      }))
    };

    await project.save();

    res.json({
      ...result,
      projectId: project._id,
      checkedAt: project.plagiarismCheck.checkedAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all plagiarized projects
router.get('/projects/plagiarized', auth, authorize('Admin'), async (req, res) => {
  try {
    const projects = await Project.find({
      'plagiarismCheck.isPlagiarized': true
    })
      .populate('owner', 'email profile')
      .populate('plagiarismCheck.similarProjects.projectId', 'title description')
      .sort({ 'plagiarismCheck.checkedAt': -1 });

    res.json({ projects });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ========== CREATE ADMIN USER ==========

// Create admin user (only existing admins can do this)
router.post('/users/create-admin', auth, authorize('Admin'), async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({
      email,
      password,
      role: 'Admin',
      emailVerified: true, // Auto-verify admin emails
      profile: {
        name: name || email.split('@')[0],
        verified: true,
        verifiedAt: new Date()
      }
    });

    await user.save();

    res.status(201).json({
      message: 'Admin user created successfully',
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ========== SYSTEM STATISTICS ==========

// Get comprehensive system statistics
router.get('/statistics', auth, authorize('Admin'), async (req, res) => {
  try {
    const [
      totalUsers,
      verifiedUsers,
      totalProjects,
      verifiedProjects,
      totalRequests,
      totalBookmarks,
      usersByRole,
      projectsByStatus,
      projectsByDomain
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ 'profile.verified': true }),
      Project.countDocuments(),
      Project.countDocuments({ 'verification.verified': true }),
      CollaborationRequest.countDocuments(),
      Bookmark.countDocuments(),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      Project.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Project.aggregate([{ $group: { _id: '$domain', count: { $sum: 1 } } }])
    ]);

    res.json({
      users: {
        total: totalUsers,
        verified: verifiedUsers,
        unverified: totalUsers - verifiedUsers,
        byRole: usersByRole
      },
      projects: {
        total: totalProjects,
        verified: verifiedProjects,
        unverified: totalProjects - verifiedProjects,
        byStatus: projectsByStatus,
        byDomain: projectsByDomain
      },
      collaborations: {
        total: totalRequests
      },
      bookmarks: {
        total: totalBookmarks
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

