/**
 * Xóa user bác sĩ không có avatar_url (seed demo không ảnh).
 * Giữ crawl.bc.* (đã seed từ BookingCare + Cloudinary).
 *
 * Chạy: npm run cleanup:doctors-no-avatar
 * Dry-run: CLEANUP_DRY_RUN=1 npm run cleanup:doctors-no-avatar
 */
import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';

import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { PatientProfile } from './entities/patient-profile.entity';
import { DoctorProfile } from './entities/doctor-profile.entity';

loadEnv();

const DRY_RUN = process.env.CLEANUP_DRY_RUN === '1';
/** Không xóa tài khoản crawl đã có ảnh từ JSON */
const KEEP_EMAIL_PREFIX = 'crawl.bc.';

function requireEnv(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v == null || v === '') throw new Error(`Missing env: ${name}`);
  return v;
}

async function cleanup() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: requireEnv('DB_HOST', 'localhost'),
    port: parseInt(requireEnv('DB_PORT', '5432'), 10),
    username: requireEnv('DB_USERNAME', 'postgres'),
    password: requireEnv('DB_PASSWORD', 'postgres'),
    database: requireEnv('DB_DATABASE', 'health_assistant'),
    entities: [User, Role, UserRole, PatientProfile, DoctorProfile],
    synchronize: false,
    logging: false,
  });

  await dataSource.initialize();

  const userRepo = dataSource.getRepository(User);
  const roleRepo = dataSource.getRepository(Role);

  const doctorRole = await roleRepo.findOne({ where: { code: 'doctor' } });
  if (!doctorRole) throw new Error('Role doctor not found');

  const toDelete = await userRepo
    .createQueryBuilder('u')
    .innerJoin(UserRole, 'ur', 'ur.user_id = u.id AND ur.role_id = :roleId', { roleId: doctorRole.id })
    .where('(u.avatar_url IS NULL OR TRIM(u.avatar_url) = \'\')')
    .andWhere('LOWER(u.email) NOT LIKE :keepPrefix', { keepPrefix: `${KEEP_EMAIL_PREFIX}%` })
    .getMany();

  if (toDelete.length === 0) {
    // eslint-disable-next-line no-console
    console.log('[cleanup] Không có bác sĩ seed nào thiếu ảnh (đã giữ crawl.bc.*).');
    await dataSource.destroy();
    return;
  }

  // eslint-disable-next-line no-console
  console.log(`[cleanup] ${DRY_RUN ? 'DRY-RUN' : 'XÓA'} ${toDelete.length} bác sĩ không có avatar_url:`);
  for (const u of toDelete) {
    // eslint-disable-next-line no-console
    console.log(`  - ${u.email} | ${u.fullName}`);
  }

  if (!DRY_RUN) {
    await userRepo.remove(toDelete);
    // eslint-disable-next-line no-console
    console.log(`[cleanup] Đã xóa ${toDelete.length} user (cascade profile, slots, bookings…).`);
  }

  const remaining = await userRepo
    .createQueryBuilder('u')
    .innerJoin(UserRole, 'ur', 'ur.user_id = u.id AND ur.role_id = :roleId', { roleId: doctorRole.id })
    .getCount();

  // eslint-disable-next-line no-console
  console.log(`[cleanup] Còn ${remaining} bác sĩ trong hệ thống.`);

  await dataSource.destroy();
}

cleanup().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error('[cleanup] failed', err);
  process.exitCode = 1;
});
