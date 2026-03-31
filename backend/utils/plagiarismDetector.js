const { GoogleGenerativeAI } = require('@google/generative-ai');
const Project = require('../models/Project');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Check for plagiarism in project description
 * Compares against existing projects in the database
 * Also detects suspicious patterns like URLs in descriptions
 */
const checkPlagiarism = async (projectId, title, description) => {
  try {
    // First, check for suspicious patterns (URLs in description, etc.)
    const suspiciousPatterns = detectSuspiciousPatterns(title, description);
    if (suspiciousPatterns.isSuspicious) {
      return {
        isPlagiarized: true,
        similarityScore: suspiciousPatterns.score,
        similarProjects: [],
        message: suspiciousPatterns.message,
        flags: suspiciousPatterns.flags
      };
    }

    // Get all existing projects except the current one
    const existingProjects = await Project.find({
      _id: { $ne: projectId }
    }).select('title description');

    if (existingProjects.length === 0) {
      return {
        isPlagiarized: false,
        similarityScore: 0,
        similarProjects: [],
        message: 'No existing projects to compare against'
      };
    }

    // If Gemini API is available, use AI for better detection
    if (process.env.GEMINI_API_KEY) {
      return await checkPlagiarismWithAI(title, description, existingProjects);
    }

    // Fallback to basic text similarity
    return checkPlagiarismBasic(title, description, existingProjects);
  } catch (error) {
    console.error('Plagiarism check error:', error);
    return {
      isPlagiarized: false,
      similarityScore: 0,
      similarProjects: [],
      message: 'Error checking plagiarism'
    };
  }
};

/**
 * Detect suspicious patterns that indicate plagiarism
 * - URLs in description (like google.com, facebook.com, etc.)
 * - Very short descriptions
 * - Generic/common phrases
 */
const detectSuspiciousPatterns = (title, description) => {
  const flags = [];
  let suspiciousScore = 0;
  let message = '';

  // Check for URLs in description (suspicious - likely copied from web)
  const urlPattern = /(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?/gi;
  const urlsInDescription = description.match(urlPattern);
  
  if (urlsInDescription && urlsInDescription.length > 0) {
    // Check if URLs are common websites (not project-specific URLs)
    const commonDomains = [
      'google.com', 'facebook.com', 'youtube.com', 'twitter.com', 'instagram.com',
      'linkedin.com', 'github.com', 'stackoverflow.com', 'wikipedia.org',
      'amazon.com', 'microsoft.com', 'apple.com', 'netflix.com', 'reddit.com'
    ];
    
    const foundCommonDomains = urlsInDescription.filter(url => {
      const domain = url.toLowerCase().replace(/https?:\/\/(www\.)?/i, '').split('/')[0];
      return commonDomains.some(common => domain.includes(common));
    });

    if (foundCommonDomains.length > 0) {
      flags.push(`Found common website URLs in description: ${foundCommonDomains.join(', ')}`);
      suspiciousScore += 60; // High suspicion
      message = 'Suspicious content detected: Common website URLs found in project description. This may indicate copied content.';
    } else {
      // Even if not common domains, URLs in description are suspicious
      flags.push(`Found ${urlsInDescription.length} URL(s) in description`);
      suspiciousScore += 30;
      if (!message) {
        message = 'URLs detected in project description. Please ensure content is original.';
      }
    }
  }

  // Check for very short descriptions (likely incomplete or copied)
  if (description.trim().length < 100) {
    flags.push('Description is too short (less than 100 characters)');
    suspiciousScore += 20;
    if (!message) {
      message = 'Description is too short. Please provide more details about your project.';
    }
  }

  // Check for generic/common phrases that indicate copied content
  const genericPhrases = [
    'this is a test',
    'lorem ipsum',
    'sample text',
    'placeholder',
    'coming soon',
    'under construction',
    'check out',
    'visit our website',
    'click here',
    'for more information'
  ];
  
  const lowerDescription = description.toLowerCase();
  const foundGenericPhrases = genericPhrases.filter(phrase => 
    lowerDescription.includes(phrase)
  );

  if (foundGenericPhrases.length > 0) {
    flags.push(`Found generic phrases: ${foundGenericPhrases.join(', ')}`);
    suspiciousScore += 15;
    if (!message) {
      message = 'Generic phrases detected. Please provide original project description.';
    }
  }

  // Check for excessive repetition (likely copied/spam)
  const words = description.toLowerCase().split(/\s+/);
  const wordCounts = {};
  words.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });
  
  const repeatedWords = Object.entries(wordCounts)
    .filter(([word, count]) => count > 5 && word.length > 3)
    .map(([word]) => word);

  if (repeatedWords.length > 0) {
    flags.push(`Excessive word repetition detected`);
    suspiciousScore += 10;
  }

  // If suspicious score is high enough, mark as plagiarized
  const isSuspicious = suspiciousScore >= 50;

  return {
    isSuspicious,
    score: Math.min(suspiciousScore, 100),
    message: message || (isSuspicious ? 'Suspicious patterns detected in project content' : ''),
    flags
  };
};

/**
 * AI-powered plagiarism detection using Gemini
 */
const checkPlagiarismWithAI = async (title, description, existingProjects) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Check for URLs in description first
    const urlPattern = /(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?/gi;
    const hasUrls = urlPattern.test(description);
    
    // Prepare project data for comparison (limit to first 20 for performance)
    const projectsToCompare = existingProjects.slice(0, 20);
    const projectsData = projectsToCompare.map((p, idx) => ({
      id: idx,
      title: p.title,
      description: p.description?.substring(0, 500) || '' // Limit description length
    }));

    const prompt = `Analyze if this new project description is plagiarized, copied, or too similar to existing projects.

IMPORTANT: Pay special attention to:
1. URLs in the description (like google.com, facebook.com) - these are RED FLAGS for plagiarism
2. Common website names mentioned in description
3. Generic or placeholder text
4. Similarity to existing projects

New Project:
Title: ${title}
Description: ${description.substring(0, 1000)}
${hasUrls ? '⚠️ WARNING: This description contains URLs which is suspicious!' : ''}

Existing Projects (${projectsData.length} projects):
${JSON.stringify(projectsData, null, 2)}

Please analyze and provide a JSON response with:
1. isPlagiarized: boolean - true if similarity is above 60% OR if URLs/common websites are detected
2. similarityScore: number (0-100) - percentage similarity (increase if URLs detected)
3. similarProjects: array of project IDs that are similar (if any)
4. message: string explaining the result (mention if URLs were detected)
5. flags: array of specific issues found (e.g., "URLs detected", "Similar to project X")

CRITICAL: If the description contains URLs like "google.com", "facebook.com", or mentions common websites, mark isPlagiarized as TRUE and set similarityScore to at least 70.

Format your response as valid JSON only, no markdown or extra text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON from response
    let analysis;
    try {
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : text;
      analysis = JSON.parse(jsonText.trim());
    } catch (parseError) {
      console.error('Failed to parse Gemini plagiarism response:', parseError);
      return checkPlagiarismBasic(title, description, existingProjects);
    }

    // Map back to actual project IDs
    const similarProjects = (analysis.similarProjects || []).map(idx => {
      if (existingProjects[idx]) {
        return {
          id: existingProjects[idx]._id,
          title: existingProjects[idx].title,
          similarity: analysis.similarityScore
        };
      }
      return null;
    }).filter(Boolean);

    // Check if URLs were detected in the analysis
    const hasUrlFlags = analysis.flags?.some(flag => 
      flag.toLowerCase().includes('url') || flag.toLowerCase().includes('website')
    ) || false;

    const finalIsPlagiarized = analysis.isPlagiarized || 
                               analysis.similarityScore > 60 || 
                               hasUrlFlags;

    return {
      isPlagiarized: finalIsPlagiarized,
      similarityScore: Math.min(Math.max(parseInt(analysis.similarityScore) || 0, 0), 100),
      similarProjects,
      message: analysis.message || 'Plagiarism check completed',
      flags: analysis.flags || []
    };
  } catch (error) {
    console.error('AI plagiarism check error:', error);
    return checkPlagiarismBasic(title, description, existingProjects);
  }
};

/**
 * Basic text similarity check (fallback)
 * Also checks for URLs and suspicious patterns
 */
const checkPlagiarismBasic = (title, description, existingProjects) => {
  const similarProjects = [];
  let maxSimilarity = 0;
  const flags = [];

  // Check for URLs in description
  const urlPattern = /(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?/gi;
  const urlsInDescription = description.match(urlPattern);
  
  if (urlsInDescription && urlsInDescription.length > 0) {
    const commonDomains = [
      'google.com', 'facebook.com', 'youtube.com', 'twitter.com', 'instagram.com',
      'linkedin.com', 'github.com', 'stackoverflow.com', 'wikipedia.org'
    ];
    
    const foundCommonDomains = urlsInDescription.filter(url => {
      const domain = url.toLowerCase().replace(/https?:\/\/(www\.)?/i, '').split('/')[0];
      return commonDomains.some(common => domain.includes(common));
    });

    if (foundCommonDomains.length > 0) {
      flags.push(`Common website URLs detected: ${foundCommonDomains.join(', ')}`);
      maxSimilarity = Math.max(maxSimilarity, 75); // High similarity if common URLs found
    } else {
      flags.push(`URLs detected in description: ${urlsInDescription.length} URL(s)`);
      maxSimilarity = Math.max(maxSimilarity, 50); // Moderate similarity
    }
  }

  const normalizeText = (text) => {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const calculateSimilarity = (text1, text2) => {
    const words1 = normalizeText(text1).split(' ');
    const words2 = normalizeText(text2).split(' ');
    
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return (intersection.size / union.size) * 100;
  };

  const normalizedTitle = normalizeText(title);
  const normalizedDesc = normalizeText(description);

  existingProjects.forEach(project => {
    const titleSimilarity = calculateSimilarity(normalizedTitle, normalizeText(project.title || ''));
    const descSimilarity = calculateSimilarity(normalizedDesc, normalizeText(project.description || ''));
    
    // Weighted average: 40% title, 60% description
    const overallSimilarity = (titleSimilarity * 0.4) + (descSimilarity * 0.6);
    
    if (overallSimilarity > 50) {
      similarProjects.push({
        id: project._id,
        title: project.title,
        similarity: Math.round(overallSimilarity)
      });
    }
    
    maxSimilarity = Math.max(maxSimilarity, overallSimilarity);
  });

  const isPlagiarized = maxSimilarity > 60 || flags.length > 0;

  return {
    isPlagiarized,
    similarityScore: Math.round(maxSimilarity),
    similarProjects: similarProjects.sort((a, b) => b.similarity - a.similarity).slice(0, 5),
    message: isPlagiarized
      ? (flags.length > 0 ? flags.join('. ') : 'High similarity detected with existing projects')
      : 'No significant plagiarism detected',
    flags
  };
};

module.exports = { checkPlagiarism };

