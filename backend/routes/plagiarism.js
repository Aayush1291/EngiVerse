const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const { auth, authorize } = require('../middleware/auth');
const { checkPlagiarism } = require('../utils/plagiarismDetector');

// Check plagiarism for a project
router.post('/check', auth, async (req, res) => {
  try {
    const { projectId, title, description } = req.body;

    if (!projectId || !title || !description) {
      return res.status(400).json({ message: 'Please provide projectId, title, and description' });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Only owner or admin can check plagiarism
    if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const result = await checkPlagiarism(projectId, title, description);

    // Update project with plagiarism check results
    project.plagiarismCheck = {
      checked: true,
      checkedAt: new Date(),
      similarityScore: result.similarityScore,
      isPlagiarized: result.isPlagiarized,
      similarProjects: result.similarProjects.map(sp => ({
        projectId: sp.id,
        similarity: sp.similarity
      })),
      flags: result.flags || []
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

// Get plagiarism check results for a project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('plagiarismCheck.similarProjects.projectId', 'title description');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Only owner, admin, or collaborators can view
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isCollaborator = project.collaborators?.some(
      c => c.user.toString() === req.user._id.toString()
    );
    const isAdmin = req.user.role === 'Admin';

    if (!isOwner && !isCollaborator && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({
      checked: project.plagiarismCheck?.checked || false,
      checkedAt: project.plagiarismCheck?.checkedAt,
      similarityScore: project.plagiarismCheck?.similarityScore || 0,
      isPlagiarized: project.plagiarismCheck?.isPlagiarized || false,
      similarProjects: project.plagiarismCheck?.similarProjects || []
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

