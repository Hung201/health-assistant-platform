import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateSpecialtyDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  /** Slug unique, lowercase + hyphen recommended (no strict regex for flexibility). */
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  slug: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  iconUrl?: string;

  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive';
}

