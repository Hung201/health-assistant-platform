import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';

import { Booking } from '../entities/booking.entity';
import { BookingStatusLog } from '../entities/booking-status-log.entity';
import { DoctorAvailableSlot } from '../entities/doctor-available-slot.entity';
import { DoctorProfile } from '../entities/doctor-profile.entity';
import { PatientProfile } from '../entities/patient-profile.entity';
import { Payment } from '../entities/payment.entity';
import { Specialty } from '../entities/specialty.entity';
import { User } from '../entities/user.entity';
import { PaymentsService } from '../payments/payments.service';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreateGuestBookingDto } from './dto/create-guest-booking.dto';

function hasRole(user: User, code: string): boolean {
  return Boolean(user.userRoles?.some((ur) => ur.role?.code === code));
}

function yyyymmdd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

function rand6(): string {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
}

function mapBookingRow(b: Booking) {
  return {
    id: b.id,
    bookingCode: b.bookingCode,
    status: b.status,
    paymentMethod: b.paymentMethod,
    paymentStatus: b.paymentStatus,
    appointmentDate: b.appointmentDate instanceof Date ? b.appointmentDate.toISOString().slice(0, 10) : String(b.appointmentDate),
    appointmentStartAt: b.appointmentStartAt.toISOString(),
    appointmentEndAt: b.appointmentEndAt.toISOString(),
    doctorUserId: b.doctorUserId,
    doctorName: b.doctorNameSnapshot,
    specialtyId: Number(b.specialtyId),
    specialtyName: b.specialtyNameSnapshot,
    patientNote: b.patientNote,
    consultationFee: b.consultationFee,
    totalFee: b.totalFee,
    createdAt: b.createdAt.toISOString(),
  };
}

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(BookingStatusLog)
    private readonly logRepo: Repository<BookingStatusLog>,
    @InjectRepository(DoctorAvailableSlot)
    private readonly slotRepo: Repository<DoctorAvailableSlot>,
    @InjectRepository(DoctorProfile)
    private readonly doctorRepo: Repository<DoctorProfile>,
    @InjectRepository(PatientProfile)
    private readonly patientRepo: Repository<PatientProfile>,
    @InjectRepository(Specialty)
    private readonly specialtyRepo: Repository<Specialty>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly paymentsService: PaymentsService,
  ) {}

  private async assertSlotAndDoctor(dto: { availableSlotId: number; specialtyId?: number }) {
    const slot = await this.slotRepo.findOne({
      where: { id: dto.availableSlotId },
    });
    if (!slot) throw new NotFoundException('Không tìm thấy slot');
    if (slot.status !== 'available') throw new BadRequestException('Slot không khả dụng');
    if (slot.bookedCount >= slot.maxBookings) throw new BadRequestException('Slot đã đủ lượt');
    if (slot.startAt.getTime() < Date.now()) throw new BadRequestException('Slot đã qua thời gian');

    if (dto.specialtyId != null) {
      const sid = Number(dto.specialtyId);
      if (Number.isNaN(sid)) throw new BadRequestException('specialtyId không hợp lệ');
      if (slot.specialtyId != null && Number(slot.specialtyId) !== sid) {
        throw new BadRequestException('Slot không thuộc chuyên khoa đã chọn');
      }
    }

    const doctorProfile = await this.doctorRepo.findOne({
      where: { userId: slot.doctorUserId },
      relations: ['user'],
    });
    if (!doctorProfile) throw new NotFoundException('Không tìm thấy hồ sơ bác sĩ');
    if (!doctorProfile.isVerified || doctorProfile.verificationStatus !== 'approved') {
      throw new BadRequestException('Bác sĩ chưa được duyệt');
    }

    const specialtyId = slot.specialtyId ?? dto.specialtyId;
    if (specialtyId == null) throw new BadRequestException('Thiếu specialtyId');
    const specialty = await this.specialtyRepo.findOne({
      where: { id: specialtyId, status: 'active' },
    });
    if (!specialty) throw new BadRequestException('Chuyên khoa không hợp lệ');

    return { slot, doctorProfile, specialtyId: Number(specialtyId), specialty };
  }

  async createBooking(currentUser: User, dto: CreateBookingDto) {
    if (!hasRole(currentUser, 'patient')) {
      throw new ForbiddenException('Chỉ bệnh nhân mới có thể đặt lịch');
    }
    const patient = await this.patientRepo.findOne({
      where: { userId: currentUser.id },
    });
    if (!patient) throw new ForbiddenException('Không tìm thấy hồ sơ bệnh nhân');

    const { slot, doctorProfile, specialtyId, specialty } = await this.assertSlotAndDoctor(dto);

    const paymentMethod = dto.paymentMethod ?? 'momo';

    const now = new Date();
    let bookingCode = `BK-${yyyymmdd(now)}-${rand6()}`;
    for (let i = 0; i < 5; i++) {
      const exists = await this.bookingRepo.findOne({ where: { bookingCode } });
      if (!exists) break;
      bookingCode = `BK-${yyyymmdd(now)}-${rand6()}`;
    }

    return this.bookingRepo.manager.transaction(async (manager) => {
      const lockedSlot = await manager.getRepository(DoctorAvailableSlot).findOne({
        where: { id: dto.availableSlotId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!lockedSlot) throw new NotFoundException('Không tìm thấy slot');
      if (lockedSlot.status !== 'available') throw new BadRequestException('Slot không khả dụng');
      if (lockedSlot.bookedCount >= lockedSlot.maxBookings) throw new BadRequestException('Slot đã đủ lượt');

      lockedSlot.bookedCount += 1;
      await manager.getRepository(DoctorAvailableSlot).save(lockedSlot);

      const apptDate = new Date(lockedSlot.startAt.toISOString().slice(0, 10));

      const booking = await manager.getRepository(Booking).save(
        manager.getRepository(Booking).create({
          bookingCode,
          patientUserId: currentUser.id,
          doctorUserId: lockedSlot.doctorUserId,
          specialtyId,
          availableSlotId: Number(lockedSlot.id),
          patientNote: dto.patientNote?.trim() || null,
          status: 'pending',
          paymentMethod,
          paymentStatus: 'unpaid',
          guestFullName: null,
          guestPhone: null,
          guestEmail: null,
          guestLookupToken: null,
          appointmentDate: apptDate,
          appointmentStartAt: lockedSlot.startAt,
          appointmentEndAt: lockedSlot.endAt,
          doctorNameSnapshot: doctorProfile.user?.fullName ?? 'Bác sĩ',
          specialtyNameSnapshot: specialty.name,
          consultationFee: doctorProfile.consultationFee,
          platformFee: '0',
          totalFee: doctorProfile.consultationFee,
        }),
      );

      await manager.getRepository(BookingStatusLog).save(
        manager.getRepository(BookingStatusLog).create({
          bookingId: booking.id,
          oldStatus: null,
          newStatus: 'pending',
          changedBy: currentUser.id,
          note: 'Patient created booking',
        }),
      );

      return {
        ok: true,
        id: booking.id,
        bookingCode: booking.bookingCode,
        status: booking.status,
        paymentMethod: booking.paymentMethod,
        paymentStatus: booking.paymentStatus,
      };
    });
  }

  async createGuestBooking(dto: CreateGuestBookingDto) {
    const { slot, doctorProfile, specialtyId, specialty } = await this.assertSlotAndDoctor(dto);

    const now = new Date();
    let bookingCode = `BK-${yyyymmdd(now)}-${rand6()}`;
    for (let i = 0; i < 5; i++) {
      const exists = await this.bookingRepo.findOne({ where: { bookingCode } });
      if (!exists) break;
      bookingCode = `BK-${yyyymmdd(now)}-${rand6()}`;
    }

    const guestLookupToken = randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '').slice(0, 32);

    return this.bookingRepo.manager.transaction(async (manager) => {
      const lockedSlot = await manager.getRepository(DoctorAvailableSlot).findOne({
        where: { id: dto.availableSlotId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!lockedSlot) throw new NotFoundException('Không tìm thấy slot');
      if (lockedSlot.status !== 'available') throw new BadRequestException('Slot không khả dụng');
      if (lockedSlot.bookedCount >= lockedSlot.maxBookings) throw new BadRequestException('Slot đã đủ lượt');

      lockedSlot.bookedCount += 1;
      await manager.getRepository(DoctorAvailableSlot).save(lockedSlot);

      const apptDate = new Date(lockedSlot.startAt.toISOString().slice(0, 10));

      const booking = await manager.getRepository(Booking).save(
        manager.getRepository(Booking).create({
          bookingCode,
          patientUserId: null,
          doctorUserId: lockedSlot.doctorUserId,
          specialtyId,
          availableSlotId: Number(lockedSlot.id),
          patientNote: dto.patientNote?.trim() || null,
          status: 'pending',
          paymentMethod: dto.paymentMethod,
          paymentStatus: 'unpaid',
          guestFullName: dto.guestFullName.trim(),
          guestPhone: dto.guestPhone.trim(),
          guestEmail: dto.guestEmail.trim().toLowerCase(),
          guestLookupToken,
          appointmentDate: apptDate,
          appointmentStartAt: lockedSlot.startAt,
          appointmentEndAt: lockedSlot.endAt,
          doctorNameSnapshot: doctorProfile.user?.fullName ?? 'Bác sĩ',
          specialtyNameSnapshot: specialty.name,
          consultationFee: doctorProfile.consultationFee,
          platformFee: '0',
          totalFee: doctorProfile.consultationFee,
        }),
      );

      await manager.getRepository(BookingStatusLog).save(
        manager.getRepository(BookingStatusLog).create({
          bookingId: booking.id,
          oldStatus: null,
          newStatus: 'pending',
          changedBy: null,
          note: 'Guest created booking',
        }),
      );

      return {
        ok: true,
        id: booking.id,
        bookingCode: booking.bookingCode,
        status: booking.status,
        guestLookupToken,
        paymentMethod: booking.paymentMethod,
        paymentStatus: booking.paymentStatus,
      };
    });
  }

  private async resolveRecipientEmail(booking: Booking): Promise<string> {
    if (booking.patientUserId) {
      const u = await this.userRepo.findOne({ where: { id: booking.patientUserId } });
      if (!u?.email) throw new BadRequestException('Không tìm thấy email bệnh nhân');
      return u.email;
    }
    if (booking.guestEmail) return booking.guestEmail;
    throw new BadRequestException('Thiếu email để gửi xác nhận thanh toán');
  }

  async approveBookingByDoctor(currentUser: User, bookingId: string) {
    if (!hasRole(currentUser, 'doctor')) {
      throw new ForbiddenException('Chỉ bác sĩ mới được duyệt lịch');
    }

    await this.bookingRepo.manager.transaction(async (manager) => {
      const bookingRepo = manager.getRepository(Booking);
      const logRepo = manager.getRepository(BookingStatusLog);

      const booking = await bookingRepo.findOne({
        where: { id: bookingId, doctorUserId: currentUser.id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!booking) throw new NotFoundException('Không tìm thấy lịch hẹn');
      if (booking.status !== 'pending') {
        throw new BadRequestException('Lịch hẹn không ở trạng thái chờ duyệt');
      }

      const oldStatus = booking.status;
      booking.status = 'approved';
      booking.approvedAt = new Date();
      booking.approvedBy = currentUser.id;
      if (booking.paymentMethod === 'pay_at_clinic') {
        booking.paymentStatus = 'pay_at_clinic';
      }
      await bookingRepo.save(booking);

      await logRepo.save(
        logRepo.create({
          bookingId: booking.id,
          oldStatus,
          newStatus: booking.status,
          changedBy: currentUser.id,
          note: 'Doctor approved booking',
        }),
      );
    });

    const fresh = await this.bookingRepo.findOne({ where: { id: bookingId } });
    if (!fresh) throw new NotFoundException('Không tìm thấy lịch hẹn');

    const email = await this.resolveRecipientEmail(fresh);
    try {
      await this.paymentsService.sendPaymentEmailsAfterDoctorApproval(fresh, email);
    } catch (err) {
      this.logger.error(`approve follow-up failed: ${(err as Error).message}`);
      fresh.status = 'pending';
      fresh.approvedAt = null;
      fresh.approvedBy = null;
      fresh.paymentStatus = 'unpaid';
      await this.bookingRepo.save(fresh);
      await this.logRepo.save(
        this.logRepo.create({
          bookingId: fresh.id,
          oldStatus: 'approved',
          newStatus: 'pending',
          changedBy: currentUser.id,
          note: `Reverted approve: payment/email error — ${(err as Error).message}`,
        }),
      );
      throw new BadRequestException(
        'Không khởi tạo được thanh toán / gửi email. Lịch đã được trả về trạng thái chờ. Vui lòng thử lại.',
      );
    }

    return { ok: true, id: fresh.id, status: fresh.status, paymentStatus: fresh.paymentStatus };
  }

  async rejectBookingByDoctor(currentUser: User, bookingId: string, reason?: string | null) {
    if (!hasRole(currentUser, 'doctor')) {
      throw new ForbiddenException('Chỉ bác sĩ mới được từ chối lịch');
    }

    return this.bookingRepo.manager.transaction(async (manager) => {
      const bookingRepo = manager.getRepository(Booking);
      const slotRepo = manager.getRepository(DoctorAvailableSlot);
      const logRepo = manager.getRepository(BookingStatusLog);

      const booking = await bookingRepo.findOne({
        where: { id: bookingId, doctorUserId: currentUser.id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!booking) throw new NotFoundException('Không tìm thấy lịch hẹn');
      if (booking.status !== 'pending') {
        throw new BadRequestException('Lịch hẹn không ở trạng thái chờ duyệt');
      }

      const oldStatus = booking.status;
      booking.status = 'rejected';
      booking.rejectionReason = reason?.trim() || null;
      await bookingRepo.save(booking);

      if (booking.availableSlotId != null) {
        const slot = await slotRepo.findOne({
          where: { id: Number(booking.availableSlotId) },
          lock: { mode: 'pessimistic_write' },
        });
        if (slot) {
          slot.bookedCount = Math.max(0, Number(slot.bookedCount) - 1);
          await slotRepo.save(slot);
        }
      }

      await logRepo.save(
        logRepo.create({
          bookingId: booking.id,
          oldStatus,
          newStatus: booking.status,
          changedBy: currentUser.id,
          note: booking.rejectionReason ? `Doctor rejected: ${booking.rejectionReason}` : 'Doctor rejected booking',
        }),
      );

      return { ok: true, id: booking.id, status: booking.status };
    });
  }

  async listMyBookings(currentUser: User) {
    if (!hasRole(currentUser, 'patient')) {
      throw new ForbiddenException('Chỉ bệnh nhân mới có thể xem lịch hẹn của mình');
    }
    const rows = await this.bookingRepo.find({
      where: { patientUserId: currentUser.id },
      order: { createdAt: 'DESC' },
      take: 200,
    });
    return rows.map(mapBookingRow);
  }

  async getMyBookingDetail(currentUser: User, bookingId: string) {
    if (!hasRole(currentUser, 'patient')) {
      throw new ForbiddenException('Chỉ bệnh nhân mới có thể xem lịch hẹn của mình');
    }
    const b = await this.bookingRepo.findOne({
      where: { id: bookingId, patientUserId: currentUser.id },
    });
    if (!b) throw new NotFoundException('Không tìm thấy lịch hẹn');

    return {
      ...mapBookingRow(b),
      doctorNote: b.doctorNote,
      rejectionReason: b.rejectionReason,
      cancelReason: b.cancelReason,
      platformFee: b.platformFee,
      updatedAt: b.updatedAt.toISOString(),
    };
  }

  async getMyBookingPayment(currentUser: User, bookingId: string) {
    if (!hasRole(currentUser, 'patient')) {
      throw new ForbiddenException('Chỉ bệnh nhân mới có thể xem thanh toán của lịch hẹn');
    }

    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId, patientUserId: currentUser.id },
    });
    if (!booking) throw new NotFoundException('Không tìm thấy lịch hẹn');

    if (booking.paymentMethod === 'pay_at_clinic') {
      return {
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        paymentMethod: booking.paymentMethod,
        paymentStatus: booking.paymentStatus,
        canPayNow: false,
        payUrl: null as string | null,
        message: 'Bạn đã chọn thanh toán tại viện.',
      };
    }

    const latestPayment = await this.paymentRepo.findOne({
      where: { bookingId: booking.id },
      order: { createdAt: 'DESC' },
    });

    let payUrl: string | null = null;
    if (latestPayment?.rawCreateResponse) {
      try {
        const parsed = JSON.parse(latestPayment.rawCreateResponse) as { payUrl?: unknown };
        payUrl = typeof parsed.payUrl === 'string' ? parsed.payUrl : null;
      } catch {
        payUrl = null;
      }
    }

    const canPayNow =
      booking.status === 'approved' &&
      (booking.paymentStatus === 'awaiting_gateway' || booking.paymentStatus === 'failed' || booking.paymentStatus === 'unpaid') &&
      Boolean(payUrl);

    return {
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      paymentMethod: booking.paymentMethod,
      paymentStatus: booking.paymentStatus,
      canPayNow,
      payUrl,
      providerOrderId: latestPayment?.providerOrderId ?? null,
      message:
        booking.status === 'pending'
          ? 'Bác sĩ chưa duyệt lịch, hệ thống chưa mở thanh toán.'
          : canPayNow
            ? 'Bạn có thể mở MoMo để hoàn tất thanh toán.'
            : 'Hiện chưa có liên kết thanh toán khả dụng.',
    };
  }

  async cancelMyBooking(currentUser: User, bookingId: string, dto: CancelBookingDto) {
    if (!hasRole(currentUser, 'patient')) {
      throw new ForbiddenException('Chỉ bệnh nhân mới có thể huỷ lịch hẹn của mình');
    }

    return this.bookingRepo.manager.transaction(async (manager) => {
      const bookingRepo = manager.getRepository(Booking);
      const slotRepo = manager.getRepository(DoctorAvailableSlot);
      const logRepo = manager.getRepository(BookingStatusLog);

      const booking = await bookingRepo.findOne({
        where: { id: bookingId, patientUserId: currentUser.id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!booking) throw new NotFoundException('Không tìm thấy lịch hẹn');

      if (booking.status !== 'pending') {
        throw new BadRequestException('Chỉ lịch hẹn pending mới có thể huỷ');
      }
      if (booking.appointmentStartAt.getTime() < Date.now()) {
        throw new BadRequestException('Lịch hẹn đã qua thời gian, không thể huỷ');
      }

      const oldStatus = booking.status;
      booking.status = 'cancelled';
      booking.cancelReason = dto.reason?.trim() || null;
      await bookingRepo.save(booking);

      if (booking.availableSlotId != null) {
        const slot = await slotRepo.findOne({
          where: { id: Number(booking.availableSlotId) },
          lock: { mode: 'pessimistic_write' },
        });
        if (slot) {
          slot.bookedCount = Math.max(0, Number(slot.bookedCount) - 1);
          await slotRepo.save(slot);
        }
      }

      await logRepo.save(
        logRepo.create({
          bookingId: booking.id,
          oldStatus,
          newStatus: booking.status,
          changedBy: currentUser.id,
          note: booking.cancelReason ? `Patient cancelled: ${booking.cancelReason}` : 'Patient cancelled booking',
        }),
      );

      return { ok: true, id: booking.id, status: booking.status };
    });
  }

  async listDoctorBookings(currentUser: User) {
    if (!hasRole(currentUser, 'doctor')) {
      throw new ForbiddenException('Chỉ bác sĩ mới có thể xem lịch hẹn của mình');
    }
    const rows = await this.bookingRepo.find({
      where: { doctorUserId: currentUser.id },
      order: { createdAt: 'DESC' },
      take: 200,
    });

    const patientIds = Array.from(
      new Set(rows.map((b) => b.patientUserId).filter((id): id is string => typeof id === 'string' && id.length > 0)),
    );
    const patientUsers = patientIds.length
      ? await this.userRepo.find({
          where: patientIds.map((id) => ({ id })),
          select: ['id', 'fullName', 'email', 'phone'],
        })
      : [];
    const patientById = new Map(patientUsers.map((u) => [u.id, u]));

    return rows.map((b) => {
      const patient = b.patientUserId ? patientById.get(b.patientUserId) : undefined;
      return {
      ...mapBookingRow(b),
      patientUserId: b.patientUserId,
      patientFullName: patient?.fullName ?? null,
      patientEmail: patient?.email ?? null,
      patientPhone: patient?.phone ?? null,
      guestFullName: b.guestFullName,
      guestPhone: b.guestPhone,
      guestEmail: b.guestEmail,
      };
    });
  }
}
