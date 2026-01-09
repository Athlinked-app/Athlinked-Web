const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Create nodemailer transporter
 * @returns {object} Nodemailer transporter
 */
function createTransporter() {
  const config = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  };

  return nodemailer.createTransport(config);
}

/**
 * Send OTP email to user
 * @param {string} to - Recipient email address
 * @param {string} otp - OTP code to send
 * @returns {Promise<object>} Email send result
 */
async function sendOTPEmail(to, otp) {
  try {
    const smtpPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
    const smtpUser = process.env.SMTP_USER;

    if (!smtpUser || !smtpPass) {
      const errorMsg =
        'SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS (or SMTP_PASSWORD) in .env';
      console.error('❌', errorMsg);
      throw new Error(errorMsg);
    }

    const transporter = createTransporter();

    await new Promise((resolve, reject) => {
      transporter.verify((error, success) => {
        if (error) {
          console.error('❌ SMTP verification failed:', error.message);
          reject(new Error(`SMTP verification failed: ${error.message}`));
        } else {
          resolve(success);
        }
      });
    });

    const mailOptions = {
      from: process.env.SMTP_FROM || smtpUser,
      to,
      subject: 'Your AthLinked Signup OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to AthLinked</h2>
          <p>Your One-Time Password (OTP) for signup is:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p>This OTP will expire in 5 minutes.</p>
          <p>If you didn't request this OTP, please ignore this email.</p>
        </div>
      `,
      text: `Your AthLinked Signup OTP is: ${otp}. This OTP will expire in 5 minutes.`,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send OTP email:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
    });

    if (error.code === 'EAUTH') {
      throw new Error(
        'SMTP authentication failed. Please check your email credentials and ensure you are using an App Password for Gmail.'
      );
    } else if (error.code === 'ECONNECTION') {
      throw new Error(
        'Failed to connect to SMTP server. Please check your SMTP settings and network connection.'
      );
    } else if (error.code === 'ETIMEDOUT') {
      throw new Error(
        'SMTP connection timed out. Please check your network connection.'
      );
    }

    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Send parent signup link email
 * @param {string} to - Parent email address
 * @param {string} username - Child username
 * @param {string} signupLink - Link to parent signup page
 * @returns {Promise<object>} Email send result
 */
async function sendParentSignupLink(to, username, signupLink) {
  try {
    const smtpPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
    const smtpUser = process.env.SMTP_USER;

    if (!smtpUser || !smtpPass) {
      const errorMsg =
        'SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS (or SMTP_PASSWORD) in .env';
      console.error('❌', errorMsg);
      throw new Error(errorMsg);
    }

    const transporter = createTransporter();

    await new Promise((resolve, reject) => {
      transporter.verify((error, success) => {
        if (error) {
          console.error('❌ SMTP verification failed:', error.message);
          reject(new Error(`SMTP verification failed: ${error.message}`));
        } else {
          resolve(success);
        }
      });
    });

    const mailOptions = {
      from: process.env.SMTP_FROM || smtpUser,
      to,
      subject: 'Parent Account Signup - AthLinked',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <p>Please click the link below to create your parent account:</p>
          <p style="word-break: break-all;"><a href="${signupLink}">${signupLink}</a></p>
        </div>
      `,
      text: `Please click the link below to create your parent account: ${signupLink}`,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send parent signup link email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Send password reset link email
 * @param {string} to - Recipient email address
 * @param {string} resetLink - Password reset link with token
 * @returns {Promise<object>} Email send result
 */
async function sendPasswordResetLink(to, resetLink) {
  try {
    const smtpPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
    const smtpUser = process.env.SMTP_USER;

    if (!smtpUser || !smtpPass) {
      const errorMsg =
        'SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS (or SMTP_PASSWORD) in .env';
      console.error('❌', errorMsg);
      throw new Error(errorMsg);
    }

    const transporter = createTransporter();

    await new Promise((resolve, reject) => {
      transporter.verify((error, success) => {
        if (error) {
          console.error('❌ SMTP verification failed:', error.message);
          reject(new Error(`SMTP verification failed: ${error.message}`));
        } else {
          resolve(success);
        }
      });
    });

    const mailOptions = {
      from: process.env.SMTP_FROM || smtpUser,
      to,
      subject: 'Password Reset - AthLinked',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You requested to reset your password for your AthLinked account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #CB9729; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666; font-size: 12px;">${resetLink}</p>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">This link will expire in 1 hour.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request this password reset, please ignore this email.</p>
        </div>
      `,
      text: `You requested to reset your password. Click this link to reset it: ${resetLink}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this password reset, please ignore this email.`,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send password reset link email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

module.exports = {
  sendOTPEmail,
  sendParentSignupLink,
  sendPasswordResetLink,
};
