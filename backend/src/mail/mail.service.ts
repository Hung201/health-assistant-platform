import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import QRCode from 'qrcode';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('MAIL_HOST');
    const port = this.config.get<string>('MAIL_PORT');
    const user = this.config.get<string>('MAIL_USER');
    const pass = this.config.get<string>('MAIL_PASS');
    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: port ? parseInt(port, 10) : 587,
        secure: port === '465',
        auth: { user, pass },
      });
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

  private async sendRaw(params: { to: string; subject: string; html: string }): Promise<void> {
    const from = this.config.get<string>('MAIL_FROM') || 'noreply@localhost';
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
}
