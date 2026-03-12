import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu tối thiểu 6 ký tự' })
  password: string;

  @IsString()
  @MinLength(2, { message: 'Họ tên tối thiểu 2 ký tự' })
  fullName: string;

  @IsOptional()
  @IsIn(['patient', 'doctor', 'admin'], { message: 'Vai trò không hợp lệ' })
  role?: 'patient' | 'doctor' | 'admin';
}
