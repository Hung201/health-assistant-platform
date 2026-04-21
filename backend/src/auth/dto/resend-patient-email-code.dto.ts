import { IsEmail } from 'class-validator';

export class ResendPatientEmailCodeDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;
}
