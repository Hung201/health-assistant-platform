import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectBookingDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reason?: string;
}
