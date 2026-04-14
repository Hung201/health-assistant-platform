import { Type } from 'class-transformer';
import { IsInt, IsISO8601, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateSlotDto {
  @IsISO8601()
  startAt: string;

  @IsISO8601()
  endAt: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  specialtyId?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  maxBookings: number;
}

