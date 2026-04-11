import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { PatientProfile } from '../entities/patient-profile.entity';
import { DoctorProfile } from '../entities/doctor-profile.entity';
import { Post } from '../entities/post.entity';
import { Specialty } from '../entities/specialty.entity';
import { Booking } from '../entities/booking.entity';

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

  async listPendingDoctors() {
    const rows = await this.doctorRepo.find({
      where: { verificationStatus: 'pending', isVerified: false },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
    return rows.map((d) => ({
      userId: d.userId,
      email: d.user?.email,
      fullName: d.user?.fullName,
      professionalTitle: d.professionalTitle,
      licenseNumber: d.licenseNumber,
      workplaceName: d.workplaceName,
      createdAt: d.createdAt,
    }));
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

  async listPendingPosts() {
    const posts = await this.postRepo.find({
      where: { status: POST_STATUS_PENDING_REVIEW },
      relations: ['author', 'author.user'],
      order: { createdAt: 'DESC' },
      take: 100,
    });
    return posts.map((p) => ({
      id: String(p.id),
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      postType: p.postType,
      createdAt: p.createdAt,
      authorUserId: p.authorUserId,
      authorName: p.author?.user?.fullName ?? null,
      authorEmail: p.author?.user?.email ?? null,
    }));
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

  async listSpecialties() {
    const rows = await this.specialtyRepo.find({
      order: { name: 'ASC' },
    });
    return rows.map((s) => ({
      id: String(s.id),
      slug: s.slug,
      name: s.name,
      description: s.description,
      status: s.status,
      iconUrl: s.iconUrl,
      createdAt: s.createdAt,
    }));
  }
}
