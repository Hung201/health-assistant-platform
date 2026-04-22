import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AnswerQuestionDto {
  @IsString()
  @IsNotEmpty({ message: 'Nội dung trả lời không được để trống' })
  @MaxLength(8000)
  content: string;
}
