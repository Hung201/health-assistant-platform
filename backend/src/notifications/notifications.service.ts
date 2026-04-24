import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Observable, Subject } from 'rxjs';

import { Notification } from '../entities/notification.entity';

export type NotificationPriority = 'low' | 'normal' | 'high';
export type NotificationFilter = 'all' | 'unread';

type NotificationEvent =
  | { type: 'notification.created'; notificationId: string }
  | { type: 'notification.read'; notificationId: string }
  | { type: 'notification.read_all' };

function toRow(n: Notification) {
  return {
    id: n.id,
    type: n.type,
    priority: n.priority,
    title: n.title,
    message: n.message,
    link: n.link,
    isRead: n.isRead,
    readAt: n.readAt ? n.readAt.toISOString() : null,
    metadata: n.metadata ?? {},
    createdAt: n.createdAt.toISOString(),
  };
}

@Injectable()
export class NotificationsService {
  private readonly streams = new Map<string, Subject<NotificationEvent>>();

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  private streamFor(userId: string): Subject<NotificationEvent> {
    let s = this.streams.get(userId);
    if (!s) {
      s = new Subject<NotificationEvent>();
      this.streams.set(userId, s);
    }
    return s;
  }

  private emit(userId: string, event: NotificationEvent) {
    this.streamFor(userId).next(event);
  }

  stream(userId: string): Observable<NotificationEvent> {
    return this.streamFor(userId).asObservable();
  }

  async createForUser(input: {
    userId: string;
    type: string;
    title: string;
    message: string;
    priority?: NotificationPriority;
    link?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    const row = await this.notificationRepo.save(
      this.notificationRepo.create({
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        priority: input.priority ?? 'normal',
        link: input.link ?? null,
        isRead: false,
        readAt: null,
        metadata: input.metadata ?? {},
      }),
    );
    this.emit(input.userId, { type: 'notification.created', notificationId: row.id });
    return toRow(row);
  }

  async listForUser(userId: string, filter: NotificationFilter, limit = 20, offset = 0) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safeOffset = Math.max(offset, 0);

    const qb = this.notificationRepo
      .createQueryBuilder('n')
      .where('n.user_id = :userId', { userId })
      .orderBy('n.created_at', 'DESC')
      .take(safeLimit)
      .skip(safeOffset);

    if (filter === 'unread') {
      qb.andWhere('n.is_read = false');
    }

    const [rows, total] = await qb.getManyAndCount();
    const unreadCount = await this.notificationRepo.count({
      where: { userId, isRead: false },
    });
    return {
      items: rows.map(toRow),
      total,
      unreadCount,
      filter,
      limit: safeLimit,
      offset: safeOffset,
    };
  }

  async markRead(userId: string, notificationId: string) {
    const row = await this.notificationRepo.findOne({
      where: { id: notificationId, userId },
    });
    if (!row) throw new NotFoundException('Không tìm thấy thông báo');
    if (!row.isRead) {
      row.isRead = true;
      row.readAt = new Date();
      await this.notificationRepo.save(row);
      this.emit(userId, { type: 'notification.read', notificationId: row.id });
    }
    return { ok: true, id: row.id, isRead: row.isRead };
  }

  async markAllRead(userId: string) {
    await this.notificationRepo
      .createQueryBuilder()
      .update(Notification)
      .set({
        isRead: true,
        readAt: () => 'NOW()',
      })
      .where('user_id = :userId', { userId })
      .andWhere('is_read = false')
      .execute();
    this.emit(userId, { type: 'notification.read_all' });
    return { ok: true };
  }
}
