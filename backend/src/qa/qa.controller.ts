import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { AnswerQuestionDto } from './dto/answer-question.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { QaService } from './qa.service';

@Controller('qa')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class QaController {
  constructor(private readonly qaService: QaService) {}

  @Public()
  @Get('questions')
  listPublic(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('category') category?: string,
  ) {
    return this.qaService.listPublic(page, limit, category);
  }

  @Public()
  @Get('questions/:id')
  detailPublic(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.qaService.getPublicDetail(id);
  }

  @Post('questions')
  createQuestion(@CurrentUser() user: User, @Body() dto: CreateQuestionDto) {
    return this.qaService.createQuestion(user, {
      title: dto.title,
      content: dto.content,
      category: dto.category,
    });
  }

  @Get('doctor/inbox')
  listDoctorInbox(
    @CurrentUser() user: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: string,
  ) {
    return this.qaService.listDoctorInbox(user, page, limit, status);
  }

  @Patch('doctor/questions/:id/answer')
  answer(
    @CurrentUser() user: User,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AnswerQuestionDto,
  ) {
    return this.qaService.answerQuestion(user, id, dto.content);
  }
}
