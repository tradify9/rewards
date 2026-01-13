const nodemailer = require('nodemailer');
const { EMAIL_USER, EMAIL_PASS } = require('../config/env');

const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

// Send email function
const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: EMAIL_USER,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

// Specific email templates
const sendWelcomeEmail = async (user) => {
  const subject = 'Welcome to Reward System!';
  const html = `
    <h1>Welcome ${user.name}!</h1>
    <p>Thank you for joining our reward system. Start earning coins by logging in daily!</p>
    <p>Your current tier: ${user.tier}</p>
  `;
  return await sendEmail(user.email, subject, html);
};

const sendWithdrawalSuccessEmail = async (user, withdrawal) => {
  const subject = 'Withdrawal Successful';
  const html = `
    <h1>Withdrawal Processed Successfully!</h1>
    <p>Dear ${user.name},</p>
    <p>Your withdrawal of ${withdrawal.amount} coins has been processed successfully.</p>
    <p>The amount will be credited to your bank account within 1-2 business days.</p>
    <p>Transaction ID: ${withdrawal.transactionId}</p>
  `;
  return await sendEmail(user.email, subject, html);
};

const sendWithdrawalFailedEmail = async (user, withdrawal, reason) => {
  const subject = 'Withdrawal Failed';
  const html = `
    <h1>Withdrawal Failed</h1>
    <p>Dear ${user.name},</p>
    <p>Your withdrawal request of ${withdrawal.amount} coins could not be processed.</p>
    <p>Reason: ${reason}</p>
    <p>Please try again or contact support.</p>
  `;
  return await sendEmail(user.email, subject, html);
};

const sendResetEmail = async (user, resetToken) => {
  const subject = 'Password Reset Request';
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  const html = `
    <h1>Password Reset</h1>
    <p>Dear ${user.name},</p>
    <p>You requested a password reset for your RewardSystem account.</p>
    <p>Please click the link below to reset your password:</p>
    <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
    <p>This link will expire in 10 minutes.</p>
    <p>If you didn't request this, please ignore this email.</p>
  `;
  return await sendEmail(user.email, subject, html);
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendWithdrawalSuccessEmail,
  sendWithdrawalFailedEmail,
  sendResetEmail
};
