import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Booking } from '../entities/booking.entity';
import { BookingStatusLog } from '../entities/booking-status-log.entity';
import { DoctorAvailableSlot } from '../entities/doctor-available-slot.entity';
import { DoctorProfile } from '../entities/doctor-profile.entity';
import { PatientProfile } from '../entities/patient-profile.entity';
import { Specialty } from '../entities/specialty.entity';
import { User } from '../entities/user.entity';
import { CreateBookingDto } from './dto/create-booking.dto';

function hasRole(user: User, code: string): boolean {
  return Boolean(
    user.userRoles?.some((ur) => ur.role?.code === code),
  );
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

@Injectable()
export class BookingsService {
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
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async createBooking(currentUser: User, dto: CreateBookingDto) {
    if (!hasRole(currentUser, 'patient')) {
      throw new ForbiddenException('Chỉ bệnh nhân mới có thể đặt lịch');
    }
    const patient = await this.patientRepo.findOne({
      where: { userId: currentUser.id },
    });
    if (!patient) throw new ForbiddenException('Không tìm thấy hồ sơ bệnh nhân');

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

    const now = new Date();
    let bookingCode = `BK-${yyyymmdd(now)}-${rand6()}`;
    for (let i = 0; i < 5; i++) {
      const exists = await this.bookingRepo.findOne({ where: { bookingCode } });
      if (!exists) break;
      bookingCode = `BK-${yyyymmdd(now)}-${rand6()}`;
    }

    return this.bookingRepo.manager.transaction(async (manager) => {
      // pessimistic lock to avoid oversell
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
          specialtyId: Number(specialtyId),
          availableSlotId: Number(lockedSlot.id),
          patientNote: dto.patientNote?.trim() || null,
          status: 'pending',
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
      };
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
    return rows.map((b) => ({
      id: b.id,
      bookingCode: b.bookingCode,
      status: b.status,
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
    }));
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
    return rows.map((b) => ({
      id: b.id,
      bookingCode: b.bookingCode,
      status: b.status,
      appointmentDate: b.appointmentDate instanceof Date ? b.appointmentDate.toISOString().slice(0, 10) : String(b.appointmentDate),
      appointmentStartAt: b.appointmentStartAt.toISOString(),
      appointmentEndAt: b.appointmentEndAt.toISOString(),
      patientUserId: b.patientUserId,
      doctorUserId: b.doctorUserId,
      doctorName: b.doctorNameSnapshot,
      specialtyId: Number(b.specialtyId),
      specialtyName: b.specialtyNameSnapshot,
      patientNote: b.patientNote,
      consultationFee: b.consultationFee,
      totalFee: b.totalFee,
      createdAt: b.createdAt.toISOString(),
    }));
  }
}

