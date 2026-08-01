const nodemailer = require('nodemailer');

let transporter = null;

const initTransporter = () => {
  if (process.env.NODE_ENV === 'production') {
    if (process.env.RESEND_API_KEY) {
      transporter = nodemailer.createTransport({
        host: 'smtp.resend.io',
        port: 587,
        secure: false,
        auth: {
          user: 'api_key',
          pass: process.env.RESEND_API_KEY
        }
      });
    } else if (process.env.SENDGRID_API_KEY) {
      transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY
        }
      });
    } else if (process.env.SMTP_HOST) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      });
    }
  } else {
    transporter = nodemailer.createTransport({
      host: 'localhost',
      port: 1025,
      secure: false
    });
  }
};

initTransporter();

const emailTemplates = {
  welcome: (user) => ({
    to: user.email,
    subject: 'Welcome to TrelloClone! 🎉',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #026AA7;">Welcome to TrelloClone!</h2>
        <p>Hi ${user.name},</p>
        <p>Thanks for joining TrelloClone. Your account is now active and ready to use.</p>
        <p><a href="${process.env.CLIENT_URL}/dashboard" style="background: #026AA7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Go to Dashboard</a></p>
        <p>Get started by creating your first board and organizing your work.</p>
        <p>Best regards,<br>The TrelloClone Team</p>
      </div>
    `
  }),

  loginAlert: (user, ip, location) => ({
    to: user.email,
    subject: 'Login Alert',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #026AA7;">Login Alert</h2>
        <p>Hi ${user.name},</p>
        <p>We noticed a login to your TrelloClone account:</p>
        <ul>
          <li><strong>IP Address:</strong> ${ip}</li>
          <li><strong>Location:</strong> ${location || 'Unknown'}</li>
          <li><strong>Date:</strong> ${new Date().toLocaleString()}</li>
        </ul>
        <p>If this wasn't you, please <a href="${process.env.CLIENT_URL}/settings">review your account activity</a> and secure your account immediately.</p>
        <p>Best regards,<br>The TrelloClone Team</p>
      </div>
    `
  }),

  passwordReset: (user, token) => ({
    to: user.email,
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #026AA7;">Password Reset Request</h2>
        <p>Hi ${user.name},</p>
        <p>You requested a password reset for your TrelloClone account.</p>
        <p><a href="${process.env.CLIENT_URL}/reset-password?token=${token}" style="background: #026AA7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a></p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
        <p>Best regards,<br>The TrelloClone Team</p>
      </div>
    `
  }),

  boardInvite: (inviter, invitee, boardName) => ({
    to: invitee.email,
    subject: `${inviter.name} invited you to "${boardName}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #026AA7;">Board Invitation</h2>
        <p>Hi ${invitee.name},</p>
        <p><strong>${inviter.name}</strong> has invited you to join the board <strong>"${boardName}"</strong>.</p>
        <p><a href="${process.env.CLIENT_URL}/board/invite" style="background: #026AA7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Invitation</a></p>
        <p>Best regards,<br>The TrelloClone Team</p>
      </div>
    `
  }),

  taskAssigned: (assignee, taskName, boardName) => ({
    to: assignee.email,
    subject: `Task Assigned: ${taskName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #026AA7;">Task Assigned to You</h2>
        <p>Hi ${assignee.name},</p>
        <p>You've been assigned to task <strong>"${taskName}"</strong> on board <strong>"${boardName}"</strong>.</p>
        <p><a href="${process.env.CLIENT_URL}/board" style="background: #026AA7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Board</a></p>
        <p>Best regards,<br>The TrelloClone Team</p>
      </div>
    `
  }),

  commentMention: (user, commenter, taskName) => ({
    to: user.email,
    subject: `${commenter.name} mentioned you in a comment`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #026AA7;">You've been mentioned</h2>
        <p>Hi ${user.name},</p>
        <p><strong>${commenter.name}</strong> mentioned you in a comment on task <strong>"${taskName}"</strong>.</p>
        <p><a href="${process.env.CLIENT_URL}/board" style="background: #026AA7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Task</a></p>
        <p>Best regards,<br>The TrelloClone Team</p>
      </div>
    `
  }),

  dueDateReminder: (user, taskName, dueDate) => ({
    to: user.email,
    subject: `Due Date Reminder: ${taskName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #026AA7;">Due Date Reminder</h2>
        <p>Hi ${user.name},</p>
        <p>Your task <strong>"${taskName}"</strong> is due on <strong>${new Date(dueDate).toLocaleDateString()}</strong>.</p>
        <p><a href="${process.env.CLIENT_URL}/board" style="background: #026AA7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Task</a></p>
        <p>Best regards,<br>The TrelloClone Team</p>
      </div>
    `
  }),

  securityAlert: (user, alertType) => ({
    to: user.email,
    subject: `Security Alert: ${alertType}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Security Alert</h2>
        <p>Hi ${user.name},</p>
        <p>A security alert has been triggered on your TrelloClone account:</p>
        <ul>
          <li><strong>Alert Type:</strong> ${alertType}</li>
          <li><strong>Date:</strong> ${new Date().toLocaleString()}</li>
        </ul>
        <p>If this wasn't you, please secure your account immediately by changing your password.</p>
        <p>Best regards,<br>The TrelloClone Team</p>
      </div>
    `
  }),

  accountDeleted: (user) => ({
    to: user.email,
    subject: 'Account Deletion Confirmation',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Account Deleted</h2>
        <p>Hi ${user.name},</p>
        <p>Your TrelloClone account has been successfully deleted.</p>
        <p>All your data including boards, lists, cards, and comments have been permanently removed.</p>
        <p>If this was a mistake, you'll need to create a new account.</p>
        <p>Best regards,<br>The TrelloClone Team</p>
      </div>
    `
  }),

  adminNotification: (subject, message, data) => ({
    to: process.env.ADMIN_EMAIL,
    subject: `[TrelloClone Admin] ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #026AA7;">${subject}</h2>
        <p>${message}</p>
        ${data.details ? `<pre style="background: #f4f5f7; padding: 10px; border-radius: 5px;">${JSON.stringify(data.details, null, 2)}</pre>` : ''}
        <p>Best regards,<br>The TrelloClone Team</p>
      </div>
    `
  })
};

const sendEmail = async (template, data) => {
  if (!transporter) {
    console.log('Email not sent - no transporter configured');
    return { success: true, message: 'Email not sent (no transporter)' };
  }

  try {
    const email = emailTemplates[template](data);
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@trello-clone.com',
      ...email
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendEmail, emailTemplates, initTransporter };