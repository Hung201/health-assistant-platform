import { IsString, MinLength, MaxLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @MinLength(32, { message: 'Liên kết đặt lại mật khẩu không hợp lệ' })
  @MaxLength(128, { message: 'Liên kết đặt lại mật khẩu không hợp lệ' })
  token: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu tối thiểu 6 ký tự' })
  @MaxLength(200, { message: 'Mật khẩu quá dài' })
  newPassword: string;
}
