import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateMyPatientProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  emergencyContactName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  emergencyContactPhone?: string | null;

  @IsOptional()
  @IsString()
  addressLine?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  provinceCode?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  districtCode?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  wardCode?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  occupation?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  bloodType?: string | null;
}

export class UpdateMyDoctorProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  professionalTitle?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  licenseNumber?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(80)
  yearsOfExperience?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  workplaceName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  workplaceAddress?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  provinceCode?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  districtCode?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  wardCode?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1000000000)
  consultationFee?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  bio?: string | null;

  @IsOptional()
  @IsBoolean()
  isAvailableForBooking?: boolean | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  specialtyId?: number;
}

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string | null;

  @IsOptional()
  @IsISO8601({ strict: true })
  dateOfBirth?: string | null;

  @IsOptional()
  @IsString()
  @IsIn(['male', 'female', 'other', 'unknown'])
  gender?: string | null;

  @IsOptional()
  patientProfile?: UpdateMyPatientProfileDto;

  @IsOptional()
  doctorProfile?: UpdateMyDoctorProfileDto;
}

