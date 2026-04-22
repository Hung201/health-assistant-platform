import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';

export class FeaturePermissionsPatchDto {
  @IsOptional()
  @IsBoolean()
  livestream?: boolean;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string | null;

  @IsOptional()
  @IsIn(['active', 'disabled'])
  status?: 'active' | 'disabled';

  @IsOptional()
  @ValidateNested()
  @Type(() => FeaturePermissionsPatchDto)
  featurePermissions?: FeaturePermissionsPatchDto;
}

