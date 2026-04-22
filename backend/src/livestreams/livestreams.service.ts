import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { AccessToken } from 'livekit-server-sdk';

import { LiveStream } from '../entities/live-stream.entity';
import { User } from '../entities/user.entity';
import { CreateLiveStreamDto } from './dto/create-live-stream.dto';

const TOKEN_TTL = '6h';

@Injectable()
export class LivestreamsService {
  constructor(
    @InjectRepository(LiveStream)
    private readonly liveStreamRepo: Repository<LiveStream>,
    private readonly config: ConfigService,
  ) {}

  private livekitConfig(): { url: string; apiKey: string; apiSecret: string } | null {
    const url = (this.config.get<string>('LIVEKIT_URL') ?? '').trim();
    const apiKey = (this.config.get<string>('LIVEKIT_API_KEY') ?? '').trim();
    const apiSecret = (this.config.get<string>('LIVEKIT_API_SECRET') ?? '').trim();
    if (!url || !apiKey || !apiSecret) return null;
    return { url, apiKey, apiSecret };
  }

  private requireLivekit(): { url: string; apiKey: string; apiSecret: string } {
    const c = this.livekitConfig();
    if (!c) {
      throw new ServiceUnavailableException(
        'Livestream chưa cấu hình: thiết lập LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET trên server.',
      );
    }
    return c;
  }

  private roomNameForNewStream(): string {
    return `ls-${randomUUID().replace(/-/g, '')}`;
  }

  private async assertNoOtherLive(doctorUserId: string, exceptId?: string): Promise<void> {
    const qb = this.liveStreamRepo
      .createQueryBuilder('s')
      .where('s.doctor_user_id = :doctorUserId', { doctorUserId })
      .andWhere('s.status = :status', { status: 'live' });
    if (exceptId) {
      qb.andWhere('s.id != :exceptId', { exceptId });
    }
    const n = await qb.getCount();
    if (n > 0) {
      throw new BadRequestException('Bạn đang có một phiên phát trực tiếp khác. Hãy kết thúc phiên đó trước.');
    }
  }

  async createDraft(user: User, dto: CreateLiveStreamDto): Promise<LiveStream> {
    const row = this.liveStreamRepo.create({
      doctorUserId: user.id,
      title: dto.title.trim(),
      description: dto.description?.trim() || null,
      status: 'scheduled',
      roomName: this.roomNameForNewStream(),
      startedAt: null,
      endedAt: null,
    });
    return this.liveStreamRepo.save(row);
  }

  async goLive(user: User, streamId: string): Promise<{ stream: LiveStream; serverUrl: string; token: string }> {
    const lk = this.requireLivekit();
    const stream = await this.liveStreamRepo.findOne({ where: { id: streamId } });
    if (!stream) throw new NotFoundException('Không tìm thấy phiên livestream');
    if (stream.doctorUserId !== user.id) throw new ForbiddenException('Không có quyền với phiên này');
    if (stream.status === 'live') {
      const token = await this.mintPublisherToken(lk, stream.roomName, user);
      return { stream, serverUrl: lk.url, token };
    }
    if (stream.status !== 'scheduled') {
      throw new BadRequestException('Phiên này không thể bắt đầu phát.');
    }
    await this.assertNoOtherLive(user.id);
    stream.status = 'live';
    stream.startedAt = new Date();
    stream.endedAt = null;
    await this.liveStreamRepo.save(stream);
    const token = await this.mintPublisherToken(lk, stream.roomName, user);
    return { stream, serverUrl: lk.url, token };
  }

  async endStream(user: User, streamId: string): Promise<LiveStream> {
    const stream = await this.liveStreamRepo.findOne({ where: { id: streamId } });
    if (!stream) throw new NotFoundException('Không tìm thấy phiên livestream');
    if (stream.doctorUserId !== user.id) throw new ForbiddenException('Không có quyền với phiên này');
    if (stream.status === 'ended' || stream.status === 'cancelled') return stream;
    stream.status = 'ended';
    stream.endedAt = new Date();
    return this.liveStreamRepo.save(stream);
  }

  async mintPublisherTokenForDoctor(user: User, streamId: string): Promise<{ serverUrl: string; token: string }> {
    const lk = this.requireLivekit();
    const stream = await this.liveStreamRepo.findOne({ where: { id: streamId } });
    if (!stream) throw new NotFoundException('Không tìm thấy phiên livestream');
    if (stream.doctorUserId !== user.id) throw new ForbiddenException('Không có quyền với phiên này');
    if (stream.status !== 'live') {
      throw new BadRequestException('Phiên chưa ở trạng thái đang phát.');
    }
    const token = await this.mintPublisherToken(lk, stream.roomName, user);
    return { serverUrl: lk.url, token };
  }

  private async mintPublisherToken(
    lk: { apiKey: string; apiSecret: string },
    roomName: string,
    user: User,
  ): Promise<string> {
    const at = new AccessToken(lk.apiKey, lk.apiSecret, {
      identity: `doc-${user.id}`,
      name: user.fullName ?? 'Bác sĩ',
      ttl: TOKEN_TTL,
    });
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
    });
    return at.toJwt();
  }

  private async mintViewerToken(lk: { apiKey: string; apiSecret: string }, roomName: string): Promise<string> {
    const at = new AccessToken(lk.apiKey, lk.apiSecret, {
      identity: `view-${randomUUID()}`,
      name: 'Khán giả',
      ttl: TOKEN_TTL,
    });
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: false,
      canSubscribe: true,
    });
    return at.toJwt();
  }

  async listPublicLive(): Promise<
    Array<{ id: string; title: string; doctorName: string; startedAt: string | null }>
  > {
    const rows = await this.liveStreamRepo.find({
      where: { status: 'live' },
      relations: ['doctor'],
      order: { startedAt: 'DESC' },
    });
    return rows.map((s) => ({
      id: s.id,
      title: s.title,
      doctorName: s.doctor?.fullName ?? 'Bác sĩ',
      startedAt: s.startedAt ? s.startedAt.toISOString() : null,
    }));
  }

  async getPublicJoin(streamId: string): Promise<{
    id: string;
    title: string;
    doctorName: string;
    serverUrl: string;
    token: string;
    startedAt: string | null;
  }> {
    const lk = this.requireLivekit();
    const stream = await this.liveStreamRepo.findOne({
      where: { id: streamId, status: 'live' },
      relations: ['doctor'],
    });
    if (!stream) throw new NotFoundException('Phiên phát không tồn tại hoặc đã kết thúc');
    const token = await this.mintViewerToken(lk, stream.roomName);
    return {
      id: stream.id,
      title: stream.title,
      doctorName: stream.doctor?.fullName ?? 'Bác sĩ',
      serverUrl: lk.url,
      token,
      startedAt: stream.startedAt ? stream.startedAt.toISOString() : null,
    };
  }

  async listMine(user: User, page = 1, limit = 20): Promise<{ items: LiveStream[]; total: number }> {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const safePage = Math.max(page, 1);
    const [items, total] = await this.liveStreamRepo.findAndCount({
      where: { doctorUserId: user.id },
      order: { createdAt: 'DESC' },
      take: safeLimit,
      skip: (safePage - 1) * safeLimit,
    });
    return { items, total };
  }
}
