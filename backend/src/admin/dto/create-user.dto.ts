import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(2)
  @MaxLength(255)
  fullName: string;

  @IsString()
  @MinLength(6)
  @MaxLength(200)
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsIn(['patient', 'doctor', 'admin'])
  role: 'patient' | 'doctor' | 'admin';
}

