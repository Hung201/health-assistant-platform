import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateDoctorReviewDto {
  @IsString()
  bookingId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  bedsideManner?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  clarity?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  waitTime?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;
}
