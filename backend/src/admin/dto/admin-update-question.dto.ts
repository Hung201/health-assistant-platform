import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AdminUpdateQuestionDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsString()
  answerContent?: string;
}
