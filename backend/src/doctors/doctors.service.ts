import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { DoctorAvailableSlot } from '../entities/doctor-available-slot.entity';
import { DoctorProfile } from '../entities/doctor-profile.entity';
import { DoctorSpecialty } from '../entities/doctor-specialty.entity';
import { Specialty } from '../entities/specialty.entity';
import { User } from '../entities/user.entity';
import { CreateSlotDto } from './dto/create-slot.dto';

export type PublicDoctorCard = {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  professionalTitle: string | null;
  workplaceName: string | null;
  workplaceAddress: string | null;
  provinceCode: string | null;
  districtCode: string | null;
  wardCode: string | null;
  consultationFee: string;
  specialties: Array<{ id: number; name: string; isPrimary: boolean }>;
};

export type PublicDoctorDetail = PublicDoctorCard & {
  bio: string | null;
  yearsOfExperience: number | null;
  licenseNumber: string | null;
};

export type PublicDoctorSlot = {
  id: number;
  specialtyId: number | null;
  slotDate: string;
  startAt: string;
  endAt: string;
  maxBookings: number;
  bookedCount: number;
  status: string;
};

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(DoctorProfile)
    private readonly doctorRepo: Repository<DoctorProfile>,
    @InjectRepository(DoctorAvailableSlot)
    private readonly slotRepo: Repository<DoctorAvailableSlot>,
    @InjectRepository(DoctorSpecialty)
    private readonly doctorSpecialtyRepo: Repository<DoctorSpecialty>,
    @InjectRepository(Specialty)
    private readonly specialtyRepo: Repository<Specialty>,
  ) {}

  private hasRole(user: User, code: string): boolean {
    return Boolean(user.userRoles?.some((ur) => ur.role?.code === code));
  }

  private async getPrimarySpecialtyLink(doctorUserId: string): Promise<DoctorSpecialty | null> {
    const links = await this.doctorSpecialtyRepo.find({
      where: { doctorUserId },
      order: { isPrimary: 'DESC', createdAt: 'ASC' },
      take: 1,
    });
    return links[0] ?? null;
  }

  async listPublicDoctors(params: {
    specialtyId?: number;
    provinceCode?: string;
    districtCode?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: PublicDoctorCard[]; total: number; page: number; limit: number }> {
    const safeLimit = Math.min(Math.max(params.limit ?? 20, 1), 100);
    const safePage = Math.max(params.page ?? 1, 1);
    const specialtyId = params.specialtyId;
    const qb = this.doctorRepo
      .createQueryBuilder('d')
      .innerJoinAndSelect('d.user', 'u')
      .where('d.is_verified = TRUE')
      .andWhere('d.verification_status = :status', { status: 'approved' })
      .orderBy('d.priorityScore', 'DESC')
      .addOrderBy('d.createdAt', 'DESC');

    if (specialtyId != null) {
      qb.innerJoin(
        DoctorSpecialty,
        'ds_filter',
        'ds_filter.doctor_user_id = d.user_id AND ds_filter.specialty_id = :sid AND ds_filter.is_primary = TRUE',
        { sid: specialtyId },
      );
    }
    if (params.provinceCode) {
      qb.andWhere('d.province_code = :provinceCode', { provinceCode: params.provinceCode });
    }
    if (params.districtCode) {
      qb.andWhere('d.district_code = :districtCode', { districtCode: params.districtCode });
    }

    const total = await qb.getCount();
    const doctors = await qb.skip((safePage - 1) * safeLimit).take(safeLimit).getMany();
    if (doctors.length === 0) {
      return { items: [], total, page: safePage, limit: safeLimit };
    }

    const doctorIds = doctors.map((d) => d.userId);
    const links = await this.doctorSpecialtyRepo.find({
      where: doctorIds.map((id) => ({ doctorUserId: id })),
      order: { isPrimary: 'DESC', createdAt: 'ASC' },
    });

    const specIds = Array.from(new Set(links.map((l) => Number(l.specialtyId))));
    const specs = specIds.length
      ? await this.specialtyRepo.find({
          where: specIds.map((id) => ({ id, status: 'active' })),
          select: ['id', 'name'],
        })
      : [];
    const specById = new Map(specs.map((s) => [Number(s.id), s]));

    const byDoctor = new Map<string, PublicDoctorCard['specialties']>();
    for (const l of links) {
      if (byDoctor.has(l.doctorUserId)) continue;
      const sid = Number(l.specialtyId);
      const s = specById.get(sid);
      if (!s) continue;
      byDoctor.set(l.doctorUserId, [{ id: sid, name: s.name, isPrimary: true }]);
    }

    const items = doctors.map((d) => ({
      userId: d.userId,
      fullName: d.user?.fullName ?? '',
      avatarUrl: d.user?.avatarUrl ?? null,
      professionalTitle: d.professionalTitle,
      workplaceName: d.workplaceName,
      workplaceAddress: d.workplaceAddress,
      provinceCode: d.provinceCode,
      districtCode: d.districtCode,
      wardCode: d.wardCode,
      consultationFee: d.consultationFee,
      specialties: byDoctor.get(d.userId) ?? [],
    }));
    return { items, total, page: safePage, limit: safeLimit };
  }

  async recommendDoctors(specialtyId: number, limit: number = 3): Promise<PublicDoctorCard[]> {
    const qb = this.doctorRepo
      .createQueryBuilder('d')
      .innerJoinAndSelect('d.user', 'u')
      .innerJoin(
        DoctorSpecialty,
        'ds_filter',
        'ds_filter.doctor_user_id = d.user_id AND ds_filter.specialty_id = :sid AND ds_filter.is_primary = TRUE',
        { sid: specialtyId }
      )
      .innerJoin(
        DoctorAvailableSlot,
        'slot',
        'slot.doctor_user_id = d.user_id AND slot.start_at >= NOW() AND slot.booked_count < slot.max_bookings AND slot.status = :slotStatus',
        { slotStatus: 'available' }
      )
      .where('d.is_verified = TRUE')
      .andWhere('d.verification_status = :status', { status: 'approved' })
      .groupBy('d.user_id')
      .addGroupBy('u.id')
      .orderBy('d.priority_score', 'DESC')
      .addOrderBy('d.years_of_experience', 'DESC')
      .addOrderBy('MIN(slot.start_at)', 'ASC')
      .take(limit);

    const doctors = await qb.getMany();
    if (doctors.length === 0) return [];

    const doctorIds = doctors.map((d) => d.userId);
    const links = await this.doctorSpecialtyRepo.find({
      where: doctorIds.map((id) => ({ doctorUserId: id })),
      order: { isPrimary: 'DESC', createdAt: 'ASC' },
    });

    const specIds = Array.from(new Set(links.map((l) => Number(l.specialtyId))));
    const specs = specIds.length
      ? await this.specialtyRepo.find({
          where: specIds.map((id) => ({ id, status: 'active' })),
          select: ['id', 'name'],
        })
      : [];
    const specById = new Map(specs.map((s) => [Number(s.id), s]));

    const byDoctor = new Map<string, PublicDoctorCard['specialties']>();
    for (const l of links) {
      if (byDoctor.has(l.doctorUserId)) continue;
      const sid = Number(l.specialtyId);
      const s = specById.get(sid);
      if (!s) continue;
      byDoctor.set(l.doctorUserId, [{ id: sid, name: s.name, isPrimary: true }]);
    }

    return doctors.map((d) => ({
      userId: d.userId,
      fullName: d.user?.fullName ?? '',
      avatarUrl: d.user?.avatarUrl ?? null,
      professionalTitle: d.professionalTitle,
      workplaceName: d.workplaceName,
      workplaceAddress: d.workplaceAddress,
      provinceCode: d.provinceCode,
      districtCode: d.districtCode,
      wardCode: d.wardCode,
      consultationFee: d.consultationFee,
      specialties: byDoctor.get(d.userId) ?? [],
    }));
  }

  async getPublicDoctorDetail(doctorUserId: string): Promise<PublicDoctorDetail> {
    const d = await this.doctorRepo.findOne({
      where: { userId: doctorUserId, isVerified: true, verificationStatus: 'approved' },
      relations: ['user'],
    });
    if (!d) throw new NotFoundException('Không tìm thấy bác sĩ');

    const primaryLink = await this.getPrimarySpecialtyLink(doctorUserId);
    const specIds = primaryLink ? [Number(primaryLink.specialtyId)] : [];
    const specs = specIds.length
      ? await this.specialtyRepo.find({
          where: specIds.map((id) => ({ id, status: 'active' })),
          select: ['id', 'name'],
        })
      : [];
    const specById = new Map(specs.map((s) => [Number(s.id), s]));
    const specialties = primaryLink
      ? (() => {
          const sid = Number(primaryLink.specialtyId);
          const s = specById.get(sid);
          if (!s) return [];
          return [{ id: sid, name: s.name, isPrimary: true }];
        })()
      : [];

    return {
      userId: d.userId,
      fullName: d.user?.fullName ?? '',
      avatarUrl: d.user?.avatarUrl ?? null,
      professionalTitle: d.professionalTitle,
      workplaceName: d.workplaceName,
      workplaceAddress: d.workplaceAddress,
      provinceCode: d.provinceCode,
      districtCode: d.districtCode,
      wardCode: d.wardCode,
      consultationFee: d.consultationFee,
      specialties,
      bio: d.bio,
      yearsOfExperience: d.yearsOfExperience,
      licenseNumber: d.licenseNumber,
    };
  }

  async listPublicSlots(params: {
    doctorUserId: string;
    specialtyId?: number;
    from?: Date;
    to?: Date;
  }): Promise<PublicDoctorSlot[]> {
    const qb = this.slotRepo
      .createQueryBuilder('s')
      .where('s.doctor_user_id = :doctorUserId', { doctorUserId: params.doctorUserId })
      .andWhere('s.status = :status', { status: 'available' })
      .andWhere('s.booked_count < s.max_bookings')
      .andWhere('s.start_at >= NOW()')
      .orderBy('s.start_at', 'ASC');

    if (params.specialtyId != null) {
      qb.andWhere('s.specialty_id = :sid', { sid: params.specialtyId });
    }
    if (params.from) {
      qb.andWhere('s.start_at >= :from', { from: params.from.toISOString() });
    }
    if (params.to) {
      qb.andWhere('s.start_at <= :to', { to: params.to.toISOString() });
    }

    const rows = await qb.getMany();
    return rows.map((s) => ({
      id: typeof s.id === 'string' ? Number(s.id) : s.id,
      specialtyId: s.specialtyId == null ? null : Number(s.specialtyId),
      slotDate: s.slotDate instanceof Date ? s.slotDate.toISOString().slice(0, 10) : String(s.slotDate),
      startAt: s.startAt.toISOString(),
      endAt: s.endAt.toISOString(),
      maxBookings: s.maxBookings,
      bookedCount: s.bookedCount,
      status: s.status,
    }));
  }

  /** Doctor portal: list my slots (including non-available). */
  async listMySlots(currentUser: User): Promise<PublicDoctorSlot[]> {
    if (!this.hasRole(currentUser, 'doctor')) throw new ForbiddenException('Chỉ bác sĩ');
    const rows = await this.slotRepo.find({
      where: { doctorUserId: currentUser.id },
      order: { startAt: 'ASC' },
      take: 500,
    });
    return rows.map((s) => ({
      id: typeof s.id === 'string' ? Number(s.id) : s.id,
      specialtyId: s.specialtyId == null ? null : Number(s.specialtyId),
      slotDate: s.slotDate instanceof Date ? s.slotDate.toISOString().slice(0, 10) : String(s.slotDate),
      startAt: s.startAt.toISOString(),
      endAt: s.endAt.toISOString(),
      maxBookings: s.maxBookings,
      bookedCount: s.bookedCount,
      status: s.status,
    }));
  }

  async createMySlot(currentUser: User, dto: CreateSlotDto) {
    if (!this.hasRole(currentUser, 'doctor')) throw new ForbiddenException('Chỉ bác sĩ');
    const profile = await this.doctorRepo.findOne({ where: { userId: currentUser.id } });
    if (!profile) throw new ForbiddenException('Không tìm thấy hồ sơ bác sĩ');
    if (!profile.isVerified || profile.verificationStatus !== 'approved') {
      throw new ForbiddenException('Bác sĩ chưa được duyệt');
    }

    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      throw new BadRequestException('Thời gian không hợp lệ');
    }
    if (endAt <= startAt) throw new BadRequestException('endAt phải sau startAt');
    if (startAt.getTime() < Date.now()) throw new BadRequestException('startAt phải ở tương lai');

    const primaryLink = await this.getPrimarySpecialtyLink(currentUser.id);
    if (!primaryLink) {
      throw new BadRequestException('Bác sĩ chưa được gán chuyên khoa chính');
    }
    const spec = await this.specialtyRepo.findOne({
      where: { id: Number(primaryLink.specialtyId), status: 'active' },
    });
    if (!spec) throw new BadRequestException('Chuyên khoa chính không hợp lệ hoặc đã ngưng hoạt động');
    const specialtyId = Number(spec.id);

    const slotDate = new Date(startAt.toISOString().slice(0, 10));

    // Prevent overlapping slot windows for the same doctor.
    const overlapped = await this.slotRepo
      .createQueryBuilder('s')
      .where('s.doctor_user_id = :doctorUserId', { doctorUserId: currentUser.id })
      .andWhere('s.status <> :cancelled', { cancelled: 'cancelled' })
      .andWhere('s.start_at < :newEndAt', { newEndAt: endAt.toISOString() })
      .andWhere('s.end_at > :newStartAt', { newStartAt: startAt.toISOString() })
      .getOne();
    if (overlapped) {
      throw new BadRequestException('Khung giờ bị trùng với slot đã tồn tại');
    }

    const slot = await this.slotRepo.save(
      this.slotRepo.create({
        doctorUserId: currentUser.id,
        specialtyId,
        slotDate,
        startAt,
        endAt,
        maxBookings: dto.maxBookings,
        bookedCount: 0,
        status: 'available',
        source: 'doctor',
      }),
    );
    return { ok: true, id: Number(slot.id) };
  }

  async cancelMySlot(currentUser: User, slotId: number) {
    if (!this.hasRole(currentUser, 'doctor')) throw new ForbiddenException('Chỉ bác sĩ');
    const slot = await this.slotRepo.findOne({ where: { id: slotId } });
    if (!slot) throw new NotFoundException('Không tìm thấy slot');
    if (slot.doctorUserId !== currentUser.id) throw new ForbiddenException('Không có quyền');
    if (slot.bookedCount > 0) throw new BadRequestException('Slot đã có booking, không thể huỷ');
    slot.status = 'cancelled';
    await this.slotRepo.save(slot);
    return { ok: true, id: slotId, status: slot.status };
  }
}

