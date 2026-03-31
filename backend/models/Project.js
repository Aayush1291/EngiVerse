const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  domain: {
    type: String,
    required: true,
    enum: ['Web Development', 'Mobile App', 'AI/ML', 'IoT', 'Blockchain', 'Cybersecurity', 'Data Science', 'Other']
  },
  techStack: [{
    type: String,
    trim: true
  }],
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    required: true
  },
  status: {
    type: String,
    enum: ['Open', 'Adopted', 'Completed'],
    default: 'Open'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      default: 'Contributor'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  progressTimeline: [{
    update: String,
    date: {
      type: Date,
      default: Date.now
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  healthScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  healthAnalysis: {
    lastAnalyzed: Date,
    missingModules: [String],
    suggestedSteps: [String]
  },
  // New project links
  liveUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        try {
          new URL(v);
          return true;
        } catch {
          return false;
        }
      },
      message: 'Invalid URL format'
    }
  },
  githubRepo: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        try {
          new URL(v);
          return true;
        } catch {
          return false;
        }
      },
      message: 'Invalid URL format'
    }
  },
  documentationUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        try {
          new URL(v);
          return true;
        } catch {
          return false;
        }
      },
      message: 'Invalid URL format'
    }
  },
  demoVideoUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        // Allow YouTube, Vimeo, or direct video URLs
        const urlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|vimeo\.com|.*\.(mp4|webm|ogg))(\/.*)?$/i;
        return !v || urlPattern.test(v);
      },
      message: 'Invalid video URL format'
    }
  },
  // Plagiarism check
  plagiarismCheck: {
    checked: {
      type: Boolean,
      default: false
    },
    checkedAt: Date,
    similarityScore: {
      type: Number,
      min: 0,
      max: 100
    },
    isPlagiarized: {
      type: Boolean,
      default: false
    },
    similarProjects: [{
      projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
      },
      similarity: Number
    }],
    flags: [{
      type: String
    }]
  },
  // Project verification (AI-only)
  verification: {
    verified: {
      type: Boolean,
      default: false
    },
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null // AI verification, no user
    },
    notes: String,
    checks: {
      plagiarismChecked: Boolean,
      plagiarismScore: Number,
      hasLiveUrl: Boolean,
      hasGithubRepo: Boolean,
      hasDocumentation: Boolean,
      hasDemoVideo: Boolean,
      healthScore: Number,
      ownerVerified: Boolean
    },
    aiAnalysis: {
      confidence: Number,
      reason: String,
      issues: [String],
      strengths: [String]
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

projectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Project', projectSchema);

