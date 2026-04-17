import { IsIn, IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';

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
  @IsString()
  @MaxLength(255)
  occupation?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  bloodType?: string | null;
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
}

