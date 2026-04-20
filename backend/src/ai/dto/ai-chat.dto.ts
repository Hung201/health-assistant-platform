import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AiChatDto {
  @IsOptional()
  @IsString()
  session_id?: string;

  @IsString()
  @MaxLength(2000)
  message: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  user_location?: string | null;
}
