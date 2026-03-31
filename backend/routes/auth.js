const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateToken, generateRefreshToken } = require('../utils/generateToken');
const { auth } = require('../middleware/auth');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailService');
const crypto = require('crypto');

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Please provide email, password, and role' });
    }

    // Admin signup is not allowed - only existing admins can create admins
    if (role === 'Admin') {
      return res.status(403).json({ message: 'Admin signup is not allowed. Please contact an existing admin.' });
    }

    if (!['Student', 'Mentor', 'Investor'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Student email verification - must be a college/student email
    if (role === 'Student') {
      const studentEmailPatterns = [
        /\.edu$/i,                    // .edu domains
        /@.*\.ac\./i,                  // .ac domains (academic)
        /@.*university/i,              // university in domain
        /@.*college/i,                 // college in domain
        /@.*school/i,                  // school in domain
        /@.*student/i,                 // student in domain
        /@.*\.edu\.[a-z]{2,}$/i       // .edu.xx domains
      ];

      const isStudentEmail = studentEmailPatterns.some(pattern => pattern.test(email));
      
      if (!isStudentEmail) {
        return res.status(400).json({ 
          message: 'Students must use a valid college/university email address (e.g., .edu, .ac, or university/college domain). Please use your student email for verification.' 
        });
      }
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    const user = new User({ 
      email, 
      password, 
      role,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    });
    await user.save();

    // Send verification email
    try {
      await sendVerificationEmail(email, email.split('@')[0], verificationToken);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Continue even if email fails (for development)
    }

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.status(201).json({
      message: 'User created successfully. Please check your email to verify your account.',
      token,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        profileCompleted: user.profile.completed
      },
      verificationToken: process.env.NODE_ENV === 'development' ? verificationToken : undefined
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check email verification (required for Students, optional for others)
    if (user.role === 'Student' && !user.emailVerified) {
      return res.status(403).json({ 
        message: 'Please verify your email before logging in. Check your inbox for the verification link.',
        requiresVerification: true,
        email: user.email
      });
    }

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        profileCompleted: user.profile.completed
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const profileCompletion = user.calculateProfileCompletion();
    
    res.json({
      user: {
        ...user.toObject(),
        profileCompletion
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Please provide email' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists for security
      return res.json({ message: 'If email exists, password reset link will be sent' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, user.profile?.name || user.email.split('@')[0], resetToken);
      res.json({
        message: 'Password reset link sent to your email',
        resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      res.json({
        message: 'Password reset link sent to your email',
        resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Please provide token and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify Email
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: 'Verification token required' });
    }

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Resend Verification Email
router.post('/resend-verification', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    // Send verification email
    try {
      await sendVerificationEmail(user.email, user.profile?.name || user.email.split('@')[0], verificationToken);
      res.json({ 
        message: 'Verification email sent',
        verificationToken: process.env.NODE_ENV === 'development' ? verificationToken : undefined
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      res.json({ 
        message: 'Verification email sent',
        verificationToken: process.env.NODE_ENV === 'development' ? verificationToken : undefined
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Refresh Token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token required' });
    }

    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-token-key-change-this-in-production';
    
    const decoded = jwt.verify(refreshToken, secret);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    res.json({
      token: newToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});

module.exports = router;

