import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { LiveStream } from './live-stream.entity';
import { User } from './user.entity';

@Entity('live_stream_comments')
export class LiveStreamComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'live_stream_id', type: 'uuid' })
  liveStreamId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 20, default: 'visible' })
  status: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => LiveStream, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'live_stream_id' })
  liveStream?: LiveStream;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;
}
