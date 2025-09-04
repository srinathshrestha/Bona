import nodemailer from "nodemailer";

interface MailgunConfig {
  apiKey: string;
  domain: string;
  fromEmail: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;

  constructor() {
    const config: MailgunConfig = {
      apiKey: process.env.MAILGUN_API_KEY!,
      domain: process.env.MAILGUN_DOMAIN!,
      fromEmail: process.env.MAILGUN_FROM_EMAIL!,
    };

    this.fromEmail = config.fromEmail;

    // Create transporter using Mailgun SMTP
    this.transporter = nodemailer.createTransport({
      host: "smtp.mailgun.org",
      port: 587,
      secure: false,
      auth: {
        user: `postmaster@${config.domain}`,
        pass: config.apiKey,
      },
    });
  }

  // Send a 6-digit OTP code with Bona-themed styling
  async sendOtpEmail(
    email: string,
    code: string,
    heading: string,
    subtext: string
  ): Promise<void> {
    const mailOptions = {
      from: this.fromEmail,
      to: email,
      subject: `${heading} - Bona`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 24px; font-family: Arial, sans-serif;">
          <div style="text-align:center; margin-bottom: 12px;">
            <h1 style="margin:0; color:#111827; font-size:24px;">${heading}</h1>
            <p style="margin:8px 0 0; color:#6B7280; font-size:14px;">${subtext}</p>
          </div>
          <div style="text-align:center; margin:28px 0;">
            <div style="display:inline-block; letter-spacing:6px; font-weight:700; font-size:28px; color:#111827; border:1px solid #E5E7EB; padding:12px 18px; border-radius:8px; background:#F9FAFB;">
              ${code}
            </div>
          </div>
          <p style="color:#6B7280; font-size:13px; line-height:1.6;">This code will expire in 10 minutes. If you didn’t request this, you can safely ignore this email.</p>
          <p style="color:#9CA3AF; font-size:12px; margin-top:16px;">Bona • Secure collaboration for teams</p>
        </div>
      `,
    };
    await this.transporter.sendMail(mailOptions);
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}`;

    const mailOptions = {
      from: this.fromEmail,
      to: email,
      subject: "Verify your email address - Bona",
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h1 style="color: #333; text-align: center;">Welcome to Bona!</h1>
          <p style="color: #666; font-size: 16px;">
            Thanks for signing up! Please verify your email address by clicking the button below:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #999; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${verificationUrl}">${verificationUrl}</a>
          </p>
          <p style="color: #999; font-size: 14px;">
            This link will expire in 24 hours.
          </p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`;

    const mailOptions = {
      from: this.fromEmail,
      to: email,
      subject: "Reset your password - Bona",
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h1 style="color: #333; text-align: center;">Password Reset Request</h1>
          <p style="color: #666; font-size: 16px;">
            You requested a password reset for your Bona account. Click the button below to reset your password:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #999; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${resetUrl}">${resetUrl}</a>
          </p>
          <p style="color: #999; font-size: 14px;">
            This link will expire in 1 hour. If you didn't request this reset, please ignore this email.
          </p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendEmailChangeConfirmation(
    email: string,
    token: string
  ): Promise<void> {
    const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/confirm-email-change?token=${token}`;

    const mailOptions = {
      from: this.fromEmail,
      to: email,
      subject: "Confirm email address change - Bona",
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h1 style="color: #333; text-align: center;">Confirm Email Change</h1>
          <p style="color: #666; font-size: 16px;">
            You requested to change your email address to this email. Click the button below to confirm:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmUrl}" 
               style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Confirm Email Change
            </a>
          </div>
          <p style="color: #999; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${confirmUrl}">${confirmUrl}</a>
          </p>
          <p style="color: #999; font-size: 14px;">
            This link will expire in 1 hour. If you didn't request this change, please ignore this email.
          </p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }
}

export const emailService = new EmailService();
