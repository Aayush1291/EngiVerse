const { GoogleGenerativeAI } = require('@google/generative-ai');
const Project = require('../models/Project');
const User = require('../models/User');
const { checkPlagiarism } = require('./plagiarismDetector');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * AI-powered project verification using Gemini
 */
const verifyProjectWithAI = async (projectId) => {
  try {
    const project = await Project.findById(projectId)
      .populate('owner', 'profile email')
      .populate('collaborators.user', 'profile email')
      .populate('mentor', 'profile email');

    if (!project) {
      return { success: false, message: 'Project not found' };
    }

    // If no API key, use basic verification
    if (!process.env.GEMINI_API_KEY) {
      return await verifyProjectBasic(project);
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Check plagiarism first
    const plagiarismResult = await checkPlagiarism(project._id, project.title, project.description);
    
    // Prepare project data for AI analysis
    const projectData = {
      title: project.title,
      description: project.description,
      domain: project.domain,
      techStack: project.techStack || [],
      difficulty: project.difficulty,
      status: project.status,
      owner: {
        name: project.owner?.profile?.name || project.owner?.email,
        email: project.owner?.email,
        verified: project.owner?.profile?.verified || false,
        emailVerified: project.owner?.emailVerified || false
      },
      collaborators: project.collaborators?.length || 0,
      mentor: project.mentor ? 'Yes' : 'No',
      liveUrl: project.liveUrl || 'Not provided',
      githubRepo: project.githubRepo || 'Not provided',
      documentationUrl: project.documentationUrl || 'Not provided',
      demoVideoUrl: project.demoVideoUrl || 'Not provided',
      healthScore: project.healthScore || 0,
      progressUpdates: project.progressTimeline?.length || 0,
      plagiarismScore: plagiarismResult.similarityScore || 0,
      isPlagiarized: plagiarismResult.isPlagiarized || false
    };

    const prompt = `Analyze this engineering project and determine if it should be verified. Consider all aspects of the project.

Project Information:
- Title: ${projectData.title}
- Description: ${projectData.description.substring(0, 1000)}
- Domain: ${projectData.domain}
- Tech Stack: ${projectData.techStack.join(', ') || 'Not specified'}
- Difficulty: ${projectData.difficulty}
- Status: ${projectData.status}
- Owner: ${projectData.owner.name} (${projectData.owner.email})
- Owner Verified: ${projectData.owner.verified}
- Owner Email Verified: ${projectData.owner.emailVerified}
- Collaborators: ${projectData.collaborators}
- Mentor: ${projectData.mentor}
- Live URL: ${projectData.liveUrl}
- GitHub Repository: ${projectData.githubRepo}
- Documentation: ${projectData.documentationUrl}
- Demo Video: ${projectData.demoVideoUrl}
- Health Score: ${projectData.healthScore}/100
- Progress Updates: ${projectData.progressUpdates}
- Plagiarism Check: ${projectData.isPlagiarized ? 'PLAGIARIZED' : 'Original'} (Similarity: ${projectData.plagiarismScore}%)

Verification Criteria:
1. Project must be original (not plagiarized)
2. Owner must have verified email
3. Project should have meaningful content (description, tech stack)
4. Project should have resources (live URL, GitHub, documentation, or demo)
5. Project should show progress or have good health score
6. Owner profile should be legitimate

Please provide a JSON response with:
{
  "verified": boolean - true if project should be verified
  "confidence": number (0-100) - confidence level in verification decision
  "reason": string - brief explanation of verification decision
  "issues": array of strings - any issues that prevent verification
  "strengths": array of strings - positive aspects of the project
}

Format your response as valid JSON only, no markdown or extra text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON from response
    let aiAnalysis;
    try {
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : text;
      aiAnalysis = JSON.parse(jsonText.trim());
    } catch (parseError) {
      console.error('Failed to parse Gemini verification response:', parseError);
      return await verifyProjectBasic(project);
    }

    // Update project verification status
    const verified = aiAnalysis.verified === true && !projectData.isPlagiarized && projectData.owner.emailVerified;

    project.verification = {
      verified,
      verifiedAt: verified ? new Date() : null,
      verifiedBy: null, // AI verification
      notes: `AI Verification: ${aiAnalysis.reason || 'Automated verification'} (Confidence: ${aiAnalysis.confidence || 0}%)`,
      checks: {
        plagiarismChecked: true,
        plagiarismScore: projectData.plagiarismScore,
        hasLiveUrl: !!project.liveUrl,
        hasGithubRepo: !!project.githubRepo,
        hasDocumentation: !!project.documentationUrl,
        hasDemoVideo: !!project.demoVideoUrl,
        healthScore: projectData.healthScore,
        ownerVerified: projectData.owner.verified
      },
      aiAnalysis: {
        confidence: aiAnalysis.confidence || 0,
        reason: aiAnalysis.reason || '',
        issues: aiAnalysis.issues || [],
        strengths: aiAnalysis.strengths || []
      }
    };

    // Update plagiarism check
    project.plagiarismCheck = {
      checked: true,
      checkedAt: new Date(),
      similarityScore: plagiarismResult.similarityScore,
      isPlagiarized: plagiarismResult.isPlagiarized,
      similarProjects: plagiarismResult.similarProjects.map(sp => ({
        projectId: sp.id,
        similarity: sp.similarity
      }))
    };

    await project.save();

    return {
      success: true,
      verified,
      confidence: aiAnalysis.confidence || 0,
      reason: aiAnalysis.reason || '',
      issues: aiAnalysis.issues || [],
      strengths: aiAnalysis.strengths || [],
      verification: project.verification
    };
  } catch (error) {
    console.error('AI project verification error:', error);
    // Try to get project for fallback
    try {
      const project = await Project.findById(projectId).populate('owner', 'profile email');
      if (project) {
        return await verifyProjectBasic(project);
      }
    } catch (fallbackError) {
      console.error('Fallback verification error:', fallbackError);
    }
    return { success: false, message: 'Error verifying project', error: error.message };
  }
};

/**
 * Basic project verification (fallback when AI unavailable)
 */
const verifyProjectBasic = async (project) => {
  try {
    // Check plagiarism
    const plagiarismResult = await checkPlagiarism(project._id, project.title, project.description);

    // Basic verification criteria
    const hasContent = project.description && project.description.length > 50;
    const hasTechStack = project.techStack && project.techStack.length > 0;
    const ownerEmailVerified = project.owner?.emailVerified || false;
    const notPlagiarized = !plagiarismResult.isPlagiarized;
    const hasResources = !!(project.liveUrl || project.githubRepo || project.documentationUrl || project.demoVideoUrl);

    const verified = hasContent && hasTechStack && ownerEmailVerified && notPlagiarized && hasResources;

    project.verification = {
      verified,
      verifiedAt: verified ? new Date() : null,
      verifiedBy: null,
      notes: verified ? 'Auto-verified: Meets basic criteria' : 'Not verified: Missing required criteria',
      checks: {
        plagiarismChecked: true,
        plagiarismScore: plagiarismResult.similarityScore,
        hasLiveUrl: !!project.liveUrl,
        hasGithubRepo: !!project.githubRepo,
        hasDocumentation: !!project.documentationUrl,
        hasDemoVideo: !!project.demoVideoUrl,
        healthScore: project.healthScore || 0,
        ownerVerified: project.owner?.profile?.verified || false
      }
    };

    project.plagiarismCheck = {
      checked: true,
      checkedAt: new Date(),
      similarityScore: plagiarismResult.similarityScore,
      isPlagiarized: plagiarismResult.isPlagiarized,
      similarProjects: plagiarismResult.similarProjects.map(sp => ({
        projectId: sp.id,
        similarity: sp.similarity
      }))
    };

    await project.save();

    return {
      success: true,
      verified,
      confidence: verified ? 75 : 0,
      reason: verified ? 'Meets basic verification criteria' : 'Does not meet basic criteria',
      issues: verified ? [] : [
        !hasContent && 'Insufficient description',
        !hasTechStack && 'No tech stack specified',
        !ownerEmailVerified && 'Owner email not verified',
        plagiarismResult.isPlagiarized && 'Plagiarism detected',
        !hasResources && 'No resources provided (URLs, GitHub, docs, demo)'
      ].filter(Boolean),
      strengths: verified ? ['Has content', 'Has tech stack', 'Owner verified', 'Original content', 'Has resources'] : []
    };
  } catch (error) {
    console.error('Basic verification error:', error);
    return { success: false, message: 'Error verifying project' };
  }
};

/**
 * AI-powered profile verification using Gemini
 */
const verifyProfileWithAI = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Get user activity
    const userProjects = await Project.countDocuments({ owner: userId });
    const CollaborationRequest = require('../models/CollaborationRequest');
    const userCollaborations = await CollaborationRequest.countDocuments({ requester: userId });

    // If no API key, use basic verification
    if (!process.env.GEMINI_API_KEY) {
      return await verifyProfileBasic(user, userProjects, userCollaborations);
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const profileData = {
      email: user.email,
      role: user.role,
      name: user.profile?.name || 'Not provided',
      bio: user.profile?.bio || 'Not provided',
      college: user.profile?.college || 'Not provided',
      company: user.profile?.company || 'Not provided',
      skills: user.profile?.skills || [],
      linkedin: user.profile?.linkedin || 'Not provided',
      github: user.profile?.github || 'Not provided',
      website: user.profile?.website || 'Not provided',
      emailVerified: user.emailVerified || false,
      profileCompletion: user.calculateProfileCompletion(),
      accountAge: Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
      projectsCount: userProjects,
      collaborationsCount: userCollaborations
    };

    const prompt = `Analyze this user profile and determine if it should be verified as genuine. Consider all aspects of the profile.

Profile Information:
- Email: ${profileData.email}
- Role: ${profileData.role}
- Name: ${profileData.name}
- Bio: ${profileData.bio.substring(0, 500)}
- ${profileData.role === 'Student' ? 'College' : 'Company'}: ${profileData.role === 'Student' ? profileData.college : profileData.company}
- Skills: ${profileData.skills.join(', ') || 'None'}
- LinkedIn: ${profileData.linkedin}
- GitHub: ${profileData.github}
- Website: ${profileData.website}
- Email Verified: ${profileData.emailVerified}
- Profile Completion: ${profileData.profileCompletion}%
- Account Age: ${profileData.accountAge} days
- Projects Created: ${profileData.projectsCount}
- Collaborations: ${profileData.collaborationsCount}

Verification Criteria:
1. Email must be verified
2. Profile should be complete (name, bio, skills)
3. Profile information should be realistic and detailed
4. For Mentors/Investors: LinkedIn should be provided
5. Account should show some activity (projects or collaborations)
6. No suspicious patterns (fake emails, spam, etc.)

Please provide a JSON response with:
{
  "verified": boolean - true if profile should be verified
  "confidence": number (0-100) - confidence level in verification decision
  "reason": string - brief explanation of verification decision
  "issues": array of strings - any issues that prevent verification
  "strengths": array of strings - positive aspects of the profile
}

Format your response as valid JSON only, no markdown or extra text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON from response
    let aiAnalysis;
    try {
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : text;
      aiAnalysis = JSON.parse(jsonText.trim());
    } catch (parseError) {
      console.error('Failed to parse Gemini profile verification response:', parseError);
      return await verifyProfileBasic(user, userProjects, userCollaborations);
    }

    // Update user verification status
    const verified = aiAnalysis.verified === true && profileData.emailVerified;

    user.profile.verified = verified;
    user.profile.verifiedAt = verified ? new Date() : null;
    user.profile.verificationNotes = `AI Verification: ${aiAnalysis.reason || 'Automated verification'} (Confidence: ${aiAnalysis.confidence || 0}%)`;
    user.profile.aiVerification = {
      confidence: aiAnalysis.confidence || 0,
      reason: aiAnalysis.reason || '',
      issues: aiAnalysis.issues || [],
      strengths: aiAnalysis.strengths || [],
      verifiedAt: new Date()
    };

    await user.save();

    return {
      success: true,
      verified,
      confidence: aiAnalysis.confidence || 0,
      reason: aiAnalysis.reason || '',
      issues: aiAnalysis.issues || [],
      strengths: aiAnalysis.strengths || []
    };
  } catch (error) {
    console.error('AI profile verification error:', error);
    // Try to get user for fallback
    try {
      const user = await User.findById(userId);
      if (user) {
        const userProjects = await Project.countDocuments({ owner: userId });
        const CollaborationRequest = require('../models/CollaborationRequest');
        const userCollaborations = await CollaborationRequest.countDocuments({ requester: userId });
        return await verifyProfileBasic(user, userProjects, userCollaborations);
      }
    } catch (fallbackError) {
      console.error('Fallback verification error:', fallbackError);
    }
    return { success: false, message: 'Error verifying profile', error: error.message };
  }
};

/**
 * Basic profile verification (fallback when AI unavailable)
 */
const verifyProfileBasic = async (user, userProjects, userCollaborations) => {
  try {
    const profileCompletion = user.calculateProfileCompletion();
    const hasName = user.profile?.name && user.profile.name.length > 2;
    const hasBio = user.profile?.bio && user.profile.bio.length > 20;
    const emailVerified = user.emailVerified || false;
    const hasSkills = user.profile?.skills && user.profile.skills.length > 0;
    const hasActivity = userProjects > 0 || userCollaborations > 0;

    // For Mentors/Investors, LinkedIn is important
    const hasLinkedIn = (user.role === 'Mentor' || user.role === 'Investor') 
      ? !!user.profile?.linkedin 
      : true;

    const verified = emailVerified && hasName && hasBio && hasSkills && hasLinkedIn && (hasActivity || profileCompletion >= 80);

    user.profile.verified = verified;
    user.profile.verifiedAt = verified ? new Date() : null;
    user.profile.verificationNotes = verified ? 'Auto-verified: Meets basic criteria' : 'Not verified: Missing required criteria';

    await user.save();

    return {
      success: true,
      verified,
      confidence: verified ? 70 : 0,
      reason: verified ? 'Meets basic verification criteria' : 'Does not meet basic criteria',
      issues: verified ? [] : [
        !emailVerified && 'Email not verified',
        !hasName && 'Name too short or missing',
        !hasBio && 'Bio too short or missing',
        !hasSkills && 'No skills specified',
        !hasLinkedIn && 'LinkedIn required for ' + user.role,
        !hasActivity && profileCompletion < 80 && 'No activity and incomplete profile'
      ].filter(Boolean),
      strengths: verified ? ['Email verified', 'Complete profile', 'Has activity'] : []
    };
  } catch (error) {
    console.error('Basic profile verification error:', error);
    return { success: false, message: 'Error verifying profile' };
  }
};

module.exports = {
  verifyProjectWithAI,
  verifyProfileWithAI
};

