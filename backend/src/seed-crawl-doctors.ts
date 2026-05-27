/**
 * Seed bác sĩ từ data-crawl-doctor.json (idempotent).
 * Chạy: npm run seed:crawl-doctors
 * Cần: DB + CLOUDINARY_* (hoặc SEED_SKIP_CLOUDINARY=1 để giữ avatar URL gốc).
 */
import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v2 as cloudinary } from 'cloudinary';

import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { PatientProfile } from './entities/patient-profile.entity';
import { DoctorProfile } from './entities/doctor-profile.entity';
import { Specialty } from './entities/specialty.entity';
import { DoctorSpecialty } from './entities/doctor-specialty.entity';
import { DoctorAvailableSlot } from './entities/doctor-available-slot.entity';
import { getPostgresSslOption } from './config/postgres-ssl';

loadEnv();

type CrawlSpecialty = { name: string; isPrimary?: boolean };
type CrawlSlot = {
  date: string | null;
  weekday: number | null;
  startAt: string;
  endAt: string;
  maxBookings: number | null;
};
type CrawlDoctor = {
  normalized: {
    sourceSite: string;
    sourceDoctorId: string;
    sourceUrl: string;
    fullName: string;
    professionalTitle: string | null;
    avatarUrl: string | null;
    bio: string | null;
    yearsOfExperience: number | null;
    specialties: CrawlSpecialty[];
    workplaceName: string | null;
    workplaceAddressText: string | null;
    province: string | null;
    district: string | null;
    consultationFee: { amount: number; currency: string } | null;
    slots?: CrawlSlot[];
  };
};

const DEFAULT_PASSWORD = process.env.CRAWL_DOCTOR_PASSWORD ?? '123456';
const SKIP_CLOUDINARY = process.env.SEED_SKIP_CLOUDINARY === '1';
/** Mặc định bật: upload lại avatar crawl lên Cloudinary kể cả khi đã có URL bookingcare */
const FORCE_CLOUDINARY_AVATAR = process.env.SEED_FORCE_CLOUDINARY_AVATAR !== '0';
const MAX_SLOTS_PER_DOCTOR = parseInt(process.env.CRAWL_MAX_SLOTS_PER_DOCTOR ?? '16', 10);
const AVATAR_DOWNLOAD_TIMEOUT_MS = 45_000;
const CRAWL_JSON = process.env.CRAWL_DOCTORS_JSON_PATH
  ? path.resolve(process.env.CRAWL_DOCTORS_JSON_PATH)
  : path.resolve(__dirname, '../../data-crawl-doctor.json');

/** Tên chuyên khoa crawl → slug đã có trong DB seed */
const SPECIALTY_ALIASES: Record<string, string> = {
  'Tai Mũi Họng': 'tai-mui-hong',
  'Nhi khoa': 'nhi-khoa',
  'Da liễu': 'da-lieu',
  'Da liễu thẩm mỹ': 'da-lieu',
  'Khám tổng quát': 'noi-tong-quat',
  'Thần kinh': 'than-kinh',
  'Ngoại thần kinh': 'than-kinh',
  'Cột sống': 'co-xuong-khop',
  'Tim mạch': 'tim-mach',
  'Tiêu hoá': 'tieu-hoa',
  'Hô hấp': 'ho-hap',
  'Sản phụ khoa': 'san-phu-khoa',
  'Nhãn khoa': 'nhan-khoa',
  'Nội tổng quát': 'noi-tong-quat',
  'Ngoại khoa': 'ngoai-khoa',
  'Nha khoa': 'rang-ham-mat',
  'Nha khoa tổng quát': 'rang-ham-mat',
  'Nha khoa trẻ em': 'rang-ham-mat',
  'Niềng răng': 'rang-ham-mat',
  'Trồng răng implant': 'rang-ham-mat',
  'Bọc răng sứ': 'rang-ham-mat',
};

const PROVINCE_CODES: Record<string, string> = {
  'Hà Nội': '01',
  'Ha Noi': '01',
  'TP Hà Nội': '01',
  'TP. Hồ Chí Minh': '79',
  'TP HCM': '79',
  'Hồ Chí Minh': '79',
  'Đà Nẵng': '48',
  'Da Nang': '48',
};

function requireEnv(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v == null || v === '') throw new Error(`Missing env: ${name}`);
  return v;
}

function asNumberId(id: unknown): number {
  if (typeof id === 'number') return id;
  if (typeof id === 'string') return Number(id);
  return Number(id as never);
}

function slugifySpecialtyName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 140);
}

function resolveSpecialtySlug(name: string): string {
  const trimmed = name.trim();
  if (SPECIALTY_ALIASES[trimmed]) return SPECIALTY_ALIASES[trimmed];
  const slug = slugifySpecialtyName(trimmed);
  return slug || 'chuyen-khoa-khac';
}

function provinceToCode(province: string | null): string | null {
  if (!province) return null;
  const key = province.trim();
  return PROVINCE_CODES[key] ?? key.slice(0, 120);
}

function crawlEmail(sourceDoctorId: string): string {
  return `crawl.bc.${sourceDoctorId}@precision.vn`.toLowerCase();
}

function crawlPhone(sourceDoctorId: string): string {
  const digits = String(sourceDoctorId).replace(/\D/g, '').slice(-8).padStart(8, '0');
  return `09${digits}`;
}

function parseTimeParts(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(':').map((x) => Number(x));
  return { hour: h || 0, minute: m || 0 };
}

/** weekday crawl: 1 = Thứ 2 … 7 = Chủ nhật */
function nextDateForIsoWeekday(isoWeekday: number, base: Date): Date {
  const d = new Date(base);
  const jsDay = d.getDay();
  const currentIso = jsDay === 0 ? 7 : jsDay;
  let diff = isoWeekday - currentIso;
  if (diff <= 0) diff += 7;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildSlotTimestamps(slotDate: Date, startAt: string, endAt: string): { start: Date; end: Date } {
  const startParts = parseTimeParts(startAt);
  const endParts = parseTimeParts(endAt);
  const start = new Date(slotDate);
  start.setHours(startParts.hour, startParts.minute, 0, 0);
  const end = new Date(slotDate);
  end.setHours(endParts.hour, endParts.minute, 0, 0);
  if (end.getTime() <= start.getTime()) {
    end.setTime(end.getTime() + 24 * 60 * 60 * 1000);
  }
  return { start, end };
}

function initCloudinary(): void {
  if (SKIP_CLOUDINARY) return;
  cloudinary.config({
    cloud_name: requireEnv('CLOUDINARY_CLOUD_NAME'),
    api_key: requireEnv('CLOUDINARY_API_KEY'),
    api_secret: requireEnv('CLOUDINARY_API_SECRET'),
    secure: true,
  });
}

function isCloudinaryAvatarUrl(url: string | null | undefined): boolean {
  return Boolean(url && url.includes('res.cloudinary.com'));
}

async function downloadAvatarBuffer(imageUrl: string): Promise<Buffer> {
  const res = await fetch(imageUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; HealthAssistantSeed/1.0)',
      Accept: 'image/*,*/*',
    },
    signal: AbortSignal.timeout(AVATAR_DOWNLOAD_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`Tải ảnh thất bại HTTP ${res.status}`);
  }
  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.startsWith('image/') && !contentType.includes('octet-stream')) {
    throw new Error(`URL không phải ảnh (content-type=${contentType || 'unknown'})`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function uploadAvatarBufferToCloudinary(
  userId: string,
  buffer: Buffer,
): Promise<{ secureUrl: string; publicId: string }> {
  const folder = process.env.CLOUDINARY_AVATAR_FOLDER || 'health-assistant/avatars';
  const publicId = `crawl_${userId}_${Date.now()}`;

  return await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'image',
        overwrite: true,
        transformation: [
          { width: 256, height: 256, crop: 'fill', gravity: 'face' },
          { fetch_format: 'auto', quality: 'auto' },
        ],
      },
      (err, result) => {
        if (err || !result?.secure_url || !result.public_id) {
          reject(err ?? new Error('Cloudinary upload_stream failed'));
          return;
        }
        resolve({ secureUrl: result.secure_url, publicId: result.public_id });
      },
    );
    stream.end(buffer);
  });
}

async function uploadAvatarFromCrawlUrl(
  userId: string,
  imageUrl: string,
): Promise<{ secureUrl: string; publicId: string }> {
  const buffer = await downloadAvatarBuffer(imageUrl);
  return uploadAvatarBufferToCloudinary(userId, buffer);
}

function shouldUploadCrawlAvatar(user: User, avatarUrl: string | null | undefined): boolean {
  if (SKIP_CLOUDINARY || !avatarUrl) return false;
  if (FORCE_CLOUDINARY_AVATAR) {
    return !isCloudinaryAvatarUrl(user.avatarUrl);
  }
  return !user.avatarUrl || !isCloudinaryAvatarUrl(user.avatarUrl);
}

function loadCrawlData(): CrawlDoctor[] {
  if (!fs.existsSync(CRAWL_JSON)) {
    throw new Error(`Crawl JSON not found: ${CRAWL_JSON}`);
  }
  const raw = fs.readFileSync(CRAWL_JSON, 'utf8');
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) throw new Error('Crawl JSON must be an array');
  return parsed as CrawlDoctor[];
}

async function seedCrawlDoctors() {
  const rows = loadCrawlData();
  const withAvatar = rows.filter((r) => r.normalized?.avatarUrl?.trim()).length;
  // eslint-disable-next-line no-console
  console.log(
    `[seed-crawl-doctors] Đọc ${rows.length} bác sĩ từ JSON (${withAvatar} có avatarUrl). ` +
      `File 22k+ dòng chủ yếu là slots — không phải 22k bác sĩ.`,
  );
  initCloudinary();
  if (SKIP_CLOUDINARY) {
    // eslint-disable-next-line no-console
    console.warn('[seed-crawl-doctors] SEED_SKIP_CLOUDINARY=1 — bỏ qua upload Cloudinary');
  }

  const ssl = getPostgresSslOption();
  const dataSource = new DataSource({
    type: 'postgres',
    host: requireEnv('DB_HOST', 'localhost'),
    port: parseInt(requireEnv('DB_PORT', '5432'), 10),
    username: requireEnv('DB_USERNAME', 'postgres'),
    password: requireEnv('DB_PASSWORD', 'postgres'),
    database: requireEnv('DB_DATABASE', 'health_assistant'),
    ...(ssl && { ssl }),
    entities: [User, Role, UserRole, PatientProfile, DoctorProfile, Specialty, DoctorSpecialty, DoctorAvailableSlot],
    synchronize: false,
    logging: false,
  });

  await dataSource.initialize();

  const stats = {
    total: rows.length,
    createdUsers: 0,
    updatedProfiles: 0,
    avatarsUploaded: 0,
    avatarFailures: 0,
    specialtiesCreated: 0,
    slotsCreated: 0,
    skipped: 0,
    passwordsReset: 0,
  };

  await dataSource.transaction(async (manager) => {
    const txUserRepo = manager.getRepository(User);
    const txUserRoleRepo = manager.getRepository(UserRole);
    const txDoctorRepo = manager.getRepository(DoctorProfile);
    const txSpecialtyRepo = manager.getRepository(Specialty);
    const txDoctorSpecialtyRepo = manager.getRepository(DoctorSpecialty);
    const txSlotRepo = manager.getRepository(DoctorAvailableSlot);

    const doctorRole = await manager.getRepository(Role).findOne({ where: { code: 'doctor' } });
    if (!doctorRole) throw new Error('Role doctor not found — chạy npm run seed trước');
    const doctorPasswordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    const specialtyBySlug = new Map<string, Specialty>();
    const allSpecs = await txSpecialtyRepo.find();
    for (const s of allSpecs) specialtyBySlug.set(s.slug, s);

    async function ensureSpecialtyByName(name: string): Promise<Specialty> {
      const slug = resolveSpecialtySlug(name);
      let spec = specialtyBySlug.get(slug);
      if (spec) return spec;

      const existing = await txSpecialtyRepo.findOne({ where: { slug } });
      if (existing) {
        specialtyBySlug.set(slug, existing);
        return existing;
      }

      spec = await txSpecialtyRepo.save(
        txSpecialtyRepo.create({
          slug,
          name: name.trim(),
          description: `Chuyên khoa (seed crawl): ${name.trim()}`,
          status: 'active',
        }),
      );
      specialtyBySlug.set(slug, spec);
      stats.specialtiesCreated += 1;
      return spec;
    }

    async function ensureUser(params: {
      email: string;
      fullName: string;
      phone: string;
    }): Promise<{ user: User; isNew: boolean }> {
      const email = params.email.trim().toLowerCase();
      const existing = await txUserRepo.findOne({ where: { email } });
      if (existing) {
        existing.passwordHash = doctorPasswordHash;
        const user = await txUserRepo.save(existing);
        return { user, isNew: false };
      }

      const phone = params.phone.slice(0, 20);
      const user = await txUserRepo.save(
        txUserRepo.create({
          email,
          fullName: params.fullName,
          passwordHash: doctorPasswordHash,
          phone,
          status: 'active',
        }),
      );
      return { user, isNew: true };
    }

    const now = new Date();

    for (const row of rows) {
      const n = row.normalized;
      if (!n?.sourceDoctorId || !n.fullName) {
        stats.skipped += 1;
        continue;
      }

      const email = crawlEmail(n.sourceDoctorId);
      const phone = crawlPhone(n.sourceDoctorId);

      // eslint-disable-next-line no-await-in-loop
      const { user, isNew } = await ensureUser({
        email,
        fullName: n.fullName.trim(),
        phone,
      });
      if (isNew) stats.createdUsers += 1;

      // eslint-disable-next-line no-await-in-loop
      const roleLink = await txUserRoleRepo.findOne({
        where: { userId: user.id, roleId: doctorRole.id },
      });
      if (!roleLink) {
        // eslint-disable-next-line no-await-in-loop
        await txUserRoleRepo.save(
          txUserRoleRepo.create({ userId: user.id, roleId: doctorRole.id }),
        );
      }

      const feeAmount = n.consultationFee?.amount ?? 0;
      const profilePayload = {
        professionalTitle: n.professionalTitle?.trim() || 'Bác sĩ',
        licenseNumber: `CRAWL-BC-${n.sourceDoctorId}`,
        yearsOfExperience: n.yearsOfExperience ?? null,
        bio: n.bio?.trim() || null,
        workplaceName: n.workplaceName?.trim() || null,
        workplaceAddress: n.workplaceAddressText?.trim() || null,
        provinceCode: provinceToCode(n.province),
        districtCode: n.district?.trim()?.slice(0, 120) ?? null,
        consultationFee: String(feeAmount > 0 ? feeAmount : 200000),
        isVerified: true,
        verificationStatus: 'approved',
        isAvailableForBooking: true,
        priorityScore: 0,
      };

      // eslint-disable-next-line no-await-in-loop
      let profile = await txDoctorRepo.findOne({ where: { userId: user.id } });
      if (!profile) {
        // eslint-disable-next-line no-await-in-loop
        profile = await txDoctorRepo.save(
          txDoctorRepo.create({ userId: user.id, ...profilePayload }),
        );
      } else {
        Object.assign(profile, profilePayload);
        // eslint-disable-next-line no-await-in-loop
        profile = await txDoctorRepo.save(profile);
        stats.updatedProfiles += 1;
      }

      const avatarUrl = n.avatarUrl?.trim() || null;

      if (shouldUploadCrawlAvatar(user, avatarUrl)) {
        try {
          // eslint-disable-next-line no-console
          console.log(`[seed-crawl-doctors] Upload avatar → Cloudinary: ${email}`);
          // eslint-disable-next-line no-await-in-loop
          const uploaded = await uploadAvatarFromCrawlUrl(user.id, avatarUrl as string);
          if (user.avatarPublicId && user.avatarPublicId !== uploaded.publicId) {
            try {
              await cloudinary.uploader.destroy(user.avatarPublicId, { resource_type: 'image' });
            } catch {
              /* best-effort */
            }
          }
          user.avatarUrl = uploaded.secureUrl;
          user.avatarPublicId = uploaded.publicId;
          // eslint-disable-next-line no-await-in-loop
          await txUserRepo.save(user);
          stats.avatarsUploaded += 1;
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error(`[seed-crawl-doctors] Avatar FAIL ${email}: ${(err as Error).message}`);
          stats.avatarFailures += 1;
        }
      } else if (!SKIP_CLOUDINARY && avatarUrl && isCloudinaryAvatarUrl(user.avatarUrl)) {
        // eslint-disable-next-line no-console
        console.log(`[seed-crawl-doctors] Giữ avatar Cloudinary: ${email}`);
      }

      const specs = n.specialties?.length ? n.specialties : [{ name: 'Khám tổng quát', isPrimary: true }];
      let primaryLinked = false;
      for (const specRow of specs) {
        if (!specRow.name?.trim()) continue;
        // eslint-disable-next-line no-await-in-loop
        const spec = await ensureSpecialtyByName(specRow.name);
        const specId = asNumberId(spec.id);
        const isPrimary = Boolean(specRow.isPrimary) || (!primaryLinked && specRow === specs[0]);
        // eslint-disable-next-line no-await-in-loop
        const link = await txDoctorSpecialtyRepo.findOne({
          where: { doctorUserId: user.id, specialtyId: specId },
        });
        if (!link) {
          // eslint-disable-next-line no-await-in-loop
          await txDoctorSpecialtyRepo.save(
            txDoctorSpecialtyRepo.create({
              doctorUserId: user.id,
              specialtyId: specId,
              isPrimary,
            }),
          );
        } else if (isPrimary && !link.isPrimary) {
          link.isPrimary = true;
          // eslint-disable-next-line no-await-in-loop
          await txDoctorSpecialtyRepo.save(link);
        }
        if (isPrimary) primaryLinked = true;
      }

      const primarySpec =
        specs.find((s) => s.isPrimary) ?? specs[0];
      // eslint-disable-next-line no-await-in-loop
      const primarySpecialty = primarySpec?.name
        ? await ensureSpecialtyByName(primarySpec.name)
        : null;

      // eslint-disable-next-line no-await-in-loop
      const existingSlotCount = await txSlotRepo.count({ where: { doctorUserId: user.id } });
      if (existingSlotCount === 0 && primarySpecialty && n.slots?.length) {
        const patternSeen = new Set<string>();
        let created = 0;
        for (const slot of n.slots) {
          if (created >= MAX_SLOTS_PER_DOCTOR) break;
          if (!slot.weekday || !slot.startAt || !slot.endAt) continue;
          const patternKey = `${slot.weekday}-${slot.startAt}-${slot.endAt}`;
          if (patternSeen.has(patternKey)) continue;
          patternSeen.add(patternKey);

          const slotDate = slot.date
            ? new Date(slot.date)
            : nextDateForIsoWeekday(slot.weekday, now);
          const { start, end } = buildSlotTimestamps(slotDate, slot.startAt, slot.endAt);

          // eslint-disable-next-line no-await-in-loop
          await txSlotRepo.save(
            txSlotRepo.create({
              doctorUserId: user.id,
              specialtyId: asNumberId(primarySpecialty.id),
              slotDate: new Date(start.toISOString().slice(0, 10)),
              startAt: start,
              endAt: end,
              maxBookings: slot.maxBookings && slot.maxBookings > 0 ? slot.maxBookings : 1,
              bookedCount: 0,
              status: 'available',
              source: 'crawl',
            }),
          );
          created += 1;
          stats.slotsCreated += 1;
        }
      }
    }

    const allDoctorUsers = await txUserRepo
      .createQueryBuilder('u')
      .innerJoin(UserRole, 'ur', 'ur.user_id = u.id AND ur.role_id = :roleId', { roleId: doctorRole.id })
      .getMany();
    for (const u of allDoctorUsers) {
      u.passwordHash = doctorPasswordHash;
      // eslint-disable-next-line no-await-in-loop
      await txUserRepo.save(u);
    }
    stats.passwordsReset = allDoctorUsers.length;
  });

  const [users, doctors, specs, slots] = await Promise.all([
    dataSource.getRepository(User).count(),
    dataSource.getRepository(DoctorProfile).count(),
    dataSource.getRepository(Specialty).count(),
    dataSource.getRepository(DoctorAvailableSlot).count(),
  ]);

  // eslint-disable-next-line no-console
  console.log(
    [
      '[seed-crawl-doctors] done',
      `file=${CRAWL_JSON}`,
      `crawl_rows=${stats.total}`,
      `new_users=${stats.createdUsers}`,
      `profiles_updated=${stats.updatedProfiles}`,
      `avatars_cloudinary=${stats.avatarsUploaded}`,
      `avatar_failures=${stats.avatarFailures}`,
      `specialties_created=${stats.specialtiesCreated}`,
      `slots_created=${stats.slotsCreated}`,
      `skipped=${stats.skipped}`,
      `doctor_passwords_reset=${stats.passwordsReset}`,
      `db_users=${users}`,
      `db_doctors=${doctors}`,
      `db_specialties=${specs}`,
      `db_slots=${slots}`,
      `login_password=${DEFAULT_PASSWORD}`,
      `email_pattern=crawl.bc.<sourceDoctorId>@precision.vn`,
    ].join(' | '),
  );

  await dataSource.destroy();
}

seedCrawlDoctors().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error('[seed-crawl-doctors] failed', err);
  process.exitCode = 1;
});
