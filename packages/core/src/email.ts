import nodemailer from 'nodemailer';
import { SmtpConfig } from '@appforgeapps/shieldforge-types';

/**
 * Send a password reset email
 */
export async function sendPasswordResetEmail(
  config: SmtpConfig,
  to: string,
  resetCode: string,
  resetUrl?: string
): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure ?? config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  const mailOptions = {
    from: config.from,
    to,
    subject: 'Password Reset Request',
    text: resetUrl
      ? `You requested a password reset. Click the link to reset your password: ${resetUrl}\n\nOr use this code: ${resetCode}\n\nThis code expires in 1 hour.`
      : `You requested a password reset. Your reset code is: ${resetCode}\n\nThis code expires in 1 hour.`,
    html: resetUrl
      ? `<p>You requested a password reset.</p><p><a href="${resetUrl}">Click here to reset your password</a></p><p>Or use this code: <strong>${resetCode}</strong></p><p>This code expires in 1 hour.</p>`
      : `<p>You requested a password reset.</p><p>Your reset code is: <strong>${resetCode}</strong></p><p>This code expires in 1 hour.</p>`,
  };

  await transporter.sendMail(mailOptions);
}

/**
 * Send a generic email
 */
export async function sendEmail(
  config: SmtpConfig,
  to: string,
  subject: string,
  text: string,
  html?: string
): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure ?? config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  const mailOptions = {
    from: config.from,
    to,
    subject,
    text,
    html: html || text,
  };

  await transporter.sendMail(mailOptions);
}
