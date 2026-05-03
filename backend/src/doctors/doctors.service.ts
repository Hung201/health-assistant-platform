import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { Booking } from '../entities/booking.entity';
import { DoctorAvailableSlot } from '../entities/doctor-available-slot.entity';
import { DoctorProfile } from '../entities/doctor-profile.entity';
import { DoctorReview } from '../entities/doctor-review.entity';
import { DoctorSpecialty } from '../entities/doctor-specialty.entity';
import { Specialty } from '../entities/specialty.entity';
import { User } from '../entities/user.entity';
import { CreateSlotDto } from './dto/create-slot.dto';
import { CreateDoctorReviewDto } from './dto/create-doctor-review.dto';

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
  ratingAverage: number;
  ratingCount: number;
  recommendationRate: number;
  rankingScore: number;
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

export type PublicDoctorReview = {
  id: number;
  rating: number;
  bedsideManner: number | null;
  clarity: number | null;
  waitTime: number | null;
  comment: string | null;
  isAnonymous: boolean;
  patientName: string;
  createdAt: string;
};

export type DoctorRatingSummary = {
  doctorUserId: string;
  ratingAverage: number;
  ratingCount: number;
  recommendationRate: number;
  rankingScore: number;
};

export type RecommendDoctorsOptions = {
  specialtyId: number;
  limit?: number;
  locationHint?: string | null;
  workplaceQuery?: string | null;
  allowCrossProvinceFallback?: boolean;
};

type HardLocationScope = 'district' | 'province';

type WorkplaceSignals = {
  districtHint?: string;
  provinceHint?: string;
  fullPhrase?: string;
  keywords: string[];
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
    @InjectRepository(DoctorReview)
    private readonly doctorReviewRepo: Repository<DoctorReview>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
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

  private normalizeInput(value?: string | null): string {
    return (value ?? '').trim().replace(/\s+/g, ' ');
  }

  private toKeywords(value?: string | null): string[] {
    const text = this.normalizeInput(value).toLowerCase();
    if (!text) return [];
    const stopWords = new Set([
      'o',
      'ở',
      'tai',
      'tại',
      'gan',
      'gần',
      'phong',
      'phòng',
      'kham',
      'khám',
      'benh',
      'bệnh',
      'vien',
      'viện',
      'clinic',
      'hospital',
    ]);
    const tokens = text
      .split(/[\s,.-/]+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 2 && !stopWords.has(t));
    return Array.from(new Set(tokens)).slice(0, 8);
  }

  private buildWorkplaceSignals(workplaceQuery?: string, locationHint?: string): WorkplaceSignals {
    const cleanWorkplaceQuery = this.normalizeInput(workplaceQuery);
    const cleanLocationHint = this.normalizeInput(locationHint);
    const locationParts = cleanLocationHint
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    const districtHint = locationParts.length >= 2 ? locationParts[0] : undefined;
    const provinceHint = locationParts.length >= 1 ? locationParts[locationParts.length - 1] : undefined;
    const fullPhrase = cleanWorkplaceQuery || cleanLocationHint || undefined;
    const keywords = this.toKeywords([cleanWorkplaceQuery, cleanLocationHint].filter(Boolean).join(' '));

    return { districtHint, provinceHint, fullPhrase, keywords };
  }

  private applyRanking(qb: SelectQueryBuilder<DoctorProfile>, signals: WorkplaceSignals): void {
    const workplaceExpr =
      "unaccent(lower(coalesce(d.workplace_name, '') || ' ' || coalesce(d.workplace_address, '')))";
    const hasAvailableSlotExpr =
      "CASE WHEN EXISTS (SELECT 1 FROM doctor_available_slots s WHERE s.doctor_user_id = d.user_id AND s.start_at >= NOW() AND s.booked_count < s.max_bookings AND s.status = 'available') THEN 1 ELSE 0 END";
    const nextAvailableSlotExpr =
      "(SELECT MIN(s.start_at) FROM doctor_available_slots s WHERE s.doctor_user_id = d.user_id AND s.start_at >= NOW() AND s.booked_count < s.max_bookings AND s.status = 'available')";
    const ratingAverageExpr =
      "(SELECT COALESCE(AVG(r.rating), 0) FROM doctor_reviews r WHERE r.doctor_user_id = d.user_id AND r.status = 'published')";
    const ratingCountExpr =
      "(SELECT COUNT(1) FROM doctor_reviews r WHERE r.doctor_user_id = d.user_id AND r.status = 'published')";
    const recommendationRateExpr =
      "(SELECT COALESCE(SUM(CASE WHEN r.rating >= 4 THEN 1 ELSE 0 END)::decimal / NULLIF(COUNT(1), 0), 0) FROM doctor_reviews r WHERE r.doctor_user_id = d.user_id AND r.status = 'published')";
    const globalAverageExpr =
      "(SELECT COALESCE(AVG(r.rating), 0) FROM doctor_reviews r WHERE r.status = 'published')";
    const minSampleSizeExpr = '5';
    const bayesianRatingExpr = `((((${ratingCountExpr})::decimal / ((${ratingCountExpr})::decimal + ${minSampleSizeExpr})) * (${ratingAverageExpr})) + ((${minSampleSizeExpr}::decimal / ((${ratingCountExpr})::decimal + ${minSampleSizeExpr})) * (${globalAverageExpr})))`;

    const scorePieces: string[] = [];
    if (signals.districtHint) {
      qb.setParameter('districtHint', signals.districtHint);
      scorePieces.push(
        `CASE WHEN ${workplaceExpr} LIKE '%' || unaccent(lower(:districtHint)) || '%' THEN 40 ELSE 0 END`,
      );
    }
    if (signals.provinceHint) {
      qb.setParameter('provinceHint', signals.provinceHint);
      scorePieces.push(
        `CASE WHEN ${workplaceExpr} LIKE '%' || unaccent(lower(:provinceHint)) || '%' THEN 25 ELSE 0 END`,
      );
    }
    if (signals.fullPhrase) {
      qb.setParameter('fullPhrase', signals.fullPhrase);
      scorePieces.push(
        `CASE WHEN ${workplaceExpr} LIKE '%' || unaccent(lower(:fullPhrase)) || '%' THEN 15 ELSE 0 END`,
      );
    }
    if (signals.keywords.length > 0) {
      const keywordMatches: string[] = [];
      signals.keywords.forEach((keyword, idx) => {
        const name = `workplaceKeyword${idx}`;
        qb.setParameter(name, keyword);
        keywordMatches.push(`${workplaceExpr} LIKE '%' || unaccent(lower(:${name})) || '%'`);
      });
      scorePieces.push(`CASE WHEN (${keywordMatches.join(' OR ')}) THEN 10 ELSE 0 END`);
    }

    const workplaceScoreExpr = scorePieces.length > 0 ? scorePieces.join(' + ') : '0';

    qb.addSelect(workplaceScoreExpr, 'workplace_score');
    qb.addSelect(hasAvailableSlotExpr, 'has_available_slot');
    qb.addSelect(nextAvailableSlotExpr, 'next_available_slot');
    qb.addSelect(ratingAverageExpr, 'rating_average');
    qb.addSelect(ratingCountExpr, 'rating_count');
    qb.addSelect(recommendationRateExpr, 'recommendation_rate');
    qb.addSelect(bayesianRatingExpr, 'ranking_score');
    qb.orderBy('workplace_score', 'DESC');
    qb.addOrderBy('has_available_slot', 'DESC');
    qb.addOrderBy('ranking_score', 'DESC');
    qb.addOrderBy('d.priorityScore', 'DESC');
    qb.addOrderBy('d.yearsOfExperience', 'DESC');
    qb.addOrderBy('next_available_slot', 'ASC', 'NULLS LAST');
    qb.addOrderBy('d.createdAt', 'DESC');
  }

  async listPublicDoctors(params: {
    specialtyId?: number;
    provinceCode?: string;
    districtCode?: string;
    workplaceQuery?: string;
    locationHint?: string;
    hardLocationScope?: HardLocationScope;
    excludeDoctorUserIds?: string[];
    page?: number;
    limit?: number;
  }): Promise<{ items: PublicDoctorCard[]; total: number; page: number; limit: number }> {
    const safeLimit = Math.min(Math.max(params.limit ?? 20, 1), 100);
    const safePage = Math.max(params.page ?? 1, 1);
    const specialtyId = params.specialtyId;
    const qb = this.doctorRepo
      .createQueryBuilder('d')
      .innerJoinAndSelect('d.user', 'u')
      .where('d.isVerified = TRUE')
      .andWhere('d.verificationStatus = :status', { status: 'approved' });

    if (specialtyId != null) {
      qb.innerJoin(
        DoctorSpecialty,
        'ds_filter',
        'ds_filter.doctorUserId = d.userId AND ds_filter.specialtyId = :sid AND ds_filter.isPrimary = TRUE',
        { sid: specialtyId },
      );
    }
    if (params.provinceCode) {
      qb.andWhere('d.province_code = :provinceCode', { provinceCode: params.provinceCode });
    }
    if (params.districtCode) {
      qb.andWhere('d.district_code = :districtCode', { districtCode: params.districtCode });
    }
    if (params.excludeDoctorUserIds && params.excludeDoctorUserIds.length > 0) {
      qb.andWhere('d.user_id NOT IN (:...excludeDoctorUserIds)', {
        excludeDoctorUserIds: params.excludeDoctorUserIds,
      });
    }

    const signals = this.buildWorkplaceSignals(params.workplaceQuery, params.locationHint);
    const workplaceExpr =
      "unaccent(lower(coalesce(d.workplace_name, '') || ' ' || coalesce(d.workplace_address, '')))";
    if (params.hardLocationScope === 'district' && signals.districtHint) {
      qb.setParameter('hardDistrictHint', signals.districtHint);
      qb.andWhere(`${workplaceExpr} LIKE '%' || unaccent(lower(:hardDistrictHint)) || '%'`);
    } else if (params.hardLocationScope === 'province' && signals.provinceHint) {
      qb.setParameter('hardProvinceHint', signals.provinceHint);
      qb.andWhere(`${workplaceExpr} LIKE '%' || unaccent(lower(:hardProvinceHint)) || '%'`);
    }

    const total = await qb.getCount();
    this.applyRanking(qb, signals);
    const { entities: doctors, raw } = await qb
      .offset((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .getRawAndEntities();
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

    const items = doctors.map((d, idx) => ({
      ...(this.mapRatingStats(raw[idx])),
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

  async recommendDoctors(options: RecommendDoctorsOptions): Promise<PublicDoctorCard[]> {
    const limit = options.limit ?? 3;
    const allowCrossProvinceFallback = options.allowCrossProvinceFallback ?? true;
    const locationHint = options.locationHint ?? undefined;
    const workplaceQuery = options.workplaceQuery ?? undefined;
    const signals = this.buildWorkplaceSignals(workplaceQuery, locationHint);

    const selected: PublicDoctorCard[] = [];
    const selectedIds = new Set<string>();

    const appendUnique = (items: PublicDoctorCard[]) => {
      for (const item of items) {
        if (selectedIds.has(item.userId)) continue;
        selected.push(item);
        selectedIds.add(item.userId);
        if (selected.length >= limit) break;
      }
    };

    const fetchStage = async (hardLocationScope?: HardLocationScope) => {
      const result = await this.listPublicDoctors({
        specialtyId: options.specialtyId,
        workplaceQuery,
        locationHint,
        hardLocationScope,
        excludeDoctorUserIds: Array.from(selectedIds),
        page: 1,
        limit: limit - selected.length,
      });
      appendUnique(result.items);
    };

    // Stage 1: same district first (if location has district signal)
    if (signals.districtHint) {
      await fetchStage('district');
    }

    // Stage 2: same province next (if still missing and province signal exists)
    if (selected.length < limit && signals.provinceHint) {
      await fetchStage('province');
    }

    // Stage 3: cross-province fallback only when still missing.
    if (allowCrossProvinceFallback && selected.length < limit) {
      await fetchStage(undefined);
    }

    return selected.slice(0, limit);
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

    const summary = await this.getDoctorRatingSummary(doctorUserId);
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
      ratingAverage: summary.ratingAverage,
      ratingCount: summary.ratingCount,
      recommendationRate: summary.recommendationRate,
      rankingScore: summary.rankingScore,
      specialties,
      bio: d.bio,
      yearsOfExperience: d.yearsOfExperience,
      licenseNumber: d.licenseNumber,
    };
  }

  private mapRatingStats(rawRow: Record<string, unknown> | undefined): Pick<
    PublicDoctorCard,
    'ratingAverage' | 'ratingCount' | 'recommendationRate' | 'rankingScore'
  > {
    const ratingAverage = Number(rawRow?.rating_average ?? 0);
    const ratingCount = Number(rawRow?.rating_count ?? 0);
    const recommendationRate = Number(rawRow?.recommendation_rate ?? 0);
    const rankingScore = Number(rawRow?.ranking_score ?? 0);
    return {
      ratingAverage: Number.isFinite(ratingAverage) ? Number(ratingAverage.toFixed(2)) : 0,
      ratingCount: Number.isFinite(ratingCount) ? ratingCount : 0,
      recommendationRate: Number.isFinite(recommendationRate)
        ? Number((recommendationRate * 100).toFixed(2))
        : 0,
      rankingScore: Number.isFinite(rankingScore) ? Number(rankingScore.toFixed(4)) : 0,
    };
  }

  async createDoctorReview(
    currentUser: User,
    doctorUserId: string,
    dto: CreateDoctorReviewDto,
  ): Promise<{ ok: boolean; reviewId: number }> {
    if (!this.hasRole(currentUser, 'patient')) {
      throw new ForbiddenException('Chỉ bệnh nhân mới có thể đánh giá bác sĩ');
    }

    const booking = await this.bookingRepo.findOne({
      where: { id: dto.bookingId },
    });
    if (!booking) throw new NotFoundException('Không tìm thấy booking');
    if (booking.doctorUserId !== doctorUserId) {
      throw new BadRequestException('Booking không thuộc bác sĩ này');
    }
    if (booking.patientUserId !== currentUser.id) {
      throw new ForbiddenException('Bạn chỉ có thể đánh giá booking của chính mình');
    }
    const canReview =
      booking.status === 'completed' ||
      (booking.status === 'approved' && booking.appointmentEndAt.getTime() <= Date.now());
    if (!canReview) {
      throw new BadRequestException('Chỉ được đánh giá sau khi buổi khám đã kết thúc');
    }

    const existed = await this.doctorReviewRepo.findOne({ where: { bookingId: dto.bookingId } });
    if (existed) throw new BadRequestException('Booking này đã được đánh giá');

    const review = await this.doctorReviewRepo.save(
      this.doctorReviewRepo.create({
        bookingId: dto.bookingId,
        doctorUserId,
        patientUserId: currentUser.id,
        rating: dto.rating,
        bedsideManner: dto.bedsideManner ?? null,
        clarity: dto.clarity ?? null,
        waitTime: dto.waitTime ?? null,
        comment: dto.comment?.trim() || null,
        isAnonymous: dto.isAnonymous ?? false,
        status: 'published',
      }),
    );
    return { ok: true, reviewId: Number(review.id) };
  }

  async listDoctorReviews(
    doctorUserId: string,
    page = 1,
    limit = 20,
  ): Promise<{ items: PublicDoctorReview[]; total: number; page: number; limit: number }> {
    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const [rows, total] = await this.doctorReviewRepo.findAndCount({
      where: { doctorUserId, status: 'published' },
      relations: ['patient'],
      order: { createdAt: 'DESC' },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    });
    return {
      items: rows.map((r) => ({
        id: Number(r.id),
        rating: r.rating,
        bedsideManner: r.bedsideManner,
        clarity: r.clarity,
        waitTime: r.waitTime,
        comment: r.comment,
        isAnonymous: r.isAnonymous,
        patientName: r.isAnonymous ? 'Ẩn danh' : r.patient?.fullName ?? 'Bệnh nhân',
        createdAt: r.createdAt.toISOString(),
      })),
      total,
      page: safePage,
      limit: safeLimit,
    };
  }

  async getDoctorRatingSummary(doctorUserId: string): Promise<DoctorRatingSummary> {
    const row = await this.doctorReviewRepo
      .createQueryBuilder('r')
      .select('COALESCE(AVG(r.rating), 0)', 'ratingAverage')
      .addSelect('COUNT(1)', 'ratingCount')
      .addSelect(
        'COALESCE(SUM(CASE WHEN r.rating >= 4 THEN 1 ELSE 0 END)::decimal / NULLIF(COUNT(1), 0), 0)',
        'recommendationRate',
      )
      .where('r.doctor_user_id = :doctorUserId', { doctorUserId })
      .andWhere('r.status = :status', { status: 'published' })
      .getRawOne<
        { ratingAverage?: string; ratingaverage?: string; ratingCount?: string; ratingcount?: string; recommendationRate?: string; recommendationrate?: string }
      >();

    const ratingAverage = Number(row?.ratingAverage ?? row?.ratingaverage ?? 0);
    const ratingCount = Number(row?.ratingCount ?? row?.ratingcount ?? 0);
    const recommendationRate = Number(row?.recommendationRate ?? row?.recommendationrate ?? 0);

    const global = await this.doctorReviewRepo
      .createQueryBuilder('r')
      .select('COALESCE(AVG(r.rating), 0)', 'globalAverage')
      .where('r.status = :status', { status: 'published' })
      .getRawOne<{ globalAverage?: string; globalaverage?: string }>();
    const globalAverage = Number(global?.globalAverage ?? global?.globalaverage ?? 0);
    const m = 5;
    const rankingScore =
      ((ratingCount / (ratingCount + m)) * ratingAverage) +
      ((m / (ratingCount + m)) * globalAverage);

    return {
      doctorUserId,
      ratingAverage: Number.isFinite(ratingAverage) ? Number(ratingAverage.toFixed(2)) : 0,
      ratingCount: Number.isFinite(ratingCount) ? ratingCount : 0,
      recommendationRate: Number.isFinite(recommendationRate)
        ? Number((recommendationRate * 100).toFixed(2))
        : 0,
      rankingScore: Number.isFinite(rankingScore) ? Number(rankingScore.toFixed(4)) : 0,
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
