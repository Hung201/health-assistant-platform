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
  ) {}

  private normalizePhone(input: string): string {
    return input.replace(/\s+/g, '').slice(0, 20);
  }

  async dashboardSummary() {
    const [
      totalUsers,
      totalPatients,
      totalDoctors,
      pendingDoctors,
      pendingPosts,
      totalSpecialties,
      pendingBookings,
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
    ]);

    return {
      totalUsers,
      totalPatients,
      totalDoctors,
      pendingDoctors,
      pendingPosts,
      totalSpecialties,
      pendingBookings,
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

  async updateUser(userId: string, input: { fullName?: string; phone?: string | null; status?: 'active' | 'disabled' }) {
    const u = await this.userRepo.findOne({ where: { id: userId } });
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
