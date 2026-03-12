import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { PatientProfile } from './patient-profile.entity';

@Entity('medical_profiles')
export class MedicalProfile {
  @PrimaryColumn({ name: 'patient_user_id', type: 'uuid' })
  patientUserId: string;

  @Column({ name: 'height_cm', type: 'decimal', precision: 5, scale: 2, nullable: true })
  heightCm: string | null;

  @Column({ name: 'weight_kg', type: 'decimal', precision: 5, scale: 2, nullable: true })
  weightKg: string | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  bmi: string | null;

  @Column({ type: 'text', nullable: true })
  allergies: string | null;

  @Column({ name: 'current_medications', type: 'text', nullable: true })
  currentMedications: string | null;

  @Column({ name: 'family_history', type: 'text', nullable: true })
  familyHistory: string | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => PatientProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_user_id' })
  patient: PatientProfile;
}
