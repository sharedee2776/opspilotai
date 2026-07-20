import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private readonly from: string;
  private readonly appUrl: string;

  constructor(private readonly config: ConfigService) {
    const host = config.get<string>('SMTP_HOST');
    const user = config.get<string>('SMTP_USER');
    const pass = config.get<string>('SMTP_PASS');
    this.from = config.get<string>('SMTP_FROM', 'OpsPilot <noreply@opspilot.io>');
    this.appUrl = config.get<string>('APP_URL', 'https://opspilotai.vercel.app');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(config.get<string>('SMTP_PORT', '587')),
        secure: config.get<string>('SMTP_SECURE', 'false') === 'true',
        auth: { user, pass },
      });
      this.logger.log(`Mail service ready via ${host}`);
    } else {
      this.logger.warn('SMTP not configured — emails will be logged to console only');
    }
  }

  async sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
    const url = `${this.appUrl}/verify-email?token=${token}`;
    await this.send({
      to: email,
      subject: 'Verify your OpsPilot email',
      html: this.layout(
        'Verify your email',
        `<p>Hi ${name},</p>
         <p>Thanks for signing up for OpsPilot. Click the button below to verify your email address.</p>
         <p style="text-align:center;margin:32px 0">
           <a href="${url}" style="background:#6366f1;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">
             Verify email
           </a>
         </p>
         <p style="color:#94a3b8;font-size:13px">This link expires in 24 hours. If you didn't sign up for OpsPilot, you can ignore this email.</p>`,
      ),
    });
  }

  async sendPasswordResetEmail(email: string, name: string, token: string): Promise<void> {
    const url = `${this.appUrl}/reset-password?token=${token}`;
    await this.send({
      to: email,
      subject: 'Reset your OpsPilot password',
      html: this.layout(
        'Reset your password',
        `<p>Hi ${name},</p>
         <p>We received a request to reset your OpsPilot password. Click the button below to choose a new password.</p>
         <p style="text-align:center;margin:32px 0">
           <a href="${url}" style="background:#6366f1;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">
             Reset password
           </a>
         </p>
         <p style="color:#94a3b8;font-size:13px">This link expires in 1 hour. If you didn't request a password reset, you can ignore this email.</p>`,
      ),
    });
  }

  private async send(opts: { to: string; subject: string; html: string }): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(`[EMAIL NOT SENT — SMTP unconfigured] To: ${opts.to} | Subject: ${opts.subject}`);
      return;
    }
    try {
      await this.transporter.sendMail({ from: this.from, ...opts });
      this.logger.log(`Email sent to ${opts.to}: ${opts.subject}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${opts.to}: ${(err as Error).message}`);
    }
  }

  private layout(title: string, body: string): string {
    return `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#0f172a;margin:0;padding:40px 20px">
      <div style="max-width:480px;margin:0 auto;background:#1e293b;border-radius:12px;padding:32px;border:1px solid #334155">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px">
          <div style="background:#6366f1;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center">
            <span style="color:#fff;font-size:18px">⚡</span>
          </div>
          <span style="color:#fff;font-size:18px;font-weight:700">OpsPilot</span>
        </div>
        <h2 style="color:#fff;margin:0 0 16px">${title}</h2>
        <div style="color:#cbd5e1;font-size:15px;line-height:1.6">${body}</div>
      </div>
    </body></html>`;
  }
}
