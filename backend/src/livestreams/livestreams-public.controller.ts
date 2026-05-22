import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { CreateLiveStreamCommentDto } from './dto/create-live-stream-comment.dto';
import { LivestreamsService } from './livestreams.service';

@Controller('livestreams')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class LivestreamsPublicController {
  constructor(private readonly livestreamsService: LivestreamsService) {}

  @Public()
  @Get()
  listLive() {
    return this.livestreamsService.listPublicLive();
  }

  @Public()
  @Get(':id/comments')
  listComments(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('limit', new DefaultValuePipe(80), ParseIntPipe) limit: number,
  ) {
    return this.livestreamsService.listComments(id, limit);
  }

  @Post(':id/comments')
  addComment(
    @CurrentUser() user: User,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateLiveStreamCommentDto,
  ) {
    return this.livestreamsService.addComment(user, id, dto.content);
  }

  @Public()
  @Get(':id')
  join(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.livestreamsService.getPublicJoin(id);
  }
}
