import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { LivestreamsService } from './livestreams.service';

@Controller('livestreams')
export class LivestreamsPublicController {
  constructor(private readonly livestreamsService: LivestreamsService) {}

  @Public()
  @Get()
  listLive() {
    return this.livestreamsService.listPublicLive();
  }

  @Public()
  @Get(':id')
  join(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.livestreamsService.getPublicJoin(id);
  }
}
