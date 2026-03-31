// Use Gemini AI for health analysis
const { analyzeProjectHealthWithAI } = require('./geminiService');

const analyzeProjectHealth = async (project) => {
  return await analyzeProjectHealthWithAI(project);
};

module.exports = { analyzeProjectHealth };

