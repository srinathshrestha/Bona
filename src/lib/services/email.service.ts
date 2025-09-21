import {
  getEmailVerificationUrl,
  getPasswordResetUrl,
  getEmailChangeConfirmationUrl,
} from "../utils/url";

interface MailgunConfig {
  apiKey: string;
  domain: string;
  fromEmail: string;
}

class EmailService {
  private config: MailgunConfig;

  constructor() {
    this.config = {
      apiKey: process.env.MAILGUN_API_KEY || "",
      domain: process.env.MAILGUN_DOMAIN || "",
      fromEmail: process.env.MAILGUN_FROM_EMAIL || "",
    };
  }

  private async sendViaMailgun(params: {
    to: string;
    subject: string;
    html?: string;
    text?: string;
  }): Promise<void> {
    const { apiKey, domain, fromEmail } = this.config;
    if (!apiKey || !domain || !fromEmail) {
      throw new Error("Mailgun configuration missing");
    }

    const form = new URLSearchParams();
    form.append("from", fromEmail);
    form.append("to", params.to);
    form.append("subject", params.subject);
    if (params.text) form.append("text", params.text);
    if (params.html) form.append("html", params.html);

    const authHeader =
      "Basic " + Buffer.from(`api:${apiKey}`).toString("base64");

    const res = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Mailgun send failed (${res.status}): ${body}`);
    }
  }

  // Send a 6-digit OTP code with Bona-themed styling
  async sendOtpEmail(
    email: string,
    code: string,
    heading: string,
    subtext: string
  ): Promise<void> {
    await this.sendViaMailgun({
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
    });
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = getEmailVerificationUrl(token);

    await this.sendViaMailgun({
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
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = getPasswordResetUrl(token);

    await this.sendViaMailgun({
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
    });
  }

  async sendEmailChangeConfirmation(
    email: string,
    token: string
  ): Promise<void> {
    const confirmUrl = getEmailChangeConfirmationUrl(token);

    await this.sendViaMailgun({
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
    });
  }
}

export const emailService = new EmailService();
