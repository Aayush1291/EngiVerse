const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const { auth } = require('../middleware/auth');
const { generatePitchDeck } = require('../utils/pitchDeckGenerator');

// Generate pitch deck for a project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user has access (owner, collaborator, mentor, or admin)
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isCollaborator = project.collaborators?.some(
      c => c.user.toString() === req.user._id.toString()
    );
    const isMentor = project.mentor?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin';

    if (!isOwner && !isCollaborator && !isMentor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to generate pitch deck' });
    }

    const result = await generatePitchDeck(req.params.projectId);

    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

