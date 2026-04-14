import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { SignOptions } from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user-role.entity';
import { Role } from '../entities/role.entity';
import { PatientProfile } from '../entities/patient-profile.entity';
import { DoctorProfile } from '../entities/doctor-profile.entity';
import { Specialty } from '../entities/specialty.entity';
import { DoctorSpecialty } from '../entities/doctor-specialty.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    private readonly jwtService: JwtService,
  ) {}

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
    const user = this.userRepository.create({
      email: dto.email.toLowerCase(),
      fullName: dto.fullName,
      passwordHash,
      status: 'active',
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
      const license =
        dto.licenseNumber != null && dto.licenseNumber.trim() !== ''
          ? dto.licenseNumber.trim()
          : null;
      await manager.getRepository(DoctorProfile).save({
        userId: savedUser.id,
        licenseNumber: license,
      });
      if (dto.specialtyId != null) {
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
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase(), status: 'active' },
      relations: ['userRoles', 'userRoles.role'],
    });
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }
    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }
    await this.userRepository.update(user.id, {
      lastLoginAt: new Date(),
    });
    const roles = user.userRoles?.map((ur) => ur.role?.code) || [];
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

  async validateUser(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId, status: 'active' },
      relations: ['userRoles', 'userRoles.role'],
    });
  }

  private generateToken(userId: string, email: string, roles: string[]): string {
    const signOptions: SignOptions = {
      expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as SignOptions['expiresIn'],
    };
    return this.jwtService.sign({ sub: userId, email, roles }, signOptions);
  }
}
