import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('doctor_questions')
export class DoctorQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'patient_user_id', type: 'uuid' })
  patientUserId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_user_id' })
  patientUser: User;

  @Column({ name: 'doctor_user_id', type: 'uuid', nullable: true })
  doctorUserId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'doctor_user_id' })
  doctorUser: User | null;

  @Column({ type: 'varchar', length: 300 })
  title: string;

  @Column({ name: 'question_content', type: 'text' })
  questionContent: string;

  @Column({ name: 'answer_content', type: 'text', nullable: true })
  answerContent: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string | null;

  @Column({ type: 'varchar', length: 20, default: 'pending_review' })
  status: string;

  @Column({ name: 'answered_at', type: 'timestamptz', nullable: true })
  answeredAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
