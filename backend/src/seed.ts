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
import { CommentReaction } from './entities/comment-reaction.entity';
import { DoctorReview } from './entities/doctor-review.entity';
import { POST_STATUS_PENDING_REVIEW } from './admin/admin.service';
import { getPostgresSslOption } from './config/postgres-ssl';

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
  const ssl = getPostgresSslOption();
  const dataSource = new DataSource({
    type: 'postgres',
    host: requireEnv('DB_HOST', 'localhost'),
    port: parseInt(requireEnv('DB_PORT', '5432'), 10),
    username: requireEnv('DB_USERNAME', 'postgres'),
    password: requireEnv('DB_PASSWORD', 'postgres'),
    database: requireEnv('DB_DATABASE', 'health_assistant'),
    ...(ssl && { ssl }),
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
      CommentReaction,
      DoctorReview,
    ],
    synchronize: false,
    logging: false,
  });

  await dataSource.initialize();
  await dataSource.query('CREATE EXTENSION IF NOT EXISTS unaccent;');

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
  const reactionRepo = dataSource.getRepository(CommentReaction);
  const reviewRepo = dataSource.getRepository(DoctorReview);

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
    const txReactionRepo = manager.getRepository(CommentReaction);
    const txReviewRepo = manager.getRepository(DoctorReview);

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
      { slug: 'tieu-hoa', name: 'Tiêu hoá', description: 'Bệnh lý dạ dày, đại tràng, gan mật.', status: 'active' },
      { slug: 'ho-hap', name: 'Hô hấp', description: 'Bệnh lý phổi và đường hô hấp.', status: 'active' },
      { slug: 'tai-mui-hong', name: 'Tai Mũi Họng', description: 'Bệnh lý về tai, mũi và cổ họng.', status: 'active' },
      { slug: 'co-xuong-khop', name: 'Cơ xương khớp', description: 'Bệnh lý xương khớp và chấn thương chỉnh hình.', status: 'active' },
      { slug: 'than-kinh', name: 'Thần kinh', description: 'Bệnh lý thần kinh sọ não và tuỷ sống.', status: 'active' },
      { slug: 'san-phu-khoa', name: 'Sản phụ khoa', description: 'Khám thai và bệnh lý phụ khoa.', status: 'active' },
      { slug: 'nhan-khoa', name: 'Nhãn khoa', description: 'Chăm sóc và điều trị bệnh lý về mắt.', status: 'active' },
    ];
    for (const s of specialtiesSeed) {
      const existing = await txSpecialtyRepo.findOne({ where: { slug: s.slug } });
      if (!existing) await txSpecialtyRepo.save(txSpecialtyRepo.create(s));
    }
    const allSpecs = await txSpecialtyRepo.find({ where: { status: 'active' }, order: { name: 'ASC' } });
    let dentalSpecialty = await txSpecialtyRepo.findOne({ where: { slug: 'rang-ham-mat' } });
    if (!dentalSpecialty) {
      dentalSpecialty = await txSpecialtyRepo.save(
        txSpecialtyRepo.create({
          slug: 'rang-ham-mat',
          name: 'Rang ham mat',
          description: 'Kham va dieu tri cac benh ly rang ham mat.',
          status: 'active',
        }),
      );
    } else if (dentalSpecialty.status !== 'active') {
      dentalSpecialty.status = 'active';
      dentalSpecialty = await txSpecialtyRepo.save(dentalSpecialty);
    }

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

    const primarySpec = allSpecs[0] ?? (await txSpecialtyRepo.findOne({ where: { slug: 'noi-tong-quat' } }));
    const doctorRole = roleByCode.get('doctor');
    if (!doctorRole) throw new Error('Role doctor not found');
    const doctorRoleId = doctorRole.id;

    // Bác sĩ có ảnh: npm run seed:crawl-doctors (không seed doctor_demo / pending / doctor1 tại đây)
    async function pickDoctorWithAvatar(): Promise<User | null> {
      return txUserRepo
        .createQueryBuilder('u')
        .innerJoin(UserRole, 'ur', 'ur.user_id = u.id AND ur.role_id = :roleId', { roleId: doctorRoleId })
        .where('u.avatar_url IS NOT NULL')
        .andWhere("TRIM(u.avatar_url) <> ''")
        .orderBy('u.created_at', 'ASC')
        .getOne();
    }

    const day = 24 * 60 * 60 * 1000;

    // ---- normalize primary specialty: exactly one primary per doctor
    await manager.query(`
      WITH ranked AS (
        SELECT
          doctor_user_id,
          specialty_id,
          ROW_NUMBER() OVER (
            PARTITION BY doctor_user_id
            ORDER BY
              CASE WHEN is_primary THEN 0 ELSE 1 END,
              created_at ASC,
              specialty_id ASC
          ) AS rn
        FROM doctor_specialties
      )
      UPDATE doctor_specialties ds
      SET is_primary = (ranked.rn = 1)
      FROM ranked
      WHERE ds.doctor_user_id = ranked.doctor_user_id
        AND ds.specialty_id = ranked.specialty_id
    `);

    // ---- seed future schedules for booking (idempotent)
    // 14 days ahead, Monday-Saturday, 2 sessions/day (09:00-10:00 and 14:00-15:00 in Asia/Ho_Chi_Minh).
    const toVnDate = (d: Date) =>
      new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(d);

    const approvedProfiles = await txDoctorRepo.find({
      where: { isVerified: true, verificationStatus: 'approved' },
      order: { priorityScore: 'DESC', createdAt: 'ASC' },
    });

    for (const profile of approvedProfiles) {
      // eslint-disable-next-line no-await-in-loop
      const primaryLink = await txDoctorSpecialtyRepo.findOne({
        where: { doctorUserId: profile.userId, isPrimary: true },
        order: { createdAt: 'ASC' },
      });
      if (!primaryLink) continue;

      const specialtyId = asNumberId(primaryLink.specialtyId);
      for (let offset = 1; offset <= 14; offset++) {
        const dateStr = toVnDate(new Date(Date.now() + offset * day));
        const dayInVn = new Date(`${dateStr}T00:00:00+07:00`).getDay();
        if (dayInVn === 0) continue; // Skip Sunday

        const slots = [
          { start: `${dateStr}T09:00:00+07:00`, end: `${dateStr}T10:00:00+07:00` },
          { start: `${dateStr}T14:00:00+07:00`, end: `${dateStr}T15:00:00+07:00` },
        ];

        for (const item of slots) {
          const startAt = new Date(item.start);
          const endAt = new Date(item.end);
          // eslint-disable-next-line no-await-in-loop
          const existed = await txSlotRepo.findOne({
            where: { doctorUserId: profile.userId, startAt, endAt },
          });
          if (existed) continue;

          // eslint-disable-next-line no-await-in-loop
          await txSlotRepo.save(
            txSlotRepo.create({
              doctorUserId: profile.userId,
              specialtyId,
              slotDate: new Date(`${dateStr}T12:00:00+07:00`), // noon to avoid timezone date drift
              startAt,
              endAt,
              maxBookings: 3,
              bookedCount: 0,
              status: 'available',
              source: 'seed_schedule',
            }),
          );
        }
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
    // Demo patient must be email-verified so POST /auth/login succeeds (see AuthService.login).
    await txUserRepo.update({ id: patientUser.id }, { emailVerifiedAt: new Date() });
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

    // ---- one pending booking (idempotent by bookingCode; cần bác sĩ có avatar từ crawl seed)
    const bookingCode = 'BK-DEMO-0001';
    const existingBooking = await txBookingRepo.findOne({ where: { bookingCode } });
    const demoDoctorForBooking = await pickDoctorWithAvatar();
    if (!existingBooking && primarySpec && demoDoctorForBooking) {
      const startAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const endAt = new Date(startAt.getTime() + 30 * 60 * 1000);
      const apptDate = new Date(startAt.toISOString().slice(0, 10));
      const b = await txBookingRepo.save(
        txBookingRepo.create({
          bookingCode,
          patientUserId: patientUser.id,
          doctorUserId: demoDoctorForBooking.id,
          specialtyId: asNumberId(primarySpec.id),
          availableSlotId: null,
          patientNote: 'Mình muốn tư vấn tổng quát.',
          status: 'pending',
          paymentMethod: 'momo',
          paymentStatus: 'unpaid',
          appointmentDate: apptDate,
          appointmentStartAt: startAt,
          appointmentEndAt: endAt,
          doctorNameSnapshot: demoDoctorForBooking.fullName,
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

    // ---- completed booking + reviews seed (idempotent, richer dataset for rating/ranking/UI)
    const reviewPatients = [
      { email: 'patient_review_01@precision.vn', fullName: 'Le Minh An', phone: '0900 100 001' },
      { email: 'patient_review_02@precision.vn', fullName: 'Tran Thu Ha', phone: '0900 100 002' },
      { email: 'patient_review_03@precision.vn', fullName: 'Pham Quoc Bao', phone: '0900 100 003' },
      { email: 'patient_review_04@precision.vn', fullName: 'Nguyen Hoang Long', phone: '0900 100 004' },
      { email: 'patient_review_05@precision.vn', fullName: 'Vo Mai Linh', phone: '0900 100 005' },
      { email: 'patient_review_06@precision.vn', fullName: 'Doan Gia Huy', phone: '0900 100 006' },
      { email: 'patient_review_07@precision.vn', fullName: 'Dang Ngoc Anh', phone: '0900 100 007' },
      { email: 'patient_review_08@precision.vn', fullName: 'Bui Thanh Van', phone: '0900 100 008' },
    ];
    const reviewPatientUsers: User[] = [];
    for (const p of reviewPatients) {
      // eslint-disable-next-line no-await-in-loop
      const u = await ensureUser({
        email: p.email,
        password: 'Patient@123',
        fullName: p.fullName,
        phone: p.phone,
      });
      // eslint-disable-next-line no-await-in-loop
      await ensureUserRole(u.id, 'patient');
      // eslint-disable-next-line no-await-in-loop
      await txUserRepo.update({ id: u.id }, { emailVerifiedAt: new Date() });
      // eslint-disable-next-line no-await-in-loop
      const patientProfile = await txPatientRepo.findOne({ where: { userId: u.id } });
      if (!patientProfile) {
        // eslint-disable-next-line no-await-in-loop
        await txPatientRepo.save(
          txPatientRepo.create({
            userId: u.id,
            emergencyContactName: `Nguoi than ${p.fullName}`,
            emergencyContactPhone: p.phone,
            addressLine: 'Dia chi demo patient review',
            occupation: 'Nhan vien van phong',
            bloodType: null,
          }),
        );
      }
      reviewPatientUsers.push(u);
    }
    reviewPatientUsers.unshift(patientUser);

    const approvedDoctorsForReview = await txDoctorRepo.find({
      where: { isVerified: true, verificationStatus: 'approved' },
      relations: ['user'],
      order: { priorityScore: 'DESC', createdAt: 'ASC' },
      take: 10,
    });
    const ratingPattern = [5, 5, 4, 5, 4, 3, 5, 4, 5, 4, 3, 2];
    const reviewComments = [
      'Bac si tu van ky, de hieu.',
      'Thai do than thien, huong dan ro rang.',
      'Kham nhanh va dung gio.',
      'Giai thich benh tinh rat chi tiet.',
      'Dat cau hoi dung van de, toi rat yen tam.',
      'Thoi gian cho hoi lau nhung chat luong tot.',
      'Bac si nhiet tinh va theo doi sau kham.',
      'Phong kham sach se, quy trinh ro rang.',
      'Can doi them ve thu tuc nhung bac si tot.',
      'Tra loi day du, de thuc hien theo huong dan.',
      'Muc do hai long trung binh kha.',
      'Can cai thien toc do tiep don.',
    ];

    for (let doctorIdx = 0; doctorIdx < approvedDoctorsForReview.length; doctorIdx++) {
      const profile = approvedDoctorsForReview[doctorIdx];
      // eslint-disable-next-line no-await-in-loop
      const primaryLink = await txDoctorSpecialtyRepo.findOne({
        where: { doctorUserId: profile.userId, isPrimary: true },
        order: { createdAt: 'ASC' },
      });
      if (!primaryLink) continue;
      const specialty = allSpecs.find((s) => asNumberId(s.id) === asNumberId(primaryLink.specialtyId));
      if (!specialty) continue;

      for (let i = 0; i < ratingPattern.length; i++) {
        const doctorCode = profile.userId.replace(/-/g, '').slice(0, 8).toUpperCase();
        const bookingCode = `BK-DEMO-REVIEW-${doctorCode}-${String(i + 1).padStart(2, '0')}`;
        const reviewer = reviewPatientUsers[(doctorIdx + i) % reviewPatientUsers.length];
        // eslint-disable-next-line no-await-in-loop
        let booking = await txBookingRepo.findOne({ where: { bookingCode } });
        if (!booking) {
          const startAt = new Date(Date.now() - (7 + doctorIdx * 2 + i) * day);
          startAt.setHours(9 + (i % 5), 0, 0, 0);
          const endAt = new Date(startAt.getTime() + 30 * 60 * 1000);
          // eslint-disable-next-line no-await-in-loop
          booking = await txBookingRepo.save(
            txBookingRepo.create({
              bookingCode,
              patientUserId: reviewer.id,
              doctorUserId: profile.userId,
              specialtyId: asNumberId(primaryLink.specialtyId),
              availableSlotId: null,
              patientNote: 'Seed booking cho rating/review demo',
              status: 'completed',
              paymentMethod: 'pay_at_clinic',
              paymentStatus: 'paid',
              appointmentDate: new Date(startAt.toISOString().slice(0, 10)),
              appointmentStartAt: startAt,
              appointmentEndAt: endAt,
              doctorNameSnapshot: profile.user?.fullName ?? 'Bac si',
              specialtyNameSnapshot: specialty.name,
              consultationFee: profile.consultationFee ?? '250000',
              platformFee: '0',
              totalFee: profile.consultationFee ?? '250000',
            }),
          );
        } else if (booking.status !== 'completed' || booking.paymentStatus !== 'paid') {
          booking.status = 'completed';
          booking.paymentStatus = 'paid';
          // eslint-disable-next-line no-await-in-loop
          booking = await txBookingRepo.save(booking);
        }

        // eslint-disable-next-line no-await-in-loop
        const existingReview = await txReviewRepo.findOne({ where: { bookingId: booking.id } });
        if (!existingReview) {
          const rating = ratingPattern[(doctorIdx + i) % ratingPattern.length];
          const subRatingDelta = i % 2 === 0 ? 0 : 1;
          // eslint-disable-next-line no-await-in-loop
          await txReviewRepo.save(
            txReviewRepo.create({
              bookingId: booking.id,
              doctorUserId: booking.doctorUserId,
              patientUserId: reviewer.id,
              rating,
              bedsideManner: Math.max(1, rating - (subRatingDelta % 2)),
              clarity: Math.max(1, rating - ((subRatingDelta + 1) % 2)),
              waitTime: Math.max(1, rating - 1),
              comment: reviewComments[(doctorIdx + i) % reviewComments.length],
              isAnonymous: i % 5 === 0,
              status: 'published',
            }),
          );
        }
      }
    }

    // ---- pending posts for admin review (professional-ish demo content, idempotent by slug)
    const postSeeds: Array<{
      slug: string;
      title: string;
      excerpt: string;
      content: string;
      postType: 'medical_article' | 'news' | 'faq';
      thumbnailUrl?: string | null;
    }> = [
        {
          slug: 'kien-thuc-huyet-ap-01',
          title: 'Huyết áp cao: 7 dấu hiệu dễ bỏ qua',
          excerpt: 'Một số biểu hiện của tăng huyết áp khá “im lặng”. Dưới đây là các dấu hiệu thường gặp và khi nào nên đi khám.',
          content:
            '## Tóm tắt\\n\\n- Tăng huyết áp có thể không có triệu chứng rõ ràng.\\n- Nên đo huyết áp định kỳ, đặc biệt nếu có yếu tố nguy cơ.\\n\\n## Dấu hiệu thường gặp\\n\\n1. Đau đầu âm ỉ vùng chẩm\\n2. Chóng mặt, ù tai\\n3. Hồi hộp, khó ngủ\\n4. Mệt mỏi không rõ nguyên nhân\\n\\n## Khi nào cần đi khám?\\n\\n- Huyết áp \\u2265 140/90 mmHg lặp lại nhiều lần\\n- Đau ngực, khó thở, yếu liệt\\n\\n> Lưu ý: Nội dung mang tính tham khảo, không thay thế chẩn đoán.',
          postType: 'medical_article',
          thumbnailUrl: null,
        },
        {
          slug: 'tam-soat-tieu-duong-02',
          title: 'Tầm soát đái tháo đường: ai nên làm và làm khi nào?',
          excerpt: 'Tầm soát sớm giúp giảm biến chứng. Bài viết gợi ý nhóm nguy cơ và các xét nghiệm cơ bản.',
          content:
            '## Ai nên tầm soát?\\n\\n- BMI cao, ít vận động\\n- Gia đình có người mắc đái tháo đường\\n- Tăng huyết áp, rối loạn mỡ máu\\n\\n## Xét nghiệm phổ biến\\n\\n- Đường huyết đói\\n- HbA1c\\n- Nghiệm pháp dung nạp glucose\\n\\n## Chuẩn bị trước xét nghiệm\\n\\n- Nhịn ăn 8–10 giờ (nếu xét nghiệm đường huyết đói)\\n\\n> Nội dung tham khảo. Hãy trao đổi với bác sĩ nếu bạn có bệnh nền.',
          postType: 'faq',
          thumbnailUrl: null,
        },
        {
          slug: 'meo-ngu-ngon-03',
          title: 'Ngủ ngon hơn trong 14 ngày: checklist dễ áp dụng',
          excerpt: 'Giấc ngủ ảnh hưởng trực tiếp tới miễn dịch và tim mạch. Thử checklist 14 ngày để cải thiện chất lượng ngủ.',
          content:
            '## Checklist 14 ngày\\n\\n- Cố định giờ ngủ/thức\\n- Giảm caffeine sau 14h\\n- Tắt màn hình trước ngủ 60 phút\\n- Phòng ngủ mát và tối\\n\\n## Khi nào cần gặp bác sĩ?\\n\\n- Mất ngủ \\u2265 3 lần/tuần kéo dài > 1 tháng\\n- Ngáy to, ngưng thở khi ngủ\\n\\n> Tham khảo; không thay thế tư vấn y khoa.',
          postType: 'news',
          thumbnailUrl: null,
        },
      ];

    for (let i = 0; i < 12; i++) {
      const seed = postSeeds[i % postSeeds.length];
      const slug = `${seed.slug}-demo-${String(i + 1).padStart(2, '0')}`;
      // eslint-disable-next-line no-await-in-loop
      const exists = await txPostRepo.findOne({ where: { slug } });
      if (exists) continue;
      // eslint-disable-next-line no-await-in-loop
      const postAuthor = await pickDoctorWithAvatar();
      if (!postAuthor) continue;
      // eslint-disable-next-line no-await-in-loop
      await txPostRepo.save(
        txPostRepo.create({
          authorUserId: postAuthor.id,
          title: seed.title,
          slug,
          excerpt: seed.excerpt,
          content: seed.content,
          thumbnailUrl: seed.thumbnailUrl ?? null,
          postType: seed.postType,
          status: POST_STATUS_PENDING_REVIEW,
        }),
      );
    }

    // ---- one visible comment (idempotent by content + user + post)
    const firstPending = await txPostRepo.findOne({ where: { status: POST_STATUS_PENDING_REVIEW } });
    if (firstPending) {
      const postId = asNumberId(firstPending.id);
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

    // ---- Published Blog Posts for Public View (idempotent by slug)
    const publishedPostSeeds = [
      {
        slug: 'huong-dan-cham-soc-suc-khoe-mua-dich',
        title: 'Hướng dẫn chăm sóc sức khỏe chủ động tại nhà mùa dịch',
        excerpt: 'Chăm sóc sức khỏe tại nhà không khó nếu bạn nắm vững các nguyên tắc cơ bản về dinh dưỡng và vận động.',
        content: '<h2>1. Chế độ dinh dưỡng</h2><p>Bổ sung đầy đủ vitamin C, E và kẽm giúp tăng cường hệ miễn dịch.</p><h2>2. Vận động thể chất</h2><p>Dành ít nhất 30 phút mỗi ngày để tập thể dục nhẹ nhàng tại nhà.</p><p>Hệ thống miễn dịch là lá chắn quan trọng nhất của cơ thể chúng ta.</p>',
        postType: 'health_tip',
        status: 'published',
        publishedAt: new Date(),
      },
      {
        slug: 'dot-quy-va-nhung-dieu-can-biet',
        title: 'Đột quỵ: Nhận biết dấu hiệu "Vàng" để cứu người',
        excerpt: 'Thời gian chính là não bộ. Nhận biết sớm các triệu chứng FAST để xử trí kịp thời.',
        content: '<h2>Quy tắc FAST</h2><ul><li><b>F (Face):</b> Liệt mặt, miệng méo.</li><li><b>A (Arm):</b> Yếu tay chân.</li><li><b>S (Speech):</b> Khó nói, nói ngọng.</li><li><b>T (Time):</b> Gọi cấp cứu ngay lập tức.</li></ul>',
        postType: 'medical_article',
        status: 'published',
        publishedAt: new Date(),
      }
    ];

    const publishedPostAuthor = await pickDoctorWithAvatar();
    for (const s of publishedPostSeeds) {
      let post = await txPostRepo.findOne({ where: { slug: s.slug } });
      if (!post && publishedPostAuthor) {
        post = await txPostRepo.save(txPostRepo.create({
          ...s,
          authorUserId: publishedPostAuthor.id,
          viewCount: String(Math.floor(Math.random() * 500)),
        }));
      }
      if (!post) continue;

      // Add a comment for each published post
      const commentExists = await txCommentRepo.findOne({ where: { postId: post.id, userId: patientUser.id } });
      if (!commentExists && publishedPostAuthor) {
        const rootComment = await txCommentRepo.save(txCommentRepo.create({
          postId: post.id,
          userId: patientUser.id,
          content: 'Bài viết rất hữu ích, cảm ơn bác sĩ nhiều!',
          status: 'visible',
        }));

        // Add a reply from doctor
        await txCommentRepo.save(txCommentRepo.create({
          postId: post.id,
          userId: publishedPostAuthor.id,
          parentCommentId: rootComment.id,
          content: 'Rất vui vì thông tin này giúp ích cho bạn. Hãy chia sẻ cho người thân nhé!',
          status: 'visible',
        }));

        // Add a reaction to root comment from admin
        await txReactionRepo.save(txReactionRepo.create({
          commentId: rootComment.id,
          userId: adminUser.id,
          type: 'like',
        }));
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
    reactionRepo.count(),
    reviewRepo.count(),
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
      `reactions=${counts[11]}`,
      `reviews=${counts[12]}`,
    ].join(' | '),
  );

  await dataSource.destroy();
}

seed().catch(async (err: unknown) => {
  // eslint-disable-next-line no-console
  console.error('[seed] failed', err);
  process.exitCode = 1;
});

