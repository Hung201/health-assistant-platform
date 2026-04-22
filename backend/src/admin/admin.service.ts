import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { PatientProfile } from '../entities/patient-profile.entity';
import { DoctorProfile } from '../entities/doctor-profile.entity';
import { Post } from '../entities/post.entity';
import { Specialty } from '../entities/specialty.entity';
import { Booking } from '../entities/booking.entity';
import { Role } from '../entities/role.entity';
import { UserRole } from '../entities/user-role.entity';
import { mergeFeaturePermissions, normalizeFeaturePermissions } from '../common/user-feature-permissions';
import { UpdateUserDto } from './dto/update-user.dto';

/** Bài viết chờ admin duyệt (bác sĩ gửi từ luồng soạn thảo). */
export const POST_STATUS_PENDING_REVIEW = 'pending_review';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(PatientProfile)
    private readonly patientRepo: Repository<PatientProfile>,
    @InjectRepository(DoctorProfile)
    private readonly doctorRepo: Repository<DoctorProfile>,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(Specialty)
    private readonly specialtyRepo: Repository<Specialty>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
  ) { }

  private userHasDoctorRole(u: User): boolean {
    const codes = u.userRoles?.map((ur) => ur.role?.code).filter(Boolean) ?? [];
    return codes.includes('doctor');
  }

  /** Livestream chỉ có ý nghĩa với vai trò bác sĩ. */
  private shapeFeaturePermissionsResponse(u: User): { livestream: boolean } {
    if (!this.userHasDoctorRole(u)) return { livestream: false };
    const p = normalizeFeaturePermissions(u.featurePermissions);
    return { livestream: p.livestream === true };
  }

  /** Gỡ cờ livestream trên DB nếu user không còn là bác sĩ (dữ liệu cũ). */
  private stripLivestreamPermissionIfNotDoctor(u: User): void {
    if (this.userHasDoctorRole(u)) return;
    const p = normalizeFeaturePermissions(u.featurePermissions);
    if (p.livestream) {
      u.featurePermissions = mergeFeaturePermissions(u.featurePermissions, { livestream: false }) as User['featurePermissions'];
    }
  }

  private normalizePhone(input: string): string {
    return input.replace(/\s+/g, '').slice(0, 20);
  }

  async dashboardSummary(days?: number) {
    const now = new Date();
    const allowedRanges = new Set([7, 30, 90]);
    const periodDays = days && allowedRanges.has(days) ? days : 30;
    const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(periodStart.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const [
      totalUsers,
      totalPatients,
      totalDoctors,
      pendingDoctors,
      pendingPosts,
      totalSpecialties,
      pendingBookings,
      paidBookings,
      unpaidBookings,
      awaitingGatewayBookings,
      payAtClinicBookings,
      paidRevenueRaw,
      pendingRevenueRaw,
      previousPeriodRevenueRaw,
      topDoctorsRaw,
      revenueByMethodRaw,
      revenueTrendRaw,
    ] = await Promise.all([
      this.userRepo.count(),
      this.patientRepo.count(),
      this.doctorRepo.count(),
      this.doctorRepo.count({
        where: { verificationStatus: 'pending', isVerified: false },
      }),
      this.postRepo.count({ where: { status: POST_STATUS_PENDING_REVIEW } }),
      this.specialtyRepo.count(),
      this.bookingRepo.count({ where: { status: 'pending' } }),
      this.bookingRepo
        .createQueryBuilder('b')
        .where('b.payment_status = :status', { status: 'paid' })
        .andWhere('b.created_at >= :periodStart', { periodStart: periodStart.toISOString() })
        .andWhere('b.created_at < :now', { now: now.toISOString() })
        .getCount(),
      this.bookingRepo
        .createQueryBuilder('b')
        .where('b.payment_status = :status', { status: 'unpaid' })
        .andWhere('b.created_at >= :periodStart', { periodStart: periodStart.toISOString() })
        .andWhere('b.created_at < :now', { now: now.toISOString() })
        .getCount(),
      this.bookingRepo
        .createQueryBuilder('b')
        .where('b.payment_status = :status', { status: 'awaiting_gateway' })
        .andWhere('b.created_at >= :periodStart', { periodStart: periodStart.toISOString() })
        .andWhere('b.created_at < :now', { now: now.toISOString() })
        .getCount(),
      this.bookingRepo
        .createQueryBuilder('b')
        .where('b.payment_status = :status', { status: 'pay_at_clinic' })
        .andWhere('b.created_at >= :periodStart', { periodStart: periodStart.toISOString() })
        .andWhere('b.created_at < :now', { now: now.toISOString() })
        .getCount(),
      this.bookingRepo
        .createQueryBuilder('b')
        .select('COALESCE(SUM(b.total_fee), 0)', 'value')
        .where('b.payment_status = :status', { status: 'paid' })
        .andWhere('b.created_at >= :periodStart', { periodStart: periodStart.toISOString() })
        .andWhere('b.created_at < :now', { now: now.toISOString() })
        .getRawOne<{ value: string }>(),
      this.bookingRepo
        .createQueryBuilder('b')
        .select('COALESCE(SUM(b.total_fee), 0)', 'value')
        .where('b.payment_status IN (:...statuses)', { statuses: ['awaiting_gateway', 'unpaid'] })
        .andWhere('b.created_at >= :periodStart', { periodStart: periodStart.toISOString() })
        .andWhere('b.created_at < :now', { now: now.toISOString() })
        .getRawOne<{ value: string }>(),
      this.bookingRepo
        .createQueryBuilder('b')
        .select('COALESCE(SUM(b.total_fee), 0)', 'value')
        .where('b.payment_status = :status', { status: 'paid' })
        .andWhere('b.created_at >= :previousPeriodStart', { previousPeriodStart: previousPeriodStart.toISOString() })
        .andWhere('b.created_at < :periodStart', { periodStart: periodStart.toISOString() })
        .getRawOne<{ value: string }>(),
      this.bookingRepo
        .createQueryBuilder('b')
        .select('b.doctor_user_id', 'doctorUserId')
        .addSelect('MAX(b.doctor_name_snapshot)', 'doctorName')
        .addSelect('COUNT(*)', 'paidBookings')
        .addSelect('COALESCE(SUM(b.total_fee), 0)', 'revenue')
        .where('b.payment_status = :status', { status: 'paid' })
        .andWhere('b.created_at >= :periodStart', { periodStart: periodStart.toISOString() })
        .andWhere('b.created_at < :now', { now: now.toISOString() })
        .groupBy('b.doctor_user_id')
        .orderBy('COALESCE(SUM(b.total_fee), 0)', 'DESC')
        .limit(5)
        .getRawMany<{ doctorUserId: string; doctorName: string; paidBookings: string; revenue: string }>(),
      this.bookingRepo
        .createQueryBuilder('b')
        .select('b.payment_method', 'paymentMethod')
        .addSelect('COUNT(*)', 'paidBookings')
        .addSelect('COALESCE(SUM(b.total_fee), 0)', 'revenue')
        .where('b.payment_status = :status', { status: 'paid' })
        .andWhere('b.created_at >= :periodStart', { periodStart: periodStart.toISOString() })
        .andWhere('b.created_at < :now', { now: now.toISOString() })
        .groupBy('b.payment_method')
        .orderBy('COALESCE(SUM(b.total_fee), 0)', 'DESC')
        .getRawMany<{ paymentMethod: string; paidBookings: string; revenue: string }>(),
      this.bookingRepo
        .createQueryBuilder('b')
        .select(`TO_CHAR(DATE_TRUNC('day', b.created_at), 'YYYY-MM-DD')`, 'date')
        .addSelect('COUNT(*)', 'paidBookings')
        .addSelect('COALESCE(SUM(b.total_fee), 0)', 'revenue')
        .where('b.payment_status = :status', { status: 'paid' })
        .andWhere('b.created_at >= :periodStart', { periodStart: periodStart.toISOString() })
        .andWhere('b.created_at < :now', { now: now.toISOString() })
        .groupBy(`DATE_TRUNC('day', b.created_at)`)
        .orderBy(`DATE_TRUNC('day', b.created_at)`, 'ASC')
        .getRawMany<{ date: string; paidBookings: string; revenue: string }>(),
    ]);

    const paidRevenue = Number(paidRevenueRaw?.value ?? 0);
    const pendingRevenue = Number(pendingRevenueRaw?.value ?? 0);
    const previousPeriodRevenue = Number(previousPeriodRevenueRaw?.value ?? 0);
    const paymentTrackedTotal = paidBookings + unpaidBookings + awaitingGatewayBookings + payAtClinicBookings;
    const paidRatePct = paymentTrackedTotal > 0 ? Number(((paidBookings / paymentTrackedTotal) * 100).toFixed(1)) : 0;
    const revenueGrowthPct =
      previousPeriodRevenue > 0
        ? Number((((paidRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100).toFixed(1))
        : paidRevenue > 0
          ? 100
          : 0;
    const trendByDate = new Map(
      revenueTrendRaw.map((row) => [
        row.date,
        {
          paidBookings: Number(row.paidBookings ?? 0),
          revenue: Number(row.revenue ?? 0),
        },
      ]),
    );
    const revenueTrend = Array.from({ length: periodDays }, (_, i) => {
      const d = new Date(periodStart.getTime() + i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      const found = trendByDate.get(key);
      return {
        date: key,
        paidBookings: found?.paidBookings ?? 0,
        revenue: found?.revenue ?? 0,
      };
    });

    return {
      totalUsers,
      totalPatients,
      totalDoctors,
      pendingDoctors,
      pendingPosts,
      totalSpecialties,
      pendingBookings,
      payment: {
        periodDays,
        paidBookings,
        unpaidBookings,
        awaitingGatewayBookings,
        payAtClinicBookings,
        paidRatePct,
        paidRevenue,
        pendingRevenue,
        currentMonthRevenue: paidRevenue,
        previousMonthRevenue: previousPeriodRevenue,
        periodRevenue: paidRevenue,
        previousPeriodRevenue,
        revenueGrowthPct,
      },
      revenueByMethod: revenueByMethodRaw.map((row) => ({
        paymentMethod: row.paymentMethod,
        paidBookings: Number(row.paidBookings ?? 0),
        revenue: Number(row.revenue ?? 0),
      })),
      topDoctorsByRevenue: topDoctorsRaw.map((row) => ({
        doctorUserId: row.doctorUserId,
        doctorName: row.doctorName || 'Bác sĩ',
        paidBookings: Number(row.paidBookings ?? 0),
        revenue: Number(row.revenue ?? 0),
      })),
      revenueTrend,
    };
  }

  async listUsers(page = 1, limit = 20) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(page, 1);
    const [items, total] = await this.userRepo.findAndCount({
      relations: ['userRoles', 'userRoles.role'],
      order: { createdAt: 'DESC' },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    });
    return {
      items: items.map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        phone: u.phone,
        status: u.status,
        createdAt: u.createdAt,
        roles: u.userRoles?.map((ur) => ur.role?.code).filter(Boolean) ?? [],
        featurePermissions: this.shapeFeaturePermissionsResponse(u),
      })),
      total,
      page: safePage,
      limit: safeLimit,
    };
  }

  async getUserDetail(userId: string) {
    const u = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['userRoles', 'userRoles.role', 'patientProfile', 'doctorProfile'],
    });
    if (!u) throw new NotFoundException('Không tìm thấy người dùng');
    return {
      id: u.id,
      email: u.email,
      phone: u.phone,
      fullName: u.fullName,
      status: u.status,
      avatarUrl: u.avatarUrl,
      dateOfBirth: u.dateOfBirth,
      gender: u.gender,
      createdAt: u.createdAt,
      roles: u.userRoles?.map((ur) => ur.role?.code).filter(Boolean) ?? [],
      patientProfile: u.patientProfile
        ? {
          emergencyContactName: u.patientProfile.emergencyContactName,
          emergencyContactPhone: u.patientProfile.emergencyContactPhone,
          addressLine: u.patientProfile.addressLine,
          occupation: u.patientProfile.occupation,
          bloodType: u.patientProfile.bloodType,
        }
        : null,
      doctorProfile: u.doctorProfile
        ? {
          professionalTitle: u.doctorProfile.professionalTitle,
          licenseNumber: u.doctorProfile.licenseNumber,
          yearsOfExperience: u.doctorProfile.yearsOfExperience,
          bio: u.doctorProfile.bio,
          workplaceName: u.doctorProfile.workplaceName,
          consultationFee: u.doctorProfile.consultationFee,
          isVerified: u.doctorProfile.isVerified,
          verificationStatus: u.doctorProfile.verificationStatus,
        }
        : null,
      featurePermissions: this.shapeFeaturePermissionsResponse(u),
    };
  }

  async createUser(input: {
    email: string;
    fullName: string;
    password: string;
    phone?: string;
    role: 'patient' | 'doctor' | 'admin';
  }) {
    const email = input.email.trim().toLowerCase();
    const fullName = input.fullName.trim();
    if (!email || !fullName) throw new BadRequestException('Thiếu email/fullName');

    const exists = await this.userRepo.findOne({ where: { email } });
    if (exists) throw new BadRequestException('Email đã tồn tại');

    let phone: string | null = null;
    if (input.phone != null && input.phone.trim() !== '') {
      const normalized = this.normalizePhone(input.phone);
      const taken = await this.userRepo.findOne({ where: { phone: normalized } });
      if (taken) throw new BadRequestException('Số điện thoại đã tồn tại');
      phone = normalized;
    }

    const role = await this.userRepo.manager.getRepository(Role).findOne({ where: { code: input.role } });
    if (!role) throw new BadRequestException('Role không hợp lệ');

    const passwordHash = await bcrypt.hash(input.password, 10);
    return this.userRepo.manager.transaction(async (manager) => {
      const user = await manager.getRepository(User).save(
        manager.getRepository(User).create({
          email,
          fullName,
          passwordHash,
          status: 'active',
          phone,
          featurePermissions: input.role === 'doctor' ? { livestream: false } : {},
        }),
      );
      await manager.getRepository(UserRole).save(
        manager.getRepository(UserRole).create({
          userId: user.id,
          roleId: role.id,
        }),
      );
      if (input.role === 'patient') {
        await manager.getRepository(PatientProfile).save(
          manager.getRepository(PatientProfile).create({ userId: user.id }),
        );
      }
      if (input.role === 'doctor') {
        await manager.getRepository(DoctorProfile).save(
          manager.getRepository(DoctorProfile).create({
            userId: user.id,
            isVerified: false,
            verificationStatus: 'pending',
          }),
        );
      }
      return { ok: true, id: user.id };
    });
  }

  async updateUser(userId: string, input: UpdateUserDto) {
    const u = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['userRoles', 'userRoles.role'],
    });
    if (!u) throw new NotFoundException('Không tìm thấy người dùng');

    if (input.fullName != null) {
      const fullName = input.fullName.trim();
      if (!fullName) throw new BadRequestException('fullName không hợp lệ');
      u.fullName = fullName;
    }
    if (input.phone !== undefined) {
      if (input.phone == null || input.phone.trim() === '') {
        u.phone = null;
      } else {
        const normalized = this.normalizePhone(input.phone);
        const taken = await this.userRepo.findOne({ where: { phone: normalized } });
        if (taken && taken.id !== u.id) throw new BadRequestException('Số điện thoại đã tồn tại');
        u.phone = normalized;
      }
    }
    if (input.status != null) {
      u.status = input.status;
    }
    if (input.featurePermissions != null && input.featurePermissions.livestream !== undefined) {
      const wants = input.featurePermissions.livestream;
      if (!this.userHasDoctorRole(u)) {
        if (wants === true) {
          throw new BadRequestException('Quyền livestream chỉ cấp được cho tài khoản có vai trò bác sĩ.');
        }
        u.featurePermissions = mergeFeaturePermissions(u.featurePermissions, { livestream: false }) as User['featurePermissions'];
      } else {
        u.featurePermissions = mergeFeaturePermissions(u.featurePermissions, { livestream: wants }) as User['featurePermissions'];
      }
    }
    this.stripLivestreamPermissionIfNotDoctor(u);
    await this.userRepo.save(u);
    return { ok: true, id: u.id };
  }

  async listPendingDoctors(page = 1, limit = 20) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(page, 1);
    const [rows, total] = await this.doctorRepo.findAndCount({
      where: { verificationStatus: 'pending', isVerified: false },
      relations: ['user'],
      order: { createdAt: 'ASC' },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    });
    return {
      items: rows.map((d) => ({
        userId: d.userId,
        email: d.user?.email,
        fullName: d.user?.fullName,
        professionalTitle: d.professionalTitle,
        licenseNumber: d.licenseNumber,
        workplaceName: d.workplaceName,
        createdAt: d.createdAt,
      })),
      total,
      page: safePage,
      limit: safeLimit,
    };
  }

  async approveDoctor(userId: string) {
    const profile = await this.doctorRepo.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('Không tìm thấy hồ sơ bác sĩ');
    profile.isVerified = true;
    profile.verificationStatus = 'approved';
    await this.doctorRepo.save(profile);
    return { ok: true, userId, verificationStatus: profile.verificationStatus };
  }

  async rejectDoctor(userId: string) {
    const profile = await this.doctorRepo.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('Không tìm thấy hồ sơ bác sĩ');
    profile.isVerified = false;
    profile.verificationStatus = 'rejected';
    await this.doctorRepo.save(profile);
    return { ok: true, userId, verificationStatus: profile.verificationStatus };
  }

  async listPendingPosts(page = 1, limit = 20) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(page, 1);
    const [posts, total] = await this.postRepo.findAndCount({
      where: { status: POST_STATUS_PENDING_REVIEW },
      relations: ['author', 'author.user'],
      order: { createdAt: 'DESC' },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    });
    return {
      items: posts.map((p) => ({
        id: String(p.id),
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        postType: p.postType,
        createdAt: p.createdAt,
        authorUserId: p.authorUserId,
        authorName: p.author?.user?.fullName ?? null,
        authorEmail: p.author?.user?.email ?? null,
      })),
      total,
      page: safePage,
      limit: safeLimit,
    };
  }

  async getPostDetail(postId: number) {
    const p = await this.postRepo.findOne({
      where: { id: postId },
      relations: ['author', 'author.user'],
    });
    if (!p) throw new NotFoundException('Không tìm thấy bài viết');
    return {
      id: String(p.id),
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      content: p.content,
      thumbnailUrl: p.thumbnailUrl,
      postType: p.postType,
      status: p.status,
      createdAt: p.createdAt,
      reviewedAt: (p as unknown as { reviewedAt?: Date | null }).reviewedAt ?? null,
      publishedAt: (p as unknown as { publishedAt?: Date | null }).publishedAt ?? null,
      rejectionReason: (p as unknown as { rejectionReason?: string | null }).rejectionReason ?? null,
      authorUserId: p.authorUserId,
      authorName: p.author?.user?.fullName ?? null,
      authorEmail: p.author?.user?.email ?? null,
    };
  }

  async approvePost(postId: number, reviewerId: string) {
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('Không tìm thấy bài viết');
    if (post.status !== POST_STATUS_PENDING_REVIEW) {
      throw new BadRequestException('Bài viết không ở trạng thái chờ duyệt');
    }
    post.status = 'published';
    post.reviewedBy = reviewerId;
    post.reviewedAt = new Date();
    post.publishedAt = new Date();
    await this.postRepo.save(post);
    return { ok: true, id: postId, status: post.status };
  }

  async rejectPost(postId: number, reviewerId: string, reason?: string) {
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('Không tìm thấy bài viết');
    if (post.status !== POST_STATUS_PENDING_REVIEW) {
      throw new BadRequestException('Bài viết không ở trạng thái chờ duyệt');
    }
    post.status = 'rejected';
    post.reviewedBy = reviewerId;
    post.reviewedAt = new Date();
    post.rejectionReason = reason ?? null;
    await this.postRepo.save(post);
    return { ok: true, id: postId, status: post.status };
  }

  async listSpecialties(page = 1, limit = 50) {
    const safeLimit = Math.min(Math.max(limit, 1), 200);
    const safePage = Math.max(page, 1);
    const [rows, total] = await this.specialtyRepo.findAndCount({
      order: { name: 'ASC' },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    });
    return {
      items: rows.map((s) => ({
        id: String(s.id),
        slug: s.slug,
        name: s.name,
        description: s.description,
        status: s.status,
        iconUrl: s.iconUrl,
        createdAt: s.createdAt,
      })),
      total,
      page: safePage,
      limit: safeLimit,
    };
  }

  async createSpecialty(input: {
    name: string;
    slug: string;
    description?: string;
    iconUrl?: string;
    status?: 'active' | 'inactive';
  }) {
    const slug = input.slug.trim().toLowerCase();
    const name = input.name.trim();
    if (!slug || !name) throw new BadRequestException('Thiếu name/slug');

    const exists = await this.specialtyRepo.findOne({ where: { slug } });
    if (exists) throw new BadRequestException('Slug đã tồn tại');

    const row = await this.specialtyRepo.save(
      this.specialtyRepo.create({
        slug,
        name,
        description: input.description?.trim() || null,
        iconUrl: input.iconUrl?.trim() || null,
        status: input.status ?? 'active',
      }),
    );
    return { ok: true, id: String(row.id) };
  }

  async updateSpecialty(id: number, input: {
    name?: string;
    slug?: string;
    description?: string;
    iconUrl?: string;
    status?: 'active' | 'inactive';
  }) {
    const row = await this.specialtyRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Không tìm thấy chuyên khoa');

    if (input.slug != null) {
      const slug = input.slug.trim().toLowerCase();
      if (!slug) throw new BadRequestException('slug không hợp lệ');
      const exists = await this.specialtyRepo.findOne({ where: { slug } });
      if (exists && String(exists.id) !== String(row.id)) throw new BadRequestException('Slug đã tồn tại');
      row.slug = slug;
    }
    if (input.name != null) {
      const name = input.name.trim();
      if (!name) throw new BadRequestException('name không hợp lệ');
      row.name = name;
    }
    if (input.description !== undefined) {
      row.description = input.description?.trim() || null;
    }
    if (input.iconUrl !== undefined) {
      row.iconUrl = input.iconUrl?.trim() || null;
    }
    if (input.status != null) {
      row.status = input.status;
    }
    await this.specialtyRepo.save(row);
    return { ok: true, id: String(row.id) };
  }

  async setSpecialtyStatus(id: number, status: 'active' | 'inactive') {
    const row = await this.specialtyRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Không tìm thấy chuyên khoa');
    row.status = status;
    await this.specialtyRepo.save(row);
    return { ok: true, id: String(row.id), status: row.status };
  }
}
