import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateLiveStreamDto {
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  @MaxLength(500)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;
}
