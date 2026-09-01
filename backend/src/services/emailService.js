// backend/src/services/emailService.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_PORT === '465',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─── Send password reset email ──────────────────────────────
export const sendResetEmail = async (email, resetToken) => {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: '🔐 Reset Your KUA Password',
    html: `...`, // (your existing HTML)
  };
  await transporter.sendMail(mailOptions);
};

// ─── Send verification email ─────────────────────────────────
export const sendVerificationEmail = async (email, code) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: '✅ Verify Your Email – KUA',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f4f4f4; border-radius: 10px;">
        <h2 style="color: #3b82f6;">✅ Welcome to KUA!</h2>
        <p>Please verify your email address by entering the 6-digit code below:</p>
        <div style="background: #ffffff; padding: 16px; border-radius: 8px; font-size: 28px; text-align: center; letter-spacing: 8px; font-weight: bold; border: 1px solid #d1d5db;">
          ${code}
        </div>
        <p style="color: #6b7280; font-size: 14px; margin-top: 16px;">This code expires in 15 minutes.</p>
        <p>If you didn't create an account, you can ignore this email.</p>
        <hr style="border: 1px solid #ddd;" />
        <p style="font-size: 12px; color: #888;">KUA – Learn. Grow. Discover.</p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};

// Alias for backward compatibility (optional)
export const sendPasswordResetEmail = sendResetEmail;