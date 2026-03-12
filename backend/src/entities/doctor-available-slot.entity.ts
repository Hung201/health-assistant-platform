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
import { Specialty } from './specialty.entity';

@Entity('doctor_available_slots')
export class DoctorAvailableSlot {
  @PrimaryGeneratedColumn('bigint')
  id: number;

  @Column({ name: 'doctor_user_id', type: 'uuid' })
  doctorUserId: string;

  @Column({ name: 'specialty_id', type: 'bigint', nullable: true })
  specialtyId: number | null;

  @Column({ name: 'slot_date', type: 'date' })
  slotDate: Date;

  @Column({ name: 'start_at', type: 'timestamptz' })
  startAt: Date;

  @Column({ name: 'end_at', type: 'timestamptz' })
  endAt: Date;

  @Column({ name: 'max_bookings', type: 'int', default: 1 })
  maxBookings: number;

  @Column({ name: 'booked_count', type: 'int', default: 0 })
  bookedCount: number;

  @Column({ type: 'varchar', length: 20, default: 'available' })
  status: string;

  @Column({ type: 'varchar', length: 20, default: 'manual' })
  source: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => DoctorProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctor_user_id' })
  doctor: DoctorProfile;

  @ManyToOne(() => Specialty, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'specialty_id' })
  specialty: Specialty | null;
}
