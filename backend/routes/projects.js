const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const CollaborationRequest = require('../models/CollaborationRequest');
const { auth, authorize } = require('../middleware/auth');
const { analyzeProjectHealth } = require('../utils/healthAnalyzer');

// Get all projects (with filters and pagination)
router.get('/', async (req, res) => {
  try {
    const { status, domain, difficulty, search, owner, mentor, page = 1, limit = 12 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (domain) query.domain = domain;
    if (difficulty) query.difficulty = difficulty;
    if (owner) query.owner = owner;
    if (mentor) query.mentor = mentor;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const total = await Project.countDocuments(query);

    const projects = await Project.find(query)
      .populate('owner', 'email profile')
      .populate('mentor', 'email profile')
      .populate('collaborators.user', 'email profile')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({ 
      projects,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single project
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'email profile')
      .populate('mentor', 'email profile')
      .populate('collaborators.user', 'email profile')
      .populate('progressTimeline.addedBy', 'email profile');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({ project });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create project (Student only)
router.post('/', auth, authorize('Student'), async (req, res) => {
  try {
    const { title, description, domain, techStack, difficulty, liveUrl, githubRepo, documentationUrl, demoVideoUrl } = req.body;

    // Validation
    if (!title || !description || !domain || !difficulty) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Title validation
    if (title.trim().length < 5) {
      return res.status(400).json({ message: 'Title must be at least 5 characters long' });
    }

    if (title.trim().length > 200) {
      return res.status(400).json({ message: 'Title must be less than 200 characters' });
    }

    // Description validation
    if (description.trim().length < 50) {
      return res.status(400).json({ message: 'Description must be at least 50 characters long' });
    }

    if (description.trim().length > 5000) {
      return res.status(400).json({ message: 'Description must be less than 5000 characters' });
    }

    // Domain validation
    const validDomains = ['Web Development', 'Mobile App', 'AI/ML', 'IoT', 'Blockchain', 'Cybersecurity', 'Data Science', 'Other'];
    if (!validDomains.includes(domain)) {
      return res.status(400).json({ message: 'Invalid domain selected' });
    }

    // Difficulty validation
    const validDifficulties = ['Beginner', 'Intermediate', 'Advanced'];
    if (!validDifficulties.includes(difficulty)) {
      return res.status(400).json({ message: 'Invalid difficulty level' });
    }

    // URL validation
    const urlPattern = /^https?:\/\/.+/i;
    if (liveUrl && !urlPattern.test(liveUrl)) {
      return res.status(400).json({ message: 'Invalid live URL format. Must start with http:// or https://' });
    }
    if (githubRepo && !urlPattern.test(githubRepo)) {
      return res.status(400).json({ message: 'Invalid GitHub URL format. Must start with http:// or https://' });
    }
    if (documentationUrl && !urlPattern.test(documentationUrl)) {
      return res.status(400).json({ message: 'Invalid documentation URL format. Must start with http:// or https://' });
    }
    if (demoVideoUrl && !urlPattern.test(demoVideoUrl)) {
      return res.status(400).json({ message: 'Invalid demo video URL format. Must start with http:// or https://' });
    }

    // Tech stack validation
    const techArray = Array.isArray(techStack) ? techStack : (techStack ? [techStack] : []);
    if (techArray.length > 20) {
      return res.status(400).json({ message: 'Maximum 20 technologies allowed in tech stack' });
    }

    const project = new Project({
      title: title.trim(),
      description: description.trim(),
      domain,
      techStack: techArray.map(tech => tech.trim()).filter(tech => tech.length > 0),
      difficulty,
      liveUrl: liveUrl?.trim() || undefined,
      githubRepo: githubRepo?.trim() || undefined,
      documentationUrl: documentationUrl?.trim() || undefined,
      demoVideoUrl: demoVideoUrl?.trim() || undefined,
      owner: req.user._id
    });

    await project.save();
    
    // Automatic plagiarism check on creation (run synchronously to get result for warning)
    const { checkPlagiarism } = require('../utils/plagiarismDetector');
    let plagiarismWarning = null;
    
    try {
      const plagiarismResult = await checkPlagiarism(project._id, project.title, project.description);
      project.plagiarismCheck = {
        checked: true,
        checkedAt: new Date(),
        similarityScore: plagiarismResult.similarityScore,
        isPlagiarized: plagiarismResult.isPlagiarized,
        similarProjects: (plagiarismResult.similarProjects || []).map(sp => ({
          projectId: sp.id,
          similarity: sp.similarity
        })),
        flags: plagiarismResult.flags || []
      };
      await project.save();
      
      console.log(`Project ${project._id} plagiarism check: ${plagiarismResult.isPlagiarized ? 'PLAGIARIZED' : 'Original'} (Score: ${plagiarismResult.similarityScore}%)`);
      
      // Set warning if plagiarism detected
      if (plagiarismResult.isPlagiarized) {
        plagiarismWarning = {
          isPlagiarized: true,
          similarityScore: plagiarismResult.similarityScore,
          flags: plagiarismResult.flags || [],
          message: '⚠️ WARNING: Plagiarism detected in your project. Please review and ensure all content is original.'
        };
      }
    } catch (err) {
      console.error('Plagiarism check error:', err);
      // Continue even if plagiarism check fails
    }
    
    // Automatic AI verification ONLY on creation (async, don't block response)
    const { verifyProjectWithAI } = require('../utils/aiVerification');
    verifyProjectWithAI(project._id).then(result => {
      console.log(`Project ${project._id} AI verification: ${result.verified ? 'Verified' : 'Not verified'} (Confidence: ${result.confidence}%)`);
    }).catch(err => console.error('AI verification error:', err));

    await project.populate('owner', 'email profile');

    res.status(201).json({ 
      message: 'Project created successfully', 
      project,
      plagiarismWarning
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', error: error.message });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update project
router.put('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Only owner can update
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this project' });
    }

    const { title, description, domain, techStack, difficulty, status, liveUrl, githubRepo, documentationUrl, demoVideoUrl } = req.body;

    // Validation for updates
    if (title) {
      if (title.trim().length < 5) {
        return res.status(400).json({ message: 'Title must be at least 5 characters long' });
      }
      if (title.trim().length > 200) {
        return res.status(400).json({ message: 'Title must be less than 200 characters' });
      }
      project.title = title.trim();
    }

    if (description) {
      if (description.trim().length < 50) {
        return res.status(400).json({ message: 'Description must be at least 50 characters long' });
      }
      if (description.trim().length > 5000) {
        return res.status(400).json({ message: 'Description must be less than 5000 characters' });
      }
      project.description = description.trim();
    }

    if (domain) {
      const validDomains = ['Web Development', 'Mobile App', 'AI/ML', 'IoT', 'Blockchain', 'Cybersecurity', 'Data Science', 'Other'];
      if (!validDomains.includes(domain)) {
        return res.status(400).json({ message: 'Invalid domain selected' });
      }
      project.domain = domain;
    }

    if (difficulty) {
      const validDifficulties = ['Beginner', 'Intermediate', 'Advanced'];
      if (!validDifficulties.includes(difficulty)) {
        return res.status(400).json({ message: 'Invalid difficulty level' });
      }
      project.difficulty = difficulty;
    }

    if (status) {
      const validStatuses = ['Open', 'Adopted', 'Completed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      project.status = status;
    }

    if (techStack) {
      const techArray = Array.isArray(techStack) ? techStack : [techStack];
      if (techArray.length > 20) {
        return res.status(400).json({ message: 'Maximum 20 technologies allowed in tech stack' });
      }
      project.techStack = techArray.map(tech => tech.trim()).filter(tech => tech.length > 0);
    }

    // URL validation
    const urlPattern = /^https?:\/\/.+/i;
    if (liveUrl !== undefined) {
      if (liveUrl && !urlPattern.test(liveUrl)) {
        return res.status(400).json({ message: 'Invalid live URL format. Must start with http:// or https://' });
      }
      project.liveUrl = liveUrl?.trim() || undefined;
    }
    if (githubRepo !== undefined) {
      if (githubRepo && !urlPattern.test(githubRepo)) {
        return res.status(400).json({ message: 'Invalid GitHub URL format. Must start with http:// or https://' });
      }
      project.githubRepo = githubRepo?.trim() || undefined;
    }
    if (documentationUrl !== undefined) {
      if (documentationUrl && !urlPattern.test(documentationUrl)) {
        return res.status(400).json({ message: 'Invalid documentation URL format. Must start with http:// or https://' });
      }
      project.documentationUrl = documentationUrl?.trim() || undefined;
    }
    if (demoVideoUrl !== undefined) {
      if (demoVideoUrl && !urlPattern.test(demoVideoUrl)) {
        return res.status(400).json({ message: 'Invalid demo video URL format. Must start with http:// or https://' });
      }
      project.demoVideoUrl = demoVideoUrl?.trim() || undefined;
    }

    // Note: Verification only runs on project creation, not on update

    await project.save();
    await project.populate('owner', 'email profile');

    res.json({ message: 'Project updated successfully', project });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete project
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Only owner or admin can delete
    if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized to delete this project' });
    }

    await Project.findByIdAndDelete(req.params.id);
    await CollaborationRequest.deleteMany({ project: req.params.id });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Publish project
router.post('/:id/publish', auth, authorize('Student'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    project.status = 'Open';
    await project.save();

    res.json({ message: 'Project published successfully', project });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add progress update
router.post('/:id/progress', auth, async (req, res) => {
  try {
    const { update } = req.body;

    if (!update) {
      return res.status(400).json({ message: 'Please provide progress update' });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is owner or collaborator
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isCollaborator = project.collaborators.some(
      c => c.user.toString() === req.user._id.toString()
    );

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ message: 'Not authorized to add progress' });
    }

    project.progressTimeline.push({
      update,
      addedBy: req.user._id
    });

    await project.save();
    await project.populate('progressTimeline.addedBy', 'email profile');

    res.json({ message: 'Progress update added', project });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Leave project
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Owner cannot leave
    if (project.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Owner cannot leave project' });
    }

    project.collaborators = project.collaborators.filter(
      c => c.user.toString() !== req.user._id.toString()
    );

    await project.save();
    res.json({ message: 'Left project successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

