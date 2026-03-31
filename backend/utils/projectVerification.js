const Project = require('../models/Project');
const User = require('../models/User');
const { verifyProjectWithAI } = require('./aiVerification');

/**
 * Verify a project using AI only (no manual verification)
 */
const verifyProject = async (projectId) => {
  try {
    return await verifyProjectWithAI(projectId);
  } catch (error) {
    console.error('Project verification error:', error);
    return { success: false, message: 'Error verifying project', error: error.message };
  }
};

/**
 * Comprehensive project verification check
 */
const checkProjectVerification = async (projectId) => {
  try {
    const project = await Project.findById(projectId)
      .populate('owner', 'profile email')
      .populate('verification.verifiedBy', 'email profile');

    if (!project) {
      return {
        verified: false,
        checks: {},
        issues: ['Project not found'],
        score: 0
      };
    }

    const checks = {
      plagiarismChecked: project.plagiarismCheck?.checked || false,
      plagiarismPassed: !project.plagiarismCheck?.isPlagiarized,
      plagiarismScore: project.plagiarismCheck?.similarityScore || 0,
      hasLiveUrl: !!project.liveUrl,
      hasGithubRepo: !!project.githubRepo,
      hasDocumentation: !!project.documentationUrl,
      hasDemoVideo: !!project.demoVideoUrl,
      healthScore: project.healthScore || 0,
      ownerVerified: project.owner?.profile?.verified || false,
      ownerEmailVerified: project.owner?.emailVerified || false,
      hasDescription: project.description && project.description.length > 50,
      hasTechStack: project.techStack && project.techStack.length > 0,
      hasProgress: project.progressTimeline && project.progressTimeline.length > 0
    };

    const issues = [];
    let score = 0;

    // Scoring
    if (checks.plagiarismChecked && checks.plagiarismPassed) score += 20;
    else if (checks.plagiarismChecked && !checks.plagiarismPassed) issues.push('Plagiarism detected');

    if (checks.hasLiveUrl) score += 15;
    else issues.push('Missing live URL');

    if (checks.hasGithubRepo) score += 15;
    else issues.push('Missing GitHub repository');

    if (checks.hasDocumentation) score += 10;
    else issues.push('Missing documentation');

    if (checks.hasDemoVideo) score += 10;
    else issues.push('Missing demo video');

    if (checks.healthScore >= 70) score += 15;
    else if (checks.healthScore > 0) issues.push('Low health score');

    if (checks.ownerVerified) score += 10;
    else issues.push('Owner profile not verified');

    if (checks.ownerEmailVerified) score += 5;
    else issues.push('Owner email not verified');

    if (checks.hasDescription) score += 5;
    else issues.push('Insufficient description');

    if (checks.hasTechStack) score += 3;
    else issues.push('No tech stack specified');

    if (checks.hasProgress) score += 2;
    else issues.push('No progress updates');

    const verified = score >= 70 && checks.plagiarismPassed && checks.ownerEmailVerified;

    return {
      verified,
      checks,
      issues,
      score: Math.min(score, 100),
      recommendation: verified 
        ? 'Project is ready for verification'
        : 'Project needs improvements before verification'
    };
  } catch (error) {
    console.error('Project verification check error:', error);
    return {
      verified: false,
      checks: {},
      issues: ['Error checking verification'],
      score: 0
    };
  }
};

/**
 * Auto-verify project using AI (same as verifyProject now)
 */
const autoVerifyProject = async (projectId) => {
  return await verifyProject(projectId);
};

module.exports = {
  verifyProject,
  checkProjectVerification,
  autoVerifyProject
};

