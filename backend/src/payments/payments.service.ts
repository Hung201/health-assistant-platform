import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';

import { Booking } from '../entities/booking.entity';
import { Payment } from '../entities/payment.entity';
import { BookingStatusLog } from '../entities/booking-status-log.entity';
import { MailService } from '../mail/mail.service';
import { MomoService } from './momo.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(BookingStatusLog)
    private readonly logRepo: Repository<BookingStatusLog>,
    private readonly momo: MomoService,
    private readonly mail: MailService,
  ) {}

  async sendPaymentEmailsAfterDoctorApproval(booking: Booking, recipientEmail: string): Promise<void> {
    if (booking.paymentMethod === 'pay_at_clinic') {
      await this.mail.sendBookingApprovedPayAtClinic({
        to: recipientEmail,
        bookingCode: booking.bookingCode,
        doctorName: booking.doctorNameSnapshot,
        appointmentStartAt: booking.appointmentStartAt,
        appointmentEndAt: booking.appointmentEndAt,
        totalFee: booking.totalFee,
      });
      return;
    }

    const amount = Math.round(Number(booking.totalFee));
    const orderId = `CP-${booking.bookingCode}-${Date.now()}`;
    const requestId = randomUUID();

    let payUrl: string;
    let rawJson: string;
    if (this.momo.isConfigured()) {
      try {
        const created = await this.momo.createPayment({
          orderId,
          requestId,
          amount,
          orderInfo: `Thanh toan lich ${booking.bookingCode}`,
        });
        payUrl = created.payUrl;
        rawJson = JSON.stringify(created.raw);
      } catch (e) {
        this.logger.error(`MoMo create error: ${(e as Error).message}`);
        throw e;
      }
    } else {
      payUrl = this.momo.mockPayUrl(booking.bookingCode);
      rawJson = JSON.stringify({ mock: true, message: 'MOMO_* chưa cấu hình — dùng link giả lập' });
      this.logger.warn('MoMo chưa cấu hình — dùng mock payUrl (dev).');
    }

    const payment = await this.paymentRepo.save(
      this.paymentRepo.create({
        bookingId: booking.id,
        provider: 'momo',
        amount: String(amount),
        currency: 'VND',
        status: 'awaiting_payment',
        providerOrderId: orderId,
        providerTransId: null,
        rawCreateResponse: rawJson,
        rawIpnBody: null,
      }),
    );

    booking.paymentStatus = 'awaiting_gateway';
    await this.bookingRepo.save(booking);

    await this.mail.sendBookingApprovedWithMomoQr({
      to: recipientEmail,
      bookingCode: booking.bookingCode,
      doctorName: booking.doctorNameSnapshot,
      appointmentStartAt: booking.appointmentStartAt,
      appointmentEndAt: booking.appointmentEndAt,
      totalFee: booking.totalFee,
      payUrl,
    });

    this.logger.log(`Payment row ${payment.id} created for booking ${booking.id}`);
  }

  async handleMomoIpn(
    body: Record<string, string | number | undefined> | null | undefined,
  ): Promise<{ resultCode: number; message: string }> {
    if (!this.momo.verifyIpnSignature(body)) {
      this.logger.warn('MoMo IPN signature invalid');
      return { resultCode: 1, message: 'Invalid signature' };
    }
    if (!body) {
      this.logger.warn('MoMo IPN body missing');
      return { resultCode: 1, message: 'Invalid payload' };
    }
    const payload = body as Record<string, string | number | undefined>;

    const orderId = payload.orderId as string | undefined;
    const resultCode = Number(payload.resultCode ?? -1);
    const transId = payload.transId != null ? String(payload.transId) : null;

    if (!orderId) {
      return { resultCode: 1, message: 'Missing orderId' };
    }

    const payment = await this.paymentRepo.findOne({ where: { providerOrderId: orderId } });
    if (!payment) {
      this.logger.warn(`IPN: payment not found for orderId=${orderId}`);
      return { resultCode: 0, message: 'success' };
    }

    payment.rawIpnBody = JSON.stringify(payload);
    if (resultCode === 0) {
      payment.status = 'paid';
      payment.providerTransId = transId;
      await this.paymentRepo.save(payment);

      const booking = await this.bookingRepo.findOne({ where: { id: payment.bookingId } });
      if (booking) {
        booking.paymentStatus = 'paid';
        await this.bookingRepo.save(booking);
        await this.logRepo.save(
          this.logRepo.create({
            bookingId: booking.id,
            oldStatus: booking.status,
            newStatus: booking.status,
            changedBy: null,
            note: `MoMo IPN paid transId=${transId ?? ''}`,
          }),
        );
      }
    } else {
      payment.status = 'failed';
      await this.paymentRepo.save(payment);
      const booking = await this.bookingRepo.findOne({ where: { id: payment.bookingId } });
      if (booking) {
        booking.paymentStatus = 'failed';
        await this.bookingRepo.save(booking);
      }
    }

    return { resultCode: 0, message: 'success' };
  }
}
