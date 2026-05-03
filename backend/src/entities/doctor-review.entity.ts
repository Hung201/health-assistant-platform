import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Booking } from './booking.entity';
import { DoctorProfile } from './doctor-profile.entity';
import { User } from './user.entity';

@Entity('doctor_reviews')
export class DoctorReview {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'booking_id', type: 'uuid', unique: true })
  bookingId: string;

  @Column({ name: 'doctor_user_id', type: 'uuid' })
  doctorUserId: string;

  @Column({ name: 'patient_user_id', type: 'uuid' })
  patientUserId: string;

  @Column({ type: 'smallint' })
  rating: number;

  @Column({ name: 'bedside_manner', type: 'smallint', nullable: true })
  bedsideManner: number | null;

  @Column({ type: 'smallint', nullable: true })
  clarity: number | null;

  @Column({ name: 'wait_time', type: 'smallint', nullable: true })
  waitTime: number | null;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @Column({ name: 'is_anonymous', type: 'boolean', default: false })
  isAnonymous: boolean;

  @Column({ type: 'varchar', length: 20, default: 'published' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @ManyToOne(() => DoctorProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctor_user_id' })
  doctor: DoctorProfile;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_user_id' })
  patient: User;
}
