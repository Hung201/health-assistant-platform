import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

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

  /** Bật/tắt livestream (ưu tiên khi gửi trực tiếp từ admin UI). */
  @IsOptional()
  @IsBoolean()
  livestream?: boolean;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => FeaturePermissionsPatchDto)
  featurePermissions?: FeaturePermissionsPatchDto;
}

