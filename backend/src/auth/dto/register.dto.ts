import { Type } from 'class-transformer';
import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsIn,
  IsInt,
  MaxLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu tối thiểu 6 ký tự' })
  password: string;

  @IsString()
  @MinLength(2, { message: 'Họ tên tối thiểu 2 ký tự' })
  fullName: string;

  /** Chỉ đăng ký công khai bệnh nhân hoặc bác sĩ (admin tạo nội bộ / seed). */
  @IsOptional()
  @IsIn(['patient', 'doctor'], { message: 'Vai trò không hợp lệ' })
  role?: 'patient' | 'doctor';

  /** Chỉ áp dụng khi role = doctor → doctor_profiles.license_number */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  licenseNumber?: string;

  /** Chỉ áp dụng khi role = doctor → doctor_specialties (chính) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  specialtyId?: number;

  /** Tùy chọn — lưu users.phone (chuẩn hóa khoảng trắng phía server). */
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;
}
