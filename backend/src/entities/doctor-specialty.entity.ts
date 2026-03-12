import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DoctorProfile } from './doctor-profile.entity';
import { Specialty } from './specialty.entity';

@Entity('doctor_specialties')
export class DoctorSpecialty {
  @PrimaryColumn({ name: 'doctor_user_id', type: 'uuid' })
  doctorUserId: string;

  @PrimaryColumn({ name: 'specialty_id', type: 'bigint' })
  specialtyId: number;

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => DoctorProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctor_user_id' })
  doctor: DoctorProfile;

  @ManyToOne(() => Specialty, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'specialty_id' })
  specialty: Specialty;
}
