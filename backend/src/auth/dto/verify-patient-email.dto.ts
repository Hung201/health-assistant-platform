import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyPatientEmailDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsString()
  @Length(6, 6, { message: 'Mã xác thực gồm 6 chữ số' })
  code: string;
}
