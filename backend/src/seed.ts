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
      CommentReaction,
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
  const reactionRepo = dataSource.getRepository(CommentReaction);

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
          workplaceAddress: '15 Pho Hue, Phuong Ngo Thi Nham, Quan Hai Ba Trung, Ha Noi',
          provinceCode: '01',
          districtCode: '008',
          yearsOfExperience: 6,
          bio: 'Bác sĩ tư vấn sức khỏe tổng quát và tim mạch.',
          isVerified: false,
          verificationStatus: 'pending',
          consultationFee: '200000',
        }),
      );
    } else {
      existingDoctorProfile.workplaceAddress =
        existingDoctorProfile.workplaceAddress ?? '15 Pho Hue, Phuong Ngo Thi Nham, Quan Hai Ba Trung, Ha Noi';
      existingDoctorProfile.provinceCode = existingDoctorProfile.provinceCode ?? '01';
      existingDoctorProfile.districtCode = existingDoctorProfile.districtCode ?? '008';
      await txDoctorRepo.save(existingDoctorProfile);
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

    // ---- fake Vietnam workplaces for map/location recommendation seed
    const cityLocations: Array<{
      city: string;
      provinceCode: string;
      districtCode: string;
      workplaceName: string;
      workplaceAddress: string;
    }> = [
      {
        city: 'Ha Noi',
        provinceCode: '01',
        districtCode: '005',
        workplaceName: 'Phong kham Da khoa Cau Giay',
        workplaceAddress: '98 Duong Cau Giay, Phuong Quan Hoa, Quan Cau Giay, Ha Noi',
      },
      {
        city: 'TP HCM',
        provinceCode: '79',
        districtCode: '760',
        workplaceName: 'Phong kham Da khoa Ben Thanh',
        workplaceAddress: '210 Le Lai, Phuong Ben Thanh, Quan 1, TP Ho Chi Minh',
      },
      {
        city: 'Da Nang',
        provinceCode: '48',
        districtCode: '490',
        workplaceName: 'Phong kham Da khoa Hai Chau',
        workplaceAddress: '55 Nguyen Van Linh, Phuong Nam Duong, Quan Hai Chau, Da Nang',
      },
    ];
    const getCityLocation = (seedIndex: number) => cityLocations[(seedIndex - 1) % cityLocations.length];

    // ---- more pending doctors for admin review (idempotent)
    const pendingDoctorCount = 8;
    for (let i = 1; i <= pendingDoctorCount; i++) {
      const n = String(i).padStart(2, '0');
      const cityLocation = getCityLocation(i);
      // eslint-disable-next-line no-await-in-loop
      const u = await ensureUser({
        email: `doctor_pending_${n}@precision.vn`,
        password: 'Doctor@123',
        fullName: `BS Chờ duyệt ${n}`,
        phone: `0900 002 ${n}`,
      });
      // eslint-disable-next-line no-await-in-loop
      await ensureUserRole(u.id, 'doctor');
      // eslint-disable-next-line no-await-in-loop
      const p = await txDoctorRepo.findOne({ where: { userId: u.id } });
      if (!p) {
        // eslint-disable-next-line no-await-in-loop
        await txDoctorRepo.save(
          txDoctorRepo.create({
            userId: u.id,
            professionalTitle: 'Bác sĩ',
            licenseNumber: `PENDING-${n}/CCHN`,
            workplaceName: `${cityLocation.workplaceName} (Pending ${cityLocation.city})`,
            workplaceAddress: cityLocation.workplaceAddress,
            provinceCode: cityLocation.provinceCode,
            districtCode: cityLocation.districtCode,
            yearsOfExperience: 1 + (i % 8),
            bio: 'Hồ sơ demo (pending) để test luồng duyệt bác sĩ trên admin.',
            isVerified: false,
            verificationStatus: 'pending',
            consultationFee: String(180000 + (i % 4) * 20000),
          }),
        );
      } else {
        // keep seed idempotent but enforce "pending" for this demo set
        p.verificationStatus = 'pending';
        p.isVerified = false;
        p.workplaceName = `${cityLocation.workplaceName} (Pending ${cityLocation.city})`;
        p.workplaceAddress = p.workplaceAddress ?? cityLocation.workplaceAddress;
        p.provinceCode = p.provinceCode ?? cityLocation.provinceCode;
        p.districtCode = p.districtCode ?? cityLocation.districtCode;
        // eslint-disable-next-line no-await-in-loop
        await txDoctorRepo.save(p);
      }
    }

    // ---- demo doctor (approved) for patient discovery
    const approvedDoctorUser = await ensureUser({
      email: 'doctor2@precision.vn',
      password: 'Doctor@123',
      fullName: 'BS Trần Thị C',
      phone: '0900 000 005',
    });
    await ensureUserRole(approvedDoctorUser.id, 'doctor');
    const approvedProfile = await txDoctorRepo.findOne({ where: { userId: approvedDoctorUser.id } });
    if (!approvedProfile) {
      await txDoctorRepo.save(
        txDoctorRepo.create({
          userId: approvedDoctorUser.id,
          professionalTitle: 'Bác sĩ Chuyên khoa',
          licenseNumber: '789101/CCHN',
          workplaceName: 'Precision Care Clinic',
          workplaceAddress: '12 Nguyen Hue, Phuong Ben Nghe, Quan 1, TP Ho Chi Minh',
          provinceCode: '79',
          districtCode: '760',
          yearsOfExperience: 10,
          bio: 'Bác sĩ đã được duyệt (demo) để bệnh nhân có thể tìm và đặt lịch.',
          isVerified: true,
          verificationStatus: 'approved',
          consultationFee: '250000',
        }),
      );
    } else {
      approvedProfile.workplaceAddress =
        approvedProfile.workplaceAddress ?? '12 Nguyen Hue, Phuong Ben Nghe, Quan 1, TP Ho Chi Minh';
      approvedProfile.provinceCode = approvedProfile.provinceCode ?? '79';
      approvedProfile.districtCode = approvedProfile.districtCode ?? '760';
      await txDoctorRepo.save(approvedProfile);
    }
    if (primarySpec) {
      const specId = asNumberId(primarySpec.id);
      const existingLink2 = await txDoctorSpecialtyRepo.findOne({
        where: { doctorUserId: approvedDoctorUser.id, specialtyId: specId },
      });
      if (!existingLink2) {
        await txDoctorSpecialtyRepo.save(
          txDoctorSpecialtyRepo.create({
            doctorUserId: approvedDoctorUser.id,
            specialtyId: specId,
            isPrimary: true,
          }),
        );
      }
    }

    // ---- dental doctor (approved) for dentistry recommendation and booking demo
    const dentalDoctorUser = await ensureUser({
      email: 'doctor_dental_01@precision.vn',
      password: 'Doctor@123',
      fullName: 'BS Nha khoa Cau Giay',
      phone: '0900 003 001',
    });
    await ensureUserRole(dentalDoctorUser.id, 'doctor');

    const dentalProfile = await txDoctorRepo.findOne({ where: { userId: dentalDoctorUser.id } });
    if (!dentalProfile) {
      await txDoctorRepo.save(
        txDoctorRepo.create({
          userId: dentalDoctorUser.id,
          professionalTitle: 'Bac si Chuyen khoa Rang ham mat',
          licenseNumber: 'DENTAL-01/CCHN',
          workplaceName: 'Nha khoa Cau Giay Smile',
          workplaceAddress: '123 Tran Thai Tong, Cau Giay, Ha Noi',
          provinceCode: '01',
          districtCode: '005',
          yearsOfExperience: 9,
          bio: 'Bac si rang ham mat, chuyen dieu tri dau rang va viem nha chu.',
          isVerified: true,
          verificationStatus: 'approved',
          consultationFee: '300000',
          priorityScore: 80,
          isAvailableForBooking: true,
        }),
      );
    } else {
      dentalProfile.isVerified = true;
      dentalProfile.verificationStatus = 'approved';
      dentalProfile.workplaceName = dentalProfile.workplaceName ?? 'Nha khoa Cau Giay Smile';
      dentalProfile.workplaceAddress = dentalProfile.workplaceAddress ?? '123 Tran Thai Tong, Cau Giay, Ha Noi';
      dentalProfile.provinceCode = dentalProfile.provinceCode ?? '01';
      dentalProfile.districtCode = dentalProfile.districtCode ?? '005';
      dentalProfile.isAvailableForBooking = true;
      await txDoctorRepo.save(dentalProfile);
    }

    if (dentalSpecialty) {
      const dentalSpecId = asNumberId(dentalSpecialty.id);
      const existingDentalLinks = await txDoctorSpecialtyRepo.find({
        where: { doctorUserId: dentalDoctorUser.id },
      });
      for (const link of existingDentalLinks) {
        if (!link.isPrimary) continue;
        link.isPrimary = false;
        await txDoctorSpecialtyRepo.save(link);
      }

      const dentalPrimary = await txDoctorSpecialtyRepo.findOne({
        where: { doctorUserId: dentalDoctorUser.id, specialtyId: dentalSpecId },
      });
      if (!dentalPrimary) {
        await txDoctorSpecialtyRepo.save(
          txDoctorSpecialtyRepo.create({
            doctorUserId: dentalDoctorUser.id,
            specialtyId: dentalSpecId,
            isPrimary: true,
          }),
        );
      } else if (!dentalPrimary.isPrimary) {
        dentalPrimary.isPrimary = true;
        await txDoctorSpecialtyRepo.save(dentalPrimary);
      }
    }

    // ---- bulk approved doctors for richer demo data (idempotent)
    const demoDoctorCount = 20;
    const safeSpecs = allSpecs.length > 0 ? allSpecs : primarySpec ? [primarySpec] : [];
    const day = 24 * 60 * 60 * 1000;
    const now = new Date();
    const approvedDoctorIds: string[] = [approvedDoctorUser.id, dentalDoctorUser.id];

    const ensureApprovedDoctor = async (idx: number) => {
      const n = String(idx).padStart(2, '0');
      const cityLocation = getCityLocation(idx);
      const email = `doctor_demo_${n}@precision.vn`;
      const u = await ensureUser({
        email,
        password: 'Doctor@123',
        fullName: `BS Demo ${n}`,
        phone: `0900 001 ${n}`,
      });
      await ensureUserRole(u.id, 'doctor');
      approvedDoctorIds.push(u.id);

      const profile = await txDoctorRepo.findOne({ where: { userId: u.id } });
      if (!profile) {
        await txDoctorRepo.save(
          txDoctorRepo.create({
            userId: u.id,
            professionalTitle: 'Bác sĩ',
            licenseNumber: `DEMO-${n}/CCHN`,
            workplaceName: `${cityLocation.workplaceName} (Demo ${cityLocation.city})`,
            workplaceAddress: cityLocation.workplaceAddress,
            provinceCode: cityLocation.provinceCode,
            districtCode: cityLocation.districtCode,
            yearsOfExperience: 3 + (idx % 12),
            bio: 'Hồ sơ demo (seed) để test tìm bác sĩ/đặt lịch.',
            isVerified: true,
            verificationStatus: 'approved',
            consultationFee: String(150000 + (idx % 6) * 50000),
          }),
        );
      } else {
        profile.workplaceName = `${cityLocation.workplaceName} (Demo ${cityLocation.city})`;
        profile.workplaceAddress = profile.workplaceAddress ?? cityLocation.workplaceAddress;
        profile.provinceCode = profile.provinceCode ?? cityLocation.provinceCode;
        profile.districtCode = profile.districtCode ?? cityLocation.districtCode;
        await txDoctorRepo.save(profile);
      }

      const spec = safeSpecs.length > 0 ? safeSpecs[idx % safeSpecs.length] : null;
      if (spec) {
        const specId = asNumberId(spec.id);
        const link = await txDoctorSpecialtyRepo.findOne({ where: { doctorUserId: u.id, specialtyId: specId } });
        if (!link) {
          await txDoctorSpecialtyRepo.save(
            txDoctorSpecialtyRepo.create({
              doctorUserId: u.id,
              specialtyId: specId,
              isPrimary: true,
            }),
          );
        }
      }

      const slotCount = await txSlotRepo.count({ where: { doctorUserId: u.id } });
      if (slotCount === 0 && spec) {
        const makeSlot = async (offsetDays: number, hour: number) => {
          const start = new Date(now.getTime() + offsetDays * day);
          start.setHours(hour, 0, 0, 0);
          const end = new Date(start.getTime() + 30 * 60 * 1000);
          await txSlotRepo.save(
            txSlotRepo.create({
              doctorUserId: u.id,
              specialtyId: asNumberId(spec.id),
              slotDate: new Date(start.toISOString().slice(0, 10)),
              startAt: start,
              endAt: end,
              maxBookings: 3,
              bookedCount: 0,
              status: 'available',
              source: 'seed',
            }),
          );
        };
        await makeSlot(1 + (idx % 3), 9);
        await makeSlot(1 + (idx % 3), 10);
      }
    };

    for (let i = 1; i <= demoDoctorCount; i++) {
      // eslint-disable-next-line no-await-in-loop
      await ensureApprovedDoctor(i);
    }

    // ---- ensure specialty coverage for AI recommend (idempotent)
    // Keep at least one approved doctor as primary for each specialty that was previously empty.
    const remapPlan: Array<{ email: string; slug: string }> = [
      { email: 'doctor_demo_13@precision.vn', slug: 'tieu-hoa' },
      { email: 'doctor_demo_18@precision.vn', slug: 'ho-hap' },
      { email: 'doctor_demo_03@precision.vn', slug: 'tai-mui-hong' },
      { email: 'doctor_demo_01@precision.vn', slug: 'co-xuong-khop' },
      { email: 'doctor_demo_06@precision.vn', slug: 'than-kinh' },
      { email: 'doctor_demo_04@precision.vn', slug: 'san-phu-khoa' },
      { email: 'doctor_demo_11@precision.vn', slug: 'nhan-khoa' },
    ];
    for (const plan of remapPlan) {
      // eslint-disable-next-line no-await-in-loop
      const doctorUser = await txUserRepo.findOne({ where: { email: plan.email } });
      if (!doctorUser) continue;
      // eslint-disable-next-line no-await-in-loop
      const spec = await txSpecialtyRepo.findOne({ where: { slug: plan.slug, status: 'active' } });
      if (!spec) continue;
      const specId = asNumberId(spec.id);

      // eslint-disable-next-line no-await-in-loop
      const links = await txDoctorSpecialtyRepo.find({ where: { doctorUserId: doctorUser.id } });
      for (const link of links) {
        if (!link.isPrimary) continue;
        link.isPrimary = false;
        // eslint-disable-next-line no-await-in-loop
        await txDoctorSpecialtyRepo.save(link);
      }

      // eslint-disable-next-line no-await-in-loop
      const existingLink = await txDoctorSpecialtyRepo.findOne({
        where: { doctorUserId: doctorUser.id, specialtyId: specId },
      });
      if (!existingLink) {
        // eslint-disable-next-line no-await-in-loop
        await txDoctorSpecialtyRepo.save(
          txDoctorSpecialtyRepo.create({
            doctorUserId: doctorUser.id,
            specialtyId: specId,
            isPrimary: true,
          }),
        );
      } else if (!existingLink.isPrimary) {
        existingLink.isPrimary = true;
        // eslint-disable-next-line no-await-in-loop
        await txDoctorSpecialtyRepo.save(existingLink);
      }
    }

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

    // ---- available slots for approved doctor (idempotent)
    const existingSlots2 = await txSlotRepo.count({ where: { doctorUserId: approvedDoctorUser.id } });
    if (existingSlots2 === 0 && primarySpec) {
      const now = new Date();
      const makeSlot = async (offsetDays: number, hour: number) => {
        const start = new Date(now.getTime() + offsetDays * day);
        start.setHours(hour, 0, 0, 0);
        const end = new Date(start.getTime() + 30 * 60 * 1000);
        await txSlotRepo.save(
          txSlotRepo.create({
            doctorUserId: approvedDoctorUser.id,
            specialtyId: asNumberId(primarySpec.id),
            slotDate: new Date(start.toISOString().slice(0, 10)),
            startAt: start,
            endAt: end,
            maxBookings: 3,
            bookedCount: 0,
            status: 'available',
            source: 'seed',
          }),
        );
      };
      await makeSlot(1, 9);
      await makeSlot(1, 10);
      await makeSlot(2, 14);
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
          paymentMethod: 'momo',
          paymentStatus: 'unpaid',
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
      const authorUserId = approvedDoctorIds[i % approvedDoctorIds.length] ?? doctorUser.id;
      // eslint-disable-next-line no-await-in-loop
      await txPostRepo.save(
        txPostRepo.create({
          authorUserId,
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

    for (const s of publishedPostSeeds) {
      let post = await txPostRepo.findOne({ where: { slug: s.slug } });
      if (!post) {
        post = await txPostRepo.save(txPostRepo.create({
          ...s,
          authorUserId: approvedDoctorUser.id,
          viewCount: String(Math.floor(Math.random() * 500)),
        }));
      }

      // Add a comment for each published post
      const commentExists = await txCommentRepo.findOne({ where: { postId: post.id, userId: patientUser.id } });
      if (!commentExists) {
        const rootComment = await txCommentRepo.save(txCommentRepo.create({
          postId: post.id,
          userId: patientUser.id,
          content: 'Bài viết rất hữu ích, cảm ơn bác sĩ nhiều!',
          status: 'visible',
        }));

        // Add a reply from doctor
        await txCommentRepo.save(txCommentRepo.create({
          postId: post.id,
          userId: approvedDoctorUser.id,
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
    ].join(' | '),
  );

  await dataSource.destroy();
}

seed().catch(async (err: unknown) => {
  // eslint-disable-next-line no-console
  console.error('[seed] failed', err);
  process.exitCode = 1;
});

