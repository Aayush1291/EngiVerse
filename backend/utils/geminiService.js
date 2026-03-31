const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Analyze project health using Gemini AI
const analyzeProjectHealthWithAI = async (project) => {
  try {
    // If no API key, fall back to deterministic analysis
    if (!process.env.GEMINI_API_KEY) {
      return analyzeProjectHealthFallback(project);
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const projectData = {
      title: project.title,
      description: project.description,
      domain: project.domain,
      techStack: project.techStack || [],
      difficulty: project.difficulty,
      status: project.status,
      collaboratorsCount: project.collaborators?.length || 0,
      progressUpdatesCount: project.progressTimeline?.length || 0,
      hasMentor: !!project.mentor,
      liveUrl: project.liveUrl || null,
      githubRepo: project.githubRepo || null,
      documentationUrl: project.documentationUrl || null,
      demoVideoUrl: project.demoVideoUrl || null,
      createdAt: project.createdAt
    };

    const prompt = `Analyze this engineering project and provide a comprehensive health score (0-100), missing modules, and suggested next steps.

Project Details:
- Title: ${projectData.title}
- Description: ${projectData.description}
- Domain: ${projectData.domain}
- Tech Stack: ${projectData.techStack.join(', ') || 'Not specified'}
- Difficulty: ${projectData.difficulty}
- Status: ${projectData.status}
- Number of Collaborators: ${projectData.collaboratorsCount}
- Progress Updates: ${projectData.progressUpdatesCount}
- Has Mentor: ${projectData.hasMentor}
- Live URL: ${projectData.liveUrl || 'Not provided'}
- GitHub Repository: ${projectData.githubRepo || 'Not provided'}
- Documentation: ${projectData.documentationUrl || 'Not provided'}
- Demo Video: ${projectData.demoVideoUrl || 'Not provided'}

Please provide a JSON response with:
1. healthScore: A number between 0-100 based on:
   - Project completeness (title, description, tech stack)
   - Team composition (collaborators, mentor)
   - Progress tracking (updates, milestones)
   - Resources availability (live URL, GitHub repo, documentation, demo video)
   - Overall project health and readiness
2. missingModules: An array of missing critical components (e.g., "Live Deployment", "GitHub Repository", "Documentation", "Demo Video", "Testing", "Team members", "Mentor guidance")
3. suggestedSteps: An array of actionable next steps to improve the project

Consider these factors in scoring:
- Live URL availability: +15 points
- GitHub repository: +10 points
- Documentation: +10 points
- Demo video: +10 points
- Team members: +5 points per collaborator (max 20)
- Mentor: +10 points
- Progress updates: +3 points per update (max 15)
- Complete tech stack: +10 points

Format your response as valid JSON only, no markdown or extra text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON from response
    let analysis;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : text;
      analysis = JSON.parse(jsonText.trim());
    } catch (parseError) {
      // If parsing fails, use fallback
      console.error('Failed to parse Gemini response:', parseError);
      return analyzeProjectHealthFallback(project);
    }

    // Validate and sanitize response
    const healthScore = Math.min(Math.max(parseInt(analysis.healthScore) || 0, 0), 100);
    const missingModules = Array.isArray(analysis.missingModules) ? analysis.missingModules : [];
    const suggestedSteps = Array.isArray(analysis.suggestedSteps) ? analysis.suggestedSteps : [];

    return {
      healthScore,
      missingModules,
      suggestedSteps
    };
  } catch (error) {
    console.error('Gemini AI Error:', error);
    // Fall back to deterministic analysis
    return analyzeProjectHealthFallback(project);
  }
};

// Fallback deterministic analysis - Properly defined health score calculation
const analyzeProjectHealthFallback = (project) => {
  let healthScore = 0;
  const missingModules = [];
  const suggestedSteps = [];
  const maxScore = 100;

  // 1. Basic Information (25 points max)
  if (project.title && project.title.trim().length >= 5) {
    healthScore += 5;
  } else {
    missingModules.push('Project title');
    suggestedSteps.push('Add a clear and descriptive project title (min 5 characters)');
  }

  if (project.description) {
    const descLength = project.description.trim().length;
    if (descLength >= 200) {
      healthScore += 10; // Excellent description
    } else if (descLength >= 100) {
      healthScore += 7; // Good description
    } else if (descLength >= 50) {
      healthScore += 4; // Basic description
    } else {
      missingModules.push('Detailed description');
      suggestedSteps.push('Expand project description to at least 100 characters');
    }
  } else {
    missingModules.push('Project description');
    suggestedSteps.push('Add a detailed project description');
  }

  if (project.domain) {
    healthScore += 5;
  } else {
    missingModules.push('Project domain');
    suggestedSteps.push('Specify the project domain');
  }

  if (project.difficulty) {
    healthScore += 5;
  } else {
    missingModules.push('Difficulty level');
    suggestedSteps.push('Specify the project difficulty level');
  }

  // 2. Technology Stack (15 points max)
  if (project.techStack && project.techStack.length > 0) {
    if (project.techStack.length >= 5) {
      healthScore += 15; // Comprehensive stack
    } else if (project.techStack.length >= 3) {
      healthScore += 12; // Good stack
    } else {
      healthScore += 8; // Basic stack
      missingModules.push('Complete tech stack');
      suggestedSteps.push('Add more technologies to your tech stack (recommended: 3-5 technologies)');
    }
  } else {
    missingModules.push('Tech stack');
    suggestedSteps.push('Specify the technologies used in your project');
  }

  // 3. Team & Collaboration (20 points max)
  if (project.collaborators && project.collaborators.length > 0) {
    const collaboratorCount = project.collaborators.length;
    if (collaboratorCount >= 3) {
      healthScore += 20; // Strong team
    } else if (collaboratorCount >= 2) {
      healthScore += 15; // Good team
    } else {
      healthScore += 10; // Basic team
      missingModules.push('More team members');
      suggestedSteps.push('Recruit more collaborators for better project development');
    }
  } else {
    missingModules.push('Team members');
    suggestedSteps.push('Recruit collaborators to accelerate development');
  }

  // 4. Progress Tracking (10 points max)
  if (project.progressTimeline && project.progressTimeline.length > 0) {
    const progressCount = project.progressTimeline.length;
    if (progressCount >= 5) {
      healthScore += 10; // Excellent progress tracking
    } else if (progressCount >= 3) {
      healthScore += 7; // Good progress
    } else {
      healthScore += 4; // Basic progress
      missingModules.push('More progress updates');
      suggestedSteps.push('Add more progress updates to track development milestones');
    }
  } else {
    missingModules.push('Progress updates');
    suggestedSteps.push('Add progress updates to track development milestones');
  }

  // 5. Mentor Support (10 points max)
  if (project.mentor) {
    healthScore += 10;
  } else {
    missingModules.push('Mentor guidance');
    suggestedSteps.push('Request mentor assignment for expert guidance');
  }

  // 6. Project Resources (20 points max)
  let resourcesCount = 0;
  if (project.liveUrl) {
    healthScore += 8;
    resourcesCount++;
  } else {
    missingModules.push('Live deployment URL');
    suggestedSteps.push('Deploy your project and add a live URL');
  }

  if (project.githubRepo) {
    healthScore += 6;
    resourcesCount++;
  } else {
    missingModules.push('GitHub repository');
    suggestedSteps.push('Create a GitHub repository and link it to your project');
  }

  if (project.documentationUrl) {
    healthScore += 4;
    resourcesCount++;
  } else {
    missingModules.push('Documentation');
    suggestedSteps.push('Create project documentation and add the link');
  }

  if (project.demoVideoUrl) {
    healthScore += 2;
    resourcesCount++;
  } else {
    missingModules.push('Demo video');
    suggestedSteps.push('Create a demo video showcasing your project');
  }

  // Bonus for having all resources
  if (resourcesCount === 4) {
    healthScore += 5; // Bonus for complete resources
  }

  // 7. Project Status (10 points max)
  if (project.status === 'Completed') {
    healthScore = Math.max(healthScore, 95); // Completed projects get high score
    if (healthScore < 95) healthScore = 95;
  } else if (project.status === 'Adopted') {
    healthScore += 10; // Active development
  } else if (project.status === 'Open') {
    healthScore += 5; // Open for collaboration
  }

  // 8. Project Age & Activity (bonus points)
  if (project.createdAt) {
    const daysSinceCreation = Math.floor((Date.now() - new Date(project.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceCreation > 0 && project.progressTimeline && project.progressTimeline.length > 0) {
      // Active project with recent updates
      healthScore += Math.min(5, Math.floor(daysSinceCreation / 30)); // Up to 5 bonus points
    }
  }

  // Ensure score is between 0-100
  healthScore = Math.min(Math.max(Math.round(healthScore), 0), maxScore);

  // Remove duplicate missing modules
  const uniqueMissingModules = [...new Set(missingModules)];
  const uniqueSuggestedSteps = [...new Set(suggestedSteps)];

  return {
    healthScore,
    missingModules: uniqueMissingModules,
    suggestedSteps: uniqueSuggestedSteps
  };
};

module.exports = {
  analyzeProjectHealthWithAI,
  analyzeProjectHealthFallback
};

