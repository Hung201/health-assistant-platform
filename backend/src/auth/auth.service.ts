import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { SignOptions } from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { createHash, randomInt } from 'crypto';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user-role.entity';
import { Role } from '../entities/role.entity';
import { PatientProfile } from '../entities/patient-profile.entity';
import { DoctorProfile } from '../entities/doctor-profile.entity';
import { Specialty } from '../entities/specialty.entity';
import { DoctorSpecialty } from '../entities/doctor-specialty.entity';
import { UserIdentity } from '../entities/user-identity.entity';
import { PatientEmailVerification } from '../entities/patient-email-verification.entity';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { GoogleAuthUser } from './strategies/google.strategy';
import { VerifyPatientEmailDto } from './dto/verify-patient-email.dto';
import { ResendPatientEmailCodeDto } from './dto/resend-patient-email-code.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(UserIdentity)
    private readonly userIdentityRepository: Repository<UserIdentity>,
    @InjectRepository(PatientEmailVerification)
    private readonly patientEmailVerificationRepository: Repository<PatientEmailVerification>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  private getEmailCodeExpiresMinutes(): number {
    const n = Number(this.configService.get<string>('PATIENT_VERIFY_CODE_EXPIRES_MINUTES') ?? '10');
    if (!Number.isFinite(n) || n < 1) return 10;
    return Math.min(60, Math.round(n));
  }

  private generateEmailCode(): string {
    return String(randomInt(0, 1_000_000)).padStart(6, '0');
  }

  private hashEmailCode(email: string, code: string): string {
    const secret = this.configService.get<string>('JWT_SECRET') || 'email-code-secret';
    return createHash('sha256')
      .update(`${email.toLowerCase()}|${code}|${secret}`)
      .digest('hex');
  }

  private async issuePatientEmailCode(user: User) {
    const code = this.generateEmailCode();
    const expiresMinutes = this.getEmailCodeExpiresMinutes();
    const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);
    const codeHash = this.hashEmailCode(user.email, code);

    const existing = await this.patientEmailVerificationRepository.findOne({ where: { userId: user.id } });
    if (existing) {
      existing.email = user.email;
      existing.codeHash = codeHash;
      existing.expiresAt = expiresAt;
      existing.attempts = 0;
      await this.patientEmailVerificationRepository.save(existing);
    } else {
      await this.patientEmailVerificationRepository.save(
        this.patientEmailVerificationRepository.create({
          userId: user.id,
          email: user.email,
          codeHash,
          expiresAt,
          attempts: 0,
        }),
      );
    }

    await this.mailService.sendPatientVerifyCode({
      to: user.email,
      fullName: user.fullName,
      code,
      expiresMinutes,
    });
  }

  async register(dto: RegisterDto) {
    const roleCode = dto.role ?? 'patient';
    const role = await this.userRoleRepository.manager
      .getRepository(Role)
      .findOne({ where: { code: roleCode } });
    if (!role) {
      throw new BadRequestException(
        `Không tìm thấy vai trò "${roleCode}" trong bảng roles. Chạy file database/schema.sql (phần INSERT roles).`,
      );
    }

    const existing = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Email đã được sử dụng');
    }

    let phone: string | null = null;
    if (dto.phone != null && dto.phone.trim() !== '') {
      const normalized = dto.phone.replace(/\s+/g, '').slice(0, 20);
      if (normalized.length > 0) {
        const phoneTaken = await this.userRepository.findOne({
          where: { phone: normalized },
        });
        if (phoneTaken) {
          throw new ConflictException('Số điện thoại đã được sử dụng');
        }
        phone = normalized;
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const initialStatus = roleCode === 'patient' ? 'pending_email_verification' : 'active';
    const user = this.userRepository.create({
      email: dto.email.toLowerCase(),
      fullName: dto.fullName,
      passwordHash,
      status: initialStatus,
      phone,
    });
    const savedUser = await this.userRepository.save(user);

    await this.userRoleRepository.save({
      userId: savedUser.id,
      roleId: role.id,
    });

    if (roleCode === 'patient') {
      await this.userRoleRepository.manager.getRepository(PatientProfile).save({
        userId: savedUser.id,
      });
    } else if (roleCode === 'doctor') {
      const manager = this.userRoleRepository.manager;
      if (dto.specialtyId == null || Number.isNaN(Number(dto.specialtyId))) {
        throw new BadRequestException('Bác sĩ phải chọn 1 chuyên khoa chính');
      }
      const license =
        dto.licenseNumber != null && dto.licenseNumber.trim() !== ''
          ? dto.licenseNumber.trim()
          : null;
      await manager.getRepository(DoctorProfile).save({
        userId: savedUser.id,
        licenseNumber: license,
      });
      const spec = await manager.getRepository(Specialty).findOne({
        where: { id: dto.specialtyId, status: 'active' },
      });
      if (!spec) {
        throw new BadRequestException('Chuyên khoa không hợp lệ hoặc đã ngưng hoạt động');
      }
      const sid = typeof spec.id === 'string' ? Number(spec.id) : spec.id;
      await manager.getRepository(DoctorSpecialty).save({
        doctorUserId: savedUser.id,
        specialtyId: sid,
        isPrimary: true,
      });
    }

    if (roleCode === 'patient') {
      await this.issuePatientEmailCode(savedUser);
      return {
        requiresEmailVerification: true,
        email: savedUser.email,
      };
    }

    const token = this.generateToken(savedUser.id, savedUser.email, [role.code]);
    return {
      access_token: token,
      user: {
        id: savedUser.id,
        email: savedUser.email,
        fullName: savedUser.fullName,
        roles: [role.code],
      },
      requiresEmailVerification: false,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
      relations: ['userRoles', 'userRoles.role'],
    });
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }
    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }
    if (user.status === 'disabled') {
      throw new UnauthorizedException('Tài khoản đã bị khóa');
    }
    if (user.status === 'pending_email_verification') {
      throw new UnauthorizedException(
        'Tài khoản chưa xác thực email (đang chờ kích hoạt). Vui lòng nhập mã đã gửi về email hoặc gửi lại mã trên trang xác thực.',
      );
    }
    if (user.status !== 'active') {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }
    const roles = user.userRoles?.map((ur) => ur.role?.code) || [];
    if (roles.includes('patient') && !user.emailVerifiedAt) {
      throw new UnauthorizedException('Tài khoản chưa xác thực email. Vui lòng nhập mã xác thực đã gửi về email.');
    }
    await this.userRepository.update(user.id, {
      lastLoginAt: new Date(),
    });
    const token = this.generateToken(user.id, user.email, roles.filter(Boolean) as string[]);
    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roles,
      },
    };
  }

  async listActiveSpecialties(): Promise<{ id: number; name: string; slug: string }[]> {
    const rows = await this.userRoleRepository.manager.getRepository(Specialty).find({
      where: { status: 'active' },
      select: ['id', 'name', 'slug'],
      order: { name: 'ASC' },
    });
    return rows.map((s) => ({
      id: typeof s.id === 'string' ? Number(s.id) : s.id,
      name: s.name,
      slug: s.slug,
    }));
  }

  async verifyPatientEmail(dto: VerifyPatientEmailDto) {
    const email = dto.email.trim().toLowerCase();
    const code = dto.code.trim();
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['userRoles', 'userRoles.role'],
    });
    if (!user) throw new BadRequestException('Email hoặc mã xác thực không đúng');
    if (user.status === 'disabled') throw new BadRequestException('Tài khoản đã bị khóa');

    const roles = (user.userRoles?.map((ur) => ur.role?.code).filter(Boolean) as string[]) ?? [];
    if (!roles.includes('patient')) throw new BadRequestException('Tính năng này chỉ áp dụng cho tài khoản bệnh nhân');
    if (user.emailVerifiedAt) {
      const token = this.generateToken(user.id, user.email, roles);
      return { access_token: token, alreadyVerified: true };
    }

    const verification = await this.patientEmailVerificationRepository.findOne({
      where: { userId: user.id },
    });
    if (!verification) throw new BadRequestException('Không tìm thấy mã xác thực. Vui lòng gửi lại mã mới.');
    if (verification.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Mã xác thực đã hết hạn. Vui lòng gửi lại mã mới.');
    }

    const expectedHash = this.hashEmailCode(email, code);
    if (verification.codeHash !== expectedHash) {
      verification.attempts += 1;
      await this.patientEmailVerificationRepository.save(verification);
      throw new BadRequestException('Mã xác thực không đúng');
    }

    user.emailVerifiedAt = new Date();
    user.status = 'active';
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);
    await this.patientEmailVerificationRepository.delete({ userId: user.id });

    const token = this.generateToken(user.id, user.email, roles);
    return { access_token: token, alreadyVerified: false };
  }

  async resendPatientEmailCode(dto: ResendPatientEmailCodeDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['userRoles', 'userRoles.role'],
    });
    if (!user) return { ok: true };
    if (user.status === 'disabled') return { ok: true };
    const roles = (user.userRoles?.map((ur) => ur.role?.code).filter(Boolean) as string[]) ?? [];
    if (!roles.includes('patient') || user.emailVerifiedAt) return { ok: true };

    await this.issuePatientEmailCode(user);
    return { ok: true };
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId, status: 'active' },
      relations: ['userRoles', 'userRoles.role'],
    });
  }

  async loginWithGoogle(googleUser: GoogleAuthUser) {
    const provider = 'google' as const;
    const providerSub = googleUser.providerSub;
    const email = googleUser.email?.trim().toLowerCase() ?? null;

    // 1) Prefer linking by provider sub.
    const existingIdentity = await this.userIdentityRepository.findOne({
      where: { provider, providerSub },
    });

    let user: User | null = null;
    if (existingIdentity) {
      user = await this.userRepository.findOne({
        where: { id: existingIdentity.userId, status: 'active' },
        relations: ['userRoles', 'userRoles.role'],
      });
    }

    // 2) If no identity found, try linking by email (common case).
    if (!user && email) {
      const byEmail = await this.userRepository.findOne({
        where: { email, status: 'active' },
        relations: ['userRoles', 'userRoles.role'],
      });
      if (byEmail) {
        user = byEmail;
        await this.userIdentityRepository.save(
          this.userIdentityRepository.create({
            userId: user.id,
            provider,
            providerSub,
            providerEmail: email,
          }),
        );
      }
    }

    // 3) Create user + identity when missing.
    if (!user) {
      const fullName = (googleUser.fullName?.trim() || email || 'Người dùng').slice(0, 255);
      const passwordHash = await bcrypt.hash(`${provider}:${providerSub}:${Date.now()}`, 10);

      const created = await this.userRepository.save(
        this.userRepository.create({
          email: email ?? `${providerSub}@google.local`,
          fullName,
          passwordHash,
          status: 'active',
          avatarUrl: googleUser.avatarUrl,
          emailVerifiedAt: email ? new Date() : null,
        }),
      );

      await this.userIdentityRepository.save(
        this.userIdentityRepository.create({
          userId: created.id,
          provider,
          providerSub,
          providerEmail: email,
        }),
      );

      // Default role = patient
      const role = await this.userRoleRepository.manager
        .getRepository(Role)
        .findOne({ where: { code: 'patient' } });
      if (role) {
        await this.userRoleRepository.save({ userId: created.id, roleId: role.id });
      }
      await this.userRoleRepository.manager.getRepository(PatientProfile).save({
        userId: created.id,
      });

      user = await this.userRepository.findOne({
        where: { id: created.id, status: 'active' },
        relations: ['userRoles', 'userRoles.role'],
      });
    }

    if (!user) {
      throw new UnauthorizedException('Không thể đăng nhập bằng Google');
    }

    await this.userRepository.update(user.id, { lastLoginAt: new Date() });
    const roles = (user.userRoles?.map((ur) => ur.role?.code).filter(Boolean) as string[]) ?? [];
    const token = this.generateToken(user.id, user.email, roles);
    return {
      access_token: token,
      user: { id: user.id, email: user.email, fullName: user.fullName, roles },
    };
  }

  private generateToken(userId: string, email: string, roles: string[]): string {
    const signOptions: SignOptions = {
      expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as SignOptions['expiresIn'],
    };
    return this.jwtService.sign({ sub: userId, email, roles }, signOptions);
  }
}
