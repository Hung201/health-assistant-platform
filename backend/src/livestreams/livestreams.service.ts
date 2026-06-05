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
import { LiveStreamComment } from '../entities/live-stream-comment.entity';
import { User } from '../entities/user.entity';
import { CreateLiveStreamDto } from './dto/create-live-stream.dto';
import { userMayLivestream } from '../common/user-feature-permissions';

const TOKEN_TTL = '6h';
const MAX_COMMENT_LENGTH = 500;

export type LiveStreamCommentRow = {
  id: string;
  content: string;
  createdAt: string;
  displayTime: string;
  displayDate: string | null;
  user: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
};

type LiveCommentDbRow = {
  id: string;
  content: string;
  created_at: Date | string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  display_time: string;
  display_date: string;
  is_today: boolean | string;
};

@Injectable()
export class LivestreamsService {
  constructor(
    @InjectRepository(LiveStream)
    private readonly liveStreamRepo: Repository<LiveStream>,
    @InjectRepository(LiveStreamComment)
    private readonly liveCommentRepo: Repository<LiveStreamComment>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
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

  private async assertDoctorMayLivestream(doctorUserId: string): Promise<void> {
    const u = await this.userRepo.findOne({
      where: { id: doctorUserId },
      select: ['id', 'status', 'featurePermissions'],
    });
    if (!u) throw new ForbiddenException('Không tìm thấy người dùng');
    if (u.status !== 'active') {
      throw new ForbiddenException('Tài khoản đã bị vô hiệu hoá.');
    }
    if (!userMayLivestream(u)) {
      throw new ForbiddenException(
        'Tài khoản chưa được cấp quyền phát trực tiếp. Vui lòng liên hệ quản trị viên để bật quyền Livestream.',
      );
    }
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
    await this.assertDoctorMayLivestream(user.id);
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
    await this.assertDoctorMayLivestream(user.id);
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
    await this.assertDoctorMayLivestream(user.id);
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

  private async getLiveStreamOrThrow(streamId: string): Promise<LiveStream> {
    const stream = await this.liveStreamRepo.findOne({ where: { id: streamId } });
    if (!stream) throw new NotFoundException('Không tìm thấy phiên livestream');
    return stream;
  }

  private assertStreamAcceptsComments(stream: LiveStream): void {
    if (stream.status !== 'live') {
      throw new BadRequestException('Chỉ bình luận khi buổi phát đang diễn ra');
    }
  }

  private mapCommentDbRow(row: LiveCommentDbRow): LiveStreamCommentRow {
    const createdAt =
      row.created_at instanceof Date ? row.created_at.toISOString() : new Date(row.created_at).toISOString();
    return {
      id: row.id,
      content: row.content,
      createdAt,
      displayTime: row.display_time,
      displayDate: row.is_today ? null : row.display_date,
      user: {
        id: row.user_id,
        fullName: row.full_name ?? 'Người xem',
        avatarUrl: row.avatar_url ?? null,
      },
    };
  }

  private commentSelectSql(): string {
    return `SELECT c.id, c.content, c.created_at,
      u.id AS user_id, u.full_name, u.avatar_url,
      to_char(c.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh', 'HH24:MI') AS display_time,
      to_char(c.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh', 'DD/MM/YYYY') AS display_date,
      ((c.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date = (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date) AS is_today`;
  }

  async listPublicLive(): Promise<
    Array<{
      id: string;
      title: string;
      doctorName: string;
      startedAt: string | null;
      commentCount: number;
    }>
  > {
    const rows = await this.liveStreamRepo
      .createQueryBuilder('s')
      .innerJoinAndSelect('s.doctor', 'doctor')
      .where('s.status = :status', { status: 'live' })
      .andWhere('doctor.status = :userStatus', { userStatus: 'active' })
      .orderBy('s.started_at', 'DESC')
      .getMany();
    const counts =
      rows.length > 0
        ? await this.liveCommentRepo
            .createQueryBuilder('c')
            .select('c.live_stream_id', 'streamId')
            .addSelect('COUNT(1)', 'cnt')
            .where('c.live_stream_id IN (:...ids)', { ids: rows.map((r) => r.id) })
            .andWhere('c.status = :status', { status: 'visible' })
            .groupBy('c.live_stream_id')
            .getRawMany<{ streamId: string; cnt: string }>()
        : [];
    const countByStream = new Map(counts.map((r) => [r.streamId, Number(r.cnt)]));
    return rows.map((s) => ({
      id: s.id,
      title: s.title,
      doctorName: s.doctor?.fullName ?? 'Bác sĩ',
      startedAt: s.startedAt ? s.startedAt.toISOString() : null,
      commentCount: countByStream.get(s.id) ?? 0,
    }));
  }

  async listComments(streamId: string, limit = 80): Promise<LiveStreamCommentRow[]> {
    const stream = await this.getLiveStreamOrThrow(streamId);
    this.assertStreamAcceptsComments(stream);
    const safeLimit = Math.min(Math.max(limit, 1), 200);
    const rows = await this.liveCommentRepo.query(
      `${this.commentSelectSql()}
       FROM live_stream_comments c
       INNER JOIN users u ON u.id = c.user_id
       WHERE c.live_stream_id = $1 AND c.status = 'visible'
       ORDER BY c.created_at ASC
       LIMIT $2`,
      [streamId, safeLimit],
    );
    return (rows as LiveCommentDbRow[]).map((r) => this.mapCommentDbRow(r));
  }

  async addComment(user: User, streamId: string, content: string): Promise<LiveStreamCommentRow> {
    const stream = await this.getLiveStreamOrThrow(streamId);
    this.assertStreamAcceptsComments(stream);
    const text = content.trim();
    if (!text) throw new BadRequestException('Nội dung bình luận không được rỗng');
    if (text.length > MAX_COMMENT_LENGTH) {
      throw new BadRequestException(`Bình luận tối đa ${MAX_COMMENT_LENGTH} ký tự`);
    }

    const rows = await this.liveCommentRepo.query(
      `INSERT INTO live_stream_comments (live_stream_id, user_id, content, status)
       VALUES ($1, $2, $3, 'visible')
       RETURNING id, content, created_at`,
      [streamId, user.id, text],
    );
    const inserted = rows[0] as { id: string };
    const detail = await this.liveCommentRepo.query(
      `${this.commentSelectSql()}
       FROM live_stream_comments c
       INNER JOIN users u ON u.id = c.user_id
       WHERE c.id = $1`,
      [inserted.id],
    );
    const row = detail[0] as LiveCommentDbRow | undefined;
    if (!row) throw new NotFoundException('Không lưu được bình luận');
    return this.mapCommentDbRow(row);
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
    if (stream.doctor?.status !== 'active') {
      throw new NotFoundException('Phiên phát không tồn tại hoặc đã kết thúc');
    }
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
