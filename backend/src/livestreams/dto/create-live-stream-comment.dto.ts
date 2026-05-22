import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateLiveStreamCommentDto {
  @IsNotEmpty({ message: 'Bình luận không được để trống' })
  @IsString()
  @MaxLength(500, { message: 'Bình luận tối đa 500 ký tự' })
  content: string;
}
