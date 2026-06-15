import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class AdminUpdatePostDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  @IsIn(['medical_article', 'announcement', 'case_study', 'health_tip', 'news', 'faq'])
  postType?: string;
}
