const nodemailer = require('nodemailer');
const { EMAIL_USER, EMAIL_PASS } = require('../config/env');

const transporter = nodemailer.createTransport({
  host: 'mail.atvanev.in', // Hostinger SMTP host
  port: 587, // TLS port
  secure: false, // true for 465, false for other ports
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false // For self-signed certificates
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

const sendUserCredentialsEmail = async (user, password) => {
  const subject = 'Your Account Credentials - Reward System';
  const html = `
    <h1>Welcome to Reward System!</h1>
    <p>Dear ${user.name},</p>
    <p>Your account has been created successfully. Here are your login credentials:</p>
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>Password:</strong> ${password}</p>
      <p><strong>User ID:</strong> ${user.uniqueId}</p>
    </div>
    <p>Please login and change your password immediately for security.</p>
    <p>You can login at: ${process.env.FRONTEND_URL}/login</p>
    <p>If you have any questions, please contact support.</p>
  `;
  return await sendEmail(user.email, subject, html);
};

const sendCoinCertificateEmail = async (user) => {
  const subject = 'Your Coin Certificate - Atvan Reward System';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #4CAF50; border-radius: 10px; overflow: hidden;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">ATVAN</h1>
        <p style="margin: 5px 0 0 0; font-size: 16px;">Reward System Certificate</p>
      </div>

      <!-- Certificate Body -->
      <div style="padding: 40px 30px; background: #f9f9f9;">
        <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">

          <h2 style="color: #333; text-align: center; margin-bottom: 30px; font-size: 24px;">Coin Balance Certificate</h2>

          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; background: #4CAF50; color: white; padding: 15px 30px; border-radius: 50px; font-size: 18px; font-weight: bold;">
              🏆 ${user.tier} Member
            </div>
          </div>

          <p style="font-size: 16px; line-height: 1.6; color: #555; text-align: center; margin-bottom: 20px;">
            This is to certify that
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <h3 style="color: #4CAF50; font-size: 28px; margin: 0; text-transform: uppercase;">${user.name}</h3>
            <p style="color: #666; font-size: 14px; margin: 5px 0;">User ID: ${user.uniqueId}</p>
          </div>

          <div style="background: #f0f8f0; padding: 25px; border-radius: 8px; margin: 30px 0; text-align: center;">
            <div style="font-size: 48px; color: #4CAF50; margin-bottom: 10px;">💰</div>
            <div style="font-size: 36px; font-weight: bold; color: #333;">${user.totalCoins}</div>
            <div style="font-size: 18px; color: #666;">Total Coins Earned</div>
          </div>

          <div style="margin: 30px 0; padding: 20px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
            <h4 style="margin: 0 0 10px 0; color: #856404;">Achievement Details:</h4>
            <ul style="margin: 0; padding-left: 20px; color: #856404;">
              <li>Login Count: ${user.loginCount || 0}</li>
              <li>Service Status: ${user.serviceActivated ? 'Active' : 'Inactive'}</li>
              <li>Payment Status: ${user.paymentStatus}</li>
              <li>Member Since: ${new Date(user.createdAt).toLocaleDateString('en-IN')}</li>
            </ul>
          </div>

          <p style="font-size: 14px; color: #666; text-align: center; margin-top: 30px; line-height: 1.5;">
            This certificate is issued by Atvan Reward System and represents your achievements and coin balance as of ${new Date().toLocaleDateString('en-IN')}.
          </p>

        </div>
      </div>

      <!-- Footer -->
      <div style="background: #333; color: white; padding: 20px; text-align: center;">
        <p style="margin: 0; font-size: 14px;">
          Atvan Reward System | Keep earning more coins!
        </p>
        <p style="margin: 5px 0 0 0; font-size: 12px;">
          For support, contact us at support@atvan.com
        </p>
      </div>
    </div>
  `;
  return await sendEmail(user.email, subject, html);
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendWithdrawalSuccessEmail,
  sendWithdrawalFailedEmail,
  sendResetEmail,
  sendUserCredentialsEmail,
  sendCoinCertificateEmail
};
