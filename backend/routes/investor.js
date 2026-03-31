const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Bookmark = require('../models/Bookmark');
const InvestmentRequest = require('../models/InvestmentRequest');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

// Browse projects
router.get('/projects', auth, authorize('Investor'), async (req, res) => {
  try {
    const { search, domain, status } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (domain) query.domain = domain;
    if (status) query.status = status;

    const projects = await Project.find(query)
      .populate('owner', 'email profile')
      .populate('collaborators.user', 'email profile')
      .sort({ createdAt: -1 });

    // Calculate traction metrics
    const projectsWithMetrics = projects.map(project => {
      const traction = {
        collaborators: project.collaborators.length,
        progressUpdates: project.progressTimeline.length,
        daysActive: Math.floor((Date.now() - project.createdAt) / (1000 * 60 * 60 * 24)),
        healthScore: project.healthScore
      };

      return {
        ...project.toObject(),
        traction
      };
    });

    res.json({ projects: projectsWithMetrics });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get project details with traction
router.get('/projects/:id', auth, authorize('Investor'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'email profile')
      .populate('collaborators.user', 'email profile')
      .populate('mentor', 'email profile');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const traction = {
      collaborators: project.collaborators.length,
      progressUpdates: project.progressTimeline.length,
      daysActive: Math.floor((Date.now() - project.createdAt) / (1000 * 60 * 60 * 24)),
      healthScore: project.healthScore,
      hasMentor: !!project.mentor
    };

    res.json({
      project: {
        ...project.toObject(),
        traction
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Bookmark project
router.post('/bookmark/:projectId', auth, authorize('Investor'), async (req, res) => {
  try {
    const { notes } = req.body;

    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const existingBookmark = await Bookmark.findOne({
      investor: req.user._id,
      project: req.params.projectId
    });

    if (existingBookmark) {
      return res.status(400).json({ message: 'Project already bookmarked' });
    }

    const bookmark = new Bookmark({
      investor: req.user._id,
      project: req.params.projectId,
      notes
    });

    await bookmark.save();
    await bookmark.populate('project', 'title description domain');

    res.status(201).json({ message: 'Project bookmarked', bookmark });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove bookmark
router.delete('/bookmark/:projectId', auth, authorize('Investor'), async (req, res) => {
  try {
    await Bookmark.findOneAndDelete({
      investor: req.user._id,
      project: req.params.projectId
    });

    res.json({ message: 'Bookmark removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get my bookmarks
router.get('/bookmarks', auth, authorize('Investor'), async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ investor: req.user._id })
      .populate('project', 'title description domain status owner')
      .populate('project.owner', 'email profile')
      .sort({ createdAt: -1 });

    res.json({ bookmarks });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Request investment (Investor contacts project owner)
router.post('/request-investment/:projectId', auth, authorize('Investor'), async (req, res) => {
  try {
    const { message, investmentAmount } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message required' });
    }

    const project = await Project.findById(req.params.projectId)
      .populate('owner', 'email profile');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if request already exists
    const existingRequest = await InvestmentRequest.findOne({
      project: req.params.projectId,
      investor: req.user._id,
      status: 'Pending'
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'Investment request already pending' });
    }

    const request = new InvestmentRequest({
      project: req.params.projectId,
      requester: project.owner._id,
      investor: req.user._id,
      message,
      investmentAmount: investmentAmount || undefined
    });

    await request.save();
    await request.populate('investor', 'email profile');
    await request.populate('project', 'title description');

    res.status(201).json({ message: 'Investment request sent', request });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Project owner requests investment from investor
router.post('/request/:investorId', auth, authorize('Student'), async (req, res) => {
  try {
    const { projectId, message, investmentAmount } = req.body;

    if (!projectId || !message) {
      return res.status(400).json({ message: 'Project ID and message required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Only owner can request investment
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only project owner can request investment' });
    }

    // Check if investor exists and is actually an investor
    const investor = await User.findById(req.params.investorId);
    if (!investor || investor.role !== 'Investor') {
      return res.status(400).json({ message: 'Invalid investor' });
    }

    // Check if request already exists
    const existingRequest = await InvestmentRequest.findOne({
      project: projectId,
      investor: req.params.investorId,
      status: 'Pending'
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'Investment request already pending' });
    }

    const request = new InvestmentRequest({
      project: projectId,
      requester: req.user._id,
      investor: req.params.investorId,
      message,
      investmentAmount: investmentAmount || undefined
    });

    await request.save();
    await request.populate('investor', 'email profile');
    await request.populate('project', 'title description');

    res.status(201).json({ message: 'Investment request sent', request });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get investment requests for project owner
router.get('/investment-requests', auth, async (req, res) => {
  try {
    const { type } = req.query; // 'sent' or 'received'

    let requests;
    if (type === 'sent') {
      // Requests sent by project owner
      requests = await InvestmentRequest.find({ requester: req.user._id })
        .populate('project', 'title description domain status')
        .populate('investor', 'email profile')
        .sort({ createdAt: -1 });
    } else {
      // Requests received by project owner (investor contacted them)
      const myProjects = await Project.find({ owner: req.user._id }).select('_id');
      const projectIds = myProjects.map(p => p._id);
      
      requests = await InvestmentRequest.find({ 
        project: { $in: projectIds },
        requester: req.user._id
      })
        .populate('project', 'title description domain status')
        .populate('investor', 'email profile')
        .sort({ createdAt: -1 });
    }

    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get investment requests for investor
router.get('/my-investment-requests', auth, authorize('Investor'), async (req, res) => {
  try {
    const requests = await InvestmentRequest.find({ investor: req.user._id })
      .populate('project', 'title description domain status owner')
      .populate('project.owner', 'email profile')
      .populate('requester', 'email profile')
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Accept/Reject investment request
router.post('/investment-request/:requestId/:action', auth, async (req, res) => {
  try {
    const { action } = req.params; // 'accept' or 'reject'
    const { message } = req.body;

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const request = await InvestmentRequest.findById(req.params.requestId)
      .populate('project');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const project = request.project;

    // Only project owner can accept/reject
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (action === 'accept') {
      request.status = 'Accepted';
    } else {
      request.status = 'Rejected';
    }

    request.respondedAt = Date.now();
    if (message) {
      request.message = `${request.message}\n\n[Response]: ${message}`;
    }
    await request.save();

    res.json({ 
      message: `Investment request ${action}ed`,
      request 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Contact project owner (Legacy - kept for backward compatibility, uses investment request)
router.post('/contact/:projectId', auth, authorize('Investor'), async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message required' });
    }

    // Use investment request logic
    const project = await Project.findById(req.params.projectId)
      .populate('owner', 'email profile');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if request already exists
    const existingRequest = await InvestmentRequest.findOne({
      project: req.params.projectId,
      investor: req.user._id,
      status: 'Pending'
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'Investment request already pending' });
    }

    const request = new InvestmentRequest({
      project: req.params.projectId,
      requester: project.owner._id,
      investor: req.user._id,
      message
    });

    await request.save();
    await request.populate('investor', 'email profile');
    await request.populate('project', 'title description');

    res.status(201).json({ 
      message: 'Contact request sent (Investment request created)', 
      request,
      owner: {
        email: project.owner.email,
        profile: project.owner.profile
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

