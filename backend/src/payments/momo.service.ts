import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export type MomoCreateResult = {
  payUrl: string;
  raw: Record<string, unknown>;
};

@Injectable()
export class MomoService {
  private readonly logger = new Logger(MomoService.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    const code = this.config.get<string>('MOMO_PARTNER_CODE');
    const key = this.config.get<string>('MOMO_ACCESS_KEY');
    const secret = this.config.get<string>('MOMO_SECRET_KEY');
    return Boolean(code && key && secret);
  }

  private signCreate(params: {
    accessKey: string;
    amount: number;
    extraData: string;
    ipnUrl: string;
    orderId: string;
    orderInfo: string;
    partnerCode: string;
    redirectUrl: string;
    requestId: string;
    requestType: string;
  }): string {
    const raw =
      `accessKey=${params.accessKey}` +
      `&amount=${params.amount}` +
      `&extraData=${params.extraData}` +
      `&ipnUrl=${params.ipnUrl}` +
      `&orderId=${params.orderId}` +
      `&orderInfo=${params.orderInfo}` +
      `&partnerCode=${params.partnerCode}` +
      `&redirectUrl=${params.redirectUrl}` +
      `&requestId=${params.requestId}` +
      `&requestType=${params.requestType}`;
    const secret = this.config.get<string>('MOMO_SECRET_KEY')!;
    return crypto.createHmac('sha256', secret).update(raw).digest('hex');
  }

  verifyIpnSignature(body: Record<string, string | number | undefined>): boolean {
    const secret = this.config.get<string>('MOMO_SECRET_KEY');
    const accessKey = this.config.get<string>('MOMO_ACCESS_KEY');
    if (!secret || !accessKey) return false;

    const amount = body.amount;
    const extraData = (body.extraData as string) ?? '';
    const message = (body.message as string) ?? '';
    const orderId = body.orderId as string;
    const orderInfo = (body.orderInfo as string) ?? '';
    const orderType = (body.orderType as string) ?? '';
    const partnerCode = body.partnerCode as string;
    const payType = (body.payType as string) ?? '';
    const requestId = body.requestId as string;
    const responseTime = body.responseTime as string;
    const resultCode = String(body.resultCode ?? '');
    const transId = String(body.transId ?? '');
    const received = body.signature as string | undefined;
    if (!received) return false;

    const raw =
      `accessKey=${accessKey}` +
      `&amount=${amount}` +
      `&extraData=${extraData}` +
      `&message=${message}` +
      `&orderId=${orderId}` +
      `&orderInfo=${orderInfo}` +
      `&orderType=${orderType}` +
      `&partnerCode=${partnerCode}` +
      `&payType=${payType}` +
      `&requestId=${requestId}` +
      `&responseTime=${responseTime}` +
      `&resultCode=${resultCode}` +
      `&transId=${transId}`;
    const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
    return expected === received;
  }

  async createPayment(params: {
    orderId: string;
    requestId: string;
    amount: number;
    orderInfo: string;
  }): Promise<MomoCreateResult> {
    const partnerCode = this.config.get<string>('MOMO_PARTNER_CODE')!;
    const accessKey = this.config.get<string>('MOMO_ACCESS_KEY')!;
    const endpoint =
      this.config.get<string>('MOMO_CREATE_ENDPOINT') || 'https://test-payment.momo.vn/v2/gateway/api/create';
    const redirectUrl =
      this.config.get<string>('MOMO_REDIRECT_URL') ||
      this.config.get<string>('FRONTEND_URL') ||
      'http://localhost:3001/patient/bookings';
    const publicBase = this.config.get<string>('API_PUBLIC_BASE_URL') || 'http://localhost:4000';
    const ipnUrl = this.config.get<string>('MOMO_IPN_URL') || `${publicBase.replace(/\/$/, '')}/payments/momo/ipn`;

    const extraData = '';
    const requestType = 'captureWallet';
    const signature = this.signCreate({
      accessKey,
      amount: params.amount,
      extraData,
      ipnUrl,
      orderId: params.orderId,
      orderInfo: params.orderInfo,
      partnerCode,
      redirectUrl,
      requestId: params.requestId,
      requestType,
    });

    const payload = {
      partnerCode,
      partnerName: this.config.get<string>('MOMO_PARTNER_NAME') || 'ClinicalPrecision',
      storeId: this.config.get<string>('MOMO_STORE_ID') || 'ClinicalPrecisionStore',
      requestId: params.requestId,
      amount: params.amount,
      orderId: params.orderId,
      orderInfo: params.orderInfo,
      redirectUrl,
      ipnUrl,
      lang: 'vi',
      extraData,
      requestType,
      signature,
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const raw = (await res.json()) as Record<string, unknown>;
    if (raw.resultCode !== 0) {
      this.logger.warn(`MoMo create failed: ${JSON.stringify(raw)}`);
      throw new Error(typeof raw.message === 'string' ? raw.message : 'MoMo create failed');
    }
    const payUrl = typeof raw.payUrl === 'string' ? raw.payUrl : '';
    if (!payUrl) {
      throw new Error('MoMo response missing payUrl');
    }
    return { payUrl, raw };
  }

  mockPayUrl(bookingCode: string): string {
    const fe = this.config.get<string>('FRONTEND_URL') || 'http://localhost:3001';
    return `${fe.replace(/\/$/, '')}/patient/bookings?booking=${encodeURIComponent(bookingCode)}&mockMomo=1`;
  }
}
