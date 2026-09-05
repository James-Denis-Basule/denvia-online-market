import nodemailer from "nodemailer";

import emailConfig from "../config/email.js";
import env from "../config/env.js";

const transporter = nodemailer.createTransport({
  host: emailConfig.host,
  port: emailConfig.port,
  secure: emailConfig.secure,
  auth: emailConfig.auth,
});

export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html?: string,
) {
  return transporter.sendMail({
    from: emailConfig.from,
    to,
    subject,
    text,
    ...(html ? { html } : {}),
  });
}

export async function sendEmailVerificationEmail(
  to: string,
  firstName: string,
  token: string,
) {
  const verificationUrl =
    `${env.clientUrl}/verify-email?token=${encodeURIComponent(token)}`;

  const subject = "Verify your Denvia Online Market email";

  const text = [
    `Hello ${firstName},`,
    "",
    "Thank you for creating your Denvia Online Market account.",
    "",
    "Please verify your email address by opening the verification button in this email.",
    "",
    "This verification link expires in 24 hours.",
    "",
    "If you did not create this account, you can safely ignore this email.",
    "",
    "Denvia Online Market",
  ].join("\n");

  const html = `
    <p>Hello ${firstName},</p>

    <p>
      Thank you for creating your Denvia Online Market account.
    </p>

    <p>
      Please verify your email address by clicking the button below:
    </p>

    <p>
      <a
        href="${verificationUrl}"
        style="
          display: inline-block;
          padding: 12px 20px;
          background: #000;
          color: #fff;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
        "
      >
        Verify Email Address
      </a>
    </p>

    <p>
      This verification link expires in 24 hours.
    </p>

    <p>
      If you did not create this account, you can safely ignore this email.
    </p>

    <p>Denvia Online Market</p>
  `;

  return sendEmail(to, subject, text, html);
}

export async function sendPasswordResetEmail(
  to: string,
  firstName: string,
  token: string,
) {
  const resetUrl =
    `${env.clientUrl}/reset-password?token=${encodeURIComponent(token)}`;

  const subject = "Reset your Denvia Online Market password";

  const text = [
    `Hello ${firstName},`,
    "",
    "We received a request to reset your Denvia Online Market password.",
    "",
    "Open the reset link in this email to choose a new password.",
    "",
    "This link expires in 1 hour.",
    "",
    "If you did not request a password reset, you can safely ignore this email — your password will not be changed.",
    "",
    "Denvia Online Market",
  ].join("\n");

  const html = `
    <p>Hello ${firstName},</p>

    <p>
      We received a request to reset your Denvia Online Market password.
    </p>

    <p>
      Click the button below to choose a new password:
    </p>

    <p>
      <a
        href="${resetUrl}"
        style="
          display: inline-block;
          padding: 12px 20px;
          background: #000;
          color: #fff;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
        "
      >
        Reset Password
      </a>
    </p>

    <p>
      This link expires in 1 hour.
    </p>

    <p>
      If you did not request a password reset, you can safely ignore this
      email — your password will not be changed.
    </p>

    <p>Denvia Online Market</p>
  `;

  return sendEmail(to, subject, text, html);
}

export async function verifyEmailTransport() {
  await transporter.verify();
}