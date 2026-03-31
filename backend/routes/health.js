const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const { auth } = require('../middleware/auth');
const { analyzeProjectHealth } = require('../utils/healthAnalyzer');

// Analyze project health
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('collaborators.user')
      .populate('mentor');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user has access (owner, collaborator, mentor, or admin)
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isCollaborator = project.collaborators.some(
      c => c.user._id.toString() === req.user._id.toString()
    );
    const isMentor = project.mentor?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin';

    if (!isOwner && !isCollaborator && !isMentor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view health analysis' });
    }

    const analysis = await analyzeProjectHealth(project);

    // Update project health score
    project.healthScore = analysis.healthScore;
    project.healthAnalysis = {
      lastAnalyzed: new Date(),
      missingModules: analysis.missingModules,
      suggestedSteps: analysis.suggestedSteps
    };

    await project.save();

    res.json({
      healthScore: analysis.healthScore,
      missingModules: analysis.missingModules,
      suggestedSteps: analysis.suggestedSteps,
      lastAnalyzed: project.healthAnalysis.lastAnalyzed
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

