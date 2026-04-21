import { Type } from 'class-transformer';
import { IsEmail, IsIn, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateGuestBookingDto {
  @Type(() => Number)
  @IsInt()
  availableSlotId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  specialtyId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  patientNote?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(255)
  guestFullName: string;

  @IsString()
  @MinLength(8)
  @MaxLength(30)
  guestPhone: string;

  @IsEmail()
  @MaxLength(255)
  guestEmail: string;

  @IsIn(['momo', 'pay_at_clinic'])
  paymentMethod: 'momo' | 'pay_at_clinic';
}
