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
 * Get mobile email template for password reset
 * @param {string} resetLink - Password reset deep link (already formatted)
 * @returns {string} HTML email template
 */
function getMobileEmailTemplate(resetLink) {
  // Extract token from resetLink for custom scheme fallback
  let token = '';
  try {
    const url = new URL(resetLink);
    token = url.searchParams.get('token') || '';
  } catch (e) {
    const match = resetLink.match(/[?&]token=([^&]+)/);
    token = match ? match[1] : '';
  }
  
  // Generate custom scheme deep link as fallback
  const deepLinkScheme = process.env.DEEP_LINK_SCHEME || 'athlinked';
  const customSchemeLink = token ? `${deepLinkScheme}://forgot-password?token=${encodeURIComponent(token)}` : '';
  
  // resetLink should be a universal link (https://) for email compatibility
  // Universal links work in Gmail and the web page will redirect to app on mobile
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
        <h2 style="color: #CB9729;">Reset Your Password</h2>
        <p>You requested to reset your password for your AthLinked account.</p>
        <p>Click the button below to reset it. This will open the AthLinked app if you have it installed:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background-color: #CB9729; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; cursor: pointer;">
            Reset Password
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666;">
          Or copy and paste this link in your browser:<br>
          <a href="${resetLink}" style="color: #CB9729; word-break: break-all; text-decoration: underline;">${resetLink}</a>
        </p>
        
        ${customSchemeLink ? `
        <p style="font-size: 12px; color: #666; margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
          <strong>Alternative:</strong> If the link above doesn't open the app, copy this deep link and paste it in your mobile browser:<br>
          <span style="font-family: monospace; font-size: 11px; color: #333; word-break: break-all; display: block; margin-top: 5px; padding: 8px; background: white; border-radius: 3px;">${customSchemeLink}</span>
        </p>
        ` : ''}
        
        <p style="font-size: 12px; color: #999; margin-top: 30px;">
          This link will expire in 1 hour. If you didn't request this, please ignore this email.
        </p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Get web email template for password reset
 * @param {string} resetLink - Password reset link
 * @returns {string} HTML email template
 */
function getWebEmailTemplate(resetLink) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
        <h2 style="color: #CB9729;">Reset Your Password</h2>
        <p>You requested to reset your password for your AthLinked account.</p>
        <p>Click the button below to reset it:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background-color: #CB9729; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; cursor: pointer;">
            Reset Password
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666;">
          Or copy and paste this link in your browser:<br>
          <a href="${resetLink}" style="color: #CB9729; word-break: break-all; text-decoration: underline;">${resetLink}</a>
        </p>
        
        <p style="font-size: 12px; color: #999; margin-top: 30px;">
          This link will expire in 1 hour. If you didn't request this, please ignore this email.
        </p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send password reset link email
 * @param {string} to - Recipient email address
 * @param {string} resetLink - Password reset link with token
 * @param {boolean} isMobile - Whether request is from mobile app
 * @returns {Promise<object>} Email send result
 */
async function sendPasswordResetLink(to, resetLink, isMobile = false) {
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

    // Choose appropriate template
    // For mobile, resetLink is already the deep link, so use it directly
    // For web, resetLink is the web URL, use it directly
    const htmlTemplate = isMobile
      ? getMobileEmailTemplate(resetLink)
      : getWebEmailTemplate(resetLink);

    const mailOptions = {
      from: process.env.SMTP_FROM || smtpUser,
      to,
      subject: 'Password Reset - AthLinked',
      html: htmlTemplate,
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
