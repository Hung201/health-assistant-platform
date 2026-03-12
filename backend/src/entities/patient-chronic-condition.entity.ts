import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PatientProfile } from './patient-profile.entity';
import { ChronicCondition } from './chronic-condition.entity';

@Entity('patient_chronic_conditions')
export class PatientChronicCondition {
  @PrimaryGeneratedColumn('bigint')
  id: number;

  @Column({ name: 'patient_user_id', type: 'uuid' })
  patientUserId: string;

  @Column({ name: 'condition_id', type: 'bigint' })
  conditionId: number;

  @Column({ name: 'diagnosed_at', type: 'date', nullable: true })
  diagnosedAt: Date | null;

  @Column({ name: 'severity_level', type: 'varchar', length: 20, nullable: true })
  severityLevel: string | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => PatientProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_user_id' })
  patient: PatientProfile;

  @ManyToOne(() => ChronicCondition, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'condition_id' })
  condition: ChronicCondition;
}
