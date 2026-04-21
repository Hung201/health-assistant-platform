import {
  BadRequestException,
  Controller,
  Get,
  Patch,
  Post,
  Body,
  ForbiddenException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { CloudinaryService } from '../media/cloudinary.service';
import { UsersService } from './users.service';
import { instanceToPlain } from 'class-transformer';
import { UpdateMeDto } from './dto/update-me.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  @Get('me')
  async me(@CurrentUser() user: User) {
    const u = await this.usersService.findById(user.id);
    if (!u) return null;
    const doctorSpecialty = await this.usersService.getDoctorPrimarySpecialty(user.id);
    const roles = u.userRoles?.map((ur) => ur.role?.code).filter(Boolean) || [];
    return {
      ...instanceToPlain(u),
      roles,
      doctorSpecialty,
      patientProfile: u.patientProfile
        ? {
            emergencyContactName: u.patientProfile.emergencyContactName,
            emergencyContactPhone: u.patientProfile.emergencyContactPhone,
            addressLine: u.patientProfile.addressLine,
            provinceCode: u.patientProfile.provinceCode,
            districtCode: u.patientProfile.districtCode,
            wardCode: u.patientProfile.wardCode,
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
            isAvailableForBooking: u.doctorProfile.isAvailableForBooking,
            isVerified: u.doctorProfile.isVerified,
            verificationStatus: u.doctorProfile.verificationStatus,
          }
        : null,
    };
  }

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@CurrentUser() user: User, @UploadedFile() file?: any) {
    if (!file) throw new BadRequestException('Thiếu file');
    if (!file.mimetype?.startsWith('image/')) throw new BadRequestException('Chỉ hỗ trợ file ảnh');
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) throw new BadRequestException('Ảnh quá lớn (tối đa 5MB)');

    const u = await this.usersService.findById(user.id);
    const oldPublicId = u?.avatarPublicId ?? null;

    const uploaded = await this.cloudinary.uploadAvatar({ userId: user.id, buffer: file.buffer });
    await this.usersService.updateAvatar(user.id, {
      avatarUrl: uploaded.secureUrl,
      avatarPublicId: uploaded.publicId,
    });

    if (oldPublicId && oldPublicId !== uploaded.publicId) {
      await this.cloudinary.destroy(oldPublicId);
    }

    return { ok: true, avatarUrl: uploaded.secureUrl };
  }

  @Patch('me')
  async updateMe(@CurrentUser() user: User, @Body() dto: UpdateMeDto) {
    const normalizeNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v);
    const fullName = typeof dto.fullName === 'string' ? dto.fullName.trim().slice(0, 255) : undefined;

    const phone =
      dto.phone === undefined
        ? undefined
        : dto.phone == null
          ? null
          : String(dto.phone).replace(/\s+/g, '').slice(0, 20);

    const dateOfBirth =
      dto.dateOfBirth === undefined
        ? undefined
        : dto.dateOfBirth == null
          ? null
          : new Date(dto.dateOfBirth);

    const gender = dto.gender === undefined ? undefined : (normalizeNull(dto.gender) as string | null);

    await this.usersService.updateMe({
      userId: user.id,
      fullName: fullName || undefined,
      phone,
      dateOfBirth,
      gender,
      patientProfile: dto.patientProfile
        ? {
            emergencyContactName: (normalizeNull(dto.patientProfile.emergencyContactName) as string | null) ?? undefined,
            emergencyContactPhone:
              (normalizeNull(dto.patientProfile.emergencyContactPhone) as string | null) ?? undefined,
            addressLine: (normalizeNull(dto.patientProfile.addressLine) as string | null) ?? undefined,
            provinceCode: (normalizeNull(dto.patientProfile.provinceCode) as string | null) ?? undefined,
            districtCode: (normalizeNull(dto.patientProfile.districtCode) as string | null) ?? undefined,
            wardCode: (normalizeNull(dto.patientProfile.wardCode) as string | null) ?? undefined,
            occupation: (normalizeNull(dto.patientProfile.occupation) as string | null) ?? undefined,
            bloodType: (normalizeNull(dto.patientProfile.bloodType) as string | null) ?? undefined,
          }
        : undefined,
      doctorProfile: dto.doctorProfile
        ? {
            professionalTitle: (normalizeNull(dto.doctorProfile.professionalTitle) as string | null) ?? undefined,
            licenseNumber: (normalizeNull(dto.doctorProfile.licenseNumber) as string | null) ?? undefined,
            yearsOfExperience:
              dto.doctorProfile.yearsOfExperience === undefined ? undefined : (dto.doctorProfile.yearsOfExperience as any),
            workplaceName: (normalizeNull(dto.doctorProfile.workplaceName) as string | null) ?? undefined,
            consultationFee:
              dto.doctorProfile.consultationFee === undefined || dto.doctorProfile.consultationFee == null
                ? undefined
                : String(dto.doctorProfile.consultationFee),
            bio: (normalizeNull(dto.doctorProfile.bio) as string | null) ?? undefined,
            isAvailableForBooking:
              dto.doctorProfile.isAvailableForBooking === undefined ? undefined : (dto.doctorProfile.isAvailableForBooking as any),
          }
        : undefined,
      doctorSpecialtyId:
        dto.doctorProfile?.specialtyId === undefined ? undefined : Number(dto.doctorProfile.specialtyId),
    });

    const u = await this.usersService.findById(user.id);
    if (!u) throw new BadRequestException('Không tìm thấy user');
    const doctorSpecialty = await this.usersService.getDoctorPrimarySpecialty(user.id);
    const roles = u.userRoles?.map((ur) => ur.role?.code).filter(Boolean) || [];
    return {
      ok: true,
      user: {
        ...instanceToPlain(u),
        roles,
        doctorSpecialty,
        patientProfile: u.patientProfile
          ? {
              emergencyContactName: u.patientProfile.emergencyContactName,
              emergencyContactPhone: u.patientProfile.emergencyContactPhone,
              addressLine: u.patientProfile.addressLine,
              provinceCode: u.patientProfile.provinceCode,
              districtCode: u.patientProfile.districtCode,
              wardCode: u.patientProfile.wardCode,
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
              isAvailableForBooking: u.doctorProfile.isAvailableForBooking,
              isVerified: u.doctorProfile.isVerified,
              verificationStatus: u.doctorProfile.verificationStatus,
            }
          : null,
      },
    };
  }

  @Patch('me/password')
  async changePassword(@CurrentUser() user: User, @Body() dto: ChangePasswordDto) {
    const current = dto.currentPassword?.toString() ?? '';
    const next = dto.newPassword?.toString() ?? '';
    if (next.trim().length < 8) throw new BadRequestException('Mật khẩu mới phải có ít nhất 8 ký tự');

    const authUser = await this.usersService.findAuthUser(user.id);
    if (!authUser) throw new BadRequestException('Không tìm thấy user');

    if (current.trim() !== '') {
      const ok = await bcrypt.compare(current, authUser.passwordHash);
      if (!ok) throw new ForbiddenException('Mật khẩu hiện tại không đúng');
    } else {
      // Allow Google-login users to set password without current password.
      const ok = await this.usersService.hasGoogleIdentity(user.id);
      if (!ok) throw new ForbiddenException('Cần nhập mật khẩu hiện tại');
    }

    const passwordHash = await bcrypt.hash(next, 10);
    await this.usersService.updatePasswordHash(user.id, passwordHash);
    return { ok: true };
  }
}
