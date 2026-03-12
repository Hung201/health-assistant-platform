import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DoctorProfile } from './doctor-profile.entity';
import { User } from './user.entity';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'author_user_id', type: 'uuid' })
  authorUserId: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  excerpt: string | null;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'thumbnail_url', type: 'text', nullable: true })
  thumbnailUrl: string | null;

  @Column({ name: 'post_type', type: 'varchar', length: 30, default: 'medical_article' })
  postType: string;

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status: string;

  @Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
  reviewedBy: string | null;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt: Date | null;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string | null;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @Column({ name: 'view_count', type: 'bigint', default: 0 })
  viewCount: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => DoctorProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_user_id' })
  author: DoctorProfile;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewed_by' })
  reviewer: User | null;
}
