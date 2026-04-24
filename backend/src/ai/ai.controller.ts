import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { AiService } from './ai.service';
import { AiChatDto } from './dto/ai-chat.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  chat(@CurrentUser() currentUser: User, @Body() dto: AiChatDto) {
    return this.aiService.chat(currentUser, dto);
  }

  @Get('sessions')
  getSessions(@CurrentUser() currentUser: User) {
    return this.aiService.getSessions(currentUser.id);
  }

  @Get('sessions/:id')
  getSessionMessages(@Param('id') id: string) {
    return this.aiService.getSessionMessages(id);
  }
}
