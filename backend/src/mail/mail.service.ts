import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lookup as dnsLookup } from 'node:dns';
import * as nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import QRCode from 'qrcode';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly brevoApiKey: string | undefined;

  constructor(private readonly config: ConfigService) {
    this.brevoApiKey = this.config.get<string>('BREVO_API_KEY')?.trim() || undefined;
    if (this.brevoApiKey) {
      this.logger.log('Email: Brevo HTTP API (dùng trên Render free — không cần SMTP port 587).');
      return;
    }

    const host = this.config.get<string>('MAIL_HOST');
    const port = this.config.get<string>('MAIL_PORT');
    const user = this.config.get<string>('MAIL_USER');
    const pass = this.config.get<string>('MAIL_PASS');
    if (host && user && pass) {
      const portNum = port ? parseInt(port, 10) : 587;
      const smtpOptions: SMTPTransport.Options & {
        lookup?: (
          hostname: string,
          _options: object,
          callback: (err: NodeJS.ErrnoException | null, address: string, family?: number) => void,
        ) => void;
      } = {
        host,
        port: portNum,
        secure: portNum === 465,
        auth: { user, pass },
        lookup: (hostname, _options, callback) => {
          dnsLookup(hostname, { family: 4 }, callback);
        },
      };
      this.transporter = nodemailer.createTransport(smtpOptions);
    } else {
      this.logger.warn('MAIL_* chưa cấu hình — email sẽ chỉ được log ra console.');
    }
  }

  async sendBookingApprovedWithMomoQr(params: {
    to: string;
    bookingCode: string;
    doctorName: string;
    appointmentStartAt: Date;
    appointmentEndAt: Date;
    totalFee: string;
    payUrl: string;
  }): Promise<void> {
    const { to, bookingCode, doctorName, appointmentStartAt, appointmentEndAt, totalFee, payUrl } = params;
    let qrCid = '';
    try {
      qrCid = await QRCode.toDataURL(payUrl, { width: 240, margin: 2 });
    } catch (e) {
      this.logger.warn(`QR generation failed: ${(e as Error).message}`);
    }
    const startStr = appointmentStartAt.toLocaleString('vi-VN');
    const endTime = appointmentEndAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:560px">
        <h2>Lịch khám đã được bác sĩ xác nhận</h2>
        <p>Mã lịch: <strong>${bookingCode}</strong></p>
        <p>Bác sĩ: ${doctorName}</p>
        <p>Thời gian: ${startStr} – ${endTime}</p>
        <p>Số tiền: <strong>${Number(totalFee).toLocaleString('vi-VN')}₫</strong></p>
        <p>Vui lòng thanh toán qua MoMo bằng cách quét mã QR bên dưới hoặc mở liên kết.</p>
        ${qrCid ? `<p><img src="${qrCid}" alt="QR MoMo" width="240" height="240" /></p>` : ''}
        <p><a href="${payUrl}" style="display:inline-block;padding:10px 16px;background:#ae2070;color:#fff;text-decoration:none;border-radius:8px">Mở trang thanh toán MoMo</a></p>
        <p style="font-size:12px;color:#666">Nếu bạn đã thanh toán, vui lòng bỏ qua email này.</p>
      </div>
    `.trim();

    await this.sendRaw({ to, subject: `[Lịch khám] Xác nhận & thanh toán — ${bookingCode}`, html });
  }

  async sendBookingApprovedPayAtClinic(params: {
    to: string;
    bookingCode: string;
    doctorName: string;
    appointmentStartAt: Date;
    appointmentEndAt: Date;
    totalFee: string;
  }): Promise<void> {
    const { to, bookingCode, doctorName, appointmentStartAt, appointmentEndAt, totalFee } = params;
    const startStr = appointmentStartAt.toLocaleString('vi-VN');
    const endTime = appointmentEndAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:560px">
        <h2>Lịch khám đã được bác sĩ xác nhận</h2>
        <p>Mã lịch: <strong>${bookingCode}</strong></p>
        <p>Bác sĩ: ${doctorName}</p>
        <p>Thời gian: ${startStr} – ${endTime}</p>
        <p>Phí tham khảo: <strong>${Number(totalFee).toLocaleString('vi-VN')}₫</strong></p>
        <p>Bạn chọn thanh toán tại bệnh viện/phòng khám. Vui lòng đến đúng giờ và hoàn tất thanh toán tại quầy.</p>
      </div>
    `.trim();
    await this.sendRaw({ to, subject: `[Lịch khám] Đã xác nhận — ${bookingCode}`, html });
  }

  async sendPatientVerifyCode(params: { to: string; fullName: string; code: string; expiresMinutes: number }) {
    const { to, fullName, code, expiresMinutes } = params;
    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:560px">
        <h2>Xác thực email đăng ký bệnh nhân</h2>
        <p>Xin chào <strong>${fullName}</strong>,</p>
        <p>Mã xác thực của bạn là:</p>
        <div style="font-size:28px;font-weight:800;letter-spacing:4px;padding:12px 16px;background:#f3faf9;border:1px solid #d1eeea;border-radius:10px;display:inline-block">
          ${code}
        </div>
        <p style="margin-top:16px">Mã có hiệu lực trong <strong>${expiresMinutes} phút</strong>.</p>
        <p style="font-size:12px;color:#666">Nếu bạn không thực hiện đăng ký, vui lòng bỏ qua email này.</p>
      </div>
    `.trim();
    await this.sendRaw({ to, subject: '[Clinical Precision] Mã xác thực đăng ký bệnh nhân', html });
  }

  async sendPasswordResetLink(params: {
    to: string;
    fullName: string;
    resetUrl: string;
    expiresMinutes: number;
  }): Promise<void> {
    const { to, fullName, resetUrl, expiresMinutes } = params;
    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:560px">
        <h2>Đặt lại mật khẩu</h2>
        <p>Xin chào <strong>${fullName}</strong>,</p>
        <p>Bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu cho tài khoản Clinical Precision. Nhấn nút bên dưới để chọn mật khẩu mới:</p>
        <p><a href="${resetUrl}" style="display:inline-block;padding:12px 20px;background:#0d9488;color:#fff;text-decoration:none;border-radius:10px;font-weight:700">Đặt lại mật khẩu</a></p>
        <p style="font-size:13px;color:#444">Hoặc dán liên kết vào trình duyệt:<br/><span style="word-break:break-all">${resetUrl}</span></p>
        <p style="margin-top:16px;font-size:13px;color:#666">Liên kết có hiệu lực trong <strong>${expiresMinutes} phút</strong>. Nếu bạn không yêu cầu, hãy bỏ qua email này — mật khẩu hiện tại vẫn an toàn.</p>
      </div>
    `.trim();
    await this.sendRaw({ to, subject: '[Clinical Precision] Đặt lại mật khẩu', html });
  }

  private async sendRaw(params: { to: string; subject: string; html: string }): Promise<void> {
    const from = this.config.get<string>('MAIL_FROM') || 'noreply@localhost';
    if (this.brevoApiKey) {
      await this.sendViaBrevoApi({ from, ...params });
      return;
    }
    if (!this.transporter) {
      this.logger.log(`[email skipped — no transporter] to=${params.to} subject=${params.subject}`);
      return;
    }
    try {
      await this.transporter.sendMail({
        from,
        to: params.to,
        subject: params.subject,
        html: params.html,
      });
      this.logger.log(`Email sent to ${params.to}: ${params.subject}`);
    } catch (e) {
      this.logger.error(`sendMail failed: ${(e as Error).message}`);
      throw e;
    }
  }

  /** HTTPS :443 — hoạt động trên Render free (SMTP 587/465 bị chặn). */
  private async sendViaBrevoApi(params: {
    from: string;
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    const senderName = this.config.get<string>('BREVO_SENDER_NAME') || 'Clinical Precision';
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': this.brevoApiKey!,
      },
      body: JSON.stringify({
        sender: { email: params.from, name: senderName },
        to: [{ email: params.to }],
        subject: params.subject,
        htmlContent: params.html,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      let detail = body;
      try {
        const j = JSON.parse(body) as { message?: string };
        if (j.message) detail = j.message;
      } catch {
        /* keep raw body */
      }
      this.logger.error(`Brevo API failed (${res.status}): ${detail}`);
      throw new Error(detail);
    }
    this.logger.log(`Email sent to ${params.to}: ${params.subject}`);
  }
}
