import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  @MaxLength(300)
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Nội dung câu hỏi không được để trống' })
  @MaxLength(5000)
  content: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;
}
