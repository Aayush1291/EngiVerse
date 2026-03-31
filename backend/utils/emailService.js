const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  // For development, use Ethereal Email (fake SMTP)
  // For production, configure with real SMTP credentials
  if (process.env.NODE_ENV === 'production' && process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_PORT == 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Development: Use Ethereal Email or console logging
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: process.env.ETHEREAL_USER || 'ethereal.user@ethereal.email',
      pass: process.env.ETHEREAL_PASS || 'ethereal.pass'
    }
  });
};

const transporter = createTransporter();

// Email verification template
const getVerificationEmailTemplate = (name, verificationLink) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - ENGIVERSE</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">ENGIVERSE</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Engineering Project Collaboration Platform</p>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Verify Your Email Address</h2>
        <p>Hi ${name || 'there'},</p>
        <p>Welcome to ENGIVERSE! Please verify your email address to complete your registration and start collaborating on amazing projects.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Verify Email Address</a>
        </div>
        <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
        <p style="color: #667eea; word-break: break-all; font-size: 12px;">${verificationLink}</p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">This link will expire in 24 hours.</p>
        <p style="color: #666; font-size: 14px;">If you didn't create an account with ENGIVERSE, please ignore this email.</p>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>&copy; 2024 ENGIVERSE. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
};

// Password reset template
const getPasswordResetTemplate = (name, resetLink) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password - ENGIVERSE</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">ENGIVERSE</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Password Reset Request</p>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
        <p>Hi ${name || 'there'},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
        </div>
        <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
        <p style="color: #667eea; word-break: break-all; font-size: 12px;">${resetLink}</p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">This link will expire in 1 hour.</p>
        <p style="color: #666; font-size: 14px;">If you didn't request a password reset, please ignore this email.</p>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>&copy; 2024 ENGIVERSE. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
};

// Send verification email
const sendVerificationEmail = async (email, name, verificationToken) => {
  try {
    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@engiverse.com',
      to: email,
      subject: 'Verify Your Email - ENGIVERSE',
      html: getVerificationEmailTemplate(name, verificationLink)
    };

    // In development, log the email instead of sending
    if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
      console.log('\n📧 Email Verification Link:');
      console.log(verificationLink);
      console.log('\n');
      return { success: true, preview: verificationLink };
    }

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending verification email:', error);
    // In development, still return success with link
    if (process.env.NODE_ENV === 'development') {
      const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
      console.log('\n📧 Email Verification Link (fallback):');
      console.log(verificationLink);
      console.log('\n');
      return { success: true, preview: verificationLink };
    }
    throw error;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, name, resetToken) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@engiverse.com',
      to: email,
      subject: 'Reset Your Password - ENGIVERSE',
      html: getPasswordResetTemplate(name, resetLink)
    };

    // In development, log the email instead of sending
    if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
      console.log('\n📧 Password Reset Link:');
      console.log(resetLink);
      console.log('\n');
      return { success: true, preview: resetLink };
    }

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    // In development, still return success with link
    if (process.env.NODE_ENV === 'development') {
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
      console.log('\n📧 Password Reset Link (fallback):');
      console.log(resetLink);
      console.log('\n');
      return { success: true, preview: resetLink };
    }
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail
};

