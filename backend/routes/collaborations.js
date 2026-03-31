const express = require('express');
const router = express.Router();
const CollaborationRequest = require('../models/CollaborationRequest');
const Project = require('../models/Project');
const { auth, authorize } = require('../middleware/auth');

// Request collaboration
router.post('/request', auth, authorize('Student'), async (req, res) => {
  try {
    const { projectId, message } = req.body;

    // Validation
    if (!projectId) {
      return res.status(400).json({ message: 'Project ID required' });
    }

    // Admin and Investor cannot be collaborators
    if (req.user.role === 'Admin') {
      return res.status(403).json({ message: 'Admins cannot be collaborators on projects' });
    }
    if (req.user.role === 'Investor') {
      return res.status(403).json({ message: 'Investors cannot collaborate on projects. They can only invest. Please use the investment request feature instead.' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Cannot request own project
    if (project.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot request collaboration on your own project' });
    }

    // Check if already a collaborator
    const isCollaborator = project.collaborators.some(
      c => c.user.toString() === req.user._id.toString()
    );
    if (isCollaborator) {
      return res.status(400).json({ message: 'Already a collaborator on this project' });
    }

    // Check if request already exists
    const existingRequest = await CollaborationRequest.findOne({
      project: projectId,
      requester: req.user._id,
      status: 'Pending'
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'Collaboration request already pending' });
    }

    const request = new CollaborationRequest({
      project: projectId,
      requester: req.user._id,
      message
    });

    await request.save();
    await request.populate('project', 'title owner');
    await request.populate('requester', 'email profile');

    res.status(201).json({ message: 'Collaboration request sent', request });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get collaboration requests for a project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Only owner can see requests
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const requests = await CollaborationRequest.find({ project: req.params.projectId })
      .populate('requester', 'email profile')
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get my collaboration requests
router.get('/my-requests', auth, async (req, res) => {
  try {
    const requests = await CollaborationRequest.find({ requester: req.user._id })
      .populate('project', 'title description domain status owner')
      .populate('project.owner', 'email profile')
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Accept collaboration request
router.post('/:requestId/accept', auth, async (req, res) => {
  try {
    const request = await CollaborationRequest.findById(req.params.requestId)
      .populate('project');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const project = request.project;

    // Only owner can accept
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check if requester is admin or investor (cannot be collaborators)
    const User = require('../models/User');
    const requester = await User.findById(request.requester);
    if (requester && requester.role === 'Admin') {
      return res.status(403).json({ message: 'Admins cannot be collaborators on projects' });
    }
    if (requester && requester.role === 'Investor') {
      return res.status(403).json({ message: 'Investors cannot be collaborators on projects. They can only invest.' });
    }

    // Add collaborator
    project.collaborators.push({
      user: request.requester,
      role: 'Contributor'
    });

    if (project.status === 'Open') {
      project.status = 'Adopted';
    }

    await project.save();

    // Update request
    request.status = 'Accepted';
    request.respondedAt = Date.now();
    await request.save();

    // Reject other pending requests from same user (optional)
    await CollaborationRequest.updateMany(
      {
        project: project._id,
        requester: request.requester,
        _id: { $ne: request._id },
        status: 'Pending'
      },
      { status: 'Rejected', respondedAt: Date.now() }
    );

    res.json({ message: 'Collaboration request accepted', project });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reject collaboration request
router.post('/:requestId/reject', auth, async (req, res) => {
  try {
    const request = await CollaborationRequest.findById(req.params.requestId)
      .populate('project');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Only owner can reject
    if (request.project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    request.status = 'Rejected';
    request.respondedAt = Date.now();
    await request.save();

    res.json({ message: 'Collaboration request rejected' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

