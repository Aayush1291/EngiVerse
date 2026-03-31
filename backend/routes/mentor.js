const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const ProgressUpdate = require('../models/ProgressUpdate');
const MentorRequest = require('../models/MentorRequest');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

// Get mentor dashboard
router.get('/dashboard', auth, authorize('Mentor'), async (req, res) => {
  try {
    const projects = await Project.find({ mentor: req.user._id })
      .populate('owner', 'email profile')
      .populate('collaborators.user', 'email profile')
      .sort({ updatedAt: -1 });

    // Get mentor requests for this mentor
    const mentorRequests = await MentorRequest.find({ mentor: req.user._id, status: 'Pending' })
      .populate('project', 'title description domain status owner')
      .populate('requester', 'email profile')
      .populate('project.owner', 'email profile')
      .sort({ createdAt: -1 });

    const stats = {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status !== 'Completed').length,
      completedProjects: projects.filter(p => p.status === 'Completed').length,
      pendingRequests: mentorRequests.length
    };

    res.json({ projects, mentorRequests, stats });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get mentor requests for a project (Student/Project Owner)
router.get('/requests/:projectId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Only owner can see requests
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const requests = await MentorRequest.find({ project: req.params.projectId })
      .populate('mentor', 'email profile')
      .populate('requester', 'email profile')
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Request mentor for project (Student/Project Owner)
router.post('/request/:projectId', auth, authorize('Student'), async (req, res) => {
  try {
    const { mentorId, message } = req.body;

    if (!mentorId) {
      return res.status(400).json({ message: 'Mentor ID required' });
    }

    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Only owner can request mentor
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only project owner can request a mentor' });
    }

    // Check if mentor exists and is actually a mentor
    const mentor = await User.findById(mentorId);
    if (!mentor || mentor.role !== 'Mentor') {
      return res.status(400).json({ message: 'Invalid mentor' });
    }

    // Check if already has a mentor
    if (project.mentor) {
      return res.status(400).json({ message: 'Project already has a mentor assigned' });
    }

    // Check if request already exists
    const existingRequest = await MentorRequest.findOne({
      project: req.params.projectId,
      mentor: mentorId,
      status: 'Pending'
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'Mentor request already pending' });
    }

    const request = new MentorRequest({
      project: req.params.projectId,
      requester: req.user._id,
      mentor: mentorId,
      message
    });

    await request.save();
    await request.populate('mentor', 'email profile');
    await request.populate('project', 'title description');

    res.status(201).json({ message: 'Mentor request sent', request });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Accept mentor request (Mentor)
router.post('/request/:requestId/accept', auth, authorize('Mentor'), async (req, res) => {
  try {
    const request = await MentorRequest.findById(req.params.requestId)
      .populate('project');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Only the requested mentor can accept
    if (request.mentor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const project = request.project;

    // Check if project already has a mentor
    if (project.mentor) {
      return res.status(400).json({ message: 'Project already has a mentor' });
    }

    // Assign mentor
    project.mentor = req.user._id;
    await project.save();

    // Update request
    request.status = 'Accepted';
    request.respondedAt = Date.now();
    await request.save();

    // Reject other pending requests for this project
    await MentorRequest.updateMany(
      {
        project: project._id,
        _id: { $ne: request._id },
        status: 'Pending'
      },
      { status: 'Rejected', respondedAt: Date.now() }
    );

    await project.populate('mentor', 'email profile');

    res.json({ message: 'Mentor request accepted', project });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reject mentor request (Mentor)
router.post('/request/:requestId/reject', auth, authorize('Mentor'), async (req, res) => {
  try {
    const request = await MentorRequest.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Only the requested mentor can reject
    if (request.mentor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    request.status = 'Rejected';
    request.respondedAt = Date.now();
    await request.save();

    res.json({ message: 'Mentor request rejected' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Assign mentor to project (Self-assign - Mentor)
router.post('/assign/:projectId', auth, authorize('Mentor'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if already has a mentor
    if (project.mentor) {
      return res.status(400).json({ message: 'Project already has a mentor assigned' });
    }

    project.mentor = req.user._id;
    await project.save();
    await project.populate('mentor', 'email profile');

    res.json({ message: 'Mentor assigned successfully', project });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add feedback/comment
router.post('/:projectId/feedback', auth, authorize('Mentor'), async (req, res) => {
  try {
    const { feedback, milestone } = req.body;

    if (!feedback) {
      return res.status(400).json({ message: 'Feedback required' });
    }

    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Verify mentor
    if (project.mentor?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not assigned as mentor for this project' });
    }

    const update = new ProgressUpdate({
      project: req.params.projectId,
      update: feedback,
      addedBy: req.user._id,
      milestone
    });

    await update.save();

    // Add to project timeline
    project.progressTimeline.push({
      update: `[Mentor Feedback] ${feedback}`,
      addedBy: req.user._id
    });

    await project.save();

    res.json({ message: 'Feedback added successfully', update });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve milestone
router.post('/:projectId/approve-milestone', auth, authorize('Mentor'), async (req, res) => {
  try {
    const { updateId } = req.body;

    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.mentor?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const update = await ProgressUpdate.findById(updateId);

    if (!update) {
      return res.status(404).json({ message: 'Update not found' });
    }

    update.approvedBy = req.user._id;
    update.approvedAt = Date.now();
    await update.save();

    res.json({ message: 'Milestone approved', update });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get project progress updates
router.get('/:projectId/updates', auth, authorize('Mentor'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.mentor?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updates = await ProgressUpdate.find({ project: req.params.projectId })
      .populate('addedBy', 'email profile')
      .populate('approvedBy', 'email profile')
      .sort({ createdAt: -1 });

    res.json({ updates });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

