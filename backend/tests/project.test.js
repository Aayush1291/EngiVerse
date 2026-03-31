/**
 * Basic test cases for Project functionality
 * Run with: npm test or node backend/tests/project.test.js
 */

const mongoose = require('mongoose');
const Project = require('../models/Project');
const User = require('../models/User');

// Test configuration
const MONGODB_TEST_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/engiverse-test';

describe('Project Model Tests', () => {
  beforeAll(async () => {
    await mongoose.connect(MONGODB_TEST_URI);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Project.deleteMany({});
    await User.deleteMany({});
  });

  test('Should create a project with valid data', async () => {
    const user = new User({
      email: 'test@example.com',
      password: 'password123',
      role: 'Student',
      emailVerified: true
    });
    await user.save();

    const project = new Project({
      title: 'Test Project',
      description: 'This is a test project description that is long enough to pass validation',
      domain: 'Web Development',
      difficulty: 'Intermediate',
      owner: user._id,
      techStack: ['React', 'Node.js']
    });

    const savedProject = await project.save();
    expect(savedProject.title).toBe('Test Project');
    expect(savedProject.owner.toString()).toBe(user._id.toString());
  });

  test('Should validate required fields', async () => {
    const project = new Project({
      title: 'Test'
      // Missing required fields
    });

    await expect(project.save()).rejects.toThrow();
  });

  test('Should validate domain enum', async () => {
    const user = new User({
      email: 'test@example.com',
      password: 'password123',
      role: 'Student',
      emailVerified: true
    });
    await user.save();

    const project = new Project({
      title: 'Test Project',
      description: 'Test description',
      domain: 'Invalid Domain',
      difficulty: 'Intermediate',
      owner: user._id
    });

    await expect(project.save()).rejects.toThrow();
  });

  test('Should validate difficulty enum', async () => {
    const user = new User({
      email: 'test@example.com',
      password: 'password123',
      role: 'Student',
      emailVerified: true
    });
    await user.save();

    const project = new Project({
      title: 'Test Project',
      description: 'Test description',
      domain: 'Web Development',
      difficulty: 'Invalid',
      owner: user._id
    });

    await expect(project.save()).rejects.toThrow();
  });

  test('Should validate URL format for liveUrl', async () => {
    const user = new User({
      email: 'test@example.com',
      password: 'password123',
      role: 'Student',
      emailVerified: true
    });
    await user.save();

    const project = new Project({
      title: 'Test Project',
      description: 'Test description',
      domain: 'Web Development',
      difficulty: 'Intermediate',
      owner: user._id,
      liveUrl: 'invalid-url'
    });

    await expect(project.save()).rejects.toThrow();
  });
});

// Basic validation tests
if (require.main === module) {
  console.log('Project model tests completed');
}

module.exports = {};

