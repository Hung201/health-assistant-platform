import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ChatSession } from './chat-session.entity';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @ManyToOne(() => ChatSession, (s) => s.messages)
  @JoinColumn({ name: 'session_id' })
  session: ChatSession;

  @Column({ type: 'varchar', length: 20 })
  role: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'token_count', type: 'integer', nullable: true })
  tokenCount: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
