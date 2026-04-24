import {
  Controller,
  DefaultValuePipe,
  Get,
  MessageEvent,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Query,
  Sse,
} from '@nestjs/common';
import { Observable, interval, map, merge, of } from 'rxjs';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('me')
  listMyNotifications(
    @CurrentUser() user: User,
    @Query('filter', new DefaultValuePipe('all')) filterRaw: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    const filter = filterRaw === 'unread' ? 'unread' : 'all';
    return this.notificationsService.listForUser(user.id, filter, limit, offset);
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: User, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.notificationsService.markRead(user.id, id);
  }

  @Patch('me/read-all')
  markAllRead(@CurrentUser() user: User) {
    return this.notificationsService.markAllRead(user.id);
  }

  @Sse('stream')
  stream(@CurrentUser() user: User): Observable<MessageEvent> {
    const boot$ = of({
      type: 'boot',
      timestamp: new Date().toISOString(),
    }).pipe(
      map(
        (data): MessageEvent => ({
          type: 'notifications',
          data,
        }),
      ),
    );
    const event$ = this.notificationsService.stream(user.id).pipe(
      map(
        (data): MessageEvent => ({
          type: 'notifications',
          data,
        }),
      ),
    );
    const heartbeat$ = interval(25_000).pipe(
      map(
        (): MessageEvent => ({
          type: 'notifications',
          data: { type: 'heartbeat', timestamp: new Date().toISOString() },
        }),
      ),
    );
    return merge(boot$, event$, heartbeat$);
  }
}
