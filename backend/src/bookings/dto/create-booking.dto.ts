import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateBookingDto {
  @Type(() => Number)
  @IsInt()
  availableSlotId: number;

  /** Optional: nếu gửi, dùng để validate slot thuộc chuyên khoa đó. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  specialtyId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  patientNote?: string;

  /** Thanh toán online (MoMo sau khi bác sĩ duyệt) hoặc tại viện. */
  @IsOptional()
  @IsIn(['momo', 'pay_at_clinic'])
  paymentMethod?: 'momo' | 'pay_at_clinic';
}

