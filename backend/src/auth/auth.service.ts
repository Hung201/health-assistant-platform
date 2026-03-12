import {
  Injectable,
  UnauthorizedException,
  ConflictException,
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
    const existing = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Email đã được sử dụng');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      email: dto.email.toLowerCase(),
      fullName: dto.fullName,
      passwordHash,
      status: 'active',
    });
    const savedUser = await this.userRepository.save(user);

    const role = await this.userRoleRepository.manager
      .getRepository(Role)
      .findOne({ where: { code: dto.role || 'patient' } });
    if (role) {
      await this.userRoleRepository.save({
        userId: savedUser.id,
        roleId: role.id,
      });
    }

    if (dto.role === 'patient') {
      await this.userRoleRepository.manager.getRepository(PatientProfile).save({
        userId: savedUser.id,
      });
    } else if (dto.role === 'doctor') {
      await this.userRoleRepository.manager.getRepository(DoctorProfile).save({
        userId: savedUser.id,
      });
    }

    const token = this.generateToken(savedUser.id, savedUser.email);
    return {
      access_token: token,
      user: {
        id: savedUser.id,
        email: savedUser.email,
        fullName: savedUser.fullName,
        role: dto.role || 'patient',
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
    const token = this.generateToken(user.id, user.email);
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

  async validateUser(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId, status: 'active' },
      relations: ['userRoles', 'userRoles.role'],
    });
  }

  private generateToken(userId: string, email: string): string {
    const signOptions: SignOptions = {
      expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as SignOptions['expiresIn'],
    };
    return this.jwtService.sign({ sub: userId, email }, signOptions);
  }
}
