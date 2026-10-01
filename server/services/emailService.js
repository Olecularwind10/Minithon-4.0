import { Resend } from 'resend';
import { env } from '../config/env.js';

const resend = env.resendApiKey ? new Resend(env.resendApiKey) : null;

export async function sendVerificationEmail({ to, name, otp }) {
  if (!to || !otp) {
    throw new Error('Recipient email and OTP are required.');
  }

  const subject = 'Verify your Neighborhood Help account';
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
      <h2>Hello ${name || 'there'},</h2>
      <p>Your Neighborhood Help verification code is:</p>
      <div style="font-size: 28px; font-weight: 700; letter-spacing: 4px; background: #f3f4f6; padding: 16px 20px; border-radius: 8px; display: inline-block; margin: 12px 0;">
        ${otp}
      </div>
      <p>This code expires in 10 minutes.</p>
      <p>If you did not create this account, you can ignore this email.</p>
    </div>
  `;
  const text = `Hello ${name || 'there'},\n\nYour Neighborhood Help verification code is:\n\n${otp}\n\nThis code expires in 10 minutes.\n\nIf you did not create this account, you can ignore this email.`;

  if (!resend || !env.fromEmail) {
    console.warn('[emailService] Resend not configured. Verification email not sent. OTP for debug:', otp);
    return { delivered: false, reason: 'missing-config' };
  }

  const response = await resend.emails.send({
    from: env.fromEmail,
    to,
    subject,
    html,
    text,
  });

  if (response.error) {
    throw new Error(response.error.message || 'Failed to send verification email.');
  }

  return { delivered: true, id: response.data?.id || null };
}
