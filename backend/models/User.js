const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['Student', 'Mentor', 'Investor', 'Admin'],
    required: true
  },
  profile: {
    name: String,
    bio: String,
    college: String,
    company: String,
    skills: [String],
    avatar: String,
    linkedin: String,
    github: String,
    website: String,
    completed: {
      type: Boolean,
      default: false
    },
    verified: {
      type: Boolean,
      default: false
    },
    verifiedAt: Date,
    verificationNotes: String,
    aiVerification: {
      confidence: Number,
      reason: String,
      issues: [String],
      strengths: [String],
      verifiedAt: Date
    },
    badges: [{
      badgeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Badge'
      },
      earnedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.calculateProfileCompletion = function() {
  const fields = ['name', 'bio', 'skills'];
  const roleFields = this.role === 'Student' ? ['college'] : ['company'];
  const allFields = [...fields, ...roleFields];
  
  const completed = allFields.filter(field => {
    if (field === 'skills') {
      return this.profile.skills && this.profile.skills.length > 0;
    }
    return this.profile[field] && this.profile[field].trim() !== '';
  }).length;
  
  return Math.round((completed / allFields.length) * 100);
};

module.exports = mongoose.model('User', userSchema);

