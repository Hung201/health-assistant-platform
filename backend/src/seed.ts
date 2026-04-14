import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { PatientProfile } from './entities/patient-profile.entity';
import { DoctorProfile } from './entities/doctor-profile.entity';
import { Specialty } from './entities/specialty.entity';
import { DoctorSpecialty } from './entities/doctor-specialty.entity';
import { ChronicCondition } from './entities/chronic-condition.entity';
import { PatientChronicCondition } from './entities/patient-chronic-condition.entity';
import { DoctorAvailableSlot } from './entities/doctor-available-slot.entity';
import { Booking } from './entities/booking.entity';
import { BookingStatusLog } from './entities/booking-status-log.entity';
import { Post } from './entities/post.entity';
import { Comment } from './entities/comment.entity';
import { POST_STATUS_PENDING_REVIEW } from './admin/admin.service';

loadEnv();

function requireEnv(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v == null || v === '') throw new Error(`Missing env: ${name}`);
  return v;
}

function normalizePhone(input: string): string {
  return input.replace(/\s+/g, '').slice(0, 20);
}

function asNumberId(id: unknown): number {
  if (typeof id === 'number') return id;
  if (typeof id === 'string') return Number(id);
  return Number(id as never);
}

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: requireEnv('DB_HOST', 'localhost'),
    port: parseInt(requireEnv('DB_PORT', '5432'), 10),
    username: requireEnv('DB_USERNAME', 'postgres'),
    password: requireEnv('DB_PASSWORD', 'postgres'),
    database: requireEnv('DB_DATABASE', 'health_assistant'),
    entities: [
      User,
      Role,
      UserRole,
      PatientProfile,
      DoctorProfile,
      Specialty,
      DoctorSpecialty,
      ChronicCondition,
      PatientChronicCondition,
      DoctorAvailableSlot,
      Booking,
      BookingStatusLog,
      Post,
      Comment,
    ],
    synchronize: false,
    logging: false,
  });

  await dataSource.initialize();

  const roleRepo = dataSource.getRepository(Role);
  const userRepo = dataSource.getRepository(User);
  const userRoleRepo = dataSource.getRepository(UserRole);
  const patientRepo = dataSource.getRepository(PatientProfile);
  const doctorRepo = dataSource.getRepository(DoctorProfile);
  const specialtyRepo = dataSource.getRepository(Specialty);
  const doctorSpecialtyRepo = dataSource.getRepository(DoctorSpecialty);
  const conditionRepo = dataSource.getRepository(ChronicCondition);
  const patientConditionRepo = dataSource.getRepository(PatientChronicCondition);
  const slotRepo = dataSource.getRepository(DoctorAvailableSlot);
  const bookingRepo = dataSource.getRepository(Booking);
  const bookingLogRepo = dataSource.getRepository(BookingStatusLog);
  const postRepo = dataSource.getRepository(Post);
  const commentRepo = dataSource.getRepository(Comment);

  await dataSource.transaction(async (manager) => {
    // Rebind repos inside transaction.
    const txRoleRepo = manager.getRepository(Role);
    const txUserRepo = manager.getRepository(User);
    const txUserRoleRepo = manager.getRepository(UserRole);
    const txPatientRepo = manager.getRepository(PatientProfile);
    const txDoctorRepo = manager.getRepository(DoctorProfile);
    const txSpecialtyRepo = manager.getRepository(Specialty);
    const txDoctorSpecialtyRepo = manager.getRepository(DoctorSpecialty);
    const txConditionRepo = manager.getRepository(ChronicCondition);
    const txPatientConditionRepo = manager.getRepository(PatientChronicCondition);
    const txSlotRepo = manager.getRepository(DoctorAvailableSlot);
    const txBookingRepo = manager.getRepository(Booking);
    const txBookingLogRepo = manager.getRepository(BookingStatusLog);
    const txPostRepo = manager.getRepository(Post);
    const txCommentRepo = manager.getRepository(Comment);

    // ---- roles (idempotent)
    const roleSeeds: Array<{ code: string; name: string }> = [
      { code: 'patient', name: 'Bệnh nhân' },
      { code: 'doctor', name: 'Bác sĩ' },
      { code: 'admin', name: 'Quản trị viên' },
    ];
    for (const r of roleSeeds) {
      const existing = await txRoleRepo.findOne({ where: { code: r.code } });
      if (!existing) await txRoleRepo.save(txRoleRepo.create(r));
    }
    const roles = await txRoleRepo.find();
    const roleByCode = new Map(roles.map((r) => [r.code, r]));

    // ---- specialties (idempotent by slug)
    const specialtiesSeed: Array<Pick<Specialty, 'slug' | 'name' | 'description' | 'status'>> = [
      { slug: 'noi-tong-quat', name: 'Nội tổng quát', description: 'Khám tổng quát và tư vấn sức khỏe.', status: 'active' },
      { slug: 'tim-mach', name: 'Tim mạch', description: 'Chẩn đoán và điều trị bệnh lý tim mạch.', status: 'active' },
      { slug: 'nhi-khoa', name: 'Nhi khoa', description: 'Khám và theo dõi sức khỏe trẻ em.', status: 'active' },
      { slug: 'ngoai-khoa', name: 'Ngoại khoa', description: 'Tư vấn và can thiệp ngoại khoa.', status: 'active' },
      { slug: 'da-lieu', name: 'Da liễu', description: 'Điều trị các vấn đề về da.', status: 'active' },
    ];
    for (const s of specialtiesSeed) {
      const existing = await txSpecialtyRepo.findOne({ where: { slug: s.slug } });
      if (!existing) await txSpecialtyRepo.save(txSpecialtyRepo.create(s));
    }
    const allSpecs = await txSpecialtyRepo.find({ where: { status: 'active' }, order: { name: 'ASC' } });

    // ---- chronic_conditions (idempotent by code)
    const conditionSeeds: Array<{ code: string; name: string; description: string }> = [
      { code: 'HTN', name: 'Tăng huyết áp', description: 'Theo dõi huyết áp và điều trị dài hạn.' },
      { code: 'DM2', name: 'Đái tháo đường тип 2', description: 'Quản lý đường huyết và lối sống.' },
      { code: 'ASTHMA', name: 'Hen phế quản', description: 'Kiểm soát triệu chứng và dự phòng.' },
    ];
    for (const c of conditionSeeds) {
      const existing = await txConditionRepo.findOne({ where: { code: c.code } });
      if (!existing) await txConditionRepo.save(txConditionRepo.create(c));
    }

    // Helpers for users
    async function ensureUser(params: {
      email: string;
      password: string;
      fullName: string;
      phone?: string;
      status?: string;
    }): Promise<User> {
      const email = params.email.trim().toLowerCase();
      const existing = await txUserRepo.findOne({ where: { email } });
      if (existing) return existing;

      let phone: string | null = null;
      if (params.phone) {
        const normalized = normalizePhone(params.phone);
        const taken = await txUserRepo.findOne({ where: { phone: normalized } });
        if (!taken) phone = normalized;
      }

      const passwordHash = await bcrypt.hash(params.password, 10);
      const u = txUserRepo.create({
        email,
        fullName: params.fullName,
        passwordHash,
        phone,
        status: params.status ?? 'active',
      });
      return txUserRepo.save(u);
    }

    async function ensureUserRole(userId: string, roleCode: 'patient' | 'doctor' | 'admin') {
      const role = roleByCode.get(roleCode);
      if (!role) throw new Error(`Role not found: ${roleCode}`);
      const existing = await txUserRoleRepo.findOne({ where: { userId, roleId: role.id } });
      if (!existing) await txUserRoleRepo.save(txUserRoleRepo.create({ userId, roleId: role.id }));
    }

    // ---- admin account
    const adminUser = await ensureUser({
      email: 'admin@precision.vn',
      password: 'Admin@123',
      fullName: 'Admin Clinical Precision',
      phone: '0900 000 001',
    });
    await ensureUserRole(adminUser.id, 'admin');

    // ---- demo doctor (pending verification)
    const doctorUser = await ensureUser({
      email: 'doctor1@precision.vn',
      password: 'Doctor@123',
      fullName: 'BS Nguyễn Văn A',
      phone: '0900 000 002',
    });
    await ensureUserRole(doctorUser.id, 'doctor');
    const existingDoctorProfile = await txDoctorRepo.findOne({ where: { userId: doctorUser.id } });
    if (!existingDoctorProfile) {
      await txDoctorRepo.save(
        txDoctorRepo.create({
          userId: doctorUser.id,
          professionalTitle: 'Bác sĩ',
          licenseNumber: '123456/CCHN',
          workplaceName: 'Clinical Precision Center',
          yearsOfExperience: 6,
          bio: 'Bác sĩ tư vấn sức khỏe tổng quát và tim mạch.',
          isVerified: false,
          verificationStatus: 'pending',
          consultationFee: '200000',
        }),
      );
    }
    const primarySpec = allSpecs[0] ?? (await txSpecialtyRepo.findOne({ where: { slug: 'noi-tong-quat' } }));
    if (primarySpec) {
      const specId = asNumberId(primarySpec.id);
      const existingLink = await txDoctorSpecialtyRepo.findOne({
        where: { doctorUserId: doctorUser.id, specialtyId: specId },
      });
      if (!existingLink) {
        await txDoctorSpecialtyRepo.save(
          txDoctorSpecialtyRepo.create({
            doctorUserId: doctorUser.id,
            specialtyId: specId,
            isPrimary: true,
          }),
        );
      }
    }

    // ---- demo patient
    const patientUser = await ensureUser({
      email: 'patient1@precision.vn',
      password: 'Patient@123',
      fullName: 'Nguyễn Thị B',
      phone: '0900 000 003',
    });
    await ensureUserRole(patientUser.id, 'patient');
    const existingPatientProfile = await txPatientRepo.findOne({ where: { userId: patientUser.id } });
    if (!existingPatientProfile) {
      await txPatientRepo.save(
        txPatientRepo.create({
          userId: patientUser.id,
          emergencyContactName: 'Nguyễn Văn C',
          emergencyContactPhone: '0900 000 004',
          addressLine: 'Q.1, TP. Hồ Chí Minh',
          occupation: 'Nhân viên văn phòng',
          bloodType: 'O+',
        }),
      );
    }

    // ---- attach one chronic condition to patient (idempotent)
    const htn = await txConditionRepo.findOne({ where: { code: 'HTN' } });
    if (htn) {
      const condId = asNumberId(htn.id);
      const existing = await txPatientConditionRepo.findOne({
        where: { patientUserId: patientUser.id, conditionId: condId },
      });
      if (!existing) {
        await txPatientConditionRepo.save(
          txPatientConditionRepo.create({
            patientUserId: patientUser.id,
            conditionId: condId,
            diagnosedAt: new Date('2023-01-10'),
            severityLevel: 'mild',
            note: 'Theo dõi định kỳ.',
          }),
        );
      }
    }

    // ---- available slots for doctor (idempotent: create only if none)
    const existingSlots = await txSlotRepo.count({ where: { doctorUserId: doctorUser.id } });
    let slot: DoctorAvailableSlot | null = null;
    if (existingSlots === 0 && primarySpec) {
      const now = new Date();
      const start = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      start.setMinutes(0, 0, 0);
      const end = new Date(start.getTime() + 30 * 60 * 1000);
      slot = await txSlotRepo.save(
        txSlotRepo.create({
          doctorUserId: doctorUser.id,
          specialtyId: asNumberId(primarySpec.id),
          slotDate: new Date(start.toISOString().slice(0, 10)),
          startAt: start,
          endAt: end,
          maxBookings: 5,
          bookedCount: 0,
          status: 'available',
          source: 'seed',
        }),
      );
    }

    // ---- one pending booking (idempotent by bookingCode)
    const bookingCode = 'BK-DEMO-0001';
    const existingBooking = await txBookingRepo.findOne({ where: { bookingCode } });
    if (!existingBooking && primarySpec) {
      const startAt = slot?.startAt ?? new Date(Date.now() + 48 * 60 * 60 * 1000);
      const endAt = slot?.endAt ?? new Date(startAt.getTime() + 30 * 60 * 1000);
      const apptDate = new Date(startAt.toISOString().slice(0, 10));
      const b = await txBookingRepo.save(
        txBookingRepo.create({
          bookingCode,
          patientUserId: patientUser.id,
          doctorUserId: doctorUser.id,
          specialtyId: asNumberId(primarySpec.id),
          availableSlotId: slot ? asNumberId(slot.id) : null,
          patientNote: 'Mình muốn tư vấn tổng quát.',
          status: 'pending',
          appointmentDate: apptDate,
          appointmentStartAt: startAt,
          appointmentEndAt: endAt,
          doctorNameSnapshot: doctorUser.fullName,
          specialtyNameSnapshot: primarySpec.name,
          consultationFee: '200000',
          platformFee: '0',
          totalFee: '200000',
        }),
      );
      await txBookingLogRepo.save(
        txBookingLogRepo.create({
          bookingId: b.id,
          oldStatus: null,
          newStatus: 'pending',
          changedBy: null,
          note: 'Seed booking',
        }),
      );
    }

    // ---- one pending post for admin review (idempotent by slug)
    const pendingSlug = 'loi-khuyen-suc-khoe-demo';
    const existingPost = await txPostRepo.findOne({ where: { slug: pendingSlug } });
    if (!existingPost) {
      await txPostRepo.save(
        txPostRepo.create({
          authorUserId: doctorUser.id,
          title: 'Lời khuyên sức khỏe (Demo)',
          slug: pendingSlug,
          excerpt: 'Bài viết demo để admin duyệt.',
          content:
            '## Demo\\n\\nĐây là nội dung mẫu để kiểm tra luồng duyệt bài viết trên Admin Dashboard.',
          thumbnailUrl: null,
          postType: 'medical_article',
          status: POST_STATUS_PENDING_REVIEW,
        }),
      );
    }

    // ---- one visible comment (idempotent by content + user + post)
    const post = await txPostRepo.findOne({ where: { slug: pendingSlug } });
    if (post) {
      const postId = asNumberId(post.id);
      const existingComment = await txCommentRepo.findOne({
        where: { postId, userId: patientUser.id, content: 'Bài viết hay (demo).' },
      });
      if (!existingComment) {
        await txCommentRepo.save(
          txCommentRepo.create({
            postId,
            userId: patientUser.id,
            parentCommentId: null,
            content: 'Bài viết hay (demo).',
            status: 'visible',
          }),
        );
      }
    }
  });

  const counts = await Promise.all([
    roleRepo.count(),
    userRepo.count(),
    userRoleRepo.count(),
    patientRepo.count(),
    doctorRepo.count(),
    specialtyRepo.count(),
    conditionRepo.count(),
    slotRepo.count(),
    bookingRepo.count(),
    postRepo.count(),
    commentRepo.count(),
  ]);

  // eslint-disable-next-line no-console
  console.log(
    [
      '[seed] done',
      `roles=${counts[0]}`,
      `users=${counts[1]}`,
      `user_roles=${counts[2]}`,
      `patients=${counts[3]}`,
      `doctors=${counts[4]}`,
      `specialties=${counts[5]}`,
      `conditions=${counts[6]}`,
      `slots=${counts[7]}`,
      `bookings=${counts[8]}`,
      `posts=${counts[9]}`,
      `comments=${counts[10]}`,
    ].join(' | '),
  );

  await dataSource.destroy();
}

seed().catch(async (err: unknown) => {
  // eslint-disable-next-line no-console
  console.error('[seed] failed', err);
  process.exitCode = 1;
});

