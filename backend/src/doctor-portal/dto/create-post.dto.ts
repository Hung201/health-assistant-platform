import { IsNotEmpty, IsOptional, IsString, MaxLength, IsIn } from 'class-validator';

export class CreatePostDto {
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  @IsString()
  @MaxLength(500)
  title: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsNotEmpty({ message: 'Nội dung không được để trống' })
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(30)
  @IsIn(['medical_article', 'announcement', 'case_study', 'health_tip'])
  postType: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['draft', 'pending_review'])
  status: 'draft' | 'pending_review';
}
