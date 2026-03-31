const { GoogleGenerativeAI } = require('@google/generative-ai');
const Project = require('../models/Project');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Generate a pitch deck for a project using AI
 */
const generatePitchDeck = async (projectId) => {
  try {
    const project = await Project.findById(projectId)
      .populate('owner', 'profile email')
      .populate('collaborators.user', 'profile email')
      .populate('mentor', 'profile email');

    if (!project) {
      return {
        success: false,
        message: 'Project not found'
      };
    }

    // If Gemini API is available, use AI for generation
    if (process.env.GEMINI_API_KEY) {
      return await generatePitchDeckWithAI(project);
    }

    // Fallback to template-based generation
    return generatePitchDeckTemplate(project);
  } catch (error) {
    console.error('Pitch deck generation error:', error);
    return {
      success: false,
      message: 'Error generating pitch deck',
      error: error.message
    };
  }
};

/**
 * AI-powered pitch deck generation using Gemini
 */
const generatePitchDeckWithAI = async (project) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const projectData = {
      title: project.title,
      description: project.description,
      domain: project.domain,
      techStack: project.techStack || [],
      difficulty: project.difficulty,
      status: project.status,
      owner: project.owner?.profile?.name || project.owner?.email,
      collaborators: project.collaborators?.map(c => c.user?.profile?.name || c.user?.email) || [],
      mentor: project.mentor?.profile?.name || project.mentor?.email,
      liveUrl: project.liveUrl,
      githubRepo: project.githubRepo,
      documentationUrl: project.documentationUrl,
      demoVideoUrl: project.demoVideoUrl,
      healthScore: project.healthScore,
      progressUpdates: project.progressTimeline?.length || 0
    };

    const prompt = `Generate a professional startup/hackathon pitch deck following the standard 10-slide template. This is for an engineering project that needs to be presented to investors, judges, or potential collaborators.

PROJECT INFORMATION:
- Project Title: ${projectData.title}
- Description: ${projectData.description}
- Domain/Category: ${projectData.domain}
- Tech Stack: ${projectData.techStack.join(', ') || 'Not specified'}
- Difficulty Level: ${projectData.difficulty}
- Current Status: ${projectData.status}
- Project Owner: ${projectData.owner}
- Team Members: ${projectData.collaborators.join(', ') || 'None'}
- Mentor: ${projectData.mentor || 'None'}
- Live Demo URL: ${projectData.liveUrl || 'Not available'}
- GitHub Repository: ${projectData.githubRepo || 'Not available'}
- Documentation: ${projectData.documentationUrl || 'Not available'}
- Demo Video: ${projectData.demoVideoUrl || 'Not available'}
- Project Health Score: ${projectData.healthScore}/100
- Progress Updates: ${projectData.progressUpdates}

Create a professional 10-slide pitch deck following this EXACT structure (standard startup/hackathon format):

SLIDE 1 - TITLE SLIDE:
- Project name (large, bold)
- Compelling tagline (one sentence that captures the essence)
- Domain/Category
- Team name or key members

SLIDE 2 - PROBLEM STATEMENT:
- Clearly define the problem being solved
- Why is this problem important?
- Who faces this problem?
- What are the pain points?
- Use specific, relatable examples

SLIDE 3 - SOLUTION:
- What is your solution?
- How does it solve the problem?
- Key features and benefits
- What makes it unique?
- Value proposition (one clear statement)

SLIDE 4 - MARKET OPPORTUNITY:
- Target market size
- Who are your users/customers?
- Market opportunity
- Why now? (market timing)
- Potential impact

SLIDE 5 - PRODUCT/TECHNOLOGY:
- How does it work? (high-level architecture)
- Technology stack used
- Key technical innovations
- Screenshots/demo highlights (if available)
- What makes it technically impressive?

SLIDE 6 - TRACTION & PROGRESS:
- Current status and achievements
- Progress milestones reached
- Health score: ${projectData.healthScore}/100
- What has been built so far
- User feedback or validation (if any)

SLIDE 7 - DEMO & LINKS:
- Live demo URL: ${projectData.liveUrl || 'Coming soon'}
- GitHub repository: ${projectData.githubRepo || 'Private'}
- Documentation: ${projectData.documentationUrl || 'In progress'}
- Demo video: ${projectData.demoVideoUrl || 'Available on request'}
- How to access/try the product

SLIDE 8 - TEAM:
- Project owner: ${projectData.owner}
- Team members: ${projectData.collaborators.join(', ') || 'Solo project'}
- Mentor: ${projectData.mentor || 'Seeking mentor'}
- Key skills and expertise
- Why this team can execute

SLIDE 9 - ROADMAP & NEXT STEPS:
- Short-term goals (next 1-3 months)
- Long-term vision
- Planned features
- Scaling strategy
- Future milestones

SLIDE 10 - CALL TO ACTION:
- What are you seeking? (Investment, collaboration, feedback, mentorship)
- How can people get involved?
- Contact information
- Next steps for interested parties
- Thank you message

IMPORTANT GUIDELINES:
- Each slide should be concise and impactful (2-4 bullet points max)
- Use professional, clear language
- Make it compelling for investors/judges
- Focus on impact and innovation
- Be specific with numbers and facts where possible
- Keep content scannable and easy to present

Generate a JSON response with this exact structure:
{
  "slides": [
    {
      "slideNumber": 1,
      "title": "Title Slide",
      "content": "Content for slide 1 following the format above"
    },
    {
      "slideNumber": 2,
      "title": "Problem Statement",
      "content": "Content for slide 2 following the format above"
    },
    // ... continue for all 10 slides
  ],
  "summary": "One paragraph executive summary of the entire pitch"
}

Format your response as valid JSON only, no markdown or extra text. Make sure it's exactly 10 slides following the structure above.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON from response
    let pitchDeck;
    try {
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : text;
      pitchDeck = JSON.parse(jsonText.trim());
    } catch (parseError) {
      console.error('Failed to parse Gemini pitch deck response:', parseError);
      return generatePitchDeckTemplate(project);
    }

    // Validate and ensure exactly 10 slides
    let slides = pitchDeck.slides || [];
    
    // If we don't have exactly 10 slides, use template
    if (slides.length !== 10) {
      console.warn(`Expected 10 slides, got ${slides.length}. Using template.`);
      return generatePitchDeckTemplate(project);
    }

    // Ensure slides are numbered 1-10
    slides = slides.map((slide, index) => ({
      ...slide,
      slideNumber: slide.slideNumber || index + 1,
      title: slide.title || `Slide ${index + 1}`,
      content: slide.content || ''
    }));

    return {
      success: true,
      projectId: project._id,
      projectTitle: project.title,
      generatedAt: new Date(),
      slides,
      summary: pitchDeck.summary || `Professional pitch deck for ${project.title}`,
      format: 'AI Generated'
    };
  } catch (error) {
    console.error('AI pitch deck generation error:', error);
    return generatePitchDeckTemplate(project);
  }
};

/**
 * Template-based pitch deck generation (fallback) - Standard 10-slide format
 */
const generatePitchDeckTemplate = (project) => {
  const ownerName = project.owner?.profile?.name || project.owner?.email || 'Team';
  const teamMembers = project.collaborators?.map(c => c.user?.profile?.name || c.user?.email).join(', ') || 'Solo Project';
  const mentorName = project.mentor?.profile?.name || project.mentor?.email || 'Seeking Mentor';
  
  // Extract problem and solution from description
  const descriptionParts = project.description.split(/[.!?]/).filter(p => p.trim().length > 20);
  const problemStatement = descriptionParts[0]?.trim() || `Current solutions in ${project.domain} lack efficiency and user-friendliness.`;
  const solutionStatement = descriptionParts[1]?.trim() || `Our solution leverages ${project.techStack?.join(', ') || 'cutting-edge technology'} to address these challenges.`;

  const slides = [
    {
      slideNumber: 1,
      title: 'Title Slide',
      content: `${project.title}\n\n"${project.description.substring(0, 80)}${project.description.length > 80 ? '...' : ''}"\n\n${project.domain} | ${project.difficulty} Level\n\n${ownerName}`
    },
    {
      slideNumber: 2,
      title: 'Problem Statement',
      content: `• ${problemStatement}\n\n• Current solutions are inefficient and outdated\n\n• Users face significant challenges in:\n  - User experience\n  - Performance\n  - Accessibility\n\n• Market gap exists for innovative solutions`
    },
    {
      slideNumber: 3,
      title: 'Solution',
      content: `• ${solutionStatement}\n\n• Key Features:\n  - Modern, intuitive interface\n  - High performance and scalability\n  - ${project.techStack?.length > 0 ? 'Built with ' + project.techStack.slice(0, 3).join(', ') : 'Cutting-edge technology'}\n\n• Unique Value Proposition:\n  Solving ${project.domain} challenges with innovation and excellence`
    },
    {
      slideNumber: 4,
      title: 'Market Opportunity',
      content: `• Target Market: ${project.domain} sector\n\n• Market Size: Growing market with increasing demand\n\n• Target Users:\n  - Developers and engineers\n  - Businesses in ${project.domain}\n  - End users seeking better solutions\n\n• Why Now: Technology advancement and market readiness`
    },
    {
      slideNumber: 5,
      title: 'Product & Technology',
      content: `• Technology Stack:\n  ${project.techStack?.join(', ') || 'Modern web technologies'}\n\n• Architecture: ${project.difficulty} level implementation\n\n• Key Innovations:\n  - Efficient algorithms\n  - Scalable architecture\n  - User-centric design\n\n• Technical Highlights:\n  - Performance optimized\n  - Secure and reliable`
    },
    {
      slideNumber: 6,
      title: 'Traction & Progress',
      content: `• Current Status: ${project.status}\n\n• Health Score: ${project.healthScore}/100\n\n• Progress Milestones:\n  - ${project.progressTimeline?.length || 0} progress updates\n  - ${project.collaborators?.length || 0} team members\n  - ${project.mentor ? 'Mentor assigned' : 'Mentor support available'}\n\n• Achievements:\n  - Project development in progress\n  - Core features implemented`
    },
    {
      slideNumber: 7,
      title: 'Demo & Links',
      content: `• Live Demo: ${project.liveUrl || '🚀 Coming Soon'}\n\n• GitHub Repository: ${project.githubRepo || '🔒 Private Repository'}\n\n• Documentation: ${project.documentationUrl || '📚 In Progress'}\n\n• Demo Video: ${project.demoVideoUrl || '🎥 Available on Request'}\n\n• Try It Now: ${project.liveUrl ? 'Visit ' + project.liveUrl : 'Contact us for access'}`
    },
    {
      slideNumber: 8,
      title: 'Team',
      content: `• Project Owner: ${ownerName}\n\n• Team Members:\n  ${teamMembers}\n\n• Mentor: ${mentorName}\n\n• Expertise:\n  - ${project.domain} domain knowledge\n  - ${project.techStack?.slice(0, 2).join(' and ') || 'Technical'} expertise\n  - Collaborative development experience\n\n• Why This Team:\n  Passionate developers committed to innovation`
    },
    {
      slideNumber: 9,
      title: 'Roadmap & Next Steps',
      content: `• Short-term (1-3 months):\n  - Complete core features\n  - Enhance user experience\n  - Gather user feedback\n\n• Long-term Vision:\n  - Scale the solution\n  - Expand features\n  - Build user community\n\n• Planned Features:\n  - Advanced functionality\n  - Performance optimization\n  - Integration capabilities`
    },
    {
      slideNumber: 10,
      title: 'Call to Action',
      content: `• We're Looking For:\n  - Collaborators and contributors\n  - Feedback and suggestions\n  - Mentorship opportunities\n  - Investment opportunities\n\n• Get Involved:\n  - Visit our GitHub: ${project.githubRepo || 'Contact us'}\n  - Try the demo: ${project.liveUrl || 'Coming soon'}\n  - Reach out for collaboration\n\n• Contact:\n  ${ownerName}\n  ${project.owner?.email || 'Contact via platform'}\n\nThank you for your interest! 🚀`
    }
  ];

  return {
    success: true,
    projectId: project._id,
    projectTitle: project.title,
    generatedAt: new Date(),
    slides,
    summary: `${project.title} is a ${project.difficulty}-level ${project.domain} project that addresses key challenges in the industry. With a health score of ${project.healthScore}/100 and ${project.collaborators?.length || 0} team members, the project is making significant progress. The solution leverages ${project.techStack?.join(', ') || 'modern technology'} to deliver innovative results.`,
    format: 'Template Based'
  };
};

module.exports = { generatePitchDeck };

