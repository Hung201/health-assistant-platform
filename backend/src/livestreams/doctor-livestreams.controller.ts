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
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DoctorGuard } from '../auth/guards/doctor.guard';
import { User } from '../entities/user.entity';
import { CreateLiveStreamDto } from './dto/create-live-stream.dto';
import { LivestreamsService } from './livestreams.service';

@Controller('doctor/livestreams')
@UseGuards(DoctorGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class DoctorLivestreamsController {
  constructor(private readonly livestreamsService: LivestreamsService) {}

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateLiveStreamDto) {
    return this.livestreamsService.createDraft(user, dto);
  }

  @Patch(':id/go-live')
  goLive(@CurrentUser() user: User, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.livestreamsService.goLive(user, id);
  }

  @Patch(':id/end')
  end(@CurrentUser() user: User, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.livestreamsService.endStream(user, id);
  }

  @Get('mine/list')
  mine(
    @CurrentUser() user: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.livestreamsService.listMine(user, page, limit);
  }

  @Get(':id/publisher-token')
  publisherToken(@CurrentUser() user: User, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.livestreamsService.mintPublisherTokenForDoctor(user, id);
  }
}
